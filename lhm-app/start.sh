#!/bin/bash
echo "🚀 Démarrage LHM Madagascar – Gestion Intégrée"
echo "================================================"

# Backend
echo "📡 Démarrage du backend sur http://localhost:5000..."
cd backend && npm install --silent && npm start &
BACKEND_PID=$!

sleep 2

# Frontend
echo "🌐 Démarrage du frontend sur http://localhost:3000..."
cd ../frontend && npm install --silent && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application démarrée!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "   Connexion: admin@lhm-madagascar.org / Admin@1234"
echo ""
echo "Ctrl+C pour arrêter..."

wait $BACKEND_PID $FRONTEND_PID
