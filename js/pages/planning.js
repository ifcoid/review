/**
 * pages/planning.js — Planning phase
 * Research Questions, PICO, Criteria, Keywords, Sources
 */

export function renderPlanning(container, store) {
    const s = store.state.planning;

    container.innerHTML = `
    <div class="page-header">
        <h1>Planning</h1>
        <p class="page-subtitle">Tentukan pertanyaan penelitian, kriteria, kata kunci, dan sumber pencarian.</p>
    </div>

    <div class="tabs">
        <button class="tab-btn active" data-tab="rq">Research Questions</button>
        <button class="tab-btn" data-tab="pico">PICO</button>
        <button class="tab-btn" data-tab="criteria">Kriteria</button>
        <button class="tab-btn" data-tab="keywords">Kata Kunci</button>
        <button class="tab-btn" data-tab="sources">Sumber</button>
    </div>

    <div class="tab-panel active" id="tab-rq">${renderRQ(s)}</div>
    <div class="tab-panel" id="tab-pico">${renderPICO(s)}</div>
    <div class="tab-panel" id="tab-criteria">${renderCriteria(s)}</div>
    <div class="tab-panel" id="tab-keywords">${renderKeywords(s)}</div>
    <div class="tab-panel" id="tab-sources">${renderSources(s)}</div>
    `;

    initTabs(container);
    initRQ(container, store);
    initPICO(container, store);
    initCriteria(container, store);
    initKeywords(container, store);
    initSources(container, store);
}

