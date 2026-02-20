/**
 * pages/reporting.js — Reporting phase
 * PRISMA flow diagram, summary table, export
 */

export function renderReporting(container, store) {
    const stats = store.getStats();
    const studies = store.state.studies;
    const included = studies.filter(s => s.verdict === 'include');
    const excluded = studies.filter(s => s.verdict === 'exclude');
    const maybe = studies.filter(s => s.verdict === 'maybe');

    // PRISMA numbers
    const identified = stats.totalFound;
    const screened = studies.length;
    const eligibility = included.length + maybe.length;
    const finalIncl = included.length;
    const exclScreen = excluded.length;
    const exclElig = maybe.length; // for simplicity: "maybe" filtered at eligibility
    const duplicates = 0; // user can set manually

    container.innerHTML = `
    <div class="page-header">
        <h1>Pelaporan</h1>
        <p class="page-subtitle">PRISMA flow diagram, ringkasan studi, dan ekspor hasil.</p>
    </div>

    <div class="tabs">
        <button class="tab-btn active" data-tab="prisma">PRISMA Flow</button>
        <button class="tab-btn" data-tab="summary">Ringkasan Studi</button>
        <button class="tab-btn" data-tab="export">Ekspor</button>
    </div>

    <!-- PRISMA -->
    <div class="tab-panel active" id="tab-prisma">
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title">
                    <div class="section-card-title-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
                    </div>
                    PRISMA 2020 Flow Diagram
                </div>
                <button class="btn btn-secondary btn-sm" id="btnPrintPrisma">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    Print / PDF
                </button>
            </div>
            <div class="prisma-container" id="prismaFlow">
                ${renderPRISMA({ identified, screened, eligibility, finalIncl, exclScreen, exclElig, duplicates })}
            </div>
        </div>
    </div>

    <!-- Summary Table -->
    <div class="tab-panel" id="tab-summary">
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title">Studi yang Dimasukkan (${finalIncl})</div>
            </div>
            ${included.length === 0
            ? emptyState('Belum ada studi yang dimasukkan', 'Tetapkan verdict "Include" pada studi di tab Conducting atau Studi.')
            : `<div class="table-wrap">
                    <table class="data-table">
                        <thead><tr>
                            <th>#</th>
                            <th>Judul</th>
                            <th>Penulis</th>
                            <th>Tahun</th>
                            <th>Sumber</th>
                            <th>QA</th>
                            <th>Metodologi</th>
                            <th>Temuan</th>
                        </tr></thead>
                        <tbody>
                            ${included.map((s, i) => {
                const qa = store.getQAScore(s);
                return `<tr>
                                    <td>${i + 1}</td>
                                    <td class="td-title">${escHtml(s.title)}</td>
                                    <td class="text-muted">${escHtml(s.authors || '-')}</td>
                                    <td>${escHtml(s.year || '-')}</td>
                                    <td><span class="badge badge-primary">${escHtml(s.source || '-')}</span></td>
                                    <td><span class="badge ${qa >= 7 ? 'badge-success' : qa >= 4 ? 'badge-warning' : 'badge-danger'}">${qa !== null ? qa + '/10' : '-'}</span></td>
                                    <td class="td-truncate text-muted">${escHtml(s.extractedData?.methodology || '-')}</td>
                                    <td class="td-truncate text-muted">${escHtml(s.extractedData?.findings || '-')}</td>
                                </tr>`;
            }).join('')}
                        </tbody>
                    </table>
                </div>`}
        </div>
    </div>

    <!-- Export -->
    <div class="tab-panel" id="tab-export">
        <div class="two-col">
            <div class="section-card">
                <div class="section-card-header">
                    <div class="section-card-title">Ekspor CSV</div>
                </div>
                <p class="text-muted text-sm mb-md">Unduh semua studi yang dimasukkan dalam format CSV yang dapat dibuka di Excel atau Google Sheets.</p>
                <button class="btn btn-primary" id="btnExportCSV">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Unduh CSV
                </button>
            </div>
            <div class="section-card">
                <div class="section-card-header">
                    <div class="section-card-title">Ringkasan Teks</div>
                </div>
                <p class="text-muted text-sm mb-md">Salin ringkasan statistik review Anda dalam format teks terstruktur.</p>
                <button class="btn btn-secondary" id="btnCopySummary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Salin Teks
                </button>
                <div id="summaryTextArea" class="mt-md">${renderSummaryText(store, stats, included)}</div>
            </div>
        </div>

        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title">Ekspor Referensi (RIS / BibTeX)</div>
            </div>
            <p class="text-muted text-sm mb-md">Salin referensi studi yang dimasukkan dalam format BibTeX untuk digunakan di LaTeX atau Mendeley.</p>
            <div class="flex gap-sm mb-md">
                <button class="btn btn-secondary btn-sm" id="btnCopyBib">Salin BibTeX</button>
                <button class="btn btn-secondary btn-sm" id="btnCopyRIS">Salin RIS</button>
            </div>
            <textarea id="bibOutput" class="form-control" rows="10" readonly>${generateBibTeX(included)}</textarea>
        </div>
    </div>
    `;

    initTabs(container);
    initReporting(container, store, included, stats);
}

