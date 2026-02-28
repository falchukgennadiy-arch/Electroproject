// ===== Календарь =====
let calendarCurrentDate = new Date();
let calendarSelectedDate = new Date();
let calendarSection = 'visual';

function getAllEventsForSection(section) {
  let events = [];
  
  // Курсы (данные из window.courses)
  if (window.courses) {
    for (let courseId in window.courses) {
      const course = window.courses[courseId];
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
  }
  
  // Визуализация (данные из window.visualItems)
  if (window.visualItems) {
    window.visualItems.forEach(item => {
      events.push({
        ...item,
        type: 'visual',
        source: 'visual',
        displaySection: 'visual'
      });
    });
  }
  
  // Шаблоны (данные из window.templateItems)
  if (window.templateItems) {
    window.templateItems.forEach(item => {
      events.push({
        ...item,
        type: 'template',
        source: 'templates',
        displaySection: 'templates'
      });
    });
  }
  
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
        <button class="calendar-nav-btn" onclick="window.changeMonth(-1)">←</button>
        <div class="calendar-title">${firstDay.toLocaleString('ru', { month: 'long', year: 'numeric' })}</div>
        <button class="calendar-nav-btn" onclick="window.changeMonth(1)">→</button>
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
           onclick="window.selectCalendarDay('${dateStr}')">
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
      
      let openFunc = '';
      if (isActive) {
        if (event.type === 'course') {
          openFunc = `window.openCalendarCourseItem('${event.courseId}', '${event.name}')`;
        } else if (event.type === 'visual') {
          openFunc = `window.openCalendarVisualItem('${event.name}')`;
        } else if (event.type === 'template') {
          openFunc = `window.openCalendarTemplateItem('${event.name}')`;
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

// Экспорт
window.calendarCurrentDate = calendarCurrentDate;
window.calendarSelectedDate = calendarSelectedDate;
window.calendarSection = calendarSection;
window.renderCalendar = renderCalendar;
window.changeMonth = changeMonth;
window.selectCalendarDay = selectCalendarDay;
