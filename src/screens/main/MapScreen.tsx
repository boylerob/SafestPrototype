import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { config } from '../../config/config';
import haversine from 'haversine-distance';

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

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 40.7128,  // Default to NYC
    longitude: -74.0060,
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
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
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
    setLoading(true);
    // Hide suggestions with a slight delay to ensure UI updates
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectionComplete(true);
      console.log('handleSuggestionPress: hiding suggestions');
    }, 50);
    if (inputRef.current) inputRef.current.blur();
    try {
      const url = `${GOOGLE_PLACES_API}/details/json?place_id=${placeId}&key=${config.googleMaps.apiKey}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        const loc = json.result.geometry.location;
        setRegion({
          latitude: loc.lat,
          longitude: loc.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setQuery(description);
        setDestination({ lat: loc.lat, lng: loc.lng, description });
      } else {
        Alert.alert('Error', 'Could not get location details.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not get location details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch walking directions from current location to destination
  const handleGetDirections = async () => {
    if (!destination) return;
    setLoading(true);
    try {
      if (!currentLocation) {
        Alert.alert('Error', 'Current location not available.');
        setLoading(false);
        return;
      }
      const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
      const dest = `${destination.lat},${destination.lng}`;
      console.log('Directions API call:', { origin, dest });
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {navigationActive && steps.length > 0 ? (
          <View style={styles.navigationTopBox}>
            <Text style={styles.navigationStepTitle}>Step {currentStepIndex + 1} of {steps.length}</Text>
            <Text style={styles.navigationStepInstruction}>{steps[currentStepIndex].html_instructions.replace(/<[^>]+>/g, '')}</Text>
            <Text style={styles.navigationStepDistance}>({steps[currentStepIndex].distance.text}, {steps[currentStepIndex].duration.text})</Text>
          </View>
        ) : (
          <>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search for a location"
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
                console.log('onFocus', { suggestionsLength: suggestions.length, showSuggestions, selectionComplete });
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
        {destination && !routeCoords.length && (
          <TouchableOpacity style={styles.routeButton} onPress={handleGetDirections}>
            <Text style={styles.routeButtonText}>Get the Safest walking route</Text>
          </TouchableOpacity>
        )}
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        ref={mapRef}
        key={mapKey}
      >
        {(() => {
          console.log('Polyline render check:', {
            routeCoordsLength: routeCoords.length,
            navigationActive
          });
          return routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#0000cc"
              strokeWidth={5}
            />
          );
        })()}
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Your Location"
          description="You are here"
        />
      </MapView>
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
    top: 20,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  searchInput: {
    height: 48,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginTop: 8,
    backgroundColor: '#0000cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
});

export default MapScreen; 