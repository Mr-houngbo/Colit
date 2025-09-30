#!/bin/bash

echo "🔄 Configuration des notifications pour ColiSpace..."

read -p "Utiliser Expo Go (Alert) ou Development Build (Push) ? (expo/dev): " choice

if [ "$choice" = "expo" ] || [ "$choice" = "Expo" ]; then
    echo "📱 Mode Expo Go activé - Utilisation des Alert"
    cp services/notifications-expo-go.ts services/notifications.ts
    echo "✅ Configuration Expo Go appliquée"
elif [ "$choice" = "dev" ] || [ "$choice" = "Dev" ]; then
    echo "🚀 Mode Development Build activé - Notifications Push"
    # Restaurer le fichier original
    git checkout services/notifications.ts 2>/dev/null || echo "Fichier notifications.ts original introuvable"
    echo "✅ Configuration Development Build appliquée"
else
    echo "❌ Choix invalide. Utilisez 'expo' ou 'dev'"
    exit 1
fi

echo ""
echo "🎯 Démarrage de l'application..."
npm start
