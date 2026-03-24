// js/modules/courses.js
// Раздел Courses: анимированная заглушка "Курсы" в стиле приложения

let coursesAnimationState = null;

function ensureCoursesStyle() {
  if (document.getElementById('courses-dev-style')) return;

  const style = document.createElement('style');
  style.id = 'courses-dev-style';
  style.textContent = `
    .courses-dev-wrap {
      position: relative;
      width: 100%;
      min-height: 420px;
      background: var(--bg, #111);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow:
        0 12px 40px rgba(0,0,0,0.28),
        0 0 0 1px rgba(255,255,255,0.015) inset;
    }

    .courses-dev-canvas {
      display: block;
      width: 100%;
      height: 420px;
      background: var(--bg, #111);
    }

    .courses-dev-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
    }

    .courses-dev-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: min(440px, calc(100% - 32px));
      padding: 24px 26px;
      border-radius: 16px;
      background: var(--card, #1c1c1e);
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow:
        0 12px 40px rgba(0,0,0,0.35),
        0 0 0 1px rgba(255,255,255,0.015) inset,
        0 0 28px rgba(230,193,88,0.05);
      text-align: center;
    }

    .courses-dev-title {
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      margin: 0;
    }

    .courses-dev-subtitle {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted, #a7a7a7);
      margin: 0;
    }

    .courses-dev-bar {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: var(--btn, #2e2e2e);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
    }

    .courses-dev-bar-fill {
      width: 35%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        rgba(230,193,88,0.18),
        rgba(230,193,88,1),
        rgba(255,245,210,0.95)
      );
      box-shadow: 0 0 18px rgba(230,193,88,0.65);
      animation: coursesDevBarMove 2.2s ease-in-out infinite;
      transform: translateX(-120%);
    }

    @keyframes coursesDevBarMove {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
    }
  `;

  document.head.appendChild(style);
}

function destroyCoursesAnimation() {
  if (!coursesAnimationState) return;

  coursesAnimationState.destroyed = true;

  if (coursesAnimationState.rafId) {
    cancelAnimationFrame(coursesAnimationState.rafId);
  }

  if (coursesAnimationState.resizeHandler) {
    window.removeEventListener('resize', coursesAnimationState.resizeHandler);
  }

  coursesAnimationState = null;
}

function createCoursesAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const state = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    rafId: 0,
    destroyed: false,
    resizeHandler: null
  };

  const modules = [
    { x: 0.18, y: 0.22, w: 0.16, h: 0.09 },
    { x: 0.42, y: 0.22, w: 0.16, h: 0.09 },
    { x: 0.66, y: 0.22, w: 0.16, h: 0.09 },

    { x: 0.18, y: 0.42, w: 0.16, h: 0.09 },
    { x: 0.42, y: 0.42, w: 0.16, h: 0.09 },
    { x: 0.66, y: 0.42, w: 0.16, h: 0.09 },

    { x: 0.18, y: 0.62, w: 0.16, h: 0.09 },
    { x: 0.42, y: 0.62, w: 0.16, h: 0.09 },
    { x: 0.66, y: 0.62, w: 0.16, h: 0.09 }
  ];

  const flowLines = [
    { x1: 0.50, y1: 0.08, x2: 0.50, y2: 0.17 },
    { x1: 0.26, y1: 0.17, x2: 0.74, y2: 0.17 },

    { x1: 0.26, y1: 0.17, x2: 0.26, y2: 0.22 },
    { x1: 0.50, y1: 0.17, x2: 0.50, y2: 0.22 },
    { x1: 0.74, y1: 0.17, x2: 0.74, y2: 0.22 },

    { x1: 0.26, y1: 0.31, x2: 0.26, y2: 0.42 },
    { x1: 0.50, y1: 0.31, x2: 0.50, y2: 0.42 },
    { x1: 0.74, y1: 0.31, x2: 0.74, y2: 0.42 },

    { x1: 0.26, y1: 0.51, x2: 0.26, y2: 0.62 },
    { x1: 0.50, y1: 0.51, x2: 0.50, y2: 0.62 },
    { x1: 0.74, y1: 0.51, x2: 0.74, y2: 0.62 }
  ];

  const pulses = flowLines.map((line, i) => ({
    line,
    offset: (i * 0.17) % 1,
    speed: 0.22 + (i % 3) * 0.04
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, Math.floor(rect.width));
    state.height = Math.max(1, Math.floor(rect.height));
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(state.width * state.dpr));
    canvas.height = Math.max(1, Math.floor(state.height * state.dpr));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(state.dpr, state.dpr);
  }

  function pxX(v) {
    return v * state.width;
  }

  function pxY(v) {
    return v * state.height;
  }

  function drawGrid() {
    const gap = Math.max(38, Math.min(64, state.width / 28));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= state.width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.height);
      ctx.stroke();
    }

    for (let y = 0; y <= state.height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGlow(t) {
    const x = state.width * 0.5;
    const y = state.height * 0.48;
    const radius = Math.min(state.width, state.height) * (0.20 + Math.sin(t * 0.0014) * 0.01);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, 'rgba(230,193,88,0.08)');
    gradient.addColorStop(0.55, 'rgba(230,193,88,0.025)');
    gradient.addColorStop(1, 'rgba(230,193,88,0)');

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLines(t) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    flowLines.forEach((line, i) => {
      const x1 = pxX(line.x1);
      const y1 = pxY(line.y1);
      const x2 = pxX(line.x2);
      const y2 = pxY(line.y2);
      const glow = 0.12 + 0.08 * Math.sin(t * 0.0018 + i * 0.8);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(230,193,88,${glow})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(230,193,88,0.28)';
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawModules(t) {
    modules.forEach((mod, i) => {
      const x = pxX(mod.x);
      const y = pxY(mod.y);
      const w = pxX(mod.w);
      const h = pxY(mod.h);

      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.7);
      const borderAlpha = 0.08 + pulse * 0.10;
      const glowAlpha = 0.03 + pulse * 0.05;

      ctx.save();

      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.strokeStyle = `rgba(255,255,255,${borderAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = `rgba(230,193,88,${glowAlpha})`;
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(230,193,88,0.18)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.stroke();

      const innerY = y + h * 0.32;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.18, innerY);
      ctx.lineTo(x + w * 0.82, innerY);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + w * 0.18, innerY + h * 0.20);
      ctx.lineTo(x + w * 0.64, innerY + h * 0.20);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });
  }

  function drawPulses(t) {
    pulses.forEach((pulse) => {
      const { line } = pulse;
      const progress = (t * 0.00012 * pulse.speed * 60 + pulse.offset) % 1;

      const x = pxX(line.x1 + (line.x2 - line.x1) * progress);
      const y = pxY(line.y1 + (line.y2 - line.y1) * progress);

      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,245,230,0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowColor = 'rgba(230,193,88,1)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawCore(t) {
    const x = state.width * 0.5;
    const y = state.height * 0.08;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0024);

    ctx.beginPath();
    ctx.arc(x, y, 10 + pulse * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,240,220,0.95)';
    ctx.shadowBlur = 24;
    ctx.shadowColor = 'rgba(230,193,88,0.9)';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x, y, 22 + pulse * 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(230,193,88,0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function animate(t) {
    if (state.destroyed || !document.body.contains(canvas)) return;

    ctx.clearRect(0, 0, state.width, state.height);
    drawGrid();
    drawGlow(t);
    drawLines(t);
    drawModules(t);
    drawPulses(t);
    drawCore(t);

    state.rafId = requestAnimationFrame(animate);
  }

  state.resizeHandler = resize;
  window.addEventListener('resize', state.resizeHandler);
  resize();
  state.rafId = requestAnimationFrame(animate);

  console.assert(Array.isArray(modules) && modules.length > 0, 'courses animation: modules should exist');
  console.assert(Array.isArray(flowLines) && flowLines.length > 0, 'courses animation: flowLines should exist');
  console.assert(pulses.length === flowLines.length, 'courses animation: pulses count should match lines count');

  return state;
}

function renderCoursesList() {
  const listEl = document.getElementById('coursesList');
  if (!listEl) return;

  destroyCoursesAnimation();
  ensureCoursesStyle();

  const calendarEl = document.getElementById('coursesCalendar');
  const contentEl = document.getElementById('courseContent');

  if (calendarEl) calendarEl.style.display = 'none';
  if (contentEl) contentEl.innerHTML = '';

  listEl.innerHTML = `
    <div class="courses-dev-wrap">
      <canvas class="courses-dev-canvas" id="coursesDevCanvas" aria-label="Courses section animation"></canvas>
      <div class="courses-dev-overlay">
        <div class="courses-dev-panel">
          <h2 class="courses-dev-title">Курсы</h2>
          <p class="courses-dev-subtitle">Раздел находится в разработке</p>
          <div class="courses-dev-bar">
            <div class="courses-dev-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('coursesDevCanvas');
  if (!canvas) return;

  coursesAnimationState = createCoursesAnimation(canvas);
}

function openCourseItem() {
  renderCoursesList();
}

function renderCourseItem() {
  renderCoursesList();
}

function goBackFromCourse() {
  renderCoursesList();
}

function openCalendarCourseItem() {
  renderCoursesList();
}

window.addEventListener('beforeunload', destroyCoursesAnimation);

window.renderCoursesList = renderCoursesList;
window.openCourseItem = openCourseItem;
window.renderCourseItem = renderCourseItem;
window.goBackFromCourse = goBackFromCourse;
window.openCalendarCourseItem = openCalendarCourseItem;
window.destroyCoursesAnimation = destroyCoursesAnimation;
