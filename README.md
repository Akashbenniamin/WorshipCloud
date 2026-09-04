# சத்தியவேதம் · Tamil Bible & Song Reader with Live Dual-Screen Projection

An elegant, editorial Tamil Bible and Hymnal reader designed for personal devotion, study, and live church sanctuary projection. Built for 100% free hosting on **GitHub Pages**.

---

## 🌟 Key Features

### 📖 Reader-First Experience
- **BSI Tamil O.V. (New Ortho - TAOVBSI)**: Powered by the complete New Ortho dataset with high-legibility typography.
- **Printed Bible Page Mapping**: Integrated printed-page index calibrated directly to physical BSI Bibles (e.g. Psalm 23 = page 683).
- **Parallel Reading (KJV)**: Toggle English King James Version side-by-side or stacked with Tamil verses.
- **Bespoke Color Themes**:
  - 📜 **சுருள் (Warm Parchment)**: Vintage paper tone for gentle reading.
  - 🌌 **நள்ளிரவு (Midnight Sanctuary)**: OLED deep dark with gold accents.
  - 🌿 **மரகதம் (Emerald Study)**: Calming dark forest aesthetic.
  - ☀️ **வெண்மை (Pristine Day)**: Crisp editorial light theme.
- **Omni-Search (`Ctrl + K`)**:
  - Jump directly by reference: `யோவான் 3:16`, `John 3:16`, `சங் 23`, `1 samuel 2:3`
  - Jump directly by printed page: `பக். 683`, `p 683`
  - Instant search across 18,700+ songs.

### 📺 1-Click Live Web Projection (Zero Server Costs)
- **Native Dual-Window Sync**: Communicates using the browser's native `BroadcastChannel` API. No server, WebSocket subscription, or network setup needed.
- **Dual Display Setup**: Open the reader on your laptop screen, click **"ப்ரொஜெக்டர்"** to pop out the clean display window, and drag it to the sanctuary projector or second monitor.
- **Live State Glow**: Verses and song stanzas currently projected glow with an active `LIVE` indicator in your reader so you always know what the congregation sees.
- **Presenter Controls**:
  - `B`: Toggle Blackout (instant pitch-black screen)
  - `C`: Toggle Clear (hides scripture while preserving background)
  - `Space` / `→`: Next verse or song stanza
  - `←`: Previous verse or song stanza
  - `F`: Fullscreen projector display
  - `Esc`: Unproject / exit presentation

### 🎵 18,700+ Song Catalog
- Structured lyrics breakdown: **பல்லவி (Pallavi)**, **அனுபல்லவி (Anupallavi)**, **சரணம் (Charanam 1, 2, 3...)**, **கோரஸ் (Chorus)**.
- Lazy-chunked JSON loading: Ultra-fast load times (< 20ms) with minimal bandwidth usage.

---

## 🚀 Running Locally

```bash
# 1. Enter the project folder
cd ortho-bible-web

# 2. Install dependencies
pnpm install # or npm install

# 3. Start local development server
pnpm dev # or npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deploying to GitHub Pages (100% Free)

This project is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the website on every push to `main`.

1. Initialize git and push to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Sathiyavedam Ortho Web Reader & Projector"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. On GitHub:
   - Go to your repository **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Within 1 minute, your website will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`
