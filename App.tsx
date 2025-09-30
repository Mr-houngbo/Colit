import 'react-native-gesture-handler'
import React from 'react'
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
import { RootStackParamList, MainTabParamList } from './types/navigation'

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
              options={{ title: 'Messages' }}
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

  if (loading) {
    return null // Or a loading screen
  }

  const initialRouteName = user ? 'Main' : 'Welcome'

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ColiSpace" component={ColiSpaceScreen} />
        <Stack.Screen name="AnnouncementDetails" component={AnnouncementDetailsScreen} />
        <Stack.Screen name="CreateAnnouncementChoice" component={CreateAnnouncementChoiceScreen} />
        <Stack.Screen name="CreateGPAnnouncement" component={CreateGPAnnouncementScreen} />
        <Stack.Screen name="CreateSenderAnnouncement" component={CreateSenderAnnouncementScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  )
}
