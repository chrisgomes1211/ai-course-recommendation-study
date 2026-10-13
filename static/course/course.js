/* Stimulus pages — round-2 interactions (additive only).
   Each page keeps its own inline script for progress/parallax/
   reveal/count-up/lightbox/sticky. This file ONLY adds the new
   chrome behaviours so nothing double-binds. */
(function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* float cards: gentle pointer tilt + idle bob */
    var cards = document.querySelectorAll('.float-card');
    if (!reduce && cards.length) {
        cards.forEach(function (card, i) {
            var base = getComputedStyle(card).getPropertyValue('--tilt').trim() || '0deg';
            var bobT = null;
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var dx = (e.clientX - r.left - r.width / 2) / r.width;
                var dy = (e.clientY - r.top - r.height / 2) / r.height;
                card.style.transform = 'translateY(-6px) rotate(' + (parseFloat(base) + dx * 6) + 'deg) perspective(600px) rotateX(' + (-dy * 8) + 'deg) rotateY(' + (dx * 8) + 'deg)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
            /* soft bob when idle */
            var t0 = performance.now() + i * 700;
            (function bob(t) {
                if (!card.matches(':hover')) {
                    var y = Math.sin((t - t0) / 1600) * 5;
                    card.style.translate = '0 ' + y.toFixed(1) + 'px';
                }
                bobT = requestAnimationFrame(bob);
            })(t0);
        });
    }

    /* spin badge: fade out once past the hero */
    var badge = document.querySelector('.spin-badge');
    var hero = document.getElementById('hero');
    if (badge && hero) {
        addEventListener('scroll', function () {
            badge.classList.toggle('gone', scrollY > hero.offsetHeight * 0.7);
        }, { passive: true });
    }
})();