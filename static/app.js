/* ------------------------------------------------------------------
   Shared client logic: run test, batch run, dashboard, theme, toasts
   ------------------------------------------------------------------ */

const RUN_TIMEOUT_MS = 180000;   // a full run is 2 provider calls; retries can take minutes
const API_TIMEOUT_MS = 30000;    // status / start / stop calls

async function fetchWithTimeout(url, opts = {}, timeoutMs = API_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, Object.assign({}, opts, { signal: controller.signal }));
    } finally {
        clearTimeout(timer);
    }
}

function showToast(message, type = 'info', durationMs = 5000) {
    let root = document.getElementById('toast-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'toast-root';
        root.className = 'toast-root';
        root.setAttribute('aria-live', 'polite');
        document.body.appendChild(root);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-on'));
    setTimeout(() => {
        toast.classList.remove('is-on');
        setTimeout(() => toast.remove(), 300);
    }, durationMs);
    return toast;
}

function timeoutError(timeoutMs) {
    const err = new Error(
        'Request timed out after ' + Math.round(timeoutMs / 1000) +
        ' seconds. The run may still finish on the server — check the Results page before retrying.'
    );
    err.isTimeout = true;
    return err;
}

async function runTest() {
    const modelSelect = document.getElementById('model-select');
    const modelName = modelSelect.value;
    const runBtn = document.getElementById('run-btn');
    const btnText = runBtn.querySelector('.btn-text');
    const btnLoading = runBtn.querySelector('.btn-loading');
    const resultsPanel = document.getElementById('results-panel');
    const errorPanel = document.getElementById('error-panel');
    const errorMessage = document.getElementById('error-message');

    runBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    if (resultsPanel) resultsPanel.style.display = 'none';
    if (errorPanel) errorPanel.style.display = 'none';

    try {
        const response = await fetchWithTimeout('/api/run-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName })
        }, RUN_TIMEOUT_MS);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }

        renderResults(data);
        if (resultsPanel) resultsPanel.style.display = 'block';
        if (errorPanel) errorPanel.style.display = 'none';
        showToast('Run #' + data.run_number + ' complete — ' + data.chosen_page, 'success', 4000);

    } catch (err) {
        const message = (err && err.name === 'AbortError')
            ? timeoutError(RUN_TIMEOUT_MS).message
            : (err.message || 'Unknown error');
        if (errorMessage) errorMessage.textContent = message;
        if (errorPanel) errorPanel.style.display = 'block';
        if (resultsPanel) resultsPanel.style.display = 'none';
        showToast(message, 'error', 8000);
    } finally {
        runBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

/* ----------------------------- Batch run ----------------------------- */

let batchPollInterval = null;

async function startBatchRun() {
    const checkboxes = document.querySelectorAll('input[name="batch-models"]:checked');
    const models = Array.from(checkboxes).map(cb => cb.value);
    const runsPerModelPage = parseInt(document.getElementById('runs-per-model-page').value) || 1;

    if (models.length === 0) {
        showToast('Select at least one model for the batch run.', 'error');
        return;
    }

    const startBtn = document.getElementById('batch-start-btn');
    const stopBtn = document.getElementById('batch-stop-btn');
    const progressDiv = document.getElementById('batch-progress');
    const progressCurrent = document.getElementById('progress-current');
    const progressErrors = document.getElementById('progress-errors');

    startBtn.disabled = true;
    startBtn.querySelector('.btn-text').style.display = 'none';
    startBtn.querySelector('.btn-loading').style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'inline-flex';
    if (progressDiv) progressDiv.style.display = 'block';
    if (progressCurrent) progressCurrent.style.display = 'block';
    if (progressErrors) progressErrors.style.display = 'none';

    try {
        const response = await fetchWithTimeout('/api/batch-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ models, runs_per_model_page: runsPerModelPage })
        }, API_TIMEOUT_MS);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to start batch run');
        }

        showToast('Batch run started — ' + models.length + ' model(s) × runs.', 'success', 4000);
        batchPollInterval = setInterval(pollBatchStatus, 2000);

    } catch (err) {
        const message = (err && err.name === 'AbortError')
            ? 'Could not reach the server to start the batch run. Refresh and try again.'
            : (err.message || 'Failed to start batch run');
        showToast(message, 'error', 8000);
        resetBatchUI();
    }
}

