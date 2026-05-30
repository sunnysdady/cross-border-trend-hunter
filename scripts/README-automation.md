# 自动化说明 (Automation)

爆款捕手有**两层**自动化，职责不同，缺一不可：

## 1. 生成内容（每天一次）— 由 Cowork 定时任务负责
真正"找爆款 + 写报告"的活需要联网搜索 + 分析，**GitHub Actions 做不了**，
所以由 Cowork 的定时任务每天触发 Claude 跑一遍 `skill/SKILL.md` 的流程：
扫描平台 → 找异常值 → VOC 分析 → 生成 `index.html` 和 `data/daily/今天.json`
→ 更新 `data/archive-index.json` → 提交并推送。

> 前提：把这个仓库文件夹连接到 Cowork（或确保定时任务能访问到本地 git 仓库）。

## 2. 同步推送（每小时兜底）— 由 launchd 负责
`auto-push.sh` 只做一件事：把本地已有改动 commit + push 上去（兜底用）。
它**不会生成新内容**。

安装（一次即可，自动填好你的用户名路径）：
```bash
bash scripts/install-launchd.sh
```
卸载：
```bash
launchctl unload ~/Library/LaunchAgents/com.boomcatcher.autopush.plist
```

## 历史遗留 bug（已修复）
- `scripts/deploy.sh` 原来指向不存在的 `site/` 目录 → 改为自动定位仓库根目录。
- `scripts/auto-push.sh` 原来写死 iCloud 路径 → 改为自定位（`$(dirname)/..`）。
- `com.boomcatcher.autopush.plist` 原来写死 `/Users/mac/...` → 改用 install 脚本动态生成。
- `archive.html` 的卡片渲染缺少闭合标签 + 非法嵌套 `<style>` → 已修复。
- 仓库缺少 GitHub Actions 工作流（首页的 "Get started with Actions" 即因此而来）；
  生成逻辑改用 Cowork 定时任务，无需 Actions。
