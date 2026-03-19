// ===== Профиль для VK Mini Apps =====
let currentUser = null;
let userSubscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

// ID вашего сообщества VK (замените на реальный)
const COMMUNITY_ID = 223389702; // Например: 123456789

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
  // Если данные VK уже загружены
  if (window.vkUserData) {
    handleVKUserData(window.vkUserData);
    checkDonutSubscription();
  }
  
  // Слушаем событие загрузки VK Bridge
  window.addEventListener('vkBridgeReady', function(event) {
    handleVKUserData(event.detail);
    checkDonutSubscription();
  });
});

// Обработка данных пользователя VK
function handleVKUserData(userData) {
  currentUser = {
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    photo: userData.photo_200 || userData.photo_100,
    email: userData.email
  };
  
  updateProfileDisplay();
  updateUIBasedOnVK(userData);
}

// Проверка донат-подписки в сообществе
async function checkDonutSubscription() {
  if (!window.vkBridge || !currentUser) return;
  
  try {
    // Получаем информацию о донут-подписке
    const donutInfo = await window.vkBridge.send('VKWebAppGetDonutInfo');
    
    console.log('🍩 Информация о донат-подписке:', donutInfo);
    
    // Проверяем, есть ли активная подписка
    const hasDonut = donutInfo.is_donut || false;
    
    if (hasDonut) {
      // Если есть донут, активируем все подписки
      // (можно настроить логику под разные уровни)
      userSubscriptions = {
        course: true,
        visual: true,
        template: true,
        test: true
      };
      
      console.log('✅ У пользователя есть донат-подписка');
    } else {
      // Если нет донут-подписки, сбрасываем всё
      userSubscriptions = {
        course: false,
        visual: false,
        template: false,
        test: false
      };
      
      console.log('❌ У пользователя нет донат-подписки');
    }
    
    // Обновляем отображение подписок
    renderSubscriptions();
    
  } catch (error) {
    console.error('Ошибка при проверке донат-подписки:', error);
    
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
  if (!currentUser) return;
  
  const displayName = document.getElementById("displayName");
  if (displayName) {
    displayName.innerText = `${currentUser.first_name} ${currentUser.last_name}`;
  }
  
  const avatar = document.getElementById("avatar");
  if (avatar) {
    if (currentUser.photo) {
      avatar.innerHTML = ''; // Очищаем
      avatar.style.background = `url(${currentUser.photo}) center/cover no-repeat`;
      avatar.style.border = '2px solid #e6c158';
    } else {
      avatar.style.background = '';
      avatar.innerText = `${currentUser.first_name[0]}${currentUser.last_name?.[0] || ''}`.toUpperCase();
    }
  }
}

// Обновление UI на основе данных VK (дополняет ваш updateUIWithVKData)
function updateUIBasedOnVK(userData) {
  // Ваша функция updateUIWithVKData уже делает основную работу
  // Здесь добавляем дополнительную логику если нужно
  
  // Скрываем кнопку "Редактировать" (если она есть)
  const editButton = document.querySelector('[onclick="enableNameEdit()"]');
  if (editButton) {
    editButton.style.display = 'none';
  }
  
  // Скрываем email если он не нужен
  const emailElements = document.querySelectorAll('#userEmail, .user-email');
  emailElements.forEach(el => {
    if (el) el.style.display = 'none';
  });
}

// Отображение списка подписок
function renderSubscriptions() {
  const subsList = document.getElementById("subscriptionsList");
  if (!subsList) return;
  
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
        " onmouseover="this.style.transform='scale(1.05)'" 
           onmouseout="this.style.transform='scale(1)'">
          Оформить подписку
        </button>
      </div>
    `;
  }
  
  // Добавляем FREE подписку
  html += `
    <div class="sub-card free-card" style="
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
        opacity: ${isActive ? 1 : 0.6};
      ">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="
            width: 40px;
            height: 40px;
            background: var(--${sub.key}, #444);
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
            ">Активна</span>` 
          : `<span style="
              background: #444;
              color: #999;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 12px;
            ">Недоступно</span>`
        }
      </div>
    `;
  }
  
  subsList.innerHTML = html;
}

// Открытие страницы донат-подписок сообщества
function openVKDonut() {
  if (window.vkBridge) {
    // Открываем раздел донут сообщества
    window.vkBridge.send("VKWebAppOpenApp", {
      app_id: COMMUNITY_ID, // ID сообщества
      location: "donut" // Открываем вкладку с донут-подписками
    }).catch(error => {
      console.error('Ошибка открытия сообщества:', error);
      
      // Если не получилось открыть через bridge, открываем ссылку
      window.VKBridge?.openLink(`https://vk.com/donut/public${COMMUNITY_ID}`);
    });
  } else {
    // Запасной вариант
    window.open(`https://vk.com/donut/public${COMMUNITY_ID}`, '_blank');
  }
}

// Выход (возврат на страницу авторизации)
function logout() {
  // В VK Mini Apps пользователь всегда авторизован через ВК
  // Поэтому просто показываем стартовый экран или перезагружаем
  
  const profileView = document.getElementById("profileView");
  const loginView = document.getElementById("loginView");
  
  if (profileView) profileView.style.display = "none";
  if (loginView) loginView.style.display = "block";
  
  // Очищаем данные
  currentUser = null;
  userSubscriptions = {
    course: false,
    visual: false,
    template: false,
    test: false
  };
  
  // Обновляем отображение аватара
  const avatar = document.getElementById("avatar");
  if (avatar) {
    avatar.style.background = '';
    avatar.innerText = '👤';
  }
  
  const displayName = document.getElementById("displayName");
  if (displayName) {
    displayName.innerText = 'Гость';
  }
}

// Принудительная проверка подписок (можно вызвать по кнопке "Обновить")
function refreshSubscriptions() {
  checkDonutSubscription();
}

// Экспорт функций
window.updateProfileDisplay = updateProfileDisplay;
window.renderSubscriptions = renderSubscriptions;
window.openVKDonut = openVKDonut;
window.logout = logout;
window.refreshSubscriptions = refreshSubscriptions;
window.checkDonutSubscription = checkDonutSubscription;
