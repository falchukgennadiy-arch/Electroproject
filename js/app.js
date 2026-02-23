// ===== State =====
let subscriptions = {
  course: false,
  visual: false,
  template: false,
  test: false
};

let currentView = 'home';

// Прогресс тестов
let testProgress = {};

// Режимы отображения
let viewModes = {
  visual: 'list',
  templates: 'list'
};

// Календарь
let calendarCurrentDate = new Date();
let calendarSelectedDate = new Date();
let calendarSection = 'visual';

// Курсы
let currentCourse = null;
let currentLesson = null;
let courseInnerView = 'list';
let cameFromCourseCalendar = false;

// Visual
let currentVisualItem = null;
let cameFromVisualCalendar = false;

// Шаблоны
let currentTemplateItem = null;
let cameFromTemplateCalendar = false;

// Профиль
let userName = "Алексей Александров";
let userEmail = "alex@example.com";
let registrationDate = new Date('2025-01-15');

const letters = ["A","B","C","D"];

// Сегодняшняя дата для определения активных материалов
const today = new Date();
today.setHours(0, 0, 0, 0);

// Функция для определения активности материала по дате
function isMaterialActive(dateStr) {
  const materialDate = new Date(dateStr);
  materialDate.setHours(0, 0, 0, 0);
  return materialDate <= today;
}

// ===== Курсы с распределенными датами =====
const courses = {
  "special": {
    title: "Проектирование до 125А (Special edition)",
    description: "Полный курс для донат-подписчиков. Новые уроки каждую неделю.",
    type: "course",
    modules: [
      {
        name: "Модуль №1 «Концепция электроустановок до 125А»",
        items: [
          { name: "Урок 1.0. Вводный урок", date: "2026-01-05", free: false },
          { name: "Урок 1.1. Электроэнергия и электроснабжение", date: "2026-01-12", free: false },
          { name: "Урок 1.2. Щитовое электрооборудование", date: "2026-01-19", free: false },
          { name: "Урок 1.3. Розетки и выключатели", date: "2026-01-26", free: false },
          { name: "Урок 1.4. Электроприемники", date: "2026-02-02", free: false },
          { name: "Урок 1.5. Управление светом", date: "2026-02-09", free: false },
          { name: "Урок 1.6. Кабели и провода", date: "2026-02-16", free: false },
          { name: "Урок 1.7. Автоматические выключатели", date: "2026-02-23", free: false },
          { name: "Урок 1.8. УЗО и диффавтоматы", date: "2026-03-02", free: false },
          { name: "Урок 1.9. Системы заземления", date: "2026-03-09", free: false }
        ]
      },
      {
        name: "Модуль №2 «Проектирование»",
        items: [
          { name: "Урок 2.0. Вводный урок по проектированию", date: "2026-03-16", free: false },
          { name: "Урок 2.1. Сбор исходных данных", date: "2026-03-23", free: false },
          { name: "Урок 2.2. Подготовка плана", date: "2026-03-30", free: false },
          { name: "Урок 2.3. Расчет нагрузок", date: "2026-04-06", free: false },
          { name: "Урок 2.4. Выбор оборудования", date: "2026-04-13", free: false },
          { name: "Урок 2.5. Составление спецификации", date: "2026-04-20", free: false }
        ]
      }
    ]
  },
  "express": {
    title: "Экспресс-курс (Премиум DZEN)",
    description: "Быстрый старт в профессии. 21 урок для премиум-подписчиков.",
    type: "course",
    modules: [
      {
        name: "Основы",
        items: [
          { name: "Урок 1. Состав курса", date: "2026-01-06", free: false },
          { name: "Урок 2. Истоки электричества", date: "2026-01-13", free: false },
          { name: "Урок 3. Общие представления", date: "2026-01-20", free: false },
          { name: "Урок 4. Распределительные щиты", date: "2026-01-27", free: false },
          { name: "Урок 5. Кабели и провода", date: "2026-02-03", free: false },
          { name: "Урок 6. Электроприемники", date: "2026-02-10", free: false },
          { name: "Урок 7. Заземление", date: "2026-02-17", free: false },
          { name: "Урок 8. Выбор аппаратов", date: "2026-02-24", free: false },
          { name: "Урок 9. Схемы электроснабжения", date: "2026-03-03", free: false },
          { name: "Урок 10. Освещение", date: "2026-03-10", free: false }
        ]
      }
    ]
  },
  "base": {
    title: "Базовые знания (Открытый доступ)",
    description: "Вводные уроки для всех желающих.",
    type: "free",
    modules: [
      {
        name: "Старт",
        items: [
          { name: "Введение в профессию", date: "2026-01-04", free: true },
          { name: "Инструменты проектировщика", date: "2026-01-11", free: true },
          { name: "Основные термины", date: "2026-01-18", free: true },
          { name: "Типы электрических сетей", date: "2026-01-25", free: true },
          { name: "Условные обозначения", date: "2026-02-01", free: true }
        ]
      }
    ]
  }
};

// Добавляем active в курсы на основе даты
for (let courseId in courses) {
  for (let module of courses[courseId].modules) {
    for (let item of module.items) {
      item.active = isMaterialActive(item.date);
    }
  }
}

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
  item.active = isMaterialActive(item.date);
  item.type = 'visual';
});

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
  item.active = isMaterialActive(item.date);
  item.type = 'template';
});

