/* Tilted grid band — vanilla port of the 21st "TiltedGridHero".
   One row of tiles streams right-to-left around the inside of a cylinder.
   Each tile is cut into vertical strips (flat facets of the cylinder);
   one rotateY per tile carries the whole tile along the arc, so strips
   never drift. Only JS: ResizeObserver sizing + next-image on wrap. */
(function () {
    "use strict";

    var SLICES = 16;
    var CAMERA = 1.6;
    var MAX_WIDTH = 55;

    function arc(bend) {
        return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
    }

    function measure(width, height, tile, aspect, gap, bend) {
        var h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect);
        var radius = width * arc(bend);
        if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
        var deg = function (rad) { return (rad * 180) / Math.PI; };
        var unit = deg(h / radius);
        var pitch = (aspect + gap / 100) * unit;
        var limit = deg(bend) + (aspect * unit) / 2;
        var columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
        var round = function (n) { return +n.toFixed(4); };
        var sweep = round((columns * pitch) / 2);
        return { columns: columns, sweep: sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
    }

    function init(root) {
        var jsonEl = root.querySelector(".tgh-images");
        var images = [];
        try { images = JSON.parse(jsonEl ? jsonEl.textContent : "[]"); } catch (e) { images = []; }
        if (!images.length) return;

        var tileHeight = parseFloat(root.getAttribute("data-tile-height") || "28");
        var speed = parseFloat(root.getAttribute("data-speed") || "3.5");
        var aspect = parseFloat(root.getAttribute("data-aspect") || "1.6");
        var gap = parseFloat(root.getAttribute("data-gap") || "6");
        var axis = parseFloat(root.getAttribute("data-axis") || "54");
        var curve = Math.min(85, Math.max(5, parseFloat(root.getAttribute("data-curve") || "80")));
        var fade = parseFloat(root.getAttribute("data-fade") || "12");
        var bend = (curve * Math.PI) / 180;

        var id = "tgh" + Math.random().toString(36).slice(2, 9);
        var orbit = id + "-o";
        var tileCls = id + "-t";

        var styleEl = document.createElement("style");
        root.insertBefore(styleEl, root.firstChild);

        var band = document.createElement("div");
        band.className = "tgh-band";
        band.setAttribute("aria-hidden", "true");
        band.style.opacity = "0";
        root.insertBefore(band, styleEl.nextSibling);

        // Preload every image up front.
        images.forEach(function (im) { new Image().src = im.src; });

        var layout = null;
        var tileEls = [];

        function u(n) {
            return "calc(" + (+n.toFixed(4)) + " * min(" + tileHeight + "cqh, " + ((MAX_WIDTH / aspect).toFixed(4)) + "cqw))";
        }

        function turn(deg) {
            var r = 100 * arc(bend);
            return "translateZ(" + (+r.toFixed(3)) + "cqw) rotateY(" + (+deg.toFixed(4)) + "deg) translateZ(-" + (+r.toFixed(3)) + "cqw)";
        }

        function build(next) {
            layout = next;
            var columns = next.columns, sweep = next.sweep, unit = next.unit, limit = next.limit;
            var r = 100 * arc(bend);
            var hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
            var css =
                "@" + "keyframes " + orbit + "{" +
                "from{transform:" + turn(-sweep) + "}to{transform:" + turn(sweep) + "}" +
                "0%," + hide + "%," + (100 - hide) + "%,100%{visibility:hidden}" +
                (hide + 0.001) + "%," + (100 - hide - 0.001) + "%{visibility:visible}}" +
                "@media(prefers-reduced-motion:reduce){." + tileCls + "{animation-play-state:paused}}";
            styleEl.textContent = css;

            band.innerHTML = "";
            tileEls = [];
            var share = aspect / SLICES;
            var duration = columns * speed;
            var mask = "linear-gradient(90deg,transparent,#000 " + fade + "%,#000 " + (100 - fade) + "%,transparent)";
            var persp = (+((r * CAMERA).toFixed(3))) + "cqw";
            band.style.perspective = persp;
            band.style.perspectiveOrigin = "50% " + axis + "%";
            band.style.maskImage = mask;
            band.style.webkitMaskImage = mask;

            for (var t = 0; t < columns; t++) {
                (function (t) {
                    var first = columns - 1 - t;
                    var idx0 = first % Math.max(images.length, 1);
                    var tile = document.createElement("div");
                    tile.className = tileCls;
                    tile.style.left = "calc(50% - " + u(aspect / 2) + ")";
                    tile.style.top = "calc(" + axis + "% - " + u(0.5) + ")";
                    tile.style.width = u(aspect);
                    tile.style.height = u(1);
                    tile.style.transformStyle = "preserve-3d";
                    tile.style.animation = orbit + " " + duration + "s linear " + (-t * speed) + "s infinite";

                    var imgs = [];
                    for (var k = 0; k < SLICES; k++) {
                        var s = document.createElement("div");
                        s.className = "tgh-s" + (k === 0 ? " tgh-s-first" : "") + (k === SLICES - 1 ? " tgh-s-last" : "");
                        s.style.left = u((aspect - share) / 2);
                        s.style.width = k === SLICES - 1 ? u(share) : "calc(" + u(share) + " + 1px)";
                        s.style.height = u(1);
                        s.style.transform = turn((aspect / 2 - (k + 0.5) * share) * unit);
                        var img = document.createElement("img");
                        img.src = images[idx0].src;
                        img.alt = "";
                        img.draggable = false;
                        img.style.left = u(-k * share);
                        img.style.width = u(aspect);
                        img.style.height = u(1);
                        s.appendChild(img);
                        imgs.push(img);
                        tile.appendChild(s);
                    }

                    tile.addEventListener("animationiteration", function (e) {
                        var lap = Math.round(e.elapsedTime / duration);
                        var next = (lap * columns + first) % Math.max(images.length, 1);
                        if (!images[next]) return;
                        var src = images[next].src;
                        for (var i = 0; i < imgs.length; i++) {
                            if (imgs[i].getAttribute("src") !== src) imgs[i].src = src;
                        }
                    });

                    band.appendChild(tile);
                    tileEls.push(tile);
                })(t);
            }
            band.style.opacity = "1";
        }

        new ResizeObserver(function (entries) {
            var rect = entries[0].contentRect;
            var next = measure(rect.width, rect.height, tileHeight, aspect, gap, bend);
            if (!layout || layout.columns !== next.columns || layout.sweep !== next.sweep || layout.unit !== next.unit) {
                build(next);
            }
        }).observe(root);

        new IntersectionObserver(function (entries) {
            var vis = entries[0] ? entries[0].isIntersecting : true;
            tileEls.forEach(function (el) {
                el.style.animationPlayState = vis ? "running" : "paused";
            });
        }).observe(root);
    }

    function boot() {
        var roots = document.querySelectorAll("[data-tgh]");
        for (var i = 0; i < roots.length; i++) init(roots[i]);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
