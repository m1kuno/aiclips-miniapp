        // ===== NAVIGATION =====
        function goToPage(pageName) {
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
    
            document.getElementById(`${pageName}-page`).classList.add('active');
    
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
    
            const navItems = document.querySelectorAll('.nav-item');
            const pages = ['home', 'channels', 'subscription', 'pricing'];
            navItems.forEach((item, index) => {
                if (pages[index] === pageName) {
                    item.classList.add('active');
                }
            });
    
            if (pageName === 'home') loadHome();
            if (pageName === 'channels') loadChannels();
            if (pageName === 'subscription') loadSubscription();
            if (pageName === 'pricing') checkTrialStatus();
    
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
    }
        }
    