        // ===== CHANNELS =====
        function loadChannels() {
            channels = STORAGE.get('channels') || [];
            renderChannels();
            refreshChannelsFromServer();
        }

        async function refreshChannelsFromServer() {
            try {
                const initData = window.Telegram?.WebApp?.initData || '';
                if (!initData) return;

                const resp = await fetch(`${API_URL}/webapp/channels/list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ init_data: initData })
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error(data.detail || `channels.list HTTP ${resp.status}`);

                channels = data.channels || [];
                STORAGE.set('channels', channels);
                renderChannels();
            } catch (error) {
                console.error('refreshChannelsFromServer error:', error);
            }
        }
    
        function renderChannels() {
            const list = document.getElementById('channels-list');
    
            if (channels.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📺</div>
                        <div class="empty-state-text">
                            У вас пока нет подключённых каналов
                        </div>
                    </div>
                `;
                return;
            }
    
            list.innerHTML = channels.map((ch, i) => `
                <div class="channel-card ${ch.status === 'connected' ? 'connected' : ''}">
                    <div class="channel-icon">▶️</div>
                    <div class="channel-info">
                        <div class="channel-name">${ch.name || 'YouTube Channel'}</div>
                        <div class="channel-handle">${ch.handle}</div>
                        <div class="channel-status">
                            <span class="status-badge ${ch.status}">${ch.status === 'connected' ? '✓ Подключён' : '⏳ Ожидание'}</span>
                        </div>
                        ${renderChannelLinks(ch)}
                    </div>
                    <div class="channel-actions">
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeChannel(${i})">Удалить</button>
                    </div>
                </div>
            `).join('');
        }

        function renderChannelLinks(channel) {
            const links = Array.isArray(channel.platformLinks)
                ? channel.platformLinks
                : buildPlatformLinks(channel);
            if (!links.length) return '';

            const items = links.map((link) => `
                <a
                    class="channel-link"
                    href="${link.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${link.icon ? `${link.icon} ` : ''}${link.label}
                </a>
            `).join('');

            return `<div class="channel-links">${items}</div>`;
        }

        function buildPlatformLinks(channel) {
            const handleFromUrl = (channel.url || '').match(/@([^/]+)/)?.[1] || '';
            const handleRaw = (channel.handle || '').replace(/^@/, '') || handleFromUrl || 'channel';
            const handle = handleRaw.replace(/[^a-zA-Z0-9._-]/g, '') || 'channel';
            const originalUrl = channel.url || `https://www.youtube.com/@${handle}`;

            return [
                {
                    label: 'YouTube Shorts',
                    url: `https://www.youtube.com/@${handle}/shorts`,
                    icon: '▶️'
                },
                {
                    label: 'Instagram Reels',
                    url: `https://www.instagram.com/${handle}/reels/`,
                    icon: '📸'
                },
                {
                    label: 'TikTok',
                    url: `https://www.tiktok.com/@${handle}`,
                    icon: '🎵'
                },
                {
                    label: 'Оригинальный канал',
                    url: originalUrl,
                    icon: '🔗'
                }
            ];
        }
    
        async function addChannel() {
            console.log('=== addChannel called ===');
            const url = document.getElementById('channel-url').value.trim();
            console.log('URL:', url);

            if (!url) {
                tg.showAlert('❌ Введите ссылку на канал');
                return;
            }
    
            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                tg.showAlert('❌ Введите корректную ссылку YouTube');
                return;
            }
    
            let handle = url.match(/@([^/]+)/)?.[1] || 'channel';
            handle = handle.replace(/[^a-zA-Z0-9._-]/g, '') || 'channel';
    
            try {
                const initData = window.Telegram?.WebApp?.initData || '';
                if (!initData) {
                    tg.showAlert('❌ Откройте Mini App внутри Telegram');
                    return;
                }

                const resp = await fetch(`${API_URL}/webapp/channels/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        init_data: initData,
                        channel_url: url,
                        channel_handle: '@' + handle
                    })
                });

                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error(data.detail || `channels.add HTTP ${resp.status}`);

                document.getElementById('channel-url').value = '';
                await refreshChannelsFromServer();

                tg.showPopup({
                    title: '✅ Канал добавлен!',
                    message: 'Теперь выберите тариф для начала работы',
                    buttons: [{type: 'ok'}]
                }, () => {
                    goToPage('pricing');
                });
            } catch (error) {
                console.error('addChannel error:', error);
                tg.showPopup({
                    title: 'Ошибка',
                    message: String(error.message || error),
                    buttons: [{ type: 'ok' }]
                });
            }
        }
    
        function removeChannel(index) {
            tg.showConfirm('Удалить этот канал?', (confirmed) => {
                if (confirmed) {
                    channels.splice(index, 1);
                    STORAGE.set('channels', channels);
                    renderChannels();
                }
            });
        }
    