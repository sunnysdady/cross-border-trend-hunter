// render.mjs — Boom Catcher daily page renderer.
// Self-contained: builds a complete modern page from the day's structured data.
// No dependency on prior HTML snapshots. Pure functions, no network.
//
// Design: dark "trend intelligence desk". Single daily accent color carries
// identity; hierarchy via type scale + weight + whitespace. Content is visible
// by default (reveal motion only enhances). Semantic, keyboard-accessible,
// WCAG AA contrast. No gradient text / particles / glass / side-stripes.

const OPP = {
  must:    ["opp-must", "🔥 必跟"],
  watch:   ["opp-watch", "⭐ 关注"],
  wait:    ["opp-wait", "👀 观望"],
  caution: ["opp-caution", "❄️ 谨慎"],
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const q = (s) => String(s ?? "").replace(/ /g, "+");

// readable ink (black/white) on top of an arbitrary accent hex
function inkOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "#0b0b0c";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#0b0b0c" : "#ffffff";
}

function oppBadge(key) {
  const [cls, label] = OPP[key] || OPP.watch;
  return `<span class="opp ${cls}">${esc(label)}</span>`;
}

function sentiment(s) {
  const pos = s?.pos ?? 0, neu = s?.neu ?? 0, neg = s?.neg ?? 0;
  return `<div class="senti" role="img" aria-label="情绪占比：正面 ${pos}%、中性 ${neu}%、负面 ${neg}%">
        <span class="senti-bar"><i class="s-pos" style="width:${pos}%"></i><i class="s-neu" style="width:${neu}%"></i><i class="s-neg" style="width:${neg}%"></i></span>
        <span class="senti-key"><b class="s-pos-t">${pos}%</b> 正面 · ${neu}% 中性 · <b class="s-neg-t">${neg}%</b> 负面</span>
      </div>`;
}

