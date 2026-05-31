# Design

## Theme
暗色「趋势情报台」。深中性墨底 + 每日单一强调色。气质参考：彭博终端的数据可信感 × 独立刊物的排版层次，去掉一切霓虹/渐变/粒子装饰。强调色是当天身份的唯一色彩承载点（评分、排名、链接、关键数字），其余靠字号/字重/留白建立秩序。

## Color
- 策略：Committed（单一每日强调色承载品牌，其余克制中性）。
- `--bg` 深墨 `oklch(0.17 0.008 260)`（近黑、微冷中性，非纯黑）
- `--surface` 面板 `oklch(0.21 0.01 260)`
- `--surface-2` 次级 `oklch(0.25 0.012 260)`
- `--ink` 正文 `oklch(0.95 0.005 260)`（对底 ≥14:1）
- `--ink-2` 次要正文 `oklch(0.80 0.01 260)`（≥7:1，仍达 AA 正文）
- `--muted` 仅用于小标签 `oklch(0.66 0.01 260)`（达 AA 大字/标签）
- `--line` 发丝线 `oklch(1 0 0 / 0.10)`
- `--accent` 每日色（数据注入）。文字压在 accent 上时按亮度自动选黑/白。

## Typography
- 展示/标题：**Bricolage Grotesque**（Google Fonts）——有态度的工业感无衬线，非 ban-list，避开 Inter/DM/Space 同质化。
- 正文：system-ui + CJK 系统栈（PingFang SC / Noto Sans SC），原生覆盖中文、加载快。
- 数据/数字：**JetBrains Mono**（tabular nums）——评分、占比、价格用等宽，给「终端级」可信度。
- 家族数 = 3（展示 + 正文 + 等宽），符合上限。
- 标题 `text-wrap:balance`；正文 `pretty`；行长 ≤72ch。

## Components
- **盲盒按钮**：保留品牌记忆点，语义化 `<button>`，可键盘操作；点开是惊喜动效，但内容默认已可见，绝不当可见性开关。
- **趋势条目（dossier row）**：非等宽卡片网格。#1 给 hero 级处理；其余为情报行——大排名数字 + 产品名标题 + 等宽数据条（评分/机会/毛利）+ 异常分析正文 + 真实情绪条 + 引用 pull-quote + 行动清单。
- **区域 tab**：真 `<button>` + `role=tab` + aria-selected + 键盘左右切换。
- **情绪条**：正/中/负三段，带可读标注，非纯装饰。

## Layout
- 单列阅读流，最大宽 ~860px，长滚动、克制配速。
- 流式间距 `clamp()`，分组紧、区块松，建立呼吸节奏。
- 数据条用 flex-wrap，非强制网格。

## Motion
- 入场：内容**默认可见**；JS+IO+允许动效时才叠加轻微上浮淡入（`animation ... both`，IO 不触发也不会隐藏）。
- 盲盒翻转、tab 切换有动效；`prefers-reduced-motion` 全部降级为瞬时/淡入。
- 移除常驻 canvas 粒子（耗电 + 装饰 slop）。

## Bans honored
无渐变文字、无粒子、无毛玻璃默认、无侧边色条、无等宽卡片堆、无每段小写 eyebrow。
