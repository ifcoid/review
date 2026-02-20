/**
 * main.js — App entry point
 */

import { store } from './store.js';
import { initRouter, navigate, onNavigate, closeSidebar } from './router.js';
import { renderPlanning } from './pages/planning.js';
import { renderConducting } from './pages/conducting.js';
import { renderStudies } from './pages/studies.js';
import { renderAnalysis } from './pages/analysis.js';
import { renderReporting } from './pages/reporting.js';

const PAGE_RENDERERS = {
    planning: renderPlanning,
    conducting: renderConducting,
    studies: renderStudies,
    analysis: renderAnalysis,
    reporting: renderReporting,
};

function updateBadges() {
    const s = store.state;
    const stats = store.getStats();

    const b = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val > 0 ? val : '';
    };

    b('badge-planning', s.planning.questions.length);
    b('badge-conducting', s.conducting.searches.length);
    b('badge-studies', stats.total);
}

function updateProgress() {
    const pct = store.getProgress();
    const bar = document.getElementById('progressMiniBar');
    const label = document.getElementById('progressLabel');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
}

function loadPage(page) {
    const content = document.getElementById('pageContent');
    const loading = document.getElementById('loadingOverlay');

    if (loading) loading.classList.remove('hidden');

    // Small delay for smooth feel
    requestAnimationFrame(() => {
        const renderer = PAGE_RENDERERS[page];
        if (renderer) {
            content.innerHTML = '';
            renderer(content, store);
        }
        if (loading) loading.classList.add('hidden');
        updateBadges();
        updateProgress();
        location.hash = page;
    });
}

function initSidebar() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    hamburger?.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        overlay.classList.toggle('active', open);
    });

    overlay?.addEventListener('click', closeSidebar);
}

function initReviewTitle() {
    const input = document.getElementById('reviewTitle');
    if (!input) return;
    input.value = store.state.meta.title || '';
    input.addEventListener('input', () => store.setTitle(input.value));
}

function initImportExport() {
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        const json = store.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slr-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data berhasil diekspor!', 'success');
    });

    const fileInput = document.getElementById('importFileInput');
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                store.importJSON(ev.target.result);
                showToast('Data berhasil diimpor!', 'success');
                loadPage(getCurrentPageFromHash());
                updateBadges();
                updateProgress();
                // Refresh title
                const ti = document.getElementById('reviewTitle');
                if (ti) ti.value = store.state.meta.title || '';
            } catch {
                showToast('Gagal mengimpor: format tidak valid.', 'error');
            }
            fileInput.value = '';
        };
        reader.readAsText(file);
    });
}

function getCurrentPageFromHash() {
    const hash = location.hash.replace('#', '');
    return ['planning', 'conducting', 'studies', 'analysis', 'reporting'].includes(hash) ? hash : 'planning';
}

function initModal() {
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ---- Global helpers exposed on window for page modules ----
window.showModal = function (title, bodyHTML, footerHTML) {
    const backdrop = document.getElementById('modalBackdrop');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML || '';
    backdrop.classList.remove('hidden');
};

window.closeModal = function () {
    document.getElementById('modalBackdrop').classList.add('hidden');
};

window.showToast = function (msg, type = '') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
};

window.reloadCurrentPage = function () {
    loadPage(getCurrentPageFromHash());
    updateBadges();
    updateProgress();
};

// ---- Keyboard shortcut: Escape closes modal ----
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ---- Bootstrap ----
function init() {
    initSidebar();
    initReviewTitle();
    initImportExport();
    initModal();

    onNavigate(loadPage);
    initRouter();
}

init();
