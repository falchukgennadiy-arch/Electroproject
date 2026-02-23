// ===== Основные переменные =====
let subscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

let currentView = 'home';
let testProgress = {};
let viewModes = {
  visual: 'list',
  templates: 'list'
};

// Профиль
let userName = "Алексей Александров";
let userEmail = "alex@example.com";
let registrationDate = new Date('2025-01-15');

// Календарь
let calendarCurrentDate = new Date();
let calendarSelectedDate = new Date();
let calendarSection = 'visual';

// Таймер
let startTime = null;
let timerInterval = null;
let autoTransitionTimer = null;

// ===== Загрузка прогресса из localStorage =====
function loadProgress() {
  try {
    const saved = localStorage.getItem('testProgress');
    if (saved) {
      testProgress = JSON.parse(saved);
      console.log('Прогресс загружен:', testProgress);
    }
  } catch (e) {
    console.error('Ошибка загрузки прогресса:', e);
  }
}

// ===== Сохранение прогресса в localStorage =====
function saveProgress() {
  try {
    localStorage.setItem('testProgress', JSON.stringify(testProgress));
  } catch (e) {
    console.error('Ошибка сохранения прогресса:', e);
  }
}

// Загружаем прогресс при старте
loadProgress();

// ===== Навигация =====
function navigate(section, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(section).classList.add('active');
  if (btn) btn.classList.add('active');
  currentView = section;
  
  if (section === 'courses') {
    renderCoursesList();
  } else if (section === 'visual') {
    setViewMode('visual', viewModes.visual);
  } else if (section === 'templates') {
    setViewMode('templates', viewModes.templates);
  } else if (section === 'tests') {
    renderTestsList();
  } else if (section === 'profile') {
    updateProfileDisplay();
  }
  
  if (section !== 'tests') {
    hideTestControls();
    clearAutoTransition();
  }
}

// ===== Управление тестами (общее) =====
function showTestControls() {
  document.getElementById("testControls").style.display = "block";
  document.getElementById("nextBtn").style.display = "none";
}

function hideTestControls() {
  document.getElementById("testControls").style.display = "none";
  document.getElementById("testArea").style.paddingBottom = "0";
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    const el = document.getElementById("timer");
    if (el) el.textContent = "⏱ " + formatSeconds(getElapsedSeconds());
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function getElapsedSeconds() {
  if (!startTime) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
}

function clearAutoTransition() {
  if (autoTransitionTimer) {
    clearTimeout(autoTransitionTimer);
    autoTransitionTimer = null;
  }
}

// ===== Профиль =====
function updateProfileDisplay() {
  document.getElementById("displayName").innerText = userName;
  document.getElementById("avatar").innerText = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const days = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
  document.getElementById("daysWithUs").innerText = days;
  
  renderSubscriptions();
}

function renderSubscriptions() {
  const subsList = document.getElementById("subscriptionsList");
  
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
    const isActive = subscriptions[sub.key];
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
          : `<button class="sub-button" onclick="activateSubscription('${sub.key}')">Подключить</button>`
        }
      </div>
    `;
  }
  
  subsList.innerHTML = html;
}

function activateSubscription(level) {
  subscriptions[level] = true;
  renderSubscriptions();
  alert(`✅ Подписка ${level.toUpperCase()} активирована (демо-режим)`);
}

function enableNameEdit() {
  document.getElementById("profileView").style.display = "none";
  document.getElementById("profileEdit").style.display = "block";
  document.getElementById("editNameInput").value = userName;
}

function cancelNameEdit() {
  document.getElementById("profileView").style.display = "block";
  document.getElementById("profileEdit").style.display = "none";
}

function saveName() {
  const newName = document.getElementById("editNameInput").value.trim();
  if (newName) {
    userName = newName;
  }
  cancelNameEdit();
  updateProfileDisplay();
}

// ===== Временные заглушки для других разделов =====
function renderCoursesList() {
  const listEl = document.getElementById("coursesList");
  listEl.innerHTML = '<div class="card">Раздел курсов в разработке</div>';
}

function renderVisualList() {
  const listEl = document.getElementById("visualList");
  listEl.innerHTML = '<div class="card">Раздел визуализации в разработке</div>';
}

function renderTemplatesList() {
  const listEl = document.getElementById("templatesList");
  listEl.innerHTML = '<div class="card">Раздел шаблонов в разработке</div>';
}

function setViewMode(section, mode) {
  console.log('setViewMode', section, mode);
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
  updateProfileDisplay();
  navigate('home', document.querySelectorAll('.nav-btn')[0]);
});

// Экспорт в глобальную область
window.navigate = navigate;
window.enableNameEdit = enableNameEdit;
window.cancelNameEdit = cancelNameEdit;
window.saveName = saveName;
window.activateSubscription = activateSubscription;
window.setViewMode = setViewMode;