/* ---- Research Questions ---- */
function renderRQ(s) {
    const items = s.questions.map((q, i) => `
        <div class="item-row" data-id="${q.id}">
            <div class="item-number">${i + 1}</div>
            <div class="item-content">
                <div class="item-title">${escHtml(q.code)}: ${escHtml(q.question)}</div>
                ${q.rationale ? `<div class="item-desc">${escHtml(q.rationale)}</div>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn btn-ghost btn-icon btn-edit-rq" data-id="${q.id}" title="Edit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn btn-ghost btn-icon btn-del-rq" data-id="${q.id}" title="Hapus" style="color:var(--c-danger)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                Research Questions
            </div>
            <button class="btn btn-primary btn-sm" id="btnAddRQ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah RQ
            </button>
        </div>
        ${s.questions.length === 0
            ? emptyState('Belum ada Research Question', 'Klik "Tambah RQ" untuk menambahkan pertanyaan penelitian.')
            : `<div class="item-list">${items}</div>`}
    </div>`;
}

function initRQ(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddRQ')) openRQModal(store);
        const editBtn = e.target.closest('.btn-edit-rq');
        if (editBtn) {
            const id = editBtn.dataset.id;
            const q = store.state.planning.questions.find(q => q.id === id);
            if (q) openRQModal(store, q);
        }
        const delBtn = e.target.closest('.btn-del-rq');
        if (delBtn) {
            if (confirm('Hapus Research Question ini?')) {
                store.deleteQuestion(delBtn.dataset.id);
                window.reloadCurrentPage();
            }
        }
    });
}

function openRQModal(store, existing = null) {
    const title = existing ? 'Edit Research Question' : 'Tambah Research Question';
    const body = `
        <div class="form-group">
            <label class="form-label">Pertanyaan<span>*</span></label>
            <textarea id="rqQuestion" class="form-control" rows="3" placeholder="Apa pengaruh X terhadap Y pada Z?">${existing ? escHtml(existing.question) : ''}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Rasional / Justifikasi</label>
            <textarea id="rqRationale" class="form-control" rows="2" placeholder="Mengapa pertanyaan ini penting?">${existing ? escHtml(existing.rationale || '') : ''}</textarea>
        </div>`;
    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" id="btnSaveRQ">Simpan</button>`;

    window.showModal(title, body, footer);

    document.getElementById('btnSaveRQ').addEventListener('click', () => {
        const question = document.getElementById('rqQuestion').value.trim();
        if (!question) { alert('Pertanyaan tidak boleh kosong.'); return; }
        const rationale = document.getElementById('rqRationale').value.trim();
        if (existing) store.updateQuestion(existing.id, { question, rationale });
        else store.addQuestion({ question, rationale });
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast(existing ? 'RQ diperbarui!' : 'RQ ditambahkan!', 'success');
    });
}

/* ---- PICO ---- */
function renderPICO(s) {
    const p = s.pico;
    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
                </div>
                Framework PICO
            </div>
            <button class="btn btn-primary btn-sm" id="btnSavePICO">Simpan PICO</button>
        </div>
        <p class="text-muted mb-md">PICO membantu mendefinisikan komponen utama dari pertanyaan penelitian Anda.</p>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">P — Population / Problem</label>
                <textarea id="picoP" class="form-control" rows="3" placeholder="Populasi atau kelompok yang diteliti...">${escHtml(p.population)}</textarea>
                <span class="form-hint">Siapa yang menjadi subjek penelitian?</span>
            </div>
            <div class="form-group">
                <label class="form-label">I — Intervention</label>
                <textarea id="picoI" class="form-control" rows="3" placeholder="Intervensi, eksposur, atau fenomena...">${escHtml(p.intervention)}</textarea>
                <span class="form-hint">Apa yang sedang diuji atau diamati?</span>
            </div>
            <div class="form-group">
                <label class="form-label">C — Comparison</label>
                <textarea id="picoC" class="form-control" rows="3" placeholder="Perbandingan atau kontrol...">${escHtml(p.comparison)}</textarea>
                <span class="form-hint">Apa yang dibandingkan?</span>
            </div>
            <div class="form-group">
                <label class="form-label">O — Outcome</label>
                <textarea id="picoO" class="form-control" rows="3" placeholder="Hasil yang diukur...">${escHtml(p.outcome)}</textarea>
                <span class="form-hint">Apa hasil yang diharapkan?</span>
            </div>
        </div>
    </div>`;
}

function initPICO(container, store) {
    container.querySelector('#btnSavePICO')?.addEventListener('click', () => {
        store.setPICO({
            population: document.getElementById('picoP').value,
            intervention: document.getElementById('picoI').value,
            comparison: document.getElementById('picoC').value,
            outcome: document.getElementById('picoO').value,
        });
        window.showToast('PICO tersimpan!', 'success');
    });
}

/* ---- Criteria ---- */
function renderCriteria(s) {
    const renderList = (type, list, color) => {
        const items = list.map(c => `
            <div class="item-row" style="border-left: 3px solid var(${color})">
                <div class="item-content">
                    <div class="item-title">${escHtml(c.text)}</div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-ghost btn-icon btn-del-criteria" data-id="${c.id}" data-type="${type}" style="color:var(--c-danger)" title="Hapus">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
        return items || `<p class="text-muted text-sm">Belum ada kriteria.</p>`;
    };

    return `
    <div class="two-col">
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title" style="color:var(--c-success)">✓ Kriteria Inklusi</div>
                <button class="btn btn-sm" style="background:#ECFDF5;color:var(--c-success);border-color:#A7F3D0" id="btnAddInc">+ Tambah</button>
            </div>
            <div class="item-list" id="listInc">${renderList('inclusion', s.criteria.inclusion, '--c-success')}</div>
        </div>
        <div class="section-card">
            <div class="section-card-header">
                <div class="section-card-title" style="color:var(--c-danger)">✗ Kriteria Eksklusi</div>
                <button class="btn btn-sm" style="background:#FEF2F2;color:var(--c-danger);border-color:#FECACA" id="btnAddExc">+ Tambah</button>
            </div>
            <div class="item-list" id="listExc">${renderList('exclusion', s.criteria.exclusion, '--c-danger')}</div>
        </div>
    </div>`;
}

function initCriteria(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddInc')) openCriteriaModal(store, 'inclusion');
        if (e.target.closest('#btnAddExc')) openCriteriaModal(store, 'exclusion');
        const del = e.target.closest('.btn-del-criteria');
        if (del) {
            store.deleteCriteria(del.dataset.type, del.dataset.id);
            window.reloadCurrentPage();
        }
    });
}

