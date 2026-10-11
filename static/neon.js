/* NEON skin: particle field, hero parallax, scroll reveal.
   All motion respects prefers-reduced-motion. */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- particle constellation ---------------- */
    function initParticles() {
        var canvas = document.getElementById('neon-particles');
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var particles = [];
        var count = 0;
        var raf = null;
        var running = true;

        function resize() {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            count = Math.max(28, Math.min(70, Math.floor(window.innerWidth / 22)));
            seed();
        }

        function seed() {
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    vx: (Math.random() - 0.5) * 0.22,
                    vy: (Math.random() - 0.5) * 0.22,
                    r: Math.random() * 1.4 + 0.5
                });
            }
        }

        function step() {
            if (!running) return;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            var i, j, p, q, dx, dy, dist;
            for (i = 0; i < particles.length; i++) {
                p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -8) p.x = window.innerWidth + 8;
                if (p.x > window.innerWidth + 8) p.x = -8;
                if (p.y < -8) p.y = window.innerHeight + 8;
                if (p.y > window.innerHeight + 8) p.y = -8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(34, 211, 238, 0.55)';
                ctx.fill();
                for (j = i + 1; j < particles.length; j++) {
                    q = particles[j];
                    dx = p.x - q.x;
                    dy = p.y - q.y;
                    dist = dx * dx + dy * dy;
                    if (dist < 12000) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = 'rgba(167, 139, 250,' + (0.14 * (1 - dist / 12000)) + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            raf = window.requestAnimationFrame(step);
        }

        function drawStatic() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
                ctx.fill();
            }
        }

        resize();
        window.addEventListener('resize', function () {
            resize();
            if (reduce) drawStatic();
        });

        if (reduce) {
            drawStatic();
            return;
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                running = false;
                if (raf) window.cancelAnimationFrame(raf);
            } else if (!running) {
                running = true;
                step();
            }
        });

        step();
    }

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

    function boot() {
        initParticles();
        initParallax();
        initReveal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
