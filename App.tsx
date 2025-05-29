import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import MapScreen from './src/screens/main/MapScreen';
import 'react-native-get-random-values';
// Only import fs if running in a Node.js environment (Cursor desktop)
let fs = null;
if (typeof require !== 'undefined' && Platform.OS === 'web') {
  try {
    fs = require('fs');
  } catch {}
}

function SOSFooterButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.sosFooterButton} onPress={onPress} accessibilityLabel="Discreet SOS emergency">
      <Text style={styles.sosFooterText}>S.O.S</Text>
    </TouchableOpacity>
  );
}

function withSOSFooter(Component) {
  return function WrappedComponent(props) {
    // Handler to log location and append to sos_log.json
    const handleSOS = async () => {
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
        Alert.alert('S.O.S Triggered', 'An AI agent is calling you now.');
      } catch (e) {
        console.error('Error:', e);
        Alert.alert('Error', 'Failed to trigger S.O.S call: ' + e.message);
      }
    };
    return (
      <View style={{ flex: 1 }}>
        <Component {...props} />
        <SOSFooterButton onPress={handleSOS} />
      </View>
    );
  };
}

function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Safest</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SafestDirections')}>
        <Text style={styles.buttonText}>Safest Directions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TravelBuddy')}>
        <Text style={styles.buttonText}>Travel Buddy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Reporting')}>
        <Text style={styles.buttonText}>Reporting</Text>
      </TouchableOpacity>
    </View>
  );
}

function SafestDirectionsScreen() {
  return <MapScreen />;
}
function TravelBuddyScreen() {
  return (
    <View style={styles.container}><Text style={styles.title}>Travel Buddy</Text></View>
  );
}
function SOSScreen() {
  return (
    <View style={styles.container}><Text style={styles.title}>S.O.S</Text></View>
  );
}
function ReportingScreen() {
  const [thankYou, setThankYou] = React.useState(false);
  const categories = [
    'Catcalling',
    'Broken Lights',
    'Transport Issue',
    'Unsafe Area',
    'Other',
  ];
  const handleReport = (category) => {
    const report = {
      category,
      timestamp: Date.now(),
    };
    console.log('Report submitted:', report);
    setThankYou(true);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report an Incident</Text>
      {thankYou ? (
        <Text style={styles.thankYou}>Thank you for sharing and making women safer</Text>
      ) : (
        <>
          <Text style={styles.prompt}>Select a category to report and help the community stay safe:</Text>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={styles.reportButton} onPress={() => handleReport(cat)}>
              <Text style={styles.reportButtonText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={withSOSFooter(LandingScreen)} options={{ headerShown: false }} />
        <Stack.Screen name="SafestDirections" component={withSOSFooter(SafestDirectionsScreen)} options={{ headerShown: true, title: 'Safest Directions' }} />
        <Stack.Screen name="TravelBuddy" component={withSOSFooter(TravelBuddyScreen)} options={{ headerShown: true, title: 'Travel Buddy' }} />
        <Stack.Screen name="SOS" component={withSOSFooter(SOSScreen)} options={{ headerShown: true, title: 'S.O.S' }} />
        <Stack.Screen name="Reporting" component={withSOSFooter(ReportingScreen)} options={{ headerShown: true, title: 'Reporting' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#0000cc',
    margin: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0000cc',
    marginBottom: 40,
    fontFamily: 'Courier',
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0000cc',
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 10,
    width: 260,
    alignItems: 'center',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  buttonText: {
    color: '#0000cc',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  sosFooterButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 30,
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sosFooterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
  },
  prompt: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Courier',
  },
  reportButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginVertical: 8,
    width: 240,
    alignItems: 'center',
    borderRadius: 0,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  reportButtonText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  thankYou: {
    fontSize: 20,
    color: '#388e3c',
    fontWeight: 'bold',
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Courier',
  },
}); 