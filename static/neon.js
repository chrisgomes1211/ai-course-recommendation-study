/* NEON skin: hero parallax, scroll reveal, 3D tilt cards.
   Ambient particles are pure CSS (.neon-dots). All motion respects
   prefers-reduced-motion. */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- hero parallax ---------------- */
    function initParallax() {
        if (reduce) return;
        var layers = document.querySelectorAll('[data-depth]');
        if (!layers.length) return;
        var ticking = false;

        function apply() {
            var y = window.scrollY || 0;
            for (var i = 0; i < layers.length; i++) {
                var depth = parseFloat(layers[i].getAttribute('data-depth')) || 0;
                layers[i].style.transform = 'translate3d(0,' + (y * depth).toFixed(1) + 'px,0)';
            }
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(apply);
            }
        }, { passive: true });
        apply();
    }

    /* ---------------- scroll reveal ---------------- */
    function initReveal() {
        var els = document.querySelectorAll('.reveal');
        if (!els.length) return;
        if (reduce || !('IntersectionObserver' in window)) {
            for (var i = 0; i < els.length; i++) els[i].classList.add('in-view');
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        for (var j = 0; j < els.length; j++) io.observe(els[j]);
    }

    /* ---------------- 3D tilt cards (mouse depth, amix-style) ---------------- */
    function initTilt() {
        if (reduce || !window.matchMedia('(hover: hover)').matches) return;
        var cards = document.querySelectorAll('.tilt');
        for (var i = 0; i < cards.length; i++) {
            (function (card) {
                var MAX = 6;
                card.addEventListener('mousemove', function (e) {
                    var r = card.getBoundingClientRect();
                    var px = (e.clientX - r.left) / r.width - 0.5;
                    var py = (e.clientY - r.top) / r.height - 0.5;
                    card.style.transform =
                        'perspective(800px) rotateX(' + (-py * MAX).toFixed(2) + 'deg)' +
                        ' rotateY(' + (px * MAX).toFixed(2) + 'deg) translateY(-2px)';
                });
                card.addEventListener('mouseleave', function () {
                    card.style.transform = '';
                });
            })(cards[i]);
        }
    }

    /* ---------------- banner videos (play only when visible) ---------------- */
    function initBannerVideos() {
        var vids = document.querySelectorAll('.banner-bg-vid');
        if (!vids.length) return;
        if (reduce) return; /* CSS hides them; no playback */
        var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var v = e.target;
                if (e.isIntersecting) {
                    var pr = v.play();
                    if (pr && pr.catch) pr.catch(function () {});
                } else {
                    v.pause();
                }
            });
        }, { threshold: 0.15 }) : null;
        vids.forEach(function (v) {
            if (io) io.observe(v);
            else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        });
    }

    /* ---------------- Bella path-following ---------------- */
    /* She's position:fixed and transform-driven: as you scroll she
       walks a zig-zag across the whole viewport (right hero -> left
       -> right -> left -> right at the close banner), always trailing
       a little behind your scroll for a lifelike follow, plus a tiny
       idle sway so she's never frozen in place. */
    function initBotFollow() {
        var wrap = document.querySelector('.welcome-bot-wrap');
        if (!wrap || reduce) return;

        var cur = null;
        var startTop = null, startRight = null;

        function waypoints() {
            var vw = window.innerWidth, vh = window.innerHeight;
            if (vw < 680) {
                /* mobile: she stays in the bottom-right corner, gentle drift */
                var mx = vw - (wrap.offsetWidth || 150) - 10;
                var my = vh - (wrap.offsetHeight || 150) - 80;
                return [
                    { x: mx, y: my, s: 1 },
                    { x: mx - 14, y: my - 20, s: 1 },
                    { x: mx, y: my, s: 1 },
                    { x: mx - 14, y: my - 16, s: 1 },
                    { x: mx, y: my, s: 1 }
                ];
            }
            var w = wrap.offsetWidth || 280;
            var h = wrap.offsetHeight || 280;
            return [
                /* hero: top-right */
                { x: vw - w - 44, y: 92, s: 1 },
                /* leaves hero, walks to the left edge */
                { x: 40, y: vh * 0.52, s: 0.9 },
                /* crosses back to the right while reading content */
                { x: vw - w - 24, y: vh * 0.5, s: 0.85 },
                /* back to the left */
                { x: 48, y: vh * 0.46, s: 0.9 },
                /* closes out beside the final banner */
                { x: vw - w - 44, y: vh * 0.55, s: 1 }
            ];
        }

        function pathAt(p, pts) {
            var seg = (pts.length - 1) * p;
            var i = Math.min(pts.length - 2, Math.floor(seg));
            var t = seg - i;
            /* smoothstep for gentle ease at each waypoint */
            t = t * t * (3 - 2 * t);
            var a = pts[i], b = pts[i + 1];
            return {
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t,
                s: a.s + (b.s - a.s) * t
            };
        }

        function progress() {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) return 0;
            var p = window.scrollY / max;
            return p < 0 ? 0 : p > 1 ? 1 : p;
        }

        function frame(now) {
            if (startTop === null) {
                /* switch from right/top positioning to transform in one step */
                var r = wrap.getBoundingClientRect();
                startTop = r.top;
                startRight = window.innerWidth - r.right;
                wrap.style.top = '0px';
                wrap.style.right = 'auto';
                wrap.style.left = '0px';
                cur = { x: r.left, y: r.top, s: 1 };
            }
            var tgt = pathAt(progress(), waypoints());
            /* idle sway: always moving a little, even when you aren't */
            tgt.x += Math.sin(now / 1100) * 7;
            tgt.y += Math.cos(now / 1400) * 5;
            /* trailing lerp — she follows rather than snaps */
            cur.x += (tgt.x - cur.x) * 0.09;
            cur.y += (tgt.y - cur.y) * 0.09;
            cur.s += (tgt.s - cur.s) * 0.06;
            wrap.style.transform =
                'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0) scale(' + cur.s.toFixed(3) + ')';
            window.requestAnimationFrame(frame);
        }
        window.requestAnimationFrame(frame);
    }

    function boot() {
        initParallax();
        initReveal();
        initTilt();
        initBannerVideos();
        initBotFollow();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