function stopBatchRun() {
    fetchWithTimeout('/api/batch-stop', { method: 'POST' }, API_TIMEOUT_MS)
        .then(() => {
            if (batchPollInterval) clearInterval(batchPollInterval);
            resetBatchUI();
            showToast('Batch run stopped.', 'info');
        })
        .catch(() => showToast('Could not reach the server to stop the batch run.', 'error'));
}

function resetBatchUI() {
    const startBtn = document.getElementById('batch-start-btn');
    const stopBtn = document.getElementById('batch-stop-btn');
    const progressDiv = document.getElementById('batch-progress');

    if (startBtn) {
        startBtn.disabled = false;
        startBtn.querySelector('.btn-text').style.display = 'inline';
        startBtn.querySelector('.btn-loading').style.display = 'none';
    }
    if (stopBtn) stopBtn.style.display = 'none';
    if (progressDiv) progressDiv.style.display = 'none';

    if (batchPollInterval) {
        clearInterval(batchPollInterval);
        batchPollInterval = null;
    }
}

async function pollBatchStatus() {
    try {
        const response = await fetchWithTimeout('/api/batch-status', {}, API_TIMEOUT_MS);
        const status = await response.json();

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressCost = document.getElementById('progress-cost');
        const progressCurrent = document.getElementById('progress-current');
        const currentModel = document.getElementById('current-model');
        const currentPage = document.getElementById('current-page');
        const progressErrors = document.getElementById('progress-errors');
        const errorsList = document.getElementById('errors-list');

        const pct = status.total > 0 ? (status.completed / status.total) * 100 : 0;
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressText) progressText.textContent = `${status.completed} / ${status.total} completed`;
        if (progressCost) progressCost.textContent = `Cost: $${status.current_cost.toFixed(4)}`;

        if (status.current_model && currentModel && currentPage) {
            currentModel.textContent = status.current_model;
            currentPage.textContent = status.current_page;
        }

        if (status.errors && status.errors.length > 0 && progressErrors && errorsList) {
            progressErrors.style.display = 'block';
            errorsList.innerHTML = status.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('');
        }

        if (!status.running) {
            if (batchPollInterval) clearInterval(batchPollInterval);
            batchPollInterval = null;
            resetBatchUI();
            showToast('Batch run finished.', 'success', 4000);
            if (document.getElementById('stats-grid')) loadDashboard();
        }

    } catch (err) {
        console.error('Failed to poll batch status:', err);
    }
}

/* ----------------------------- Run results ----------------------------- */

let featuresCache = null;

