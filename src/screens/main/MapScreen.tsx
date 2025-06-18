import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Platform, findNodeHandle, Modal } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Heatmap, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { config } from '../../config/config';
import haversine from 'haversine-distance';
import NYCDataService from '../../services/nycDataService';
import ReportModal from '../../components/ReportModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SpotlightTour from '../../components/SpotlightTour';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as FileSystem from 'expo-file-system';
// import { Asset } from 'expo-asset';

const GOOGLE_PLACES_API = 'https://maps.googleapis.com/maps/api/place';

// Polyline decoder (Google Encoded Polyline Algorithm Format)
function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  return points;
}

const ShimmerButton = ({ onPress, disabled, children }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1750,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [disabled]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <TouchableOpacity 
      style={[
        styles.routeButton,
        disabled && styles.routeButtonDisabled
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      {!disabled && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      <Text style={[
        styles.routeButtonText,
        disabled && styles.routeButtonTextDisabled
      ]}>{children}</Text>
    </TouchableOpacity>
  );
};

// Add icon mapping for report types
const reportIcons = {
  'Harassment / Catcalling': 'account-alert',
  'Broken Lights': 'lightbulb-off',
  'Transport Issue': 'bus-alert',
  'Unsafe Area': 'map-marker-alert',
  'Other': 'alert-circle'
};

// Add function to generate random coordinates within Brooklyn
const generateBrooklynCoordinates = () => {
  // Brooklyn boundaries (approximate)
  const minLat = 40.5700; // Southern Brooklyn
  const maxLat = 40.7390; // Northern Brooklyn
  const minLng = -74.0410; // Western Brooklyn
  const maxLng = -73.8550; // Eastern Brooklyn

  return {
    latitude: minLat + Math.random() * (maxLat - minLat),
    longitude: minLng + Math.random() * (maxLng - minLng)
  };
};

const MapLegend = () => (
  <View style={styles.mapLegend}>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#8000FF' }]} />
      <Text style={styles.legendText}>Travel Buddies</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#FFB800' }]} />
      <Text style={styles.legendText}>Safety Incidents</Text>
    </View>
  </View>
);

const MapScreen = ({ navigation }) => {
  const [region, setRegion] = useState(null); // Start as null
  const [currentLocation, setCurrentLocation] = useState(null); // { latitude, longitude }
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [mapKey, setMapKey] = useState(0);
  const [steps, setSteps] = useState([]); // Directions steps
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);
  const locationSubscription = useRef(null);
  const mapRef = useRef(null);
  const [safetyIncidents, setSafetyIncidents] = useState([]);
  const [travelBuddyMode, setTravelBuddyMode] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [reportedIncidents, setReportedIncidents] = useState([]);
  const [travelBuddies, setTravelBuddies] = useState(() => {
    // Generate 30 travel buddies spread throughout Brooklyn
    return Array.from({ length: 30 }, (_, index) => {
      const location = generateBrooklynCoordinates();
      const minutesAgo = Math.floor(Math.random() * 15); // Random time in last 15 minutes
      
      return {
        id: `buddy-${index + 1}`,
        location,
        lastUpdated: Date.now() - (minutesAgo * 60 * 1000)
      };
    });
  });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0); // Track current tour step
  const [userPhoneNumber, setUserPhoneNumber] = useState('');

  // Refs for spotlight targets
  const travelBuddyRef = useRef(null);
  const reportRef = useRef(null);
  const sosRef = useRef(null);

  const tourSteps = [
    {
      target: travelBuddyRef,
      title: 'Using Safest: Travel Buddy',
      description: 'Travel Buddy mode lets other users know you are open to Safety in numbers as you navigate, connecting a community.',
    },
    {
      target: reportRef,
      title: 'Using Safest: Report',
      description: 'Report any issues in real-time that impact safety - from catcalling to broken street lights - to make everyone safer.',
    },
    {
      target: sosRef,
      title: 'Using Safest: S.O.S',
      description: 'Safest will call you 24/7 to make sure you aren\'t alone during moments that feel off: We can dispatch the police to your location, let friends know where you are, or just talk -- either way, we\'ll stay on the line.',
    },
  ];

  useEffect(() => {
    (async () => {
      const hasSeenTour = await AsyncStorage.getItem('hasSeenSpotlightTour');
      if (!hasSeenTour) {
        setShowTour(true);
      }
    })();
  }, []);

  const handleTourComplete = async () => {
    setShowTour(false);
    await AsyncStorage.setItem('hasSeenSpotlightTour', 'true');
  };

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Add test reports on component mount
  useEffect(() => {
    const testReports = [
      {
        id: '1',
        category: 'Harassment / Catcalling',
        timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        location: {
          latitude: 40.682925 + 0.002,
          longitude: -73.944857 + 0.002
        },
        expiresAt: Date.now() + (22 * 60 * 60 * 1000) // 22 hours from now
      },
      {
        id: '2',
        category: 'Broken Lights',
        timestamp: Date.now() - (4 * 60 * 60 * 1000), // 4 hours ago
        location: {
          latitude: 40.682925 - 0.002,
          longitude: -73.944857 - 0.002
        },
        expiresAt: Date.now() + (20 * 60 * 60 * 1000) // 20 hours from now
      },
      {
        id: '3',
        category: 'Transport Issue',
        timestamp: Date.now() - (6 * 60 * 60 * 1000), // 6 hours ago
        location: {
          latitude: 40.682925 + 0.003,
          longitude: -73.944857 - 0.003
        },
        expiresAt: Date.now() + (18 * 60 * 60 * 1000) // 18 hours from now
      },
      {
        id: '4',
        category: 'Unsafe Area',
        timestamp: Date.now() - (8 * 60 * 60 * 1000), // 8 hours ago
        location: {
          latitude: 40.682925 - 0.003,
          longitude: -73.944857 + 0.003
        },
        expiresAt: Date.now() + (16 * 60 * 60 * 1000) // 16 hours from now
      },
      {
        id: '5',
        category: 'Other',
        timestamp: Date.now() - (10 * 60 * 60 * 1000), // 10 hours ago
        location: {
          latitude: 40.682925 + 0.004,
          longitude: -73.944857 + 0.004
        },
        expiresAt: Date.now() + (14 * 60 * 60 * 1000) // 14 hours from now
      }
    ];

    const categories = [
      'Harassment / Catcalling',
      'Broken Lights',
      'Transport Issue',
      'Unsafe Area',
      'Other'
    ];

    // Generate 50 additional reports
    const additionalReports = Array.from({ length: 50 }, (_, index) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const hoursAgo = Math.floor(Math.random() * 24); // Random time in last 24 hours
      const location = generateBrooklynCoordinates();
      
      return {
        id: `additional-${index + 1}`,
        category,
        timestamp: Date.now() - (hoursAgo * 60 * 60 * 1000),
        location,
        expiresAt: Date.now() + ((24 - hoursAgo) * 60 * 60 * 1000)
      };
    });

    // Combine with original test reports
    const allReports = [
      ...testReports,
      ...additionalReports
    ];

    setReportedIncidents(allReports);
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required for the map to work. Please enable it in Settings > Privacy > Location Services.'
        );
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const userRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        setRegion(userRegion); // Set region to user's location
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Could not get your current location.');
      }
    })();
  }, []);

  // Debounced fetch for suggestions
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const url = `${GOOGLE_PLACES_API}/autocomplete/json?input=${encodeURIComponent(query)}&key=${config.googleMaps.apiKey}&location=${region.latitude},${region.longitude}&radius=50000&components=country:us`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'OK') {
          setSuggestions(json.predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (e) {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceTimeout.current);
  }, [query, region]);

  // Fetch place details and update map
  const handleSuggestionPress = async (placeId, description) => {
    // Set loading state and message immediately
    setIsLoadingLocation(true);
    setLoadingMessage('Loading the safest route to this location...');
    
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectionComplete(true);
    }, 50);
    
    if (inputRef.current) inputRef.current.blur();
    
    try {
      const url = `${GOOGLE_PLACES_API}/details/json?place_id=${placeId}&key=${config.googleMaps.apiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        const loc = json.result.geometry.location;
        const newRegion = {
          latitude: loc.lat,
          longitude: loc.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setQuery(description);
        const newDestination = { lat: loc.lat, lng: loc.lng, description };
        setDestination(newDestination);

        // Fetch incidents for the region
        const fetchRegion = {
          ...newRegion,
          latitudeDelta: Math.max(newRegion.latitudeDelta, 0.1),
          longitudeDelta: Math.max(newRegion.longitudeDelta, 0.1)
        };
        const data = await NYCDataService.getInstance().getSafetyIncidents(fetchRegion);
        setSafetyIncidents(data);

        // Fetch route and set routeCoords immediately
        const origin = `${region.latitude},${region.longitude}`;
        const dest = `${loc.lat},${loc.lng}`;
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=walking&key=${config.googleMaps.apiKey}`;
        const directionsRes = await fetch(directionsUrl);
        const directionsJson = await directionsRes.json();
        if (directionsJson.status === 'OK' && directionsJson.routes.length > 0) {
          const route = directionsJson.routes[0];
          const polyline = route.overview_polyline.points;
          const coords = decodePolyline(polyline);
          
          if (coords.length > 0) {
            setRouteCoords(coords);
            setRoute(route);
            setSteps(route.legs[0].steps);
            setCurrentStepIndex(0);
            
            // Filter incidents based on the route polyline
            const thresholdKm = 0.5;
            const filtered = data.filter(inc =>
              coords.some(coord => getDistanceKm(coord, { latitude: inc.latitude, longitude: inc.longitude }) < thresholdKm)
            );
            setFilteredIncidents(filtered);
            
            // Zoom to fit the entire route and incidents
            if (mapRef.current && coords.length > 1) {
              const coordinates = [
                ...coords,
                ...filtered.map(inc => ({ latitude: inc.latitude, longitude: inc.longitude }))
              ];
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                animated: true,
              });
            }
          }
        }
      } else {
        Alert.alert('Error', 'Could not get location details.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get location details.');
    } finally {
      // Add a small delay before hiding the overlay to ensure smooth transition
      setTimeout(() => {
        setIsLoadingLocation(false);
        setLoadingMessage('');
      }, 500);
    }
  };

  // Unified filtering logic - only filter based on route polyline
  useEffect(() => {
    if (!routeCoords || routeCoords.length <= 1) {
      setFilteredIncidents([]);
      return;
    }

    const thresholdKm = 0.5;
    const filtered = safetyIncidents.filter(inc =>
      routeCoords.some(coord => getDistanceKm(coord, { latitude: inc.latitude, longitude: inc.longitude }) < thresholdKm)
    );
    setFilteredIncidents(filtered);
  }, [routeCoords, safetyIncidents]);

  // Fetch walking directions from current location to destination
  const handleGetDirections = async () => {
    if (!destination) return;
    setLoading(true);
    try {
      // Hard-coded origin: 251 Macon Street, Brooklyn NY 11216
      const origin = '40.682925,-73.944857';
      const dest = `${destination.lat},${destination.lng}`;
      // Alert.alert('Directions API call', `Origin: ${origin}\nDestination: ${dest}`);
      // console.log('Directions API call:', { origin, dest });
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=walking&key=${config.googleMaps.apiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK' && json.routes.length > 0) {
        setRoute(json.routes[0]);
        // Decode polyline and set routeCoords
        const polyline = json.routes[0].overview_polyline.points;
        const coords = decodePolyline(polyline);
        setTimeout(() => {
          setRouteCoords(coords);
          setMapKey(k => k + 1);
          setSteps(json.routes[0].legs[0].steps);
          setCurrentStepIndex(0);
          setNavigationActive(true);
          // Zoom to step 1
          const step1 = json.routes[0].legs[0].steps[0];
          if (step1 && step1.polyline && step1.polyline.points) {
            const step1Coords = decodePolyline(step1.polyline.points);
            setTimeout(() => {
              if (mapRef.current && step1Coords.length > 1) {
                mapRef.current.fitToCoordinates(step1Coords, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                });
              }
            }, 100);
          }
        }, 100);
      } else {
        Alert.alert('No route found', 'Could not find a walking route.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get directions.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation: track user location and update current step
  useEffect(() => {
    let isMounted = true;
    let subscription = null;
    async function subscribe() {
      if (!navigationActive || steps.length === 0) return;
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2 },
        (location) => {
          const { latitude, longitude } = location.coords;
          const nextStep = steps[currentStepIndex];
          if (!nextStep) return;
          const target = nextStep.end_location;
          const dist = haversine(
            { latitude, longitude },
            { latitude: target.lat, longitude: target.lng }
          );
          // If within 20 meters, advance to next step
          if (dist < 20 && currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(idx => idx + 1);
          }
        }
      );
      if (isMounted) locationSubscription.current = subscription;
    }
    subscribe();
    return () => {
      isMounted = false;
      if (locationSubscription.current && typeof locationSubscription.current.remove === 'function') {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [navigationActive, steps, currentStepIndex]);

  // Ensure map always zooms to fit the route when routeCoords changes
  useEffect(() => {
    if (mapRef.current && routeCoords.length > 1) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [routeCoords]);

  // Helper to get bounding box between two points
  function getBoundingBox(origin, destination, buffer = 0.02) { // Increased buffer to ~2.2km
    const minLat = Math.min(origin.latitude, destination.latitude) - buffer;
    const maxLat = Math.max(origin.latitude, destination.latitude) + buffer;
    const minLng = Math.min(origin.longitude, destination.longitude) - buffer;
    const maxLng = Math.max(origin.longitude, destination.longitude) + buffer;
    return { minLat, maxLat, minLng, maxLng };
  }

  // Helper to get distance in km between two lat/lng points
  function getDistanceKm(a, b) {
    return haversine(a, b) / 1000;
  }

  // Separate incidents by source for two heatmaps
  const callsIncidents = safetyIncidents.filter(inc => inc.type && (inc.type.length === 3 || inc.type.match(/^\d/)));
  const complaintsIncidents = safetyIncidents.filter(inc => inc.type && !(inc.type.length === 3 || inc.type.match(/^\d/)));

  // Grid clustering for incident circles
  function getGridKey(lat, lng, precision = 0.01) {
    return `${(Math.round(lat / precision) * precision).toFixed(4)},${(Math.round(lng / precision) * precision).toFixed(4)}`;
  }

  // Group incidents by grid cell
  const grid = {};
  safetyIncidents.forEach(inc => {
    const key = getGridKey(inc.latitude, inc.longitude);
    if (!grid[key]) grid[key] = [];
    grid[key].push(inc);
  });
  const gridCircles = Object.values(grid).map((cellIncidents: any[]) => {
    // Average position for the cell
    const lat = cellIncidents.reduce((sum, i) => sum + i.latitude, 0) / cellIncidents.length;
    const lng = cellIncidents.reduce((sum, i) => sum + i.longitude, 0) / cellIncidents.length;
    return {
      latitude: lat,
      longitude: lng,
      count: cellIncidents.length
    };
  });

  // Helper to get color based on count (simple red scale)
  function getCellColor(count, maxCount) {
    // Clamp count to [1, maxCount]
    const norm = Math.min(1, count / maxCount);
    // Interpolate from #fff0f0 (light) to #ff0000 (dark)
    const r = 255;
    const g = Math.round(240 - 240 * norm);
    const b = Math.round(240 - 240 * norm);
    return `rgba(${r},${g},${b},0.7)`;
  }

  // Find max count for color scaling
  const maxCellCount = Math.max(...Object.values(grid).map((cell: any[]) => cell.length), 1);

  // Render grid squares as polygons
  function getCellPolygon(lat, lng, precision = 0.01) {
    // Return the 4 corners of the square
    return [
      { latitude: lat, longitude: lng },
      { latitude: lat + precision, longitude: lng },
      { latitude: lat + precision, longitude: lng + precision },
      { latitude: lat, longitude: lng + precision },
    ];
  }

  const handleTravelBuddyPress = () => {
    if (travelBuddyMode) {
      Alert.alert(
        "Turn Off Travel Buddy Mode",
        "Would you like to turn off Travel Buddy Mode?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Turn Off",
            onPress: () => {
              setTravelBuddyMode(false);
              Alert.alert("Travel Buddy Mode Deactivated", "You're no longer in Travel Buddy Mode.");
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Travel Buddy Mode",
        "Would you like to turn on Travel Buddy Mode? This will help you connect with other users traveling in the same direction for safer journeys.",
        [
          {
            text: "Not Now",
            style: "cancel"
          },
          {
            text: "Turn On",
            onPress: () => {
              setTravelBuddyMode(true);
              Alert.alert(
                "Travel Buddy Mode Activated",
                "You're now in Travel Buddy Mode. When you search for a destination, we'll look for others heading the same way.",
                [{ text: "OK" }]
              );
            }
          }
        ]
      );
    }
  };

  const handleReportSubmit = (category: string) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      return;
    }

    const report = {
      id: Date.now().toString(),
      category,
      timestamp: Date.now(),
      location: currentLocation,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
    };

    setReportedIncidents(prev => [...prev, report]);
  };

  // Add cleanup effect for expired reports
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setReportedIncidents(prev => prev.filter(report => report.expiresAt > now));
    }, 3600000); // Check every hour

    return () => clearInterval(cleanupInterval);
  }, []);

  const toE164 = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    if (digits.startsWith('+' )) {
      return digits;
    }
    return '';
  };

  const handleSOSPress = async () => {
    try {
      // Check if user has completed setup
      let userPhoneNumber = await AsyncStorage.getItem('userPhoneNumber');
      if (!userPhoneNumber) {
        Alert.alert(
          'Setup Required',
          'Please complete the SOS setup first. Go through the spotlight tour to configure your phone number.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Setup Now', 
              onPress: () => {
                setShowTour(true);
                setTourStepIndex(0);
              }
            }
          ]
        );
        return;
      }
      // Always ensure E.164
      userPhoneNumber = toE164(userPhoneNumber);
      if (!userPhoneNumber) {
        Alert.alert('Invalid', 'Your phone number is not valid. Please re-enter it in setup.');
        setShowTour(true);
        setTourStepIndex(0);
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for S.O.S.');
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({});
      const logEntry = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      
      // Prepare payload
      const payload = {
        assistantId: 'f69fd8dc-b5bc-4b04-8112-f35c083f8c29',
        phoneNumberId: '43b08cdc-e9c4-4325-b6f2-32cf2b019c5c',
        customer: {
          number: userPhoneNumber
        }
      };
      console.log('SOS API payload:', payload);
      
      // Call Vapi API with user's phone number
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 09d8ee41-d507-4e39-ac64-8a878e4c7c6b',
        },
        body: JSON.stringify(payload),
      });
      
      const responseText = await response.text();
      console.log('SOS API response status:', response.status);
      console.log('SOS API response body:', responseText);
      
      if (!response.ok) {
        throw new Error('Server error: ' + response.status + '\n' + responseText);
      }
      
      Alert.alert('S.O.S: Safest is Calling You', 'An AI agent is calling you now to ensure your safety.');
    } catch (e) {
      console.error('Error:', e);
      Alert.alert('Error', 'Failed to trigger S.O.S call: ' + e.message);
    }
  };

  const handleCancelNavigation = () => {
    setNavigationActive(false);
    setSteps([]);
    setCurrentStepIndex(0);
    setRouteCoords([]);
  };

  // Add new useEffect to fetch route when destination changes
  useEffect(() => {
    if (!destination) return;

    const fetchRoute = async () => {
      try {
        const origin = `${region.latitude},${region.longitude}`;
        const dest = `${destination.lat},${destination.lng}`;
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=walking&key=${config.googleMaps.apiKey}`;
        const directionsRes = await fetch(directionsUrl);
        const directionsJson = await directionsRes.json();
        
        if (directionsJson.status === 'OK' && directionsJson.routes.length > 0) {
          const polyline = directionsJson.routes[0].overview_polyline.points;
          const coords = decodePolyline(polyline);
          setRouteCoords(coords);
          setRoute(directionsJson.routes[0]);
          setSteps(directionsJson.routes[0].legs[0].steps);
          setCurrentStepIndex(0);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    fetchRoute();
  }, [destination, region]);

  const handleTourStepChange = (stepIdx) => {
    setTourStepIndex(stepIdx);
  };

  // Load user's phone number from AsyncStorage
  useEffect(() => {
    const loadUserPhoneNumber = async () => {
      try {
        const phoneNumber = await AsyncStorage.getItem('userPhoneNumber');
        if (phoneNumber) {
          setUserPhoneNumber(phoneNumber);
        }
      } catch (error) {
        console.error('Error loading phone number:', error);
      }
    };
    loadUserPhoneNumber();
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LoadingOverlay 
        visible={isLoadingLocation} 
        message={loadingMessage}
      />
      <MapView
        ref={mapRef}
        key={mapKey}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You are here"
            pinColor="blue"
          />
        )}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.lat,
              longitude: destination.lng
            }}
            title={destination.description}
            pinColor="red"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#0000cc"
          />
        )}
        {filteredIncidents.map((incident, index) => (
          <Marker
            key={`${incident.id}-${index}`}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude
            }}
            title={incident.type}
            description={incident.description}
            pinColor="#ff0000"
            opacity={0.7}
          />
        ))}
        {reportedIncidents.map((report) => (
          <Marker
            key={report.id}
            coordinate={report.location}
            title={report.category}
            description={`Reported ${Math.round((Date.now() - report.timestamp) / (60 * 60 * 1000))} hours ago`}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons 
                name={reportIcons[report.category]} 
                size={18} 
                color="#FFB800" 
              />
            </View>
          </Marker>
        ))}
        {travelBuddies.map((buddy) => (
          <Marker
            key={buddy.id}
            coordinate={buddy.location}
            title="Travel Buddy"
            description={`Last seen ${Math.round((Date.now() - buddy.lastUpdated) / (60 * 1000))} minutes ago`}
          >
            <View style={[styles.markerContainer, styles.buddyMarker]}>
              <View style={styles.buddyDot} />
            </View>
          </Marker>
        ))}
      </MapView>

      <MapLegend />

      <View style={[
        styles.searchContainer,
        destination && styles.searchContainerBottom,
        isKeyboardVisible && destination && {
          bottom: keyboardHeight + 20,
        }
      ]}>
        {navigationActive && steps.length > 0 ? (
          <View style={styles.navigationTopBox}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCancelNavigation}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.navigationStepTitle}>Step {currentStepIndex + 1} of {steps.length}</Text>
            <Text style={styles.navigationStepInstruction}>{steps[currentStepIndex].html_instructions.replace(/<[^>]+>/g, '')}</Text>
            <Text style={styles.navigationStepDistance}>({steps[currentStepIndex].distance.text}, {steps[currentStepIndex].duration.text})</Text>
          </View>
        ) : (
          <>
            {!destination && <Text style={styles.welcomeText}>Welcome to Safest</Text>}
            <View style={styles.searchInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Where are you headed?"
                placeholderTextColor="#666"
                value={query}
                onChangeText={text => {
                  setQuery(text);
                  setSelectionComplete(false);
                }}
                onFocus={() => {
                  if (!selectionComplete && suggestions.length > 0) {
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={() => {
                    setQuery('');
                    setSelectionComplete(false);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {loading && <ActivityIndicator style={{ position: 'absolute', right: 16, top: 12 }} size="small" color="#0000cc" />}
            {showSuggestions && suggestions.length > 0 && !selectionComplete && (
              <FlatList
                style={styles.suggestionsList}
                data={suggestions}
                keyExtractor={item => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item.place_id, item.description)}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </>
        )}
        {!navigationActive && (
          <ShimmerButton 
            onPress={handleGetDirections}
            disabled={!destination}
          >
            Start Navigating
          </ShimmerButton>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            ref={travelBuddyRef}
            style={[
              styles.actionButton,
              showTour && tourStepIndex === 0 && styles.tourHighlight,
            ]}
            onPress={handleTravelBuddyPress}
          >
            <Text style={styles.actionButtonText}>Travel Buddy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            ref={reportRef}
            style={[
              styles.actionButton,
              styles.reportButton,
              showTour && tourStepIndex === 1 && styles.tourHighlight,
            ]}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={styles.actionButtonText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            ref={sosRef}
            style={[
              styles.actionButton,
              styles.sosButton,
              showTour && tourStepIndex === 2 && styles.tourHighlight,
            ]}
            onPress={handleSOSPress}
          >
            <Text style={styles.actionButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
      />

      <SpotlightTour
        steps={tourSteps}
        visible={showTour}
        onClose={handleTourComplete}
        onStepChange={handleTourStepChange}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  searchContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -100 }],
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  searchContainerBottom: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    top: 'auto',
    transform: [],
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  searchInputContainer: {
    position: 'relative',
    width: '100%',
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    width: '100%',
    textAlign: 'center',
    fontFamily: 'Courier',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  suggestionsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
  },
  routeButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  routeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  routeButtonTextDisabled: {
    color: '#fff',
  },
  navigationTopBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -2,
    right: 8,
    padding: 8,
    zIndex: 2,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  navigationStepTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0000cc',
    marginBottom: 2,
  },
  navigationStepInstruction: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  navigationStepDistance: {
    fontSize: 13,
    color: '#888',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0000cc',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Courier',
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#8000FF',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 100,
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: '#0000cc',
  },
  sosButton: {
    backgroundColor: '#ff0000',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeButton: {
    backgroundColor: '#006400', // Green color when active
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
    opacity: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 7.5,
    elevation: 4,
  },
  markerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFB800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buddyMarker: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 2,
    borderRadius: 6,
  },
  buddyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8000FF', // Purple for Travel Buddy icons
  },
  mapLegend: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: '#1a1a1a',
    padding: 6,
    borderRadius: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#fff',
    fontFamily: 'Courier',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  tourHighlight: {
    borderWidth: 3, // Reduced from 10 to 3
    borderColor: '#FFD600',
    borderRadius: 30,
    zIndex: 2,
  },
});

export default MapScreen;