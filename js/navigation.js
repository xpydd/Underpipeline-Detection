/**
 * Navigation menu manager.
 * Handles active state, optional in-page section switching, and hash sync.
 */

const NavigationManager = {
    currentMenu: 'project',

    init() {
        this.bindEvents();
        this.currentMenu = this.getInitialMenu();
        this.updateActiveMenu();
        if (this.hasContentSections()) {
            this.loadContent(this.currentMenu);
        }
    },

    bindEvents() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (event) => {
                const menuId = event.currentTarget.getAttribute('data-menu');
                if (!menuId) return;

                if (this.isSamePageLink(event.currentTarget.getAttribute('href'))) {
                    event.preventDefault();
                    this.switchMenu(menuId);
                    this.syncHash(menuId);
                }
            });
        });
    },

    switchMenu(menuId) {
        this.currentMenu = menuId;
        this.updateActiveMenu();
        this.loadContent(menuId);
        this.addTransitionEffect();
    },

    updateActiveMenu() {
        document.querySelectorAll('.nav-link').forEach(link => {
            const menuId = link.getAttribute('data-menu');
            if (menuId === this.currentMenu) {
                link.classList.add('active', 'text-primary', 'bg-primary/10');
                link.classList.remove('text-slate-700', 'dark:text-slate-300');
            } else {
                link.classList.remove('active', 'text-primary', 'bg-primary/10');
                link.classList.add('text-slate-700', 'dark:text-slate-300');
            }
        });
    },

    loadContent(menuId) {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${menuId}-content`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    },

    hasContentSections() {
        return document.querySelectorAll('.content-section').length > 0;
    },

    getInitialMenu() {
        const bodyMenu = document.body.getAttribute('data-menu');
        if (bodyMenu) return bodyMenu;

        const hashMenu = this.getMenuFromHash(window.location.hash);
        if (hashMenu) return hashMenu;

        return this.getMenuFromPath(window.location.pathname);
    },

    getMenuFromHash(hash) {
        if (!hash) return '';
        const normalized = hash.replace('#', '').trim().toLowerCase();
        const known = ['project', 'owner', 'workbench', 'knowledge', 'system', 'tools'];
        return known.includes(normalized) ? normalized : '';
    },

    getMenuFromPath(pathname) {
        const normalized = (pathname || '').toLowerCase();
        if (normalized.endsWith('/')) {
            return 'project';
        }

        const page = normalized.split('/').pop() || '';
        if (page === '' || page === 'index.html') return 'project';

        const projectPages = new Set([
            'project-management.html',
            'project-detail.html',
            'project-data.html',
            'project-exploration.html',
            'project-model.html',
            'project-report.html'
        ]);
        if (projectPages.has(page)) return 'project';

        const ownerPages = new Set(['owner-management.html', 'owner-detail.html']);
        if (ownerPages.has(page)) return 'owner';

        if (page === 'dictionary-management.html') return 'system';

        if (page === 'knowledge-center.html') return 'knowledge';

        return 'project';
    },

    isSamePageLink(href) {
        if (!href || href === '#') return true;
        if (href.startsWith('#')) return true;

        const currentPage = this.normalizePath(window.location.pathname);
        const targetPage = this.normalizePath(href.split('#')[0]);

        return currentPage === targetPage;
    },

    normalizePath(path) {
        if (!path) return 'index.html';
        const trimmed = path.trim();
        if (trimmed === '' || trimmed === '/') return 'index.html';
        return trimmed.split('/').pop() || 'index.html';
    },

    syncHash(menuId) {
        const targetHash = `#${menuId}`;
        if (window.location.hash !== targetHash) {
            history.replaceState(null, '', targetHash);
        }
    },

    addTransitionEffect() {
        const contentArea = document.getElementById('main-content');
        if (contentArea) {
            contentArea.style.opacity = '0';
            setTimeout(() => {
                contentArea.style.opacity = '1';
            }, 50);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NavigationManager.init();
});
