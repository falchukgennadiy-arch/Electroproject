/**
 * VK Bridge инициализация для мини-приложения
 * Подключается отдельным файлом для лучшей организации кода
 */

(function() {
    console.log('🔄 Загрузка VK Bridge...');
    
    // Функция для инициализации VK Bridge
    function initVKBridge() {
        if (!window.vkBridge) {
            console.error('❌ VK Bridge не загружен!');
            return;
        }
        
        console.log('✅ VK Bridge загружен, отправляем сигнал инициализации...');
        
        // Отправляем сигнал о готовности приложения
        window.vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK Mini App успешно инициализировано');
                
                // Пытаемся получить данные пользователя
                return window.vkBridge.send('VKWebAppGetUserInfo');
            })
            .then(userData => {
                console.log('👤 Получены данные пользователя VK:', userData);
                
                // Сохраняем данные в глобальной переменной
                window.vkUserData = userData;
                
                // Запускаем событие, которое могут слушать другие скрипты
                const event = new CustomEvent('vkBridgeReady', { detail: userData });
                window.dispatchEvent(event);
                
                // Если есть функция обратного вызова - вызываем её
                if (window.onVKUserLoaded && typeof window.onVKUserLoaded === 'function') {
                    window.onVKUserLoaded(userData);
                }
                
                // Обновляем интерфейс, если страница уже загружена
                if (document.readyState === 'complete') {
                    updateUIWithVKData(userData);
                } else {
                    window.addEventListener('load', () => updateUIWithVKData(userData));
                }
            })
            .catch(error => {
                console.error('❌ Ошибка при работе с VK Bridge:', error);
                
                // Обрабатываем специфичные ошибки
                if (error.message) {
                    if (error.message.includes('nonexistent') || error.message.includes('NO_EXISTING_REQUEST')) {
                        console.log('ℹ️ Приложение запущено вне контекста ВКонтакте (обычный браузер)');
                    } else if (error.message.includes('auth')) {
                        console.log('🔐 Требуется авторизация');
                    }
                }
            });
    }
    
    // Функция для обновления интерфейса данными из VK
    function updateUIWithVKData(userData) {
        if (!userData) return;
        
        console.log('🖼️ Обновляем интерфейс данными VK');
        
        // Обновляем аватар
        const avatarElement = document.getElementById('avatar');
        if (avatarElement && userData.photo_100) {
            avatarElement.innerHTML = `<img src="${userData.photo_100}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            avatarElement.style.background = 'transparent';
            avatarElement.style.border = '2px solid #e6c158';
        }
        
        // Обновляем имя
        const displayName = document.getElementById('displayName');
        if (displayName && userData.first_name) {
            const fullName = `${userData.first_name} ${userData.last_name || ''}`.trim();
            displayName.textContent = fullName;
        }
        
        // Обновляем email если есть
        if (userData.email) {
            const emailElement = document.getElementById('userEmail');
            if (emailElement) {
                emailElement.textContent = userData.email;
            }
        }
        
        // Скрываем кнопку VK авторизации (так как уже авторизованы через VK Bridge)
        const vkButton = document.getElementById('vkButton');
        if (vkButton) {
            vkButton.style.display = 'none';
        }
        
        // Скрываем блок с кнопкой VK
        const vkAuthSection = document.getElementById('vkAuthSection');
        if (vkAuthSection) {
            vkAuthSection.style.display = 'none';
        }
        
        // Показываем или обновляем блок с информацией о пользователе VK
        const userInfoSection = document.getElementById('userInfoSection');
        if (userInfoSection) {
            const userNameElement = document.getElementById('userName');
            const userAvatarElement = document.getElementById('userAvatar');
            const userEmailElement = document.getElementById('userEmailVK');
            
            if (userNameElement) {
                userNameElement.textContent = `${userData.first_name} ${userData.last_name || ''}`.trim();
            }
            
            if (userAvatarElement && userData.photo_200) {
                userAvatarElement.src = userData.photo_200;
            } else if (userAvatarElement && userData.photo_100) {
                userAvatarElement.src = userData.photo_100;
            }
            
            if (userEmailElement && userData.email) {
                userEmailElement.textContent = userData.email;
            }
            
            userInfoSection.style.display = 'block';
        }
    }
    
    // Слушаем загрузку скрипта VK Bridge
    if (document.querySelector('script[src*="vk-bridge"]')) {
        // Если скрипт уже загружен
        initVKBridge();
    } else {
        // Если скрипт ещё не загрузился - ждём
        const script = document.querySelector('script[src*="vk-bridge"]');
        if (script) {
            script.addEventListener('load', initVKBridge);
        } else {
            console.warn('⚠️ Скрипт VK Bridge не найден в DOM');
        }
    }
    
    // Добавляем глобальные функции для работы с VK
    window.VKBridge = {
        // Получить данные пользователя
        getUserData: function() {
            return window.vkUserData || null;
        },
        
        // Проверить, запущено ли приложение внутри ВК
        isVKContext: function() {
            try {
                return window.self !== window.top || 
                       (window.vkBridge && navigator.userAgent.includes('VK'));
            } catch (e) {
                return true; // Ошибка доступа - значит во фрейме
            }
        },
        
        // Открыть ссылку правильно (во ВК или обычным способом)
        openLink: function(url) {
            if (window.vkBridge) {
                window.vkBridge.send('VKWebAppOpenURL', { url: url });
            } else {
                window.open(url, '_blank');
            }
        },
        
        // Показать нативный попап ВК
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
