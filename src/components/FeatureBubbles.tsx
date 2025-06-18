import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';

interface FeatureBubbleProps {
  onComplete: () => void;
  onStepChange?: (featureTitle: string | null) => void;
}

interface Feature {
  id: number;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    id: 1,
    title: 'Travel Buddy',
    description: 'Share your journey with trusted contacts. They can track your progress and ensure you arrive safely.',
    color: '#8e24aa', // purple
  },
  {
    id: 2,
    title: 'Report',
    description: 'Report safety concerns in your area. Help build a safer community by sharing your experiences.',
    color: '#0a3d91', // blue
  },
  {
    id: 3,
    title: 'S.O.S',
    description: 'One tap to alert emergency contacts and share your location. Quick access to help when you need it most.',
    color: '#d32f2f', // red
  },
];

const FeatureBubbles: React.FC<FeatureBubbleProps> = ({ onComplete, onStepChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  // Handle animations and step changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onStepChange) {
      onStepChange(features[currentIndex].title);
    }
    
    return () => {
      if (onStepChange) {
        onStepChange(null);
      }
    };
  }, [currentIndex]);

  const handleNext = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentIndex < features.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        if (onStepChange) onStepChange(null);
        onComplete();
      }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (onStepChange) {
        onStepChange(null);
      }
    };
  }, []);

  const currentFeature = features[currentIndex];

  const bubbleStyle: Animated.WithAnimatedValue<ViewStyle> = {
    ...styles.bubble,
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
    position: 'absolute',
    top: 610,
    left: '5%',
    right: '5%',
    marginHorizontal: 'auto',
  };

  // Split the title for color styling
  const titlePrefix = 'Using Safest: ';
  const titleFeature = currentFeature.title;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={bubbleStyle}>
        <Text style={styles.title}>
          {titlePrefix}
          <Text style={{ color: currentFeature.color }}>{titleFeature}</Text>
        </Text>
        <Text style={styles.description}>{currentFeature.description}</Text>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === features.length - 1 ? 'Got it!' : 'Next'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FeatureBubbles; 