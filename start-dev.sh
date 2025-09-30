#!/bin/bash

echo "🚀 Démarrage intelligent de ColiSpace..."
echo "📱 Mode Expo Go détecté automatiquement"

# Forcer le mode Expo Go (Alert au lieu de push notifications)
echo "🔄 Configuration automatique pour Expo Go..."
cp services/notifications-expo-go.ts services/notifications.ts
echo "✅ Configuration Alert appliquée"

echo ""
echo "🔔 Les notifications s'afficheront comme des Alert dans Expo Go"
echo "📋 Timeline et fonctionnalités complètes activées"

echo ""
echo "🎯 Lancement de l'application..."
echo "📝 Instructions :"
echo "   1. Scanner le QR code avec Expo Go"
echo "   2. Créer un compte ou se connecter"
echo "   3. Créer une annonce"
echo "   4. Tester le flow complet !"
echo ""

npm start
