# 🎓 台灣大學生：閃避二一 (Dodge the "F")

「期末考到了，教授的大刀揮下來了，你能活多久？」一款專為台灣大學生打造的像素風生存遊戲。

### 🎮 立即遊玩 (Play Now)
- 👉 [點擊這裡開始挑戰期末考](https://poh429.github.io/dodge-game/)（建議使用電腦瀏覽器獲得最佳體驗）

## 📖 遊戲介紹
這不只是一個遊戲，也是大學生活的縮影。玩家扮演背著書包的大學生，在充滿「不及格 (F)」的殘酷力場中求生存。四周是虎視眈眈的「大刀教授」，他們會無情地丟出紅色的 F。你的目標只有一個：活下去、拿高分、為校爭光！

## ✨ 核心特色
- 🏫 校際榮譽榜：內建全台 150+ 所大專院校名單，輸入 ID 並選擇學校，分數即刻列入學校排行榜。
- 🤝 雙人合作模式：支援單機雙人，揪室友一起挑戰極限。
- 📈 動態難度：分數越高，教授丟 F 越快，直到你被當。
- ☁️ 雲端即時計分：Firebase Firestore 同步全球玩家分數，減少作弊空間。

## 🕹️ 操作說明

| 模式 | 玩家 | 操作 | 角色特徵 |
| --- | --- | --- | --- |
| 單人 | P1 | ⬆️ ⬇️ ⬅️ ➡️ | 藍衣學生 |
| 雙人 | P2 | W A S D | 橘衣學生 |

## 🛠️ 技術架構 (Tech Stack)
- 核心框架：React 19
- 建置工具：Vite
- 遊戲引擎：HTML5 Canvas API（純手刻物理碰撞與繪圖邏輯）
- 後端服務：Google Firebase
  - Firestore：儲存排行榜數據 (NoSQL)
  - Authentication：匿名登入
- 部署：GitHub Pages（自動化 CI/CD）

## 💻 如何在本地執行 (Run Locally)
1) 複製專案
```bash
git clone https://github.com/poh429/dodge-game.git
cd dodge-game
```
2) 安裝依賴
```bash
npm install
```
3) 設定環境變數  
在專案根目錄建立 `.env`，填入你的 Firebase 設定（格式可參考 `src/App.jsx`）。
4) 啟動開發伺服器
```bash
npm run dev
```
5) 打開瀏覽器至 `http://localhost:5173`

## 🤝 貢獻與版權
- MIT License，歡迎自由學習與修改。
- 遊戲音效：Royalty Free 8-bit Music。
- 像素繪圖與程式邏輯：By PoH。

<p align="center">Made with ❤️ and lots of coffee by PoH.</p>
