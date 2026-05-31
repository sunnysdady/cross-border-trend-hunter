// generate.mjs — fully cloud-side daily generator for Boom Catcher.
// Runs in GitHub Actions: calls Claude (with built-in web search) to scan
// platforms and produce today's structured data, renders the page, writes
// the data files, and updates the archive index. The workflow then commits & pushes.
//
// Usage:
//   node scripts/generate.mjs            # real run (needs ANTHROPIC_API_KEY)
//   node scripts/generate.mjs --dry-run  # render pipeline test with built-in sample (no API)
import fs from "node:fs";
import path from "node:path";
import { renderPage, toSchemaJson } from "./lib/render.mjs";

const ROOT = process.cwd();
const MODEL = process.env.MODEL || "claude-sonnet-4-6";
const DRY = process.argv.includes("--dry-run");

// ---- date in Asia/Shanghai ----
function shanghai() {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  });
  const date = f.format(new Date());                 // YYYY-MM-DD
  const d = new Date(date + "T00:00:00+08:00");
  const wd = ["周日","周一","周二","周三","周四","周五","周六"][d.getUTCDay()];
  const [y, m, day] = date.split("-").map(Number);
  const iso = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai", year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",
  }).format(new Date()).replace(" ", "T") + "+08:00";
  return { date, date_cn: `${y}年${m}月${day}日 · ${wd}`, generated_at: iso };
}

// ---- the JSON contract the model must return ----
const SHAPE = `{
  "theme": "🧪 今天的爆款都在XXX — 一句不超过30字的副标题",
  "theme_short": "🧪 今天的爆款都在XXX",
  "hero_emoji": "🧪",
  "palette": { "bg":"#07121a","card":"#0f1f2b","accent_bg":"#0a2230","accent":"#2dd4bf","glow":"rgba(45,212,191,0.12)","grad":"linear-gradient(135deg,#2dd4bf 0%,#38bdf8 50%,#818cf8 100%)" },
  "stats": { "scanned": 200, "outliers": 6, "platforms": 13 },
  "cover_image_prompt": "英文图像提示词",
  "page_style": "一句话描述当天视觉风格",
  "products": [
    {
      "region": "us",                 // "us" 或 "eu"，US 3 个、EU 3 个
      "is_global": true,              // 是否在两区同时爆发（用于全域卡片）
      "rank_label": "#1 US · 全域",
      "emoji": "💧",
      "name": "中文名 / English Name",
      "category": "分类A · 分类B",
      "img_query": "english image search query",
      "price": "$45 – $150",
      "score": 86,                    // 异常指数 1-100
      "badges": ["📱 TikTok 爆火","🛒 Amazon 上升"],
      "links": [ {"label":"🛒 Amazon","url":"https://www.amazon.com/s?k=..."}, {"label":"📱 TikTok","url":"https://www.tiktok.com/search?q=..."} ],
      "anomaly": "为什么是异常值（中文，2-4句，基于真实搜索）",
      "voc_summary": "消费者为什么买（中文，2-4句）",
      "themes": ["主题1","主题2","主题3"],
      "quotes": [ {"text":"english quote","source":"Reddit r/xxx"} ],
      "sentiment": { "pos":70, "neu":20, "neg":10 },
      "sources": "Reddit, Amazon 评价, TikTok",
      "opportunity": "must",          // must|watch|wait|caution
      "profit": "60-72% 毛利率",
      "supply": "低（现货充足）",
      "competition": "温和（有空间）",
      "trend": "趋势可持续性判断（中文）",
      "tips": ["可执行建议1","建议2","建议3"],
      "eu_compliance": "仅 EU 产品填：合规提示；US 产品省略此字段"
    }
  ],
  "global_products": [
    {
      "rank_label": "🌍 全域 #1",
      "emoji": "💧",
      "name": "中文名 / English Name",
      "category": "全域爆款 · 分类",
      "img_query": "english image search query",
      "price": "US: $45-$150 · EU: €50-€160",
      "badges": ["🇺🇸 ...","🇪🇺 ..."],
      "anomaly": "全域信号说明（中文）",
      "biz": [
        {"label":"机会评级","kind":"badge","opp":"must"},
        {"label":"套利空间","kind":"val","value":"US→EU 溢价 15-25%"},
        {"label":"进入难度","kind":"val","value":"中"},
        {"label":"窗口期","kind":"val","value":"6-12 个月"}
      ],
      "tips": ["建议1","建议2","建议3"]
    }
  ]
}`;

