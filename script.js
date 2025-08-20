const NAV_SELECTOR = '.nav-btn';
const MAIN_CONTENT_ID = 'main-content';
const PAGE_TITLE_ID = 'page-title';
const DEFAULT_PAGE = 'pages and info/about.html';
const DARK_TOGGLE_ID = 'dark-mode-toggle';

// durations must match CSS (.fade-enter: 260ms / .fade-exit: 220ms)
const ENTER_MS = 260;
const EXIT_MS = 220;

function setActiveButtonBtn(btn) {
    // only mark nav buttons; pass nav button or null
    document.querySelectorAll(NAV_SELECTOR).forEach(b => b.classList.remove('active'));
    if (btn && btn.classList && btn.classList.contains('nav-btn')) btn.classList.add('active');
}

function setPageTitleFromButtonOrContent(btn, container) {
    const titleEl = document.getElementById(PAGE_TITLE_ID);
    if (!titleEl) return;
    // prefer explicit data-title
    if (btn && btn.dataset && btn.dataset.title) {
        titleEl.textContent = btn.dataset.title;
        return;
    }
    // else try to read H1 from loaded content
    if (container) {
        const h1 = container.querySelector('h1, h2.page-title, .page-title');
        if (h1 && h1.textContent.trim()) { titleEl.textContent = h1.textContent.trim(); return; }
    }
    // fallback
    titleEl.textContent = '';
}

async function animateExit(currentEl) {
    if (!currentEl) return;
    currentEl.classList.add('fade-exit');
    requestAnimationFrame(() => currentEl.classList.add('fade-exit-active'));
    await new Promise(res => setTimeout(res, EXIT_MS));
}

async function animateEnter(newEl) {
    if (!newEl) return;
    newEl.classList.add('fade-enter');
    requestAnimationFrame(() => newEl.classList.add('fade-enter-active'));
    await new Promise(res => setTimeout(res, ENTER_MS));
}

async function loadPage(path, clickedEl) {
    const target = document.getElementById(MAIN_CONTENT_ID);
    if (!target) return;
    try {
        // exit animation for current page-content
        const current = target.querySelector('.page-content');
        if (current) await animateExit(current);

        // show loading placeholder
        target.innerHTML = '<div class="page-content"><p>Loading...</p></div>';

        const res = await fetch(encodeURI(path));
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const html = await res.text();

        // insert content wrapped with .page-content for transitions
        target.innerHTML = `<div class="page-content">${html}</div>`;
        const newContent = target.querySelector('.page-content');

        // set page title (either from clicked element or from loaded content)
        setPageTitleFromButtonOrContent(clickedEl, newContent);

        // mark nav active:
        // if clickedEl is a nav button -> activate it
        if (clickedEl && clickedEl.classList && clickedEl.classList.contains('nav-btn')) {
            setActiveButtonBtn(clickedEl);
        } else if (clickedEl && clickedEl.dataset && clickedEl.dataset.section) {
            // clicked element (ex: project card) can declare which nav section should be active
            const navMatch = document.querySelector(`${NAV_SELECTOR}[data-page="${clickedEl.dataset.section}"]`);
            setActiveButtonBtn(navMatch);
        }

        // run enter animation
        await animateEnter(newContent);

        // scroll top
        window.scrollTo(0, 0);
    } catch (err) {
        console.error('Error loading page:', err);
        target.innerHTML = `<div class="page-content"><p style="color:#900;">Failed to load content.</p></div>`;
    }
}

/* ---------- dark mode helpers ---------- */
function applyDarkMode(enabled) {
    const body = document.body;
    body.classList.toggle('dark', !!enabled);
    const toggle = document.getElementById(DARK_TOGGLE_ID);
    if (toggle) {
        toggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        const label = toggle.querySelector('.toggle-label');
        if (label) label.textContent = enabled ? 'Light mode' : 'Dark mode';
    }
    try { localStorage.setItem('darkMode', enabled ? '1' : '0'); } catch (e) { /* ignore */ }
}

function initDarkMode() {
    let stored = null;
    try { stored = localStorage.getItem('darkMode'); } catch (e) { /* ignore */ }
    if (stored === '1') { applyDarkMode(true); return; }
    if (stored === '0') { applyDarkMode(false); return; }
    // fallback to system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyDarkMode(prefersDark);
}

/* ---------- DOM wiring ---------- */
document.addEventListener('DOMContentLoaded', () => {
    // wire nav buttons
    document.querySelectorAll(NAV_SELECTOR).forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = btn.getAttribute('data-page');
            if (!page) return;
            loadPage(page, btn);
        });
    });

    // dark mode toggle
    const darkToggle = document.getElementById(DARK_TOGGLE_ID);
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            const active = darkToggle.getAttribute('aria-pressed') === 'true';
            applyDarkMode(!active);
        });
    }
    initDarkMode();

    // delegate for any element in the app that has a data-page attribute (project cards, internal links)
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-page]');
        if (!el) return;
        // ignore nav-btn here because those are already wired
        if (el.classList && el.classList.contains('nav-btn')) return;
        const page = el.getAttribute('data-page');
        if (!page) return;
        e.preventDefault();
        loadPage(page, el);
    });

    // load default page
    const foundDefaultBtn = document.querySelector(`${NAV_SELECTOR}[data-page="${DEFAULT_PAGE}"]`);
    if (foundDefaultBtn) {
        loadPage(DEFAULT_PAGE, foundDefaultBtn);
    } else {
        loadPage(DEFAULT_PAGE, null);
    }
});