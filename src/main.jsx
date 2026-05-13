import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import { HelmetProvider } from 'react-helmet-async';

// On récupère l'élément "root" de ton fichier index.html
const rootElement = document.getElementById('root');

// Petite sécurité : on vérifie que l'élément existe bien avant de lancer le site
if (!rootElement) {
  console.error("Erreur : L'élément avec l'id 'root' est introuvable dans index.html. Vérifie ton fichier HTML !");
} else {
  // Ce fichier fait le lien entre ton code React et ta page HTML
  ReactDOM.createRoot(rootElement).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
