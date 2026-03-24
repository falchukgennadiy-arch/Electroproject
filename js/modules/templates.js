// js/modules/templates.js

let templatesAnimationState = null;

function ensureTemplatesStyle() {
  if (document.getElementById('templates-dev-style')) return;

  const style = document.createElement('style');
  style.id = 'templates-dev-style';
  style.textContent = `
    .templates-dev-wrap {
      position: relative;
      width: 100%;
      min-height: calc(100dvh - 140px);
      height: calc(100dvh - 140px);
      background: var(--bg, #111);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.04);
    }

    .templates-dev-canvas {
      width: 100%;
      height: 100%;
      display: block;
      background: var(--bg, #111);
    }

    .templates-dev-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
    }

    .templates-dev-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: min(420px, calc(100% - 32px));
      padding: 24px 26px;
      border-radius: 16px;
      background: linear-gradient(
        135deg,
        rgba(255,255,255,0.06),
        rgba(255,255,255,0.02)
      );
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow:
        0 12px 40px rgba(0,0,0,0.35),
        0 0 0 1px rgba(255,255,255,0.04) inset,
        0 0 32px rgba(155, 89, 182, 0.12);
      text-align: center;
    }

    .templates-dev-title {
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      margin: 0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    .templates-dev-subtitle {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted, #a7a7a7);
      margin: 0;
    }

    .templates-dev-bar {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: var(--btn, #2e2e2e);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
    }

    .templates-dev-bar-fill {
      width: 35%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        rgba(155,89,182,0.2),
        rgba(155,89,182,1),
        rgba(220,200,255,0.95)
      );
      box-shadow: 0 0 18px rgba(155,89,182,0.7);
      animation: templatesBarMove 2.2s ease-in-out infinite;
      transform: translateX(-120%);
    }

    @keyframes templatesBarMove {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
    }

    @media (max-width: 640px) {
      .templates-dev-wrap {
        min-height: calc(100dvh - 120px);
        height: calc(100dvh - 120px);
        border-radius: 14px;
      }

      .templates-dev-panel {
        width: min(92vw, 420px);
        padding: 22px 18px;
      }

      .templates-dev-title {
        font-size: clamp(20px, 6vw, 28px);
      }

      .templates-dev-subtitle {
        font-size: 11px;
        letter-spacing: 0.14em;
      }
    }
  `;

  document.head.appendChild(style);
}

function destroyTemplatesAnimation() {
  if (!templatesAnimationState) return;

  templatesAnimationState.destroyed = true;

  if (templatesAnimationState.rafId) {
    cancelAnimationFrame(templatesAnimationState.rafId);
  }

  if (templatesAnimationState.resizeHandler) {
    window.removeEventListener('resize', templatesAnimationState.resizeHandler);
  }

  templatesAnimationState = null;
}

function createTemplatesAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const color = '155,89,182';

  const state = {
    destroyed: false,
    rafId: 0,
    resizeHandler: null,
    width: 0,
    height: 0,
    dpr: 1,
    sparks: []
  };

  const nodes = [
    { x: 0.10, y: 0.20 }, { x: 0.25, y: 0.20 }, { x: 0.25, y: 0.10 }, { x: 0.40, y: 0.10 },
    { x: 0.40, y: 0.30 }, { x: 0.60, y: 0.30 }, { x: 0.60, y: 0.15 }, { x: 0.80, y: 0.15 },
    { x: 0.80, y: 0.35 }, { x: 0.95, y: 0.35 },

    { x: 0.10, y: 0.60 }, { x: 0.30, y: 0.60 }, { x: 0.30, y: 0.80 }, { x: 0.50, y: 0.80 },
    { x: 0.50, y: 0.55 }, { x: 0.70, y: 0.55 }, { x: 0.70, y: 0.80 }, { x: 0.90, y: 0.80 },
    { x: 0.90, y: 0.60 }, { x: 0.98, y: 0.60 },

    { x: 0.20, y: 0.40 }, { x: 0.35, y: 0.40 }, { x: 0.35, y: 0.50 }, { x: 0.55, y: 0.50 },
    { x: 0.55, y: 0.70 }, { x: 0.75, y: 0.70 }, { x: 0.75, y: 0.50 }, { x: 0.90, y: 0.50 }
  ];

  const segments = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],
    [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],
    [20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],
    [1,20],[4,23],[5,15],[8,27]
  ];

  const pulses = segments.map((segment, i) => ({
    segment,
    offset: (i * 0.15) % 1,
    speed: 0.16 + (i % 4) * 0.035
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

  function point(i) {
    return {
      x: nodes[i].x * state.width,
      y: nodes[i].y * state.height
    };
  }

  function drawBackgroundGrid() {
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
    const radius = Math.min(state.width, state.height) * (0.16 + Math.sin(t * 0.0014) * 0.008);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, `rgba(${color},0.08)`);
    gradient.addColorStop(0.5, `rgba(${color},0.03)`);
    gradient.addColorStop(1, `rgba(${color},0)`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSegments(t) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    segments.forEach((seg, i) => {
      const a = point(seg[0]);
      const b = point(seg[1]);
      const glow = 0.16 + Math.sin(t * 0.0018 + i * 0.7) * 0.08;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${color},${glow})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(${color},0.42)`;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawNodes(t) {
    nodes.forEach((n, i) => {
      const x = n.x * state.width;
      const y = n.y * state.height;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.6);
      const r = 2.2 + pulse * 1.2;

      ctx.beginPath();
      ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},0.05)`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,245,255,0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${color},0.95)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawPulses(t) {
    pulses.forEach((pulse) => {
      const a = point(pulse.segment[0]);
      const b = point(pulse.segment[1]);

      const progress = (t * 0.00012 * pulse.speed * 60 + pulse.offset) % 1;
      const x = a.x + (b.x - a.x) * progress;
      const y = a.y + (b.y - a.y) * progress;

      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,245,255,0.98)';
      ctx.shadowBlur = 24;
      ctx.shadowColor = `rgba(${color},1)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.random() < 0.006) {
        state.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 1,
          size: 1 + Math.random() * 1.4
        });
      }
    });
  }

  function drawSparks() {
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
      ctx.fillStyle = `rgba(255,240,255,${spark.life})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${color},${spark.life})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function animate(t) {
    if (state.destroyed || !document.body.contains(canvas)) return;

    ctx.clearRect(0, 0, state.width, state.height);
    drawBackgroundGrid();
    drawCenterGlow(t);
    drawSegments(t);
    drawPulses(t);
    drawNodes(t);
    drawSparks();

    state.rafId = requestAnimationFrame(animate);
  }

  state.resizeHandler = resize;
  window.addEventListener('resize', resize);
  resize();

  console.assert(Array.isArray(nodes) && nodes.length > 0, 'templates animation: nodes should exist');
  console.assert(Array.isArray(segments) && segments.length > 0, 'templates animation: segments should exist');
  console.assert(pulses.length === segments.length, 'templates animation: pulses count should match segments');

  state.rafId = requestAnimationFrame(animate);
  return state;
}

function hideUnusedTemplatesUi() {
  const toggle = document.getElementById('templatesViewToggle');
  if (toggle) toggle.style.display = 'none';

  const calendarEl = document.getElementById('templatesCalendar');
  if (calendarEl) calendarEl.style.display = 'none';
}

function renderTemplatesList() {
  const el = document.getElementById('templatesList');
  if (!el) return;

  destroyTemplatesAnimation();
  ensureTemplatesStyle();
  hideUnusedTemplatesUi();

  el.innerHTML = `
    <div class="templates-dev-wrap">
      <canvas id="templatesCanvas" class="templates-dev-canvas" aria-label="Templates section animation"></canvas>
      <div class="templates-dev-overlay">
        <div class="templates-dev-panel">
          <h2 class="templates-dev-title">Шаблоны</h2>
          <p class="templates-dev-subtitle">Раздел находится в разработке</p>
          <div class="templates-dev-bar">
            <div class="templates-dev-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('templatesCanvas');
  if (!canvas) return;

  templatesAnimationState = createTemplatesAnimation(canvas);
}

window.addEventListener('beforeunload', destroyTemplatesAnimation);

window.renderTemplatesList = renderTemplatesList;
window.destroyTemplatesAnimation = destroyTemplatesAnimation;