// ===== Функции календаря =====
function getAllEventsForSection(section) {
  let events = [];
  
  // Курсы
  for (let courseId in courses) {
    const course = courses[courseId];
    for (let module of course.modules) {
      for (let item of module.items) {
        events.push({
          ...item,
          type: 'course',
          source: 'courses',
          courseId: courseId,
          moduleName: module.name,
          courseTitle: course.title,
          courseType: course.type,
          displaySection: 'courses'
        });
      }
    }
  }
  
  // Визуализация
  visualItems.forEach(item => {
    events.push({
      ...item,
      type: 'visual',
      source: 'visual',
      displaySection: 'visual'
    });
  });
  
  // Шаблоны
  templateItems.forEach(item => {
    events.push({
      ...item,
      type: 'template',
      source: 'templates',
      displaySection: 'templates'
    });
  });
  
  return events;
}

function getColorForEvent(event) {
  if (!event.active) {
    if (event.free) return 'var(--good-future)';
    if (event.type === 'course') return 'var(--course-future)';
    if (event.type === 'visual') return 'var(--visual-future)';
    if (event.type === 'template') return 'var(--template-future)';
  } else {
    if (event.free) return 'var(--good)';
    if (event.type === 'course') return 'var(--course)';
    if (event.type === 'visual') return 'var(--visual)';
    if (event.type === 'template') return 'var(--template)';
  }
  return 'var(--future)';
}

function renderCalendar(section) {
  calendarSection = section;
  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Определяем первый день недели (понедельник = 0)
  let startDay = firstDay.getDay();
  if (startDay === 0) startDay = 7;
  startDay = startDay - 1;
  
  const daysInMonth = lastDay.getDate();
  
  // Массив для дней (с пустыми ячейками в начале)
  const days = [];
  
  // Добавляем пустые ячейки для дней до начала месяца
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Добавляем дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(Date.UTC(year, month, i)));
  }
  
  // Получаем ВСЕ события
  const allEvents = getAllEventsForSection(section);
  
  // Группируем события по датам
  const eventsByDate = {};
  allEvents.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });
  
  // Формируем HTML календаря
  let html = `
    <div class="card" style="padding:16px;">
      <div class="calendar-header">
        <button class="calendar-nav-btn" onclick="changeMonth(-1)">←</button>
        <div class="calendar-title">${firstDay.toLocaleString('ru', { month: 'long', year: 'numeric' })}</div>
        <button class="calendar-nav-btn" onclick="changeMonth(1)">→</button>
      </div>
      <div class="calendar-weekdays">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
      </div>
      <div class="calendar-grid">
  `;
  
  days.forEach(day => {
    if (!day) {
      html += '<div class="calendar-cell empty"></div>';
      return;
    }
    
    const year = day.getUTCFullYear();
    const month = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;
    
    const dayEvents = eventsByDate[dateStr] || [];
    const hasEvents = dayEvents.length > 0;
    
    const isSelected = calendarSelectedDate && 
                      calendarSelectedDate.getUTCFullYear() === day.getUTCFullYear() && 
                      calendarSelectedDate.getUTCMonth() === day.getUTCMonth() && 
                      calendarSelectedDate.getUTCDate() === day.getUTCDate();
    
    let cellClass = 'calendar-cell';
    let borderColor = 'var(--empty-border)';
    
    if (hasEvents) {
      cellClass += ' has-events';
      if (dayEvents.length === 1) {
        borderColor = getColorForEvent(dayEvents[0]);
      } else {
        borderColor = 'var(--accent)';
      }
    } else {
      cellClass += ' regular';
    }
    
    if (isSelected) {
      cellClass += ' selected';
    }
    
    let dots = '';
    if (hasEvents) {
      dots = '<div class="event-dots">';
      dayEvents.slice(0, 5).forEach(event => {
        dots += `<div class="event-dot" style="background: ${getColorForEvent(event)};"></div>`;
      });
      dots += '</div>';
    }
    
    html += `
      <div class="${cellClass}" 
           style="border-color: ${borderColor};"
           onclick="selectCalendarDay('${dateStr}')">
        <span class="day-number">${day.getUTCDate()}</span>
        ${dots}
      </div>
    `;
  });
  
  html += '</div></div>';
  
  const calendarId = section + 'Calendar';
  const calendarEl = document.getElementById(calendarId);
  if (calendarEl) {
    calendarEl.innerHTML = html;
  }
  
  renderSelectedDayMaterials(section, eventsByDate);
}

