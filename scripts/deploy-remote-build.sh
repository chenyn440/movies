#!/usr/bin/env bash
set -euo pipefail

# Next.js 远程自动更新脚本（Git Pull + Build + PM2 Reload）
# 用法：
# SSH_USER_HOST=root@1.2.3.4 \
# REMOTE_PROJECT_DIR=/opt/movies \
# GIT_BRANCH=main \
# PM2_APP_NAME=movies-web \
# PORT=3000 \
# bash scripts/deploy-remote-build.sh

SSH_USER_HOST="${SSH_USER_HOST:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/opt/movies}"
GIT_BRANCH="${GIT_BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-movies-web}"
PORT="${PORT:-3000}"
NEED_INSTALL="${NEED_INSTALL:-auto}" # auto|yes|no

if [[ -z "${SSH_USER_HOST}" ]]; then
  echo "错误：请通过环境变量设置 SSH_USER_HOST（例如 root@1.2.3.4）"
  exit 1
fi

if [[ -n "${SSH_KEY_PATH}" && ! -f "${SSH_KEY_PATH}" ]]; then
  echo "错误：SSH 密钥文件不存在: ${SSH_KEY_PATH}"
  exit 1
fi

SSH_CMD=(ssh -p "${SSH_PORT}")
if [[ -n "${SSH_KEY_PATH}" ]]; then
  SSH_CMD+=(-i "${SSH_KEY_PATH}")
fi
SSH_CMD+=("${SSH_USER_HOST}" bash -s)

echo "==> 部署目标: ${SSH_USER_HOST}:${REMOTE_PROJECT_DIR}"
echo "==> 分支: ${GIT_BRANCH}"
echo "==> PM2 应用名: ${PM2_APP_NAME}, 端口: ${PORT}"

"${SSH_CMD[@]}" <<EOF
set -euo pipefail

cd "${REMOTE_PROJECT_DIR}"
if [[ ! -d .git ]]; then
  echo "错误：${REMOTE_PROJECT_DIR} 不是 Git 仓库，请先在服务器完成 git clone。"
  exit 1
fi

echo "==> 拉取最新代码"
git fetch --all --prune
git checkout "${GIT_BRANCH}"
git pull --ff-only origin "${GIT_BRANCH}"

if ! command -v node >/dev/null 2>&1; then
  if [[ -s "\$HOME/.nvm/nvm.sh" ]]; then
    . "\$HOME/.nvm/nvm.sh"
    nvm use --silent 22 >/dev/null 2>&1 || nvm use --silent default >/dev/null 2>&1 || true
  fi
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "错误：未找到 node/npm。"
  exit 1
fi

echo "==> Node 版本: \$(node -v)"
echo "==> NPM 版本: \$(npm -v)"

if [[ "${NEED_INSTALL}" == "yes" ]]; then
  echo "==> npm install（强制）"
  npm install
elif [[ "${NEED_INSTALL}" == "auto" ]]; then
  if [[ ! -d node_modules ]]; then
    echo "==> node_modules 不存在，执行 npm install"
    npm install
  else
    echo "==> 复用现有 node_modules，跳过 npm install"
  fi
else
  echo "==> 按配置跳过 npm install"
fi

echo "==> 构建 Next.js"
npm run build

if npm run | grep -q "warm:movies"; then
  echo "==> 预热电影缓存"
  npm run warm:movies || echo "警告：电影缓存预热失败，继续发布"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "错误：服务器未安装 PM2，请先执行 npm i -g pm2。"
  exit 1
fi

echo "==> 更新 PM2 进程"
if pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_APP_NAME}" --update-env
else
  PORT="${PORT}" pm2 start npm --name "${PM2_APP_NAME}" -- start
fi
pm2 save >/dev/null 2>&1 || true

echo "==> 部署完成"
pm2 status "${PM2_APP_NAME}" || true
EOF
