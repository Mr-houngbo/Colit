#!/bin/bash

echo "🚀 Démarrage de ColiSpace..."

# Vérifier si les dépendances sont installées
if ! npm list expo-notifications > /dev/null 2>&1; then
    echo "📦 Installation des dépendances manquantes..."
    npm install expo-notifications
fi

# Démarrer l'application
echo "🎯 Lancement de l'application..."
npm start
