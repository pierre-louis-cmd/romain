/* ==========================================================================
   Sac'pré — illustrations vectorielles (style du logo : soleil orange,
   reliefs verts, neige crème). Génère des SVG pour les destinations et
   les itinéraires.
   ========================================================================== */
(function () {
  "use strict";

  var C = {
    far: "#a9c9a4",
    farPale: "#c9dcc4",
    mid: "#2f7d4a",
    midDark: "#1d6a3c",
    front: "#0b4123",
    snow: "#f7f5e6",
    sun: "#f48312",
    lake: "#cfe3d6"
  };

  var DAY = ["#fdf1dc", "#f8cf98"];

  var scenes = {
    vercors: {
      sky: ["#fdf1dc", "#f9c98e"],
      sun: [214, 92, 54],
      layers: [
        [C.far, "0,148 30,140 60,118 120,114 140,126 300,120 330,100 380,98 400,104"],
        [C.mid, "0,186 70,178 130,170 160,164 172,104 178,96 236,94 242,100 250,166 290,172 350,178 400,184"],
        [C.front, "0,206 60,198 120,208 190,200 260,210 330,199 400,206"]
      ],
      cliffs: [[176, 104, 170, 160], [186, 100, 182, 150], [240, 100, 247, 162], [228, 98, 232, 140]],
      trees: [16, 32, 48, 64, 296, 312, 330, 348, 366, 384]
    },
    chartreuse: {
      sky: ["#fcf3e2", "#f6d6a8"],
      sun: [96, 96, 38],
      layers: [
        [C.far, "0,160 50,142 100,150 150,134 200,146 250,130 300,142 350,128 400,140"],
        [C.mid, "0,192 80,172 150,150 210,124 250,108 272,102 278,108 282,176 340,184 400,188"],
        [C.front, "0,212 70,204 140,214 220,204 300,214 400,204"]
      ],
      cliffs: [[278, 110, 281, 170]],
      trees: [10, 24, 38, 52, 118, 134, 150, 318, 334, 350, 366, 382]
    },
    belledonne: {
      sky: ["#fdf6e8", "#f7ddb8"],
      sun: [322, 70, 34],
      layers: [
        [C.far, "0,150 30,132 45,140 70,106 85,120 100,96 120,118 150,90 170,112 200,80 222,108 250,92 275,118 300,100 330,124 360,108 400,128"],
        [C.mid, "0,186 70,166 130,176 200,160 260,174 330,158 400,170"]
      ],
      snow: [[70, 106, 9], [100, 96, 10], [150, 90, 11], [200, 80, 12], [250, 92, 10], [300, 100, 9], [360, 108, 8]],
      lake: [210, 199, 84, 8],
      front: [C.front, "0,212 60,204 110,210 150,214 270,214 320,204 400,210"],
      trees: [14, 30, 46, 330, 346, 362, 378, 394]
    },
    ecrins: {
      sky: ["#fcefd9", "#f6cf9c"],
      sun: [72, 74, 30],
      layers: [
        [C.far, "0,172 40,150 70,160 110,120 135,132 165,78 180,92 196,62 212,90 232,72 256,108 290,96 330,128 370,118 400,130"],
        [C.mid, "0,196 60,180 120,188 180,172 240,186 300,170 360,182 400,176"],
        [C.front, "0,214 80,206 160,214 240,204 320,214 400,206"]
      ],
      snow: [[110, 120, 10], [165, 78, 14], [196, 62, 16], [232, 72, 14], [290, 96, 11], [370, 118, 8]],
      trees: [20, 36, 52, 300, 316, 332, 348, 364]
    },
    montblanc: {
      sky: ["#fdf4e4", "#f8d9ae"],
      sun: [330, 62, 34],
      layers: [
        [C.far, "0,168 50,150 100,128 140,108 175,90 205,80 240,86 280,106 320,126 360,140 400,152"],
        [C.mid, "0,194 50,178 100,186 160,170 220,184 280,168 340,182 400,174"],
        [C.front, "0,214 70,206 150,214 230,204 310,214 400,206"]
      ],
      snowPoly: "112,124 140,108 175,90 205,80 240,86 280,106 266,110 250,102 236,112 218,100 200,112 182,102 166,114 148,108 130,120",
      trees: [14, 30, 46, 62, 320, 336, 352, 368, 384]
    },
    pyrenees: {
      sky: ["#fceeda", "#f4c690"],
      sun: [200, 104, 46],
      layers: [
        [C.far, "0,150 40,126 80,138 120,104 160,128 200,112 240,124 280,96 320,120 360,108 400,118"],
        [C.mid, "0,188 50,170 100,180 150,164 200,176 250,160 300,174 350,162 400,172"],
        [C.front, "0,214 80,204 160,212 240,204 320,214 400,206"]
      ],
      snow: [[120, 104, 9], [280, 96, 10]],
      trees: [18, 34, 50, 140, 156, 300, 316, 332, 348, 364, 380]
    },

    /* --- Itinéraires du Vercors --- */
    moliere: {
      sky: DAY,
      sun: [300, 78, 36],
      layers: [
        [C.farPale, "0,150 40,138 70,142 100,120 120,134 150,112 175,130 210,108 240,128 280,116 320,134 360,122 400,136"],
        ["#3e8a4f", "0,182 120,176 260,180 400,174"],
        [C.front, "0,214 120,208 260,214 400,206"]
      ],
      snow: [[100, 120, 8], [150, 112, 9], [210, 108, 9], [280, 116, 8]],
      trees: [24, 40, 340, 356, 372]
    },
    archiane: {
      sky: ["#fdf3e0", "#f7d3a0"],
      sun: [300, 58, 30],
      layers: [
        [C.far, "0,130 400,124"],
        [C.mid, "0,190 22,182 38,98 90,86 150,82 210,80 270,84 330,90 360,102 378,182 400,188"],
        [C.front, "0,212 90,204 180,212 270,206 400,212"]
      ],
      cliffs: [[42, 104, 30, 170], [62, 94, 56, 160], [354, 104, 366, 170], [336, 96, 346, 150]],
      trees: [120, 136, 152, 168, 230, 246, 262]
    },
    "etoile-villard": {
      sky: DAY,
      sun: [92, 80, 34],
      layers: [
        [C.far, "0,140 60,124 110,132 170,112 230,128 300,110 360,126 400,118"],
        ["#3e8a4f", "0,188 80,176 160,182 240,172 320,180 400,174"],
        [C.front, "0,214 80,208 160,214 240,206 320,212 400,206"]
      ],
      houses: [[170, 178], [192, 176], [214, 178], [236, 174]],
      trees: [20, 36, 52, 300, 316, 332, 348, 364, 380]
    },
    moucherotte: {
      sky: ["#fdf0da", "#f6c88c"],
      sun: [110, 84, 40],
      layers: [
        [C.farPale, "0,150 60,140 120,146 200,134 280,140 400,132"],
        [C.mid, "0,196 80,170 160,132 220,100 262,82 300,96 340,126 400,150"],
        [C.front, "0,214 80,206 160,212 240,202 320,212 400,206"]
      ],
      antenna: [262, 82],
      trees: [16, 32, 48, 64, 80, 330, 346, 362, 378]
    },
    "pic-saint-michel": {
      sky: DAY,
      sun: [310, 70, 32],
      layers: [
        [C.farPale, "0,140 80,128 160,138 240,124 320,134 400,126"],
        [C.mid, "0,190 50,170 100,140 140,104 156,92 172,104 220,128 280,140 340,156 400,166"],
        [C.front, "0,214 70,204 150,212 230,204 310,212 400,204"]
      ],
      trees: [200, 216, 232, 248, 264, 280, 300, 316]
    },
    "vercors-nord": {
      sky: ["#fdf2de", "#f9d2a0"],
      sun: [260, 112, 44],
      layers: [
        [C.far, "0,150 70,138 140,146 210,130 280,142 350,128 400,136"],
        ["#3e8a4f", "0,180 60,168 130,176 200,164 270,172 340,160 400,168"],
        [C.front, "0,212 70,202 140,210 210,200 280,210 350,200 400,206"]
      ],
      trees: [8, 22, 36, 50, 64, 78, 120, 134, 148, 190, 204, 218, 300, 314, 328, 342, 356, 370, 384]
    },
    "tour-mont-aiguille": { ref: "vercors" },
    "grand-veymont": {
      sky: ["#fdf3e2", "#f8cf98"],
      sun: [96, 70, 30],
      layers: [
        [C.far, "0,150 30,146 40,118 58,116 66,146 120,150 400,142"],
        [C.mid, "0,196 70,172 140,140 200,100 236,78 258,86 300,112 360,140 400,150"],
        [C.front, "0,214 90,206 180,212 270,204 360,212 400,208"]
      ],
      cliffs: [[240, 86, 262, 140], [214, 96, 226, 130]],
      trees: [16, 32, 48, 340, 356, 372, 388]
    },
    "hauts-plateaux": {
      sky: ["#0d3220", "#2b5a3c"],
      moon: [320, 56, 18],
      stars: [[40, 30], [80, 58], [130, 24], [170, 70], [210, 36], [250, 18], [280, 82], [360, 96], [110, 92], [20, 80], [380, 30], [230, 96]],
      layers: [
        ["#3f6b4c", "0,150 60,132 120,128 200,130 280,126 340,132 400,140"],
        ["#24543a", "0,180 400,176"],
        ["#0a2d19", "0,212 100,206 200,212 300,204 400,210"]
      ],
      tent: [170, 194],
      trees: [20, 36, 52, 330, 346, 362, 378],
      treeColor: "#0a2d19"
    }
  };

  var uid = 0;

  function pts(str) {
    return str.split(" ").map(function (p) {
      return p.split(",").map(Number);
    });
  }

  function layerPath(str) {
    var p = pts(str);
    var d = "M0 240 L" + p.map(function (q) { return q[0] + " " + q[1]; }).join(" L") + " L400 240 Z";
    return d;
  }

  function yAt(str, x) {
    var p = pts(str);
    for (var i = 0; i < p.length - 1; i++) {
      if (x >= p[i][0] && x <= p[i + 1][0]) {
        var t = (x - p[i][0]) / (p[i + 1][0] - p[i][0] || 1);
        return p[i][1] + t * (p[i + 1][1] - p[i][1]);
      }
    }
    return p[p.length - 1][1];
  }

  function pine(x, base, h, color) {
    var w = h * 0.42;
    var parts = [];
    for (var i = 0; i < 3; i++) {
      var top = base - h + i * h * 0.26;
      var bw = w * (0.55 + i * 0.25);
      var bottom = top + h * 0.42;
      parts.push((x) + "," + top + " " + (x - bw) + "," + bottom + " " + (x + bw) + "," + bottom);
    }
    return parts.map(function (pp) {
      return '<polygon points="' + pp + '" fill="' + color + '"/>';
    }).join("") + '<rect x="' + (x - 1.2) + '" y="' + (base - 2) + '" width="2.4" height="6" fill="' + color + '"/>';
  }

  function snowCap(x, y, s) {
    return '<polygon points="' + [
      x + "," + y,
      (x + s) + "," + (y + s * 1.05),
      (x + s * 0.45) + "," + (y + s * 0.8),
      (x + s * 0.1) + "," + (y + s * 1.1),
      (x - s * 0.35) + "," + (y + s * 0.78),
      (x - s) + "," + (y + s * 1.05)
    ].join(" ") + '" fill="' + C.snow + '"/>';
  }

  function render(name, label) {
    var s = scenes[name] || scenes.vercors;
    if (s.ref) s = scenes[s.ref];
    var id = "sp-art-" + (++uid);
    var out = [];
    out.push('<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (label || "Illustration de montagne") + '">');
    out.push('<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.sky[0] + '"/><stop offset="1" stop-color="' + s.sky[1] + '"/></linearGradient></defs>');
    out.push('<rect width="400" height="240" fill="url(#' + id + ')"/>');

    if (s.stars) {
      s.stars.forEach(function (st, i) {
        out.push('<circle cx="' + st[0] + '" cy="' + st[1] + '" r="' + (i % 3 === 0 ? 1.6 : 1) + '" fill="#f7f5e6" opacity="' + (i % 2 ? 0.6 : 0.95) + '"/>');
      });
    }
    if (s.moon) {
      out.push('<circle cx="' + s.moon[0] + '" cy="' + s.moon[1] + '" r="' + s.moon[2] + '" fill="#f7f5e6"/>');
      out.push('<circle cx="' + (s.moon[0] + 8) + '" cy="' + (s.moon[1] - 5) + '" r="' + s.moon[2] + '" fill="' + s.sky[0] + '"/>');
    }
    if (s.sun) {
      out.push('<circle cx="' + s.sun[0] + '" cy="' + s.sun[1] + '" r="' + s.sun[2] + '" fill="' + C.sun + '"/>');
    }

    var layers = s.layers.slice();
    layers.forEach(function (layer, i) {
      out.push('<path d="' + layerPath(layer[1]) + '" fill="' + layer[0] + '"/>');
      if (i === 0) {
        if (s.snow) s.snow.forEach(function (sn) { out.push(snowCap(sn[0], sn[1], sn[2])); });
        if (s.snowPoly) out.push('<polygon points="' + s.snowPoly + '" fill="' + C.snow + '"/>');
      }
      if (i === 1 && s.cliffs) {
        s.cliffs.forEach(function (c) {
          out.push('<line x1="' + c[0] + '" y1="' + c[1] + '" x2="' + c[2] + '" y2="' + c[3] + '" stroke="#f7f5e6" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>');
        });
      }
      if (i === 1 && s.antenna) {
        var a = s.antenna;
        out.push('<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + a[0] + '" y2="' + (a[1] - 16) + '" stroke="' + C.front + '" stroke-width="2.4"/>');
        out.push('<circle cx="' + a[0] + '" cy="' + (a[1] - 17) + '" r="2.6" fill="' + C.sun + '"/>');
      }
      if (i === 1 && s.houses) {
        s.houses.forEach(function (h) {
          out.push('<rect x="' + (h[0] - 8) + '" y="' + (h[1] - 12) + '" width="16" height="13" fill="#f7f5e6"/>');
          out.push('<polygon points="' + (h[0] - 11) + "," + (h[1] - 11) + " " + h[0] + "," + (h[1] - 21) + " " + (h[0] + 11) + "," + (h[1] - 11) + '" fill="#b5531a"/>');
          out.push('<rect x="' + (h[0] - 2.5) + '" y="' + (h[1] - 7) + '" width="5" height="8" fill="' + C.front + '"/>');
        });
      }
    });

    if (s.lake) {
      out.push('<ellipse cx="' + s.lake[0] + '" cy="' + s.lake[1] + '" rx="' + s.lake[2] + '" ry="' + s.lake[3] + '" fill="' + C.lake + '"/>');
      out.push('<line x1="' + (s.lake[0] - 40) + '" y1="' + (s.lake[1] - 1) + '" x2="' + (s.lake[0] + 10) + '" y2="' + (s.lake[1] - 1) + '" stroke="#f7f5e6" stroke-width="1.6" stroke-linecap="round"/>');
    }
    if (s.front) {
      out.push('<path d="' + layerPath(s.front[1]) + '" fill="' + s.front[0] + '"/>');
    }

    var frontLine = s.front ? s.front[1] : layers[layers.length - 1][1];
    var treeColor = s.treeColor || C.front;
    (s.trees || []).forEach(function (x, i) {
      var base = yAt(frontLine, x) + 4;
      out.push(pine(x, base, 22 + ((i * 7) % 12), treeColor));
    });

    if (s.tent) {
      var t = s.tent;
      out.push('<polygon points="' + t[0] + "," + (t[1] - 24) + " " + (t[0] - 22) + "," + t[1] + " " + (t[0] + 22) + "," + t[1] + '" fill="' + C.sun + '"/>');
      out.push('<polygon points="' + t[0] + "," + (t[1] - 24) + " " + (t[0] - 6) + "," + t[1] + " " + (t[0] + 6) + "," + t[1] + '" fill="#7a3a06"/>');
      out.push('<circle cx="' + t[0] + '" cy="' + (t[1] - 10) + '" r="16" fill="#f8a043" opacity=".18"/>');
    }

    out.push("</svg>");
    return out.join("");
  }

  function hydrate(root) {
    (root || document).querySelectorAll("[data-art]").forEach(function (el) {
      if (el.dataset.artDone) return;
      el.innerHTML = render(el.dataset.art, el.dataset.artLabel);
      el.dataset.artDone = "1";
    });
  }

  window.SACPRE_ART = { render: render, hydrate: hydrate };
})();
