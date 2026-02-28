// ===== Профиль =====
let userName = "Алексей Александров";
let userEmail = "alex@example.com";
let registrationDate = new Date('2025-01-15');
let currentUser = null;

function updateProfileDisplay() {
  const displayName = document.getElementById("displayName");
  if (displayName) displayName.innerText = userName;
  
  const avatar = document.getElementById("avatar");
  if (avatar) avatar.innerText = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const daysElement = document.getElementById("daysWithUs");
  if (daysElement) {
    const days = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
    daysElement.innerText = days;
  }
  
  renderSubscriptions();
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
    <div class="sub-card">
      <div class="sub-info">
        <div class="sub-icon free">🔓</div>
        <div class="sub-details">
          <h4>FREE (базовый)</h4>
          <p>Всегда доступен</p>
        </div>
      </div>
      <span class="sub-status active">Активен</span>
    </div>
  `;
  
  for (let sub of subscriptionTypes) {
    const isActive = window.subscriptions?.[sub.key] || false;
    html += `
      <div class="sub-card">
        <div class="sub-info">
          <div class="sub-icon" style="background: var(--${sub.key})">${sub.icon}</div>
          <div class="sub-details">
            <h4>${sub.name}</h4>
            <p>${sub.desc}</p>
          </div>
        </div>
        ${isActive 
          ? `<span class="sub-status active">Активна</span>` 
          : `<button class="sub-button" onclick="window.activateSubscription('${sub.key}')">Подключить</button>`
        }
      </div>
    `;
  }
  
  subsList.innerHTML = html;
}

function activateSubscription(level) {
  if (window.subscriptions) {
    window.subscriptions[level] = true;
    renderSubscriptions();
    alert(`✅ Подписка ${level.toUpperCase()} активирована (демо-режим)`);
  }
}

function enableNameEdit() {
  const profileView = document.getElementById("profileView");
  const profileEdit = document.getElementById("profileEdit");
  const editNameInput = document.getElementById("editNameInput");
  
  if (profileView) profileView.style.display = "none";
  if (profileEdit) profileEdit.style.display = "block";
  if (editNameInput) editNameInput.value = userName;
}

function cancelNameEdit() {
  const profileView = document.getElementById("profileView");
  const profileEdit = document.getElementById("profileEdit");
  
  if (profileView) profileView.style.display = "block";
  if (profileEdit) profileEdit.style.display = "none";
}

function saveName() {
  const editNameInput = document.getElementById("editNameInput");
  if (editNameInput) {
    const newName = editNameInput.value.trim();
    if (newName) {
      userName = newName;
    }
  }
  cancelNameEdit();
  updateProfileDisplay();
}

// ===== Управление пользователем (VK) =====
async function loadUser() {
  const token = localStorage.getItem('userToken');
  if (!token) return;
  
  try {
    const response = await fetch('https://api.omavisual.ru/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    if (data.user) {
      currentUser = data.user;
      updateUserUI(data.user);
    }
  } catch (error) {
    console.error('Failed to load user:', error);
  }
}

function updateUserUI(user) {
  const vkSection = document.getElementById('vkAuthSection');
  const userSection = document.getElementById('userInfoSection');
  
  if (vkSection) vkSection.style.display = 'none';
  if (userSection) {
    userSection.style.display = 'block';
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    
    if (userAvatar) userAvatar.src = user.avatar || 'images/default-avatar.png';
    if (userName) userName.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email || 'Email не указан';
    
    // Отображаем подписки
    const subsContainer = document.getElementById('userSubscriptions');
    if (subsContainer) {
      subsContainer.innerHTML = '';
      
      const subTypes = {
        course: { name: 'COURSE', color: 'var(--course)' },
        visual: { name: 'VISUAL', color: 'var(--visual)' },
        template: { name: 'TEMPLATE', color: 'var(--template)' },
        test: { name: 'TEST', color: 'var(--test)' }
      };
      
      if (user.subscriptions) {
        user.subscriptions.forEach(type => {
          const sub = subTypes[type];
          if (sub) {
            const badge = document.createElement('span');
            badge.className = 'item-badge';
            badge.style.background = sub.color;
            badge.textContent = sub.name;
            subsContainer.appendChild(badge);
          }
        });
      }
    }
  }
}

function logout() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  currentUser = null;
  
  const vkSection = document.getElementById('vkAuthSection');
  const userSection = document.getElementById('userInfoSection');
  
  if (vkSection) vkSection.style.display = 'block';
  if (userSection) userSection.style.display = 'none';
  
  // Сбрасываем иконку профиля
  const profileIcon = document.getElementById('headerProfileIcon');
  if (profileIcon) profileIcon.innerHTML = '👤';
}

// Экспорт
window.userName = userName;
window.userEmail = userEmail;
window.registrationDate = registrationDate;
window.currentUser = currentUser;
window.updateProfileDisplay = updateProfileDisplay;
window.activateSubscription = activateSubscription;
window.enableNameEdit = enableNameEdit;
window.cancelNameEdit = cancelNameEdit;
window.saveName = saveName;
window.loadUser = loadUser;
window.logout = logout;
window.updateUserUI = updateUserUI;
