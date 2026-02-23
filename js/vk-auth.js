// VK Аутентификация
const VKAuth = {
  // ID вашего приложения VK (из настроек)
  appId: '54458443',
  
  // URL, куда VK перенаправит после авторизации
  redirectUri: 'https://falchukgennadiy-arch.github.io/Electroproject/vk-callback.html',
  
  /**
   * Запускает процесс авторизации
   */
  login() {
    // Убираем scope=email, оставляем только базовые права
    const authUrl = `https://oauth.vk.com/authorize?` +
      `client_id=${this.appId}` +
      `&display=page` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=code` +
      `&v=5.199`;
    
    console.log('Auth URL:', authUrl); // для отладки
    window.location.href = authUrl;
  },
  
  /**
   * Обрабатывает callback после авторизации
   */
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
      console.error('No code received');
      return;
    }
    
    try {
      // Отправляем код на наш сервер
      const response = await fetch('https://api.omavisual.ru/api/auth/vk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      console.log('Auth response:', data);
      
      if (data.success) {
        // Сохраняем данные пользователя
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Обновляем интерфейс
        if (typeof updateUserUI === 'function') {
          updateUserUI(data.user);
        }
        
        // Закрываем окно и возвращаемся
        if (window.opener) {
          window.opener.postMessage({ type: 'vk-auth-success', user: data.user }, '*');
          window.close();
        } else {
          window.location.href = '/Electroproject/';
        }
      } else {
        console.error('Auth failed:', data);
        alert('Ошибка авторизации: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Ошибка соединения с сервером');
    }
  }
};

// Делаем доступным глобально
window.VKAuth = VKAuth;
