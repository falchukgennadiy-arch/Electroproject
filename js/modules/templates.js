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
      animation: moveBar 2.2s infinite;
    }

    @keyframes moveBar {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(320%); }
    }
  `;

  document.head.appendChild(style);
}

function destroyTemplatesAnimation() {
  if (!templatesAnimationState) return;

  templatesAnimationState.destroyed = true;
  cancelAnimationFrame(templatesAnimationState.raf);
  window.removeEventListener('resize', templatesAnimationState.resize);

  templatesAnimationState = null;
}

function createTemplatesAnimation(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const color = '155,89,182';

  const state = {
    destroyed: false,
    raf: 0,
    resize: null
  };

  let w = 0, h = 0, dpr = 1;

  const nodes = [
    {x:0.1,y:0.2},{x:0.25,y:0.2},{x:0.25,y:0.1},{x:0.4,y:0.1},
    {x:0.4,y:0.3},{x:0.6,y:0.3},{x:0.6,y:0.15},{x:0.8,y:0.15},
    {x:0.8,y:0.35},{x:0.95,y:0.35},

    {x:0.1,y:0.6},{x:0.3,y:0.6},{x:0.3,y:0.8},{x:0.5,y:0.8},
    {x:0.5,y:0.55},{x:0.7,y:0.55},{x:0.7,y:0.8},{x:0.9,y:0.8},
    {x:0.9,y:0.6},{x:0.98,y:0.6},

    {x:0.2,y:0.4},{x:0.35,y:0.4},{x:0.35,y:0.5},{x:0.55,y:0.5},
    {x:0.55,y:0.7},{x:0.75,y:0.7},{x:0.75,y:0.5},{x:0.9,y:0.5}
  ];

  const segments = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],
    [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],
    [20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],
    [1,20],[4,23],[5,15],[8,27]
  ];

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function point(i){
    return {
      x:nodes[i].x*w,
      y:nodes[i].y*h
    }
  }

  function draw(t){
    ctx.clearRect(0,0,w,h);

    segments.forEach((s,i)=>{
      const a = point(s[0]);
      const b = point(s[1]);

      const glow = 0.2 + Math.sin(t*0.002+i)*0.1;

      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.strokeStyle = `rgba(${color},${glow})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(${color},0.4)`;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    nodes.forEach((n,i)=>{
      const x = n.x*w;
      const y = n.y*h;

      ctx.beginPath();
      ctx.arc(x,y,3,0,Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${color},1)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    state.raf = requestAnimationFrame(draw);
  }

  state.resize = resize;
  window.addEventListener('resize', resize);
  resize();

  state.raf = requestAnimationFrame(draw);

  return state;
}

function renderTemplatesList() {
  const el = document.getElementById('templatesList');
  if (!el) return;

  destroyTemplatesAnimation();
  ensureTemplatesStyle();

  el.innerHTML = `
    <div class="templates-dev-wrap">
      <canvas id="templatesCanvas" class="templates-dev-canvas"></canvas>
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
  templatesAnimationState = createTemplatesAnimation(canvas);
}

window.renderTemplatesList = renderTemplatesList;
window.destroyTemplatesAnimation = destroyTemplatesAnimation;
