# TransPilot Admin - Starter Kit

## Description
Application React simple pour gérer les chauffeurs d'une entreprise de transport.
Base connectée à Supabase (PostgreSQL) pour gérer les données.

## Installation

1. Cloner le projet
2. Installer les dépendances : `npm install`
3. Configurer Supabase :
   - Créer un projet sur https://supabase.com
   - Créer les tables (voir script SQL dans la doc)
   - Copier l'URL et la clé publique dans `src/supabaseClient.js`
4. Lancer le projet : `npm start`

## Stack technique

- React (create-react-app)
- TailwindCSS
- Supabase (authentification, base de données)
