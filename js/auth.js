// ================================================================
// АВТОРИЗАЦИЯ — ЕИС ВАИ
// ================================================================

// ================================================================
// ВХОД — по логину и паролю
// ================================================================
async function signIn(username, password) {
    if (!username || !password) {
        return { success: false, error: 'Введите логин и пароль' };
    }

    const email = usernameToEmail(username);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// Утилита: логин → email
function usernameToEmail(username) {
    const clean = String(username).trim().toLowerCase();
    return `${clean}@eis.local`;
}

// ========== ВЫХОД ==========
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Ошибка выхода:', error);
    window.location.href = 'login.html';
}

// ========== СМЕНА ПАРОЛЯ (для себя) ==========
async function changePassword(newPassword) {
    const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });
    return { success: !error, error: error?.message };
}

// ========== ЛОГ ДЕЙСТВИЙ ==========
async function logAction(action, entityType, entityId, details = {}) {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        await supabaseClient.from('audit_log').insert({
            user_id: user.id,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            details: details
        });
    } catch (e) {
        console.warn('Не удалось записать лог:', e);
    }
}

// ========== ПЕРЕВОД ОШИБОК ==========
function translateAuthError(msg) {
    const map = {
        'Invalid login credentials': 'Неверный логин или пароль',
        'Email not confirmed': 'Email не подтверждён',
        'Too many requests': 'Слишком много попыток. Подождите немного',
        'User already registered': 'Пользователь с таким логином уже существует',
        'Password should be at least 6 characters': 'Пароль должен быть не менее 6 символов'
    };
    return map[msg] || msg;
}

// ================================================================
// ЭКСПОРТ
// ================================================================

window.signIn = signIn;
window.usernameToEmail = usernameToEmail;
window.signOut = signOut;
window.changePassword = changePassword;
window.logAction = logAction;
window.translateAuthError = translateAuthError;