// ===== Шаблоны с распределенными датами =====
const templateItems = [
  { name: "Шаблон всех текстовых документов + основная надпись и титульники", date: "2026-01-08", free: true, format: "DWG/DOC" },
  { name: "Шаблон ОД типовых объектов", date: "2026-01-15", free: false, format: "DWG" },
  { name: "Шаблон пояснения расчетов", date: "2026-01-22", free: false, format: "DOC" },
  { name: "Шаблон кабелей (все вообще) + сечение + гофра + трубы", date: "2026-01-29", free: false, format: "XLSX" },
  { name: "Шаблон ОС", date: "2026-02-05", free: false, format: "DWG" },
  { name: "Шаблон Эл.нагрузок", date: "2026-02-12", free: false, format: "XLSX" },
  { name: "Шаблон аварийного освещения", date: "2026-02-19", free: false, format: "DWG" },
  { name: "Шаблон взрывопожаробезопасности", date: "2026-02-26", free: false, format: "DOC" },
  { name: "Шаблон лотков", date: "2026-03-05", free: false, format: "DWG" },
  { name: "Шаблон ЗУ", date: "2026-03-12", free: false, format: "DWG" },
  { name: "Шаблон защитного уравнивания потенциалов", date: "2026-03-19", free: false, format: "DWG" },
  { name: "Шаблон СДЛ", date: "2026-03-26", free: false, format: "DWG" },
  { name: "Шаблон норм освещенности", date: "2026-04-02", free: false, format: "XLSX" },
  { name: "Шаблон подключения из множества мест", date: "2026-04-09", free: false, format: "DWG" },
  { name: "Шаблон ИБП", date: "2026-04-16", free: false, format: "DWG" },
  { name: "Шаблон предохранители", date: "2026-04-23", free: false, format: "DWG" },
  { name: "Шаблон ТТ", date: "2026-04-30", free: false, format: "DWG" },
  { name: "Шаблоны договоров", date: "2026-05-07", free: false, format: "DOC" },
  { name: "Шаблоны чек-листов", date: "2026-05-14", free: false, format: "XLSX" }
];

// Добавляем active в шаблоны
templateItems.forEach(item => {
  item.active = window.isMaterialActive ? window.isMaterialActive(item.date) : true;
  item.type = 'template';
});

// Состояние
let currentTemplateItem = null;
let cameFromTemplateCalendar = false;

// ===== Функции шаблонов =====
function renderTemplatesList() {
  const listEl = document.getElementById("templatesList");
  if (!listEl) return;
  
  const sorted = [...templateItems].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Шаблоны</h3>';
  
  for (let item of sorted) {
    const dateStr = new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const statusText = item.active ? 'опубликовано:' : 'будет опубликовано:';
    
    html += `
      <div class="material-item ${item.active ? 'active' : 'inactive'}" 
           ${item.active ? `onclick="window.openTemplateItem('${item.name}')"` : ''}>
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

function openTemplateItem(itemName) {
  const item = templateItems.find(i => i.name === itemName);
  if (!item || !item.active) return;
  
  if (!item.free && !window.subscriptions?.template) {
    alert('Этот шаблон требует подписку TEMPLATE. Оформите её в профиле.');
    return;
  }
  
  currentTemplateItem = item;
  renderTemplateItem();
}

function renderTemplateItem() {
  const listEl = document.getElementById("templatesList");
  if (!listEl) return;
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="window.goBackFromTemplate()">← Назад</button>
    <div class="card">
      <h2 style="margin:12px 0 6px; font-size:18px;">${currentTemplateItem.name}</h2>
      <div class="placeholder-image" style="height: 200px;">📄 Шаблон</div>
      <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentTemplateItem.date).toLocaleDateString('ru-RU')}</p>
      <p>Формат: ${currentTemplateItem.format}</p>
      <button class="back-button-large" onclick="window.goBackFromTemplate()">Вернуться к списку</button>
    </div>
  `;
}

function goBackFromTemplate() {
  if (cameFromTemplateCalendar) {
    cameFromTemplateCalendar = false;
    if (window.setViewMode) window.setViewMode('templates', 'calendar');
  } else {
    renderTemplatesList();
  }
}

function openCalendarTemplateItem(itemName) {
  cameFromTemplateCalendar = true;
  window.navigate('templates', document.querySelectorAll('.nav-btn')[3]);
  if (window.setViewMode) window.setViewMode('templates', 'list');
  
  setTimeout(() => {
    const item = templateItems.find(i => i.name === itemName);
    if (item && item.active) {
      if (!item.free && !window.subscriptions?.template) {
        alert('Этот шаблон требует подписку TEMPLATE. Оформите её в профиле.');
        return;
      }
      currentTemplateItem = item;
      renderTemplateItem();
    }
  }, 100);
}

// Экспорт
window.templateItems = templateItems;
window.currentTemplateItem = currentTemplateItem;
window.cameFromTemplateCalendar = cameFromTemplateCalendar;
window.renderTemplatesList = renderTemplatesList;
window.openTemplateItem = openTemplateItem;
window.goBackFromTemplate = goBackFromTemplate;
window.openCalendarTemplateItem = openCalendarTemplateItem;
