async function runTest() {
    const modelSelect = document.getElementById('model-select');
    const modelName = modelSelect.value;
    const runBtn = document.getElementById('run-btn');
    const btnText = runBtn.querySelector('.btn-text');
    const btnLoading = runBtn.querySelector('.btn-loading');
    const resultsPanel = document.getElementById('results-panel');
    const resultsContent = document.getElementById('results-content');
    const errorPanel = document.getElementById('error-panel');
    const errorMessage = document.getElementById('error-message');

    runBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    resultsPanel.style.display = 'none';
    errorPanel.style.display = 'none';

    try {
        const response = await fetch('/api/run-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }

        renderResults(data);
        resultsPanel.style.display = 'block';
        errorPanel.style.display = 'none';

    } catch (err) {
        errorMessage.textContent = err.message;
        errorPanel.style.display = 'block';
        resultsPanel.style.display = 'none';
    } finally {
        runBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

let featuresCache = null;

async function loadFeatures() {
    if (featuresCache) return featuresCache;
    try {
        const response = await fetch('/api/features');
        featuresCache = await response.json();
        return featuresCache;
    } catch (err) {
        console.error('Failed to load features:', err);
        return {};
    }
}

function renderWinnerFeatures(pageId, features) {
    const f = features[pageId];
    if (!f) return '';
    
    let tags = [];
    if (f.price) tags.push(`<span class="feature-tag feature-price">${f.price.label}</span>`);
    if (f.reviews) tags.push(`<span class="feature-tag feature-reviews">${f.reviews.label}</span>`);
    if (f.credentials) tags.push(`<span class="feature-tag feature-credentials">${f.credentials.label}</span>`);
    if (f.description) tags.push(`<span class="feature-tag feature-description">${f.description.label}</span>`);
    if (f.structure) tags.push(`<span class="feature-tag feature-structure">${f.structure.label}</span>`);
    
    if (tags.length === 0) return '';
    
    return `
        <div class="winner-features">
            <h4>Winning Page Features</h4>
            <div class="feature-tags">${tags.join('')}</div>
        </div>
    `;
}

function renderResults(data) {
    const container = document.getElementById('results-content');
    const interview = data.interview_data;
    const choice = data.choice_resp;
    const interviewResp = data.interview_resp;
    const totalCost = data.total_cost_usd;

    // Load features and render with winner features
    loadFeatures().then(features => {
        const winnerFeaturesHtml = renderWinnerFeatures(data.chosen_page, features);
        const viewPageLink = `<a href="/page/${escapeHtml(data.chosen_page)}" target="_blank" class="view-page-link">View Page →</a>`;
        
        container.innerHTML = `
            <div class="results-summary">
                <div class="result-item">
                    <span class="result-label">Chosen Course</span>
                    <span class="result-value">${escapeHtml(data.chosen_page)} ${viewPageLink}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Model</span>
                    <span class="result-value">${document.getElementById('model-select').value}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Tier</span>
                    <span class="result-value">${data.tier}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Run Number</span>
                    <span class="result-value">${data.run_number}</span>
                </div>
            </div>

            ${winnerFeaturesHtml}

            <div class="likert-grid">
                <div class="likert-item">
                    <span class="likert-label">Price Influence</span>
                    <span class="likert-score">${interview.q1_price}</span>
                </div>
                <div class="likert-item">
                    <span class="likert-label">Reviews Influence</span>
                    <span class="likert-score">${interview.q2_reviews}</span>
                </div>
                <div class="likert-item">
                    <span class="likert-label">Credentials Influence</span>
                    <span class="likert-score">${interview.q3_credentials}</span>
                </div>
                <div class="likert-item">
                    <span class="likert-label">Description Influence</span>
                    <span class="likert-score">${interview.q4_description}</span>
                </div>
                <div class="likert-item">
                    <span class="likert-label">Clarity Influence</span>
                    <span class="likert-score">${interview.q5_clarity}</span>
                </div>
            </div>

            <div class="result-item">
                <span class="result-label">Reason</span>
                <span class="result-value reason">${escapeHtml(interview.q6_open)}</span>
            </div>

            <div class="cost-breakdown">
                <div class="cost-item">
                    <span class="cost-label">Choice Call</span>
                    <span class="cost-value">${choice.input_tokens} in / ${choice.output_tokens} out</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Choice Cost</span>
                    <span class="cost-value">$${choice.cost_usd.toFixed(6)}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Interview Call</span>
                    <span class="cost-value">${interviewResp.input_tokens} in / ${interviewResp.output_tokens} out</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Interview Cost</span>
                    <span class="cost-value">$${interviewResp.cost_usd.toFixed(6)}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Total Cost</span>
                    <span class="cost-value total">$${totalCost.toFixed(6)}</span>
                </div>
            </div>

            <p style="margin-top: var(--spacing-md); font-size: 0.85rem; color: var(--color-text-muted);">
                Saved to results/results.csv (run #${data.run_number} for this model + course combination)
            </p>
        `;
    });
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/results');
        const data = await response.json();
        renderStats(data.stats);
        renderSummary(data.stats);
        renderOverallChart(data.stats.course_counts);
        renderModelChart(data.stats.model_course_counts);
        renderRecentRuns(data.recent_runs);
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

function renderStats(stats) {
    document.getElementById('stat-total-runs').textContent = stats.total_runs;
    document.getElementById('stat-total-cost').textContent = '$' + stats.total_cost.toFixed(2);
    document.getElementById('stat-models-used').textContent = stats.models_used.length;
}

function renderSummary(stats) {
    const summaryEl = document.getElementById('summary-line');
    if (!summaryEl) return;
    
    if (!stats.course_counts || Object.keys(stats.course_counts).length === 0) {
        summaryEl.style.display = 'none';
        return;
    }
    
    const total = Object.values(stats.course_counts).reduce((a, b) => a + b, 0);
    let topCourse = '';
    let topCount = 0;
    for (const [course, count] of Object.entries(stats.course_counts)) {
        if (count > topCount) {
            topCount = count;
            topCourse = course;
        }
    }
    const pct = total > 0 ? ((topCount / total) * 100).toFixed(1) : 0;
    
    summaryEl.innerHTML = `Across <strong>${total}</strong> runs, <strong>${escapeHtml(topCourse)}</strong> was chosen most often (<strong>${pct}%</strong> of recommendations)`;
    summaryEl.style.display = 'block';
}

function renderOverallChart(courseCounts) {
    const container = document.getElementById('overall-chart');
    if (!courseCounts || Object.keys(courseCounts).length === 0) {
        container.innerHTML = '<p class="loading">No data yet. Run some tests first.</p>';
        return;
    }

    const total = Object.values(courseCounts).reduce((a, b) => a + b, 0);
    const maxCount = Math.max(...Object.values(courseCounts));

    let html = '';
    for (const [course, count] of Object.entries(courseCounts)) {
        const pct = (count / maxCount) * 100;
        html += `
            <div class="chart-bar">
                <span class="chart-bar-label">${escapeHtml(course)}</span>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="chart-bar-value">${count}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderModelChart(modelCourseCounts) {
    const container = document.getElementById('model-chart');
    if (!modelCourseCounts || Object.keys(modelCourseCounts).length === 0) {
        container.innerHTML = '<p class="loading">No data yet.</p>';
        return;
    }

    let html = '';
    for (const [model, courses] of Object.entries(modelCourseCounts)) {
        html += `<div class="model-chart-group"><div class="model-chart-title">${escapeHtml(model)}</div>`;
        const maxCount = Math.max(...Object.values(courses));
        for (const [course, count] of Object.entries(courses)) {
            const pct = (count / maxCount) * 100;
            html += `
                <div class="chart-bar">
                    <span class="chart-bar-label">${escapeHtml(course)}</span>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="chart-bar-value">${count}</span>
                </div>
            `;
        }
        html += '</div>';
    }
    container.innerHTML = html;
}

function renderRecentRuns(runs) {
    const tbody = document.getElementById('runs-tbody');
    if (!runs || runs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="loading">No runs recorded yet.</td></tr>';
        return;
    }

    let html = '';
    for (const run of runs) {
        const totalCost = run.total_row_cost_usd
            ? parseFloat(run.total_row_cost_usd).toFixed(6)
            : (parseFloat(run.choice_cost_usd) + parseFloat(run.interview_cost_usd)).toFixed(6);
        const viewLink = `<a href="/page/${escapeHtml(run.which_page_won)}" target="_blank" class="view-page-link">${escapeHtml(run.which_page_won)}</a>`;
        const provider = run.provider || '';
        html += `
            <tr>
                <td>${formatTimestamp(run.timestamp)}</td>
                <td>${escapeHtml(run.model)}</td>
                <td>${escapeHtml(provider)}</td>
                <td>${escapeHtml(run.tier)}</td>
                <td>${run.run_number}</td>
                <td>${viewLink}</td>
                <td>${run.q1_price}</td>
                <td>${run.q2_reviews}</td>
                <td>${run.q3_credentials}</td>
                <td>${run.q4_description}</td>
                <td>${run.q5_clarity}</td>
                <td class="reason" title="${escapeHtml(run.choice_reasoning || '')}">${escapeHtml(run.q6_open)}</td>
                <td>$${totalCost}</td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

function formatTimestamp(iso) {
    try {
        const date = new Date(iso);
        return date.toLocaleString();
    } catch { return iso; }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const THEME_ICONS = {
    atlantic: '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>',
    win95: '<rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path>',
    studio: '<path d="M12 2l8 10-8 10-8-10z"></path>'
};

const THEME_LABELS = { atlantic: 'Atlantic', win95: 'Windows 95', studio: 'Studio' };

function currentTheme() {
    const t = document.documentElement.getAttribute('data-theme');
    return (t === 'win95' || t === 'studio') ? t : 'atlantic';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'studio') {
        document.documentElement.setAttribute('data-pref', 'light');
    } else if (theme === 'atlantic' && window.matchMedia) {
        document.documentElement.setAttribute('data-pref', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('js-anim', theme !== 'win95' && !reduce);
    if (theme !== 'atlantic') {
        document.querySelectorAll('.hero-layer[data-depth]').forEach((layer) => { layer.style.transform = ''; });
    }
    try { localStorage.setItem('acs-theme', theme); } catch (e) {}
    updateThemeUI();
}

function updateThemeUI() {
    const theme = currentTheme();
    const btn = document.getElementById('theme-dd-btn');
    if (btn) {
        const icon = btn.querySelector('.theme-dd-icon');
        const label = btn.querySelector('.theme-dd-label');
        if (icon) icon.innerHTML = THEME_ICONS[theme] || THEME_ICONS.atlantic;
        if (label) label.textContent = THEME_LABELS[theme] || 'Atlantic';
    }
    document.querySelectorAll('.dd-item[data-theme-val]').forEach(item => {
        item.setAttribute('aria-checked', item.getAttribute('data-theme-val') === theme ? 'true' : 'false');
    });
}

function setThemeMenu(open) {
    const btn = document.getElementById('theme-dd-btn');
    const menu = document.getElementById('theme-dd-menu');
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.hidden = !open;
    if (open) {
        const checked = menu.querySelector('.dd-item[aria-checked="true"]') || menu.querySelector('.dd-item');
        if (checked) checked.focus();
    }
}

function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const layers = Array.prototype.slice.call(hero.querySelectorAll('.hero-layer[data-depth]'));
    if (!layers.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const update = () => {
        ticking = false;
        if (currentTheme() !== 'atlantic') return;
        const y = window.scrollY || 0;
        if (y > hero.offsetTop + hero.offsetHeight) return;
        for (const layer of layers) {
            const depth = parseFloat(layer.getAttribute('data-depth')) || 0;
            layer.style.transform = 'translate3d(0,' + (y * depth).toFixed(1) + 'px,0)';
        }
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
}

function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
        els.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
}

function animateHeroStats() {
    if (!document.documentElement.classList.contains('js-anim')) return;
    document.querySelectorAll('.hero-stat[data-count]').forEach(el => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        const prefix = el.getAttribute('data-prefix') || '';
        const duration = 900;
        const start = performance.now();
        el.textContent = prefix + '0';
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + Math.round(target * eased);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const ddBtn = document.getElementById('theme-dd-btn');
    const ddMenu = document.getElementById('theme-dd-menu');

    if (ddBtn && ddMenu) {
        updateThemeUI();

        ddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setThemeMenu(ddBtn.getAttribute('aria-expanded') !== 'true');
        });

        ddMenu.querySelectorAll('.dd-item').forEach(item => {
            item.addEventListener('click', () => {
                applyTheme(item.getAttribute('data-theme-val'));
                setThemeMenu(false);
                ddBtn.focus();
            });
        });

        document.addEventListener('click', (e) => {
            if (ddBtn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.theme-dd')) {
                setThemeMenu(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && ddBtn.getAttribute('aria-expanded') === 'true') {
                setThemeMenu(false);
                ddBtn.focus();
            }
        });
    }

    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onPrefChange = (e) => {
            if (currentTheme() === 'atlantic') {
                document.documentElement.setAttribute('data-pref', e.matches ? 'dark' : 'light');
            }
        };
        if (mq.addEventListener) mq.addEventListener('change', onPrefChange);
        else if (mq.addListener) mq.addListener(onPrefChange);
    }

    initHeroParallax();
    initReveals();
    animateHeroStats();

    if (document.getElementById('stats-grid')) {
        loadDashboard();
    }
});