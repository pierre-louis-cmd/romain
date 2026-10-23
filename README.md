# Sac'pré — site web

Site vitrine et parcours de réservation de **Sac'pré**, « sac tout prêt pour la randonnée » : location de matériel de randonnée prêt à l'emploi et préparation d'itinéraires adaptés au niveau de chaque randonneur.

Site statique (HTML, CSS, JavaScript), sans dépendance ni étape de compilation.

## Pages

| Page | Fichier | Contenu |
| --- | --- | --- |
| Accueil | `index.html` | Accroche, fonctionnement en 4 étapes, services, le sac tout prêt, le Vercors, FAQ |
| Destinations | `destinations.html` | Choix du lieu de randonnée. Seul le Vercors est cliquable, les autres massifs sont « bientôt disponibles » (lien « Être prévenu ») |
| Location de matériel | `location.html` | Contenu du sac (code couleur des pochettes), packs, matériel à la carte, déroulé, FAQ |
| Itinéraires sur mesure | `itineraires.html` | Formules (road-book, sur mesure, guide), randonnée accompagnée, grille de niveaux, itinéraires du Vercors filtrables |
| Préparer ma rando | `reserver.html` | Parcours de réservation en 5 étapes (voir ci-dessous) |
| Contact | `contact.html` | Formulaire de contact |
| Mentions légales | `mentions-legales.html` | Modèle à compléter (éditeur, hébergeur, données personnelles, conditions de location) |

### Parcours de réservation

1. **Destination** : choix du massif (Vercors uniquement pour l'instant).
2. **Groupe** : date, durée, hébergement (gîte ou bivouac), nombre d'adultes et d'enfants, prénom, âge et niveau de chaque participant, envies et contraintes.
3. **Itinéraire** : calcul du niveau du groupe (celui du participant le moins expérimenté, plafonné selon l'âge des enfants), choix de la formule de préparation et des itinéraires adaptés. Les itinéraires inadaptés sont affichés à part avec la raison.
4. **Matériel** : pack « sac tout prêt » conseillé selon la durée et l'hébergement, options par personne (taille, chaussures, bâtons), matériel de groupe présélectionné (tentes, réchaud, porte-bébé…), mode de retrait.
5. **Récapitulatif** : résumé modifiable, estimation du tarif, coordonnées, envoi de la demande.

La saisie est conservée dans le navigateur : un rechargement de la page ne fait rien perdre.

## Voir le site en local

Ouvrir `index.html` dans un navigateur suffit. Pour un rendu identique à la mise en ligne :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Modifier les contenus

Les données qui changent souvent sont centralisées dans **`assets/js/data.js`** :

- `settings` : e-mail, adresse du service de formulaire, montant de la caution, tarif dégressif, nombre maximum de participants ;
- `levels` : grille de niveaux ;
- `destinations` : massifs proposés (`available: true` pour ouvrir une destination à la réservation) ;
- `itineraries` : itinéraires (distance, dénivelé, durée, niveau, âge minimum, nombre de jours, hébergement) ;
- `routeOffers` : formules de préparation d'itinéraire et leurs prix ;
- `packs` : packs « sac tout prêt » (prix adulte / enfant, contenu) ;
- `gear` : matériel à la carte ;
- `logistics` : modes de retrait du matériel.

Les prix affichés dans les pages Location et Itinéraires, ainsi que le calcul de la réservation, sont lus dans ce fichier. Les textes rédigés directement dans les pages HTML (accroches, FAQ, cartes de la page Destinations…) se modifient dans le fichier HTML correspondant.

Les illustrations de montagnes sont générées par `assets/js/art.js` ; les couleurs et la typographie se règlent en haut de `assets/css/style.css`.

## Recevoir les demandes par e-mail

Sans configuration, les formulaires affichent la confirmation mais **n'envoient rien**. Pour recevoir les demandes :

1. Créer un formulaire sur un service comme [Formspree](https://formspree.io) (gratuit pour démarrer) ;
2. Copier l'adresse fournie (du type `https://formspree.io/f/xxxxxx`) dans `formEndpoint`, dans `assets/js/data.js`.

Les demandes de réservation sont alors envoyées au format JSON avec un numéro de référence, et les messages du formulaire de contact avec leurs champs.

## Mise en ligne

- **GitHub Pages** : dans les paramètres du dépôt, rubrique *Pages*, choisir la branche à publier et le dossier racine.
- **Netlify** ou **Vercel** : importer le dépôt, sans commande de build, dossier de publication à la racine.

## À compléter avant la mise en ligne

- Coordonnées réelles : e-mail (`bonjour@sacpre.fr` est provisoire), adresse de l'agence, téléphone ;
- Prix, caution, conditions d'annulation (valeurs provisoires dans `assets/js/data.js`) ;
- Données des itinéraires (distances, dénivelés et durées indicatifs) ;
- Mentions légales et conditions de location (`mentions-legales.html`) ;
- Service d'envoi des formulaires (`formEndpoint`).

## Structure

```
index.html, destinations.html, location.html, itineraires.html,
reserver.html, contact.html, mentions-legales.html
assets/
  css/style.css      styles communs
  css/reserver.css   styles du parcours de réservation
  js/data.js         contenus et tarifs
  js/icons.js        jeu d'icônes
  js/art.js          illustrations de montagnes
  js/main.js         menu, animations, listes dynamiques, formulaire de contact
  js/reserver.js     parcours de réservation
  img/               logo, photos, motifs topographiques, favicons
  img/brand/         logo en PNG transparent (emblème, logotype vert et crème, slogan)
```