const SYSTEM = `你是跨境电商趋势分析师"爆款捕手"。每天扫描全球电商平台，找出当天真正的"异常爆款"（不该火却火了的东西），分析它们为什么火，并产出结构化数据。

严格要求：
- 必须使用 web search 工具实际搜索 Amazon Movers&Shakers、TikTok、Temu、Shein、AliExpress、Etsy、eBay、Reddit 等，所有结论必须有真实搜索支撑，绝不编造产品、数据或引用。
- 选 6 个 outlier：US 3 个、EU 3 个；其中 2-3 个标记 is_global=true（两区同时爆发）。outlier 至少满足 2 条：多平台同时爆发 / 品类反常 / 价格异常 / 无大牌背书 / 非节日刚需 / 有跨境套利空间。
- 每个产品做 VOC（消费者声音）分析：3-5 个主题、情绪占比（三者相加=100）、2-3 条真实引用（注明来源）。
- 商业分析：机会评级、利润潜力、供应链门槛、竞争密度、趋势可持续性、2-3 条可执行建议。
- global_products 由 is_global 的产品衍生，2-3 个。
- 当天主题与配色必须有创意且与往日不同；配色为深色模式、视觉冲击强。
- 报告正文用简体中文；引用(quotes)保留英文原味。`;

function userPrompt(date, recentThemes) {
  return `今天是 ${date}。请执行完整的每日爆款扫描与分析流程。

避免和最近这些主题/配色重复：
${recentThemes}

完成后，**只输出一个 \`\`\`json 代码块**，内容严格符合下面的结构（字段名/类型完全一致，不要多余解释文字）：

\`\`\`json
${SHAPE}
\`\`\``;
}

function sampleData() {
  return {
    theme: "🧪 今天的爆款都在帮你「修理自己」 — 喝的水要充电、头痛靠冰敷",
    theme_short: "🧪 今天的爆款都在帮你「修理自己」",
    hero_emoji: "🧪",
    palette: { bg:"#07121a", card:"#0f1f2b", accent_bg:"#0a2230", accent:"#2dd4bf", glow:"rgba(45,212,191,0.12)", grad:"linear-gradient(135deg,#2dd4bf 0%,#38bdf8 50%,#818cf8 100%)" },
    stats: { scanned: 200, outliers: 6, platforms: 13 },
    cover_image_prompt: "biohacker flatlay", page_style: "teal biohacker dark theme",
    products: [
      { region:"us", is_global:true, rank_label:"#1 US · 全域", emoji:"💧",
        name:"氢水杯 / Hydrogen Water Bottle", category:"生物黑客 · 健康电器",
        img_query:"hydrogen water bottle generator", price:"$45 – $150", score:86,
        badges:["📱 TikTok #biohacking","🛒 Amazon 上升"],
        links:[{label:"🛒 Amazon",url:"https://www.amazon.com/s?k=hydrogen+water+bottle"},{label:"📱 TikTok",url:"https://www.tiktok.com/search?q=hydrogen+water+bottle"}],
        anomaly:"会给水充电的杯子卖到 $150，本质是身份消费，科学争议反而成了流量。",
        voc_summary:"信仰派报告精力变好，怀疑派认为是安慰剂，争议本身驱动传播。",
        themes:["生物黑客","健康焦虑","安慰剂争议"],
        quotes:[{text:"Placebo with a USB port.", source:"Reddit r/Biohackers"}],
        sentiment:{pos:45,neu:30,neg:25}, sources:"Reddit, TikTok",
        opportunity:"watch", profit:"55-70% 毛利率", supply:"中（电解片/认证）", competition:"温和（有空间）",
        trend:"持续性中，监管是最大风险。", tips:["别宣称医疗功效","内容电商获客","拼颜值与续航"] },
      { region:"eu", is_global:false, rank_label:"#1 EU", emoji:"🧹",
        name:"迷你桌面吸尘器 / Mini Desktop Vacuum", category:"桌面好物 · 小家电",
        img_query:"mini desktop vacuum", price:"€13 – €25", score:81,
        badges:["🛒 Temu 月销 10万+","📱 CleanTok"],
        links:[{label:"🛒 Amazon DE",url:"https://www.amazon.de/s?k=mini+tisch+staubsauger"},{label:"📱 TikTok",url:"https://www.tiktok.com/search?q=mini+desk+vacuum"}],
        anomaly:"教科书级套利单品，€2-4 进货 €14-25 卖。",
        voc_summary:"清键盘屑顺手，但吸力弱是高频抱怨。",
        themes:["桌面清洁","吸力偏弱","贴牌套利"],
        quotes:[{text:"Useless for anything heavier.", source:"Reddit r/gadgets"}],
        sentiment:{pos:58,neu:27,neg:15}, sources:"Reddit, Temu 评价",
        opportunity:"watch", profit:"55-70% 毛利率", supply:"低（现货充足）", competition:"红海（激烈）",
        trend:"常青小需求但同质化严重。", tips:["拼颜值套装","诚实标注用途","CE 认证"],
        eu_compliance:"需 CE 认证 + 多语言说明书" },
    ],
    global_products: [
      { rank_label:"🌍 全域 #1", emoji:"💧", name:"氢水杯 / Hydrogen Water Bottle",
        category:"全域爆款 · 生物黑客", img_query:"hydrogen water bottle",
        price:"US: $45-$150 · EU: €50-€160", badges:["🇺🇸 TikTok","🇪🇺 健康圈"],
        anomaly:"biohacking 全球同频，两地相同传播链路。",
        biz:[{label:"机会评级",kind:"badge",opp:"must"},{label:"套利空间",kind:"val",value:"US→EU 15-25%"},
             {label:"进入难度",kind:"val",value:"中"},{label:"窗口期",kind:"val",value:"6-12 个月"}],
        tips:["US 卖体验 EU 叠加可持续","不宣称医疗","vlog 跨境复用"] },
    ],
  };
}

