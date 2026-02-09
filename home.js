        function getInitData() {
            return window.Telegram?.WebApp?.initData || '';
        }
        
        // ===== HOME =====
        function loadHome() {
            const ADMIN_ID = 1158043717;
            const isAdmin = user?.id === ADMIN_ID;
            
            const stats = STORAGE.get('stats') || {
                clipsRemaining: 0,
                videosProcessed: 0,
                totalViews: 0,
                daysRemaining: 0
            };
            
            // Админ видит безлимитные клипы
            if (isAdmin) {
                stats.clipsRemaining = 100;
            }
    
            document.getElementById('clips-remaining').textContent = isAdmin ? '∞' : stats.clipsRemaining;
            document.getElementById('videos-processed').textContent = stats.videosProcessed;
            document.getElementById('total-views').textContent = stats.totalViews;
            document.getElementById('days-remaining').textContent = stats.daysRemaining;
    
            loadVideoHistory();
        }
    
        function loadVideoHistory() {
            videoHistory = STORAGE.get('video_history') || [];
            renderVideoHistory();
        }
    
        function renderVideoHistory() {
            const list = document.getElementById('videos-list');
    
            if (videoHistory.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🎥</div>
                        <div class="empty-state-text">
                            Здесь будет история ваших видео
                        </div>
                    </div>
                `;
                return;
            }
    
            list.innerHTML = videoHistory.map(video => `
                <div class="video-item">
                    <div class="video-thumbnail">🎥</div>
                    <div class="video-info">
                        <div class="video-title">${video.title || 'Видео обрабатывается...'}</div>
                        <div class="video-meta">
                            <span>📅 ${new Date(video.date).toLocaleDateString('ru-RU')}</span>
                            <span>👁 ${video.views || 0} просм.</span>
                        </div>
                        <div class="video-status">
                            <span class="status-badge ${video.status}">${getStatusText(video.status)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    
        function getStatusText(status) {
            const texts = {
                'processing': '⏳ Обработка',
                'completed': '✅ Готово',
                'posted': '✅ Опубликовано',
                'failed': '❌ Ошибка'
            };
            return texts[status] || status;
        }
    
        async function refreshHistory() {
        try {
            const initData = getInitData();
            const resp = await fetch(`${API_URL}/webapp/videos`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ init_data: initData, limit: 20 })
            });
            const data = await resp.json();

            if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);

            videoHistory = data.videos || [];
            STORAGE.set('video_history', videoHistory);
            renderVideoHistory();

            tg?.showAlert?.('🔄 История обновлена');
        } catch (e) {
            console.error('refreshHistory error:', e);
            tg?.showPopup?.({
            title: 'Ошибка',
            message: String(e.message || e),
            buttons: [{ type: 'ok' }]
            });
        }
        }

        async function submitVideo() {
        console.log('submitVideo called');
        const urlInput = document.getElementById('video-url');
        const url = urlInput?.value?.trim();

        if (!url) { console.warn('Введите URL!'); return; }
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            console.warn('Только YouTube!');
            return;
        }

        try {
            const initData = getInitData();
            if (!initData) {
            throw new Error('Откройте Mini App внутри Telegram (initData пустой).');
            }

            const resp = await fetch(`${API_URL}/webapp/enqueue`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                init_data: initData,
                video_url: url
            })
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);

            // Очисти поле
            urlInput.value = '';

            // Локально добавим запись в историю “processing”, чтобы UI сразу показал
            const local = STORAGE.get('video_history') || [];
            local.unshift({
            id: data.video_id,
            title: 'Видео обрабатывается...',
            status: 'processing',
            date: new Date().toISOString(),
            views: 0
            });
            STORAGE.set('video_history', local);

            // Обнови данные с сервера (stats/subscription)
            await syncWithServer();
            loadHome();

            tg?.showPopup?.({
            title: '✅ В очереди',
            message: `Видео добавлено в обработку.\nID: ${data.video_id}\nОсталось клипов: ${data.remaining_clips}`,
            buttons: [{ type: 'ok' }]
            });
        } catch (error) {
            console.error('submitVideo error:', error);
            tg?.showPopup?.({
            title: 'Ошибка',
            message: String(error.message || error),
            buttons: [{ type: 'ok' }]
            });
        }
        }

