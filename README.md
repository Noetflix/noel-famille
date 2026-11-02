# Les souhaits de Noël de la famille

Petit site privé pour échanger les listes de souhaits entre 6 personnes.
HTML/CSS/JavaScript simples, sans build, hébergés sur GitHub Pages ; connexion et données sur Firebase (offre gratuite Spark).

- En ligne : du 4 novembre au 19 décembre 2026
- Specs : https://claude.ai/artifact/8aP6WWTETYaWYcKZNUpiNM

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique (balise `noindex`) |
| `css/style.css` | Thème Noël, animations |
| `js/app.js` | Connexion par PIN, onglets, ajout de souhaits, coches « Acheté » |
| `js/config.js` | **À remplir** : config Firebase, les 6 personnes (prénom, couleur, emoji), GIF |
| `firestore.rules` | Règles de sécurité Firestore (la matrice des droits) |

## Données

- `wishes/{id}` : un souhait — `owner` (e-mail), `title`, `details`, `link`, `price`, `priority` (1 Très envie, 2 Envie, 3 Si possible), `createdAt`, `updatedAt`.
- `gifts/{e-mail du destinataire}/bought/{id du souhait}` : une coche « Acheté » — `buyer`, `at`.
  Les coches sont rangées à part parce que Firestore ne sait pas cacher un champ d'un document : la règle interdit simplement au destinataire de lire *sa* collection `gifts`.

## Mise en route (≈ 20 min)

### 1. Firebase

1. https://console.firebase.google.com → **Ajouter un projet** (Google Analytics inutile). Rester sur l'offre **Spark**.
2. **Authentication** → Commencer → Méthode de connexion → activer **Adresse e-mail/Mot de passe**.
3. **Authentication → Paramètres → Actions utilisateur** : décocher **Activer la création (inscription)**. Sans ça, n'importe qui pourrait se créer un compte avec la clé publique (les règles le bloqueraient quand même, mais autant fermer la porte).
4. **Authentication → Utilisateurs → Ajouter un utilisateur**, 6 fois :
   e-mail technique (ex. `maman@noel-flix.fr`) + PIN à 6 chiffres comme mot de passe.
5. **Firestore Database** → Créer une base → mode **production**, région `eur3 (europe-west)`.
6. **Firestore → Règles** : coller le contenu de `firestore.rules`, en remplaçant la liste `members()` par les 6 e-mails, puis **Publier**.
7. **Paramètres du projet** (roue dentée) → Vos applications → icône **Web `</>`** → enregistrer l'appli (sans Hosting) → copier l'objet `firebaseConfig`.
8. **Authentication → Paramètres → Domaines autorisés** : ajouter `noetflix.github.io`.

### 2. Configuration du site

Dans `js/config.js` :

- coller la config Firebase dans `FIREBASE_CONFIG` ;
- remplir `MEMBERS` : mêmes e-mails que dans Firebase et `firestore.rules`, prénom, couleur, et un `emoji` si tu préfères à l'initiale. Garder `ink: '#24302A'` pour les couleurs claires (jaune) ;
- ajouter quelques adresses de GIF GIPHY dans `GIFS` (clic droit sur le GIF → *Copier l'adresse de l'image*).

### 3. GitHub Pages

Pousser sur `main`, puis dans le dépôt : **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
Le site est servi sur `https://noetflix.github.io/noel-famille/`.

### 4. Distribuer les PIN

À chaque personne, individuellement (SMS, en main propre). La session reste ouverte sur le téléphone jusqu'à « Se déconnecter ».

## Tester en local

```sh
python -m http.server 8000
```

puis http://localhost:8000 (`localhost` est autorisé par défaut dans Firebase). Ouvrir le site directement en `file://` ne marche pas, à cause des modules JavaScript.

## Administration

- **Changer un PIN** : la console ne permet pas de modifier un mot de passe directement (« Réinitialiser » envoie un e-mail, inutile avec une adresse inventée). Supprimer l'utilisateur dans Authentication, puis le recréer avec le même e-mail et le nouveau PIN : ses souhaits et ses coches restent, ils sont liés à l'e-mail.
- **Blocage après erreurs** : 5 PIN faux → 5 minutes de pause sur l'appareil ; Firebase bloque aussi de son côté les essais en série.

## Fermeture le 19 décembre 2026

Le site affiche « La hotte est fermée » automatiquement après le 19 décembre. Pour supprimer les données :

1. Firestore → supprimer les collections `wishes` et `gifts`.
2. Authentication → supprimer les 6 utilisateurs.
3. Ou plus simple : Paramètres du projet → **Supprimer le projet**.
4. Optionnel : désactiver GitHub Pages.