function extractJson(text) {
  const fences = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  const raw = fences.length ? fences[fences.length - 1][1] : text;
  return JSON.parse(raw.trim());
}

async function callClaude(date, recentThemes) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 12000,
    system: SYSTEM,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 12 }],
    messages: [{ role: "user", content: userPrompt(date, recentThemes) }],
  });
  const text = resp.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return extractJson(text);
}

async function main() {
  const { date, date_cn, generated_at } = shanghai();

  const aiPath = path.join(ROOT, "data", "archive-index.json");
  const archive = JSON.parse(fs.readFileSync(aiPath, "utf-8"));
  const recentThemes = archive.days.slice(0, 6)
    .map(d => `- ${d.date}: ${d.theme}（${d.cover_color}）`).join("\n");

  let core = DRY ? sampleData() : await callClaude(date, recentThemes);

  // attach computed date fields
  const data = { ...core, date, date_cn, generated_at };

  // 1) render page + snapshot
  const html = renderPage(ROOT, data);
  fs.writeFileSync(path.join(ROOT, "index.html"), html);
  fs.mkdirSync(path.join(ROOT, "daily"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "daily", `${date}.html`), html);

  // 2) data json
  fs.mkdirSync(path.join(ROOT, "data", "daily"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "data", "daily", `${date}.json`),
    JSON.stringify(toSchemaJson(data), null, 2));

  // 3) archive index (prepend, dedupe same date)
  const top = data.products[0];
  const entry = {
    date, theme: data.theme_short, outliers_count: data.stats.outliers,
    top_product: top.name, top_category: top.category, cover_color: data.palette.accent,
  };
  archive.updated_at = generated_at;
  archive.days = [entry, ...archive.days.filter(d => d.date !== date)];
  archive.total_days = archive.days.length;
  fs.writeFileSync(aiPath, JSON.stringify(archive, null, 2));

  // sanity checks
  if (html.includes("<!--")) throw new Error("Unreplaced placeholder in HTML");
  const cards = (html.match(/product-card reveal-section/g) || []).length;
  console.log(`✅ ${date} generated — theme: ${data.theme_short}`);
  console.log(`   products: ${data.products.length}, global: ${data.global_products.length}, cards rendered: ${cards}`);
}

main().catch(e => { console.error("❌ generate failed:", e.message); process.exit(1); });
