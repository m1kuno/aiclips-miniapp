        // ===== SYNC WITH SERVER =====
        async function syncWithServer() {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            if (!initData) return; // не в Telegram — просто не синкаем

            // 1) stats
            const statsResp = await fetch(`${API_URL}/webapp/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init_data: initData })
            });
            const stats = await statsResp.json().catch(() => ({}));
            if (!statsResp.ok) throw new Error(stats.detail || `stats HTTP ${statsResp.status}`);

            STORAGE.set('stats', {
            clipsRemaining: stats.clips_remaining ?? 0,
            videosProcessed: stats.videos_processed ?? 0,
            totalViews: 0,
            daysRemaining: 0
            });

            // 2) subscription
            const subResp = await fetch(`${API_URL}/webapp/subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init_data: initData })
            });
            const subData = await subResp.json().catch(() => ({}));
            if (!subResp.ok) throw new Error(subData.detail || `sub HTTP ${subResp.status}`);

            if (subData.subscription) STORAGE.set('subscription', subData.subscription);

        } catch (error) {
            console.error('Sync error:', error);
        }
        }


        // ===== INIT =====
        document.addEventListener('DOMContentLoaded', function() {
            console.log('=== DOMContentLoaded event fired ===');
            
            // Инициализация WebApp
            const initialized = initWebApp();
            if (!initialized) {
                console.error('Не удалось инициализировать WebApp');
                return;
            }
            
            // Проверка регистрации
            const isRegistered = STORAGE.get('registered');
            console.log('User registered:', isRegistered);
            
            if (!isRegistered) {
                startOnboarding();
            } else {
                document.getElementById('bottom-nav').style.display = 'flex';
                goToPage('home');
            }
            
            // Синхронизация с сервером
            if (user?.id) {
                userData = {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    language_code: user.language_code
                };
                syncWithServer();
                setInterval(syncWithServer, 60000);
            }
            
            console.log('=== WebApp Initialization Complete ===');
        });

    
        // Экспорт функций в глобальную область
        window.goToPage = goToPage;
        window.completeRegistration = completeRegistration;
        window.addChannel = addChannel;
        window.removeChannel = removeChannel;
        window.submitVideo = submitVideo;
        window.refreshHistory = refreshHistory;
        window.selectPlan = selectPlan;
        window.payWithTelegram = payWithTelegram;