function renderSelectedDayMaterials(section, eventsByDate) {
  if (!calendarSelectedDate) return;
  
  const year = calendarSelectedDate.getUTCFullYear();
  const month = String(calendarSelectedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(calendarSelectedDate.getUTCDate()).padStart(2, '0');
  const selectedDateStr = `${year}-${month}-${day}`;
  
  const selectedEvents = eventsByDate[selectedDateStr] || [];
  
  let materialsContainer = document.getElementById(section + 'DayMaterials');
  if (!materialsContainer) {
    materialsContainer = document.createElement('div');
    materialsContainer.id = section + 'DayMaterials';
    materialsContainer.className = 'day-materials';
    
    const calendarEl = document.getElementById(section + 'Calendar');
    if (calendarEl) {
      calendarEl.insertAdjacentElement('afterend', materialsContainer);
    }
  }
  
  let html = `<div class="day-materials-title">📅 ${calendarSelectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
  
  if (selectedEvents.length > 0) {
    selectedEvents.forEach(event => {
      const isActive = event.active;
      const futureClass = isActive ? '' : 'future';
      const badgeText = event.free ? 'FREE' : 
                       (event.type === 'course' ? 'COURSE' : 
                        (event.type === 'visual' ? 'VISUAL' : 'TEMPLATE'));
      const borderColor = getColorForEvent(event);
      
      // Определяем функцию открытия ТОЛЬКО для активных материалов
      let openFunc = '';
      if (isActive) {
        if (event.type === 'course') {
          openFunc = `openCalendarCourseItem('${event.courseId}', '${event.name}')`;
        } else if (event.type === 'visual') {
          openFunc = `openCalendarVisualItem('${event.name}')`;
        } else if (event.type === 'template') {
          openFunc = `openCalendarTemplateItem('${event.name}')`;
        }
      }
      
      html += `
        <div class="material-item calendar-item ${futureClass}" 
             style="border-left:4px solid ${borderColor}; margin-bottom:10px; ${isActive ? 'cursor:pointer;' : 'cursor:default; opacity:0.7;'}"
             ${isActive ? `onclick="${openFunc}"` : ''}>
          <div class="material-title">
            ${event.name}
            <span style="display:inline-block; padding:2px 10px; border-radius:20px; background:${borderColor}; color:${event.free && event.active ? '#000' : '#fff'}; font-size:10px; font-weight:600;">${badgeText}</span>
          </div>
          <div class="material-date-row">
            <span class="material-date">📅 ${new Date(event.date).toLocaleDateString('ru')}</span>
            <span class="material-badge ${isActive ? '' : 'future'}" style="background:${isActive ? 'var(--accent)' : 'var(--future)'};">${isActive ? 'Доступно' : 'Скоро'}</span>
          </div>
        </div>
      `;
    });
  } else {
    html += `
      <div class="card" style="padding:20px; text-align:center;">
        <div class="subtle">Нет материалов в этот день</div>
      </div>
    `;
  }
  
  materialsContainer.innerHTML = html;
}

function changeMonth(delta) {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
  renderCalendar(calendarSection);
}

function selectCalendarDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  calendarSelectedDate = new Date(Date.UTC(year, month - 1, day));
  renderCalendar(calendarSection);
}

function openCalendarCourseItem(courseId, lessonName) {
  cameFromCourseCalendar = true;
  navigate('courses', document.querySelectorAll('.nav-btn')[1]);
  
  setTimeout(() => {
    currentCourse = courseId;
    renderCourseContent();
    
    setTimeout(() => {
      const course = courses[courseId];
      for (let module of course.modules) {
        for (let item of module.items) {
          if (item.name === lessonName && item.active) {
            if (!item.free && !subscriptions.course && course.type !== 'free') {
              alert('Этот урок требует подписку COURSE. Оформите её в профиле.');
              return;
            }
            currentLesson = item;
            renderLesson();
            return;
          }
        }
      }
    }, 100);
  }, 100);
}

function openCalendarVisualItem(itemName) {
  cameFromVisualCalendar = true;
  navigate('visual', document.querySelectorAll('.nav-btn')[2]);
  setViewMode('visual', 'list');
  
  setTimeout(() => {
    const item = visualItems.find(i => i.name === itemName);
    if (item && item.active) {
      if (!item.free && !subscriptions.visual) {
        alert('Этот материал требует подписку VISUAL. Оформите её в профиле.');
        return;
      }
      currentVisualItem = item;
      renderVisualItem();
    }
  }, 100);
}

function openCalendarTemplateItem(itemName) {
  cameFromTemplateCalendar = true;
  navigate('templates', document.querySelectorAll('.nav-btn')[3]);
  setViewMode('templates', 'list');
  
  setTimeout(() => {
    const item = templateItems.find(i => i.name === itemName);
    if (item && item.active) {
      if (!item.free && !subscriptions.template) {
        alert('Этот шаблон требует подписку TEMPLATE. Оформите её в профиле.');
        return;
      }
      currentTemplateItem = item;
      renderTemplateItem();
    }
  }, 100);
}

// ===== Функции переключения вида =====
function setViewMode(section, mode) {
  viewModes[section] = mode;
  
  const toggleBtns = document.querySelectorAll(`#${section}ViewToggle .view-toggle-btn`);
  toggleBtns.forEach(btn => btn.classList.remove('active'));
  if (mode === 'list') {
    toggleBtns[0].classList.add('active');
  } else {
    toggleBtns[1].classList.add('active');
  }
  
  const listEl = document.getElementById(section + 'List');
  const calendarEl = document.getElementById(section + 'Calendar');
  
  if (mode === 'list') {
    if (listEl) listEl.style.display = 'block';
    if (calendarEl) calendarEl.style.display = 'none';
    const materialsEl = document.getElementById(section + 'DayMaterials');
    if (materialsEl) materialsEl.remove();
    
    if (section === 'visual') {
      renderVisualList();
    } else if (section === 'templates') {
      renderTemplatesList();
    }
  } else {
    if (listEl) listEl.style.display = 'none';
    if (calendarEl) calendarEl.style.display = 'block';
    
    const now = new Date();
    calendarSelectedDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    calendarCurrentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    renderCalendar(section);
  }
}

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

// ===== Курсы =====
function renderCoursesList() {
  const listEl = document.getElementById("coursesList");
  const contentEl = document.getElementById("courseContent");
  contentEl.innerHTML = "";
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Курсы</h3>';
  
  for (let [id, course] of Object.entries(courses)) {
    const badgeClass = course.type === 'free' ? 'badge-free' : 'badge-course';
    const badgeText = course.type === 'free' ? 'FREE' : 'COURSE';
    
    html += `
      <div class="course-card" onclick="openCourse('${id}')">
        <h3>${course.title}</h3>
        <div class="subtle">${course.description}</div>
        <div class="course-meta">
          <span>📚 ${course.modules.reduce((acc, m) => acc + m.items.length, 0)} уроков</span>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
      </div>
    `;
  }
  
  listEl.innerHTML = html;
}

function openCourse(courseId) {
  cameFromCourseCalendar = false;
  currentCourse = courseId;
  renderCourseContent();
}

function renderCourseContent() {
  const course = courses[currentCourse];
  const listEl = document.getElementById("coursesList");
  const contentEl = document.getElementById("courseContent");
  
  contentEl.innerHTML = "";
  
  // В календаре не показываем название и описание курса
  let calendarHtml = '';
  if (courseInnerView === 'calendar') {
    calendarHtml = `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn" onclick="setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn active" onclick="setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <div id="courseInnerCalendar"></div>
      <div id="courseInnerList" style="display:none;"></div>
    `;
  } else {
    calendarHtml = `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn active" onclick="setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn" onclick="setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <h2 style="font-size:18px; margin:12px 0 4px;">${course.title}</h2>
      <div class="subtle" style="margin-bottom:12px;">${course.description}</div>
      <div id="courseInnerList"></div>
      <div id="courseInnerCalendar" style="display:none;"></div>
    `;
  }
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="goBackFromCourse()">← Назад</button>
    ${calendarHtml}
  `;
  
  if (courseInnerView === 'list') {
    renderCourseLessonsList();
  } else {
    renderCourseLessonsCalendar();
  }
}

function goBackFromCourse() {
  if (cameFromCourseCalendar) {
    cameFromCourseCalendar = false;
    courseInnerView = 'calendar';
    renderCourseContent();
  } else {
    renderCoursesList();
  }
}

function setCourseInnerView(mode) {
  courseInnerView = mode;
  
  const toggleBtns = document.querySelectorAll('#courseInnerViewToggle .view-toggle-btn');
  if (toggleBtns.length) {
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    if (mode === 'list') {
      toggleBtns[0].classList.add('active');
    } else {
      toggleBtns[1].classList.add('active');
    }
  }
  
  if (mode === 'list') {
    const course = courses[currentCourse];
    const listEl = document.getElementById("coursesList");
    
    const backButtonHtml = listEl.innerHTML.split('<div id="courseInnerList">')[0];
    const newHtml = backButtonHtml.split('</button>')[0] + '</button>' + `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn active" onclick="setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn" onclick="setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <h2 style="font-size:18px; margin:12px 0 4px;">${course.title}</h2>
      <div class="subtle" style="margin-bottom:12px;">${course.description}</div>
      <div id="courseInnerList"></div>
      <div id="courseInnerCalendar" style="display:none;"></div>
    `;
    
    listEl.innerHTML = newHtml;
    
    renderCourseLessonsList();
  } else {
    const listEl = document.getElementById("coursesList");
    const backButtonHtml = listEl.innerHTML.split('<div style="margin-top:12px;">')[0];
    const newHtml = backButtonHtml + `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn" onclick="setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn active" onclick="setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <div id="courseInnerCalendar"></div>
      <div id="courseInnerList" style="display:none;"></div>
    `;
    
    listEl.innerHTML = newHtml;
    
    renderCourseLessonsCalendar();
  }
}

function renderCourseLessonsList() {
  const course = courses[currentCourse];
  const listEl = document.getElementById('courseInnerList');
  
  let modulesHtml = '';
  
  for (let module of course.modules) {
    modulesHtml += `<div class="module">${module.name}</div>`;
    
    const sortedItems = [...module.items].sort((a, b) => {
      if (a.active === b.active) return 0;
      return a.active ? -1 : 1;
    });
    
    for (let item of sortedItems) {
      const dateStr = new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      const statusText = item.active ? 'опубликовано:' : 'будет опубликовано:';
      
      modulesHtml += `
        <div class="material-item ${item.active ? 'active' : 'inactive'}" 
             ${item.active ? `onclick="openLesson('${item.name}')"` : ''}>
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
  }
  
  listEl.innerHTML = modulesHtml;
}

