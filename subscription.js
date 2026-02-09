        // ===== SUBSCRIPTION =====
        function loadSubscription() {
            const ADMIN_ID = 1158043717;
            const isAdmin = user?.id === ADMIN_ID;
            
            if (isAdmin) {
                document.getElementById('subscription-content').innerHTML = `
                    <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none;">
                        <div style="opacity: 0.9; font-size: 0.875rem; margin-bottom: 8px;">ADMIN ACCESS</div>
                        <h2 style="font-size: 1.5rem; margin-bottom: 8px;">∞ Безлимит</h2>
                        <div style="font-size: 2.5rem; font-weight: 800; margin: 16px 0;">∞</div>
                        <div style="opacity: 0.9; font-size: 0.875rem;">Осталось клипов</div>
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
                            <div>✅ Безлимитная обработка видео</div>
                            <div style="margin-top: 8px;">✅ Приоритетная поддержка</div>
                            <div style="margin-top: 8px;">✅ Доступ ко всем функциям</div>
                        </div>
                    </div>
                    <button class="btn btn-danger" style="margin-top: 12px;" onclick="resetAllData()">🗑️ Сбросить все данные</button>
                `;
                return;
            }

            const sub = STORAGE.get('subscription');
            
            if (!sub) {
                document.getElementById('subscription-content').innerHTML = `
                    <div class="alert alert-info">
                        <span style="font-size: 1.5rem;">ℹ️</span>
                        <div>У вас нет активной подписки. Активируйте FREE TRIAL или выберите тариф.</div>
                    </div>
                    <button class="btn btn-danger" style="margin-top: 12px;" onclick="resetAllData()">🗑️ Сбросить все данные</button>
                `;
                return;
            }

            const badge = sub.istrial ? '🎁 FREE TRIAL' : '💎 ПОДПИСКА';
            const remaining = sub.clipslimit - sub.clipsused;
            
            document.getElementById('subscription-content').innerHTML = `
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <div style="opacity: 0.9; font-size: 0.875rem; margin-bottom: 8px;">${badge}</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 8px;">${sub.plantitle}</h2>
                    <div style="font-size: 2.5rem; font-weight: 800; margin: 16px 0;">${remaining}</div>
                    <div style="opacity: 0.9; font-size: 0.875rem;">Осталось клипов</div>
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3);">
                        <div>📊 Использовано: ${sub.clipsused}/${sub.clipslimit}</div>
                        <div style="margin-top: 8px;">📅 Действует до: ${sub.expiresat ? new Date(sub.expiresat).toLocaleDateString('ru-RU') : '∞'}</div>
                    </div>
                </div>
                <button class="btn btn-danger" style="margin-top: 12px;" onclick="resetAllData()">🗑️ Сбросить все данные</button>
            `;
        }

        // Добавь эту функцию в конец <script> перед закрывающим тегом
        function resetAllData() {
            if (confirm('Удалить все локальные данные? Действие необратимо.')) {
                localStorage.clear();
                console.log('Данные удалены'); location.reload();
                location.reload();
            }
        }

        // Не забудь экспортировать в window
        window.resetAllData = resetAllData;
