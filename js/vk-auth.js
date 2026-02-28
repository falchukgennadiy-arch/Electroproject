// VK Аутентификация
const VKAuth = {
  appId: '54466809',
  redirectUrl: 'https://falchukgennadiy-arch.github.io/Electroproject/vk-callback.html',

  async login() {
    if ('VKIDSDK' in window) {
      const VKID = window.VKIDSDK;
      
      VKID.Config.init({
        app: this.appId,
        redirectUrl: this.redirectUrl,
        responseMode: VKID.ConfigResponseMode.Callback, // или Redirect
        source: VKID.ConfigSource.LOWCODE,
        scope: '' // email phone если нужно
      });

      const oneTap = new VKID.OneTap();
      
      oneTap.render({
        container: document.getElementById('vk-auth-container'),
        showAlternativeLogin: true
      })
      .on(VKID.WidgetEvents.ERROR, (error) => {
        console.error('VK Widget error:', error);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
        try {
          const response = await fetch('https://api.omavisual.ru/api/auth/vk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: payload.code,
              device_id: payload.device_id
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            if (typeof updateUserUI === 'function') {
              updateUserUI(data.user);
            }
            
            console.log('Авторизация успешна!', data.user);
          } else {
            console.error('Ошибка авторизации:', data.error);
          }
        } catch (error) {
          console.error('Ошибка при отправке на сервер:', error);
        }
      });
    } else {
      console.error('VKIDSDK не загружен');
    }
  },

  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    if (typeof updateUserUI === 'function') {
      updateUserUI(null);
    }
    window.location.reload();
  },

  isAuthenticated() {
    return !!localStorage.getItem('userToken');
  },

  getUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
};

window.VKAuth = VKAuth;
