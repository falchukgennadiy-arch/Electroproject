// ===== Профиль для VK Mini Apps =====
let currentUser = null;
let userSubscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

// Ссылки на подписки для каждого уровня
const DONUT_LINKS = {
  course: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2499',
  visual: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2500',  // замените на реальную
  template: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2501', // замените на реальную
  test: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2502'      // замените на реальную
};

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Profile.js инициализация...');
  
  // Скрываем ненужные блоки сразу
  const profileEdit = document.getElementById("profileEdit");
  if (profileEdit) profileEdit.remove(); // Удаляем блок редактирования
  
  const vkAuthSection = document.getElementById('vkAuthSection');
  if (vkAuthSection) vkAuthSection.remove(); // Удаляем блок VK авторизации
  
  const userInfoSection = document.getElementById('userInfoSection');
  if (userInfoSection) userInfoSection.remove(); // Удаляем дублирующий блок
  
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
    renderSubscriptions();
    return;
  }
  
  try {
    const donutInfo = await window.vkBridge.send('VKWebAppGetDonutInfo');
    processDonutInfo(donutInfo);
  } catch (error) {
    console.error('❌ Ошибка при проверке донат-подписки:', error);
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
  
  // Скрываем кнопку редактирования
  const editButton = document.querySelector('[onclick="enableNameEdit()"]');
  if (editButton) {
    editButton.remove(); // Удаляем кнопку
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
  
  let html = '';
  
  // Добавляем FREE подписку (всегда активна)
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
  
  // Добавляем остальные подписки с кнопками оформления
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
        opacity: ${isActive ? 1 : 1};
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
            <h4 style="margin: 0; color: ${isActive ? '#e6c158' : '#fff'};">${sub.name}</h4>
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
          : `<button onclick="openDonatSubscription('${sub.key}')" style="
              background: #e6c158;
              color: #1a1a1a;
              border: none;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
              Оформить
            </button>`
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

// Открытие донат-подписки для конкретного уровня
function openDonatSubscription(level) {
  const link = DONUT_LINKS[level];
  if (!link) {
    console.error('❌ Ссылка для подписки не найдена:', level);
    return;
  }
  
  console.log(`🍩 Открываем подписку ${level}:`, link);
  
  if (window.vkBridge) {
    window.vkBridge.send("VKWebAppOpenURL", {
      url: link
    }).catch(error => {
      console.error('Ошибка открытия ссылки через bridge:', error);
      window.open(link, '_blank');
    });
  } else {
    window.open(link, '_blank');
  }
}

// Экспорт функций
window.updateProfileDisplay = updateProfileDisplay;
window.renderSubscriptions = renderSubscriptions;
window.openDonatSubscription = openDonatSubscription;
window.checkDonutSubscription = checkDonutSubscription;
