// ================================================================
// ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ — ЕИС ВАИ
// Замена браузерным alert() и confirm()
// ================================================================

// ----------------------------------------------------------------
// TOAST — всплывающие уведомления справа сверху
// ----------------------------------------------------------------
function showToast(message, type = 'info', duration = 3500) {
    // Контейнер создаём один раз
    let container = document.getElementById('eisToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'eisToastContainer';
        container.className = 'eis-toast-container';
        document.body.appendChild(container);
    }

    // Иконки по типам
    const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
    };

    // Заголовки по типам
    const titles = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Внимание',
        info: 'Информация'
    };

    // Создаём toast
    const toast = document.createElement('div');
    toast.className = `eis-toast eis-toast-${type}`;
    toast.innerHTML = `
        <div class="eis-toast-icon">${icons[type] || 'i'}</div>
        <div class="eis-toast-body">
            <div class="eis-toast-title">${titles[type] || 'Сообщение'}</div>
            <div class="eis-toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="eis-toast-close" type="button">×</button>
        <div class="eis-toast-progress"></div>
    `;

    // Закрытие по кнопке
    const closeBtn = toast.querySelector('.eis-toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Автоскрытие
    const progress = toast.querySelector('.eis-toast-progress');
    progress.style.animationDuration = duration + 'ms';

    setTimeout(() => removeToast(toast), duration);

    container.appendChild(toast);

    // Анимация появления
    requestAnimationFrame(() => toast.classList.add('eis-toast-show'));

    return toast;
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('eis-toast-hide');
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
}

// ----------------------------------------------------------------
// CONFIRM — красивое модальное окно подтверждения
// Возвращает Promise<boolean>
// ----------------------------------------------------------------
function showConfirm(options = {}) {
    const {
        title = 'Подтверждение',
        message = 'Вы уверены?',
        confirmText = 'Подтвердить',
        cancelText = 'Отмена',
        type = 'default'  // default | danger | warning
    } = options;

    return new Promise((resolve) => {
        // Создаём модалку
        const overlay = document.createElement('div');
        overlay.className = 'eis-confirm-overlay';
        overlay.innerHTML = `
            <div class="eis-confirm-modal eis-confirm-${type}">
                <div class="eis-confirm-header">
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <div class="eis-confirm-body">
                    ${escapeHtml(message)}
                </div>
                <div class="eis-confirm-footer">
                    <button type="button" class="eis-btn eis-btn-secondary" data-action="cancel">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button type="button" class="eis-btn eis-btn-${type === 'danger' ? 'danger' : 'primary'}" data-action="confirm">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('eis-confirm-show'));

        // Обработчики
        const close = (result) => {
            overlay.classList.remove('eis-confirm-show');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve(result);
            }, 200);
        };

        overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));

        // Клик по фону = отмена
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });

        // ESC = отмена, Enter = подтвердить
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', keyHandler);
                close(false);
            } else if (e.key === 'Enter') {
                document.removeEventListener('keydown', keyHandler);
                close(true);
            }
        };
        document.addEventListener('keydown', keyHandler);
    });
}

// ----------------------------------------------------------------
// ESCAPE HTML
// ----------------------------------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ----------------------------------------------------------------
// ЭКСПОРТ
// ----------------------------------------------------------------
window.showToast = showToast;
window.showConfirm = showConfirm;
window.removeToast = removeToast;