function renderCourseLessonsCalendar() {
  const allEvents = getAllEventsForSection('courses');
  
  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let startDay = firstDay.getDay();
  if (startDay === 0) startDay = 7;
  startDay = startDay - 1;
  
  const daysInMonth = lastDay.getDate();
  const days = [];
  
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(Date.UTC(year, month, i)));
  
  const eventsByDate = {};
  allEvents.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });
  
  let html = `
    <div class="card" style="padding:16px;">
      <div class="calendar-header">
        <button class="calendar-nav-btn" onclick="changeCourseCalendarMonth(-1)">←</button>
        <div class="calendar-title">${firstDay.toLocaleString('ru', { month: 'long', year: 'numeric' })}</div>
        <button class="calendar-nav-btn" onclick="changeCourseCalendarMonth(1)">→</button>
      </div>
      <div class="calendar-weekdays">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
      </div>
      <div class="calendar-grid">
  `;
  
  days.forEach(day => {
    if (!day) {
      html += '<div class="calendar-cell empty"></div>';
      return;
    }
    
    const year = day.getUTCFullYear();
    const month = String(day.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;
    
    const dayEvents = eventsByDate[dateStr] || [];
    const hasEvents = dayEvents.length > 0;
    
    const isSelected = calendarSelectedDate && 
                      calendarSelectedDate.getUTCFullYear() === day.getUTCFullYear() && 
                      calendarSelectedDate.getUTCMonth() === day.getUTCMonth() && 
                      calendarSelectedDate.getUTCDate() === day.getUTCDate();
    
    let cellClass = 'calendar-cell';
    let borderColor = 'var(--empty-border)';
    
    if (hasEvents) {
      cellClass += ' has-events';
      if (dayEvents.length === 1) {
        borderColor = getColorForEvent(dayEvents[0]);
      } else {
        borderColor = 'var(--accent)';
      }
    } else {
      cellClass += ' regular';
    }
    
    if (isSelected) {
      cellClass += ' selected';
    }
    
    let dots = '';
    if (hasEvents) {
      dots = '<div class="event-dots">';
      dayEvents.slice(0, 5).forEach(event => {
        dots += `<div class="event-dot" style="background: ${getColorForEvent(event)};"></div>`;
      });
      dots += '</div>';
    }
    
    html += `
      <div class="${cellClass}" 
           style="border-color: ${borderColor};"
           onclick="selectCourseCalendarDay('${dateStr}')">
        <span class="day-number">${day.getUTCDate()}</span>
        ${dots}
      </div>
    `;
  });
  
  html += '</div></div>';
  
  const calendarEl = document.getElementById('courseInnerCalendar');
  if (calendarEl) {
    calendarEl.innerHTML = html;
  }
  
  renderCourseSelectedDayMaterials(eventsByDate);
}