function openCriteriaModal(store, type) {
    const label = type === 'inclusion' ? 'Inklusi' : 'Eksklusi';
    window.showModal(
        `Tambah Kriteria ${label}`,
        `<div class="form-group">
            <label class="form-label">Teks Kriteria<span>*</span></label>
            <textarea id="criteriaText" class="form-control" rows="3" placeholder="Contoh: Studi yang diterbitkan antara 2019-2024..."></textarea>
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
         <button class="btn btn-primary" id="btnSaveCriteria">Simpan</button>`
    );
    document.getElementById('btnSaveCriteria').addEventListener('click', () => {
        const text = document.getElementById('criteriaText').value.trim();
        if (!text) return;
        store.addCriteria(type, text);
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast('Kriteria ditambahkan!', 'success');
    });
}

/* ---- Keywords ---- */
function renderKeywords(s) {
    const groups = s.keywords.map(g => `
        <div class="keyword-group" data-id="${g.id}">
            <div class="keyword-group-header">
                <span class="keyword-group-label">${escHtml(g.group || 'Grup Kata Kunci')} <span class="badge badge-primary">${g.operator || 'OR'}</span></span>
                <div class="flex gap-sm">
                    <button class="btn btn-ghost btn-icon btn-del-kwg" data-id="${g.id}" style="color:var(--c-danger)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
            <div class="tag-list">
                ${(g.terms || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
            </div>
        </div>
    `).join('');

    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                Kata Kunci Pencarian
            </div>
            <button class="btn btn-primary btn-sm" id="btnAddKWG">+ Grup Kata Kunci</button>
        </div>
        ${s.keywords.length === 0
            ? emptyState('Belum ada kata kunci', 'Tambahkan grup kata kunci untuk digunakan dalam pencarian.')
            : groups}
    </div>`;
}

function initKeywords(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddKWG')) openKeywordModal(store);
        const del = e.target.closest('.btn-del-kwg');
        if (del) {
            store.deleteKeywordGroup(del.dataset.id);
            window.reloadCurrentPage();
        }
    });
}

function openKeywordModal(store) {
    window.showModal(
        'Tambah Grup Kata Kunci',
        `<div class="form-group">
            <label class="form-label">Nama Grup</label>
            <input type="text" id="kwGroupName" class="form-control" placeholder="Contoh: Algoritma, Metode, Aplikasi...">
        </div>
        <div class="form-group">
            <label class="form-label">Operator</label>
            <select id="kwOperator" class="form-control form-select">
                <option value="OR">OR (salah satu)</option>
                <option value="AND">AND (semua)</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Kata Kunci <span class="form-hint">(pisahkan dengan koma)</span></label>
            <textarea id="kwTerms" class="form-control" rows="3" placeholder="machine learning, deep learning, neural network"></textarea>
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
         <button class="btn btn-primary" id="btnSaveKW">Simpan</button>`
    );
    document.getElementById('btnSaveKW').addEventListener('click', () => {
        const group = document.getElementById('kwGroupName').value.trim() || 'Grup Kata Kunci';
        const operator = document.getElementById('kwOperator').value;
        const termsRaw = document.getElementById('kwTerms').value;
        const terms = termsRaw.split(',').map(t => t.trim()).filter(Boolean);
        if (terms.length === 0) { alert('Masukkan minimal satu kata kunci.'); return; }
        store.addKeywordGroup({ group, operator, terms });
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast('Kata kunci ditambahkan!', 'success');
    });
}

/* ---- Sources ---- */
const DEFAULT_SOURCES = [
    { name: 'Scopus', url: 'https://www.scopus.com', abbr: 'SC' },
    { name: 'IEEE Xplore', url: 'https://ieeexplore.ieee.org', abbr: 'IE' },
    { name: 'ACM Digital Library', url: 'https://dl.acm.org', abbr: 'AC' },
    { name: 'Web of Science', url: 'https://www.webofscience.com', abbr: 'WS' },
    { name: 'Google Scholar', url: 'https://scholar.google.com', abbr: 'GS' },
    { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', abbr: 'PM' },
    { name: 'SpringerLink', url: 'https://link.springer.com', abbr: 'SL' },
    { name: 'ScienceDirect', url: 'https://www.sciencedirect.com', abbr: 'SD' },
];

function renderSources(s) {
    const items = s.sources.map(src => `
        <div class="source-item" data-id="${src.id}">
            <div class="source-icon">${escHtml(src.abbr || src.name.slice(0, 2).toUpperCase())}</div>
            <div class="source-info">
                <div class="source-name">${escHtml(src.name)}</div>
                <div class="source-url">${escHtml(src.url || '-')}</div>
            </div>
            <button class="btn btn-ghost btn-icon btn-del-src" data-id="${src.id}" style="color:var(--c-danger)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `).join('');

    const quickBtns = DEFAULT_SOURCES.map(ds => `
        <button class="btn btn-secondary btn-sm btn-quick-src" data-name="${ds.name}" data-url="${ds.url}" data-abbr="${ds.abbr}"
            ${s.sources.some(x => x.name === ds.name) ? 'disabled style="opacity:.5"' : ''}>
            ${ds.name}
        </button>
    `).join('');

    return `
    <div class="section-card">
        <div class="section-card-header">
            <div class="section-card-title">
                <div class="section-card-title-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                </div>
                Sumber Pencarian
            </div>
            <button class="btn btn-primary btn-sm" id="btnAddSrc">+ Sumber Kustom</button>
        </div>
        <div class="mb-md">
            <p class="text-muted text-sm mb-md">Tambah cepat database populer:</p>
            <div class="flex gap-sm" style="flex-wrap:wrap">${quickBtns}</div>
        </div>
        ${s.sources.length > 0 ? `<hr class="divider"><div>${items}</div>` : '<p class="text-muted text-sm">Belum ada sumber dipilih.</p>'}
    </div>`;
}

