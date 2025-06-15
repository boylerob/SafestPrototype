import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Loading...' }) => {
  console.log('LoadingOverlay render - visible:', visible, 'message:', message);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('LoadingOverlay useEffect - visible changed to:', visible);
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      console.log('LoadingOverlay animation completed - visible:', visible);
    });
  }, [visible, opacity]);

  useEffect(() => {
    console.log('LoadingOverlay starting spin animation');
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) {
    console.log('LoadingOverlay not visible, returning null');
    return null;
  }

  console.log('LoadingOverlay rendering with visible:', visible);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <BlurView intensity={40} style={styles.blurContainer}>
        <View style={styles.content}>
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerInner} />
          </Animated.View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 240,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spinner: {
    width: 40,
    height: 40,
    marginBottom: 20,
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
  },
  message: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
});

export default LoadingOverlay; 