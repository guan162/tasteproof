# TasteProof：目前真正完成的項目與最後的連線步驟（2026-10-11）

## 已完成

- GitHub Pages 公開互動展示（明確標示模擬資料）：`https://guan162.github.io/tasteproof/`
- 真實 Qloo 資料分析介面：`https://guan162.github.io/tasteproof/live.html`，目前尚未接上後端
- 伺服器端 Qloo 整合程式：`worker/index.mjs`
- 官方文件格式的查詢：`GET /search`（可選的參考品牌搜尋）與 `GET /v2/insights`（城市文化標籤分析）
- 本機模擬介接測試與 GitHub Actions 自動化測試
- 安全限制：密鑰不出現在公開前端或程式碼；每次最多 1 個基準城市 + 3 個比較城市；API 失敗不以示範資料冒充結果；Cloudflare Rate Limiting 限速。

## 尚未完成（不可冒充）

- 尚未取得合格的 Qloo 活動 API 密鑰，所以沒有成功進行任何真實 Qloo 認證查詢。
- 尚未部署 Cloudflare Worker，`docs/config.js` 仍保持空白；Live 按鈕不會啟動。
- 尚未提交 Devpost；目前沒有獎金與被動收入。

## 需要帳號持有人完成的必要授權

1. 透過官方 [Qloo Agentic Hackathon](https://qloo.devpost.com/rules) 參加活動，依主辦方官方連結申請活動 API 金鑰。金鑰 **不要傳到聊天室或公開 GitHub**。
2. 若使用 Cloudflare Workers 部署，需在你授權的 Cloudflare 帳號內建立 Worker 並於「加密環境變數／Secrets」中設定 `QLOO_API_KEY`。可直接使用 [wrangler.toml](wrangler.toml) 與 [worker/index.mjs](worker/index.mjs)，來源應使用核發憑證所指定的 API 網域；活動通常使用 `https://hackathon.api.qloo.com`。
3. 完成後，只需提供公開的 Worker 網址（不含密鑰）。就能由 GitHub 連接更新 `docs/config.js`，再進行實際 API 驗收。

## 金額與驗收標準

- 投入現金：NT$0。
- 已驗證收入：NT$0。
- 現階段驗收：Github Actions 程式測試通過不等於 Qloo 官方 API 活資料驗證通過。
- 比賽獎金若得獎是一次性收入，不是每月 NT$30,000 的保證收益。