async function loadFeatures() {
    if (featuresCache) return featuresCache;
    try {
        const response = await fetchWithTimeout('/api/features', {}, API_TIMEOUT_MS);
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
                    <span class="result-value">${escapeHtml(document.getElementById('model-select').value)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Tier</span>
                    <span class="result-value">${escapeHtml(data.tier)}</span>
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

            <p class="result-saved">
                Saved to results/results.csv (run #${data.run_number} for this model + course combination)
            </p>
        `;
    });
}

/* ----------------------------- Dashboard ----------------------------- */

const PAGE_SIZE = 20;
const NEON_SKIN = document.documentElement.getAttribute('data-skin') === 'neon';
const CHART_GRID = NEON_SKIN ? 'rgba(255,255,255,0.07)' : '#efeeea';
const CHART_COLORS = ['#a855f7', '#d946ef', '#7c5cff', '#d9ee52', '#34d399', '#60a5fa'];
let overallChart = null;
let modelChart = null;
const dashboardState = { offset: 0, total: 0, loading: false };

function setDashboardError(message) {
    const box = document.getElementById('dashboard-error');
    const text = document.getElementById('dashboard-error-text');
    if (!box || !text) return;
    if (message) {
        text.textContent = message;
        box.style.display = 'flex';
    } else {
        box.style.display = 'none';
    }
}

async function loadDashboard() {
    setDashboardError(null);
    try {
        const response = await fetchWithTimeout('/api/results', {}, API_TIMEOUT_MS);
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const data = await response.json();
        renderStats(data.stats);
        renderSummary(data.stats);
        renderOverallChart(data.stats.course_counts);
        renderModelChart(data.stats.model_course_counts);
        dashboardState.total = data.total_runs || data.recent_runs.length;
        dashboardState.offset = data.recent_runs.length;
        renderRecentRuns(data.recent_runs, false);
        updateRunsCount(data.recent_runs.length);
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        setDashboardError('Could not load results: ' + (err.message || 'network error'));
    }
}

async function loadMoreRuns() {
    if (dashboardState.loading) return;
    dashboardState.loading = true;
    const btn = document.getElementById('load-more-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
    try {
        const url = `/api/results?offset=${dashboardState.offset}&limit=${PAGE_SIZE}`;
        const response = await fetchWithTimeout(url, {}, API_TIMEOUT_MS);
        if (!response.ok) throw new Error('Server returned ' + response.status);
        const data = await response.json();
        renderRecentRuns(data.recent_runs, true);
        dashboardState.offset += data.recent_runs.length;
        updateRunsCount(dashboardState.offset);
    } catch (err) {
        showToast('Could not load more runs: ' + (err.message || 'network error'), 'error');
    } finally {
        dashboardState.loading = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Load more'; }
    }
}

function updateRunsCount(shown) {
    const shownEl = document.getElementById('runs-shown-count');
    const totalEl = document.getElementById('runs-total-count');
    if (shownEl) shownEl.textContent = shown;
    if (totalEl) totalEl.textContent = dashboardState.total;
    const wrap = document.getElementById('load-more-wrap');
    if (wrap) wrap.style.display = shown < dashboardState.total ? 'flex' : 'none';
}

function renderStats(stats) {
    const runsEl = document.getElementById('stat-total-runs');
    if (!runsEl) return;
    runsEl.textContent = stats.total_runs;
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

function chartDefaults() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    Chart.defaults.color = NEON_SKIN ? '#98a2b8' : '#5c5a55';
}

function renderOverallChart(courseCounts) {
    const canvas = document.getElementById('overall-chart');
    const empty = document.getElementById('overall-empty');
    if (!canvas || typeof Chart === 'undefined') return;
    const hasData = courseCounts && Object.keys(courseCounts).length > 0;
    if (empty) empty.style.display = hasData ? 'none' : 'block';
    canvas.style.display = hasData ? 'block' : 'none';
    if (!hasData) return;

    chartDefaults();
    const entries = Object.entries(courseCounts).sort((a, b) => b[1] - a[1]);
    if (overallChart) overallChart.destroy();
    overallChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: entries.map(e => e[0]),
            datasets: [{
                label: 'Times chosen',
                data: entries.map(e => e[1]),
                backgroundColor: entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderRadius: 6,
                barThickness: 22
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: CHART_GRID } },
                y: { grid: { display: false } }
            }
        }
    });
}

function renderModelChart(modelCourseCounts) {
    const canvas = document.getElementById('model-chart');
    const empty = document.getElementById('model-empty');
    if (!canvas || typeof Chart === 'undefined') return;
    const hasData = modelCourseCounts && Object.keys(modelCourseCounts).length > 0;
    if (empty) empty.style.display = hasData ? 'none' : 'block';
    canvas.style.display = hasData ? 'block' : 'none';
    if (!hasData) return;

    chartDefaults();
    const models = Object.keys(modelCourseCounts).sort();
    const courses = [...new Set(models.flatMap(m => Object.keys(modelCourseCounts[m])))];

    const datasets = courses.map((course, i) => ({
        label: course,
        data: models.map(m => {
            const counts = modelCourseCounts[m];
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            return total > 0 ? Math.round(((counts[course] || 0) / total) * 1000) / 10 : 0;
        }),
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderWidth: 0
    }));

    if (modelChart) modelChart.destroy();
    modelChart = new Chart(canvas, {
        type: 'bar',
        data: { labels: models, datasets },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, padding: 16 } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x}% of ${ctx.label} runs`
                    }
                }
            },
            scales: {
                x: {
                    stacked: true, max: 100,
                    ticks: { callback: v => v + '%', precision: 0 },
                    grid: { color: CHART_GRID }
                },
                y: { stacked: true, grid: { display: false } }
            }
        }
    });
}

function renderRecentRuns(runs, append) {
    const tbody = document.getElementById('runs-tbody');
    if (!tbody) return;
    if (!append) tbody.innerHTML = '';
    if (!runs || runs.length === 0) {
        if (!append) tbody.innerHTML = '<tr><td colspan="13" class="loading">No runs recorded yet.</td></tr>';
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
    if (append) tbody.insertAdjacentHTML('beforeend', html);
    else tbody.innerHTML = html;
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

/* ----------------------------- Theme (classic UI) ----------------------------- */

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
