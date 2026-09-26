// ================================================================
// АВТОПОДСТАНОВКА ШАПКИ, НАВИГАЦИИ И ПОДВАЛА — ЕИС ВАИ
// ================================================================

// Меняй при правках partials, чтобы сбросить кэш браузера
const LAYOUT_VERSION = '1';

// ----------------------------------------------------------------
// Загрузка одного partial
// ----------------------------------------------------------------
async function loadPartial(url) {
    const res = await fetch(`${url}?v=${LAYOUT_VERSION}`);
    if (!res.ok) throw new Error(`Не удалось загрузить ${url}`);

    // Читаем сырые байты и декодируем как UTF-8 принудительно
    const buffer = await res.arrayBuffer();
    return new TextDecoder('utf-8').decode(buffer);
}

// ----------------------------------------------------------------
// Подсветка активного пункта меню
// ----------------------------------------------------------------
function highlightActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#eisNavMenu .eis-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === current);
    });
}

// ----------------------------------------------------------------
// Вставка всех частей layout
// ----------------------------------------------------------------
async function injectLayout() {
    const headerMount = document.getElementById('site-header');
    const navMount = document.getElementById('site-nav');
    const footerMount = document.getElementById('site-footer');

    try {
        const [headerHtml, navHtml, footerHtml] = await Promise.all([
            headerMount ? loadPartial('partials/header.html') : Promise.resolve(''),
            navMount ? loadPartial('partials/nav.html') : Promise.resolve(''),
            footerMount ? loadPartial('partials/footer.html') : Promise.resolve('')
        ]);

        if (headerMount) headerMount.innerHTML = headerHtml;
        if (navMount) navMount.innerHTML = navHtml;
        if (footerMount) footerMount.innerHTML = footerHtml;

        highlightActiveNav();

        // Сигнал остальным скриптам: layout готов
        document.dispatchEvent(new Event('layout-ready'));
    } catch (err) {
        console.error('[layout] Ошибка загрузки partials:', err);
        document.dispatchEvent(new Event('layout-ready')); // чтобы guard не завис
    }
}

// Запускаем сразу, как только DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout);
} else {
    injectLayout();
}

// Экспорт
window.injectLayout = injectLayout;
window.highlightActiveNav = highlightActiveNav;