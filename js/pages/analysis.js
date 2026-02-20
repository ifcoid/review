/**
 * pages/analysis.js — Analysis & Statistics
 * Stat cards, bar chart (year), pie chart (source), QA histogram
 */

// Polyfill ctx.roundRect for older browsers (pre-Chrome 99)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        const radius = Array.isArray(r) ? r[0] : (r || 0);
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + w - radius, y);
        this.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.lineTo(x + w, y + h - radius);
        this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.lineTo(x + radius, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        return this;
    };
}

export function renderAnalysis(container, store) {
    const stats = store.getStats();
    const studies = store.state.studies;

    container.innerHTML = `
    <div class="page-header">
        <h1>Analisis</h1>
        <p class="page-subtitle">Statistik dan visualisasi data studi yang telah dikumpulkan.</p>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <div class="stat-value">${stats.totalFound}</div>
            <div class="stat-label">Total Ditemukan</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Studi</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-value">${stats.included}</div>
            <div class="stat-label">Dimasukkan</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="stat-value">${stats.maybe}</div>
            <div class="stat-label">Perlu Ditinjau</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon red">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <div class="stat-value">${stats.excluded}</div>
            <div class="stat-label">Dikecualikan</div>
        </div>
    </div>

    ${studies.length === 0 ? `<div class="section-card">${emptyState('Belum ada data', 'Tambahkan studi untuk melihat analisis.')}</div>` : `
    <div class="two-col">
        <!-- Bar Chart: Studi per Tahun -->
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title">
                    <div class="section-card-title-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    Studi per Tahun
                </div>
            </div>
            <div class="chart-wrap" style="height:220px">
                <canvas id="chartYear"></canvas>
            </div>
        </div>

        <!-- Pie Chart: Studi per Sumber -->
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title">
                    <div class="section-card-title-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
                    </div>
                    Studi per Sumber
                </div>
            </div>
            <div class="chart-wrap" style="height:220px">
                <canvas id="chartSource"></canvas>
            </div>
        </div>
    </div>

    <!-- QA Distribution -->
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                Distribusi Skor QA (Studi Dimasukkan)
            </div>
        </div>
        <div id="qaDistribution">${renderQADistribution(studies, store)}</div>
    </div>

    <!-- Verdict Breakdown -->
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">Rincian Verdict</div>
        </div>
        <div id="verdictBreakdown">${renderVerdictBreakdown(stats)}</div>
    </div>
    `}
    `;

    if (studies.length > 0) {
        requestAnimationFrame(() => {
            drawBarChart(studies);
            drawPieChart(studies);
        });
    }
}

function drawBarChart(studies) {
    const canvas = document.getElementById('chartYear');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Prepare data
    const yearMap = {};
    studies.forEach(s => {
        if (s.year) yearMap[s.year] = (yearMap[s.year] || 0) + 1;
    });
    const years = Object.keys(yearMap).sort();
    const vals = years.map(y => yearMap[y]);
    const max = Math.max(...vals, 1);

    // Set canvas size
    const W = canvas.parentElement.offsetWidth || 400;
    const H = 200;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const padL = 36, padR = 16, padT = 16, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const barW = Math.max(8, (chartW / Math.max(years.length, 1)) * 0.6);
    const gap = chartW / Math.max(years.length, 1);

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    const gridCount = 4;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
        const y = padT + (chartH / gridCount) * i;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(max - (max / gridCount) * i), padL - 4, y + 4);
    }

    // Bars
    years.forEach((year, i) => {
        const val = yearMap[year];
        const bH = (val / max) * chartH;
        const x = padL + gap * i + (gap - barW) / 2;
        const y = padT + chartH - bH;

        const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
        grad.addColorStop(0, '#4F46E5');
        grad.addColorStop(1, '#818CF8');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bH, [4, 4, 0, 0]);
        ctx.fill();

        // Label
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(year, x + barW / 2, H - padB + 16);

        // Value
        if (bH > 16) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText(val, x + barW / 2, y + 14);
        }
    });
}

function drawPieChart(studies) {
    const canvas = document.getElementById('chartSource');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const srcMap = {};
    studies.forEach(s => {
        const src = s.source || 'Tidak diketahui';
        srcMap[src] = (srcMap[src] || 0) + 1;
    });

    const labels = Object.keys(srcMap);
    const vals = labels.map(l => srcMap[l]);
    const total = vals.reduce((a, b) => a + b, 0);

    const COLORS = ['#4F46E5', '#818CF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899'];

    const W = canvas.parentElement.offsetWidth || 300;
    const H = 200;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.35;
    const cy = H / 2;
    const r = Math.min(cx, cy) - 16;

    let startAngle = -Math.PI / 2;
    vals.forEach((v, i) => {
        const slice = (v / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + slice);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        startAngle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 6);
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('studi', cx, cy + 10);

    // Legend
    const lx = W * 0.65;
    let ly = 20;
    labels.slice(0, 8).forEach((label, i) => {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath();
        ctx.roundRect(lx, ly, 10, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '10px Inter, sans-serif';
        const pct = Math.round((vals[i] / total) * 100);
        ctx.fillText(`${label.length > 14 ? label.slice(0, 12) + '…' : label} (${pct}%)`, lx + 14, ly);
        ly += 20;
    });
}

function renderQADistribution(studies, store) {
    const included = studies.filter(s => s.verdict === 'include');
    if (included.length === 0) return '<p class="text-muted text-sm">Belum ada studi yang dimasukkan untuk dievaluasi QA.</p>';

    const scores = included.map(s => ({ title: s.title, score: store.getQAScore(s) })).filter(x => x.score !== null);
    if (scores.length === 0) return '<p class="text-muted text-sm">Belum ada studi dengan penilaian QA.</p>';

    return scores.map(({ title, score }) => {
        const cls = score >= 7 ? 'green' : score >= 4 ? 'amber' : 'red';
        const color = score >= 7 ? 'var(--c-success)' : score >= 4 ? 'var(--c-warning)' : 'var(--c-danger)';
        return `
        <div style="margin-bottom:.75rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.25rem">
                <span style="font-size:.8125rem;font-weight:500;max-width:80%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(title)}</span>
                <strong style="font-size:.8125rem;color:${color}">${score}/10</strong>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${score * 10}%;background:${color}"></div>
            </div>
        </div>`;
    }).join('');
}

function renderVerdictBreakdown(stats) {
    const total = stats.total || 1;
    const items = [
        { label: 'Dimasukkan', count: stats.included, color: 'var(--c-success)' },
        { label: 'Mungkin', count: stats.maybe, color: 'var(--c-maybe)' },
        { label: 'Dikecualikan', count: stats.excluded, color: 'var(--c-danger)' },
        { label: 'Belum ditetapkan', count: stats.pending, color: 'var(--c-text-muted)' },
    ];
    return items.map(({ label, count, color }) => `
        <div style="margin-bottom:.75rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:.25rem">
                <span style="font-size:.8125rem;font-weight:500">${label}</span>
                <span style="font-size:.8125rem;color:${color};font-weight:700">${count} (${Math.round((count / total) * 100)}%)</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill" style="width:${(count / total) * 100}%;background:${color}"></div>
            </div>
        </div>`).join('');
}

function emptyState(title, desc) {
    return `<div class="empty-state">
        <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <h3>${title}</h3><p>${desc}</p>
    </div>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
