// ===== Профиль для VK Mini Apps =====
let currentUser = null;
let userSubscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

// ID вашего сообщества VK (из ссылки)
const COMMUNITY_ID = 223389702; 
const DONUT_LINK = 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2499';

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Profile.js инициализация...');
  
  // Если данные VK уже загружены
  if (window.vkUserData) {
    console.log('✅ Данные VK уже есть:', window.vkUserData);
    handleVKUserData(window.vkUserData);
    checkDonutSubscription();
  }
  
  // Слушаем событие загрузки VK Bridge
  window.addEventListener('vkBridgeReady', function(event) {
    console.log('🎯 Событие vkBridgeReady получено:', event.detail);
    handleVKUserData(event.detail);
    checkDonutSubscription();
  });
  
  // Также пробуем получить данные напрямую из VK Bridge
  if (window.vkBridge) {
    window.vkBridge.send('VKWebAppGetUserInfo')
      .then(userData => {
        console.log('📦 Данные через прямой запрос:', userData);
        handleVKUserData(userData);
        return window.vkBridge.send('VKWebAppGetDonutInfo');
      })
      .then(donutInfo => {
        console.log('🍩 Donut информация:', donutInfo);
        processDonutInfo(donutInfo);
      })
      .catch(error => {
        console.log('❌ Ошибка прямого запроса:', error);
        // Если ошибка, показываем подписки как недоступные
        userSubscriptions = {
          course: false,
          visual: false,
          template: false,
          test: false
        };
        renderSubscriptions();
      });
  }
});

// Обработка данных пользователя VK
function handleVKUserData(userData) {
  if (!userData) return;
  
  currentUser = {
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name || '',
    photo: userData.photo_200 || userData.photo_100 || userData.photo,
    email: userData.email
  };
  
  console.log('👤 Текущий пользователь:', currentUser);
  updateProfileDisplay();
}

// Обработка Donut информации
function processDonutInfo(donutInfo) {
  if (!donutInfo) return;
  
  console.log('🍩 Обработка Donut:', donutInfo);
  
  // Проверяем, есть ли активная подписка
  const hasDonut = donutInfo.is_donut || false;
  
  if (hasDonut) {
    // Если есть донут, активируем все подписки
    userSubscriptions = {
      course: true,
      visual: true,
      template: true,
      test: true
    };
    console.log('✅ Есть донат-подписка, все доступно');
  } else {
    // Если нет, всё отключаем
    userSubscriptions = {
      course: false,
      visual: false,
      template: false,
      test: false
    };
    console.log('❌ Нет донат-подписки');
  }
  
  renderSubscriptions();
}

// Проверка донат-подписки
async function checkDonutSubscription() {
  if (!window.vkBridge) {
    console.log('⚠️ VK Bridge не доступен');
    renderSubscriptions(); // Показываем подписки (скорее всего без доступа)
    return;
  }
  
  try {
    const donutInfo = await window.vkBridge.send('VKWebAppGetDonutInfo');
    processDonutInfo(donutInfo);
  } catch (error) {
    console.error('❌ Ошибка при проверке донат-подписки:', error);
    // Если ошибка, значит подписки нет
    userSubscriptions = {
      course: false,
      visual: false,
      template: false,
      test: false
    };
    renderSubscriptions();
  }
}

