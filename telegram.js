// ДИАГНОСТИКА УДАЛЕНА

        // Объявляем переменные глобально
        let tg = null;
        let user = null;
        let userData = null;
        let channels = [];
        let videoHistory = [];
        
        // API URL
        const API_URL = 'https://aiclips-api.onrender.com';

        
        // STORAGE
        const STORAGE = {
            get(key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch {
                    return null;
                }
            },
            set(key, value) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        };
        
        // THEME
        function applyTelegramTheme() {
            if (!tg) return;
            
            const theme = tg.themeParams;
            if (theme.bg_color) document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
            if (theme.text_color) document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
            if (theme.hint_color) document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color);
            if (theme.button_color) document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color);
            if (theme.button_text_color) document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
            if (theme.secondary_bg_color) document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
        }
        
        // Инициализация при загрузке страницы
        function initWebApp() {
            console.log('=== WebApp Initialization Started ===');
            
            // Проверка наличия Telegram WebApp SDK
            if (!window.Telegram || !window.Telegram.WebApp) {
                console.error('Telegram WebApp SDK не загружен!');
                // НЕ показывай alert в production
                return false;
            }
            
            // Инициализация Telegram WebApp
            tg = window.Telegram.WebApp;
            console.log('Telegram WebApp SDK загружен:', tg);
            
            // КРИТИЧНО: проверь что tg.sendData доступен
            if (typeof tg.sendData !== 'function') {
                console.error('tg.sendData недоступен!');
                return false;
            }
            
            // Настройка WebApp
            tg.ready();
            tg.expand();
            tg.enableClosingConfirmation();
            
            // Применение темы
            applyTelegramTheme();
            
            // Получение данных пользователя
            user = tg.initDataUnsafe?.user;
            console.log('User data:', user);
            
            if (!user) {
                console.warn('User data не получена! Используем fallback');
                // Fallback для тестирования
                user = { id: 0, first_name: 'Test' };
            }
            
            return true;
        }
