// js/modules/templates.js
// Раздел Templates: анимированная заглушка "Раздел находится в разработке"

let templatesAnimationState = null;

function ensureTemplatesStyle() {
  if (document.getElementById('templates-dev-style')) return;

  const style = document.createElement('style');
  style.id = 'templates-dev-style';
  style.textContent = `
    .templates-dev-wrap {
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

    .templates-dev-canvas {
      display: block;
      width: 100%;
      height: 420px;
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
      background: var(--card, #1c1c1e);
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow:
        0 12px 40px rgba(0,0,0,0.35),
        0 0 0 1px rgba(255,255,255,0.015) inset,
        0 0 28px rgba(230,193,88,0.05);
      text-align: center;
    }

    .templates-dev-title {
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      margin: 0;
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
        rgba(230,193,88,0.18),
        rgba(230,193,88,1),
        rgba(255,245,210,0.95)
      );
      box-shadow: 0 0 18px rgba(230,193,88,0.65);
      animation: templatesDevBarMove 2.2s ease-in-out infinite;
      transform: translateX(-120%);
    }

    @keyframes templatesDevBarMove {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
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

  const state = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    rafId: 0,
    destroyed: false,
    sparks: [],
    resizeHandler: null
  };

  const nodes = [
    { x: 0.10, y: 0.25 }, { x: 0.22, y: 0.25 }, { x: 0.22, y: 0.16 }, { x: 0.40, y: 0.16 },
    { x: 0.40, y: 0.32 }, { x: 0.58, y: 0.32 }, { x: 0.58, y: 0.20 }, { x: 0.78, y: 0.20 },
    { x: 0.78, y: 0.40 }, { x: 0.92, y: 0.40 }, { x: 0.08, y: 0.58 }, { x: 0.26, y: 0.58 },
    { x: 0.26, y: 0.74 }, { x: 0.44, y: 0.74 }, { x: 0.44, y: 0.54 }, { x: 0.63, y: 0.54 },
    { x: 0.63, y: 0.78 }, { x: 0.84, y: 0.78 }, { x: 0.84, y: 0.60 }, { x: 0.94, y: 0.60 },
    { x: 0.15, y: 0.42 }, { x: 0.32, y: 0.42 }, { x: 0.32, y: 0.50 }, { x: 0.52, y: 0.50 },
    { x: 0.52, y: 0.66 }, { x: 0.72, y: 0.66 }, { x: 0.72, y: 0.50 }, { x: 0.88, y: 0.50 }
  ];

  const segments = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19],
    [20, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27],
    [1, 20], [4, 23], [5, 15], [8, 27], [11, 21], [14, 23], [16, 25]
  ];

  const pulses = segments.map((segment, i) => ({
    segment,
    offset: (i * 0.13) % 1,
    speed: 0.18 + (i % 4) * 0.035
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

  function getPoint(index) {
    const node = nodes[index];
    return {
      x: node.x * state.width,
      y: node.y * state.height
    };
  }

  function drawGrid() {
    const gap = Math.max(38, Math.min(64, state.width / 28));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
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
    const radius = Math.min(state.width, state.height) * (0.12 + Math.sin(t * 0.0015) * 0.005);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, 'rgba(230,193,88,0.10)');
    gradient.addColorStop(0.5, 'rgba(230,193,88,0.035)');
    gradient.addColorStop(1, 'rgba(230,193,88,0)');

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSegments(t) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    segments.forEach((pair, index) => {
      const p1 = getPoint(pair[0]);
      const p2 = getPoint(pair[1]);
      const glow = 0.18 + 0.12 * Math.sin(t * 0.0018 + index * 0.9);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(230,193,88,${glow})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(230,193,88,0.35)';
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawNodes(t) {
    nodes.forEach((node, i) => {
      const x = node.x * state.width;
      const y = node.y * state.height;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i * 0.6);
      const r = 2.2 + pulse * 1.4;

      ctx.beginPath();
      ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230,193,88,0.05)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,220,0.95)';
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(230,193,88,0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawPulses(t) {
    pulses.forEach((pulse) => {
      const [a, b] = pulse.segment;
      const p1 = getPoint(a);
      const p2 = getPoint(b);
      const progress = (t * 0.00012 * pulse.speed * 60 + pulse.offset) % 1;
      const x = p1.x + (p2.x - p1.x) * progress;
      const y = p1.y + (p2.y - p1.y) * progress;

      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,245,230,0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowColor = 'rgba(230,193,88,1)';
      ctx.fill();
      ctx.shadowBlur = 0;

      if (Math.random() < 0.008) {
        state.sparks.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
          life: 1,
          size: 1 + Math.random() * 2
        });
      }
    });
  }

  function updateSparks() {
    for (let i = state.sparks.length - 1; i >= 0; i -= 1) {
      const spark = state.sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= 0.025;

      if (spark.life <= 0) {
        state.sparks.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,235,210,${spark.life})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(230,193,88,${spark.life})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function animate(t) {
    if (state.destroyed || !document.body.contains(canvas)) return;

    ctx.clearRect(0, 0, state.width, state.height);
    drawGrid();
    drawCenterGlow(t);
    drawSegments(t);
    drawPulses(t);
    drawNodes(t);
    updateSparks();

    state.rafId = requestAnimationFrame(animate);
  }

  state.resizeHandler = resize;
  window.addEventListener('resize', state.resizeHandler);
  resize();
  state.rafId = requestAnimationFrame(animate);

  console.assert(Array.isArray(nodes) && nodes.length > 0, 'templates animation: nodes should exist');
  console.assert(Array.isArray(segments) && segments.length > 0, 'templates animation: segments should exist');
  console.assert(pulses.length === segments.length, 'templates animation: pulses count should match segments count');
  console.assert(typeof renderTemplatesList === 'function' || typeof window.renderTemplatesList === 'function', 'templates render function should exist');

  return state;
}

function renderTemplatesList() {
  const listEl = document.getElementById('templatesList');
  if (!listEl) return;

  destroyTemplatesAnimation();
  ensureTemplatesStyle();

  listEl.innerHTML = `
    <div class="templates-dev-wrap">
      <canvas class="templates-dev-canvas" id="templatesDevCanvas" aria-label="Templates section animation"></canvas>
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

  const canvas = document.getElementById('templatesDevCanvas');
  if (!canvas) return;

  templatesAnimationState = createTemplatesAnimation(canvas);
}

function openTemplateItem() {
  renderTemplatesList();
}

function renderTemplateItem() {
  renderTemplatesList();
}

function goBackFromTemplate() {
  renderTemplatesList();
}

function openCalendarTemplateItem() {
  renderTemplatesList();
}

window.addEventListener('beforeunload', destroyTemplatesAnimation);

window.renderTemplatesList = renderTemplatesList;
window.openTemplateItem = openTemplateItem;
window.renderTemplateItem = renderTemplateItem;
window.goBackFromTemplate = goBackFromTemplate;
window.openCalendarTemplateItem = openCalendarTemplateItem;
window.destroyTemplatesAnimation = destroyTemplatesAnimation;
