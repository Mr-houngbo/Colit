import React, { useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { AFRICAN_CITIES } from '../constants/cities'

interface CitySelectorProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: any
}

const CitySelector: React.FC<CitySelectorProps> = ({
  value,
  onChangeText,
  placeholder = 'Sélectionner une ville',
  style
}) => {
  const [showModal, setShowModal] = useState(false)

  const displayValue = value || placeholder
  const isPlaceholder = !value

  const handleSelectCity = (city: string) => {
    onChangeText(city)
    setShowModal(false)
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.selectorText, isPlaceholder && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une ville</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={AFRICAN_CITIES}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    value === item && styles.selectedCityItem
                  ]}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text style={[
                    styles.cityText,
                    value === item && styles.selectedCityText
                  ]}>
                    {item}
                  </Text>
                  {value === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.cityList}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#ccc',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCityItem: {
    backgroundColor: '#f0f8ff',
  },
  cityText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedCityText: {
    color: '#6C47FF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#6C47FF',
    fontWeight: 'bold',
  },
})

export { CitySelector }
export default CitySelector

// Alias pour compatibilité
export const CityAutocomplete = CitySelector
