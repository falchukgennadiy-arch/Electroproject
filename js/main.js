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
    if (window.renderCoursesList) window.renderCoursesList();
  } else if (section === 'visual') {
    if (window.setViewMode) window.setViewMode('visual', viewModes.visual);
  } else if (section === 'templates') {
    if (window.setViewMode) window.setViewMode('templates', viewModes.templates);
  } else if (section === 'tests') {
    if (window.renderTestsList) window.renderTestsList();
  } else if (section === 'profile') {
    if (window.updateProfileDisplay) window.updateProfileDisplay();
  }
  
  if (section !== 'tests') {
    hideTestControls();
    clearAutoTransition();
  }
}

// ===== Управление тестами (общее) =====
function showTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.style.display = "block";
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.style.display = "none";
}

function hideTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.style.display = "none";
  const testArea = document.getElementById("testArea");
  if (testArea) testArea.style.paddingBottom = "0";
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    const el = document.getElementById("timer");
    if (el) el.textContent = "⏱ " + window.formatSeconds(getElapsedSeconds());
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

// ===== Профиль (перемещено из main.js) =====
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
          : `<button class="sub-button" onclick="window.activateSubscription('${sub.key}')">Подключить</button>`
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

// ===== Заглушки для других разделов =====
function renderCoursesList() {
  const listEl = document.getElementById("coursesList");
  if (listEl) listEl.innerHTML = '<div class="card">Раздел курсов в разработке</div>';
}

function renderVisualList() {
  const listEl = document.getElementById("visualList");
  if (listEl) listEl.innerHTML = '<div class="card">Раздел визуализации в разработке</div>';
}

function renderTemplatesList() {
  const listEl = document.getElementById("templatesList");
  if (listEl) listEl.innerHTML = '<div class="card">Раздел шаблонов в разработке</div>';
}

function setViewMode(section, mode) {
  viewModes[section] = mode;
  if (section === 'visual' && window.renderVisualList) window.renderVisualList();
  if (section === 'templates' && window.renderTemplatesList) window.renderTemplatesList();
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
  updateProfileDisplay();
  navigate('home', document.querySelectorAll('.nav-btn')[0]);
});

// ===== Экспорт в глобальную область =====
window.subscriptions = subscriptions;
window.testProgress = testProgress;
window.viewModes = viewModes;
window.userName = userName;
window.userEmail = userEmail;
window.registrationDate = registrationDate;
window.calendarCurrentDate = calendarCurrentDate;
window.calendarSelectedDate = calendarSelectedDate;
window.calendarSection = calendarSection;
window.startTime = startTime;
window.timerInterval = timerInterval;
window.autoTransitionTimer = autoTransitionTimer;

window.loadProgress = loadProgress;
window.saveProgress = saveProgress;
window.navigate = navigate;
window.showTestControls = showTestControls;
window.hideTestControls = hideTestControls;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.getElapsedSeconds = getElapsedSeconds;
window.clearAutoTransition = clearAutoTransition;
window.updateProfileDisplay = updateProfileDisplay;
window.activateSubscription = activateSubscription;
window.enableNameEdit = enableNameEdit;
window.cancelNameEdit = cancelNameEdit;
window.saveName = saveName;
window.renderCoursesList = renderCoursesList;
window.renderVisualList = renderVisualList;
window.renderTemplatesList = renderTemplatesList;
window.setViewMode = setViewMode;
