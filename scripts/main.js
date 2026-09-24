// ========== ОБЩИЕ ПЕРЕМЕННЫЕ ==========
const sheetID = "1hLOQ29hMWMxau9uh6xiSyDicRXnzYjWyeIwzpXcGMcU";
const sheetName = "ВУ";
const url = `https://opensheet.elk.sh/${sheetID}/${encodeURIComponent(sheetName)}`;

let vuDatabase = [];
let currentPhotoList = [];
let currentPhotoIndex = 0;

const backgroundCache = {};

// ========== ВКЛАДКИ ==========
function switchTab(tabName) {
    window.location.hash = tabName;

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'create') {
        setTimeout(generateVU, 100);
    }
    if (tabName === 'exam') {
        setTimeout(generateExam, 100);
    }
    if (tabName === 'tech') {
        setTimeout(generateTech, 100);
    }
    if (tabName === 'protocol') {
        setTimeout(generateProtocol, 100);
    }
}

function handleHash() {
    const hash = window.location.hash.substring(1);
    if (hash === 'create') {
        switchTab('create');
    } else if (hash === 'exam') {
        switchTab('exam');
    } else if (hash === 'tech') {
        switchTab('tech');
    } else if (hash === 'protocol') {
        switchTab('protocol');
    } else {
        switchTab('database');
    }
}

// ========== РАБОТА С ДАТАМИ ==========
function parseDate(dateStr) {
    if (!dateStr) return null;

    const str = String(dateStr).trim();
    if (!str) return null;

    const dotParts = str.split('.');
    if (dotParts.length === 3) {
        const day = parseInt(dotParts[0]);
        const month = parseInt(dotParts[1]);
        const year = parseInt(dotParts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const fullYear = year < 100 ? 2000 + year : year;
            return new Date(fullYear, month - 1, day);
        }
    }

    const isoParts = str.split('-');
    if (isoParts.length === 3) {
        const year = parseInt(isoParts[0]);
        const month = parseInt(isoParts[1]);
        const day = parseInt(isoParts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }

    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
}

function formatDate(dateString) {
    const date = parseDate(dateString);
    if (!date) return dateString || 'Н/Д';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const date = parseDate(dateString);
    if (!date) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function calculateExpiry(issueDate) {
    const date = parseDate(issueDate);
    if (!date) return '';

    const expiryDate = new Date(date);
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const day = String(expiryDate.getDate()).padStart(2, '0');
    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const year = expiryDate.getFullYear();

    return `${day}.${month}.${year}`;
}

function splitUrls(urlString) {
    if (!urlString) return [];

    return String(urlString)
        .split(';')
        .map(url => url.trim())
        .filter(url => url.length > 0);
}

// ========== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ==========
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (backgroundCache[src]) {
            resolve(backgroundCache[src]);
            return;
        }

        const img = new Image();
        img.onload = () => {
            backgroundCache[src] = img;
            resolve(img);
        };
        img.onerror = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1654;
            canvas.height = 2339;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ФОН НЕ НАЙДЕН', canvas.width / 2, canvas.height / 2);
            const fallbackImg = new Image();
            fallbackImg.src = canvas.toDataURL();
            backgroundCache[src] = fallbackImg;
            resolve(fallbackImg);
        };
        img.src = src + '?nocache=' + Date.now();
    });
}

// ========== МОДАЛЬНОЕ ОКНО ==========
function openPhotoGallery(photoList, startIndex) {
    currentPhotoList = photoList;
    currentPhotoIndex = startIndex;
    updateModalImage();
    document.getElementById('photoModal').style.display = 'block';
}

function updateModalImage() {
    if (currentPhotoList.length === 0) return;

    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');

    modalImage.src = currentPhotoList[currentPhotoIndex];
    modalCounter.textContent = `${currentPhotoIndex + 1} / ${currentPhotoList.length}`;

    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');

    if (currentPhotoList.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
    }
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updateModalImage();
    }
}

function nextPhoto() {
    if (currentPhotoIndex < currentPhotoList.length - 1) {
        currentPhotoIndex++;
        updateModalImage();
    }
}

function closeModal() {
    document.getElementById('photoModal').style.display = 'none';
}

// ========== СТАТУС ВУ ==========
function getVUStatus(expiryDate, state) {
    if (state === 'Архив') {
        return { status: 'archived', text: 'АРХИВ', class: 'status-archived' };
    }

    if (!expiryDate) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'status-expired' };
    }

    const date = parseDate(expiryDate);
    if (!date) {
        return { status: 'expired', text: 'НЕТ ДАННЫХ', class: 'status-expired' };
    }

    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'expired', text: 'ПРОСРОЧЕНО', class: 'status-expired' };
    } else if (diffDays <= 7) {
        return { status: 'expiring', text: 'ИСТЕКАЕТ', class: 'status-expiring' };
    } else {
        return { status: 'valid', text: 'ДЕЙСТВИТЕЛЬНО', class: 'status-valid' };
    }
}

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ТЕКСТА ==========
function fitText(ctx, text, x, y, maxWidth, initialSize, fontFamily, fontWeight, color, align = 'left', fontStyle = 'normal') {
    if (!text || text.trim() === '') return;

    let fontSize = initialSize;
    ctx.textAlign = align;
    ctx.textBaseline = 'bottom';

    do {
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
        const metrics = ctx.measureText(text);
        if (metrics.width <= maxWidth) {
            break;
        }
        fontSize -= 1;
    } while (fontSize > 8);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function () {
    handleHash();

    if (typeof loadFromGoogleSheets === 'function') {
        loadFromGoogleSheets();
    }

    if (typeof generateVU === 'function') {
        generateVU();
    }

    if (typeof generateExam === 'function') {
        generateExam();
    }

    if (typeof generateTech === 'function') {
        generateTech();
    }

    if (typeof generateProtocol === 'function') {
        generateProtocol();
    }

    window.addEventListener('hashchange', handleHash);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
        if (e.key === 'ArrowLeft') {
            prevPhoto();
        }
        if (e.key === 'ArrowRight') {
            nextPhoto();
        }
    });

    document.getElementById('photoModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    if (typeof loadFromGoogleSheets === 'function') {
        setInterval(loadFromGoogleSheets, 300000);
    }
});

// Экспортируем функции для использования в других файлах
window.parseDate = parseDate;
window.formatDate = formatDate;
window.formatDateForDisplay = formatDateForDisplay;
window.calculateExpiry = calculateExpiry;
window.splitUrls = splitUrls;
window.loadImage = loadImage;
window.getVUStatus = getVUStatus;
window.fitText = fitText;
window.openPhotoGallery = openPhotoGallery;
window.closeModal = closeModal;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;
window.switchTab = switchTab;
window.handleHash = handleHash;