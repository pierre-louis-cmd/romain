/* ==========================================================================
   Sac'pré — parcours de réservation en 5 étapes
   1. Destination  2. Groupe  3. Itinéraire  4. Matériel  5. Récapitulatif
   L'état est conservé dans le navigateur (localStorage) pour ne rien perdre
   en cas de rechargement.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.SACPRE;
  var UI = window.SACPRE_UI;
  var ART = window.SACPRE_ART;
  var form = document.getElementById("wizard");
  if (!form || !D) return;

  var STORAGE_KEY = "sacpre-reservation-v1";
  var STEPS = ["Destination", "Groupe", "Itinéraire", "Matériel", "Récapitulatif"];
  var esc = UI.escapeHtml;
  var uid = 0;

  /* ======================================================================
     État
     ====================================================================== */
  function newParticipant(type) {
    uid += 1;
    return {
      id: "p" + Date.now().toString(36) + uid,
      type: type,
      name: "",
      level: null,
      age: null,
      gear: { pack: true, size: "", shoes: false, shoeSize: "", poles: false }
    };
  }

  function defaultState() {
    return {
      step: 1,
      maxStep: 1,
      zone: null,
      date: "",
      days: 1,
      lodging: "gite",
      participants: [newParticipant("adult")],
      interests: [],
      constraints: { vertigo: false, dog: false, transit: false },
      notes: "",
      offer: "roadbook",
      route: null,
      groupGear: {},
      groupGearTouched: false,
      logistics: "agence",
      contact: { firstName: "", lastName: "", email: "", phone: "", message: "", consent: false }
    };
  }

  var state = load() || defaultState();

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      var base = defaultState();
      Object.keys(base).forEach(function (k) {
        if (saved[k] === undefined) saved[k] = base[k];
      });
      if (!saved.participants || !saved.participants.length) saved.participants = base.participants;
      return saved;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* stockage indisponible : on continue sans persistance */
    }
  }

  function clearSaved() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* rien */
    }
  }

  /* ======================================================================
     Calculs
     ====================================================================== */
  function adults() {
    return state.participants.filter(function (p) { return p.type === "adult"; });
  }

  function children() {
    return state.participants.filter(function (p) { return p.type === "child"; });
  }

  function profile(p) {
    if (p.type === "adult") return { key: "adulte", label: "Adulte", cap: 4, carried: false, price: "adult" };
    if (p.age === null || p.age === "") return { key: "inconnu", label: "Enfant", cap: 4, carried: false, price: "child" };
    return D.childProfile(Number(p.age));
  }

  function walkers() {
    return state.participants.filter(function (p) { return !profile(p).carried; });
  }

  function babies() {
    return state.participants.filter(function (p) { return profile(p).carried; });
  }

  function displayName(p) {
    if (p.name && p.name.trim()) return p.name.trim();
    var list = p.type === "adult" ? adults() : children();
    var n = list.indexOf(p) + 1;
    if (p.type === "adult") return n === 1 ? "Vous" : "Adulte " + n;
    return "Enfant " + n;
  }

  function effectiveLevel(p) {
    var prof = profile(p);
    if (prof.carried) return null;
    if (prof.key === "petit") return 1;
    return p.level;
  }

  function groupLevel() {
    var level = 4;
    var reason = "";
    walkers().forEach(function (p) {
      var lv = effectiveLevel(p);
      if (lv && lv < level) {
        level = lv;
        reason = "le niveau de «\u00a0" + displayName(p) + "\u00a0»";
      }
    });
    state.participants.forEach(function (p) {
      var prof = profile(p);
      if (p.type === "child" && p.age !== null && p.age !== "" && prof.cap < level) {
        level = prof.cap;
        reason = prof.carried
          ? "la présence d'un bébé porté"
          : "l'âge de «\u00a0" + displayName(p) + "\u00a0» (" + ageLabel(p.age) + ")";
      }
    });
    return { level: level, reason: reason };
  }

  function youngestWalkerAge() {
    var ages = walkers()
      .filter(function (p) { return p.type === "child" && p.age !== null && p.age !== ""; })
      .map(function (p) { return Number(p.age); });
    return ages.length ? Math.min.apply(null, ages) : null;
  }

  function packType() {
    if (state.days <= 1) return "journee";
    return state.lodging === "bivouac" ? "bivouac" : "gite";
  }

  function evaluateRoutes() {
    var gl = groupLevel().level;
    var youngest = youngestWalkerAge();
    return D.itineraries
      .filter(function (it) { return it.zone === state.zone; })
      .map(function (it) {
        var reasons = [];
        if (it.level > gl) reasons.push("Trop exigeant pour le niveau du groupe");
        if (youngest !== null && youngest < it.minAge) reasons.push("Conseillé à partir de " + it.minAge + " ans");
        if (state.days < it.days[0] || state.days > it.days[1]) {
          reasons.push(it.days[0] > 1 ? "Prévu sur " + UI.daysLabel(it).toLowerCase() : "Randonnée à la journée");
        }
        if (state.days > 1 && state.lodging === "gite" && it.lodging === "bivouac") reasons.push("Nécessite de bivouaquer");
        if (state.constraints.dog && it.id === "hauts-plateaux") reasons.push("Chiens interdits dans la réserve naturelle");
        var interestScore = it.tags.filter(function (t) { return state.interests.indexOf(t) !== -1; }).length;
        return { it: it, ok: reasons.length === 0, reasons: reasons, score: (gl - it.level) * -10 + interestScore };
      })
      .sort(function (a, b) {
        if (a.ok !== b.ok) return a.ok ? -1 : 1;
        return b.score - a.score;
      });
  }

  function dayUnits() {
    var deg = D.settings.degressive;
    var units = 0;
    for (var d = 1; d <= state.days; d++) units += d >= deg.fromDay ? deg.factor : 1;
    return units;
  }

  function gearById(id) {
    return D.gear.filter(function (g) { return g.id === id; })[0];
  }

  function offerById(id) {
    return D.routeOffers.filter(function (o) { return o.id === id; })[0];
  }

  function guidesNeeded() {
    return Math.max(1, Math.ceil(walkers().length / D.settings.guideCapacity));
  }

  // upTo : n'inclut que ce qui a déjà été choisi (étape 3 = formule, étape 4 = matériel)
  function computePrice(upTo) {
    upTo = upTo || 5;
    var lines = [];
    var units = dayUnits();
    var pack = D.packs[packType()];
    var adultPacks = 0;
    var childPacks = 0;
    var shoes = 0;
    var poles = 0;

    walkers().forEach(function (p) {
      var g = p.gear;
      if (g.pack) {
        if (profile(p).price === "adult") adultPacks += 1;
        else childPacks += 1;
      }
      if (g.shoes) shoes += 1;
      if (g.poles) poles += 1;
    });

    if (upTo < 4) adultPacks = childPacks = shoes = poles = 0;

    if (adultPacks) lines.push({ cat: "Matériel", label: pack.name.replace("Sac tout prêt — ", "Sac tout prêt ") + " · adulte × " + adultPacks, amount: adultPacks * pack.adult * units });
    if (childPacks) lines.push({ cat: "Matériel", label: pack.name.replace("Sac tout prêt — ", "Sac tout prêt ") + " · enfant × " + childPacks, amount: childPacks * pack.child * units });
    if (shoes) lines.push({ cat: "Matériel", label: "Chaussures de randonnée × " + shoes, amount: shoes * gearById("chaussures").price * units });
    if (poles) lines.push({ cat: "Matériel", label: "Paire de bâtons × " + poles, amount: poles * gearById("batons").price * units });

    if (upTo >= 4) {
      availableGroupGear().forEach(function (g) {
        var qty = state.groupGear[g.id] || 0;
        if (qty > 0) lines.push({ cat: "Matériel", label: g.name + " × " + qty, amount: qty * g.price * units });
      });
    }

    var offer = upTo >= 3 && offerById(state.offer);
    if (offer && offer.price) {
      var amount = offer.price * state.days * (offer.perGuide ? guidesNeeded() : 1);
      var label = offer.name + " · " + state.days + " j" + (offer.perGuide && guidesNeeded() > 1 ? " × " + guidesNeeded() + " guides" : "");
      lines.push({ cat: "Itinéraire", label: label, amount: amount });
    }

    var logi = upTo >= 4 && D.logistics.filter(function (l) { return l.id === state.logistics; })[0];
    if (logi && logi.price) lines.push({ cat: "Logistique", label: logi.name, amount: logi.price });

    var total = lines.reduce(function (s, l) { return s + l.amount; }, 0);
    return { lines: lines, total: total, packs: adultPacks + childPacks, degressive: state.days >= D.settings.degressive.fromDay };
  }

  function availableGroupGear() {
    return D.gear.filter(function (g) {
      if (g.scope !== "group") return false;
      if (g.bivouacOnly && packType() !== "bivouac") return false;
      return true;
    });
  }

  function suggestGroupGear() {
    var w = walkers().length;
    var s = {};
    availableGroupGear().forEach(function (g) { s[g.id] = 0; });
    if (packType() === "bivouac") {
      s.tente = Math.ceil(w / 2);
      s.rechaud = Math.ceil(w / 4);
      s.filtre = 1;
    }
    if (babies().length) s["porte-bebe"] = babies().length;
    return s;
  }

  /* ======================================================================
     Formatage
     ====================================================================== */
  var euros = UI.euros;

  function parseDate(str) {
    if (!str) return null;
    var parts = str.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatDate(d, withYear) {
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: withYear ? "numeric" : undefined });
  }

  function dateLabel() {
    var start = parseDate(state.date);
    if (!start) return "Date à préciser";
    if (state.days === 1) return capitalize(formatDate(start, true));
    var end = new Date(start);
    end.setDate(end.getDate() + state.days - 1);
    return "Du " + formatDate(start, false) + " au " + formatDate(end, true);
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function ageLabel(age) {
    if (age === null || age === "") return "âge non précisé";
    age = Number(age);
    if (age === 0) return "moins d'1 an";
    return age + (age > 1 ? " ans" : " an");
  }

  function plural(n, one, many) {
    return n + " " + (n > 1 ? many : one);
  }

  function groupLabel() {
    var a = adults().length;
    var c = children().length;
    var out = plural(a, "adulte", "adultes");
    if (c) out += ", " + plural(c, "enfant", "enfants");
    return out;
  }

  function tomorrowIso() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function icon(name) {
    return '<svg class="i" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }

  /* ======================================================================
     Rendu des étapes
     ====================================================================== */
  var $ = function (id) { return document.getElementById(id); };

  function renderProgress() {
    $("wizard-progress").innerHTML = STEPS.map(function (label, i) {
      var n = i + 1;
      var cls = n === state.step ? "is-current" : n < state.step || n <= state.maxStep ? "is-done" : "";
      var reachable = n <= state.maxStep && n !== state.step;
      var inner = '<span class="wizard-progress__num">' + (n < state.step ? icon("check") : n) + '</span><span class="wizard-progress__label">' + label + "</span>";
      return '<li class="' + cls + '"' + (n === state.step ? ' aria-current="step"' : "") + ">" +
        (reachable ? '<button type="button" data-goto="' + n + '">' + inner + "</button>" : "<span>" + inner + "</span>") +
        "</li>";
    }).join("");
  }

  /* ----- Étape 1 ----- */
  function renderDestinations() {
    $("dest-choices").innerHTML = D.destinations.map(function (d) {
      if (d.available) {
        var selected = state.zone === d.id;
        return '<button type="button" class="dest-card dest-card--available' + (selected ? " is-selected" : "") + '" data-zone="' + d.id + '" aria-pressed="' + selected + '">' +
          '<span class="dest-card__status">' + (selected ? "Sélectionnée" : "Disponible") + "</span>" +
          '<span class="dest-card__art" data-art="' + d.art + '" data-art-label="Illustration : ' + esc(d.short) + '"></span>' +
          '<span class="dest-card__body"><span class="dest-card__region">' + esc(d.region) + '</span><span class="h3">' + esc(d.name) + "</span>" +
          '<span class="dest-card__text">' + esc(d.teaser) + "</span>" +
          '<span class="dest-card__cta">' + (selected ? "Destination choisie" : "Choisir cette destination") + " " + icon("arrow") + "</span></span></button>";
      }
      return '<div class="dest-card dest-card--soon" aria-disabled="true">' +
        '<span class="dest-card__status">Bientôt disponible</span>' +
        '<span class="dest-card__art" data-art="' + d.art + '" data-art-label="Illustration : ' + esc(d.short) + '"></span>' +
        '<span class="dest-card__body"><span class="dest-card__region">' + esc(d.region) + '</span><span class="h3">' + esc(d.name) + "</span>" +
        '<span class="dest-card__text">' + esc(d.teaser) + "</span>" +
        '<span class="dest-card__cta">' + icon("bell") + ' <a href="contact.html?sujet=alerte-' + d.id + '">Être prévenu de l\'ouverture</a></span></span></div>';
    }).join("");
    ART.hydrate($("dest-choices"));
  }

  /* ----- Étape 2 ----- */
  function renderGroupStatic() {
    var dateInput = $("f-date");
    dateInput.min = tomorrowIso();
    dateInput.value = state.date;
    $("f-days").value = String(state.days);
    $("lodging-field").hidden = state.days <= 1;
    form.querySelectorAll('input[name="lodging"]').forEach(function (r) { r.checked = r.value === state.lodging; });
    $("f-notes").value = state.notes;
    form.querySelectorAll('[data-bind^="constraints."]').forEach(function (c) {
      c.checked = !!state.constraints[c.dataset.bind.split(".")[1]];
    });
    $("levels-help-list").innerHTML = D.levels.map(function (l) {
      return "<li>" + UI.levelDots(l.id, 4) + "<strong>" + l.label + "</strong><span>" + esc(l.desc) + "</span></li>";
    }).join("");
    $("interests").innerHTML = D.interests.map(function (t) {
      var on = state.interests.indexOf(t) !== -1;
      return '<button type="button" class="chip" data-interest="' + esc(t) + '" aria-pressed="' + on + '">' + esc(t) + "</button>";
    }).join("");
  }

  function renderCounters() {
    var total = state.participants.length;
    var max = D.settings.maxParticipants;
    form.querySelectorAll("[data-counter]").forEach(function (box) {
      var type = box.dataset.counter;
      var count = type === "adult" ? adults().length : children().length;
      box.querySelector("output").textContent = count;
      box.querySelector('[data-delta="-1"]').disabled = type === "adult" ? count <= 1 : count <= 0;
      box.querySelector('[data-delta="1"]').disabled = total >= max;
    });
    $("group-limit").classList.toggle("is-warning", total >= max);
  }

  function levelSeg(p) {
    return '<div class="seg seg--levels" role="radiogroup" aria-label="Niveau de ' + esc(displayName(p)) + '">' +
      D.levels.map(function (l) {
        return '<label class="seg__opt" title="' + esc(l.desc) + '"><input type="radio" name="level-' + p.id + '" value="' + l.id + '" data-pid="' + p.id + '" data-field="level"' + (Number(p.level) === l.id ? " checked" : "") + ">" +
          "<span>" + UI.levelDots(l.id, 4) + "<strong>" + l.label + "</strong><small>" + l.short + "</small></span></label>";
      }).join("") + "</div>";
  }

  function renderParticipants() {
    var html = state.participants.map(function (p) {
      var isChild = p.type === "child";
      var prof = profile(p);
      var title = displayName(p);
      var idx = (isChild ? children() : adults()).indexOf(p) + 1;
      var fallback = isChild ? "Enfant " + idx : idx === 1 ? "Vous" : "Adulte " + idx;
      var ageField = "";
      var levelField = "";
      if (isChild) {
        var opts = '<option value="">Âge</option>';
        for (var a = 0; a <= 17; a++) opts += '<option value="' + a + '"' + (String(p.age) === String(a) ? " selected" : "") + ">" + ageLabel(a) + "</option>";
        ageField = '<div class="field field--age"><label for="age-' + p.id + '">Âge</label><select class="select" id="age-' + p.id + '" data-pid="' + p.id + '" data-field="age">' + opts + "</select></div>";
      }
      if (prof.carried) {
        levelField = '<p class="participant__note">' + icon("baby") + "Porté par un adulte&nbsp;: nous limitons la difficulté et vous proposons un porte-bébé.</p>";
      } else if (prof.key === "petit") {
        levelField = '<p class="participant__note">' + icon("smile") + "Petit marcheur&nbsp;: itinéraires courts et faciles uniquement.</p>";
      } else if (isChild && (p.age === null || p.age === "")) {
        levelField = '<p class="participant__note participant__note--muted">' + icon("info") + "Indiquez l'âge pour préciser le niveau.</p>";
      } else {
        levelField = '<div class="field"><span class="label">Niveau de randonnée</span>' + levelSeg(p) + "</div>";
      }
      return '<article class="participant' + (isChild ? " participant--child" : "") + '" data-participant="' + p.id + '">' +
        '<header class="participant__head"><span class="participant__avatar">' + icon(isChild ? "smile" : "users") + "</span>" +
        '<div class="participant__title"><strong>' + esc(title) + "</strong><span>" + (isChild ? (p.age !== null && p.age !== "" ? prof.label : "Enfant") : "Adulte") + "</span></div></header>" +
        '<div class="participant__fields">' +
        '<div class="field field--name"><label for="name-' + p.id + '">Prénom <span class="optional">facultatif</span></label><input class="input" id="name-' + p.id + '" data-pid="' + p.id + '" data-field="name" value="' + esc(p.name) + '" placeholder="' + esc(fallback) + '" autocomplete="off"></div>' +
        ageField +
        "</div>" + levelField + "</article>";
    }).join("");
    $("participants").innerHTML = html;
    renderCounters();
  }

  /* ----- Étape 3 ----- */
  function renderGroupLevel() {
    var gl = groupLevel();
    var level = D.levels.filter(function (l) { return l.id === gl.level; })[0];
    var walkCount = walkers().length;
    var chips = [
      icon("users") + groupLabel(),
      icon("calendar") + (state.days === 1 ? "1 journée" : state.days + " jours"),
      state.days > 1 ? icon("home") + (state.lodging === "bivouac" ? "Bivouac" : state.lodging === "gite" ? "Gîte / refuge" : "Hébergement à définir") : ""
    ].filter(Boolean);
    $("group-level").innerHTML =
      '<div class="level-banner">' +
      '<div class="level-banner__main">' + UI.levelDots(gl.level, 4) +
      '<p class="level-banner__kicker">Niveau retenu pour votre groupe</p>' +
      "<p class=\"level-banner__value\">" + level.label + "</p>" +
      '<p class="level-banner__desc">' + esc(level.desc) + (gl.reason && walkCount > 1 ? " Niveau ajusté pour que tout le groupe soit à l'aise, selon " + esc(gl.reason) + "." : "") + "</p></div>" +
      '<ul class="level-banner__chips">' + chips.map(function (c) { return "<li>" + c + "</li>"; }).join("") + "</ul></div>";
  }

  function renderOffers() {
    $("offers").innerHTML = D.routeOffers.map(function (o) {
      var checked = state.offer === o.id;
      var price = o.price ? euros(o.price) + '<span> ' + o.unit + "</span>" : "Sans supplément";
      return '<label class="option-card' + (o.featured ? " option-card--featured" : "") + '">' +
        '<input class="sr-only" type="radio" name="offer" value="' + o.id + '"' + (checked ? " checked" : "") + ">" +
        '<span class="option-card__check" aria-hidden="true">' + icon("check") + "</span>" +
        (o.featured ? '<span class="option-card__flag">Le plus choisi</span>' : "") +
        '<span class="option-card__name">' + esc(o.name) + "</span>" +
        '<span class="option-card__desc">' + esc(o.desc) + "</span>" +
        '<span class="option-card__features">' + o.features.map(function (f) { return "<span>" + icon("check") + esc(f) + "</span>"; }).join("") + "</span>" +
        '<span class="option-card__price">' + price + "</span></label>";
    }).join("");
  }

  var showAllRoutes = false;

  function renderRoutes() {
    var evals = evaluateRoutes();
    var ok = evals.filter(function (e) { return e.ok; });
    var ko = evals.filter(function (e) { return !e.ok; });
    var offer = offerById(state.offer);

    // un itinéraire déjà choisi mais devenu inadapté est retiré
    if (state.route && !ok.some(function (e) { return e.it.id === state.route; })) state.route = null;

    var optional = $("route-optional");
    optional.textContent = offer && offer.requiresRoute ? "à choisir" : "facultatif";
    optional.classList.toggle("is-required", !!(offer && offer.requiresRoute));

    var html = "";
    if (state.offer === "surmesure") {
      html += '<p class="note note--green">' + icon("info") + "<span>Avec la formule sur mesure, nous construisons votre itinéraire ensemble. Choisir une proposition ci-dessous est facultatif&nbsp;: elle servira de point de départ.</span></p>";
    } else if (state.offer === "guide") {
      html += '<p class="note note--green">' + icon("guide") + "<span>Votre guide adaptera l'itinéraire le jour J. Vous pouvez nous indiquer celui qui vous fait envie.</span></p>";
    } else if (state.offer === "aucune") {
      html += '<p class="note note--green">' + icon("info") + "<span>Vous avez déjà votre itinéraire&nbsp;? Parfait. Ces suggestions sont là à titre indicatif.</span></p>";
    }

    if (!ok.length) {
      html += '<div class="empty-state">' + icon("compass") + "<p><strong>Aucun itinéraire prêt à l'emploi ne correspond exactement à votre groupe.</strong> Pas d'inquiétude&nbsp;: avec la formule <em>Itinéraire sur mesure</em> ou <em>Accompagné par un guide</em>, nous construisons une randonnée adaptée.</p></div>";
    } else {
      html += '<div class="route-grid route-grid--wizard">' + ok.map(function (e, i) {
        return UI.routeCard(e.it, {
          selectable: true,
          name: "route",
          checked: state.route === e.it.id,
          badge: i === 0 ? icon("star") + "Recommandé" : "",
          extraClass: "route-card--selectable"
        });
      }).join("") + "</div>";
    }

    if (ko.length) {
      html += '<button type="button" class="link-toggle" id="toggle-routes" aria-expanded="' + showAllRoutes + '">' +
        (showAllRoutes ? "Masquer" : "Voir") + " les itinéraires non adaptés (" + ko.length + ") " + icon("chevron-down") + "</button>";
      if (showAllRoutes) {
        html += '<div class="route-grid route-grid--wizard">' + ko.map(function (e) {
          return UI.routeCard(e.it, {
            extraClass: "route-card--disabled",
            footer: '<p class="route-card__why">' + icon("alert") + esc(e.reasons.join(" · ")) + "</p>"
          });
        }).join("") + "</div>";
      }
    }
    $("routes").innerHTML = html;
    ART.hydrate($("routes"));
  }

  /* ----- Étape 4 ----- */
  function sizeOptions(p) {
    var sizes = profile(p).price === "child" ? ["4–6 ans", "7–9 ans", "10–12 ans"] : ["XS", "S", "M", "L", "XL", "XXL"];
    return '<option value="">Taille</option>' + sizes.map(function (s) {
      return '<option value="' + s + '"' + (p.gear.size === s ? " selected" : "") + ">" + s + "</option>";
    }).join("");
  }

  function shoeOptions(p) {
    var out = '<option value="">Pointure</option>';
    for (var s = 28; s <= 47; s++) out += '<option value="' + s + '"' + (String(p.gear.shoeSize) === String(s) ? " selected" : "") + ">" + s + "</option>";
    return out;
  }

  function renderPackIntro() {
    var pack = D.packs[packType()];
    var deg = D.settings.degressive;
    $("pack-intro").innerHTML =
      '<div class="pack-banner">' +
      '<div class="pack-banner__media"><picture><source type="image/webp" srcset="assets/img/sac-tout-pret.webp"><img src="assets/img/sac-tout-pret.jpg" alt="Sac tout prêt Sac\'pré ouvert, avec ses pochettes de couleur" width="1253" height="698" loading="lazy"></picture></div>' +
      '<div class="pack-banner__body">' +
      '<p class="eyebrow">Pack conseillé pour votre sortie</p>' +
      "<h3>" + esc(pack.name) + "</h3>" +
      '<p class="pack-banner__price"><strong>' + euros(pack.adult) + "</strong> / jour / adulte · <strong>" + euros(pack.child) + "</strong> / jour / enfant</p>" +
      '<details class="pack-banner__details"><summary>Voir le contenu du sac</summary><ul class="check-list">' +
      pack.contents.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></details>" +
      (state.days >= deg.fromDay ? '<p class="small" style="margin:10px 0 0">' + icon("sparkle") + " Tarif dégressif appliqué&nbsp;: −" + Math.round((1 - deg.factor) * 100) + "&nbsp;% à partir du " + deg.fromDay + "<sup>e</sup> jour.</p>" : "") +
      "</div></div>";
  }

  function renderGearPeople() {
    var pack = D.packs[packType()];
    var units = dayUnits();
    $("gear-people").innerHTML = state.participants.map(function (p) {
      var prof = profile(p);
      var name = esc(displayName(p));
      if (prof.carried) {
        return '<div class="gear-row gear-row--baby"><div class="gear-row__who"><span class="participant__avatar">' + icon("baby") + "</span><div><strong>" + name + "</strong><span>Bébé porté</span></div></div>" +
          '<p class="gear-row__note">Pas de sac nécessaire&nbsp;: pensez au porte-bébé dans le matériel de groupe.</p></div>';
      }
      var g = p.gear;
      var unitPrice = prof.price === "adult" ? pack.adult : pack.child;
      var rowTotal = (g.pack ? unitPrice : 0) + (g.shoes ? gearById("chaussures").price : 0) + (g.poles ? gearById("batons").price : 0);
      return '<div class="gear-row" data-participant="' + p.id + '">' +
        '<div class="gear-row__who"><span class="participant__avatar">' + icon(p.type === "child" ? "smile" : "users") + "</span><div><strong>" + name + "</strong><span>" + (p.type === "child" ? prof.label : "Adulte") + "</span></div></div>" +
        '<div class="gear-row__items">' +
        '<div class="gear-item">' +
        '<label class="switch"><input type="checkbox" data-pid="' + p.id + '" data-gear="pack"' + (g.pack ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span>Sac tout prêt <em>' + euros(unitPrice) + "/j</em></span></label>" +
        '<select class="select select--sm" data-pid="' + p.id + '" data-gear="size" aria-label="Taille de vêtements de ' + name + '"' + (g.pack ? "" : " disabled") + ">" + sizeOptions(p) + "</select></div>" +
        '<div class="gear-item">' +
        '<label class="switch"><input type="checkbox" data-pid="' + p.id + '" data-gear="shoes"' + (g.shoes ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span>Chaussures <em>' + euros(gearById("chaussures").price) + "/j</em></span></label>" +
        '<select class="select select--sm" data-pid="' + p.id + '" data-gear="shoeSize" aria-label="Pointure de ' + name + '"' + (g.shoes ? "" : " disabled") + ">" + shoeOptions(p) + "</select></div>" +
        '<div class="gear-item">' +
        '<label class="switch"><input type="checkbox" data-pid="' + p.id + '" data-gear="poles"' + (g.poles ? " checked" : "") + '><span class="switch__track" aria-hidden="true"></span><span>Bâtons <em>' + euros(gearById("batons").price) + "/j</em></span></label></div>" +
        "</div>" +
        '<p class="gear-row__total">' + euros(rowTotal * units) + "<span>pour " + plural(state.days, "jour", "jours") + "</span></p>" +
        "</div>";
    }).join("");
  }

  function renderGearGroup() {
    var units = dayUnits();
    $("gear-group").innerHTML = availableGroupGear().map(function (g) {
      var qty = state.groupGear[g.id] || 0;
      return '<div class="gear-tile' + (qty ? " is-active" : "") + '">' +
        '<span class="icon-badge">' + icon(g.icon) + "</span>" +
        '<div class="gear-tile__body"><strong>' + esc(g.name) + "</strong><span>" + esc(g.desc) + "</span><em>" + euros(g.price) + " / jour</em></div>" +
        '<div class="stepper stepper--sm" role="group" aria-label="Quantité : ' + esc(g.name) + '">' +
        '<button type="button" data-group-gear="' + g.id + '" data-delta="-1" aria-label="Retirer"' + (qty <= 0 ? " disabled" : "") + ">" + icon("minus") + "</button>" +
        "<output>" + qty + "</output>" +
        '<button type="button" data-group-gear="' + g.id + '" data-delta="1" aria-label="Ajouter"' + (qty >= 12 ? " disabled" : "") + ">" + icon("plus") + "</button></div>" +
        '<p class="gear-tile__total">' + (qty ? euros(qty * g.price * units) : "") + "</p>" +
        "</div>";
    }).join("");
  }

  function renderLogistics() {
    var icons = { agence: "home", hebergement: "pin", depart: "truck" };
    $("logistics").innerHTML = D.logistics.map(function (l) {
      return '<label class="option-card option-card--compact">' +
        '<input class="sr-only" type="radio" name="logistics" value="' + l.id + '"' + (state.logistics === l.id ? " checked" : "") + ">" +
        '<span class="option-card__check" aria-hidden="true">' + icon("check") + "</span>" +
        '<span class="option-card__icon">' + icon(icons[l.id] || "pin") + "</span>" +
        '<span class="option-card__name">' + esc(l.name) + "</span>" +
        '<span class="option-card__desc">' + esc(l.desc) + "</span>" +
        '<span class="option-card__price">' + (l.price ? "+ " + euros(l.price) : "Gratuit") + "</span></label>";
    }).join("");
    var packs = computePrice().packs;
    $("deposit-note").innerHTML = "Caution&nbsp;: empreinte bancaire de " + euros(D.settings.deposit) + " par sac au retrait" + (packs ? " (soit " + euros(packs * D.settings.deposit) + " pour " + plural(packs, "sac", "sacs") + ")" : "") + ", non débitée si le matériel revient en bon état.";
  }

  /* ----- Étape 5 ----- */
  function participantsList() {
    return state.participants.map(function (p) {
      var prof = profile(p);
      var lv = effectiveLevel(p);
      var details = p.type === "child" ? ageLabel(p.age) : "adulte";
      return "<li><strong>" + esc(displayName(p)) + "</strong> — " + details + (prof.carried ? ", porté" : lv ? ", " + UI.levelLabel(Number(lv)).toLowerCase() : "") + "</li>";
    }).join("");
  }

  function gearList() {
    var items = [];
    var pack = D.packs[packType()];
    walkers().forEach(function (p) {
      var g = p.gear;
      var bits = [];
      if (g.pack) bits.push("sac tout prêt" + (g.size ? " (" + g.size + ")" : ""));
      if (g.shoes) bits.push("chaussures" + (g.shoeSize ? " (" + g.shoeSize + ")" : ""));
      if (g.poles) bits.push("bâtons");
      if (bits.length) items.push("<li><strong>" + esc(displayName(p)) + "</strong>&nbsp;: " + bits.join(", ") + "</li>");
    });
    availableGroupGear().forEach(function (g) {
      var qty = state.groupGear[g.id] || 0;
      if (qty) items.push("<li><strong>Groupe</strong>&nbsp;: " + esc(g.name.toLowerCase()) + " × " + qty + "</li>");
    });
    return items.length ? '<p class="small muted" style="margin:0 0 8px">' + esc(pack.name) + "</p><ul>" + items.join("") + "</ul>" : '<p class="muted">Aucun matériel loué.</p>';
  }

  function renderRecap() {
    var dest = D.destinations.filter(function (d) { return d.id === state.zone; })[0];
    var offer = offerById(state.offer);
    var route = D.itineraries.filter(function (it) { return it.id === state.route; })[0];
    var gl = groupLevel();
    var logi = D.logistics.filter(function (l) { return l.id === state.logistics; })[0];
    var price = computePrice();
    var interests = state.interests.length ? state.interests.join(", ") : "";
    var constraints = [];
    if (state.constraints.vertigo) constraints.push("vertige");
    if (state.constraints.dog) constraints.push("avec un chien");
    if (state.constraints.transit) constraints.push("sans voiture");

    var block = function (step, title, body) {
      return '<section class="recap-block"><header><h3>' + title + '</h3><button type="button" class="recap-edit" data-goto="' + step + '">' + icon("edit") + "Modifier</button></header>" + body + "</section>";
    };

    $("recap").innerHTML =
      '<div class="recap-grid">' +
      block(1, "Destination", "<p><strong>" + esc(dest ? dest.name : "—") + "</strong><br>" + esc(dest ? dest.region : "") + "</p>") +
      block(2, "Dates &amp; groupe",
        "<p><strong>" + esc(dateLabel()) + "</strong><br>" + (state.days > 1 ? (state.lodging === "bivouac" ? "Nuits en bivouac" : state.lodging === "gite" ? "Nuits en gîte / refuge" : "Hébergement à définir") + "<br>" : "") +
        "Niveau du groupe&nbsp;: " + UI.levelLabel(gl.level) + "</p><ul>" + participantsList() + "</ul>" +
        (interests ? '<p class="small muted" style="margin:8px 0 0">Envies&nbsp;: ' + esc(interests) + "</p>" : "") +
        (constraints.length ? '<p class="small muted" style="margin:4px 0 0">À noter&nbsp;: ' + constraints.join(", ") + "</p>" : "")) +
      block(3, "Itinéraire", "<p><strong>" + esc(offer.name) + "</strong><br>" + (route ? esc(route.name) + " · " + esc(route.start) : state.offer === "surmesure" ? "Itinéraire construit avec vous" : state.offer === "guide" ? "Itinéraire défini avec votre guide" : "Itinéraire personnel") + "</p>") +
      block(4, "Matériel &amp; retrait", gearList() + '<p class="small" style="margin:10px 0 0">' + icon("truck") + " " + esc(logi.name) + "</p>") +
      "</div>" +
      '<div class="price-box">' +
      "<h3>Estimation de votre tarif</h3>" +
      (price.lines.length
        ? '<table class="price-lines"><tbody>' + price.lines.map(function (l, i) {
          var head = i === 0 || price.lines[i - 1].cat !== l.cat ? '<tr class="price-lines__cat"><th colspan="2" scope="rowgroup">' + l.cat + "</th></tr>" : "";
          return head + '<tr><th scope="row">' + esc(l.label) + "</th><td>" + euros(l.amount) + "</td></tr>";
        }).join("") + "</tbody></table>"
        : '<p class="muted">Aucune prestation payante sélectionnée.</p>') +
      '<p class="price-box__total"><span>Total estimé TTC</span><strong>' + euros(price.total) + "</strong></p>" +
      (price.degressive ? '<p class="small muted" style="margin:0">Tarif dégressif inclus sur le matériel à partir du ' + D.settings.degressive.fromDay + "<sup>e</sup> jour.</p>" : "") +
      '<p class="small muted" style="margin:6px 0 0">Prix indicatif, confirmé par l\'équipe après vérification des disponibilités.</p>' +
      "</div>";
  }

  /* ----- Résumé latéral ----- */
  function renderSummary() {
    var dest = D.destinations.filter(function (d) { return d.id === state.zone; })[0];
    var offer = offerById(state.offer);
    var route = D.itineraries.filter(function (it) { return it.id === state.route; })[0];
    var price = computePrice(state.maxStep);
    var rows = [];
    rows.push(["pin", "Destination", dest ? dest.short : "À choisir"]);
    if (state.maxStep >= 2) {
      rows.push(["calendar", "Dates", state.date ? dateLabel() : state.days === 1 ? "1 journée" : state.days + " jours"]);
      rows.push(["users", "Groupe", groupLabel()]);
    }
    if (state.maxStep >= 3) {
      rows.push(["mountain", "Niveau", UI.levelLabel(groupLevel().level)]);
      rows.push(["route", "Itinéraire", (offer ? offer.name : "—") + (route ? " · " + route.name : "")]);
    }
    if (state.maxStep >= 4) {
      rows.push(["backpack", "Matériel", price.packs ? plural(price.packs, "sac tout prêt", "sacs tout prêts") : "Sans sac"]);
    }
    var html = '<dl class="summary__list">' + rows.map(function (r) {
      return "<div><dt>" + icon(r[0]) + r[1] + "</dt><dd>" + esc(r[2]) + "</dd></div>";
    }).join("") + "</dl>";
    if (state.maxStep >= 3 && price.lines.length) {
      html += '<ul class="summary__lines">' + price.lines.map(function (l) {
        return "<li><span>" + esc(l.label) + "</span><span>" + euros(l.amount) + "</span></li>";
      }).join("") + "</ul>";
    }
    if (state.maxStep >= 3) {
      html += '<p class="summary__total"><span>Total estimé</span><strong>' + euros(price.total) + "</strong></p>";
      html += '<p class="summary__fine">Aucun paiement en ligne. Prix TTC indicatif.</p>';
    } else {
      html += '<p class="summary__fine summary__fine--hint">' + icon("info") + "Le tarif estimé s'affiche au fil de vos choix.</p>";
    }
    html += '<button type="button" class="summary__reset" id="btn-reset">' + icon("refresh") + "Recommencer</button>";
    $("summary-content").innerHTML = html;
    $("summary-total-mobile").textContent = state.maxStep >= 3 ? euros(price.total) : "";
  }

  /* ======================================================================
     Navigation entre étapes
     ====================================================================== */
  function renderStep(n) {
    if (n === 1) renderDestinations();
    if (n === 2) {
      renderGroupStatic();
      renderParticipants();
    }
    if (n === 3) {
      renderGroupLevel();
      renderOffers();
      renderRoutes();
    }
    if (n === 4) {
      if (!state.groupGearTouched) state.groupGear = suggestGroupGear();
      renderPackIntro();
      renderGearPeople();
      renderGearGroup();
      renderLogistics();
    }
    if (n === 5) {
      renderRecap();
      ["firstName", "lastName", "email", "phone", "message"].forEach(function (k) {
        var el = form.querySelector('[data-bind="contact.' + k + '"]');
        if (el) el.value = state.contact[k] || "";
      });
      $("c-consent").checked = !!state.contact.consent;
    }
  }

  function goTo(n, opts) {
    opts = opts || {};
    state.step = n;
    state.maxStep = Math.max(state.maxStep, n);
    form.querySelectorAll(".wizard-step").forEach(function (sec) {
      sec.hidden = Number(sec.dataset.step) !== n;
    });
    hideError();
    renderStep(n);
    renderProgress();
    renderSummary();
    $("wizard-layout").classList.toggle("is-first-step", n === 1);
    $("btn-prev").hidden = n === 1;
    $("btn-next").hidden = n === 1;
    $("btn-next").innerHTML = n === 5 ? "Envoyer ma demande " + icon("arrow") : "Continuer " + icon("arrow");
    save();
    if (!opts.silent) {
      var top = $("wizard-progress").getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: top, behavior: "smooth" });
      var heading = $("step-" + n + "-title");
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  /* ----- Validation ----- */
  function showError(msg, focusEl) {
    var box = $("wizard-error");
    box.innerHTML = icon("alert") + "<span>" + msg + "</span>";
    box.hidden = false;
    if (focusEl) {
      focusEl.focus();
      if (focusEl.scrollIntoView) focusEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function hideError() {
    $("wizard-error").hidden = true;
    form.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
  }

  function markInvalid(el) {
    if (!el) return el;
    el.classList.add("is-invalid");
    el.setAttribute("aria-invalid", "true");
    return el;
  }

  function validate(n) {
    hideError();
    if (n === 1 && !state.zone) {
      showError("Choisissez une destination pour continuer.");
      return false;
    }
    if (n === 2) {
      if (!state.date) {
        showError("Indiquez votre date de départ.", markInvalid($("f-date")));
        return false;
      }
      if (state.date < tomorrowIso()) {
        showError("La date de départ doit être au plus tôt demain.", markInvalid($("f-date")));
        return false;
      }
      for (var i = 0; i < state.participants.length; i++) {
        var p = state.participants[i];
        if (p.type === "child" && (p.age === null || p.age === "")) {
          showError("Indiquez l'âge de «&nbsp;" + esc(displayName(p)) + "&nbsp;».", markInvalid($("age-" + p.id)));
          return false;
        }
        var prof = profile(p);
        if (!prof.carried && prof.key !== "petit" && !p.level) {
          var first = form.querySelector('input[name="level-' + p.id + '"]');
          if (first) first.closest(".seg").classList.add("is-invalid");
          showError("Sélectionnez le niveau de randonnée de «&nbsp;" + esc(displayName(p)) + "&nbsp;».", first);
          return false;
        }
      }
    }
    if (n === 3) {
      var offer = offerById(state.offer);
      if (!offer) {
        showError("Choisissez une formule de préparation.");
        return false;
      }
      if (offer.requiresRoute && !state.route) {
        var hasRoutes = evaluateRoutes().some(function (e) { return e.ok; });
        showError(hasRoutes
          ? "La formule Road-book nécessite de choisir un itinéraire ci-dessous."
          : "Aucun itinéraire prêt ne correspond à votre groupe&nbsp;: choisissez la formule sur mesure ou accompagnée.");
        return false;
      }
    }
    if (n === 5) {
      var fields = ["c-first", "c-last", "c-email", "c-phone"];
      for (var j = 0; j < fields.length; j++) {
        var el = $(fields[j]);
        if (!el.value.trim() || !el.checkValidity()) {
          var label = form.querySelector('label[for="' + fields[j] + '"]').textContent;
          showError(el.value.trim() ? "Vérifiez le champ «&nbsp;" + label + "&nbsp;»." : "Le champ «&nbsp;" + label + "&nbsp;» est obligatoire.", markInvalid(el));
          return false;
        }
      }
      if (!$("c-consent").checked) {
        showError("Merci d'accepter l'utilisation de vos données pour traiter la demande.", $("c-consent"));
        return false;
      }
    }
    return true;
  }

  /* ----- Envoi ----- */
  function reference() {
    var d = new Date();
    return "SP-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function payload(ref) {
    var price = computePrice();
    var dest = D.destinations.filter(function (d) { return d.id === state.zone; })[0];
    var route = D.itineraries.filter(function (it) { return it.id === state.route; })[0];
    return {
      reference: ref,
      destination: dest ? dest.name : "",
      dates: dateLabel(),
      duree_jours: state.days,
      hebergement: state.days > 1 ? state.lodging : "",
      niveau_groupe: UI.levelLabel(groupLevel().level),
      participants: state.participants.map(function (p) {
        return {
          prenom: displayName(p),
          type: p.type === "adult" ? "adulte" : "enfant",
          age: p.age,
          niveau: effectiveLevel(p) ? UI.levelLabel(Number(effectiveLevel(p))) : "porté",
          materiel: p.gear
        };
      }),
      envies: state.interests,
      contraintes: state.constraints,
      remarques: state.notes,
      formule: offerById(state.offer).name,
      itineraire: route ? route.name : "",
      materiel_groupe: state.groupGear,
      retrait: state.logistics,
      lignes: price.lines,
      total_estime: price.total,
      contact: state.contact
    };
  }

  function submit() {
    var btn = $("btn-next");
    var ref = reference();
    var data = payload(ref);
    var endpoint = D.settings.formEndpoint;
    btn.disabled = true;
    btn.textContent = "Envoi en cours…";
    var finish = function () {
      showDone(ref, data);
    };
    if (endpoint) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          finish();
        })
        .catch(function () {
          btn.disabled = false;
          btn.innerHTML = "Envoyer ma demande " + icon("arrow");
          showError("L'envoi a échoué. Réessayez ou écrivez-nous à <a href=\"mailto:" + D.settings.email + "\">" + D.settings.email + "</a>.");
        });
    } else {
      window.setTimeout(finish, 600);
    }
  }

  function showDone(ref, data) {
    var done = $("wizard-done");
    var recapHtml = $("recap").innerHTML;
    $("wizard-layout").hidden = true;
    document.querySelector(".wizard-progress").hidden = true;
    done.innerHTML =
      '<div class="done-card">' +
      '<span class="icon-badge icon-badge--orange done-card__icon">' + icon("check") + "</span>" +
      '<p class="eyebrow" style="justify-content:center">Demande envoyée</p>' +
      "<h2>Merci " + esc(state.contact.firstName) + ", votre randonnée se prépare&nbsp;!</h2>" +
      '<p class="lead">Nous avons bien reçu votre demande <strong>' + ref + "</strong>. L'équipe Sac'pré vérifie les disponibilités et vous recontacte rapidement à l'adresse <strong>" + esc(state.contact.email) + "</strong>.</p>" +
      '<div class="btn-row" style="justify-content:center">' +
      '<button type="button" class="btn btn--ghost" id="btn-print">' + icon("printer") + "Imprimer le récapitulatif</button>" +
      '<a class="btn" href="index.html">Retour à l\'accueil</a></div></div>' +
      '<div class="done-recap">' + recapHtml.replace(/<button[^>]*class="recap-edit"[\s\S]*?<\/button>/g, "") + "</div>";
    done.hidden = false;
    done.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    clearSaved();
    $("btn-print").addEventListener("click", function () { window.print(); });
    if (window.console && !D.settings.formEndpoint) {
      window.console.info("[Sac'pré] Demande simulée (aucun formEndpoint configuré) :", data);
    }
  }

  /* ======================================================================
     Événements
     ====================================================================== */
  function findParticipant(id) {
    return state.participants.filter(function (p) { return p.id === id; })[0];
  }

  function setPath(obj, path, value) {
    var keys = path.split(".");
    var last = keys.pop();
    keys.forEach(function (k) { obj = obj[k]; });
    obj[last] = value;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate(state.step)) return;
    if (state.step < 5) goTo(state.step + 1);
    else submit();
  });

  $("btn-prev").addEventListener("click", function () {
    if (state.step > 1) goTo(state.step - 1);
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    var go = t.closest("[data-goto]");
    if (go) {
      goTo(Number(go.dataset.goto));
      return;
    }
    if (t.closest("#btn-reset")) {
      if (window.confirm("Effacer votre saisie et recommencer ?")) {
        clearSaved();
        state = defaultState();
        showAllRoutes = false;
        goTo(1);
      }
      return;
    }
    var zone = t.closest("[data-zone]");
    if (zone) {
      state.zone = zone.dataset.zone;
      goTo(2);
      return;
    }
    var counter = t.closest("[data-counter] [data-delta]");
    if (counter) {
      var type = counter.closest("[data-counter]").dataset.counter;
      var delta = Number(counter.dataset.delta);
      if (delta > 0 && state.participants.length < D.settings.maxParticipants) {
        state.participants.push(newParticipant(type));
      } else if (delta < 0) {
        var list = type === "adult" ? adults() : children();
        var min = type === "adult" ? 1 : 0;
        if (list.length > min) state.participants.splice(state.participants.indexOf(list[list.length - 1]), 1);
      }
      state.groupGearTouched = false;
      renderParticipants();
      renderSummary();
      save();
      return;
    }
    var chip = t.closest("[data-interest]");
    if (chip) {
      var val = chip.dataset.interest;
      var idx = state.interests.indexOf(val);
      if (idx === -1) state.interests.push(val);
      else state.interests.splice(idx, 1);
      chip.setAttribute("aria-pressed", String(idx === -1));
      save();
      return;
    }
    if (t.closest("#toggle-routes")) {
      showAllRoutes = !showAllRoutes;
      renderRoutes();
      return;
    }
    var gg = t.closest("[data-group-gear]");
    if (gg) {
      var gid = gg.dataset.groupGear;
      state.groupGear[gid] = Math.max(0, Math.min(12, (state.groupGear[gid] || 0) + Number(gg.dataset.delta)));
      state.groupGearTouched = true;
      renderGearGroup();
      renderSummary();
      save();
      var again = $("gear-group").querySelector('[data-group-gear="' + gid + '"][data-delta="' + gg.dataset.delta + '"]');
      if (again && !again.disabled) again.focus();
      return;
    }
    var toggle = t.closest(".summary-toggle");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      $("summary").classList.toggle("is-open", open);
    }
  });

  function handleField(e) {
    var el = e.target;
    el.classList.remove("is-invalid");
    el.removeAttribute("aria-invalid");

    if (el.dataset.bind) {
      var value = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.type === "number") value = Number(value);
      setPath(state, el.dataset.bind, value);
      if (el.dataset.bind === "days") {
        $("lodging-field").hidden = state.days <= 1;
        state.groupGearTouched = false;
      }
      if (el.dataset.bind === "lodging") state.groupGearTouched = false;
      renderSummary();
      save();
      return;
    }

    if (el.dataset.pid && el.dataset.field) {
      var p = findParticipant(el.dataset.pid);
      if (!p) return;
      if (el.dataset.field === "name") {
        p.name = el.value;
        var title = el.closest(".participant").querySelector(".participant__title strong");
        if (title) title.textContent = displayName(p);
      } else if (el.dataset.field === "age") {
        p.age = el.value === "" ? null : Number(el.value);
        if (profile(p).price === "child" && ["XS", "S", "M", "L", "XL", "XXL"].indexOf(p.gear.size) !== -1) p.gear.size = "";
        state.groupGearTouched = false;
        renderParticipants();
        var sel = $("age-" + p.id);
        if (sel) sel.focus();
      } else if (el.dataset.field === "level") {
        p.level = Number(el.value);
        var seg = el.closest(".seg");
        if (seg) seg.classList.remove("is-invalid");
      }
      renderSummary();
      save();
      return;
    }

    if (el.dataset.pid && el.dataset.gear) {
      var q = findParticipant(el.dataset.pid);
      if (!q) return;
      var key = el.dataset.gear;
      q.gear[key] = el.type === "checkbox" ? el.checked : el.value;
      renderGearPeople();
      renderLogistics();
      renderSummary();
      save();
      var same = $("gear-people").querySelector('[data-pid="' + q.id + '"][data-gear="' + key + '"]');
      if (same) same.focus();
      return;
    }

    if (el.name === "offer") {
      state.offer = el.value;
      renderRoutes();
      renderSummary();
      save();
      return;
    }
    if (el.name === "route") {
      state.route = el.value;
      renderSummary();
      save();
      return;
    }
    if (el.name === "logistics") {
      state.logistics = el.value;
      renderSummary();
      save();
    }
  }

  form.addEventListener("change", handleField);
  form.addEventListener("input", function (e) {
    if (e.target.matches("input[type=text], input:not([type]), input[type=email], input[type=tel], textarea")) handleField(e);
  });

  /* ======================================================================
     Démarrage
     ====================================================================== */
  var params = new URLSearchParams(window.location.search);
  var zoneParam = params.get("zone");
  var routeParam = params.get("itineraire");
  var offerParam = params.get("formule");
  var startStep = state.step || 1;

  if (zoneParam && D.destinations.some(function (d) { return d.id === zoneParam && d.available; })) {
    state.zone = zoneParam;
    if (startStep < 2) startStep = 2;
  }
  if (offerParam && offerById(offerParam)) state.offer = offerParam;
  if (routeParam && D.itineraries.some(function (it) { return it.id === routeParam; })) {
    state.route = routeParam;
    var it = D.itineraries.filter(function (x) { return x.id === routeParam; })[0];
    state.zone = it.zone;
    if (state.days < it.days[0] || state.days > it.days[1]) state.days = it.days[0];
    if (it.lodging === "bivouac") state.lodging = "bivouac";
    if (startStep < 2) startStep = 2;
  }
  if (!state.zone) startStep = 1;
  if (params.toString() && window.history.replaceState) {
    window.history.replaceState(null, "", window.location.pathname);
  }

  state.maxStep = Math.max(state.maxStep || 1, startStep);
  goTo(startStep, { silent: true });
})();
