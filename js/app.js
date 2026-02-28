// ===== Глобальное состояние =====
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

// Таймер (общий для тестов)
let startTime = null;
let timerInterval = null;
let autoTransitionTimer = null;

// ===== Общие функции навигации =====
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

function setViewMode(section, mode) {
  viewModes[section] = mode;
  if (section === 'visual' && window.renderVisualList) window.renderVisualList();
  if (section === 'templates' && window.renderTemplatesList) window.renderTemplatesList();
}

// ===== Общие функции для тестов =====
function hideTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.style.display = "none";
  const testArea = document.getElementById("testArea");
  if (testArea) testArea.style.paddingBottom = "0";
}

function showTestControls() {
  const controls = document.getElementById("testControls");
  if (controls) controls.style.display = "block";
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.style.display = "none";
}

function clearAutoTransition() {
  if (autoTransitionTimer) {
    clearTimeout(autoTransitionTimer);
    autoTransitionTimer = null;
  }
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

// ===== Сохранение прогресса =====
function saveProgress() {
  try {
    localStorage.setItem('testProgress', JSON.stringify(testProgress));
  } catch (e) {
    console.error('Ошибка сохранения прогресса:', e);
  }
}

// Загружаем прогресс при старте
try {
  const saved = localStorage.getItem('testProgress');
  if (saved) {
    testProgress = JSON.parse(saved);
  }
} catch (e) {
  console.error('Ошибка загрузки прогресса:', e);
}

// ===== Экспорт в глобальную область =====
window.navigate = navigate;
window.setViewMode = setViewMode;
window.hideTestControls = hideTestControls;
window.showTestControls = showTestControls;
window.clearAutoTransition = clearAutoTransition;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.getElapsedSeconds = getElapsedSeconds;
window.saveProgress = saveProgress;
window.testProgress = testProgress;
window.subscriptions = subscriptions;
window.viewModes = viewModes;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  if (window.updateProfileDisplay) window.updateProfileDisplay();
  if (window.loadUser) window.loadUser();
});
