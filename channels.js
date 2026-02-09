        // ===== CHANNELS =====
        function loadChannels() {
            channels = STORAGE.get('channels') || [];
            renderChannels();
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
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="removeChannel(${i})">Удалить</button>
                </div>
            `).join('');
        }
    
        function addChannel() {
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
    
            const newChannel = {
                url: url,
                handle: '@' + handle,
                name: 'YouTube Channel',
                status: 'pending',
                addedAt: new Date().toISOString()
            };
    
            channels.push(newChannel);
            STORAGE.set('channels', channels);
    
            tg.sendData(JSON.stringify({
                action: 'add_channel',
                user_id: user?.id,
                channel_url: url,
                channel_handle: '@' + handle
            }));
    
            document.getElementById('channel-url').value = '';
            renderChannels();
    
            tg.showPopup({
                title: '✅ Канал добавлен!',
                message: 'Теперь выберите тариф для начала работы',
                buttons: [{type: 'ok'}]
            }, () => {
                goToPage('pricing');
            });
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
    