        // ===== ONBOARDING =====
        function startOnboarding() {
            document.getElementById('reg-name').textContent = 
                user?.first_name + (user?.last_name ? ' ' + user.last_name : '');
            document.getElementById('reg-username').textContent = 
                '@' + (user?.username || 'no_username');
            document.getElementById('reg-id').textContent = user?.id || 'test';
    
            goToPage('registration');
        }
    
        function completeRegistration() {
            tg.sendData(JSON.stringify({
                action: 'complete_registration',
                user_id: user?.id,
                username: user?.username,
                first_name: user?.first_name,
                last_name: user?.last_name,
                language_code: user?.language_code
            }));
    
            STORAGE.set('registered', true);
    
            goToPage('channels');
            document.getElementById('bottom-nav').style.display = 'flex';
    
            tg.showPopup({
                title: '✅ Регистрация завершена!',
                message: 'Теперь подключите ваш YouTube канал',
                buttons: [{type: 'ok'}]
            });
        }
    