function renderCourseSelectedDayMaterials(eventsByDate) {
  if (!calendarSelectedDate) return;
  
  const year = calendarSelectedDate.getUTCFullYear();
  const month = String(calendarSelectedDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(calendarSelectedDate.getUTCDate()).padStart(2, '0');
  const selectedDateStr = `${year}-${month}-${day}`;
  
  const selectedEvents = eventsByDate[selectedDateStr] || [];
  
  let materialsContainer = document.getElementById('courseInnerDayMaterials');
  if (!materialsContainer) {
    materialsContainer = document.createElement('div');
    materialsContainer.id = 'courseInnerDayMaterials';
    materialsContainer.className = 'day-materials';
    
    const calendarEl = document.getElementById('courseInnerCalendar');
    if (calendarEl) {
      calendarEl.insertAdjacentElement('afterend', materialsContainer);
    }
  }
  
  let html = `<div class="day-materials-title">📅 ${calendarSelectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`;
  
  if (selectedEvents.length > 0) {
    selectedEvents.forEach(event => {
      const isActive = event.active;
      const futureClass = isActive ? '' : 'future';
      const badgeText = event.free ? 'FREE' : 
                       (event.type === 'course' ? 'COURSE' : 
                        (event.type === 'visual' ? 'VISUAL' : 'TEMPLATE'));
      const borderColor = getColorForEvent(event);
      
      let openFunc = '';
      if (isActive) {
        if (event.type === 'course') {
          openFunc = `openLessonFromCalendar('${event.courseId}', '${event.name}')`;
        } else if (event.type === 'visual') {
          openFunc = `openCalendarVisualItem('${event.name}')`;
        } else if (event.type === 'template') {
          openFunc = `openCalendarTemplateItem('${event.name}')`;
        }
      }
      
      html += `
        <div class="material-item calendar-item ${futureClass}" 
             style="border-left:4px solid ${borderColor}; margin-bottom:10px; ${isActive ? 'cursor:pointer;' : 'cursor:default; opacity:0.7;'}"
             ${isActive ? `onclick="${openFunc}"` : ''}>
          <div class="material-title">
            ${event.name}
            <span style="display:inline-block; padding:2px 10px; border-radius:20px; background:${borderColor}; color:${event.free && event.active ? '#000' : '#fff'}; font-size:10px; font-weight:600;">${badgeText}</span>
          </div>
          <div class="material-date-row">
            <span class="material-date">📅 ${new Date(event.date).toLocaleDateString('ru')}</span>
            <span class="material-badge ${isActive ? '' : 'future'}" style="background:${isActive ? 'var(--accent)' : 'var(--future)'};">${isActive ? 'Доступно' : 'Скоро'}</span>
          </div>
        </div>
      `;
    });
  } else {
    html += `
      <div class="card" style="padding:20px; text-align:center;">
        <div class="subtle">Нет материалов в этот день</div>
      </div>
    `;
  }
  
  materialsContainer.innerHTML = html;
}

function changeCourseCalendarMonth(delta) {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
  renderCourseLessonsCalendar();
}

function selectCourseCalendarDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  calendarSelectedDate = new Date(Date.UTC(year, month - 1, day));
  renderCourseLessonsCalendar();
}

