import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

interface DatePickerProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: any
  placeholderTextColor?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChangeText,
  placeholder = 'Sélectionner une date',
  style,
  placeholderTextColor = '#666'
}) => {
  const [show, setShow] = useState(false)
  const [date, setDate] = useState(value ? new Date(value) : new Date())

  // Sync internal state with external value
  useEffect(() => {
    if (value) {
      setDate(new Date(value))
    }
  }, [value])

  const onChange = (event: any, selectedDate?: Date) => {
    // Always hide picker after selection on both platforms
    setShow(false)
    if (selectedDate) {
      setDate(selectedDate)
      const formattedDate = selectedDate.toISOString().split('T')[0] // YYYY-MM-DD
      onChangeText(formattedDate)
    }
  }

  const showDatepicker = () => {
    setShow(true)
  }

  const displayValue = value ? new Date(value).toLocaleDateString('fr-FR') : placeholder
  const isPlaceholder = !value

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.input, style]}
        onPress={showDatepicker}
      >
        <Text style={[styles.inputText, isPlaceholder && { color: placeholderTextColor }]}>
          {displayValue}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  )
}

interface TimePickerProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: any
  placeholderTextColor?: string
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChangeText,
  placeholder = 'Sélectionner une heure',
  style,
  placeholderTextColor = '#666'
}) => {
  const [show, setShow] = useState(false)
  const [time, setTime] = useState(() => {
    if (value) {
      const [hours, minutes] = value.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date
    }
    return new Date()
  })

  // Sync internal state with external value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      setTime(date)
    }
  }, [value])

  const onChange = (event: any, selectedTime?: Date) => {
    // Always hide picker after selection on both platforms
    setShow(false)
    if (selectedTime) {
      setTime(selectedTime)
      const hours = selectedTime.getHours().toString().padStart(2, '0')
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0')
      const formattedTime = `${hours}:${minutes}`
      onChangeText(formattedTime)
    }
  }

  const showTimepicker = () => {
    setShow(true)
  }

  const displayValue = value || placeholder
  const isPlaceholder = !value

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.input, style]}
        onPress={showTimepicker}
      >
        <Text style={[styles.inputText, isPlaceholder && { color: placeholderTextColor }]}>
          {displayValue}
        </Text>
        <Text style={styles.icon}>🕐</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          testID="timePicker"
          value={time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
  inputText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginLeft: 8,
  },
})
