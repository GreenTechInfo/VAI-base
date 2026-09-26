// ================================================================
// ЗАЩИТА СТРАНИЦ — ЕИС ВАИ
// ================================================================

const PAGE_ACCESS = {
    'admin.html': ['chief_vai'],
    'create.html': ['inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'],
    'exam.html': ['inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'],
    'tech.html': ['inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai'],
    'protocol.html': ['inspector_odps', 'inspector_reo',
        'chief_odps', 'chief_reo', 'chief_cuipp', 'chief_vai']
};

const ROLE_LABELS = {
    'cadet': 'Курсант',
    'inspector_odps': 'Инспектор ОДПС',
    'inspector_reo': 'Инспектор РЭО',
    'chief_odps': 'Начальник ОДПС',
    'chief_reo': 'Начальник РЭО',
    'chief_cuipp': 'Начальник ЦУиПП',
    'chief_vai': 'Начальник ВАИ'
};

document.addEventListener('layout-ready', runGuard, { once: true });

async function runGuard() {
    if (typeof supabaseClient === 'undefined') {
        console.error('[guard] supabaseClient не загружен!');
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        sessionStorage.setItem('redirect_after_login', currentPath);
        window.location.href = 'login.html';
        return;
    }

    const profile = await getCurrentProfile();
    if (!profile) {
        console.error('[guard] Профиль не найден');
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const allowedRoles = PAGE_ACCESS[currentPage];

    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        sessionStorage.setItem('flash_message', 'Недостаточно прав для доступа к этой странице');
        sessionStorage.setItem('flash_message_type', 'warning');
        window.location.href = 'index.html';
        return;
    }

    window.currentUser = session.user;
    window.currentProfile = profile;

    updateHeader(profile);
    addAdminMenuItem(profile);

    document.documentElement.setAttribute('data-authenticated', 'true');
    document.dispatchEvent(new CustomEvent('user-ready', { detail: profile }));

    // Показать flash-сообщение (если было)
    const flash = sessionStorage.getItem('flash_message');
    if (flash) {
        const flashType = sessionStorage.getItem('flash_message_type') || 'info';
        sessionStorage.removeItem('flash_message');
        sessionStorage.removeItem('flash_message_type');
        setTimeout(() => showToast(flash, flashType), 400);
    }
}

function shortName(fullName) {
    if (!fullName) return '';

    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length === 0) return '';

    const lastName = parts[0];
    const initials = [];

    if (parts[1]) initials.push(parts[1][0].toUpperCase() + '.');
    if (parts[2]) initials.push(parts[2][0].toUpperCase() + '.');

    return initials.length > 0
        ? `${lastName} ${initials.join('')}`
        : lastName;
}

function updateHeader(profile) {
    const roleEl = document.querySelector('.eis-user-role');
    const nameEl = document.querySelector('.eis-user-name');

    if (roleEl) {
        roleEl.textContent = profile.position || ROLE_LABELS[profile.role] || profile.role;
    }
    if (nameEl) {
        nameEl.textContent = `${profile.rank} ${shortName(profile.full_name)}`;
    }

    const headerRight = document.querySelector('.eis-header-right');
    if (!headerRight) return;

    const logoutBtn = headerRight.querySelector('.eis-logout-btn');
    if (logoutBtn) logoutBtn.onclick = () => signOut();

    if (!document.getElementById('profileLink')) {
        const divider = headerRight.querySelector('.eis-header-divider');

        const profileLink = document.createElement('a');
        profileLink.id = 'profileLink';
        profileLink.href = 'profile.html';
        profileLink.title = 'Личный кабинет';
        profileLink.style.cssText = `
            display: flex; align-items: center; justify-content: center;
            width: 36px; height: 36px; border-radius: 4px;
            color: #ccc; text-decoration: none;
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.2s;
        `;
        profileLink.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        `;
        profileLink.onmouseenter = () => {
            profileLink.style.background = 'rgba(255,255,255,0.1)';
            profileLink.style.color = '#fff';
        };
        profileLink.onmouseleave = () => {
            profileLink.style.background = 'transparent';
            profileLink.style.color = '#ccc';
        };

        if (divider) headerRight.insertBefore(profileLink, divider);
        else headerRight.appendChild(profileLink);
    }
}

function addAdminMenuItem(profile) {
    if (profile.role !== 'chief_vai') return;

    const navMenu = document.querySelector('.eis-nav-menu');
    if (!navMenu) return;

    if (document.querySelector('a[href="admin.html"]')) return;

    const li = document.createElement('li');
    li.className = 'eis-nav-item';
    li.dataset.page = 'admin.html';

    if (window.location.pathname.endsWith('admin.html')) {
        li.classList.add('active');
    }

    li.innerHTML = `
        <a href="admin.html">
            <span>Админ-панель</span>
        </a>
    `;

    navMenu.appendChild(li);
}

window.ROLE_LABELS = ROLE_LABELS;
window.PAGE_ACCESS = PAGE_ACCESS;