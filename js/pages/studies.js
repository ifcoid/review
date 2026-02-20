/**
 * pages/studies.js — Study library
 * Full table with sorting, filtering, detail panel, QA, data extraction
 */

import { QA_QUESTIONS } from '../store.js';

export function renderStudies(container, store) {
    const studies = store.state.studies;

    container.innerHTML = `
    <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem">
            <div>
                <h1>Studi</h1>
                <p class="page-subtitle">Kelola semua studi yang telah diimpor, lengkapi metadata dan penilaian kualitas.</p>
            </div>
            <button class="btn btn-primary" id="btnAddStudy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah Studi
            </button>
        </div>
    </div>

    <div class="filter-bar">
        <div class="search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" class="form-control" id="studySearch" placeholder="Cari judul, penulis, DOI...">
        </div>
        <select class="form-control form-select" id="filterVerdict" style="max-width:160px">
            <option value="all">Semua Verdict</option>
            <option value="include">✓ Dimasukkan</option>
            <option value="maybe">? Mungkin</option>
            <option value="exclude">✗ Dikecualikan</option>
            <option value="pending">— Belum</option>
        </select>
        <select class="form-control form-select" id="filterYear" style="max-width:130px">
            <option value="all">Semua Tahun</option>
            ${getYears(studies).map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
    </div>

    ${studies.length === 0
            ? `<div class="section-card">${emptyState('Belum ada studi', 'Impor studi dari tab Conducting → Impor Studi.')}</div>`
            : `<div class="table-wrap">
            <table class="data-table">
                <thead><tr>
                    <th>Judul</th>
                    <th>Penulis</th>
                    <th>Tahun</th>
                    <th>Sumber</th>
                    <th>Verdict</th>
                    <th>QA</th>
                    <th>Aksi</th>
                </tr></thead>
                <tbody id="studiesBody">
                    ${studies.map(s => studyRow(s, store)).join('')}
                </tbody>
            </table>
        </div>`}
    `;

    initStudies(container, store);
}

function studyRow(s, store) {
    const qa = store.getQAScore(s);
    const qaClass = qa === null ? 'low' : qa >= 7 ? 'high' : qa >= 4 ? 'mid' : 'low';
    const verdictBadge = {
        include: '<span class="badge badge-success">✓ Include</span>',
        exclude: '<span class="badge badge-danger">✗ Exclude</span>',
        maybe: '<span class="badge badge-purple">? Maybe</span>',
        pending: '<span class="badge badge-gray">— Pending</span>',
    }[s.verdict] || '';

    const rowClass = s.verdict !== 'pending' ? `row-${s.verdict}` : '';

    return `
    <tr class="${rowClass}" data-id="${s.id}">
        <td class="td-title">
            ${escHtml(s.title)}
            ${s.doi ? `<small>DOI: ${escHtml(s.doi)}</small>` : ''}
        </td>
        <td class="td-truncate text-muted">${escHtml(s.authors || '-')}</td>
        <td>${escHtml(s.year || '-')}</td>
        <td><span class="badge badge-gray">${escHtml(s.source || '-')}</span></td>
        <td>${verdictBadge}</td>
        <td>
            <div class="score-ring ${qaClass}">${qa !== null ? qa : '-'}</div>
        </td>
        <td>
            <div class="flex gap-sm">
                <button class="btn btn-ghost btn-icon btn-view-study" data-id="${s.id}" title="Detail">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="btn btn-ghost btn-icon btn-del-study" data-id="${s.id}" title="Hapus" style="color:var(--c-danger)">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
            </div>
        </td>
    </tr>`;
}

function initStudies(container, store) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('#btnAddStudy')) openStudyDetailModal(null, store);

        const view = e.target.closest('.btn-view-study');
        if (view) {
            const s = store.state.studies.find(x => x.id === view.dataset.id);
            if (s) openStudyDetailModal(s, store);
        }
        const del = e.target.closest('.btn-del-study');
        if (del) {
            if (confirm('Hapus studi ini?')) {
                store.deleteStudy(del.dataset.id);
                window.reloadCurrentPage();
                window.showToast('Studi dihapus.', '');
            }
        }
    });

    // Search
    container.querySelector('#studySearch')?.addEventListener('input', applyFilters.bind(null, container, store));
    container.querySelector('#filterVerdict')?.addEventListener('change', applyFilters.bind(null, container, store));
    container.querySelector('#filterYear')?.addEventListener('change', applyFilters.bind(null, container, store));
}

