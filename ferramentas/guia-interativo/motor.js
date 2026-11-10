// Motor de captura: abre o app (versão web), fotografa a tela e mede as áreas clicáveis.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const S = process.env.S;
const BASE = 'http://localhost:8099';
const W = 393, H = 852;

const fontes = fs.readdirSync(`${S}/web/fontes`).map((f) =>
  `@font-face{font-family:'${f.replace('.ttf', '')}';src:url('/fontes/${f}')}`).join('');

async function iniciar() {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'pt-BR' });
  await ctx.addInitScript((css) => {
    const por = () => { const s = document.createElement('style'); s.textContent = css + '*{scrollbar-width:none}::-webkit-scrollbar{display:none}'; document.head.appendChild(s); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', por); else por();
    window.open = () => null; // WhatsApp/links externos não abrem durante a captura
  }, fontes);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  return { browser, ctx, page, erros };
}

async function esperar(page, ms = 2500) {
  await page.waitForTimeout(ms);
  await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.all(imgs.map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
  });
  await page.waitForTimeout(400);
}

// Acha o elemento que rola (lista principal) e quanto ele tem a mais.
async function infoRolagem(page) {
  return page.evaluate(() => {
    let melhor = null;
    for (const el of document.querySelectorAll('div')) {
      const st = getComputedStyle(el);
      if (!/(auto|scroll)/.test(st.overflowY)) continue;
      const extra = el.scrollHeight - el.clientHeight;
      const r = el.getBoundingClientRect();
      if (extra > 5 && r.width > 300 && (!melhor || extra > melhor.extra)) melhor = { extra, top: r.top, bottom: r.bottom };
    }
    return melhor;
  });
}

function caixa(b, grow) {
  if (!b) return null;
  const g = { top: 0, left: 0, right: 0, bottom: 0, ...(grow || {}) };
  return { x: Math.round(b.x - g.left), y: Math.round(b.y - g.top), w: Math.round(b.width + g.left + g.right), h: Math.round(b.height + g.top + g.bottom) };
}

async function medir(page, q) {
  if (q.rect) return { x: q.rect[0], y: q.rect[1], w: q.rect[2], h: q.rect[3] };
  let loc;
  if (q.label) loc = page.getByLabel(q.label, { exact: q.exact ?? true });
  else if (q.text) loc = page.getByText(q.text, { exact: q.exact ?? true });
  else if (q.placeholder) loc = page.getByPlaceholder(q.placeholder);
  else if (q.css) loc = page.locator(q.css);
  loc = loc.locator('visible=true').nth(q.nth ?? 0);
  if (!(await loc.count())) return null;
  const b = await loc.boundingBox();
  if (q.parentUp && b) {
    const pb = await loc.evaluate((el, n) => { let e = el; for (let i = 0; i < n; i++) e = e.parentElement; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, q.parentUp);
    return caixa(pb, q.grow);
  }
  return caixa(b, q.grow);
}

// Fotografa a tela atual. Tela comprida: aumenta a altura da janela para caber tudo
// e guarda onde começa/termina a parte que rola (cabeçalho e abas ficam fixos).
async function capturar(page, id, hotspots, opts = {}) {
  await esperar(page, opts.espera ?? 2500);
  const rol = opts.semRolagem ? null : await infoRolagem(page);
  let altura = H, topo = 0, base = 0;
  if (rol && rol.extra > 5) {
    altura = Math.min(H + rol.extra, 6000);
    topo = Math.round(rol.top); base = Math.round(H - rol.bottom);
    if (opts.baseFixa) base = opts.baseFixa;
    await page.setViewportSize({ width: W, height: altura });
    await esperar(page, 1500);
  }
  if (opts.antesFoto) await opts.antesFoto();
  const arq = `${id}.png`;
  await page.screenshot({ path: `${S}/demo/telas/${arq}` });
  const areas = [];
  for (const h of hotspots) {
    const r = await medir(page, h.q);
    if (!r) { console.log(`  [${id}] não achei:`, JSON.stringify(h.q)); continue; }
    areas.push({ ...h, q: undefined, r });
  }
  const cor = await page.evaluate(() => {
    const el = document.elementFromPoint(200, 3);
    let e = el; while (e) { const c = getComputedStyle(e).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; e = e.parentElement; }
    return 'rgb(250,247,242)';
  });
  await page.setViewportSize({ width: W, height: H });
  console.log(`ok ${id} altura=${altura} topo=${topo} base=${base} areas=${areas.length}/${hotspots.length}`);
  return { id, arq, altura, topo, base, cor, areas };
}

module.exports = { iniciar, capturar, esperar, BASE, W, H };
