# Movies To Watch

Next.js App Router 前端作業實作，包含：

- 電影搜尋（無限滾動）
- 電影詳情（演員、導演、預告片、評論）
- 待看清單（加入、移除、排序、LocalStorage 持久化）
- TMDB API Key 執行時彈窗配置（無 key 自動彈窗）
- 響應式 UI、友善錯誤狀態、測試與基本性能指標觀測

## Tech Stack

- Next.js 16 + App Router + TypeScript
- Tailwind CSS v4（自定 design tokens）
- TanStack Query（請求狀態與快取）
- Vitest + Testing Library（單元/組件測試）

## Quick Start

1. 安裝依賴

```bash
npm install
```

2. 啟動開發環境

```bash
npm run dev
```

3. 開啟 `http://localhost:3000`

首次進入若沒有可用 TMDB 金鑰，會自動彈窗要求輸入。  
你也可以在右上角隨時點「設定 API Key」修改。

## TMDB Key 配置方式

### 方案 A：執行時彈窗（預設）

- 在 UI 彈窗輸入：
- v4 Bearer Token（可含 `Bearer ` 前綴）
- 或 v3 API Key（32 碼）
- 儲存後會先做連線驗證，再寫入 LocalStorage。

### 方案 B：`.env` 後備配置

參考 `.env.example`：

```bash
NEXT_PUBLIC_TMDB_BEARER_TOKEN=
NEXT_PUBLIC_TMDB_API_KEY=
```

優先級：`LocalStorage runtime key > .env key`。

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:coverage
```

## Architecture

- `src/app`: 路由與頁面入口
- `src/features/movies`: 搜尋/詳情領域，含 API client、mapper、頁面元件
- `src/features/watchlist`: 待看清單模型與工具
- `src/features/settings`: TMDB key 解析與配置彈窗
- `src/shared`: providers、layout、UI primitives、共用工具

資料層模式：

1. `tmdb-client`：統一請求與錯誤狀態
2. `mappers`：防禦不穩定回應資料（array/object 差異、缺欄位）
3. `movie-service`：輸出穩定的領域模型供 UI 使用

## Testing

目前測試覆蓋：

- TMDB key 解析/優先級
- 搜尋與詳情 mapper 容錯
- watchlist 增刪、排序、資料解析
- 搜尋頁無 key 狀態
- 待看清單空態與已保存資料渲染

## Performance Notes

- 開發模式右下角提供 FCP/LCP 即時觀測（`PerformanceMeter`）
- 路由與圖片採用 Next 既有優化能力
- 搜尋結果採分頁無限載入，降低首屏壓力