// Обновление отображения профиля
function updateProfileDisplay() {
  console.log('🖼️ Обновляем отображение профиля');
  
  // Скрываем блок редактирования если он есть
  const profileEdit = document.getElementById("profileEdit");
  if (profileEdit) profileEdit.style.display = "none";
  
  // Показываем блок просмотра
  const profileView = document.getElementById("profileView");
  if (profileView) profileView.style.display = "block";
  
  // Обновляем имя
  const displayName = document.getElementById("displayName");
  if (displayName) {
    if (currentUser) {
      displayName.innerText = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    } else {
      displayName.innerText = "Гость";
    }
  }
  
  // Обновляем аватар
  const avatar = document.getElementById("avatar");
  if (avatar) {
    if (currentUser?.photo) {
      avatar.innerHTML = ''; // Очищаем
      avatar.style.background = `url(${currentUser.photo}) center/cover no-repeat`;
      avatar.style.border = '2px solid #e6c158';
      avatar.style.color = 'transparent'; // Скрываем текст
    } else if (currentUser) {
      avatar.style.background = '';
      avatar.style.color = '';
      avatar.innerText = `${currentUser.first_name[0]}${currentUser.last_name?.[0] || ''}`.toUpperCase();
    } else {
      avatar.innerText = '👤';
    }
  }
  
  // Скрываем email
  const userEmail = document.getElementById("userEmail");
  if (userEmail) {
    userEmail.style.display = 'none';
  }
  
  // Обновляем количество дней (если есть registrationDate)
  const daysElement = document.getElementById("daysWithUs");
  if (daysElement && currentUser) {
    // Если хотите показывать реальную дату регистрации, нужно получать её с бэка
    // Пока показываем заглушку
    daysElement.innerText = '0';
  }
  
  // Скрываем кнопку редактирования
  const editButton = document.querySelector('[onclick="enableNameEdit()"]');
  if (editButton) {
    editButton.style.display = 'none';
  }
  
  // Обновляем информацию в блоке VK (если он есть)
  const userInfoSection = document.getElementById('userInfoSection');
  if (userInfoSection && currentUser) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userEmailVK = document.getElementById('userEmailVK');
    
    if (userName) userName.textContent = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    if (userAvatar) userAvatar.src = currentUser.photo || 'images/default-avatar.png';
    if (userEmailVK) userEmailVK.textContent = currentUser.email || 'Email не указан';
    
    userInfoSection.style.display = 'block';
  }
  
  // Скрываем блок авторизации VK
  const vkAuthSection = document.getElementById('vkAuthSection');
  if (vkAuthSection) {
    vkAuthSection.style.display = 'none';
  }
}