function openLessonFromCalendar(courseId, lessonName) {
  cameFromCourseCalendar = true;
  currentCourse = courseId;
  renderCourseContent();
  
  setTimeout(() => {
    const course = courses[courseId];
    for (let module of course.modules) {
      for (let item of module.items) {
        if (item.name === lessonName && item.active) {
          if (!item.free && !subscriptions.course && course.type !== 'free') {
            alert('Этот урок требует подписку COURSE. Оформите её в профиле.');
            return;
          }
          currentLesson = item;
          renderLesson();
          return;
        }
      }
    }
  }, 100);
}

function openLesson(lessonName) {
  const course = courses[currentCourse];
  for (let module of course.modules) {
    for (let item of module.items) {
      if (item.name === lessonName && item.active) {
        if (!item.free && !subscriptions.course && course.type !== 'free') {
          alert('Этот урок требует подписку COURSE. Оформите её в профиле.');
          return;
        }
        currentLesson = item;
        renderLesson();
        return;
      }
    }
  }
}

function renderLesson() {
  const listEl = document.getElementById("coursesList");
  const contentEl = document.getElementById("courseContent");
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="goBackFromLesson()">← Назад</button>
  `;
  
  contentEl.innerHTML = `
    <div class="card">
      <h2 style="margin:0 0 6px; font-size:18px;">${currentLesson.name}</h2>
      <div class="placeholder-video">🎥 Видеоурок</div>
      <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentLesson.date).toLocaleDateString('ru-RU')}</p>
      <p>Материалы урока: презентация, видео, исходные файлы.</p>
      <button class="back-button-large" onclick="goBackFromLesson()">Вернуться к урокам</button>
    </div>
  `;
}

function goBackFromLesson() {
  renderCourseContent();
}

// ===== Блоки визуализации =====
function renderVisualList() {
  const listEl = document.getElementById("visualList");
  
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
           ${item.active ? `onclick="openVisualItem('${item.name}')"` : ''}>
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
  
  if (!item.free && !subscriptions.visual) {
    alert('Этот материал требует подписку VISUAL. Оформите её в профиле.');
    return;
  }
  
  currentVisualItem = item;
  renderVisualItem();
}

function renderVisualItem() {
  const listEl = document.getElementById("visualList");
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="goBackFromVisual()">← Назад</button>
    <div class="card">
      <h2 style="margin:12px 0 6px; font-size:18px;">${currentVisualItem.name}</h2>
      <div class="placeholder-image" style="height: 300px;">🎨 3D-блок</div>
      <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentVisualItem.date).toLocaleDateString('ru-RU')}</p>
      <p>Файл: ${currentVisualItem.file}</p>
      <button class="back-button-large" onclick="goBackFromVisual()">Вернуться к списку</button>
    </div>
  `;
}

function goBackFromVisual() {
  if (cameFromVisualCalendar) {
    cameFromVisualCalendar = false;
    setViewMode('visual', 'calendar');
  } else {
    renderVisualList();
  }
}

// ===== Шаблоны =====
function renderTemplatesList() {
  const listEl = document.getElementById("templatesList");
  
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
           ${item.active ? `onclick="openTemplateItem('${item.name}')"` : ''}>
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
  
  if (!item.free && !subscriptions.template) {
    alert('Этот шаблон требует подписку TEMPLATE. Оформите её в профиле.');
    return;
  }
  
  currentTemplateItem = item;
  renderTemplateItem();
}

function renderTemplateItem() {
  const listEl = document.getElementById("templatesList");
  
  listEl.innerHTML = `
    <button class="back-button-small" onclick="goBackFromTemplate()">← Назад</button>
    <div class="card">
      <h2 style="margin:12px 0 6px; font-size:18px;">${currentTemplateItem.name}</h2>
      <div class="placeholder-image" style="height: 200px;">📄 Шаблон</div>
      <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentTemplateItem.date).toLocaleDateString('ru-RU')}</p>
      <p>Формат: ${currentTemplateItem.format}</p>
      <button class="back-button-large" onclick="goBackFromTemplate()">Вернуться к списку</button>
    </div>
  `;
}

function goBackFromTemplate() {
  if (cameFromTemplateCalendar) {
    cameFromTemplateCalendar = false;
    setViewMode('templates', 'calendar');
  } else {
    renderTemplatesList();
  }
}

// ⭐ НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С БАЗОЙ ДАННЫХ ⭐

// ===== Тесты с загрузкой из БД =====
let currentTestId = null;
let currentTestData = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentAnswered = false;
let currentAnsweredQuestions = [];

