// ===== Блоки визуализации с распределенными датами =====
const visualItems = [
  { name: "Автомат ABB S200", date: "2026-01-07", free: true },
  { name: "Автомат Schneider Electric", date: "2026-01-14", free: false },
  { name: "Автомат IEK", date: "2026-01-21", free: false },
  { name: "УЗО ABB", date: "2026-01-28", free: true },
  { name: "Дифавтомат Schneider", date: "2026-02-04", free: false },
  { name: "УЗО IEK", date: "2026-02-11", free: false },
  { name: "Щит распределительный навесной", date: "2026-02-18", free: false },
  { name: "Щит встраиваемый", date: "2026-02-25", free: false },
  { name: "Контактор ABB", date: "2026-03-04", free: false },
  { name: "Реле напряжения", date: "2026-03-11", free: true },
  { name: "Счетчик электроэнергии", date: "2026-03-18", free: false },
  { name: "Трансформатор тока", date: "2026-03-25", free: false },
  { name: "Клеммные колодки", date: "2026-04-01", free: true },
  { name: "DIN-рейка", date: "2026-04-08", free: true }
];

// Добавляем active в визуализацию
visualItems.forEach(item => {
  item.active = window.isMaterialActive ? window.isMaterialActive(item.date) : true;
  item.type = 'visual';
});

// Состояние
let currentVisualItem = null;
let cameFromVisualCalendar = false;

// ===== Функции визуализации =====
function renderVisualList() {
  const listEl = document.getElementById("visualList");
  if (!listEl) return;
  
  const sorted = [...visualItems].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Блоки визуализации</h3>';
  
  for (let item of sorted) {
    const dateStr = new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const statusText = item.active ? 'опубликовано:' : 'будет опубликовано:';
    
    html += `
      <div class="material-item ${item.active ? 'active' : 'inactive'}" 
           ${item.active ? `onclick="window.openVisualItem('${item.name}')"` : ''}>
        <div class="material-title">
          ${item.name}
          ${item.free ? '<span class="badge-free" style="margin-left:8px;">FREE</span>' : ''}
        </div>
        <div class="material-date-row">
          <span class="material-date">📅 ${statusText} ${dateStr}</span>
          <span class="material-badge ${item.active ? '' : 'future'}">${item.active ? 'Доступно' : 'Скоро'}</span>
        </div>
      </div>
    `;
  }
  
  listEl.innerHTML = html;
}

function openVisualItem(itemName) {
  const item = visualItems.find(i => i.name === itemName);
  if (!item || !item.active) return;
  
  if (!item.free && !window.subscriptions?.visual) {
    alert('Этот материал требует подписку VISUAL. Оформите её в профиле.');
    return;
  }
  
  currentVisualItem = item;
  renderVisualItem();
}

function renderVisualItem() {
  const listEl = document.getElementById("visualList");
  if (!listEl) return;
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="window.goBackFromVisual()">← Назад</button>
    <div class="card">
      <h2 style="margin:12px 0 6px; font-size:18px;">${currentVisualItem.name}</h2>
      <div class="placeholder-image" style="height: 300px;">🎨 3D-блок</div>
      <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentVisualItem.date).toLocaleDateString('ru-RU')}</p>
      <p>Файл: ${currentVisualItem.file}</p>
      <button class="back-button-large" onclick="window.goBackFromVisual()">Вернуться к списку</button>
    </div>
  `;
}

function goBackFromVisual() {
  if (cameFromVisualCalendar) {
    cameFromVisualCalendar = false;
    if (window.setViewMode) window.setViewMode('visual', 'calendar');
  } else {
    renderVisualList();
  }
}

function openCalendarVisualItem(itemName) {
  cameFromVisualCalendar = true;
  window.navigate('visual', document.querySelectorAll('.nav-btn')[2]);
  if (window.setViewMode) window.setViewMode('visual', 'list');
  
  setTimeout(() => {
    const item = visualItems.find(i => i.name === itemName);
    if (item && item.active) {
      if (!item.free && !window.subscriptions?.visual) {
        alert('Этот материал требует подписку VISUAL. Оформите её в профиле.');
        return;
      }
      currentVisualItem = item;
      renderVisualItem();
    }
  }, 100);
}

// Экспорт
window.visualItems = visualItems;
window.currentVisualItem = currentVisualItem;
window.cameFromVisualCalendar = cameFromVisualCalendar;
window.renderVisualList = renderVisualList;
window.openVisualItem = openVisualItem;
window.goBackFromVisual = goBackFromVisual;
window.openCalendarVisualItem = openCalendarVisualItem;
