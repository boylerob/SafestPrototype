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
        <View style={[styles.content, { backgroundColor: 'red' }]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  spinner: {
    width: 50,
    height: 50,
    marginBottom: 16,
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#0000cc',
    borderTopColor: 'transparent',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Courier',
  },
});

export default LoadingOverlay; 