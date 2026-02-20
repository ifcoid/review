/**
 * pages/conducting.js — Conducting phase
 * Search sessions log + Study import/screening
 */

export function renderConducting(container, store) {
    container.innerHTML = `
    <div class="page-header">
        <h1>Conducting</h1>
        <p class="page-subtitle">Catat sesi pencarian, impor studi, dan lakukan skrining awal.</p>
    </div>

    <div class="tabs">
        <button class="tab-btn active" data-tab="search-log">Log Pencarian</button>
        <button class="tab-btn" data-tab="screening">Skrining Studi</button>
        <button class="tab-btn" data-tab="import">Impor Studi</button>
    </div>

    <div class="tab-panel active" id="tab-search-log">${renderSearchLog(store)}</div>
    <div class="tab-panel" id="tab-screening">${renderScreening(store)}</div>
    <div class="tab-panel" id="tab-import">${renderImport()}</div>
    `;

    initTabs(container);
    initSearchLog(container, store);
    initScreening(container, store);
    initImport(container, store);
}

/* ---- Search Log ---- */
function renderSearchLog(store) {
    const searches = store.state.conducting.searches;
    const sources = store.state.planning.sources;
    const total = searches.reduce((s, x) => s + (Number(x.resultCount) || 0), 0);

    const rows = searches.map(s => {
        const src = sources.find(x => x.id === s.sourceId);
        return `
        <tr>
            <td>${s.date || '-'}</td>
            <td><span class="badge badge-primary">${escHtml(src?.name || s.sourceName || '-')}</span></td>
            <td class="td-truncate" title="${escHtml(s.query)}">${escHtml(s.query)}</td>
            <td><strong>${s.resultCount || 0}</strong></td>
            <td class="text-muted text-sm">${escHtml(s.notes || '')}</td>
            <td>
                <button class="btn btn-ghost btn-icon btn-del-search" data-id="${s.id}" style="color:var(--c-danger)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
            </td>
        </tr>`;
    }).join('');

    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                Log Sesi Pencarian
                ${total > 0 ? `<span class="badge badge-primary">${total} total ditemukan</span>` : ''}
            </div>
            <button class="btn btn-primary btn-sm" id="btnAddSearch">+ Tambah Sesi</button>
        </div>
        ${searches.length === 0 ? emptyState('Belum ada sesi pencarian', 'Catat sesi pencarian di setiap database yang Anda gunakan.') : `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Sumber</th>
                        <th>Query Pencarian</th>
                        <th>Hasil</th>
                        <th>Catatan</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`}
    </div>`;
}

function initSearchLog(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddSearch')) openSearchModal(store);
        const del = e.target.closest('.btn-del-search');
        if (del) {
            if (confirm('Hapus sesi pencarian ini?')) {
                store.deleteSearch(del.dataset.id);
                window.reloadCurrentPage();
            }
        }
    });
}

function openSearchModal(store) {
    const sources = store.state.planning.sources;
    const srcOptions = sources.length > 0
        ? sources.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('')
        : '<option value="">-- Tidak ada sumber (tambahkan di Planning) --</option>';

    window.showModal('Tambah Sesi Pencarian',
        `<div class="form-group">
            <label class="form-label">Sumber / Database</label>
            <select id="srSource" class="form-control form-select">
                ${srcOptions}
                <option value="__custom">Lainnya (custom)</option>
            </select>
        </div>
        <div class="form-group" id="customSrcWrap" style="display:none">
            <label class="form-label">Nama Sumber</label>
            <input type="text" id="srCustomName" class="form-control" placeholder="Nama database...">
        </div>
        <div class="form-group">
            <label class="form-label">Query Pencarian<span>*</span></label>
            <textarea id="srQuery" class="form-control" rows="3" placeholder='("machine learning" OR "deep learning") AND ("EEG" OR "brain-computer interface")'></textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Jumlah Hasil</label>
                <input type="number" id="srCount" class="form-control" min="0" value="0">
            </div>
            <div class="form-group">
                <label class="form-label">Tanggal</label>
                <input type="date" id="srDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Catatan</label>
            <input type="text" id="srNotes" class="form-control" placeholder="Filter yang digunakan, batasan, dll.">
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
         <button class="btn btn-primary" id="btnSaveSearch">Simpan</button>`
    );

    document.getElementById('srSource').addEventListener('change', (e) => {
        document.getElementById('customSrcWrap').style.display = e.target.value === '__custom' ? 'block' : 'none';
    });

    document.getElementById('btnSaveSearch').addEventListener('click', () => {
        const sourceId = document.getElementById('srSource').value;
        const query = document.getElementById('srQuery').value.trim();
        if (!query) { alert('Query pencarian wajib diisi.'); return; }
        const data = {
            sourceId: sourceId === '__custom' ? null : sourceId,
            sourceName: sourceId === '__custom' ? document.getElementById('srCustomName').value.trim() : null,
            query,
            resultCount: Number(document.getElementById('srCount').value) || 0,
            date: document.getElementById('srDate').value,
            notes: document.getElementById('srNotes').value.trim(),
        };
        store.addSearch(data);
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast('Sesi pencarian dicatat!', 'success');
    });
}

/* ---- Screening ---- */
function renderScreening(store) {
    const studies = store.state.studies;
    const filter = '_all';

    if (studies.length === 0) {
        return `<div class="section-card">${emptyState('Belum ada studi', 'Impor studi di tab "Impor Studi" untuk mulai melakukan skrining.')}</div>`;
    }

    const rows = studies.map(s => {
        const verdictClass = s.verdict !== 'pending' ? `row-${s.verdict}` : '';
        return `
        <tr class="${verdictClass}" data-id="${s.id}">
            <td class="td-title">
                ${escHtml(s.title)}
                <small>${escHtml(s.authors)} ${s.year ? `(${s.year})` : ''}</small>
            </td>
            <td><span class="badge badge-gray">${escHtml(s.source || '-')}</span></td>
            <td>${s.year || '-'}</td>
            <td>
                <div class="verdict-btns">
                    <button class="verdict-btn include ${s.verdict === 'include' ? 'active' : ''}" data-id="${s.id}" data-verdict="include">✓</button>
                    <button class="verdict-btn maybe  ${s.verdict === 'maybe' ? 'active' : ''}" data-id="${s.id}" data-verdict="maybe">?</button>
                    <button class="verdict-btn exclude ${s.verdict === 'exclude' ? 'active' : ''}" data-id="${s.id}" data-verdict="exclude">✗</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    const stats = store.getStats();

    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">Skrining Studi</div>
            <div class="flex gap-sm">
                <span class="badge badge-success">✓ ${stats.included}</span>
                <span class="badge badge-purple">? ${stats.maybe}</span>
                <span class="badge badge-danger">✗ ${stats.excluded}</span>
                <span class="badge badge-gray">— ${stats.pending}</span>
            </div>
        </div>
        <div class="filter-bar">
            <div class="search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" class="form-control" id="screenSearch" placeholder="Cari judul atau penulis...">
            </div>
            <button class="filter-chip active" data-filter="all">Semua</button>
            <button class="filter-chip chip-include" data-filter="include">Dimasukkan</button>
            <button class="filter-chip chip-maybe" data-filter="maybe">Mungkin</button>
            <button class="filter-chip chip-exclude" data-filter="exclude">Dikecualikan</button>
            <button class="filter-chip" data-filter="pending">Belum</button>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr>
                    <th>Judul</th>
                    <th>Sumber</th>
                    <th>Tahun</th>
                    <th>Verdict</th>
                </tr></thead>
                <tbody id="screeningBody">${rows}</tbody>
            </table>
        </div>
    </div>`;
}

function initScreening(container, store) {
    // Verdict buttons
    container.addEventListener('click', (e) => {
        const vBtn = e.target.closest('.verdict-btn');
        if (vBtn) {
            const id = vBtn.dataset.id;
            const verdict = vBtn.dataset.verdict;
            const study = store.state.studies.find(s => s.id === id);
            // Toggle off if same
            const newVerdict = study?.verdict === verdict ? 'pending' : verdict;
            store.setVerdict(id, newVerdict);
            // Update row class without full reload
            const row = vBtn.closest('tr');
            row.className = newVerdict !== 'pending' ? `row-${newVerdict}` : '';
            row.querySelectorAll('.verdict-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.verdict === newVerdict);
            });
            // Update header badges
            const stats = store.getStats();
            container.querySelector('.badge-success')?.let?.((el) => el.textContent = `✓ ${stats.included}`);
        }

        // Filter chips
        const chip = e.target.closest('.filter-chip');
        if (chip) {
            container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const filter = chip.dataset.filter;
            filterScreening(container, store, filter);
        }
    });

    // Search
    container.querySelector('#screenSearch')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        container.querySelectorAll('#screeningBody tr').forEach(row => {
            const text = row.querySelector('.td-title')?.textContent.toLowerCase() || '';
            row.style.display = text.includes(q) ? '' : 'none';
        });
    });
}

function filterScreening(container, store, filter) {
    container.querySelectorAll('#screeningBody tr').forEach(row => {
        const id = row.dataset.id;
        const study = store.state.studies.find(s => s.id === id);
        if (!study) return;
        const show = filter === 'all' || study.verdict === filter;
        row.style.display = show ? '' : 'none';
    });
}

/* ---- Import ---- */
function renderImport() {
    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                Impor &amp; Tambah Studi
            </div>
        </div>
        <p class="text-muted mb-md">Tambahkan studi secara manual atau tempel beberapa entri sekaligus dari RIS/BibTeX.</p>
        <div class="two-col">
            <div>
                <h4 class="font-semibold mb-md" style="font-size:.875rem">Tambah Manual</h4>
                <div id="manualImportForm">${renderManualForm()}</div>
                <button class="btn btn-primary mt-md" id="btnSaveManual">Tambah Studi</button>
            </div>
            <div>
                <h4 class="font-semibold mb-md" style="font-size:.875rem">Tempel Judul (Batch)</h4>
                <p class="text-muted text-sm mb-md">Format: satu baris per studi — "Judul | Penulis | Tahun | Sumber"</p>
                <textarea id="batchInput" class="form-control" rows="10" placeholder="Deep Learning for EEG | Zhang et al. | 2023 | IEEE
A Survey on BCI | Smith, J. | 2022 | Scopus
..."></textarea>
                <button class="btn btn-secondary mt-md" id="btnBatchImport">Impor Batch</button>
            </div>
        </div>
    </div>`;
}

