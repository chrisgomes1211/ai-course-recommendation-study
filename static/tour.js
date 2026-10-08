(function () {
    'use strict';

    var KEY = 'acs-tour-seen-v1';
    var START_DELAY = 1500;
    var SCROLL_TARGET = 84;

    var STEPS = [
        {
            spot: '.hero',
            anchor: '.welcome-bot-wrap',
            pos: 'left',
            text: "Hi! I'm your guide to the AI Course Recommendation Study \u2014 an MSc experiment testing how AI models recommend art courses. Want a quick tour?"
        },
        {
            spot: '#single-run',
            anchor: '#single-run',
            pos: 'top-right',
            text: 'Single Run: pick one AI model and it answers a course-choice task over five pages, then completes an exit interview. Results appear right below.'
        },
        {
            spot: '#batch-run',
            anchor: '#batch-run',
            pos: 'top-right',
            text: 'Batch Run: collect data at scale \u2014 selected models \u00d7 course pages \u00d7 runs, with a live progress bar and cost tracking.'
        },
        {
            spot: '#course-pages',
            anchor: '#course-pages',
            pos: 'top-right',
            text: 'Course Pages: the five experimental stimulus pages models choose between. That is the tour \u2014 head to the Results tab to explore the data!'
        }
    ];

    var overlay, card, robotEl, textEl, stepEl, nextBtn, backBtn, skipBtn;
    var lottieAnim = null;
    var idx = 0;
    var active = false;
    var savedScroll = 0;
    var observer = null;
    var hideTimer = null;

    function win95() {
        return document.documentElement.getAttribute('data-theme') === 'win95';
    }

    function reduce() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function seen() {
        try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    }

    function markSeen() {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
    }

    function build() {
        if (card) return;

        overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.addEventListener('click', function () { end(true); });

        card = document.createElement('div');
        card.className = 'tour-card';
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-label', 'Site tour');
        card.innerHTML =
            '<div class="tour-robot" aria-hidden="true"></div>' +
            '<div class="tour-main">' +
            '<div class="tour-meta" aria-hidden="true"><span class="tour-step"></span></div>' +
            '<p class="tour-text" aria-live="polite"></p>' +
            '<div class="tour-actions">' +
            '<button type="button" class="tour-skip">Skip tour</button>' +
            '<button type="button" class="btn btn-sm tour-back">Back</button>' +
            '<button type="button" class="btn btn-primary btn-sm tour-next">Next</button>' +
            '</div></div>';

        document.body.appendChild(overlay);
        document.body.appendChild(card);

        robotEl = card.querySelector('.tour-robot');
        textEl = card.querySelector('.tour-text');
        stepEl = card.querySelector('.tour-step');
        nextBtn = card.querySelector('.tour-next');
        backBtn = card.querySelector('.tour-back');
        skipBtn = card.querySelector('.tour-skip');

        nextBtn.addEventListener('click', function () {
            if (idx >= STEPS.length - 1) end(true);
            else go(idx + 1);
        });
        backBtn.addEventListener('click', function () {
            if (idx > 0) go(idx - 1);
        });
        skipBtn.addEventListener('click', function () { end(true); });

        document.addEventListener('keydown', function (e) {
            if (!active) return;
            if (e.key === 'Escape') end(true);
        });

        if (typeof lottie !== 'undefined') {
            lottieAnim = lottie.loadAnimation({
                container: robotEl,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: '/static/welcome-bot.json'
            });
        } else {
            robotEl.style.display = 'none';
        }
    }

    function place() {
        if (!active) return;
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        if (vw <= 768) {
            card.classList.add('is-sheet');
            card.style.left = '';
            card.style.top = '';
            return;
        }
        card.classList.remove('is-sheet');

        var s = STEPS[idx];
        var a = document.querySelector(s.anchor);
        var pos = s.pos;
        if (!a || a.getBoundingClientRect().width === 0) {
            a = document.querySelector(s.spot);
            pos = 'below-right';
        }
        if (!a) return;
        var r = a.getBoundingClientRect();
        var w = card.offsetWidth;
        var h = card.offsetHeight;
        var pad = 14;
        var x, y;

        if (pos === 'left') {
            x = r.left - w - 16;
            y = r.top + 4;
            var sub = document.querySelector('.hero .subtitle');
            if (sub) {
                var sr = sub.getBoundingClientRect();
                if (sr.width > 0 && y < sr.bottom + 10) y = sr.bottom + 10;
            }
        } else if (pos === 'below-right') {
            x = r.right - w - 14;
            y = r.bottom + 14;
        } else {
            x = r.right - w - 20;
            y = r.top + 18;
        }

        if (x < pad) x = pad;
        if (x + w > vw - pad) x = vw - w - pad;
        if (y + h > vh - pad) y = vh - h - pad;
        if (y < pad) y = pad;

        card.style.left = Math.round(x) + 'px';
        card.style.top = Math.round(y) + 'px';
    }

    function clearSpot() {
        var prev = document.querySelectorAll('.tour-active');
        for (var i = 0; i < prev.length; i++) prev[i].classList.remove('tour-active');
    }

    function go(i) {
        idx = i;
        var s = STEPS[i];
        clearSpot();
        var spot = document.querySelector(s.spot);
        if (spot) spot.classList.add('tour-active');

        stepEl.textContent = 'Step ' + (i + 1) + ' of ' + STEPS.length;
        textEl.textContent = s.text;
        backBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
        nextBtn.textContent = i === STEPS.length - 1 ? 'Finish' : 'Next';

        if (spot) {
            var r = spot.getBoundingClientRect();
            if (Math.abs(r.top - SCROLL_TARGET) > 8) {
                try {
                    window.scrollBy({ top: r.top - SCROLL_TARGET, behavior: reduce() ? 'auto' : 'smooth' });
                } catch (e) {
                    window.scrollBy(0, r.top - SCROLL_TARGET);
                }
            }
        }
        place();
        try { nextBtn.focus({ preventScroll: true }); } catch (e) { nextBtn.focus(); }
    }

    function start() {
        if (active || win95()) return;
        build();
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

        savedScroll = window.scrollY;
        active = true;
        overlay.style.display = 'block';
        card.style.display = 'flex';
        void card.offsetWidth;
        overlay.classList.add('is-on');
        card.classList.add('is-on');
        if (wrap) wrap.classList.add('is-touring');
        go(0);

        document.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);

        if (!observer) {
            observer = new MutationObserver(function () {
                if (active && win95()) end(false);
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }
    }

    function end(mark) {
        if (!active) return;
        active = false;
        overlay.classList.remove('is-on');
        card.classList.remove('is-on');
        clearSpot();
        document.removeEventListener('scroll', place, true);
        window.removeEventListener('resize', place);
        if (mark) markSeen();
        try { window.scrollTo(0, savedScroll); } catch (e) {}
        if (wrap) wrap.classList.remove('is-touring');

        if (wrap) {
            wrap.setAttribute('tabindex', '0');
            try { wrap.focus({ preventScroll: true }); } catch (e) {}
        }

        hideTimer = setTimeout(function () {
            if (active) return;
            overlay.style.display = 'none';
            card.style.display = 'none';
        }, 360);
    }

    var wrap = document.querySelector('.welcome-bot-wrap');
    if (wrap) {
        wrap.style.pointerEvents = 'auto';
        wrap.style.cursor = 'pointer';
        wrap.setAttribute('title', 'Take the tour');
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'Take a guided tour');
        wrap.addEventListener('click', function () { start(); });
        wrap.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
        });
    }

    setTimeout(function () {
        if (!seen() && !win95() && document.querySelector('.hero')) start();
    }, START_DELAY);

    window.__tour = { start: start, end: end, isActive: function () { return active; } };
})();
