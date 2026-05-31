// render.mjs — turns a day's structured data object into the Boom Catcher page.
// Pure functions, no network. The visual "shell" (inline <style> + <script>) is
// lifted from a stable historical snapshot so every day stays visually identical
// except for the daily palette.
import fs from "node:fs";
import path from "node:path";

const OPP = {
  must:    ["opp-must", "🔥 必跟"],
  watch:   ["opp-watch", "⭐ 关注"],
  wait:    ["opp-wait", "👀 观望"],
  caution: ["opp-caution", "❄️ 谨慎"],
};

function oppBadge(key) {
  const [cls, label] = OPP[key] || OPP.watch;
  return `<div class="opportunity-badge ${cls}">${label}</div>`;
}

const q = (s) => String(s ?? "").replace(/ /g, "+"); // for image-search query

function productCard(p) {
  const pos = p.sentiment.pos, neu = p.sentiment.neu, neg = p.sentiment.neg;
  const badges = p.badges.map(b => `<span class="platform-badge">${b}</span>`).join("\n      ");
  const themes = p.themes.map(t => `<span class="voc-theme-tag">${t}</span>`).join("\n        ");
  const quotes = p.quotes.map(x =>
    `<div class="voc-quote">"${x.text}" <span class="voc-quote-source">— ${x.source}</span></div>`
  ).join("\n      ");
  const tips = p.tips.map(t => `<li>${t}</li>`).join("\n      ");
  const links = [
    ...(p.links || []).map(l => `<a class="source-link" href="${l.url}" target="_blank">${l.label}</a>`),
    `<a class="source-link" href="https://www.google.com/search?tbm=isch&q=${q(p.img_query)}" target="_blank">🖼️ 图片搜索</a>`,
  ].join("\n      ");
  const eu = p.eu_compliance ? `\n    <div class="eu-compliance">${p.eu_compliance}</div>` : "";
  return `  <article class="product-card reveal-section">
    <div class="product-rank">${p.rank_label}</div>
    <a href="https://www.google.com/search?tbm=isch&q=${q(p.img_query)}" target="_blank" class="product-image-wrap" title="点击搜索产品图片">${p.emoji}</a>
    <div class="product-header">
      <div><h3 class="product-name">${p.name}</h3><span class="product-category">${p.category}</span></div>
    </div>
    <div class="product-price">${p.price}</div>
    <div class="platform-badges">
      ${badges}
    </div>
    <div class="anomaly-callout">
      🎯 为什么是异常值：${p.anomaly}
      <span class="anomaly-score">异常指数：${p.score}/100</span>
    </div>
    <div class="voc-section">
      <h4>🗣️ 消费者在说什么</h4>
      <p style="margin-bottom:0.5rem;">${p.voc_summary}</p>
      <div class="voc-themes">
        ${themes}
      </div>
      ${quotes}
      <div class="sentiment-bar">
        <div class="sentiment-positive" style="width:${pos}%"></div>
        <div class="sentiment-neutral" style="width:${neu}%"></div>
        <div class="sentiment-negative" style="width:${neg}%"></div>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem;">😊 ${pos}% · 😐 ${neu}% · 😟 ${neg}% · 来源：${p.sources}</div>
    </div>
    <div class="biz-section">
      <div class="biz-card"><div class="biz-card-label">机会评级</div>${oppBadge(p.opportunity)}</div>
      <div class="biz-card"><div class="biz-card-label">利润潜力</div><div class="biz-card-value">${p.profit}</div></div>
      <div class="biz-card"><div class="biz-card-label">供应链门槛</div><div class="biz-card-value">${p.supply}</div></div>
      <div class="biz-card"><div class="biz-card-label">竞争密度</div><div class="biz-card-value">${p.competition}</div></div>
    </div>
    <div style="margin-top:0.75rem;">
      <strong style="font-size:0.85rem;">📈 趋势判断：</strong>
      <span style="font-size:0.85rem;color:var(--text-secondary);">${p.trend}</span>
    </div>
    <ul class="tips-list">
      ${tips}
    </ul>${eu}
    <div class="source-links">
      <span class="source-links-label">🔗 探索来源：</span>
      ${links}
    </div>
  </article>`;
}

