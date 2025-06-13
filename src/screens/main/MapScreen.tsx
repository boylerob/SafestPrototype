import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Heatmap, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { config } from '../../config/config';
import haversine from 'haversine-distance';
import NYCDataService from '../../services/nycDataService';
import ReportModal from '../../components/ReportModal';
import LoadingOverlay from '../../components/LoadingOverlay';
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

const MapScreen = ({ navigation }) => {
  const [region, setRegion] = useState({
    latitude: 40.682925,  // 251 Macon Street, Brooklyn
    longitude: -73.944857,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
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
  // const [blockPolygons, setBlockPolygons] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for the map to work properly.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        // setRegion({
        //   latitude: location.coords.latitude,
        //   longitude: location.coords.longitude,
        //   latitudeDelta: 0.0922,
        //   longitudeDelta: 0.0421,
        // });
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
          const polyline = directionsJson.routes[0].overview_polyline.points;
          const coords = decodePolyline(polyline);
          setRouteCoords(coords);
          setRoute(directionsJson.routes[0]);
          setSteps(directionsJson.routes[0].legs[0].steps);
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
        // For now, just log the polyline
        console.log('Directions route:', json.routes[0]);
        setRoute(json.routes[0]);
        // Decode polyline and set routeCoords
        const polyline = json.routes[0].overview_polyline.points;
        console.log('Full route object:', JSON.stringify(json.routes[0], null, 2));
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
        if (!coords || coords.length === 0) {
          console.log('Polyline decode error:', polyline, coords);
        } else {
          console.log('Polyline decoded:', coords);
        }
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
    const report = {
      category,
      timestamp: Date.now(),
      location: currentLocation,
    };
    console.log('Report submitted:', report);
    // Here you would typically send the report to your backend
  };

  const handleSOSPress = async () => {
    try {
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
      console.log('S.O.S Location:', logEntry);
      
      // Call Vapi API
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 09d8ee41-d507-4e39-ac64-8a878e4c7c6b',
        },
        body: JSON.stringify({
          assistantId: 'f69fd8dc-b5bc-4b04-8112-f35c083f8c29',
          phoneNumberId: '43b08cdc-e9c4-4325-b6f2-32cf2b019c5c',
          customer: {
            number: '+19737181108'
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      
      const data = await response.json();
      console.log('Vapi API response:', data);
      Alert.alert('S.O.S Triggered', 'Safest support is calling you now');
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

  console.log('MapScreen render - isLoadingLocation:', isLoadingLocation);
  return (
    <View style={styles.container}>
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
      </MapView>

      <View style={[
        styles.searchContainer,
        destination && styles.searchContainerBottom
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
          <TouchableOpacity 
            style={[
              styles.routeButton,
              !destination && styles.routeButtonDisabled
            ]} 
            onPress={handleGetDirections}
            disabled={!destination}
          >
            <Text style={[
              styles.routeButtonText,
              !destination && styles.routeButtonTextDisabled
            ]}>Start Navigating</Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, travelBuddyMode && styles.activeButton]}
            onPress={handleTravelBuddyPress}
          >
            <Text style={styles.actionButtonText}>Travel Buddy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={styles.actionButtonText}>Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sosButton}
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
    </View>
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
    backgroundColor: '#0000cc',
    padding: 15,
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
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 100,
    alignItems: 'center',
  },
  sosButton: {
    backgroundColor: '#ff0000',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeButton: {
    backgroundColor: '#006400', // Green color
  },
});

export default MapScreen;