import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: string) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onSubmit }) => {
  const [thankYou, setThankYou] = useState(false);
  const categories = [
    { name: 'Harassment / Catcalling', icon: 'account-alert' },
    { name: 'Broken Lights', icon: 'lightbulb-off' },
    { name: 'Transport Issue', icon: 'bus-alert' },
    { name: 'Unsafe Area', icon: 'map-marker-alert' },
    { name: 'Other', icon: 'alert-circle' },
  ];

  const handleReport = (category: string) => {
    onSubmit(category);
    setThankYou(true);
    setTimeout(() => {
      setThankYou(false);
      onClose();
    }, 3000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {thankYou ? (
            <>
              <Text style={styles.thankYouTitle}>Safety Issue Reported</Text>
              <Text style={styles.thankYou}>Thank you for sharing. We will let the community know and adjust Safest routes accordingly!</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Community Safety</Text>
              <Text style={styles.prompt}>Select a category to report and help the community stay safe:</Text>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.name} 
                  style={styles.reportButton} 
                  onPress={() => handleReport(cat.name)}
                >
                  <View style={styles.buttonContent}>
                    <MaterialCommunityIcons name={cat.icon} size={24} color="#FFB800" style={styles.icon} />
                    <Text style={styles.reportButtonText}>{cat.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0000cc',
    marginBottom: 20,
    fontFamily: 'Courier',
  },
  prompt: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Courier',
  },
  reportButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Courier',
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0000cc',
    marginBottom: 10,
    fontFamily: 'Courier',
  },
  thankYou: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Courier',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
});

export default ReportModal; 