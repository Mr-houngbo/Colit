import 'react-native-gesture-handler'
import React, { useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import WelcomeScreen from './screens/WelcomeScreen'
import AuthScreen from './screens/AuthScreen'
import AnnouncementsScreen from './screens/AnnouncementsScreen'
import CreateAnnouncementChoiceScreen from './screens/CreateAnnouncementChoiceScreen'
import CreateGPAnnouncementScreen from './screens/CreateGPAnnouncementScreen'
import CreateSenderAnnouncementScreen from './screens/CreateSenderAnnouncementScreen'
import MessagesScreen from './screens/MessagesScreen'
import ProfileScreen from './screens/ProfileScreen'
import ColiSpaceScreen from './screens/ColiSpaceScreen'
import AnnouncementDetailsScreen from './screens/AnnouncementDetailsScreen'
import ReceiverInfoScreen from './screens/ReceiverInfoScreen'
import { RootStackParamList, MainTabParamList } from './types/navigation'
import { requestNotificationPermissions } from './services/notifications'
const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: any

                if (route.name === 'Announcements') {
                  iconName = focused ? 'home' : 'home-outline'
                } else if (route.name === 'Publish') {
                  iconName = focused ? 'add-circle' : 'add-circle-outline'
                } else if (route.name === 'Messages') {
                  iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
                } else if (route.name === 'Profile') {
                  iconName = focused ? 'person' : 'person-outline'
                }

                return <Ionicons name={iconName} size={size} color={color} />
              },
              tabBarActiveTintColor: '#6C47FF',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#1a1a1a',
                borderTopColor: '#6C47FF',
                borderTopWidth: 1,
                paddingBottom: insets.bottom, // Ajoute le padding pour les boutons système
                height: 60 + insets.bottom, // Hauteur ajustée + safe area
                paddingTop: 8,
              },
            })}
          >
            <Tab.Screen
              name="Announcements"
              component={AnnouncementsScreen}
              options={{ title: 'Accueil' }}
            />
            <Tab.Screen
              name="Publish"
              component={CreateAnnouncementChoiceScreen}
              options={{ title: 'Publier' }}
            />
            <Tab.Screen
              name="Messages"
              component={MessagesScreen}
              options={{ title: 'Espaces Coli' }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profil' }}
            />
          </Tab.Navigator>
  )
}

function AppNavigator() {
  const { user, loading } = useAuth()
  const navigationRef = useRef<any>(null)

  // Handle navigation when user state changes
  useEffect(() => {
    if (!loading && navigationRef.current) {
      if (!user) {
        // User logged out, navigate to Welcome screen
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        })
      }
    }
  }, [user, loading])

  if (loading) {
    return null // Or a loading screen
  }

  const initialRouteName = user ? 'Main' : 'Welcome'

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ColiSpace" component={ColiSpaceScreen} />
        <Stack.Screen name="AnnouncementDetails" component={AnnouncementDetailsScreen} />
        <Stack.Screen name="ReceiverInfo" component={ReceiverInfoScreen} />
        <Stack.Screen name="CreateAnnouncementChoice" component={CreateAnnouncementChoiceScreen} />
        <Stack.Screen name="CreateGPAnnouncement" component={CreateGPAnnouncementScreen} />
        <Stack.Screen name="CreateSenderAnnouncement" component={CreateSenderAnnouncementScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  )
}

export default function App() {
  useEffect(() => {
    // Initialize notifications on app start
    requestNotificationPermissions()
  }, [])

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  )
}