function globalCard(g) {
  const badges = g.badges.map(b => `<span class="platform-badge">${b}</span>`).join("\n      ");
  const tips = g.tips.map(t => `<li>${t}</li>`).join("\n      ");
  const biz = g.biz.map(item =>
    item.kind === "badge"
      ? `<div class="biz-card"><div class="biz-card-label">${item.label}</div>${oppBadge(item.opp)}</div>`
      : `<div class="biz-card"><div class="biz-card-label">${item.label}</div><div class="biz-card-value">${item.value}</div></div>`
  ).join("\n      ");
  return `  <article class="product-card reveal-section">
    <div class="product-rank">${g.rank_label}</div>
    <a href="https://www.google.com/search?tbm=isch&q=${q(g.img_query)}" target="_blank" class="product-image-wrap" title="点击搜索产品图片">${g.emoji}</a>
    <div class="product-header">
      <div><h3 class="product-name">${g.name}</h3><span class="product-category">${g.category}</span></div>
    </div>
    <div class="product-price">${g.price}</div>
    <div class="platform-badges">
      ${badges}
    </div>
    <div class="anomaly-callout">
      🎯 全域信号：${g.anomaly}
    </div>
    <div class="biz-section">
      ${biz}
    </div>
    <ul class="tips-list">
      ${tips}
    </ul>
  </article>`;
}

// Extract the inline <style> + <script> "shell" from a stable snapshot and
// re-skin it with today's palette.
function buildShell(root, date) {
  const candidates = [
    path.join(root, "daily", "2026-05-21.html"),
    path.join(root, "index.html"),
  ];
  let src = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { src = fs.readFileSync(c, "utf-8"); break; }
  }
  if (!src) throw new Error("No shell source (daily/2026-05-21.html or index.html) found");
  let style = src.match(/<style>([\s\S]*?)<\/style>/)[1];
  let js = src.match(/<script>([\s\S]*?)<\/script>/)[1];
  return { style, js: js.replace(/var today='[^']*';/, `var today='${date}';`) };
}

function applyPalette(style, pal) {
  return style
    .replace(/--bg-primary:[^;]+;/, `--bg-primary: ${pal.bg};`)
    .replace(/--bg-card:[^;]+;/, `--bg-card: ${pal.card};`)
    .replace(/--bg-accent:[^;]+;/, `--bg-accent: ${pal.accent_bg};`)
    .replace(/--accent:[^;]+;/, `--accent: ${pal.accent};`)
    .replace(/--accent-glow:[^;]+;/, `--accent-glow: ${pal.glow};`)
    .replace(/--gradient-hero:[^;]+;/, `--gradient-hero: ${pal.grad};`);
}

