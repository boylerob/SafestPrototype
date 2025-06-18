import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import SetupModal from './SetupModal';

const { width, height } = Dimensions.get('window');

interface Step {
  target: React.RefObject<View>;
  title: string;
  description: string;
}

interface SpotlightTourProps {
  steps: Step[];
  visible: boolean;
  onClose: () => void;
  onStepChange?: (stepIdx: number) => void;
}

const SpotlightTour: React.FC<SpotlightTourProps> = ({ steps, visible, onClose, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetLayout, setTargetLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  useEffect(() => {
    if (visible && steps[currentStep]?.target.current) {
      steps[currentStep].target.current?.measureInWindow((x, y, width, height) => {
        setTargetLayout({ x, y, width, height });
      });
    }
  }, [currentStep, visible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // After the last step (SOS button), show setup modal
      console.log('Setting up SOS - showing setup modal');
      setShowSetupModal(true);
    }
  };

  const handleSetupComplete = () => {
    console.log('Setup complete - closing modals');
    setShowSetupModal(false);
    onClose();
  };

  // Don't render the main tour modal if setup modal is showing
  if (!visible || !targetLayout) return null;

  return (
    <>
      {!showSetupModal && (
        <Modal transparent visible={visible} animationType="fade">
          <View style={styles.container}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
            
            {/* Spotlight outline */}
            <View
              style={[
                styles.spotlightContainer,
                {
                  top: targetLayout.y - 10,
                  left: targetLayout.x - 10,
                  width: targetLayout.width + 20,
                  height: targetLayout.height + 20,
                },
              ]}
            >
              <View style={styles.spotlightInner} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Using Safest: </Text>
                <Text style={styles.titleSuffix}>{steps[currentStep].title.replace('Using Safest: ', '')}</Text>
              </View>
              <Text style={styles.description}>{steps[currentStep].description}</Text>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>
                  {currentStep < steps.length - 1 ? 'Next' : 'Setup SOS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <SetupModal 
        visible={showSetupModal} 
        onComplete={handleSetupComplete}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  spotlightContainer: {
    position: 'absolute',
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 10,
    borderColor: '#FFD600',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  titlePrefix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  titleSuffix: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
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

export default SpotlightTour; 