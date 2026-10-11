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

    function boot() {
        initParallax();
        initReveal();
        initTilt();
        initBannerVideos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
