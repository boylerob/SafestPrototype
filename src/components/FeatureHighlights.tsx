import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface Feature {
  id: number;
  title: string;
  description: string;
  position: {
    top: number;
    left: number;
  };
  target: 'travelBuddy' | 'report' | 'sos';
}

const features: Feature[] = [
  {
    id: 1,
    title: "Travel Buddy",
    description: "Travel Buddy mode lets other users know you are open to Safety in numbers as you navigate, connecting a community.",
    position: {
      top: height * 0.6,
      left: width * 0.1,
    },
    target: 'travelBuddy',
  },
  {
    id: 2,
    title: "Report",
    description: "Report any issues in real-time that impact safety - from catcalling to broken street lights - to make everyone safer.",
    position: {
      top: height * 0.6,
      left: width * 0.4,
    },
    target: 'report',
  },
  {
    id: 3,
    title: "S.O.S",
    description: "S.O.S lets you get on the phone with Safest 24/7 to coordinate support as you need it -- and deal with those moments that feel off and uncertain with confidence.",
    position: {
      top: height * 0.6,
      left: width * 0.7,
    },
    target: 'sos',
  },
];

interface FeatureHighlightsProps {
  onComplete: () => void;
}

const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({ onComplete }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    showFeature();
  }, [currentFeature]);

  const showFeature = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = async () => {
    if (currentFeature < features.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentFeature(currentFeature + 1);
      });
    } else {
      await AsyncStorage.setItem('hasSeenFeatures', 'true');
      onComplete();
    }
  };

  const feature = features[currentFeature];

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <Animated.View
        style={[
          styles.bubble,
          {
            top: feature.position.top,
            left: feature.position.left,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.title}>{feature.title}</Text>
        <Text style={styles.description}>{feature.description}</Text>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentFeature === features.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
});

export default FeatureHighlights; 