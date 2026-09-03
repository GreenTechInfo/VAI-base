// ========== КОНФИГУРАЦИЯ ВУ ==========
const VU_CONFIG = {
    canvasWidth: 1215,
    canvasHeight: 892,
    rankBackgrounds: {
        'гвардии рядовой': 'backgrounds/ryadovoy.png',
        'гвардии ефрейтор': 'backgrounds/efreytor.png',
        'гвардии мл. сержант': 'backgrounds/mladshiy_serzhant.png',
        'гвардии сержант': 'backgrounds/serzhant.png',
        'гвардии ст. сержант': 'backgrounds/starshiy_serzhant.png',
        'гвардии старшина': 'backgrounds/starshina.png',
        'гвардии прапорщик': 'backgrounds/praporshchik.png',
        'гвардии ст. прапорщик': 'backgrounds/starshiy_praporshchik.png',
        'гвардии лейтенант': 'backgrounds/leytenant.png',
        'гвардии ст. лейтенант': 'backgrounds/starshiy_leytenant.png',
        'гвардии капитан': 'backgrounds/kapitan.png',
        'гвардии майор': 'backgrounds/mayor.png'
    }
};

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

// ========== ГЕНЕРАЦИЯ ВУ ==========
async function generateVU() {
    const canvas = document.getElementById('vuCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const vuNumber = document.getElementById('createVUNumber').value.trim();
    const rank = document.getElementById('createRank').value;
    const lastName = document.getElementById('createLastName').value.trim();
    const firstName = document.getElementById('createFirstName').value.trim();
    const middleName = document.getElementById('createMiddleName').value.trim();
    const issueDate = document.getElementById('createIssueDate').value.trim();
    
    const expiryDate = calculateExpiry(issueDate);
    const expiryInput = document.getElementById('createExpiryDate');
    if (expiryInput) {
        expiryInput.value = expiryDate;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (rank && VU_CONFIG.rankBackgrounds[rank]) {
        try {
            const bgImage = await loadImage(VU_CONFIG.rankBackgrounds[rank]);
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } catch (error) {
            console.warn('Ошибка загрузки фона:', error);
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Ошибка загрузки фона', 607, 446);
        }
    } else {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Выберите звание', 607, 446);
    }
    
    if (rank) {
        const fontFamily = 'Segoe Script';
        const color = '#000f55';
        
        if (vuNumber) {
            fitText(ctx, vuNumber, 389, 106, 123, 25, fontFamily, 'normal', color, 'left', 'italic');
        }

        if (rank) {
            fitText(ctx, rank, 218, 149, 341, 30, fontFamily, 'normal', color, 'left', 'italic');
        }

        if (lastName) {
            fitText(ctx, lastName, 148, 191, 411, 30, fontFamily, 'normal', color, 'left', 'italic');
        }

        if (firstName) {
            fitText(ctx, firstName, 102, 233, 457, 30, fontFamily, 'normal', color, 'left', 'italic');
        }

        if (middleName) {
            fitText(ctx, middleName, 149, 275, 410, 30, fontFamily, 'normal', color, 'left', 'italic');
        }

        if (issueDate) {
            let dateStr = issueDate;
            if (!dateStr.includes('.') && dateStr.length === 8) {
                dateStr = dateStr.slice(0, 2) + '.' + dateStr.slice(2, 4) + '.' + dateStr.slice(4, 8);
            }
            
            const dateParts = dateStr.split('.');
            if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2) {
                fitText(ctx, dateParts[0], 320, 486, 49, 30, fontFamily, 'normal', color, 'left', 'italic');
                fitText(ctx, dateParts[1], 443, 486, 116, 30, fontFamily, 'normal', color, 'center', 'italic');
                const year = dateParts[2].slice(-2);
                fitText(ctx, year, 529, 483, 33, 23, fontFamily, 'normal', color, 'left', 'italic');
            } else {
                fitText(ctx, issueDate, 320, 486, 242, 30, fontFamily, 'normal', color, 'left', 'italic');
            }
        }

        if (expiryDate) {
            let dateStr = expiryDate;
            if (!dateStr.includes('.') && dateStr.length === 8) {
                dateStr = dateStr.slice(0, 2) + '.' + dateStr.slice(2, 4) + '.' + dateStr.slice(4, 8);
            }
            
            const dateParts = dateStr.split('.');
            if (dateParts.length === 3 && dateParts[0].length === 2 && dateParts[1].length === 2) {
                fitText(ctx, dateParts[0], 320, 594, 49, 30, fontFamily, 'normal', color, 'left', 'italic');
                fitText(ctx, dateParts[1], 443, 594, 116, 30, fontFamily, 'normal', color, 'center', 'italic');
                const year = dateParts[2].slice(-2);
                fitText(ctx, year, 529, 591, 33, 23, fontFamily, 'normal', color, 'left', 'italic');
            } else {
                fitText(ctx, expiryDate, 320, 486, 242, 30, fontFamily, 'normal', color, 'left', 'italic');
            }
        }
    }
}

// ========== СОХРАНЕНИЕ ВУ ==========
function saveVU() {
    const canvas = document.getElementById('vuCanvas');
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
        alert('Холст пуст');
        return;
    }
    
    const lastName = document.getElementById('createLastName').value.trim() || 'unknown';
    const fileName = `${lastName}_ВУ.png`;
    
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
}