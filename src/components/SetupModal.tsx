import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SetupModalProps {
  visible: boolean;
  onComplete: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ visible, onComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to check for 10 digits
  const isValidPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    return digits.length === 10;
  };

  const toE164 = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return '';
  };

  const handleComplete = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('Invalid', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const e164 = toE164(phoneNumber);
      await AsyncStorage.setItem('userPhoneNumber', e164);
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save your phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const buttonActive = isValidPhoneNumber(phoneNumber) && !loading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>📱 Setup Complete</Text>
              <Text style={styles.subtitle}>Enter your phone number to use SOS</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Your phone number</Text>
                <Text style={styles.sectionDescription}>
                  This number will be used when you trigger SOS
                </Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={14}
                  returnKeyType="done"
                />
              </View>
            </View>
          </ScrollView>
          <View style={styles.footerFixed}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                !buttonActive && styles.completeButtonDisabled
              ]}
              onPress={handleComplete}
              disabled={!buttonActive}
            >
              <Text style={styles.completeButtonText}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  footerFixed: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 15,
  },
  completeButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0056b3',
    minHeight: 50,
  },
  completeButtonDisabled: {
    backgroundColor: '#6c757d',
    borderColor: '#495057',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SetupModal; 