const NAV_SELECTOR = '.nav-btn';
const MAIN_CONTENT_ID = 'main-content';
const PAGE_TITLE_ID = 'page-title';
const DEFAULT_PAGE = 'pages and info/about.html';

// durations must match CSS (.fade-enter: 260ms / .fade-exit: 220ms)
const ENTER_MS = 260;
const EXIT_MS = 220;

function setActiveButtonBtn(btn) {
    document.querySelectorAll(NAV_SELECTOR).forEach(b => b.classList.remove('active'));
    if (btn && btn.classList && btn.classList.contains('nav-btn')) btn.classList.add('active');
}

function setPageTitleFromButtonOrContent(btn, container) {
    const titleEl = document.getElementById(PAGE_TITLE_ID);
    if (!titleEl) return;
    if (btn && btn.dataset && btn.dataset.title) {
        titleEl.textContent = btn.dataset.title;
        return;
    }
    if (container) {
        const h1 = container.querySelector('h1, h2.page-title, .page-title');
        if (h1 && h1.textContent.trim()) { titleEl.textContent = h1.textContent.trim(); return; }
    }
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
        const current = target.querySelector('.page-content');
        if (current) await animateExit(current);

        target.innerHTML = '<div class="page-content"><p>Loading...</p></div>';

        const res = await fetch(encodeURI(path));
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const html = await res.text();

        target.innerHTML = `<div class="page-content">${html}</div>`;
        const newContent = target.querySelector('.page-content');

        setPageTitleFromButtonOrContent(clickedEl, newContent);

        if (clickedEl && clickedEl.classList && clickedEl.classList.contains('nav-btn')) {
            setActiveButtonBtn(clickedEl);
        } else if (clickedEl && clickedEl.dataset && clickedEl.dataset.section) {
            const navMatch = document.querySelector(`${NAV_SELECTOR}[data-page="${clickedEl.dataset.section}"]`);
            setActiveButtonBtn(navMatch);
        }

        await animateEnter(newContent);
        window.scrollTo(0, 0);
    } catch (err) {
        console.error('Error loading page:', err);
        target.innerHTML = `<div class="page-content"><p style="color:#900;">Failed to load content.</p></div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // wire nav buttons
    document.querySelectorAll(NAV_SELECTOR).forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = btn.getAttribute('data-page');
            if (!page) return;
            loadPage(page, btn);
        });
    });

    // delegate for any element with data-page (project cards, internal links)
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-page]');
        if (!el) return;
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