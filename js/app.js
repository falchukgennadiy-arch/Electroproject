// ===== Глобальное состояние =====
let subscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

let currentView = 'home';
let viewModes = {
  visual: 'list',
  templates: 'list'
};

// Прогресс тестов (общий для всех файлов)
window.testProgress = window.testProgress || {};

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
    if (window.hideTestControls) window.hideTestControls();
    if (window.clearAutoTransition) window.clearAutoTransition();
  }
}

function setViewMode(section, mode) {
  viewModes[section] = mode;
  if (section === 'visual' && window.renderVisualList) window.renderVisualList();
  if (section === 'templates' && window.renderTemplatesList) window.renderTemplatesList();
}

// ===== Экспорт в глобальную область =====
window.navigate = navigate;
window.setViewMode = setViewMode;
window.subscriptions = subscriptions;
window.viewModes = viewModes;

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.updateProfileDisplay) window.updateProfileDisplay();
  if (window.loadUser) window.loadUser();
});