function initSources(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddSrc')) openSourceModal(store);
        const quick = e.target.closest('.btn-quick-src');
        if (quick && !quick.disabled) {
            store.addSource({ name: quick.dataset.name, url: quick.dataset.url, abbr: quick.dataset.abbr });
            window.reloadCurrentPage();
            window.showToast(`${quick.dataset.name} ditambahkan!`, 'success');
        }
        const del = e.target.closest('.btn-del-src');
        if (del) {
            store.deleteSource(del.dataset.id);
            window.reloadCurrentPage();
        }
    });
}

function openSourceModal(store) {
    window.showModal('Tambah Sumber Kustom',
        `<div class="form-group">
            <label class="form-label">Nama Sumber<span>*</span></label>
            <input type="text" id="srcName" class="form-control" placeholder="ResearchGate, DOAJ, ...">
        </div>
        <div class="form-group">
            <label class="form-label">URL</label>
            <input type="url" id="srcUrl" class="form-control" placeholder="https://...">
        </div>
        <div class="form-group">
            <label class="form-label">Singkatan (maks 3 karakter)</label>
            <input type="text" id="srcAbbr" class="form-control" maxlength="3" placeholder="RG">
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
         <button class="btn btn-primary" id="btnSaveSrc">Simpan</button>`
    );
    document.getElementById('btnSaveSrc').addEventListener('click', () => {
        const name = document.getElementById('srcName').value.trim();
        if (!name) { alert('Nama sumber diperlukan.'); return; }
        store.addSource({ name, url: document.getElementById('srcUrl').value.trim(), abbr: document.getElementById('srcAbbr').value.trim().toUpperCase() || name.slice(0, 2).toUpperCase() });
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast('Sumber ditambahkan!', 'success');
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

/* ---- Helpers ---- */
function emptyState(title, desc) {
    return `<div class="empty-state">
        <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/></svg>
        </div>
        <h3>${title}</h3>
        <p>${desc}</p>
    </div>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
