/* Halftone wordmark footer — vanilla port of the 21st "HalftoneWordmarkFooter".
   Canvas dots sized by letter coverage; pointer pushes dots on springs;
   click sends a shock ring; print grain over everything. */
(function () {
    "use strict";

    var root = document.getElementById("hwf-footer");
    if (!root) return;

    var canvas = root.querySelector("canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var CONFIG = {
        wordmark: root.getAttribute("data-wordmark") || "ai study",
        background: "#0a0a12",
        ink: "#d8d2ea",
        warm: "#d946ef",
        dotGap: 6,
        radius: 90,
        crop: 0.16,
        grain: 0.45,
        interactive: true,
        fontFamily: '"Inter", "Helvetica Neue", Arial, system-ui, sans-serif',
        fontWeight: 800
    };

    function hex(hex) {
        var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
        if (!m) return null;
        var h = m[1].length === 3 ? m[1].split("").map(function (c) { return c + c; }).join("") : m[1];
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }

    function radiusFor(coverage, gap) {
        var c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
        return Math.sqrt(c) * gap * 0.56;
    }

    function step(dots, j, px, py, r) {
        var x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3];
        var hx = dots[j + 4], hy = dots[j + 5];
        var dx = x - px, dy = y - py;
        var d2 = dx * dx + dy * dy;
        if (r > 0 && d2 < r * r) {
            var d = Math.sqrt(d2) + 0.001;
            var f = (1 - d / r) * 2.6;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
        }
        vx = (vx + (hx - x) * 0.05) * 0.84;
        vy = (vy + (hy - y) * 0.05) * 0.84;
        dots[j] = x + vx;
        dots[j + 1] = y + vy;
        dots[j + 2] = vx;
        dots[j + 3] = vy;
    }

    function fitSize(measured, width) {
        return measured > 0 ? (width / measured) * 100 : 0;
    }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var w = 0, h = 0, dpr = 1;
    var px = -1e5, py = -1e5;
    var raf = 0, visible = true, awake = true;
    var ring = { x: 0, y: 0, t: -1 };
    var dots = new Float32Array(0);
    var count = 0;
    var grainTile = null;
    var ink = hex(CONFIG.ink) || [216, 210, 234];
    var warm = hex(CONFIG.warm) || [217, 70, 239];

    function layout() {
        var rect = root.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width));
        h = Math.max(1, Math.round(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        var mask = document.createElement("canvas");
        mask.width = w;
        mask.height = h;
        var m = mask.getContext("2d", { willReadFrequently: true });
        if (!m) return;
        m.font = CONFIG.fontWeight + " 100px " + CONFIG.fontFamily;
        var word = CONFIG.wordmark || " ";
        var fit = fitSize(m.measureText(word).width, w * 1.02);
        m.font = CONFIG.fontWeight + " " + fit + "px " + CONFIG.fontFamily;
        var box = m.measureText(word);
        var cap = box.actualBoundingBoxAscent || fit * 0.72;
        var c = Math.max(0, Math.min(0.6, CONFIG.crop));
        m.fillStyle = "#000";
        m.textBaseline = "alphabetic";
        m.fillText(word, (w - box.width) / 2, h + cap * c);
        var img = m.getImageData(0, 0, w, h).data;

        var gap = Math.max(3, CONFIG.dotGap);
        var cols = Math.ceil(w / gap);
        var rows = Math.ceil(h / gap);
        var tmp = [];
        for (var gy = 0; gy < rows; gy++) {
            for (var gx = 0; gx < cols; gx++) {
                var sum = 0;
                for (var sy = 0; sy < 3; sy++) {
                    for (var sx = 0; sx < 3; sx++) {
                        var x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3));
                        var y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3));
                        sum += img[(y * w + x) * 4 + 3];
                    }
                }
                var cov = sum / (9 * 255);
                if (cov < 0.06) continue;
                var hx = gx * gap + gap / 2;
                var hy = gy * gap + gap / 2;
                tmp.push(hx, hy, 0, 0, hx, hy, radiusFor(cov, gap));
            }
        }
        dots = new Float32Array(tmp);
        count = tmp.length / 7;

        grainTile = document.createElement("canvas");
        grainTile.width = 256;
        grainTile.height = 256;
        var g = grainTile.getContext("2d");
        if (g) {
            var id = g.createImageData(256, 256);
            for (var i = 0; i < id.data.length; i += 4) {
                var v = Math.random() * 255;
                id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
                id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
            }
            g.putImageData(id, 0, 0);
        }
        awake = true;
    }

    function draw(now) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = CONFIG.background;
        ctx.fillRect(0, 0, w, h);

        var r = CONFIG.interactive && !reduced ? Math.max(0, CONFIG.radius) : 0;
        var ringAge = ring.t < 0 ? 1e9 : now - ring.t;
        var ringR = ringAge * 0.9;
        var moving = false;
        for (var i = 0; i < count; i++) {
            var j = i * 7;
            var x = dots[j], y = dots[j + 1];
            var hx = dots[j + 4], hy = dots[j + 5];
            if (!reduced) {
                if (ringAge < 900) {
                    var dx = hx - ring.x, dy = hy - ring.y;
                    var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
                    var band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
                    if (band > 0) {
                        var f = band * 3.2 * (1 - ringAge / 900);
                        dots[j + 2] += (dx / d) * f;
                        dots[j + 3] += (dy / d) * f;
                    }
                }
                step(dots, j, px, py, r);
                x = dots[j];
                y = dots[j + 1];
                if (Math.abs(dots[j + 2]) + Math.abs(dots[j + 3]) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) {
                    moving = true;
                } else {
                    x = hx; y = hy;
                    dots[j] = hx; dots[j + 1] = hy;
                    dots[j + 2] = 0; dots[j + 3] = 0;
                }
            }
            var ddx = x - hx, ddy = y - hy;
            var k = Math.min(1, Math.sqrt(ddx * ddx + ddy * ddy) / 28);
            ctx.fillStyle = k > 0.02
                ? "rgb(" + Math.round(ink[0] + (warm[0] - ink[0]) * k) + "," +
                  Math.round(ink[1] + (warm[1] - ink[1]) * k) + "," +
                  Math.round(ink[2] + (warm[2] - ink[2]) * k) + ")"
                : CONFIG.ink;
            ctx.beginPath();
            ctx.arc(x, y, dots[j + 6], 0, 6.2832);
            ctx.fill();
        }

        if (grainTile && CONFIG.grain > 0) {
            ctx.globalAlpha = Math.min(1, CONFIG.grain) * 0.09;
            ctx.globalCompositeOperation = "overlay";
            var pattern = ctx.createPattern(grainTile, "repeat");
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, w, h);
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
        }
        awake = moving || ringAge < 900 || px > -1e4;
    }

    function loop(now) {
        raf = 0;
        if (!visible) return;
        draw(now);
        if (awake) raf = requestAnimationFrame(loop);
    }

    function wake() {
        awake = true;
        if (!raf && visible) raf = requestAnimationFrame(loop);
    }

    function toLocal(e) {
        var b = canvas.getBoundingClientRect();
        return [e.clientX - b.left, e.clientY - b.top];
    }

    root.addEventListener("pointermove", function (e) {
        if (!CONFIG.interactive) return;
        var p = toLocal(e);
        px = p[0];
        py = p[1];
        wake();
    });
    root.addEventListener("pointerleave", function () {
        px = -1e5;
        py = -1e5;
        wake();
    });
    root.addEventListener("pointerdown", function (e) {
        if (!CONFIG.interactive || reduced) return;
        if (e.target.closest("a,button")) return;
        var p = toLocal(e);
        ring = { x: p[0], y: p[1], t: performance.now() };
        wake();
    });

    var upBtn = root.querySelector(".hwf-up");
    if (upBtn) {
        upBtn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        });
    }

    new ResizeObserver(function () { layout(); wake(); }).observe(root);
    new IntersectionObserver(function (entries) {
        visible = entries[0] ? entries[0].isIntersecting : true;
        if (visible) wake();
    }).observe(root);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { layout(); wake(); });
    }

    layout();
    draw(performance.now());
    wake();
})();
