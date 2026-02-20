/**
 * router.js — Tab/page router
 */

const PAGES = ['planning', 'conducting', 'studies', 'analysis', 'reporting'];

const PAGE_TITLES = {
    planning: 'Planning',
    conducting: 'Conducting',
    studies: 'Studi',
    analysis: 'Analisis',
    reporting: 'Pelaporan',
};

let _currentPage = null;
let _pageModules = {};
let _onNavigate = null;

export function registerPageModules(modules) {
    _pageModules = modules;
}

export function onNavigate(fn) {
    _onNavigate = fn;
}

export function getCurrentPage() {
    return _currentPage;
}

export function navigate(page) {
    if (!PAGES.includes(page)) page = 'planning';
    if (_currentPage === page) return;

    _currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });

    // Update breadcrumb
    const breadcrumb = document.getElementById('pageTitleBreadcrumb');
    if (breadcrumb) breadcrumb.textContent = PAGE_TITLES[page] || page;

    if (_onNavigate) _onNavigate(page);
}

export function initRouter() {
    // Bind nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.addEventListener('click', () => {
            navigate(el.dataset.page);
            // Close sidebar on mobile
            closeSidebar();
        });
    });

    // Read hash or default to planning
    const hash = location.hash.replace('#', '') || 'planning';
    navigate(hash);
}

export function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
}
