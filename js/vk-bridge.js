/**
 * VK Bridge инициализация для мини-приложения
 * Только инициализация и отправка событий — без обновления UI
 */

(function() {
    console.log('🔄 Загрузка VK Bridge...');
    
    function initVKBridge() {
        if (!window.vkBridge) {
            console.error('❌ VK Bridge не загружен!');
            return;
        }
        
        console.log('✅ VK Bridge загружен');
        
        window.vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK Mini App инициализировано');
                return window.vkBridge.send('VKWebAppGetUserInfo');
            })
            .then(userData => {
                console.log('👤 Получены данные пользователя VK:', userData);
                
                // Только сохраняем данные и отправляем событие
                window.vkUserData = userData;
                
                // Отправляем событие для profile.js
                const event = new CustomEvent('vkBridgeReady', { detail: userData });
                window.dispatchEvent(event);
                
                // Если есть функция обратного вызова
                if (window.onVKUserLoaded && typeof window.onVKUserLoaded === 'function') {
                    window.onVKUserLoaded(userData);
                }
            })
            .catch(error => {
                console.error('❌ Ошибка при работе с VK Bridge:', error);
                
                if (error.message) {
                    if (error.message.includes('nonexistent') || error.message.includes('NO_EXISTING_REQUEST')) {
                        console.log('ℹ️ Приложение запущено вне контекста ВКонтакте (обычный браузер)');
                    } else if (error.message.includes('auth')) {
                        console.log('🔐 Требуется авторизация');
                    }
                }
            });
    }
    
    // Ждём загрузку скрипта VK Bridge
    if (window.vkBridge) {
        initVKBridge();
    } else {
        const script = document.querySelector('script[src*="vk-bridge"]');
        if (script) {
            script.addEventListener('load', initVKBridge);
        } else {
            console.warn('⚠️ Скрипт VK Bridge не найден в DOM');
        }
    }
    
    // Глобальные функции
    window.VKBridge = {
        getUserData: function() {
            return window.vkUserData || null;
        },
        
        isVKContext: function() {
            try {
                return window.self !== window.top || 
                       (window.vkBridge && navigator.userAgent.includes('VK'));
            } catch (e) {
                return true;
            }
        },
        
        openLink: function(url) {
            if (window.vkBridge) {
                window.vkBridge.send('VKWebAppOpenURL', { url: url });
            } else {
                window.open(url, '_blank');
            }
        },
        
        showAlert: function(title, message) {
            if (window.vkBridge) {
                window.vkBridge.send('VKWebAppShowAlert', {
                    title: title,
                    message: message
                });
            } else {
                alert(message);
            }
        }
    };
    
})();