function productRow(p, i) {
  const hero = i === 0;
  const badges = (p.badges || []).map(b => `<span class="tag">${esc(b)}</span>`).join("");
  const themes = (p.themes || []).map(t => `<span class="theme">${esc(t)}</span>`).join("");
  const quotes = (p.quotes || []).map(x =>
    `<blockquote class="quote">${esc(x.text)}<cite>— ${esc(x.source)}</cite></blockquote>`).join("");
  const tips = (p.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
  const links = [
    ...(p.links || []).map(l => `<a class="src" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`),
    `<a class="src" href="https://www.google.com/search?tbm=isch&q=${q(p.img_query)}" target="_blank" rel="noopener">🖼️ 图片搜索</a>`,
  ].join("");
  const eu = p.eu_compliance
    ? `<p class="eu"><span class="eu-flag">🇪🇺 欧盟合规</span>${esc(p.eu_compliance)}</p>` : "";
  return `<article class="row${hero ? " row-hero" : ""}" style="--delay:${i * 60}ms">
    <header class="row-head">
      <div class="rank"><span class="rank-emoji" aria-hidden="true">${esc(p.emoji)}</span><span class="rank-tag">${esc(p.rank_label)}</span></div>
      <div class="row-title">
        <h3>${esc(p.name)}</h3>
        <p class="cat">${esc(p.category)}</p>
      </div>
      <a class="row-img" href="https://www.google.com/search?tbm=isch&q=${q(p.img_query)}" target="_blank" rel="noopener" aria-label="搜索 ${esc(p.name)} 的产品图片"><span aria-hidden="true">${esc(p.emoji)}</span></a>
    </header>

    <div class="stats">
      <div class="stat"><span class="stat-k">异常指数</span><span class="stat-v score">${esc(p.score)}<small>/100</small></span></div>
      <div class="stat"><span class="stat-k">机会评级</span><span class="stat-v">${oppBadge(p.opportunity)}</span></div>
      <div class="stat"><span class="stat-k">利润潜力</span><span class="stat-v">${esc(p.profit)}</span></div>
      <div class="stat"><span class="stat-k">供应链</span><span class="stat-v">${esc(p.supply)}</span></div>
      <div class="stat"><span class="stat-k">竞争密度</span><span class="stat-v">${esc(p.competition)}</span></div>
      <div class="stat price"><span class="stat-k">价格带</span><span class="stat-v">${esc(p.price)}</span></div>
    </div>

    <div class="tags">${badges}</div>

    <p class="anomaly"><span class="anomaly-k">为什么是异常值</span>${esc(p.anomaly)}</p>

    <div class="voc">
      <h4>消费者在说什么</h4>
      <p class="voc-sum">${esc(p.voc_summary)}</p>
      <div class="themes">${themes}</div>
      ${quotes}
      ${sentiment(p.sentiment)}
      <p class="srcline">来源：${esc(p.sources)}</p>
    </div>

    <div class="trend"><span class="trend-k">趋势判断</span>${esc(p.trend)}</div>

    <details class="tips" open>
      <summary>可执行建议</summary>
      <ul>${tips}</ul>
    </details>
    ${eu}
    <div class="srcs"><span class="srcs-k">探索来源</span>${links}</div>
  </article>`;
}

function globalRow(g, i) {
  const badges = (g.badges || []).map(b => `<span class="tag">${esc(b)}</span>`).join("");
  const tips = (g.tips || []).map(t => `<li>${esc(t)}</li>`).join("");
  const biz = (g.biz || []).map(item =>
    item.kind === "badge"
      ? `<div class="stat"><span class="stat-k">${esc(item.label)}</span><span class="stat-v">${oppBadge(item.opp)}</span></div>`
      : `<div class="stat"><span class="stat-k">${esc(item.label)}</span><span class="stat-v">${esc(item.value)}</span></div>`
  ).join("");
  return `<article class="row" style="--delay:${i * 60}ms">
    <header class="row-head">
      <div class="rank"><span class="rank-emoji" aria-hidden="true">${esc(g.emoji)}</span><span class="rank-tag">${esc(g.rank_label)}</span></div>
      <div class="row-title">
        <h3>${esc(g.name)}</h3>
        <p class="cat">${esc(g.category)}</p>
      </div>
      <a class="row-img" href="https://www.google.com/search?tbm=isch&q=${q(g.img_query)}" target="_blank" rel="noopener" aria-label="搜索 ${esc(g.name)} 的产品图片"><span aria-hidden="true">${esc(g.emoji)}</span></a>
    </header>
    <div class="tags">${badges}</div>
    <p class="anomaly"><span class="anomaly-k">全域信号</span>${esc(g.anomaly)}</p>
    <div class="stats">${biz}</div>
    <details class="tips" open>
      <summary>可执行建议</summary>
      <ul>${tips}</ul>
    </details>
  </article>`;
}

function styles(accent, ink) {
  return `
:root{
  --bg:oklch(0.17 0.008 260); --surface:oklch(0.215 0.01 260); --surface-2:oklch(0.255 0.012 260);
  --ink:oklch(0.96 0.004 260); --ink-2:oklch(0.82 0.008 260); --muted:oklch(0.68 0.01 260);
  --line:oklch(1 0 0 / 0.10); --line-2:oklch(1 0 0 / 0.06);
  --accent:${accent}; --on-accent:${ink};
  --pos:oklch(0.78 0.15 150); --neg:oklch(0.70 0.17 25); --neu:oklch(0.72 0.02 260);
  --z-sticky:100;
  --maxw:62rem;
  --display:"Bricolage Grotesque","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --body:system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Noto Sans SC","Microsoft YaHei",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
::selection{background:var(--accent);color:var(--on-accent)}
a{color:inherit}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 clamp(1.1rem,4vw,2rem)}

/* skip link */
.skip{position:absolute;left:-999px;top:0;background:var(--accent);color:var(--on-accent);padding:.6rem 1rem;border-radius:0 0 .5rem 0;z-index:200}
.skip:focus{left:0}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}

/* top bar */
.topbar{position:sticky;top:0;z-index:var(--z-sticky);background:oklch(0.17 0.008 260 / 0.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--line-2)}
.topbar .wrap{display:flex;align-items:center;justify-content:space-between;height:56px;gap:1rem}
.brand{display:flex;align-items:center;gap:.55rem;font-family:var(--display);font-weight:700;letter-spacing:-0.01em}
.brand .dot{width:9px;height:9px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in oklch,var(--accent) 22%,transparent)}
.brand small{color:var(--muted);font-weight:500;font-family:var(--mono);font-size:.74rem;letter-spacing:0}
.topbar a.arch{font-size:.82rem;color:var(--ink-2);text-decoration:none;padding:.4rem .7rem;border:1px solid var(--line);border-radius:.5rem;transition:border-color .2s,color .2s}
.topbar a.arch:hover{color:var(--ink);border-color:var(--accent)}

/* hero */
.hero{padding:clamp(2.6rem,7vw,5rem) 0 clamp(1.4rem,3vw,2.2rem)}
.hero .date{font-family:var(--mono);font-size:.82rem;color:var(--muted);letter-spacing:.02em}
.hero h1{font-family:var(--display);font-weight:800;font-size:clamp(2.4rem,7vw,4.5rem);line-height:1.02;letter-spacing:-0.035em;margin:.5rem 0 .1rem;text-wrap:balance}
.hero h1 .sub{display:block;font-size:.3em;font-weight:600;letter-spacing:.02em;color:var(--muted);margin-top:.5rem;font-family:var(--mono)}
.theme-line{font-size:clamp(1.05rem,2.4vw,1.4rem);color:var(--ink-2);max-width:46ch;margin:1.1rem 0 1.6rem;text-wrap:pretty}
.theme-line .em{color:var(--accent);font-weight:600}

/* blind box (kept as delight, NOT a visibility gate) */
.hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
.box{appearance:none;background:none;border:0;cursor:pointer;perspective:700px;flex-shrink:0}
.box-inner{position:relative;width:104px;height:104px;transition:transform .9s cubic-bezier(.16,1,.3,1);transform-style:preserve-3d}
.box[aria-pressed="true"] .box-inner{transform:rotateY(180deg)}
.box-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--surface)}
.box-front{font-size:2.6rem}
.box-back{transform:rotateY(180deg);background:var(--surface-2);border-color:var(--accent);gap:.15rem}
.box-back .be{font-size:1.7rem}
.box-back .bn{font-family:var(--mono);font-weight:700;color:var(--accent);font-size:1rem}
.box-back .bl{font-size:.66rem;color:var(--muted)}
.box-hint{display:block;margin-top:.5rem;font-size:.7rem;color:var(--muted);font-family:var(--mono)}

/* stat strip in hero */
.kpis{display:flex;gap:0;border:1px solid var(--line);border-radius:.8rem;overflow:hidden;margin-top:.4rem}
.kpi{flex:1;padding:.85rem 1rem;border-right:1px solid var(--line-2)}
.kpi:last-child{border-right:0}
.kpi b{display:block;font-family:var(--mono);font-size:1.5rem;font-weight:700;color:var(--ink)}
.kpi span{font-size:.72rem;color:var(--muted)}

/* tabs */
.tabs{position:sticky;top:56px;z-index:calc(var(--z-sticky) - 1);background:oklch(0.17 0.008 260 / 0.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--line-2);margin-top:1.4rem}
.tabs .wrap{display:flex;gap:.4rem;padding-top:.6rem;padding-bottom:.6rem;overflow-x:auto}
.tab{appearance:none;font:inherit;cursor:pointer;white-space:nowrap;background:transparent;color:var(--ink-2);border:1px solid var(--line);border-radius:2rem;padding:.45rem 1.1rem;font-size:.88rem;transition:color .2s,border-color .2s,background .2s}
.tab:hover{color:var(--ink);border-color:var(--accent)}
.tab[aria-selected="true"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent);font-weight:600}

/* panels */
.panel{padding:clamp(1.6rem,4vw,2.6rem) 0 1rem}
.panel[hidden]{display:none}
.panel-intro{color:var(--muted);font-size:.92rem;margin-bottom:1.6rem;max-width:60ch}

/* rows */
.row{background:var(--surface);border:1px solid var(--line);border-radius:1rem;padding:clamp(1.2rem,3vw,1.8rem);margin-bottom:1.3rem}
.row-hero{background:var(--surface-2);border-color:color-mix(in oklch,var(--accent) 40%,var(--line))}
.row-head{display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:start}
.rank{display:flex;flex-direction:column;gap:.3rem;align-items:flex-start}
.rank-emoji{font-size:2rem;line-height:1}
.rank-tag{font-family:var(--mono);font-size:.68rem;color:var(--accent);border:1px solid color-mix(in oklch,var(--accent) 35%,transparent);padding:.12rem .45rem;border-radius:.4rem;white-space:nowrap}
.row-title h3{font-family:var(--display);font-weight:700;font-size:clamp(1.2rem,2.6vw,1.55rem);line-height:1.2;letter-spacing:-0.02em;text-wrap:balance}
.row-hero .row-title h3{font-size:clamp(1.5rem,3.4vw,2.05rem)}
.cat{color:var(--muted);font-size:.82rem;margin-top:.25rem}
.row-img{flex-shrink:0;width:60px;height:60px;display:grid;place-items:center;font-size:1.8rem;background:var(--bg);border:1px solid var(--line);border-radius:.7rem;text-decoration:none;transition:border-color .2s}
.row-img:hover{border-color:var(--accent)}

/* stats grid */
.stats{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.1rem 0}
.stat{flex:1 1 8rem;background:var(--bg);border:1px solid var(--line-2);border-radius:.6rem;padding:.6rem .75rem}
.stat-k{display:block;font-size:.68rem;color:var(--muted);margin-bottom:.25rem}
.stat-v{font-size:.92rem;font-weight:600;color:var(--ink)}
.stat-v.score{font-family:var(--mono);font-size:1.45rem;font-weight:700;color:var(--accent)}
.stat-v.score small{font-size:.6rem;color:var(--muted);font-weight:500}
.opp{display:inline-block;font-size:.8rem;font-weight:700;padding:.12rem .5rem;border-radius:.4rem}
.opp-must{background:color-mix(in oklch,var(--pos) 22%,transparent);color:var(--pos)}
.opp-watch{background:color-mix(in oklch,oklch(0.8 0.13 90) 20%,transparent);color:oklch(0.85 0.13 90)}
.opp-wait{background:oklch(1 0 0 / 0.08);color:var(--ink-2)}
.opp-caution{background:color-mix(in oklch,var(--neg) 20%,transparent);color:var(--neg)}

.tags{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem}
.tag{font-size:.72rem;color:var(--ink-2);background:var(--bg);border:1px solid var(--line);border-radius:.4rem;padding:.18rem .55rem;font-family:var(--mono)}

.anomaly{background:var(--bg);border:1px solid var(--line-2);border-radius:.7rem;padding:.9rem 1rem;font-size:.92rem;color:var(--ink-2);line-height:1.65}
.anomaly-k{display:block;font-size:.72rem;font-weight:700;color:var(--accent);margin-bottom:.35rem;letter-spacing:.01em}

.voc{margin:1.1rem 0;padding-top:1.1rem;border-top:1px solid var(--line-2)}
.voc h4{font-family:var(--display);font-size:.95rem;font-weight:700;margin-bottom:.5rem}
.voc-sum{font-size:.9rem;color:var(--ink-2);line-height:1.65}
.themes{display:flex;flex-wrap:wrap;gap:.35rem;margin:.7rem 0}
.theme{font-size:.72rem;color:var(--accent);background:color-mix(in oklch,var(--accent) 12%,transparent);border-radius:.4rem;padding:.16rem .5rem}
.quote{font-size:.86rem;color:var(--ink-2);font-style:italic;padding:.5rem 0 .5rem .9rem;border-left:2px solid var(--line);margin:.5rem 0}
.quote cite{display:block;font-style:normal;font-size:.7rem;color:var(--muted);margin-top:.3rem}
.senti{margin:.9rem 0 .4rem}
.senti-bar{display:flex;height:7px;border-radius:4px;overflow:hidden;background:oklch(1 0 0 / 0.06)}
.senti-bar i{display:block;height:100%}
.s-pos{background:var(--pos)}.s-neu{background:var(--neu)}.s-neg{background:var(--neg)}
.senti-key{display:block;font-size:.72rem;color:var(--muted);margin-top:.35rem;font-family:var(--mono)}
.s-pos-t{color:var(--pos)}.s-neg-t{color:var(--neg)}
.srcline{font-size:.7rem;color:var(--muted);margin-top:.5rem}

.trend{font-size:.88rem;color:var(--ink-2);margin:1rem 0;line-height:1.6}
.trend-k{display:inline-block;font-size:.72rem;font-weight:700;color:var(--ink);margin-right:.4rem}

.tips{margin-top:.6rem}
.tips summary{cursor:pointer;font-family:var(--display);font-size:.92rem;font-weight:700;padding:.3rem 0;list-style:none}
.tips summary::-webkit-details-marker{display:none}
.tips summary::before{content:"▸";color:var(--accent);margin-right:.5rem;display:inline-block;transition:transform .2s}
.tips[open] summary::before{transform:rotate(90deg)}
.tips ul{list-style:none;margin-top:.5rem}
.tips li{font-size:.86rem;color:var(--ink-2);padding:.4rem 0 .4rem 1.3rem;position:relative;border-top:1px solid var(--line-2);line-height:1.55}
.tips li:first-child{border-top:0}
.tips li::before{content:"→";position:absolute;left:0;color:var(--accent)}

.eu{font-size:.78rem;color:oklch(0.82 0.07 230);background:color-mix(in oklch,oklch(0.6 0.12 230) 12%,transparent);border:1px solid color-mix(in oklch,oklch(0.6 0.12 230) 28%,transparent);border-radius:.6rem;padding:.6rem .8rem;margin-top:.9rem;line-height:1.55}
.eu-flag{display:block;font-weight:700;margin-bottom:.2rem}

.srcs{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem;margin-top:1.1rem;padding-top:1rem;border-top:1px solid var(--line-2)}
.srcs-k{font-size:.72rem;color:var(--muted);margin-right:.2rem}
.src{font-size:.76rem;color:var(--ink-2);text-decoration:none;border:1px solid var(--line);border-radius:.4rem;padding:.22rem .55rem;transition:color .2s,border-color .2s}
.src:hover{color:var(--accent);border-color:var(--accent)}

/* footer */
.foot{border-top:1px solid var(--line-2);margin-top:2rem;padding:2.4rem 0 3rem;text-align:center;color:var(--muted);font-size:.8rem;line-height:1.8}
.foot a{color:var(--accent);text-decoration:none}
.foot .arch-link{display:inline-block;margin-top:1rem;padding:.55rem 1.3rem;border:1px solid var(--accent);border-radius:.6rem;color:var(--accent);text-decoration:none;font-size:.85rem;transition:background .2s,color .2s}
.foot .arch-link:hover{background:var(--accent);color:var(--on-accent)}

/* recent dates */
.recent{margin-top:1.4rem;display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;justify-content:center}
.recent-k{font-size:.74rem;color:var(--muted);font-family:var(--mono)}
.recent a{font-size:.76rem;color:var(--ink-2);text-decoration:none;font-family:var(--mono);border:1px solid var(--line);border-radius:.4rem;padding:.2rem .5rem;transition:color .2s,border-color .2s}
.recent a:hover{color:var(--accent);border-color:var(--accent)}
.recent a.today{color:var(--accent);border-color:var(--accent)}

/* reveal — content visible by default; enhance only when motion allowed */
@media (prefers-reduced-motion:no-preference){
  .js .reveal{opacity:0;transform:translateY(14px);animation:rise .7s cubic-bezier(.16,1,.3,1) var(--delay,0ms) both}
  .js .reveal-on{animation-play-state:paused}
  .js .reveal-on.in{animation-play-state:running}
}
@keyframes rise{to{opacity:1;transform:none}}

@media (max-width:720px){
  .row-head{grid-template-columns:auto 1fr;grid-template-areas:"rank title" "img img"}
  .row-img{display:none}
  .kpis{flex-direction:row}
  .kpi{padding:.7rem .6rem}
  .kpi b{font-size:1.2rem}
}
@media (max-width:520px){
  .stat{flex:1 1 100%}
  .hero-top{gap:1rem}
}
`;
}

function script(date) {
  return `
document.documentElement.classList.add('js');
(function(){
  // blind box (delight only — content already visible)
  var box=document.getElementById('box');
  if(box){box.addEventListener('click',function(){
    var open=box.getAttribute('aria-pressed')==='true';
    box.setAttribute('aria-pressed',String(!open));
    var h=document.getElementById('boxHint'); if(h&&!open)h.textContent='🎉 今天的发现已揭晓';
  });}

  // tabs (roving, aria)
  var tabs=[].slice.call(document.querySelectorAll('[role=tab]'));
  function sel(t){
    tabs.forEach(function(x){
      var on=x===t; x.setAttribute('aria-selected',String(on)); x.tabIndex=on?0:-1;
      var p=document.getElementById(x.getAttribute('aria-controls')); if(p)p.hidden=!on;
    });
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){sel(t);t.focus();});
    t.addEventListener('keydown',function(e){
      var j=i; if(e.key==='ArrowRight')j=(i+1)%tabs.length; else if(e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length; else return;
      e.preventDefault(); sel(tabs[j]); tabs[j].focus();
    });
  });

  // reveal on scroll — enhances already-visible content
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
    [].slice.call(document.querySelectorAll('.reveal-on')).forEach(function(el){io.observe(el);});
  } else {
    [].slice.call(document.querySelectorAll('.reveal-on')).forEach(function(el){el.classList.add('in');});
  }

  // recent dates
  var rd=document.getElementById('recentDates');
  if(rd){fetch('data/archive-index.json').then(function(r){return r.json()}).then(function(d){
    var days=(d.days||[]).slice(0,7);
    rd.innerHTML='<span class="recent-k">最近捕获</span>';
    days.forEach(function(day,i){
      var a=document.createElement('a');
      a.href='daily/'+day.date+'.html';
      var p=day.date.split('-'); a.textContent=parseInt(p[1])+'/'+parseInt(p[2]);
      if(i===0)a.className='today';
      rd.appendChild(a);
    });
    var m=document.createElement('a'); m.href='archive.html'; m.textContent='全部 →'; rd.appendChild(m);
  }).catch(function(){});}
})();
`;
}

export function renderPage(_root, data) {
  const accent = data.palette?.accent || "#2dd4bf";
  const ink = inkOn(accent);
  const s = data.stats || {};
  const us = data.products.filter(p => p.region === "us");
  const eu = data.products.filter(p => p.region === "eu");
  const usHtml = us.map(productRow).join("\n");
  const euHtml = eu.map(productRow).join("\n");
  const globHtml = (data.global_products || []).map(globalRow).join("\n");
  const themeHtml = esc(data.theme).replace(/—(.+)$/, (_m, rest) => `<span class="em">—${rest}</span>`);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>爆款捕手 ${esc(data.date)} · ${esc(data.theme_short)}</title>
<meta name="description" content="爆款捕手 ${esc(data.date)}：每日扫描全球电商平台，捕捉异常爆款信号。${esc(data.theme_short)}">
<link rel="canonical" href="/">
<meta property="og:type" content="website">
<meta property="og:title" content="爆款捕手 ${esc(data.date)} · ${esc(data.theme_short)}">
<meta property="og:description" content="每日自动扫描全球电商平台，捕捉异常爆款信号，附 VOC 与商业可行性分析。">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${esc(accent)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='${encodeURIComponent(accent)}'/%3E%3Ctext x='50' y='72' font-size='62' text-anchor='middle'%3E🎯%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>${styles(accent, ink)}</style>
</head>
<body>
<a class="skip" href="#main">跳到主内容</a>

<div class="topbar"><div class="wrap">
  <span class="brand"><span class="dot"></span>爆款捕手 <small>Boom Catcher</small></span>
  <a class="arch" href="archive.html">历史捕获 →</a>
</div></div>

<header class="hero"><div class="wrap">
  <div class="hero-top">
    <div>
      <p class="date">${esc(data.date_cn)}</p>
      <h1>今日异常爆款<span class="sub">每日全球电商趋势情报</span></h1>
      <p class="theme-line">${themeHtml}</p>
    </div>
    <button class="box" id="box" type="button" aria-pressed="false" aria-label="开盲盒，查看今日发现">
      <span class="box-inner">
        <span class="box-face box-front" aria-hidden="true">🎁</span>
        <span class="box-face box-back">
          <span class="be" aria-hidden="true">${esc(data.hero_emoji)}</span>
          <span class="bn">${esc(s.outliers)} 个</span>
          <span class="bl">今日爆款</span>
        </span>
      </span>
      <span class="box-hint" id="boxHint">点我开盲盒</span>
    </button>
  </div>
  <div class="kpis reveal reveal-on" aria-label="今日数据概览">
    <div class="kpi"><b>${esc(s.scanned)}</b><span>扫描商品</span></div>
    <div class="kpi"><b>${esc(s.outliers)}</b><span>异常爆款</span></div>
    <div class="kpi"><b>${esc(s.platforms)}</b><span>覆盖平台</span></div>
  </div>
</div></header>

<nav class="tabs" aria-label="区域切换"><div class="wrap" role="tablist">
  <button class="tab" role="tab" id="tab-us" aria-controls="panel-us" aria-selected="true" tabindex="0">🇺🇸 美国区</button>
  <button class="tab" role="tab" id="tab-eu" aria-controls="panel-eu" aria-selected="false" tabindex="-1">🇪🇺 欧洲区</button>
  <button class="tab" role="tab" id="tab-global" aria-controls="panel-global" aria-selected="false" tabindex="-1">🌍 全域爆款</button>
</div></nav>

<main id="main" class="wrap">
  <section class="panel" id="panel-us" role="tabpanel" aria-labelledby="tab-us">
${usHtml.split("\n").map(l => l ? "    " + l : l).join("\n").replace(/<article class="row/g, '<article class="row reveal reveal-on')}
  </section>
  <section class="panel" id="panel-eu" role="tabpanel" aria-labelledby="tab-eu" hidden>
${euHtml.split("\n").map(l => l ? "    " + l : l).join("\n").replace(/<article class="row/g, '<article class="row reveal reveal-on')}
  </section>
  <section class="panel" id="panel-global" role="tabpanel" aria-labelledby="tab-global" hidden>
    <p class="panel-intro">以下产品在美国区和欧洲区同时出现异常增长信号，跨境套利潜力最强。</p>
${globHtml.split("\n").map(l => l ? "    " + l : l).join("\n").replace(/<article class="row/g, '<article class="row reveal reveal-on')}
  </section>
</main>

<footer class="foot"><div class="wrap">
  <nav class="recent" id="recentDates" aria-label="最近日期"></nav>
  <p style="margin-top:1.4rem">🤖 由 GitHub Actions + Claude 每日自动生成<br>数据来源：Amazon · TikTok · Temu · Shein · Reddit · Etsy 等 · 更新于 ${esc(data.generated_at)}</p>
  <a class="arch-link" href="archive.html">📦 浏览历史捕获</a>
</div></footer>

<script>${script(data.date)}</script>
</body>
</html>
`;
}

export function toSchemaJson(data) {
  const prod = (p, i) => ({
    rank: i + 1,
    region: p.is_global ? "global" : p.region,
    name: p.name, category: p.category, price_range: p.price,
    platforms: [{ name: "TikTok", trend_signal: "spiking", notes: p.badges?.[0] || "" }],
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
