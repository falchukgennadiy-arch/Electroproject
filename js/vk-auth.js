// VK Аутентификация
const VKAuth = {
  // ID вашего приложения VK (из шага 1)
  appId: '12345678', // ЗАМЕНИТЕ НА ВАШ!
  
  // URL, куда VK перенаправит после авторизации
  redirectUri: 'https://falchukgennadiy-arch.github.io/Electroproject/vk-callback.html',
  
  /**
   * Запускает процесс авторизации
   */
  login() {
    // Формируем URL для авторизации [citation:1][citation:7]
    const authUrl = `https://oauth.vk.com/authorize?` +
      `client_id=${this.appId}` +
      `&display=page` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=email` + // Запрашиваем email
      `&response_type=code` +
      `&v=5.199`;
    
    // Перенаправляем пользователя
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
      
      if (data.success) {
        // Сохраняем данные пользователя
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Обновляем интерфейс
        updateUserInterface(data.user);
        
        // Закрываем окно и возвращаемся
        if (window.opener) {
          window.opener.postMessage({ type: 'vk-auth-success', user: data.user }, '*');
          window.close();
        } else {
          // Перенаправляем на главную
          window.location.href = '/Electroproject/';
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }
};

// Функция обновления интерфейса
function updateUserInterface(user) {
  const profileIcon = document.getElementById('headerProfileIcon');
  if (profileIcon && user.avatar) {
    profileIcon.innerHTML = `<img src="${user.avatar}" style="width:40px; height:40px; border-radius:50%;">`;
  }
  
  // Обновляем информацию в профиле
  const displayName = document.getElementById('displayName');
  if (displayName) {
    displayName.textContent = user.name;
  }
}

// Делаем доступным глобально
window.VKAuth = VKAuth;
