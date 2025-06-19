import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    text: "Despite advances in AI across sectors like finance, transportation, and healthcare, safety technology has seen little innovation – leaving ",
    boldText: "1.2 billion urban women",
    textAfter: " with smartphones reliant on outdated, reactive tools that leave women feeling unsafe and vulnerable while traveling on a daily basis.",
  },
  {
    id: 2,
    title: "INTRODUCING Safest",
    text: "Safest is infrastructure for safety at scale. A world where every route is informed, every woman is empowered, and safety is collective.",
    subText: "What Waze does for driving time, Safest does for safely arriving.",
  },
  {
    id: 3,
    text: "This is our ",
    boldText: "NYC walking",
    textAfter: " prototype.\n\nIt uses AI and real-time data to design the safest walking routes, provides live risk alerts to communities, and gives women discreet but powerful tools tailored to how they naturally navigate and travel already; turning data into predictive safety guidance and arming women with life-saving technology.",
  },
];

interface WelcomeSlidesProps {
  onComplete: () => void;
}

const WelcomeSlides: React.FC<WelcomeSlidesProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = new Animated.Value(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Request location permissions on first slide
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        console.log('🔍 WelcomeSlides: Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 WelcomeSlides: Location permission status:', status);
        
        if (status === 'granted') {
          console.log('✅ WelcomeSlides: Location permission granted');
        } else {
          console.log('❌ WelcomeSlides: Location permission denied');
        }
      } catch (error) {
        console.log('❌ WelcomeSlides: Error requesting location permission:', error);
      }
    };

    requestLocationPermission();
  }, []);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      onComplete();
    }
  };

  const renderSlide = (slide: typeof slides[0], index: number) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
    });

    return (
      <Animated.View
        key={slide.id}
        style={[
          styles.slide,
          { opacity },
        ]}
      >
        {slide.title && (
          <Text style={styles.title}>{slide.title}</Text>
        )}
        {slide.boldText ? (
          <View style={styles.textContainer}>
            {slide.id === 3 ? (
              <Text style={styles.text}>
                This is our <Text style={styles.boldText}>NYC walking</Text> prototype.
                {'\n\n'}
                It uses AI and real-time data to design the safest walking routes, provides live risk alerts to communities, and gives women discreet but powerful tools tailored to how they naturally navigate and travel already; turning data into predictive safety guidance and arming women with life-saving technology.
              </Text>
            ) : (
              <>
                <Text style={styles.text}>{slide.text}</Text>
                <Text style={styles.boldText}>{slide.boldText}</Text>
                {slide.textAfter && (
                  <Text style={styles.text}>{slide.textAfter}</Text>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.textContainer}>
            <Text style={styles.text}>{slide.text}</Text>
            {slide.subText && (
              <Text style={styles.subText}>{slide.subText}</Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        ref={scrollViewRef}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    height: height * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  text: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    paddingHorizontal: 20,
  },
  boldText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#000',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
});

export default WelcomeSlides; 