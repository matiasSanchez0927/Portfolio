document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sectionId = btn.getAttribute('data-section');
        document.querySelectorAll('.main-content section').forEach(sec => {
            sec.style.display = sec.id === sectionId ? 'block' : 'none';
        });
        // Optional: Hide <hr> if not "about"
        document.querySelector('hr').style.display = sectionId === 'about' ? 'block' : 'none';
    });
});

// Show all sections on page load
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.main-content section').forEach(sec => {
        sec.style.display = 'block';
    });
    document.querySelector('hr').style.display = 'block';
});