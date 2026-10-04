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

function renderResults(data) {
    const container = document.getElementById('results-content');
    const interview = data.interview_data;
    const choice = data.choice_resp;
    const interviewResp = data.interview_resp;
    const totalCost = data.total_cost_usd;

    container.innerHTML = `
        <div class="results-summary">
            <div class="result-item">
                <span class="result-label">Chosen Course</span>
                <span class="result-value">${escapeHtml(data.chosen_page)}</span>
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
        tbody.innerHTML = '<tr><td colspan="12" class="loading">No runs recorded yet.</td></tr>';
        return;
    }

    let html = '';
    for (const run of runs) {
        const totalCost = (parseFloat(run.choice_cost_usd) + parseFloat(run.interview_cost_usd)).toFixed(6);
        html += `
            <tr>
                <td>${formatTimestamp(run.timestamp)}</td>
                <td>${escapeHtml(run.model)}</td>
                <td>${escapeHtml(run.tier)}</td>
                <td>${run.run_number}</td>
                <td>${escapeHtml(run.which_page_won)}</td>
                <td>${run.q1_price}</td>
                <td>${run.q2_reviews}</td>
                <td>${run.q3_credentials}</td>
                <td>${run.q4_description}</td>
                <td>${run.q5_clarity}</td>
                <td class="reason">${escapeHtml(run.q6_open)}</td>
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stats-grid')) {
        loadDashboard();
    }
});