function renderPRISMA({ identified, screened, eligibility, finalIncl, exclScreen, exclElig, duplicates }) {
    return `
    <!-- Phase 1: Identification -->
    <div class="prisma-row">
        <div class="prisma-box primary">
            <h4>Identifikasi</h4>
            <div class="prisma-num">${identified}</div>
            <div class="prisma-label">Rekaman teridentifikasi dari database</div>
        </div>
        <div class="prisma-h-line"></div>
        <div class="prisma-box" style="opacity:.5">
            <h4>Sumber lain</h4>
            <div class="prisma-num">0</div>
            <div class="prisma-label">Rekaman dari sumber lain</div>
        </div>
    </div>
    <div class="prisma-arrow down">↓</div>

    <!-- Deduplication -->
    <div class="prisma-row">
        <div class="prisma-box amber">
            <h4>Setelah Deduplication</h4>
            <div class="prisma-num">${identified - duplicates}</div>
            <div class="prisma-label">Rekaman unik untuk disaring</div>
        </div>
        <div class="prisma-h-line"></div>
        <div class="prisma-excl">
            <strong>${duplicates}</strong>
            Duplikat dihapus
        </div>
    </div>
    <div class="prisma-arrow down">↓</div>

    <!-- Screening -->
    <div class="prisma-row">
        <div class="prisma-box amber">
            <h4>Skrining (Screening)</h4>
            <div class="prisma-num">${screened}</div>
            <div class="prisma-label">Rekaman disaring</div>
        </div>
        <div class="prisma-h-line"></div>
        <div class="prisma-excl">
            <strong>${exclScreen}</strong>
            Dikecualikan (judul/abstrak)
        </div>
    </div>
    <div class="prisma-arrow down">↓</div>

    <!-- Eligibility -->
    <div class="prisma-row">
        <div class="prisma-box green">
            <h4>Kelayakan (Eligibility)</h4>
            <div class="prisma-num">${eligibility}</div>
            <div class="prisma-label">Artikel teks lengkap dinilai</div>
        </div>
        <div class="prisma-h-line"></div>
        <div class="prisma-excl">
            <strong>${exclElig}</strong>
            Dikecualikan (alasan lain)
        </div>
    </div>
    <div class="prisma-arrow down">↓</div>

    <!-- Included -->
    <div class="prisma-row">
        <div class="prisma-box green">
            <h4>Dimasukkan</h4>
            <div class="prisma-num" style="color:var(--c-success)">${finalIncl}</div>
            <div class="prisma-label">Studi dimasukkan dalam sintesis</div>
        </div>
    </div>`;
}

function renderSummaryText(store, stats, included) {
    const title = store.state.meta.title || 'Systematic Literature Review';
    const now = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    return `<pre style="background:var(--c-bg);padding:1rem;border-radius:var(--r-md);font-size:.8125rem;white-space:pre-wrap;color:var(--c-text)">Judul Review: ${title}
Tanggal: ${now}

Statistik Pencarian:
- Total Studi Ditemukan: ${stats.totalFound}
- Total Studi Diperiksa: ${stats.total}
- Dimasukkan: ${stats.included}
- Dikecualikan: ${stats.excluded}
- Perlu Ditinjau: ${stats.maybe}

Studi yang Dimasukkan (n=${included.length}):
${included.map((s, i) => `${i + 1}. ${s.title} (${s.authors}, ${s.year})`).join('\n') || '(belum ada)'}
</pre>`;
}

function generateBibTeX(studies) {
    return studies.map((s, i) => {
        const key = `study${i + 1}`;
        const author = s.authors || 'Unknown';
        const year = s.year || '0000';
        const title = s.title || 'Unknown';
        const journal = s.source || '';
        const doi = s.doi || '';
        return `@article{${key},
  author  = {${author}},
  title   = {{${title}}},
  journal = {${journal}},
  year    = {${year}},
  doi     = {${doi}},
}`;
    }).join('\n\n') || '% Belum ada studi yang dimasukkan.';
}

function initReporting(container, store, included, stats) {
    container.querySelector('#btnPrintPrisma')?.addEventListener('click', () => window.print());

    container.querySelector('#btnExportCSV')?.addEventListener('click', () => {
        const headers = ['No', 'Judul', 'Penulis', 'Tahun', 'Sumber', 'DOI', 'QA Score', 'Metodologi', 'Temuan'];
        const rows = included.map((s, i) => [
            i + 1,
            `"${(s.title || '').replace(/"/g, '""')}"`,
            `"${(s.authors || '').replace(/"/g, '""')}"`,
            s.year || '',
            s.source || '',
            s.doi || '',
            store.getQAScore(s) ?? '',
            `"${(s.extractedData?.methodology || '').replace(/"/g, '""')}"`,
            `"${(s.extractedData?.findings || '').replace(/"/g, '""')}"`,
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'slr-included-studies.csv'; a.click();
        URL.revokeObjectURL(url);
        window.showToast('CSV berhasil diunduh!', 'success');
    });

    container.querySelector('#btnCopySummary')?.addEventListener('click', () => {
        const pre = container.querySelector('#summaryTextArea pre');
        navigator.clipboard.writeText(pre?.textContent || '').then(() => window.showToast('Teks disalin!', 'success'));
    });

    container.querySelector('#btnCopyBib')?.addEventListener('click', () => {
        const bib = container.querySelector('#bibOutput').value;
        navigator.clipboard.writeText(bib).then(() => window.showToast('BibTeX disalin!', 'success'));
    });

    container.querySelector('#btnCopyRIS')?.addEventListener('click', () => {
        const ris = included.map(s => `TY  - JOUR
AU  - ${s.authors || 'Unknown'}
TI  - ${s.title || ''}
PY  - ${s.year || ''}
JO  - ${s.source || ''}
DO  - ${s.doi || ''}
ER  - `).join('\n\n') || '% Belum ada studi.';
        navigator.clipboard.writeText(ris).then(() => window.showToast('RIS disalin!', 'success'));
    });
}

function initTabs(container) {
    const tabs = container.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = container.querySelector(`#tab-${btn.dataset.tab}`);
            if (panel) panel.classList.add('active');
        });
    });
}

function emptyState(title, desc) {
    return `<div class="empty-state">
        <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        </div>
        <h3>${title}</h3><p>${desc}</p>
    </div>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
