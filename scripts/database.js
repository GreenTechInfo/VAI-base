// ========== ЗАГРУЗКА ДАННЫХ ИЗ GOOGLE SHEETS ==========
async function loadFromGoogleSheets() {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div class="loading">ЗАГРУЗКА ДАННЫХ...</div>';
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format");
        }
        
        vuDatabase = data
            .filter(row => row && Object.values(row).some(value => value !== '' && value !== null && value !== undefined))
            .map((row, index) => {
                const fio = row['ФИО'] || row['fio'] || row['name'] || '';
                const vuNumber = row['Номер ВУ'] || row['vuNumber'] || row['номер'] || '';
                const issueDate = row['Дата выдачи (формат: ГГГГ-ММ-ДД)'] || row['Дата выдачи'] || row['issueDate'] || '';
                const issuedBy = row['Кем выдано'] || row['issuedBy'] || row['кем'] || '';
                const photoVU = row['Ссылка на фото ВУ'] || row['Фото ВУ'] || row['photoVU'] || '';
                const photoExam = row['Ссылка на фото бланков'] || row['Фото бланков'] || row['photoExam'] || '';
                const state = row['Состояние'] || row['состояние'] || row['state'] || '';
                
                return {
                    fio: fio || 'Н/Д',
                    vuNumber: vuNumber || 'Н/Д',
                    issueDate: issueDate,
                    expiryDate: calculateExpiry(issueDate),
                    issuedBy: issuedBy || 'Н/Д',
                    state: state.trim(),
                    photos: {
                        vu: splitUrls(photoVU),
                        exam: splitUrls(photoExam)
                    },
                    rowIndex: index
                };
            })
            .reverse();
        
        const activeRecords = vuDatabase.filter(vu => vu.state !== 'Архив');
        displayResults(activeRecords);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        resultsContainer.innerHTML = `
            <div class="no-results">
                ОШИБКА ЗАГРУЗКИ ДАННЫХ<br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// ========== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ==========
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsContainer) return;
    
    resultsCount.textContent = `ЗАПИСЕЙ: ${results.length}`;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">ЗАПИСИ НЕ НАЙДЕНЫ</div>';
        return;
    }
    
    let html = '';
    
    results.forEach(vu => {
        const status = getVUStatus(vu.expiryDate, vu.state);
        const isArchived = vu.state === 'Архив';
        
        html += `
            <div class="vu-record">
                <div class="vu-record-header">
                    <div class="vu-number">${vu.vuNumber}</div>
                    <div class="vu-status ${status.class}">${status.text}</div>
                </div>
                
                <div class="vu-data">
                    <div class="data-field">
                        <div class="data-label">ФИО</div>
                        <div class="data-value">${vu.fio}</div>
                    </div>
                    <div class="data-field">
                        <div class="data-label">Дата выдачи</div>
                        <div class="data-value">${formatDate(vu.issueDate)}</div>
                    </div>
                    <div class="data-field">
                        <div class="data-label">Действительно до</div>
                        <div class="data-value">${formatDate(vu.expiryDate)}</div>
                    </div>
                    <div class="data-field">
                        <div class="data-label">Кем выдано</div>
                        <div class="data-value">${vu.issuedBy}</div>
                    </div>
                    ${isArchived ? `
                    <div class="data-field">
                        <div class="data-label">Состояние</div>
                        <div class="data-value" style="color: #888;">АРХИВ</div>
                    </div>
                    ` : ''}
                </div>
                
                ${(vu.photos.vu.length > 0 || vu.photos.exam.length > 0) ? `
                <div class="documents-grid">
                    ${vu.photos.vu.length > 0 ? `
                    <div class="document-thumb" onclick="openPhotoGallery(${JSON.stringify(vu.photos.vu).replace(/"/g, '&quot;')}, 0)">
                        <img src="${vu.photos.vu[0]}" alt="ВУ" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23111%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%23444%22 font-family=%22monospace%22%3EНЕТ ФОТО%3C/text%3E%3C/svg%3E'">
                        <div class="document-label">ВУ</div>
                        ${vu.photos.vu.length > 1 ? `<div class="photo-counter">1/${vu.photos.vu.length}</div>` : ''}
                    </div>
                    ` : ''}
                    
                    ${vu.photos.exam.length > 0 ? `
                    <div class="document-thumb" onclick="openPhotoGallery(${JSON.stringify(vu.photos.exam).replace(/"/g, '&quot;')}, 0)">
                        <img src="${vu.photos.exam[0]}" alt="Бланки" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23111%22/%3E%3Ctext x=%22200%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%23444%22 font-family=%22monospace%22%3EНЕТ ФОТО%3C/text%3E%3C/svg%3E'">
                        <div class="document-label">БЛАНКИ</div>
                        ${vu.photos.exam.length > 1 ? `<div class="photo-counter">1/${vu.photos.exam.length}</div>` : ''}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// ========== ПОИСК ==========
function searchVU() {
    const searchFIO = document.getElementById('searchFIO').value.toLowerCase();
    const searchVU = document.getElementById('searchVU').value.toLowerCase();
    const searchIssued = document.getElementById('searchIssued').value.toLowerCase();
    const searchDateFrom = document.getElementById('searchDateFrom').value;
    const searchDateTo = document.getElementById('searchDateTo').value;
    const searchStatus = document.getElementById('searchStatus').value;
    
    let filteredResults = vuDatabase.filter(vu => {
        let match = true;
        
        if (searchStatus !== 'archived' && vu.state === 'Архив') {
            match = false;
        }
        
        if (searchFIO && !vu.fio.toLowerCase().includes(searchFIO)) {
            match = false;
        }
        
        if (searchVU && !vu.vuNumber.toLowerCase().includes(searchVU)) {
            match = false;
        }
        
        if (searchIssued && !vu.issuedBy.toLowerCase().includes(searchIssued)) {
            match = false;
        }
        
        if (searchDateFrom) {
            const fromDate = parseDate(searchDateFrom);
            const vuDate = parseDate(vu.issueDate);
            if (fromDate && vuDate && vuDate < fromDate) {
                match = false;
            }
        }
        
        if (searchDateTo) {
            const toDate = parseDate(searchDateTo);
            const vuDate = parseDate(vu.issueDate);
            if (toDate && vuDate && vuDate > toDate) {
                match = false;
            }
        }
        
        if (searchStatus) {
            const status = getVUStatus(vu.expiryDate, vu.state).status;
            if (status !== searchStatus) {
                match = false;
            }
        }
        
        return match;
    });
    
    displayResults(filteredResults);
}

function resetSearch() {
    document.getElementById('searchForm').reset();
    const activeRecords = vuDatabase.filter(vu => vu.state !== 'Архив');
    displayResults(activeRecords);
}

// ========== ПОДПИСКА НА СОБЫТИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', searchVU);
    });
});