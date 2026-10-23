/* ==========================================================================
   Sac'pré — données du site
   Toutes les informations modifiables (destinations, itinéraires, tarifs,
   matériel) sont regroupées ici. Les prix sont en euros TTC.
   ========================================================================== */
(function () {
  "use strict";

  /* ----- Coordonnées & réglages généraux ----- */
  var settings = {
    email: "bonjour@sacpre.fr",
    // Adresse d'un service de formulaire (Formspree, Getform, Basin…).
    // Laisser vide : les demandes sont simulées côté navigateur.
    formEndpoint: "",
    deposit: 150, // caution par sac (empreinte bancaire, non débitée)
    degressive: { fromDay: 3, factor: 0.7 }, // -30 % à partir du 3e jour
    maxParticipants: 12,
    guideCapacity: 10 // participants max par accompagnateur
  };

  /* ----- Niveaux de randonnée ----- */
  var levels = [
    {
      id: 1,
      label: "Débutant",
      short: "Je débute",
      desc: "Je randonne rarement. Jusqu'à 10 km et 400 m de dénivelé, sur sentiers bien tracés."
    },
    {
      id: 2,
      label: "Intermédiaire",
      short: "Quelques randos par an",
      desc: "Quelques randonnées par an. 10 à 15 km et jusqu'à 900 m de dénivelé."
    },
    {
      id: 3,
      label: "Confirmé",
      short: "Je randonne souvent",
      desc: "Randonneur régulier. 15 à 20 km, jusqu'à 1 300 m de dénivelé, passages raides possibles."
    },
    {
      id: 4,
      label: "Expert",
      short: "Très à l'aise",
      desc: "Longues journées, terrain technique, itinérance en autonomie : la montagne est mon terrain de jeu."
    }
  ];

  /* ----- Tranches d'âge des enfants : plafond de difficulté ----- */
  // cap = niveau maximum conseillé pour le groupe ; carried = enfant porté
  function childProfile(age) {
    if (age <= 2) return { key: "bebe", label: "Bébé porté", cap: 2, carried: true, price: "none" };
    if (age <= 5) return { key: "petit", label: "Petit marcheur (3–5 ans)", cap: 1, carried: false, price: "child" };
    if (age <= 11) return { key: "enfant", label: "Enfant (6–11 ans)", cap: 2, carried: false, price: "child" };
    return { key: "ado", label: "Adolescent (12–17 ans)", cap: 3, carried: false, price: "adult" };
  }

  /* ----- Destinations ----- */
  var destinations = [
    {
      id: "vercors",
      name: "Randonnée du Vercors",
      short: "Vercors",
      region: "Isère & Drôme",
      available: true,
      teaser: "Hauts-plateaux sauvages, falaises calcaires et alpages : le terrain idéal pour débuter comme pour se dépasser.",
      art: "vercors"
    },
    {
      id: "chartreuse",
      name: "Randonnée en Chartreuse",
      short: "Chartreuse",
      region: "Isère & Savoie",
      available: false,
      teaser: "Forêts profondes, Dent de Crolles et monastères : un massif secret aux portes de Grenoble.",
      art: "chartreuse"
    },
    {
      id: "belledonne",
      name: "Randonnée en Belledonne",
      short: "Belledonne",
      region: "Isère & Savoie",
      available: false,
      teaser: "Une chaîne cristalline semée de lacs d'altitude, pour des randonnées plus alpines.",
      art: "belledonne"
    },
    {
      id: "ecrins",
      name: "Randonnée dans les Écrins",
      short: "Écrins",
      region: "Hautes-Alpes & Isère",
      available: false,
      teaser: "Glaciers, refuges gardés et grands sommets au cœur d'un parc national.",
      art: "ecrins"
    },
    {
      id: "mont-blanc",
      name: "Randonnée au pays du Mont-Blanc",
      short: "Mont-Blanc",
      region: "Haute-Savoie",
      available: false,
      teaser: "Balcons panoramiques face au toit de l'Europe et sentiers mythiques.",
      art: "montblanc"
    },
    {
      id: "pyrenees",
      name: "Randonnée dans les Pyrénées",
      short: "Pyrénées",
      region: "Occitanie & Nouvelle-Aquitaine",
      available: false,
      teaser: "Cirques grandioses, lacs et estives, des Pyrénées catalanes au Béarn.",
      art: "pyrenees"
    }
  ];

  /* ----- Itinéraires du Vercors -----
     Distances, dénivelés et durées sont indicatifs ; ils sont précisés
     dans le road-book remis au client. level : 1 à 3 (cf. levels).
     days : [min, max] jours. lodging : "none" | "gite" | "bivouac".     */
  var itineraries = [
    {
      id: "moliere",
      zone: "vercors",
      name: "Plateau de la Molière",
      start: "Autrans-Méaudre en Vercors",
      level: 1,
      days: [1, 1],
      lodging: "none",
      distance: 7,
      elevation: 250,
      duration: "2 h 30",
      minAge: 4,
      tags: ["Panoramas & sommets", "Forêts & alpages"],
      desc: "Une boucle douce sur les alpages, avec par temps clair un panorama sur Belledonne et le Mont-Blanc. Le spot pique-nique idéal."
    },
    {
      id: "archiane",
      zone: "vercors",
      name: "Cirque d'Archiane",
      start: "Hameau d'Archiane, Châtillon-en-Diois",
      level: 1,
      days: [1, 1],
      lodging: "none",
      distance: 6,
      elevation: 300,
      duration: "2 h 30",
      minAge: 5,
      tags: ["Patrimoine & villages", "Faune & flore"],
      desc: "Au pied d'un cirque de falaises spectaculaire, une balade accessible dans le Vercors drômois, chamois et vautours en prime."
    },
    {
      id: "etoile-villard",
      zone: "vercors",
      name: "Séjour en étoile à Villard-de-Lans",
      start: "Villard-de-Lans (nuits en gîte)",
      level: 1,
      days: [2, 4],
      lodging: "gite",
      distance: 8,
      elevation: 350,
      duration: "3 h / jour",
      minAge: 5,
      perDay: true,
      tags: ["Forêts & alpages", "Patrimoine & villages"],
      desc: "Une base confortable et chaque jour une boucle différente : l'idéal pour découvrir le Vercors en douceur, en famille ou entre amis."
    },
    {
      id: "moucherotte",
      zone: "vercors",
      name: "Le Moucherotte (1 901 m)",
      start: "Saint-Nizier-du-Moucherotte",
      level: 2,
      days: [1, 1],
      lodging: "none",
      distance: 9,
      elevation: 750,
      duration: "4 h 30",
      minAge: 9,
      tags: ["Panoramas & sommets"],
      desc: "Le grand balcon du Vercors : une montée régulière en forêt puis sur la crête, avec une vue plongeante sur Grenoble et les Alpes."
    },
    {
      id: "pic-saint-michel",
      zone: "vercors",
      name: "Pic Saint-Michel (1 966 m)",
      start: "Lans-en-Vercors",
      level: 2,
      days: [1, 1],
      lodging: "none",
      distance: 10,
      elevation: 800,
      duration: "5 h",
      minAge: 10,
      tags: ["Panoramas & sommets", "Forêts & alpages"],
      desc: "Par le col de l'Arc, une ascension variée jusqu'aux crêtes orientales du massif, face à la chaîne de Belledonne."
    },
    {
      id: "vercors-nord",
      zone: "vercors",
      name: "Itinérance Vercors Nord",
      start: "Autrans → Villard-de-Lans (nuit en gîte)",
      level: 2,
      days: [2, 2],
      lodging: "gite",
      distance: 28,
      elevation: 1000,
      duration: "2 jours",
      minAge: 10,
      tags: ["Forêts & alpages", "Patrimoine & villages"],
      desc: "Deux jours de sentiers entre villages, forêts et prairies des Quatre Montagnes, avec une nuit en gîte et le sac allégé."
    },
    {
      id: "tour-mont-aiguille",
      zone: "vercors",
      name: "Tour du Mont Aiguille",
      start: "Chichilianne",
      level: 3,
      days: [1, 1],
      lodging: "none",
      distance: 14,
      elevation: 900,
      duration: "6 h",
      minAge: 12,
      tags: ["Panoramas & sommets", "Faune & flore"],
      desc: "Le tour complet de l'emblématique « Mont Inaccessible », par le col de l'Aupet et le pas de l'Aiguille."
    },
    {
      id: "grand-veymont",
      zone: "vercors",
      name: "Grand Veymont (2 341 m)",
      start: "Gresse-en-Vercors",
      level: 3,
      days: [1, 1],
      lodging: "none",
      distance: 15,
      elevation: 1100,
      duration: "6 h 30",
      minAge: 12,
      tags: ["Panoramas & sommets", "Faune & flore"],
      desc: "Le toit du Vercors par le pas de la Ville : une grande journée minérale avec vue sur les Hauts-Plateaux et le Mont Aiguille."
    },
    {
      id: "hauts-plateaux",
      zone: "vercors",
      name: "Traversée des Hauts-Plateaux",
      start: "Corrençon → Châtillon-en-Diois (bivouac)",
      level: 3,
      days: [3, 4],
      lodging: "bivouac",
      distance: 45,
      elevation: 1500,
      duration: "3 à 4 jours",
      minAge: 12,
      tags: ["Faune & flore", "Panoramas & sommets"],
      desc: "La grande aventure du Vercors : la plus vaste réserve naturelle terrestre de métropole, ses cabanes pastorales et ses nuits étoilées."
    }
  ];

  /* ----- Formules de préparation d'itinéraire ----- */
  var routeOffers = [
    {
      id: "aucune",
      name: "Location seule",
      price: 0,
      unit: "",
      desc: "J'ai déjà mon itinéraire, je loue uniquement le matériel.",
      features: ["Conseils de base au retrait du sac"]
    },
    {
      id: "roadbook",
      name: "Road-book Essentiel",
      price: 19,
      unit: "par jour de marche",
      desc: "Un itinéraire testé, choisi selon le niveau de votre groupe.",
      features: ["Fiche itinéraire détaillée", "Trace GPX & carte", "Points d'eau, abris, horaires conseillés"],
      requiresRoute: true
    },
    {
      id: "surmesure",
      name: "Itinéraire sur mesure",
      price: 49,
      unit: "par jour de marche",
      desc: "On construit votre randonnée de A à Z avec vous.",
      features: ["Appel de préparation de 30 min", "Itinéraire et hébergements adaptés", "Bulletin météo la veille du départ"],
      featured: true
    },
    {
      id: "guide",
      name: "Accompagné par un guide",
      price: 280,
      unit: "par jour et par guide",
      desc: "Un accompagnateur en montagne diplômé marche avec vous.",
      features: ["Accompagnateur du Vercors diplômé d'État", "Sécurité et lecture du terrain", "Faune, flore et histoire racontées"],
      perGuide: true
    }
  ];

  /* ----- Packs « Sac tout prêt » ----- */
  var packs = {
    journee: {
      id: "journee",
      name: "Sac tout prêt — Journée",
      volume: "25–30 L",
      adult: 19,
      child: 12,
      contents: [
        "Sac à dos 25–30 L ajusté à votre taille",
        "Pochette bleue : polaire, bonnet, gants",
        "Pochette rouge : veste imperméable, casquette, crème solaire",
        "Pochette verte : poche à eau 2 L, gobelet, couverts",
        "Pochette jaune : trousse de secours, couverture de survie, frontale, sifflet",
        "Fiche mémo « Quand mettre quoi ? »"
      ]
    },
    gite: {
      id: "gite",
      name: "Sac tout prêt — Itinérance gîte",
      volume: "40–45 L",
      adult: 27,
      child: 17,
      contents: ["Tout le pack Journée", "Sac à dos 40–45 L", "Drap de sac", "Serviette microfibre", "Trousse de toilette compacte", "Pochette étanche"]
    },
    bivouac: {
      id: "bivouac",
      name: "Sac tout prêt — Bivouac",
      volume: "55–65 L",
      adult: 35,
      child: 22,
      contents: ["Tout le pack Journée", "Sac à dos 55–65 L", "Sac de couchage confort 5 °C", "Matelas isolant", "Oreiller gonflable", "Popote individuelle"]
    }
  };

  /* ----- Matériel à la carte -----
     scope "person" : par participant ; "group" : pour le groupe.        */
  var gear = [
    { id: "chaussures", name: "Chaussures de randonnée", price: 8, scope: "person", desc: "Tiges montantes, imperméables. Du 28 au 47.", icon: "boot" },
    { id: "batons", name: "Paire de bâtons", price: 4, scope: "person", desc: "Télescopiques, réglés à votre taille.", icon: "poles" },
    { id: "tente", name: "Tente 2 places", price: 12, scope: "group", desc: "Légère (2 kg), montage en 5 minutes.", icon: "tent", bivouacOnly: true },
    { id: "rechaud", name: "Réchaud & popote (4 pers.)", price: 6, scope: "group", desc: "Réchaud gaz, cartouche, casseroles et briquet.", icon: "stove", bivouacOnly: true },
    { id: "filtre", name: "Filtre à eau", price: 4, scope: "group", desc: "Pour boire l'eau des sources en toute sécurité.", icon: "drop" },
    { id: "porte-bebe", name: "Porte-bébé de randonnée", price: 10, scope: "group", desc: "Avec pare-soleil, jusqu'à 18 kg.", icon: "baby" },
    { id: "gps", name: "GPS de randonnée", price: 8, scope: "group", desc: "Votre itinéraire préchargé, autonomie 2 jours.", icon: "gps" }
  ];

  /* ----- Retrait du matériel ----- */
  var logistics = [
    { id: "agence", name: "Retrait & retour à l'agence", price: 0, desc: "On ajuste les sacs ensemble et on vous briefe sur l'itinéraire." },
    { id: "hebergement", name: "Livraison à votre hébergement", price: 15, desc: "Dans le Vercors, la veille au soir de votre départ." },
    { id: "depart", name: "Livraison au point de départ", price: 25, desc: "Votre matériel vous attend au parking, le matin même." }
  ];

  var interests = ["Panoramas & sommets", "Forêts & alpages", "Faune & flore", "Patrimoine & villages", "Lacs & cascades", "Grottes & gorges"];

  window.SACPRE = {
    settings: settings,
    levels: levels,
    childProfile: childProfile,
    destinations: destinations,
    itineraries: itineraries,
    routeOffers: routeOffers,
    packs: packs,
    gear: gear,
    logistics: logistics,
    interests: interests
  };
})();
