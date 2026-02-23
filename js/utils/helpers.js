// ===== Вспомогательные функции =====
const letters = ["A", "B", "C", "D"];

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} сек`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    return m;
  });
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
