// js/modules/visual.js

let visualAnimationState = null;

function ensureVisualStyle() {
  if (document.getElementById('visual-dev-style')) return;

  const style = document.createElement('style');
  style.id = 'visual-dev-style';
  style.textContent = `
    .visual-dev-wrap {
      position: relative;
      width: 100%;
      min-height: calc(100dvh - 140px);
      height: calc(100dvh - 140px);
      background: var(--bg, #111);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.04);
    }

    .visual-dev-canvas {
      width: 100%;
      height: 100%;
      display: block;
      background: var(--bg, #111);
    }

    .visual-dev-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      padding: 20px;
    }

    .visual-dev-panel {
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
        0 0 32px rgba(230,193,88,0.12);
      text-align: center;
    }

    .visual-dev-title {
      font-size: clamp(22px, 3vw, 34px);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      margin: 0;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    .visual-dev-subtitle {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted, #a7a7a7);
      margin: 0;
    }

    .visual-dev-bar {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: var(--btn, #2e2e2e);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
    }

    .visual-dev-bar-fill {
      width: 35%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        rgba(230,193,88,0.2),
        rgba(230,193,88,1),
        rgba(255,240,190,0.95)
      );
      box-shadow: 0 0 18px rgba(230,193,88,0.7);
      animation: visualBarMove 2.2s ease-in-out infinite;
      transform: translateX(-120%);
    }

    @keyframes visualBarMove {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
    }

    @media (max-width: 640px) {
      .visual-dev-wrap {
        min-height: calc(100dvh - 120px);
        height: calc(100dvh - 120px);
        border-radius: 14px;
      }

      .visual-dev-panel {
        width: min(92vw, 420px);
        padding: 22px 18px;
      }

      .visual-dev-title {
        font-size: clamp(20px, 6vw, 28px);
      }

      .visual-dev-subtitle {
        font-size: 11px;
        letter-spacing: 0.14em;
      }
    }
  `;

  document.head.appendChild(style);
}

function destroyVisualAnimation() {
  if (!visualAnimationState) return;

  visualAnimationState.destroyed = true;

  if (visualAnimationState.rafId) {
    cancelAnimationFrame(visualAnimationState.rafId);
  }

  if (visualAnimationState.resizeHandler) {
    window.removeEventListener('resize', visualAnimationState.resizeHandler);
  }

  visualAnimationState = null;
}

function createVisualAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const color = '230,193,88';

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
    { x: 0.08, y: 0.18 }, { x: 0.22, y: 0.18 }, { x: 0.22, y: 0.08 }, { x: 0.40, y: 0.08 },
    { x: 0.40, y: 0.24 }, { x: 0.60, y: 0.24 }, { x: 0.60, y: 0.12 }, { x: 0.82, y: 0.12 },
    { x: 0.82, y: 0.30 }, { x: 0.94, y: 0.30 },

    { x: 0.10, y: 0.58 }, { x: 0.24, y: 0.58 }, { x: 0.24, y: 0.76 }, { x: 0.44, y: 0.76 },
    { x: 0.44, y: 0.54 }, { x: 0.64, y: 0.54 }, { x: 0.64, y: 0.82 }, { x: 0.86, y: 0.82 },
    { x: 0.86, y: 0.62 }, { x: 0.96, y: 0.62 },

    { x: 0.14, y: 0.40 }, { x: 0.30, y: 0.40 }, { x: 0.30, y: 0.50 }, { x: 0.50, y: 0.50 },
    { x: 0.50, y: 0.66 }, { x: 0.74, y: 0.66 }, { x: 0.74, y: 0.46 }, { x: 0.90, y: 0.46 }
  ];

  const segments = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],
    [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],
    [20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],
    [1,20],[4,23],[5,15],[8,27],[11,21],[14,23],[16,25]
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
      ctx.fillStyle = 'rgba(255,245,220,0.95)';
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
      ctx.fillStyle = 'rgba(255,248,225,0.98)';
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
      ctx.fillStyle = `rgba(255,245,220,${spark.life})`;
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

  console.assert(Array.isArray(nodes) && nodes.length > 0, 'visual animation: nodes should exist');
  console.assert(Array.isArray(segments) && segments.length > 0, 'visual animation: segments should exist');
  console.assert(pulses.length === segments.length, 'visual animation: pulses count should match segments');

  state.rafId = requestAnimationFrame(animate);
  return state;
}

function hideUnusedVisualUi() {
  const toggle = document.getElementById('visualViewToggle');
  if (toggle) toggle.style.display = 'none';

  const calendarEl = document.getElementById('visualCalendar');
  if (calendarEl) calendarEl.style.display = 'none';
}

function renderVisualList() {
  const el = document.getElementById('visualList');
  if (!el) return;

  destroyVisualAnimation();
  ensureVisualStyle();
  hideUnusedVisualUi();

  el.innerHTML = `
    <div class="visual-dev-wrap">
      <canvas id="visualCanvas" class="visual-dev-canvas" aria-label="Visual section animation"></canvas>
      <div class="visual-dev-overlay">
        <div class="visual-dev-panel">
          <h2 class="visual-dev-title">Визуализация</h2>
          <p class="visual-dev-subtitle">Раздел находится в разработке</p>
          <div class="visual-dev-bar">
            <div class="visual-dev-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('visualCanvas');
  if (!canvas) return;

  visualAnimationState = createVisualAnimation(canvas);
}

window.addEventListener('beforeunload', destroyVisualAnimation);

window.renderVisualList = renderVisualList;
window.destroyVisualAnimation = destroyVisualAnimation;
