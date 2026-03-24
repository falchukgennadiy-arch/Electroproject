// ===== Профиль для VK Mini Apps =====
let currentUser = null;
let userSubscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

// Функция сохранения пользователя в базу данных
async function saveUserToDatabase(userData, hasDonut = false, subscriptions = {}) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/users/save`, {
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

// Загрузка подписок из БД
async function loadSubscriptionsFromDB() {
  if (!currentUser?.id) return;
  
  try {
    const userResponse = await fetch(`${CONFIG.API_URL}/users/vk/${currentUser.id}`);
    if (!userResponse.ok) throw new Error('Пользователь не найден');
    const user = await userResponse.json();
    
    if (user.created_at) {
      currentUser.created_at = user.created_at;
      updateDaysWithUs();
    }
    
    const subsResponse = await fetch(`${CONFIG.API_URL}/users/user/${user.id}`);
    if (!subsResponse.ok) throw new Error('Ошибка загрузки подписок');
    const subscriptions = await subsResponse.json();
    
    userSubscriptions = {
      course: false,
      visual: false,
      template: false,
      test: false
    };
    
    window.subscriptionExpiry = {};
    
    for (const sub of subscriptions) {
      if (sub.active === 1) {
        const type = sub.type;
        if (userSubscriptions.hasOwnProperty(type)) {
          userSubscriptions[type] = true;
        }
        if (sub.expires_at) {
          window.subscriptionExpiry[type] = new Date(sub.expires_at);
        }
      }
    }
    
    console.log('📋 Подписки загружены:', userSubscriptions);
    renderSubscriptions();
    
  } catch (err) {
    console.error('Ошибка загрузки подписок из БД:', err);
  }
}

function updateDaysWithUs() {
  const daysWithUs = document.getElementById("daysWithUs");
  if (daysWithUs && currentUser?.created_at) {
    const created = new Date(currentUser.created_at);
    const now = new Date();
    const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    daysWithUs.innerText = days;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Profile.js инициализация...');
  
  const profileEdit = document.getElementById("profileEdit");
  if (profileEdit) profileEdit.remove();
  
  const vkAuthSection = document.getElementById('vkAuthSection');
  if (vkAuthSection) vkAuthSection.remove();
  
  const userInfoSection = document.getElementById('userInfoSection');
  if (userInfoSection) userInfoSection.remove();
  
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
    photo: userData.photo_200 || userData.photo_100 || '',
  };
  
  updateProfileDisplay();
  saveUserToDatabase(currentUser);
  window.dispatchEvent(new CustomEvent('userLoaded', { detail: currentUser }));
}

async function checkDonutSubscription() {
  if (!currentUser?.id) {
    console.log('⚠️ Нет ID пользователя');
    renderSubscriptions();
    return;
  }
  
  console.log(`🔍 Проверяем подписку для ${currentUser.id}...`);
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/donut/check-donut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
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
    
    await saveUserToDatabase(currentUser, data.has_donut || false, subscriptions);
    await loadSubscriptionsFromDB();
    
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
  if (avatar) {
    if (currentUser?.photo) {
      avatar.innerHTML = '';
      avatar.style.backgroundImage = `url(${currentUser.photo})`;
      avatar.classList.add('has-avatar');
    } else {
      avatar.innerHTML = '👤';
      avatar.classList.remove('has-avatar');
    }
  }
  
  const userEmail = document.getElementById("userEmail");
  if (userEmail) userEmail.style.display = 'none';
  
  const editButton = document.querySelector('[onclick="enableNameEdit()"]');
  if (editButton) editButton.remove();
  
  updateDaysWithUs();
}

async function activatePromoCode() {
  const code = prompt('Введите промокод:');
  if (!code) return;
  
  if (!currentUser?.id) {
    alert('Ошибка: пользователь не найден');
    return;
  }
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/users/activate-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vk_id: currentUser.id, promo_code: code.trim() })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Подписка ${result.type} активирована!`);
      await loadSubscriptionsFromDB();
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
  
  const subscriptionTypes = getAllSubscriptionTypes();
  
  let html = `
    <div class="sub-card">
      <div class="sub-card-left">
        <div class="sub-card-icon">🔓</div>
        <div class="sub-card-info">
          <h4>FREE (базовый)</h4>
          <p>Всегда доступен</p>
        </div>
      </div>
      <div class="sub-card-badge">Активен</div>
    </div>
  `;
  
  for (let sub of subscriptionTypes) {
    const isActive = userSubscriptions[sub.id] || false;
    const expiry = window.subscriptionExpiry?.[sub.id];
    const expiryText = expiry ? `до ${expiry.toLocaleDateString('ru')}` : 'бессрочно';
    
    html += `
      <div class="sub-card">
        <div class="sub-card-left">
          <div class="sub-card-icon">${sub.icon}</div>
          <div class="sub-card-info">
            <h4 style="color: ${isActive ? '#e6c158' : '#fff'};">${sub.name}</h4>
            <p>${sub.desc}</p>
            ${isActive ? `<p class="expiry">Активна ${expiryText}</p>` : ''}
          </div>
        </div>
        ${isActive 
          ? `<div class="sub-card-badge">Активна</div>`
          : `<button class="sub-card-btn" onclick="openDonatSubscription('${sub.id}')">Оформить</button>`
        }
      </div>
    `;
  }
  
  // Кнопка активации промокода
  html += `
    <div class="promo-card">
      <div class="promo-card-content">
        <div>
          <h4>🎁 Есть промокод?</h4>
          <p>Введите код для активации подписки</p>
        </div>
        <button class="sub-card-btn" onclick="activatePromoCode()">Активировать</button>
      </div>
    </div>
  `;
  
  subsList.innerHTML = html;
}

function openDonatSubscription(level) {
  const link = CONFIG.DONUT_LINKS[level];
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
window.loadSubscriptionsFromDB = loadSubscriptionsFromDB;
window.currentUser = currentUser;
