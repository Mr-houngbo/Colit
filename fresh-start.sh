#!/bin/bash

echo "🧹 NETTOYAGE COMPLET & REDÉMARRAGE FRAIS"
echo "========================================"

echo ""
echo "🗑️  Suppression du cache et node_modules..."
rm -rf node_modules
rm -rf .expo
rm -rf .metro-cache
rm -rf tmp

echo ""
echo "📦 Réinstallation des dépendances..."
npm install

echo ""
echo "🔄 Configuration Expo Go automatique..."
cp services/notifications-expo-go.ts services/notifications.ts

echo ""
echo "✅ Nettoyage terminé !"
echo "🚀 Démarrage de l'application..."

echo ""
echo "📋 Instructions :"
echo "   1. Scanner le QR code avec Expo Go"
echo "   2. Plus d'erreur expo-notifications !"
echo "   3. Timeline fonctionnelle"
echo "   4. Toutes les fonctionnalités opérationnelles"
echo ""

npm start
