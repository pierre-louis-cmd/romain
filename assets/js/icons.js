/* Sac'pré — sprite d'icônes (trait 2 px), injecté en début de page.
   Utilisation : <svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg> */
(function () {
  "use strict";
  var icons = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "chevron-left": '<path d="M15 6l-6 6 6 6"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    backpack: '<path d="M9 5V4a3 3 0 0 1 6 0v1"/><path d="M5 11a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8z"/><path d="M8.5 14h7v4h-7z"/><path d="M9 10h6"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mountain: '<path d="M3 20l6.5-11 4 6.5 2.5-4L21 20H3z"/>',
    elevation: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    distance: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l7-7"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    alert: '<path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    tent: '<path d="M3 20L12 4l9 16H3z"/><path d="M9.5 20L12 14l2.5 6"/>',
    boot: '<path d="M7 3h6v7l5 2.5a3 3 0 0 1 2 2.7V18H4v-3l3-2V3z"/><path d="M4 18v2h16v-2M10 7h3M10 10h3"/>',
    poles: '<path d="M8 3l-3 18M16 3l3 18"/><path d="M6.5 7h3M14.5 7h3"/>',
    stove: '<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1.5 1 2.5 2 2.5 0-3-1-5 0-7z"/><path d="M5 21h14"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    baby: '<circle cx="12" cy="7" r="3.5"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/>',
    gps: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/><path d="M6 6V5a1 1 0 0 1 1-1h10"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    heart: '<path d="M12 20s-7.5-4.6-9-9.3C1.9 7 4.3 4 7.5 4c2 0 3.5 1.2 4.5 2.7C13 5.2 14.5 4 16.5 4 19.7 4 22.1 7 21 10.7 19.5 15.4 12 20 12 20z"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    guide: '<circle cx="12" cy="5" r="2.5"/><path d="M10 21l1-7-3-2 1.5-4h5L16 12l-2 2 1 7"/><path d="M18 8l1.5 13"/>'
  };

  var symbols = Object.keys(icons).map(function (name) {
    return '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + icons[name] + "</symbol>";
  }).join("");

  var holder = document.createElement("div");
  holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">' + symbols + "</svg>";
  document.body.insertBefore(holder.firstChild, document.body.firstChild);
  document.documentElement.classList.remove("no-js");
})();