// Отображение списка подписок
function renderSubscriptions() {
  const subsList = document.getElementById("subscriptionsList");
  if (!subsList) {
    console.log('❌ Элемент subscriptionsList не найден');
    return;
  }
  
  const subscriptionTypes = [
    { key: 'course', name: 'COURSE', icon: '📚', desc: 'Доступ к курсам' },
    { key: 'visual', name: 'VISUAL', icon: '🎨', desc: 'Блоки визуализации' },
    { key: 'template', name: 'TEMPLATE', icon: '📁', desc: 'Шаблоны и блоки' },
    { key: 'test', name: 'TEST', icon: '📝', desc: 'Тесты и проверка знаний' }
  ];
  
  // Проверяем, есть ли активные подписки
  const hasAnySubscription = Object.values(userSubscriptions).some(v => v === true);
  
  let html = '';
  
  if (!hasAnySubscription) {
    // Блок с предложением оформить подписку
    html += `
      <div class="no-subscription-card" style="
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-radius: 16px;
        padding: 30px 20px;
        text-align: center;
        margin: 20px 0;
        border: 1px solid #e6c158;
      ">
        <div style="font-size: 48px; margin-bottom: 15px;">💎</div>
        <h3 style="color: #e6c158; margin-bottom: 10px;">Нет активных подписок</h3>
        <p style="color: #999; margin-bottom: 20px;">
          Оформите донат-подписку в нашем сообществе,<br>
          чтобы получить доступ ко всем материалам
        </p>
        <button onclick="openVKDonut()" style="
          background: #e6c158;
          color: #1a1a1a;
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
          width: 100%;
          max-width: 250px;
        " onmouseover="this.style.transform='scale(1.05)'" 
           onmouseout="this.style.transform='scale(1)'">
          Оформить подписку
        </button>
      </div>
    `;
  }
  
  // Добавляем FREE подписку
  html += `
    <div class="sub-card" style="
      background: #2a2a2a;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="
          width: 40px;
          height: 40px;
          background: #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">🔓</div>
        <div>
          <h4 style="margin: 0; color: #e6c158;">FREE (базовый)</h4>
          <p style="margin: 5px 0 0; color: #999;">Всегда доступен</p>
        </div>
      </div>
      <span style="
        background: #00a86b;
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      ">Активен</span>
    </div>
  `;
  
  // Добавляем остальные подписки
  for (let sub of subscriptionTypes) {
    const isActive = userSubscriptions[sub.key] || false;
    
    html += `
      <div class="sub-card" style="
        background: #2a2a2a;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        opacity: ${isActive ? 1 : 0.7};
      ">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="
            width: 40px;
            height: 40px;
            background: ${getColorForKey(sub.key)};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          ">${sub.icon}</div>
          <div>
            <h4 style="margin: 0; color: ${isActive ? '#e6c158' : '#666'};">${sub.name}</h4>
            <p style="margin: 5px 0 0; color: #999;">${sub.desc}</p>
          </div>
        </div>
        ${isActive 
          ? `<span style="
              background: #00a86b;
              color: white;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            ">Активна</span>` 
          : `<span style="
              background: #444;
              color: #999;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            ">Недоступно</span>`
        }
      </div>
    `;
  }
  
  subsList.innerHTML = html;
  console.log('📋 Список подписок обновлен');
}

// Получить цвет для ключа подписки
function getColorForKey(key) {
  const colors = {
    course: '#4a90e2',
    visual: '#e6c158',
    template: '#9b59b6',
    test: '#e67e22'
  };
  return colors[key] || '#444';
}

// Открытие страницы донат-подписок сообщества
function openVKDonut() {
  console.log('🍩 Открываем страницу подписки:', DONUT_LINK);
  
  if (window.vkBridge) {
    // Пробуем открыть через VK Bridge
    window.vkBridge.send("VKWebAppOpenURL", {
      url: DONUT_LINK
    }).catch(error => {
      console.error('Ошибка открытия ссылки через bridge:', error);
      // Если не получилось, открываем обычным способом
      window.open(DONUT_LINK, '_blank');
    });
  } else {
    // Если VK Bridge не доступен, открываем в новом окне
    window.open(DONUT_LINK, '_blank');
  }
}

// Выход
function logout() {
  console.log('🚪 Выход из профиля');
  
  // В VK Mini Apps просто показываем гостевой режим
  currentUser = null;
  userSubscriptions = {
    course: false,
    visual: false,
    template: false,
    test: false
  };
  
  // Обновляем отображение
  const displayName = document.getElementById("displayName");
  if (displayName) displayName.innerText = 'Гость';
  
  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.style.background = '';
    avatar.innerText = '👤';
  }
  
  const userInfoSection = document.getElementById('userInfoSection');
  if (userInfoSection) userInfoSection.style.display = 'none';
  
  const vkAuthSection = document.getElementById('vkAuthSection');
  if (vkAuthSection) vkAuthSection.style.display = 'block';
  
  renderSubscriptions();
}

// Принудительная проверка подписок
function refreshSubscriptions() {
  checkDonutSubscription();
}

// Инициализация при показе профиля (если вызывается из навигации)
window.navigate = window.navigate || function(section) {
  if (section === 'profile') {
    // При переходе в профиль обновляем данные
    if (window.vkUserData) {
      handleVKUserData(window.vkUserData);
    }
    checkDonutSubscription();
  }
};

// Экспорт функций
window.updateProfileDisplay = updateProfileDisplay;
window.renderSubscriptions = renderSubscriptions;
window.openVKDonut = openVKDonut;
window.logout = logout;
window.refreshSubscriptions = refreshSubscriptions;
window.checkDonutSubscription = checkDonutSubscription;

// Заглушки для старых функций (чтобы не было ошибок)
window.enableNameEdit = function() { console.log('Редактирование отключено'); };
window.cancelNameEdit = function() { console.log('Редактирование отключено'); };
window.saveName = function() { console.log('Редактирование отключено'); };
