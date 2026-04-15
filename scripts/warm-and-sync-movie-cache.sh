#!/usr/bin/env bash
set -euo pipefail

SSH_USER_HOST="${SSH_USER_HOST:-}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/opt/movies}"
LOCAL_DB_PATH="${LOCAL_DB_PATH:-data/app.sqlite}"

if [[ -z "${SSH_USER_HOST}" ]]; then
  echo "错误：请通过环境变量设置 SSH_USER_HOST（例如 root@1.2.3.4）"
  exit 1
fi

if [[ -n "${SSH_KEY_PATH}" && ! -f "${SSH_KEY_PATH}" ]]; then
  echo "错误：SSH 密钥文件不存在: ${SSH_KEY_PATH}"
  exit 1
fi

echo "==> 本机预热电影缓存"
npm run warm:movies

echo "==> 合并 SQLite WAL 到主文件"
python3 - <<'PY'
import sqlite3
conn = sqlite3.connect("data/app.sqlite")
cur = conn.cursor()
cur.execute("PRAGMA wal_checkpoint(FULL);")
print(cur.fetchall())
conn.close()
PY

if [[ ! -f "${LOCAL_DB_PATH}" ]]; then
  echo "错误：本地缓存数据库不存在: ${LOCAL_DB_PATH}"
  exit 1
fi

echo "==> 上传 SQLite 到 ${SSH_USER_HOST}:${REMOTE_PROJECT_DIR}/data/app.sqlite"
ssh -p "${SSH_PORT}" -i "${SSH_KEY_PATH}" "${SSH_USER_HOST}" \
  "mkdir -p '${REMOTE_PROJECT_DIR}/data' && cp '${REMOTE_PROJECT_DIR}/data/app.sqlite' '${REMOTE_PROJECT_DIR}/data/app.sqlite.bak' 2>/dev/null || true"

scp -P "${SSH_PORT}" -i "${SSH_KEY_PATH}" "${LOCAL_DB_PATH}" \
  "${SSH_USER_HOST}:${REMOTE_PROJECT_DIR}/data/app.sqlite"

echo "==> 重启远端应用"
ssh -p "${SSH_PORT}" -i "${SSH_KEY_PATH}" "${SSH_USER_HOST}" \
  "source \$HOME/.nvm/nvm.sh >/dev/null 2>&1 || true; pm2 restart movies-web --update-env"

echo "==> 同步完成"
