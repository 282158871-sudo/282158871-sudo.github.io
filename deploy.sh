#!/usr/bin/env bash
set -euo pipefail
# 小学学习乐园 v4.258 → GitHub Pages（用户页，根路径，零代码改动）
# 在「小学学习乐园_v4.258」目录内运行：bash deploy.sh
cd "$(dirname "$0")"

echo "== 小学学习乐园 v4.258 → GitHub Pages 部署 =="

# 1. 检查 GitHub CLI 登录
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ 未登录 GitHub。请先在本机执行: gh auth login"
  exit 1
fi
OWNER=$(gh api user --jq .login)
echo "GitHub 账号: $OWNER"

# 2. 用户页仓库（根路径，环境等同已验证的线上根域名，sw.js 根路径绝对重定向可正常工作）
REPO="$OWNER.github.io"
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "⚠️ 已存在仓库 $REPO（GitHub 用户页）。"
  read -r -p "是否将其内容替换为本项目？(y/N) " ans
  if [ "${ans:-N}" != "y" ]; then
    echo "已取消。可改用普通项目仓库（但需改 sw.js 适配子路径），或手动处理。"
    exit 1
  fi
else
  gh repo create "$REPO" --public -d "小学学习乐园 v4.258"
fi

# 3. git 初始化并推送到 main
git init -q
git config user.email "$OWNER@users.noreply.github.com"
git config user.name "$OWNER"
git add -A
git commit -q -m "小学学习乐园 v4.258" || echo "(无新改动，跳过提交)"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$OWNER/$REPO.git"
git push -u origin main --force

echo
echo "✅ 已推送。GitHub 用户页通常几十秒内生效。"
echo "🌐 访问: https://$REPO/"
echo "   若首次未立即打开，等约 1 分钟（Pages 首次构建）再试。"
