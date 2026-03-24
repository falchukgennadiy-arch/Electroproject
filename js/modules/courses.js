// js/modules/courses.js
// Заглушка для раздела "Курсы" с полноэкранной анимированной электрической схемой

let coursesAnimationState = null;

function ensureCoursesStyle() {
  if (document.getElementById('courses-dev-style')) return;

  const style = document.createElement('style');
  style.id = 'courses-dev-style';
  style.textContent = `
    .courses-dev-wrap {
      position: relative;
      width: 100%;
      min-height: calc(100dvh - 140px);
      height: calc(100dvh - 140px);
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
      height: 100%;
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
        0 0 28px rgba(74,144,226,0.08);
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
        rgba(74,144,226,0.15),
        rgba(74,144,226,1),
        rgba(210,232,255,0.95)
      );
      box-shadow: 0 0 18px rgba(74,144,226,0.65);
      animation: coursesDevBarMove 2.2s ease-in-out infinite;
      transform: translateX(-120%);
    }

    @keyframes coursesDevBarMove {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
    }

    @media (max-width: 640px) {
      .courses-dev-wrap {
        min-height: calc(100dvh - 120px);
        height: calc(100dvh - 120px);
        border-radius: 14px;
      }

      .courses-dev-panel {
        width: min(92vw, 420px);
        padding: 22px 18px;
      }

      .courses-dev-title {
        font-size: clamp(20px, 6vw, 28px);
      }

      .courses-dev-subtitle {
        font-size: 11px;
        letter-spacing: 0.14em;
      }
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

  const color = '#4a90e2';

  const state = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    rafId: 0,
    destroyed: false,
    resizeHandler: null,
    sparks: []
  };

  // Строгая древовидная схема именно для курсов
  const blocks = [
    { x: 0.16, y: 0.18, w: 0.10, h: 0.10 },
    { x: 0.45, y: 0.18, w: 0.10, h: 0.10 },
    { x: 0.74, y: 0.18, w: 0.10, h: 0.10 },

    { x: 0.16, y: 0.42, w: 0.10, h: 0.10 },
    { x: 0.45, y: 0.42, w: 0.10, h: 0.10 },
    { x: 0.74, y: 0.42, w: 0.10, h: 0.10 },

    { x: 0.16, y: 0.68, w: 0.10, h: 0.10 },
    { x: 0.45, y: 0.68, w: 0.10, h: 0.10 },
    { x: 0.74, y: 0.68, w: 0.10, h: 0.10 }
  ];

  const lines = [
    [0.50, 0.06, 0.50, 0.12],
    [0.21, 0.12, 0.79, 0.12],

    [0.21, 0.12, 0.21, 0.18],
    [0.50, 0.12, 0.50, 0.18],
    [0.79, 0.12, 0.79, 0.18],

    [0.21, 0.28, 0.21, 0.42],
    [0.50, 0.28, 0.50, 0.42],
    [0.79, 0.28, 0.79, 0.42],

    [0.21, 0.52, 0.21, 0.68],
    [0.50, 0.52, 0.50, 0.68],
    [0.79, 0.52, 0.79, 0.68],

    [0.21, 0.60, 0.50, 0.60],
    [0.50, 0.60, 0.79, 0.60]
  ];

  const pulses = lines.map((line, i) => ({
    line,
    offset: (i * 0.17) % 1,
    speed: 0.20 + (i % 3) * 0.035
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

  function drawCenterGlow(t) {
    const x = state.width * 0.5;
    const y = state.height * 0.5;
    const radius = Math.min(state.width, state.height) * (0.22 + Math.sin(t * 0.0015) * 0.01);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, 'rgba(74,144,226,0.09)');
    gradient.addColorStop(0.55, 'rgba(74,144,226,0.03)');
    gradient.addColorStop(1, 'rgba(74,144,226,0)');

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLines(t) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    lines.forEach((line, i) => {
      const x1 = pxX(line[0]);
      const y1 = pxY(line[1]);
      const x2 = pxX(line[2]);
      const y2 = pxY(line[3]);
      const glow = 0.10 + 0.08 * Math.sin(t * 0.0017 + i * 0.8);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(74,144,226,${glow})`;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(74,144,226,0.35)';
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawBlocks(t) {
    blocks.forEach((block, i) => {
      const x = pxX(block.x);
      const y = pxY(block.y);
      const w = pxX(block.w);
      const h = pxY(block.h);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.7);
      const borderAlpha = 0.08 + pulse * 0.10;
      const glowAlpha = 0.05 + pulse * 0.10;

      ctx.save();

      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.strokeStyle = `rgba(255,255,255,${borderAlpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.strokeStyle = `rgba(74,144,226,${glowAlpha})`;
      ctx.lineWidth = 1.1;
      ctx.shadowBlur = 18;
      ctx.shadowColor = 'rgba(74,144,226,0.28)';
      ctx.stroke();

      const line1Y = y + h * 0.30;
      const line2Y = y + h * 0.52;
      const line3Y = y + h * 0.72;

      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';

      ctx.beginPath();
      ctx.moveTo(x + w * 0.16, line1Y);
      ctx.lineTo(x + w * 0.80, line1Y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.16, line2Y);
      ctx.lineTo(x + w * 0.62, line2Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + w * 0.16, line3Y);
      ctx.lineTo(x + w * 0.48, line3Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + w * 0.84, y + h * 0.22, 3 + pulse * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,240,255,0.95)';
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(74,144,226,0.8)';
      ctx.fill();

      ctx.restore();
    });
  }

  function drawPulses(t) {
    pulses.forEach((pulse) => {
      const line = pulse.line;
      const progress = (t * 0.00012 * pulse.speed * 60 + pulse.offset) % 1;

      const x = pxX(line[0] + (line[2] - line[0]) * progress);
      const y = pxY(line[1] + (line[3] - line[1]) * progress);

      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230,245,255,0.96)';
      ctx.shadowBlur = 24;
      ctx.shadowColor = 'rgba(74,144,226,1)';
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.random() < 0.006) {
        state.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 1,
          size: 1 + Math.random() * 1.7
        });
      }
    });
  }

  function updateSparks() {
    for (let i = state.sparks.length - 1; i >= 0; i -= 1) {
      const spark = state.sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.03;

      if (spark.life <= 0) {
        state.sparks.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,240,255,${spark.life})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(74,144,226,${spark.life})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawPowerCore(t) {
    const x = state.width * 0.5;
    const y = state.height * 0.06;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.0025);

    ctx.beginPath();
    ctx.arc(x, y, 9 + pulse * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(225,242,255,0.95)';
    ctx.shadowBlur = 24;
    ctx.shadowColor = 'rgba(74,144,226,0.9)';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x, y, 20 + pulse * 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(74,144,226,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function animate(t) {
    if (state.destroyed || !document.body.contains(canvas)) return;

    ctx.clearRect(0, 0, state.width, state.height);
    drawGrid();
    drawCenterGlow(t);
    drawLines(t);
    drawBlocks(t);
    drawPulses(t);
    updateSparks();
    drawPowerCore(t);

    state.rafId = requestAnimationFrame(animate);
  }

  state.resizeHandler = resize;
  window.addEventListener('resize', state.resizeHandler);
  resize();
  state.rafId = requestAnimationFrame(animate);

  console.assert(Array.isArray(blocks) && blocks.length > 0, 'courses animation: blocks should exist');
  console.assert(Array.isArray(lines) && lines.length > 0, 'courses animation: lines should exist');
  console.assert(pulses.length === lines.length, 'courses animation: pulses count should match lines count');

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

  templatesHideUnusedCoursesUi();
  coursesAnimationState = createCoursesAnimation(canvas);
}

function templatesHideUnusedCoursesUi() {
  const toggle = document.getElementById('coursesViewToggle');
  if (toggle) toggle.style.display = 'none';
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
