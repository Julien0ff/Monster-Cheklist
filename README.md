# 🔋 MONSTER TECHNIST | Division Protocol

![Version](https://img.shields.io/badge/Version-1.0.0-00FF41?style=for-the-badge&logo=appveyor)
![React Native](https://img.shields.io/badge/React_Native-0.81-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-white?style=for-the-badge&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-green?style=for-the-badge&logo=supabase)

**Monster Technist** n'est pas une simple application de checklist. C'est l'outil ultime de la **Division Technist** pour l'archivage, l'analyse et le partage de votre collection d'agents énergétiques (Monster Energy).

---

## 🚀 Fonctionnalités Clés

- **🗂️ Archivage Cloud** : Synchronisation en temps réel de votre collection via Supabase.
- **🆔 Système Social d'Élite** : Ajoutez des amis via leur **Code Agent** unique et surveillez les stats de votre division.
- **🤖 Intelligence Artificielle** : Analyse complète des monstres via l'IA Groq (Histoires, saveurs, anecdotes).
- **🎯 Scan Rapide** : Moteur de scan optimisé pour les codes-barres.
- **🧬 UI Cyber-Tech** : Interface premium inspirée de l'esthétique cyberpunk et Matrix.

## 🛠️ Stack Technique

- **Frontend** : React Native (Expo SDK 54)
- **Navigation** : Expo Router (Structure Flat pour stabilité maximale)
- **State Management** : Zustand
- **Backend** : Supabase (Auth, Database, Real-time)
- **IA** : API Groq (Modèle LLaMA 3 70B)
- **UI** : Lucide Icons & Custom Cyber-Aesthetics

## ⚙️ Installation & Déploiement

### Pré-requis
- Node.js & npm
- Un compte [Supabase](https://supabase.com)
- Une clé API [Groq](https://console.groq.com)

### Lancement Local
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/Julien0ff/Monster-Cheklist.git
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez votre `.env` à la racine :
   ```env
   EXPO_PUBLIC_SUPABASE_URL=ton_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=ta_cle_anon
   EXPO_PUBLIC_GROQ_API_KEY=ta_cle_groq
   ```
4. Lancez le projet :
   ```bash
   npx expo start
   ```

---

## 🌐 Landing Page & Distribution

L'application est distribuée via une [Landing Page dédiée](https://julien0ff.github.io/Monster-Cheklist/).
- **Android** : Téléchargement automatique du dernier APK via l'API GitHub.
- **iOS** : Accès direct via Expo Go.

---

## 📜 Licence

Projet développé pour la **Division Technist**. Utilisation réservée aux agents autorisés.
© 2026 Julien0ff
