// Configuration du site — à compléter par rflix.
// Tout ce fichier est public (GitHub Pages) : n'y mets jamais de PIN.
// Pas d'« import » ici : le site n'a pas d'étape de build, Firebase est chargé par js/app.js.

// Console Firebase > Paramètres du projet > Vos applications > Configuration du SDK.
// Ces valeurs sont publiques par conception : la sécurité vient des règles Firestore.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAmhoGBS4_DLrwlSors2PeGbzlr4cm-7i0',
  authDomain: 'noel-famille-8b97b.firebaseapp.com',
  projectId: 'noel-famille-8b97b',
  storageBucket: 'noel-famille-8b97b.firebasestorage.app',
  messagingSenderId: '1022522772985',
  appId: '1:1022522772985:web:3d7fc1dc7b4a321dde0128',
};

// Les 6 comptes. L'e-mail doit être identique à celui créé dans Firebase Authentication
// ET à la liste members() de firestore.rules.
// - id : utilisé dans l'adresse des pages (lettres minuscules, sans espace)
// - color : couleur de la pastille ; ink : couleur du texte dessus (sombre si la couleur est claire)
// - emoji : facultatif, remplace l'initiale dans la pastille
export const MEMBERS = [
  { id: 'roro', name: 'roro', email: 'romain.flix@noel-flix.fr', color: '#D62839', ink: '#FFFFFF', admin: true },
  { id: 'papa', name: 'Papa', email: 'papa@noel-flix.fr', color: '#2B6F94', ink: '#FFFFFF' },
  { id: 'maman', name: 'Maman', email: 'maman@noel-flix.fr', color: '#F2B134', ink: '#24302A' },
  { id: 'max', name: 'Max', email: 'max@noel-flix.fr', color: '#6E4596', ink: '#FFFFFF' },
  { id: 'ana', name: 'Ana', email: 'ana@noel-flix.fr', color: '#C4621F', ink: '#FFFFFF' },
  { id: 'wiwi', name: 'Wiwi', email: 'wiwi@noel-flix.fr', color: '#2F7D4F', ink: '#FFFFFF' },
];

// GIF de Noël GIPHY (version 200 px de haut, légère sur mobile), tirés au hasard à chaque visite.
// Pour en ajouter : ouvrir le GIF sur giphy.com, l'identifiant est la fin de l'adresse.
const GIPHY_IDS = [
  '12a6i5J7ygIQve', '3o6fJdYXEvMa5ZmlI4', '4oEQINnYPSTBfJkxPI', '5dZYGvxrjfthsL9xdN',
  'GLbiGvv9qrpny', '13PANGsaPmVGQ8', 'K2l8gFcatHmsE', 'MrxXXBriEIKBO',
  'Nz6WNQZiYB5dK', 'RU1R9mhvlqfg4', 'VKwspRV2pafJu', 'WmkqburJqXziM',
  'l3vRdrQufHD93FTFK', 'HBMCmtsPEUShG', 'YUs6n8VA2X4PPCgSKt', 't0cJtM8YKIZRjzxGEb',
  'huWlf4Dde6R9K', 'ddxvmjX2LKvEykQyP6', '0pKnwwfCn9XYK6Ig4X', 'mptwTkpgpPyLvJZLTp',
];
export const GIFS = GIPHY_IDS.map((id) => `https://media.giphy.com/media/${id}/200.gif`);

// Après cette date, le site affiche « fermé » (les données sont à supprimer à la main, voir README).
export const CLOSE_DATE = '2026-12-19';
