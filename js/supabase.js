// ================================================================
// КЛИЕНТ SUPABASE — ЕИС ВАИ
// Подключение к проекту Supabase
// ================================================================

const SUPABASE_URL = 'https://seutijfydfhclviahqbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldXRpamZ5ZGZoY2x2aWFocWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE1MzIsImV4cCI6MjEwNTkzNzUzMn0.IY4qELNCmsdUi-FxSF06wjNV-5UTISzdPsrsw9JGkTc';

// Глобальный клиент
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

// ================================================================
// ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ И ПРОФИЛЯ
// ================================================================

async function getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return user;
}

async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Ошибка загрузки профиля:', error);
        return null;
    }
    return data;
}

// ================================================================
// ЭКСПОРТ
// ================================================================

window.SUPABASE_URL = SUPABASE_URL;
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;