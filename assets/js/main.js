/* ==========================================================================
   Sac'pré — comportements communs à toutes les pages
   ========================================================================== */
(function () {
  "use strict";

  var D = window.SACPRE;

  /* ---------- En-tête : ombre au défilement ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Fermer le menu" : "Ouvrir le menu";
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) setOpen(false);
    });
  }

  /* ---------- Apparition au défilement ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Année du pied de page ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Illustrations ---------- */
  if (window.SACPRE_ART) window.SACPRE_ART.hydrate();

  /* ---------- Helpers partagés ---------- */
  function levelDots(n, max) {
    var out = '<span class="level-dots" aria-hidden="true">';
    for (var i = 1; i <= (max || 3); i++) out += '<i class="' + (i <= n ? "on" : "") + '"></i>';
    return out + "</span>";
  }

  function levelLabel(n) {
    var l = D && D.levels.filter(function (x) { return x.id === n; })[0];
    return l ? l.label : "";
  }

  function daysLabel(it) {
    if (it.days[0] === 1 && it.days[1] === 1) return "Journée";
    if (it.days[0] === it.days[1]) return it.days[0] + " jours";
    return it.days[0] + " à " + it.days[1] + " jours";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function routeCard(it, opts) {
    opts = opts || {};
    var tag = opts.selectable ? "label" : "article";
    var input = opts.selectable
      ? '<input class="sr-only" type="radio" name="' + opts.name + '" value="' + it.id + '"' + (opts.checked ? " checked" : "") + (opts.disabled ? " disabled" : "") + ">"
      : "";
    var flags = "";
    if (opts.badge) flags += '<span class="route-card__flag">' + opts.badge + "</span>";
    return (
      "<" + tag + ' class="route-card' + (opts.extraClass ? " " + opts.extraClass : "") + '" data-level="' + it.level + '">' +
      input +
      '<div class="route-card__art" data-art="' + it.id + '" data-art-label="Illustration : ' + escapeHtml(it.name) + '">' + "</div>" +
      '<span class="level-pill">' + levelDots(it.level) + levelLabel(it.level) + "</span>" +
      '<span class="days-pill">' + daysLabel(it) + "</span>" +
      flags +
      '<div class="route-card__body">' +
      "<h3>" + escapeHtml(it.name) + "</h3>" +
      '<p class="route-card__start">Départ&nbsp;: ' + escapeHtml(it.start) + "</p>" +
      '<ul class="route-meta">' +
      '<li><svg class="i" aria-hidden="true"><use href="#i-distance"/></svg>' + it.distance + " km" + (it.perDay ? "/jour" : "") + "</li>" +
      '<li><svg class="i" aria-hidden="true"><use href="#i-elevation"/></svg>' + it.elevation.toLocaleString("fr-FR") + " m D+" + (it.perDay ? "/jour" : "") + "</li>" +
      '<li><svg class="i" aria-hidden="true"><use href="#i-clock"/></svg>' + it.duration + "</li>" +
      "</ul>" +
      '<p class="route-card__desc">' + escapeHtml(it.desc) + "</p>" +
      '<ul class="tags">' + it.tags.map(function (t) { return '<li class="tag">' + escapeHtml(t) + "</li>"; }).join("") +
      '<li class="tag">Dès ' + it.minAge + " ans</li></ul>" +
      (opts.footer || "") +
      "</div></" + tag + ">"
    );
  }

  function euros(n) {
    var rounded = Math.round(n * 100) / 100;
    return rounded.toLocaleString("fr-FR", { minimumFractionDigits: rounded % 1 ? 2 : 0, maximumFractionDigits: 2 }) + "\u00a0€";
  }

  window.SACPRE_UI = { levelDots: levelDots, levelLabel: levelLabel, daysLabel: daysLabel, routeCard: routeCard, escapeHtml: escapeHtml, euros: euros };

  if (!D) return;

  /* ---------- Prix affichés dans les pages (data-price="packs.journee.adult") ---------- */
  document.querySelectorAll("[data-price]").forEach(function (el) {
    var value = el.dataset.price.split(".").reduce(function (obj, key) {
      if (!obj) return undefined;
      if (Array.isArray(obj)) return obj.filter(function (x) { return x.id === key; })[0];
      return obj[key];
    }, D);
    if (typeof value === "number") el.textContent = euros(value);
  });

  /* ---------- Page Location : packs & matériel à la carte ---------- */
  var packsList = document.getElementById("packs-list");
  if (packsList) {
    packsList.innerHTML = ["journee", "gite", "bivouac"].map(function (key, i) {
      var p = D.packs[key];
      var featured = key === "journee";
      return '<article class="card pricing-card' + (featured ? " pricing-card--featured" : "") + ' reveal is-visible">' +
        (featured ? '<span class="ribbon">Le plus loué</span>' : "") +
        '<p class="eyebrow" style="margin-bottom:6px">' + (key === "journee" ? "1 journée" : key === "gite" ? "Itinérance en gîte" : "Itinérance en bivouac") + "</p>" +
        "<h3>" + escapeHtml(p.name.replace("Sac tout prêt — ", "Pack ")) + "</h3>" +
        '<p style="margin:0">Sac de ' + p.volume + ", rempli et ajusté.</p>" +
        '<p class="price"><small>adulte</small>' + euros(p.adult) + ' <span>/ jour</span></p>' +
        '<p style="margin:-8px 0 16px;font-weight:600">Enfant&nbsp;: ' + euros(p.child) + " / jour</p>" +
        '<ul class="check-list">' + p.contents.map(function (c) { return "<li>" + escapeHtml(c) + "</li>"; }).join("") + "</ul>" +
        '<a class="btn ' + (featured ? "btn--primary" : "btn--ghost") + ' btn--block" href="reserver.html">Réserver ce pack</a>' +
        "</article>";
    }).join("");
  }

  var gearTable = document.getElementById("gear-table");
  if (gearTable) {
    gearTable.innerHTML = D.gear.map(function (g) {
      return "<tr><td><strong>" + escapeHtml(g.name) + '</strong><span class="muted">' + escapeHtml(g.desc) + "</span></td>" +
        "<td>" + (g.scope === "person" ? "Par personne" : "Pour le groupe") + (g.bivouacOnly ? '<span class="muted">Itinérance en bivouac</span>' : "") + "</td>" +
        "<td><strong>" + euros(g.price) + "</strong> / jour</td></tr>";
    }).join("");
  }

  /* ---------- Page Itinéraires : formules & niveaux ---------- */
  var offersList = document.getElementById("offers-list");
  if (offersList) {
    offersList.innerHTML = D.routeOffers.filter(function (o) { return o.price > 0; }).map(function (o) {
      return '<article class="card pricing-card' + (o.featured ? " pricing-card--featured" : "") + '">' +
        (o.featured ? '<span class="ribbon">Le plus choisi</span>' : "") +
        '<span class="icon-badge' + (o.featured ? " icon-badge--orange" : "") + '"><svg class="i" aria-hidden="true"><use href="#i-' + (o.id === "roadbook" ? "map" : o.id === "guide" ? "guide" : "compass") + '"/></svg></span>' +
        "<h3>" + escapeHtml(o.name) + "</h3>" +
        '<p style="margin:0">' + escapeHtml(o.desc) + "</p>" +
        '<p class="price">' + euros(o.price) + " <span>" + escapeHtml(o.unit) + "</span></p>" +
        '<ul class="check-list">' + o.features.map(function (f) { return "<li>" + escapeHtml(f) + "</li>"; }).join("") + "</ul>" +
        '<a class="btn ' + (o.featured ? "btn--primary" : "btn--ghost") + ' btn--block" href="reserver.html?zone=vercors&amp;formule=' + o.id + '">Choisir cette formule</a>' +
        "</article>";
    }).join("");
  }

  var levelsList = document.getElementById("levels-list");
  if (levelsList) {
    levelsList.innerHTML = D.levels.map(function (l) {
      return '<li class="level">' + levelDots(l.id, 4) + "<h4>" + escapeHtml(l.label) + "</h4><p>" + escapeHtml(l.desc) + "</p></li>";
    }).join("");
  }

  /* ---------- Page Itinéraires : liste filtrable ---------- */
  var routeList = document.getElementById("route-list");
  if (routeList && D) {
    var filterBtns = document.querySelectorAll("[data-filter-level]");
    var renderRoutes = function (level) {
      var list = D.itineraries.filter(function (it) {
        return it.zone === "vercors" && (level === "all" || String(it.level) === level);
      });
      routeList.innerHTML = list.map(function (it) {
        return routeCard(it, {
          footer: '<a class="link-arrow" style="margin-top:auto;padding-top:6px" href="reserver.html?zone=vercors&amp;itineraire=' + it.id + '">Choisir cet itinéraire <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></a>'
        });
      }).join("");
      window.SACPRE_ART.hydrate(routeList);
    };
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        renderRoutes(btn.dataset.filterLevel);
      });
    });
    renderRoutes("all");
  }

  /* ---------- Formulaire de contact ---------- */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    var params = new URLSearchParams(window.location.search);
    var sujet = params.get("sujet");
    var subjectField = contactForm.querySelector("[name=sujet]");
    var messageField = contactForm.querySelector("[name=message]");
    if (sujet && sujet.indexOf("alerte-") === 0 && D) {
      var dest = D.destinations.filter(function (d) { return d.id === sujet.slice(7); })[0];
      if (dest && subjectField) {
        subjectField.value = "alerte";
        messageField.value = "Bonjour, je souhaite être prévenu(e) de l'ouverture de la destination « " + dest.short + " ».";
      }
    } else if (sujet && subjectField && subjectField.querySelector('option[value="' + sujet + '"]')) {
      subjectField.value = sujet;
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      contactForm.querySelectorAll("[required]").forEach(function (field) {
        var valid = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
        field.classList.toggle("is-invalid", !valid);
        field.setAttribute("aria-invalid", String(!valid));
        if (!valid && ok) {
          field.focus();
          ok = false;
        }
      });
      if (!ok) return;
      var data = new FormData(contactForm);
      var errorBox = document.getElementById("contact-error");
      var done = function () {
        contactForm.hidden = true;
        var success = document.getElementById("contact-success");
        success.hidden = false;
        success.focus();
      };
      var endpoint = D && D.settings.formEndpoint;
      if (endpoint) {
        fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
          .then(function (res) {
            if (!res.ok) throw new Error(res.status);
            done();
          })
          .catch(function () {
            if (errorBox) errorBox.hidden = false;
          });
      } else {
        done();
      }
    });
  }
})();
