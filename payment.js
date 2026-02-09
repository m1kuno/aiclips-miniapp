        // ===== PRICING & PAYMENT =====
        function checkTrialStatus() {
            const trialUsed = STORAGE.get('trial_used') || STORAGE.get('trialused');
            const trialCard = document.getElementById('trial-card');
            const trialBtn = document.getElementById('trial-btn');
    
            if (trialUsed) {
                trialCard.style.opacity = '0.5';
                trialBtn.disabled = true;
                trialBtn.textContent = '✓ Использован';
                trialBtn.classList.remove('btn-success');
                trialBtn.classList.add('btn-secondary');
            }
        }
    
        // ===== ТЕСТОВАЯ ОПЛАТА (НОВАЯ ФУНКЦИЯ) =====
        function safeSendData(payload) {
            if (!tg?.sendData) {
                console.error('Откройте приложение внутри Telegram.');
                return false;
            }
            tg.sendData(JSON.stringify(payload));
            return true;
        }

        function payWithTelegram(plan) {
            console.log('payWithTelegram called with plan:', plan);
    
            // Отправляем команду боту для создания инвойса
            safeSendData({
                action: 'request_payment',
                user_id: user?.id,
                plan: plan
            });
    
            tg.showPopup({
                title: '💳 Оплата',
                message: 'Инвойс будет отправлен в чат с ботом. Проверьте сообщения.',
                buttons: [{type: 'ok'}]
            });
        }
    
        // ===== ВЫБОР ПЛАНА =====
        async function selectPlan(plan) {
            console.log('=== selectPlan called ===');
            console.log('Plan:', plan);
            
            if (!tg || !user?.id) {
                console.error('Ошибка инициализации');
                return;
            }
            
            if (plan === 'free_trial') {
            const trialUsed = STORAGE.get('trial_used') || STORAGE.get('trialused');
            if (trialUsed) {
                tg.showAlert('FREE TRIAL уже использован');
                return;
            }

            try {
                const initData = window.Telegram?.WebApp?.initData || '';
                if (!initData) throw new Error('Откройте Mini App внутри Telegram (initData пустой).');

                const resp = await fetch(`${API_URL}/webapp/activate_trial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ init_data: initData })
                });

                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);

                // сохраняем то, что вернул сервер (истина)
                STORAGE.set('subscription', data.subscription);
                STORAGE.set('trial_used', true);

                // обновим stats (минимально)
                STORAGE.set('stats', {
                clipsRemaining: data.remaining_clips ?? 5,
                videosProcessed: 0,
                totalViews: 0,
                daysRemaining: 14
                });

                tg.showPopup({
                title: '🎁 Free Trial',
                message: 'Пробный период активирован!',
                buttons: [{ type: 'ok' }]
                }, function () {
                goToPage('home');
                });

            } catch (e) {
                console.error('activate_trial error:', e);
                tg.showPopup({
                title: 'Ошибка',
                message: String(e.message || e),
                buttons: [{ type: 'ok' }]
                });
            }

            return;
            }
            
            // ПЛАТНЫЕ ПЛАНЫ - открываем страницу оплаты
            const paidPlans = {
                'test': {title: 'Тест-тариф', price: 1000, clips: 3},
                'standard': {title: 'Стандарт', price: 15000, clips: 30},
                'pro': {title: 'Профессионал', price: 20000, clips: 60}
            };
            
            const planDetails = paidPlans[plan];
            if (!planDetails) {
                tg.showAlert('Неизвестный план');
                return;
            }
            
            // Сохраняем выбранный план
            STORAGE.set('selected_plan', {
                name: plan,
                ...planDetails
            });
            
            // Показываем страницу оплаты
            showPaymentPage(plan, planDetails);
        }

        async function showPaymentPage(plan, planDetails) {
            // Обновляем информацию на странице
            document.getElementById('payment-plan-title').textContent = planDetails.title;
            document.getElementById('payment-plan-name').textContent = planDetails.title;
            document.getElementById('payment-amount').textContent = `${planDetails.price} ₽`;
            document.getElementById('payment-clips').textContent = `${planDetails.clips} клипов`;
            
            // Переходим на страницу оплаты
            goToPage('payment');
            
            // Создаём платёж через API
            try {
                const initData = window.Telegram?.WebApp?.initData || '';

                const response = await fetch(`${API_URL}/payment/create`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                init_data: window.Telegram?.WebApp?.initData || '',
                plan: plan,
                email: user.username ? `${user.username}@telegram.user` : 'user@example.com'
                })
                });

                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error('Ошибка создания платежа');
                }
                
                console.log('Payment created:', data.payment_id);
                
                // Инициализируем виджет ЮKassa
                const checkout = new window.YooMoneyCheckoutWidget({
                    confirmation_token: data.confirmation_token,
                    // return_url: 'https://t.me/your_bot_username',  // Замени на своего бота
                    
                    error_callback: function(error) {
                        console.error('Payment error:', error);
                        document.getElementById('payment-error').textContent = 'Ошибка оплаты: ' + error.message;
                        document.getElementById('payment-error').style.display = 'block';
                    }
                });
                
                // Рендерим форму
                checkout.render('payment-form');
                
                // Отслеживаем успешную оплату
                checkout.on('success', async function () {
                try {
                    console.log('Payment successful!');

                    // Можно скрыть виджет
                    if (typeof checkout.destroy === 'function') {
                    checkout.destroy();
                    }

                    // Обновить данные подписки/статистики
                    try {
                    await syncWithServer();
                    } catch (e) {
                    console.error('syncWithServer error after payment', e);
                    }

                    // Перейти на нужную страницу Mini App
                    goToPage('subscription'); // или 'pricing' — как тебе удобнее

                    // НИЧЕГО не закрываем: ни tg.close(), ни WebApp.close()
                } catch (e) {
                    console.error('Payment success handler error', e);
                }
                });


                
            } catch (error) {
                console.error('Payment creation error:', error);
                document.getElementById('payment-error').textContent = 'Не удалось создать платёж: ' + error.message;
                document.getElementById('payment-error').style.display = 'block';
            }
        }

        async function confirmFreeTrial() {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            if (!initData) throw new Error('Откройте Mini App внутри Telegram (initData пустой).');

            const resp = await fetch(`${API_URL}/webapp/activate_trial`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init_data: initData })
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.detail || `HTTP ${resp.status}`);

            STORAGE.set('subscription', data.subscription);
            STORAGE.set('trial_used', true);
            await syncWithServer();

            tg.showPopup({
            title: '🎁 Free Trial',
            message: 'Пробный период активирован!',
            buttons: [{ type: 'ok' }]
            }, () => goToPage('home'));

        } catch (e) {
            console.error(e);
            tg.showPopup({ title: 'Ошибка', message: String(e.message || e), buttons: [{ type: 'ok' }] });
        }
        }


        function confirmPayment(plan, planDetails) {
            const paymentData = {
                action: 'requestpayment',
                userid: user.id,
                plan: plan,
                title: planDetails.title,
                amount: planDetails.amount,
                currency: 'RUB',
                istest: true
            };
            
            debug('Confirming payment', paymentData);
            tg.sendData(JSON.stringify(paymentData));
            // Приложение закроется автоматически после sendData

            setTimeout(() => {
                tg.close();
            }, 300);

        }


        // ===== ОБРАБОТКА УСПЕШНОЙ ОПЛАТЫ =====
        function handlePaymentSuccess(planId, planDetails) {
            const subscription = {
                plan: planId,
                plan_title: planDetails.title,
                clips_limit: planDetails.clips,
                clips_used: 0,
                is_trial: false,
                expires_at: planDetails.duration ? 
                    new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000).toISOString() : 
                    null
            };
    
            STORAGE.set('subscription', subscription);
            STORAGE.set('stats', {
                clipsRemaining: planDetails.clips,
                videosProcessed: 0,
                totalViews: 0,
                daysRemaining: planDetails.duration || 0
            });
    
            loadSubscription();
            goToPage('subscription');
    
            tg.showPopup({
                title: '🎉 Оплата успешна!',
                message: `Подписка ${planDetails.title} активирована!\n\nКлипов: ${planDetails.clips}\nСрок: ${planDetails.duration} дней`,
                buttons: [{type: 'ok'}]
            });
        }
    