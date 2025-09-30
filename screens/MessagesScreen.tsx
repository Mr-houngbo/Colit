import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { ColiSpace } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const MessagesScreen: React.FC = () => {
  const [coliSpaces, setColiSpaces] = useState<ColiSpace[]>([])
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigation = useNavigation()

  useEffect(() => {
    fetchColiSpaces()
  }, [])

  const fetchColiSpaces = async () => {
    const { data, error } = await supabase
      .from('coli_spaces')
      .select('*')
      .or(`sender_id.eq.${user!.id},gp_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
    if (error) console.error(error)
    else setColiSpaces(data || [])
  }

  const renderItem = ({ item }: { item: ColiSpace }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9' }]}
      onPress={() => navigation.navigate('ColiSpace', { coliSpaceId: item.id })}
    >
      <Text style={[styles.title, { color: theme === 'dark' ? '#fff' : '#000' }]}>
        Espace Coli #{item.id}
      </Text>
      <Text style={[styles.status, { color: '#6C47FF' }]}>Status: {item.status}</Text>
    </TouchableOpacity>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#121212' : '#fff',
      padding: 10,
    },
    item: {
      padding: 15,
      marginBottom: 10,
      borderRadius: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    status: {
      fontSize: 14,
      marginTop: 5,
    },
  })

  return (
    <View style={styles.container}>
      <FlatList
        data={coliSpaces}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  )
}

export default MessagesScreen
