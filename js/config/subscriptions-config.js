// ===== КОНФИГУРАЦИЯ ТИПОВ ПОДПИСОК =====
// Единое место для цветов, иконок и названий

const SUBSCRIPTION_TYPES = {
  course: {
    id: 'course',
    name: 'COURSE',
    icon: '📚',
    iconUrl: '/images/icons/course.png',  // PNG иконка (заменишь позже)
    color: '#4a90e2',
    bgLight: 'rgba(74, 144, 226, 0.1)',
    desc: 'Доступ к курсам'
  },
  visual: {
    id: 'visual',
    name: 'VISUAL',
    icon: '🎨',
    iconUrl: '/images/icons/visual.png',
    color: '#e6c158',
    bgLight: 'rgba(230, 193, 88, 0.1)',
    desc: 'Блоки визуализации'
  },
  template: {
    id: 'template',
    name: 'TEMPLATE',
    icon: '📁',
    iconUrl: '/images/icons/template.png',
    color: '#9b59b6',
    bgLight: 'rgba(155, 89, 182, 0.1)',
    desc: 'Шаблоны и блоки'
  },
  test: {
    id: 'test',
    name: 'TEST',
    icon: '📝',
    iconUrl: '/images/icons/test.png',
    color: '#e67e22',
    bgLight: 'rgba(230, 126, 34, 0.1)',
    desc: 'Тесты и проверка знаний'
  }
};

// Получить конфиг по типу
function getSubscriptionConfig(type) {
  return SUBSCRIPTION_TYPES[type] || {
    id: type,
    name: type.toUpperCase(),
    icon: '📦',
    iconUrl: '',
    color: '#666',
    bgLight: 'rgba(102, 102, 102, 0.1)',
    desc: ''
  };
}

// Получить все типы подписок
function getAllSubscriptionTypes() {
  return Object.values(SUBSCRIPTION_TYPES);
}

window.SUBSCRIPTION_TYPES = SUBSCRIPTION_TYPES;
window.getSubscriptionConfig = getSubscriptionConfig;
window.getAllSubscriptionTypes = getAllSubscriptionTypes;
