// ===== Данные курсов =====
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
      item.active = window.isMaterialActive ? window.isMaterialActive(item.date) : true;
    }
  }
}

// Состояние курсов
let currentCourse = null;
let currentLesson = null;
let courseInnerView = 'list';
let cameFromCourseCalendar = false;

// ===== Функции курсов =====
function renderCoursesList() {
  const listEl = document.getElementById("coursesList");
  const contentEl = document.getElementById("courseContent");
  if (contentEl) contentEl.innerHTML = "";
  
  let html = '<h3 style="margin-top:0; margin-bottom:12px;">Курсы</h3>';
  
  for (let [id, course] of Object.entries(courses)) {
    const badgeClass = course.type === 'free' ? 'badge-free' : 'badge-course';
    const badgeText = course.type === 'free' ? 'FREE' : 'COURSE';
    
    html += `
      <div class="course-card" onclick="window.openCourse('${id}')">
        <h3>${course.title}</h3>
        <div class="subtle">${course.description}</div>
        <div class="course-meta">
          <span>📚 ${course.modules.reduce((acc, m) => acc + m.items.length, 0)} уроков</span>
          <span class="${badgeClass}">${badgeText}</span>
        </div>
      </div>
    `;
  }
  
  if (listEl) listEl.innerHTML = html;
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
  
  if (contentEl) contentEl.innerHTML = "";
  
  // В календаре не показываем название и описание курса
  let calendarHtml = '';
  if (courseInnerView === 'calendar') {
    calendarHtml = `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn" onclick="window.setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn active" onclick="window.setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <div id="courseInnerCalendar"></div>
      <div id="courseInnerList" style="display:none;"></div>
    `;
  } else {
    calendarHtml = `
      <div style="margin-top:12px;">
        <div class="view-toggle" id="courseInnerViewToggle">
          <button class="view-toggle-btn active" onclick="window.setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn" onclick="window.setCourseInnerView('calendar')">📅 Календарь</button>
        </div>
      </div>
      <h2 style="font-size:18px; margin:12px 0 4px;">${course.title}</h2>
      <div class="subtle" style="margin-bottom:12px;">${course.description}</div>
      <div id="courseInnerList"></div>
      <div id="courseInnerCalendar" style="display:none;"></div>
    `;
  }
  
  if (listEl) {
    listEl.innerHTML = `
      <button class="back-button-small" onclick="window.goBackFromCourse()">← Назад</button>
      ${calendarHtml}
    `;
  }
  
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
          <button class="view-toggle-btn active" onclick="window.setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn" onclick="window.setCourseInnerView('calendar')">📅 Календарь</button>
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
          <button class="view-toggle-btn" onclick="window.setCourseInnerView('list')">📋 Список уроков</button>
          <button class="view-toggle-btn active" onclick="window.setCourseInnerView('calendar')">📅 Календарь</button>
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
             ${item.active ? `onclick="window.openLesson('${item.name}')"` : ''}>
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
  
  if (listEl) listEl.innerHTML = modulesHtml;
}

function renderCourseLessonsCalendar() {
  // Используем функцию календаря из window
  if (window.renderCalendar) {
    window.renderCalendar('courses');
  }
}

function openLesson(lessonName) {
  const course = courses[currentCourse];
  for (let module of course.modules) {
    for (let item of module.items) {
      if (item.name === lessonName && item.active) {
        if (!item.free && !window.subscriptions?.course && course.type !== 'free') {
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

function openLessonFromCalendar(courseId, lessonName) {
  cameFromCourseCalendar = true;
  currentCourse = courseId;
  renderCourseContent();
  
  setTimeout(() => {
    const course = courses[courseId];
    for (let module of course.modules) {
      for (let item of module.items) {
        if (item.name === lessonName && item.active) {
          if (!item.free && !window.subscriptions?.course && course.type !== 'free') {
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

function renderLesson() {
  const listEl = document.getElementById("coursesList");
  const contentEl = document.getElementById("courseContent");
  
  if (listEl) {
    listEl.innerHTML = `
      <button class="back-button-small" onclick="window.goBackFromLesson()">← Назад</button>
    `;
  }
  
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="card">
        <h2 style="margin:0 0 6px; font-size:18px;">${currentLesson.name}</h2>
        <div class="placeholder-video">🎥 Видеоурок</div>
        <p class="subtle" style="margin:8px 0;">📅 ${new Date(currentLesson.date).toLocaleDateString('ru-RU')}</p>
        <p>Материалы урока: презентация, видео, исходные файлы.</p>
        <button class="back-button-large" onclick="window.goBackFromLesson()">Вернуться к урокам</button>
      </div>
    `;
  }
}

function goBackFromLesson() {
  renderCourseContent();
}

function openCalendarCourseItem(courseId, lessonName) {
  cameFromCourseCalendar = true;
  window.n