function renderManualForm(data = {}) {
    return `
        <div class="form-group">
            <label class="form-label">Judul<span>*</span></label>
            <input type="text" id="impTitle" class="form-control" value="${escHtml(data.title || '')}" placeholder="Judul lengkap artikel...">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Penulis</label>
                <input type="text" id="impAuthors" class="form-control" value="${escHtml(data.authors || '')}" placeholder="Smith J., Doe A.">
            </div>
            <div class="form-group">
                <label class="form-label">Tahun</label>
                <input type="number" id="impYear" class="form-control" value="${escHtml(data.year || '')}" placeholder="2024" min="1900" max="2100">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Sumber / Jurnal</label>
                <input type="text" id="impSource" class="form-control" value="${escHtml(data.source || '')}" placeholder="IEEE Transactions on...">
            </div>
            <div class="form-group">
                <label class="form-label">DOI</label>
                <input type="text" id="impDOI" class="form-control" value="${escHtml(data.doi || '')}" placeholder="10.1109/...">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Abstrak</label>
            <textarea id="impAbstract" class="form-control" rows="4" placeholder="Tempel abstrak di sini...">${escHtml(data.abstract || '')}</textarea>
        </div>`;
}

function initImport(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnSaveManual')) {
            const title = document.getElementById('impTitle')?.value.trim();
            if (!title) { alert('Judul wajib diisi.'); return; }
            store.addStudy({
                title,
                authors: document.getElementById('impAuthors')?.value.trim(),
                year: document.getElementById('impYear')?.value.trim(),
                source: document.getElementById('impSource')?.value.trim(),
                doi: document.getElementById('impDOI')?.value.trim(),
                abstract: document.getElementById('impAbstract')?.value.trim(),
            });
            // Reset form
            container.querySelector('#manualImportForm').innerHTML = renderManualForm();
            window.showToast('Studi berhasil ditambahkan!', 'success');
            window.reloadCurrentPage();
        }

        if (e.target.closest('#btnBatchImport')) {
            const raw = document.getElementById('batchInput')?.value.trim();
            if (!raw) return;
            const lines = raw.split('\n').filter(Boolean);
            let count = 0;
            lines.forEach(line => {
                const parts = line.split('|').map(p => p.trim());
                if (parts[0]) {
                    store.addStudy({ title: parts[0], authors: parts[1] || '', year: parts[2] || '', source: parts[3] || '' });
                    count++;
                }
            });
            document.getElementById('batchInput').value = '';
            window.showToast(`${count} studi berhasil diimpor!`, 'success');
            window.reloadCurrentPage();
        }
    });
}

/* ---- Tabs ---- */
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        </div>
        <h3>${title}</h3><p>${desc}</p>
    </div>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