function applyFilters(container, store) {
    const q = container.querySelector('#studySearch').value.toLowerCase();
    const verdict = container.querySelector('#filterVerdict').value;
    const year = container.querySelector('#filterYear').value;

    container.querySelectorAll('#studiesBody tr').forEach(row => {
        const id = row.dataset.id;
        const s = store.state.studies.find(x => x.id === id);
        if (!s) return;
        const text = `${s.title} ${s.authors} ${s.doi}`.toLowerCase();
        const show = text.includes(q)
            && (verdict === 'all' || s.verdict === verdict)
            && (year === 'all' || s.year === year);
        row.style.display = show ? '' : 'none';
    });
}

function openStudyDetailModal(study, store) {
    const isNew = !study;
    const s = study || {};

    const body = `
    <div class="tabs" style="margin-bottom:1rem">
        <button class="tab-btn active" data-tab="meta">Metadata</button>
        <button class="tab-btn" data-tab="abstract">Abstrak</button>
        <button class="tab-btn" data-tab="qa">QA</button>
        <button class="tab-btn" data-tab="extract">Ekstraksi</button>
    </div>

    <!-- Metadata -->
    <div class="tab-panel active" id="dtab-meta">
        <div class="form-group">
            <label class="form-label">Judul<span>*</span></label>
            <input type="text" id="detTitle" class="form-control" value="${escHtml(s.title || '')}" placeholder="Judul lengkap...">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Penulis</label>
                <input type="text" id="detAuthors" class="form-control" value="${escHtml(s.authors || '')}" placeholder="Smith, J. et al.">
            </div>
            <div class="form-group">
                <label class="form-label">Tahun</label>
                <input type="number" id="detYear" class="form-control" value="${escHtml(s.year || '')}" placeholder="2024">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Sumber / Jurnal</label>
                <input type="text" id="detSource" class="form-control" value="${escHtml(s.source || '')}" placeholder="IEEE Transactions...">
            </div>
            <div class="form-group">
                <label class="form-label">DOI</label>
                <input type="text" id="detDOI" class="form-control" value="${escHtml(s.doi || '')}" placeholder="10.1109/...">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Tags</label>
            <input type="text" id="detTags" class="form-control" value="${escHtml((s.tags || []).join(', '))}" placeholder="tag1, tag2, tag3 (pisahkan koma)">
        </div>
        <div class="form-group">
            <label class="form-label">Verdict</label>
            <select id="detVerdict" class="form-control form-select">
                <option value="pending" ${s.verdict === 'pending' ? 'selected' : ''}>— Pending</option>
                <option value="include" ${s.verdict === 'include' ? 'selected' : ''}>✓ Include</option>
                <option value="maybe"   ${s.verdict === 'maybe' ? 'selected' : ''}>? Maybe</option>
                <option value="exclude" ${s.verdict === 'exclude' ? 'selected' : ''}>✗ Exclude</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Catatan</label>
            <textarea id="detNotes" class="form-control" rows="2" placeholder="Catatan tambahan...">${escHtml(s.notes || '')}</textarea>
        </div>
    </div>

    <!-- Abstract -->
    <div class="tab-panel" id="dtab-abstract">
        <div class="form-group">
            <label class="form-label">Abstrak</label>
            <textarea id="detAbstract" class="form-control" rows="12" placeholder="Tempel abstrak di sini...">${escHtml(s.abstract || '')}</textarea>
        </div>
    </div>

    <!-- QA -->
    <div class="tab-panel" id="dtab-qa">
        <p class="text-muted text-sm mb-md">Penilaian kualitas berdasarkan 8 kriteria standar (skor maks 10).</p>
        <div class="qa-list">
            ${QA_QUESTIONS.map((q, i) => {
        const val = s.qaScores?.[`q${i}`] || null;
        return `
                <div class="qa-item">
                    <div class="item-content" style="flex:1">
                        <div style="font-size:.8125rem">${i + 1}. ${escHtml(q)}</div>
                    </div>
                    <div class="qa-radio-group">
                        <label class="qa-radio">
                            <input type="radio" name="qa${i}" value="yes" ${val === 'yes' ? 'checked' : ''} ${isNew ? 'disabled' : ''}>
                            Ya
                        </label>
                        <label class="qa-radio">
                            <input type="radio" name="qa${i}" value="partial" ${val === 'partial' ? 'checked' : ''} ${isNew ? 'disabled' : ''}>
                            Sebagian
                        </label>
                        <label class="qa-radio">
                            <input type="radio" name="qa${i}" value="no" ${val === 'no' ? 'checked' : ''} ${isNew ? 'disabled' : ''}>
                            Tidak
                        </label>
                    </div>
                </div>`;
    }).join('')}
        </div>
        ${isNew ? '<p class="text-muted text-sm mt-md">Simpan studi dulu untuk mengisi QA.</p>' : ''}
    </div>

    <!-- Data Extraction -->
    <div class="tab-panel" id="dtab-extract">
        <div class="form-group">
            <label class="form-label">Metodologi</label>
            <textarea id="detMethodology" class="form-control" rows="3" placeholder="Eksperimen, survei, studi kasus, dll...">${escHtml(s.extractedData?.methodology || '')}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Ukuran Sampel</label>
                <input type="text" id="detSampleSize" class="form-control" value="${escHtml(s.extractedData?.sampleSize || '')}" placeholder="n=120">
            </div>
            <div class="form-group">
                <label class="form-label">Metrik</label>
                <input type="text" id="detMetrics" class="form-control" value="${escHtml(s.extractedData?.metrics || '')}" placeholder="Akurasi, F1, RMSE...">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Temuan Utama</label>
            <textarea id="detFindings" class="form-control" rows="4" placeholder="Ringkasan temuan dan kontribusi...">${escHtml(s.extractedData?.findings || '')}</textarea>
        </div>
    </div>`;

    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" id="btnSaveStudy">${isNew ? 'Tambah Studi' : 'Simpan Perubahan'}</button>`;

    window.showModal(isNew ? 'Tambah Studi Baru' : 'Detail Studi', body, footer);

    // Init modal tabs
    const modal = document.getElementById('modal');
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            modal.querySelector(`#dtab-${btn.dataset.tab}`)?.classList.add('active');
        });
    });

    // QA score changes
    if (!isNew) {
        modal.querySelectorAll('.qa-radio-group input').forEach(input => {
            input.addEventListener('change', () => {
                const name = input.name;
                const idx = parseInt(name.replace('qa', ''));
                store.setQAScore(s.id, idx, input.value);
            });
        });
    }

    // Save
    document.getElementById('btnSaveStudy').addEventListener('click', () => {
        const title = document.getElementById('detTitle').value.trim();
        if (!title) { alert('Judul wajib diisi.'); return; }
        const data = {
            title,
            authors: document.getElementById('detAuthors').value.trim(),
            year: document.getElementById('detYear').value.trim(),
            source: document.getElementById('detSource').value.trim(),
            doi: document.getElementById('detDOI').value.trim(),
            abstract: document.getElementById('detAbstract')?.value.trim(),
            verdict: document.getElementById('detVerdict').value,
            tags: document.getElementById('detTags').value.split(',').map(t => t.trim()).filter(Boolean),
            notes: document.getElementById('detNotes').value.trim(),
            extractedData: {
                methodology: document.getElementById('detMethodology')?.value.trim(),
                sampleSize: document.getElementById('detSampleSize')?.value.trim(),
                metrics: document.getElementById('detMetrics')?.value.trim(),
                findings: document.getElementById('detFindings')?.value.trim(),
            }
        };
        if (isNew) store.addStudy(data);
        else store.updateStudy(s.id, data);
        window.closeModal();
        window.reloadCurrentPage();
        window.showToast(isNew ? 'Studi ditambahkan!' : 'Studi diperbarui!', 'success');
    });
}

function getYears(studies) {
    return [...new Set(studies.map(s => s.year).filter(Boolean))].sort((a, b) => b - a);
}

function emptyState(title, desc) {
    return `<div class="empty-state">
        <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        </div>
        <h3>${title}</h3><p>${desc}</p>
    </div>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