async function renderTestsList() {
  const listEl = document.getElementById("topicsList");
  const testArea = document.getElementById("testArea");
  testArea.innerHTML = "";
  hideTestControls();
  clearAutoTransition();
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Тесты</h3>';
  
  try {
    // Загружаем тесты из базы данных
    const tests = await API.getTests();
    
    for (let test of tests) {
      try {
        // Загружаем полную информацию о тесте
        const testFull = await API.getTestFull(test.id);
        const questionsCount = testFull.questions?.length || 0;
        
        const progress = testProgress[test.id];
        let progressText = '';
        let completedClass = '';
        
        if (progress) {
          if (progress.completed) {
            completedClass = 'completed';
            progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color:var(--good);">✅ Пройден: ${progress.score}/${progress.total}</span></div>`;
          } else if (progress.currentQuestion > 0) {
            progressText = `<div style="font-size:12px; margin-top:8px;"><span style="color:var(--accent);">⏳ Прогресс: ${progress.currentQuestion}/${progress.total}</span></div>`;
          }
        }
        
        html += `
          <div class="test-item ${completedClass}" onclick="startTest('${test.id}')">
            <div class="test-row">
              <span class="test-title">${test.title}</span>
              <span class="test-badge ${test.free ? 'free' : 'test'}">${test.free ? 'FREE' : 'TEST'}</span>
            </div>
            <div class="subtle">${questionsCount} вопросов</div>
            ${progressText}
          </div>
        `;
      } catch (e) {
        // Если не удалось загрузить вопросы, показываем просто тест
        html += `
          <div class="test-item" onclick="startTest('${test.id}')">
            <div class="test-row">
              <span class="test-title">${test.title}</span>
              <span class="test-badge ${test.free ? 'free' : 'test'}">${test.free ? 'FREE' : 'TEST'}</span>
            </div>
            <div class="subtle">Нажмите чтобы начать</div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error);
    html += '<div class="card" style="color: #e74c3c;">Ошибка загрузки тестов</div>';
  }
  
  listEl.innerHTML = html;
}

async function startTest(testId) {
  console.log('Запуск теста:', testId);
  
  try {
    // Загружаем тест из базы данных
    const testData = await API.getTestFull(testId);
    console.log('Данные теста:', testData);
    
    if (!testData.questions || testData.questions.length === 0) {
      alert('В этом тесте пока нет вопросов');
      return;
    }
    
    currentTestId = testId;
    currentTestData = testData;
    currentQuestions = testData.questions;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentAnsweredQuestions = [];
    currentAnswered = false;
    
    // Скрываем список тестов, показываем область теста
    document.getElementById("topicsList").innerHTML = "";
    document.getElementById("testArea").style.display = "block";
    
    startTime = Date.now();
    showTestControls();
    startTimer();
    showQuestion();
  } catch (error) {
    console.error('Ошибка загрузки теста:', error);
    alert('Не удалось загрузить тест. Проверьте подключение к серверу.');
  }
}

function showQuestion() {
  const testArea = document.getElementById("testArea");
  testArea.style.paddingBottom = "80px";
  
  currentAnswered = false;
  document.getElementById("nextBtn").style.display = "none";
  clearAutoTransition();

  const q = currentQuestions[currentQuestionIndex];
  const total = currentQuestions.length;
  const progressPct = Math.round(((currentQuestionIndex) / total) * 100);

  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <span class="pill" id="timer">⏱ ${formatSeconds(getElapsedSeconds())}</span>
        <span class="pill">Вопрос ${currentQuestionIndex + 1}/${total}</span>
      </div>
      <div class="progress-bar"><div class="progress" style="width:${progressPct}%"></div></div>
      <h3 style="margin:14px 0 10px;">${escapeHtml(q.text)}</h3>
      <div id="answers">
        ${q.answers.map((ans, i) => `
          <button class="button" id="ans${i}" onclick="selectAnswer(${i})" ${currentAnsweredQuestions.includes(currentQuestionIndex) ? 'disabled' : ''}>
            <div class="ans"><div class="badge">${letters[i]}</div><div class="ans-text">${escapeHtml(ans.text)}</div></div>
          </button>
        `).join("")}
      </div>
      <div id="commentArea"></div>
    </div>
  `;
  
  if (currentAnsweredQuestions.includes(currentQuestionIndex)) {
    const correctIndex = q.answers.findIndex(a => a.isCorrect);
    const correctBtn = document.getElementById("ans" + correctIndex);
    if (correctBtn) {
      correctBtn.classList.add("correct-permanent");
    }
    showComment(q.explanation);
    document.getElementById("nextBtn").style.display = "inline-block";
  }
}

function selectAnswer(index) {
  if (currentAnswered || currentAnsweredQuestions.includes(currentQuestionIndex)) return;
  
  currentAnswered = true;
  
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = q.answers[index].isCorrect;
  
  // Блокируем все кнопки
  for (let i = 0; i < q.answers.length; i++) {
    const btn = document.getElementById("ans" + i);
    if (btn) btn.disabled = true;
  }
  
  if (isCorrect) {
    currentScore++;
    const correctBtn = document.getElementById("ans" + index);
    correctBtn.classList.add("correct-flash");
    showComment(q.explanation);
    
    if (!currentAnsweredQuestions.includes(currentQuestionIndex)) {
      currentAnsweredQuestions.push(currentQuestionIndex);
    }
    
    saveTestProgress();
    
    autoTransitionTimer = setTimeout(() => {
      nextQuestion();
    }, 1200);
  } else {
    const wrongBtn = document.getElementById("ans" + index);
    const correctIndex = q.answers.findIndex(a => a.isCorrect);
    const correctBtn = document.getElementById("ans" + correctIndex);
    wrongBtn.classList.add("wrong-permanent");
    correctBtn.classList.add("correct-permanent");
    showComment(q.explanation);
    
    if (!currentAnsweredQuestions.includes(currentQuestionIndex)) {
      currentAnsweredQuestions.push(currentQuestionIndex);
    }
    
    saveTestProgress();
    document.getElementById("nextBtn").style.display = "inline-block";
  }
}

function showComment(text) {
  const ca = document.getElementById("commentArea");
  ca.innerHTML = `<div class="comment">💬 ${escapeHtml(text)}</div>`;
}

function nextQuestion() {
  clearAutoTransition();
  
  const total = currentQuestions.length;
  let nextQ = currentQuestionIndex + 1;
  
  while (nextQ < total && currentAnsweredQuestions.includes(nextQ)) {
    nextQ++;
  }
  
  if (nextQ < total) {
    currentQuestionIndex = nextQ;
    showQuestion();
  } else {
    showTestResult();
  }
}

function finishTest() {
  clearAutoTransition();
  saveTestProgress(true);
  showTestResult();
}

function exitTest() {
  stopTimer();
  clearAutoTransition();
  saveTestProgress();
  currentTestId = null;
  document.getElementById("testArea").innerHTML = "";
  document.getElementById("topicsList").innerHTML = "";
  renderTestsList();
}

function saveTestProgress(completed = false) {
  if (!currentTestId) return;
  
  const total = currentQuestions.length;
  testProgress[currentTestId] = {
    currentQuestion: currentQuestionIndex,
    score: currentScore,
    answered: currentAnsweredQuestions,
    completed: completed || (currentAnsweredQuestions.length === total),
    total: total,
    lastUpdated: Date.now()
  };
}

function showTestResult() {
  stopTimer();
  hideTestControls();
  clearAutoTransition();
  
  const total = currentQuestions.length;
  const wrong = total - currentScore;
  const percent = Math.round((currentScore / total) * 100);
  const timeSpent = getElapsedSeconds();

  const testArea = document.getElementById("testArea");
  testArea.innerHTML = `
    <div class="card">
      <div class="row">
        <div>
          <div style="font-size:16px; font-weight:900;">Результат</div>
          <div class="subtle">Тест завершен</div>
        </div>
        <span class="pill">⏱ ${formatSeconds(timeSpent)}</span>
      </div>
      <div style="height:12px;"></div>
      <div class="stats-grid">
        <div class="center">
          <canvas id="pie" width="120" height="120" style="width:120px; height:120px;"></canvas>
          <div style="margin-top:8px; font-size:18px; font-weight:900;">${percent}%</div>
          <div class="subtle">верных</div>
        </div>
        <div>
          <div class="statline"><span class="k">Правильных</span><span class="v">${currentScore}</span></div>
          <div class="statline"><span class="k">Неправильных</span><span class="v">${wrong}</span></div>
          <div class="statline"><span class="k">Всего</span><span class="v">${total}</span></div>
        </div>
      </div>
      <button class="button primary" onclick="restartTest()">Пройти ещё раз</button>
      <button class="button" onclick="renderTestsList()">К списку тестов</button>
    </div>
  `;
  drawPieChart("pie", currentScore, wrong);
}

function restartTest() {
  if (currentTestId) {
    delete testProgress[currentTestId];
  }
  startTest(currentTestId);
}

// ===== Timer (без изменений) =====
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

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} сек`;
}

function showTestControls() {
  document.getElementById("testControls").style.display = "block";
  document.getElementById("nextBtn").style.display = "none";
}

function hideTestControls() {
  document.getElementById("testControls").style.display = "none";
  document.getElementById("testArea").style.paddingBottom = "0";
}

function drawPieChart(canvasId, correct, wrong) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext("2d");
  const total = correct + wrong;
  
  ctx.clearRect(0, 0, 120, 120);
  ctx.beginPath();
  ctx.arc(60, 60, 50, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();

  if (total > 0) {
    const correctAngle = (correct / total) * Math.PI * 2;
    const start = -Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.arc(60, 60, 50, start, start + correctAngle);
    ctx.closePath();
    ctx.fillStyle = getCssVar("--good");
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.arc(60, 60, 50, start + correctAngle, start + Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = getCssVar("--bad");
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(60, 60, 30, 0, Math.PI * 2);
  ctx.fillStyle = getCssVar("--card");
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "700 14px -apple-system";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${correct}/${correct + wrong}`, 60, 58);
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    return m;
  });
}