export function renderPage(root, data) {
  const { style, js } = buildShell(root, data.date);
  const styled = applyPalette(style, data.palette);
  const us = data.products.filter(p => p.region === "us");
  const eu = data.products.filter(p => p.region === "eu");
  const usHtml = us.map(productCard).join("\n\n");
  const euHtml = eu.map(productCard).join("\n\n");
  const globHtml = data.global_products.map(globalCard).join("\n\n");
  const s = data.stats;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>爆款捕手 — ${data.date}</title>
<meta name="description" content="爆款捕手 — 每日自动扫描全球电商平台，捕捉异常爆款信号。${data.theme_short}">
<link rel="stylesheet" href="css/style.css">
<style>${styled}</style>
</head>
<body>

<div class="loading-overlay" id="loading"><div class="loading-spinner"></div></div>
<canvas class="bg-particles" id="particles"></canvas>

<section class="hero">
  <div class="hero-date">${data.date_cn}</div>
  <div class="hero-box" id="heroBox" onclick="openBox()">
    <div class="hero-box-inner">
      <div class="hero-box-front">🎁</div>
      <div class="hero-box-back">
        <span style="font-size:2rem;display:block;">${data.hero_emoji}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;">今天发现</span>
        <span style="font-size:1.2rem;font-weight:700;color:var(--accent);">${s.outliers} 个爆款</span>
      </div>
    </div>
    <div class="hero-box-label" id="boxLabel">👆 点我开盲盒</div>
  </div>
  <h1 class="hero-title">爆款捕手<br><span style="font-size:0.6em;font-weight:400;">Boom Catcher</span></h1>
  <p class="hero-theme">${data.theme}</p>
  <div class="hero-stats">
    <div class="hero-stat"><div class="hero-stat-value">${s.scanned}</div><div class="hero-stat-label">扫描商品</div></div>
    <div class="hero-stat"><div class="hero-stat-value">${s.outliers}</div><div class="hero-stat-label">异常爆款</div></div>
    <div class="hero-stat"><div class="hero-stat-value">${s.platforms}</div><div class="hero-stat-label">覆盖平台</div></div>
  </div>
  <div style="margin-top:2rem;animation:bounce 2s infinite;"><span style="font-size:1.5rem;color:var(--text-muted);">↓</span></div>
</section>

<nav class="date-nav reveal-section" id="dateNav">
  <span style="color:var(--text-muted);font-size:0.8rem;">📅 最近捕获：</span>
  <div id="dateNavLinks" style="display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center;"></div>
</nav>

<div class="tab-nav reveal-section" id="tabNav">
  <button class="tab-btn active" onclick="switchTab('us')" id="tabUs">🇺🇸 美国区</button>
  <button class="tab-btn" onclick="switchTab('eu')" id="tabEu">🇪🇺 欧洲区</button>
  <button class="tab-btn tab-global" onclick="switchTab('global')" id="tabGlobal">🌍 全域爆款</button>
</div>

<section class="products-section tab-panel active" id="panelUs">
  <h2 class="section-title">🇺🇸 美国区 · 异常爆款</h2>

${usHtml}
</section>

<section class="products-section tab-panel" id="panelEu" style="display:none;">
  <h2 class="section-title">🇪🇺 欧洲区 · 异常爆款</h2>

${euHtml}
</section>

<section class="products-section tab-panel" id="panelGlobal" style="display:none;">
  <h2 class="section-title">🌍 全域爆款 <span style="font-size:0.7em;color:var(--text-muted);">— 在两个区域同时爆发</span></h2>
  <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem;">以下产品在美国区和欧洲区同时出现异常增长信号，具有最强的跨境套利潜力。</p>

${globHtml}
</section>

<footer class="site-footer">
  <p style="color:var(--text-muted);">
    🤖 由 GitHub Actions + Claude 每日自动生成 · 数据来源：Amazon, TikTok, Temu, Shein, Reddit, Etsy 等<br>
    上次更新：${data.generated_at}
  </p>
  <a href="archive.html" class="archive-link">📦 浏览历史捕获</a>
</footer>

<script>${js}</script>
</body>
</html>
`;
}

// Map the rich daily object into a schema.json-compliant record for data/daily/<date>.json
export function toSchemaJson(data) {
  const prod = (p, i) => ({
    rank: i + 1,
    region: p.is_global ? "global" : p.region,
    name: p.name, category: p.category, price_range: p.price,
    platforms: [{ name: "TikTok", trend_signal: "spiking", notes: p.badges[0] || "" }],
    anomaly_reason: p.anomaly, anomaly_score: p.score,
    voc_analysis: {
      summary: p.voc_summary, key_themes: p.themes,
      sentiment: { positive_pct: p.sentiment.pos, neutral_pct: p.sentiment.neu, negative_pct: p.sentiment.neg },
      sources: [p.sources], quotes: p.quotes,
    },
    business_analysis: {
      opportunity_level: (OPP[p.opportunity] || OPP.watch)[1],
      profit_potential: p.profit, supply_complexity: p.supply,
      competition_density: p.competition, trend_sustainability: p.trend,
      actionable_tips: p.tips,
    },
    product_image_url: `https://www.google.com/search?tbm=isch&q=${q(p.img_query)}`,
  });
  return {
    date: data.date, generated_at: data.generated_at,
    meta: {
      total_scanned: data.stats.scanned, outliers_found: data.stats.outliers,
      regions: {
        us: data.products.filter(p => p.region === "us").length,
        eu: data.products.filter(p => p.region === "eu").length,
        global: data.global_products.length,
      },
      platforms_count: data.stats.platforms, theme: data.theme,
      cover_image_prompt: data.cover_image_prompt || "",
    },
    products: data.products.map(prod),
    visual: {
      cover_image_path: "",
      color_palette: [data.palette.bg, data.palette.card, data.palette.accent_bg, data.palette.accent],
      page_style: data.page_style || "",
    },
  };
}
