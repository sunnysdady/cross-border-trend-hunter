# GitHub 云端自运营说明（不依赖本地电脑）

爆款捕手现在可以**完全在 GitHub 上自运营**：GitHub Actions 每天定时触发 → 调用 Claude API（自带联网搜索）生成当天报告 → 自动 commit & push 回 main → Vercel 自动部署上线。全程不需要开任何电脑。

```
GitHub Actions (cron 每天 09:00 北京时间)
   └─ node scripts/generate.mjs
        └─ Claude API + web search  →  扫描平台 / 找异常爆款 / VOC+商业分析
        └─ 渲染 index.html + daily/<日期>.html
        └─ 写 data/daily/<日期>.json + 更新 data/archive-index.json
   └─ git commit & push  →  Vercel 自动部署
```

## 一次性设置（约 3 分钟）

### 1. 上传这些文件到仓库
- `.github/workflows/daily.yml`
- `scripts/generate.mjs`
- `scripts/lib/render.mjs`
- `package.json`
（`daily/2026-05-21.html` 作为视觉母版必须保留在仓库里——生成脚本从它提取页面样式外壳。）

### 2. 设置 API Key 为仓库 Secret
仓库 → **Settings → Secrets and variables → Actions → New repository secret**
- Name: `ANTHROPIC_API_KEY`
- Secret: 你的 Anthropic API key

> ⚠️ key 只放进 Secret，**不要**写进任何代码文件或聊天记录。怀疑泄露就去 console.anthropic.com 轮换。

### 3. 确认 Actions 有写权限
仓库 → **Settings → Actions → General → Workflow permissions** → 选 **Read and write permissions** → Save。
（workflow 里已声明 `permissions: contents: write`，这步是双保险。）

### 4. 立即测试一次
仓库 → **Actions** 标签 → 左侧选 **Daily Trend Generation** → 右上 **Run workflow**。
跑完后看仓库是否多了一次 "📦 Daily trend update" 提交，Vercel 会随之部署。

之后每天 09:00（北京时间）自动运行，无需任何手动操作。

## 常见问题

- **GitHub cron 不准时？** 正常。GitHub 定时任务通常会延迟几分钟到半小时，不影响结果。
- **想换时间？** 改 `daily.yml` 里的 `cron`（用 UTC，北京时间 = UTC + 8）。例如北京 7 点 = `"0 23 * * *"`。
- **想换模型 / 省钱？** 改 workflow 里 `MODEL`（如 `claude-haiku-4-5` 更便宜，或换更强的 opus）。Gemini 路线需另写脚本。
- **成本？** 一天一次、含十余次联网搜索的小任务，按量计费通常每月几美元量级，具体以 Anthropic 账单为准。
- **本地想先验证渲染？** `node scripts/generate.mjs --dry-run` 用内置样例数据跑一遍渲染（不调 API、不花钱），生成 index.html 供预览。
- **某天 API 失败？** 该次 Actions 会失败并保留上一天的页面，不会推坏内容；可在 Actions 页手动重跑。

## 和旧本地脚本的关系
`scripts/auto-push.sh` / `install-launchd.sh` / `com.boomcatcher.autopush.plist` 是**旧的本地兜底方案**，启用 GitHub 自运营后**不再需要**，可忽略或删除。