function clearAutoTransition() {
  if (autoTransitionTimer) {
    clearTimeout(autoTransitionTimer);
    autoTransitionTimer = null;
  }
}

// ===== Запуск при загрузке =====
document.addEventListener('DOMContentLoaded', () => {
  updateProfileDisplay();
});

// ===== Управление пользователем =====
let currentUser = null;

// Загружаем пользователя при старте
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
    document.getElementById('userAvatar').src = user.avatar || 'images/default-avatar.png';
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email || 'Email не указан';
    
    // Отображаем подписки
    const subsContainer = document.getElementById('userSubscriptions');
    subsContainer.innerHTML = '';
    
    const subTypes = {
      course: { name: 'COURSE', color: 'var(--course)' },
      visual: { name: 'VISUAL', color: 'var(--visual)' },
      template: { name: 'TEMPLATE', color: 'var(--template)' },
      test: { name: 'TEST', color: 'var(--test)' }
    };
    
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

function logout() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  currentUser = null;
  
  const vkSection = document.getElementById('vkAuthSection');
  const userSection = document.getElementById('userInfoSection');
  
  if (vkSection) vkSection.style.display = 'block';
  if (userSection) userSection.style.display = 'none';
  
  // Сбрасываем иконку профиля
  document.getElementById('headerProfileIcon').innerHTML = '👤';
}

// Загружаем пользователя при загрузке страницы
document.addEventListener('DOMContentLoaded', loadUser);
