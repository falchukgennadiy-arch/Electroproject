// ===== Профиль для VK Mini Apps =====
let currentUser = null;
let userSubscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

// URL сервера
const API_URL = 'https://api.omavisual.ru/api';

// Ссылки на подписки
const DONUT_LINKS = {
  course: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2499',
  visual: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2500',
  template: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2501',
  test: 'https://vk.com/electrocourses?w=donut_payment-223389702&levelId=2502'
};

// Функция сохранения пользователя в базу данных
async function saveUserToDatabase(userData, hasDonut = false, subscriptions = {}) {
  try {
    const response = await fetch(`${API_URL}/users/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vk_id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name || '',
        photo: userData.photo_200 || userData.photo_100,
        has_donut: hasDonut,
        donut_levels: subscriptions
      })
    });
    const result = await response.json();
    console.log('✅ Пользователь сохранён в БД:', result);
  } catch (error) {
    console.error('❌ Ошибка сохранения пользователя:', error);
  }
}

// Получение внутреннего ID пользователя по VK ID
async function getInternalUserId(vkId) {
  try {
    const response = await fetch(`${API_URL}/users/vk/${vkId}`);
    if (!response.ok) throw new Error('Пользователь не найден');
    const user = await response.json();
    return user.id;
  } catch (err) {
    console.error('Ошибка получения ID:', err);
    return null;
  }
}

// Загрузка данных при старте
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Profile.js инициализация...');
  
  // Удаляем ненужные блоки
  const profileEdit = document.getElementById("profileEdit");
  if (profileEdit) profileEdit.remove();
  
  const vkAuthSection = document.getElementById('vkAuthSection');
  if (vkAuthSection) vkAuthSection.remove();
  
  const userInfoSection = document.getElementById('userInfoSection');
  if (userInfoSection) userInfoSection.remove();
  
  // Ждём данные от VK
  if (window.vkUserData) {
    handleVKUserData(window.vkUserData);
    checkDonutSubscription();
  }
  
  window.addEventListener('vkBridgeReady', function(event) {
    handleVKUserData(event.detail);
    checkDonutSubscription();
  });
  
  if (window.vkBridge) {
    window.vkBridge.send('VKWebAppGetUserInfo')
      .then(userData => {
        handleVKUserData(userData);
        checkDonutSubscription();
      })
      .catch(error => console.log('❌ Ошибка:', error));
  }
});

function handleVKUserData(userData) {
  if (!userData) return;
  
  currentUser = {
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name || '',
    photo: userData.photo_200 || userData.photo_100,
  };
  
  updateProfileDisplay();
  
  // Сохраняем пользователя в базу данных (без подписок, они обновятся в checkDonutSubscription)
  saveUserToDatabase(currentUser);
  window.dispatchEvent(new CustomEvent('userLoaded', { detail: currentUser }));
}

// Проверка донат-подписки через ваш сервер
async function checkDonutSubscription() {
  if (!currentUser?.id) {
    console.log('⚠️ Нет ID пользователя');
    renderSubscriptions();
    return;
  }
  
  console.log(`🔍 Проверяем подписку для ${currentUser.id}...`);
  
  try {
    const response = await fetch(`${API_URL}/donut/check-donut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📡 Ответ сервера:', data);
    
    let subscriptions = {};
    
    if (data.success && data.has_donut) {
      subscriptions = data.subscriptions || {
        course: true,
        visual: true,
        template: true,
        test: true
      };
      userSubscriptions = subscriptions;
    } else {
      userSubscriptions = {
        course: false,
        visual: false,
        template: false,
        test: false
      };
    }
    
    // Сохраняем пользователя с обновлёнными подписками
    await saveUserToDatabase(currentUser, data.has_donut || false, subscriptions);
    
    renderSubscriptions();
    
  } catch (error) {
    console.error('❌ Ошибка проверки подписки:', error);
    renderSubscriptions();
  }
}

function updateProfileDisplay() {
  const displayName = document.getElementById("displayName");
  if (displayName && currentUser) {
    displayName.innerText = `${currentUser.first_name} ${currentUser.last_name}`.trim();
  }
  
  const avatar = document.getElementById("avatar");
  if (avatar && currentUser?.photo) {
    avatar.innerHTML = '';
    avatar.style.background = `url(${currentUser.photo}) center/cover no-repeat`;
    avatar.style.border = '2px solid #e6c158';
    avatar.style.color = 'transparent';
  }
  
  const userEmail = document.getElementById("userEmail");
  if (userEmail) userEmail.style.display = 'none';
  
  const editButton = document.querySelector('[onclick="enableNameEdit()"]');
  if (editButton) editButton.remove();
}

// ===== АКТИВАЦИЯ ПРОМОКОДА =====
async function activatePromoCode() {
  const code = prompt('Введите промокод:');
  if (!code) return;
  
  if (!currentUser?.id) {
    alert('Ошибка: пользователь не найден');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/activate-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vk_id: currentUser.id, promo_code: code.trim() })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Подписка ${result.type} активирована!`);
      await checkDonutSubscription();
    } else {
      alert(result.error || 'Ошибка активации');
    }
  } catch (err) {
    console.error('Ошибка активации:', err);
    alert('Ошибка подключения к серверу');
  }
}

function renderSubscriptions() {
  const subsList = document.getElementById("subscriptionsList");
  if (!subsList) return;
  
  const subscriptionTypes = [
    { key: 'course', name: 'COURSE', icon: '📚', desc: 'Доступ к курсам' },
    { key: 'visual', name: 'VISUAL', icon: '🎨', desc: 'Блоки визуализации' },
    { key: 'template', name: 'TEMPLATE', icon: '📁', desc: 'Шаблоны и блоки' },
    { key: 'test', name: 'TEST', icon: '📝', desc: 'Тесты и проверка знаний' }
  ];
  
  let html = `
    <div class="sub-card" style="background: #2a2a2a; border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="width: 40px; height: 40px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">🔓</div>
        <div>
          <h4 style="margin: 0; color: #e6c158;">FREE (базовый)</h4>
          <p style="margin: 5px 0 0; color: #999;">Всегда доступен</p>
        </div>
      </div>
      <span style="background: #00a86b; color: white; padding: 5px 12px; border-radius: 20px;">Активен</span>
    </div>
  `;
  
  for (let sub of subscriptionTypes) {
    const isActive = userSubscriptions[sub.key] || false;
    
    html += `
      <div class="sub-card" style="background: #2a2a2a; border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 40px; height: 40px; background: ${getColorForKey(sub.key)}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">${sub.icon}</div>
          <div>
            <h4 style="margin: 0; color: ${isActive ? '#e6c158' : '#fff'};">${sub.name}</h4>
            <p style="margin: 5px 0 0; color: #999;">${sub.desc}</p>
          </div>
        </div>
        ${isActive 
          ? `<span style="background: #00a86b; color: white; padding: 5px 12px; border-radius: 20px;">Активна</span>`
          : `<button onclick="openDonatSubscription('${sub.key}')" style="background: #e6c158; color: #1a1a1a; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer;">Оформить</button>`
        }
      </div>
    `;
  }
  
  // Кнопка активации промокода
  html += `
    <div class="sub-card" style="background: #2a2a2a; border-radius: 12px; padding: 15px; margin-top: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="margin: 0;">🎁 Есть промокод?</h4>
          <p style="margin: 5px 0 0; color: #999;">Введите код для активации подписки</p>
        </div>
        <button onclick="activatePromoCode()" style="background: #e6c158; color: #000; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer;">Активировать</button>
      </div>
    </div>
  `;
  
  subsList.innerHTML = html;
}

function getColorForKey(key) {
  const colors = {
    course: '#4a90e2',
    visual: '#e6c158',
    template: '#9b59b6',
    test: '#e67e22'
  };
  return colors[key] || '#444';
}

function openDonatSubscription(level) {
  const link = DONUT_LINKS[level];
  if (!link) return;
  
  if (window.vkBridge) {
    window.vkBridge.send("VKWebAppOpenURL", { url: link })
      .catch(() => window.open(link, '_blank'));
  } else {
    window.open(link, '_blank');
  }
}

window.checkDonutSubscription = checkDonutSubscription;
window.openDonatSubscription = openDonatSubscription;
window.activatePromoCode = activatePromoCode;
window.getInternalUserId = getInternalUserId;
window.currentUser = currentUser;
