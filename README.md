# 🎚️ Soundboard

A personal soundboard hosted on GitHub Pages. Works on desktop and mobile.

## Setup

### 1. Add your sound files
Drop your `.mp3` / `.wav` / `.ogg` files into the `public/sounds/` folder.

### 2. Register them in the config
Open `src/sounds.js` and add an entry for each file:

```js
{ id: "unique-id", label: "Button Label", file: "yourfile.mp3", emoji: "🔊", color: "#FF6B35" }
```

### 3. Configure your repo name
In `vite.config.js`, change the `base` value to match your GitHub repo name:

```js
base: "/your-repo-name/",
```

### 4. Deploy
Push to GitHub. The included GitHub Actions workflow (`deploy.yml`) will build and publish automatically.

Enable GitHub Pages:
- Go to **Settings → Pages**
- Source: **GitHub Actions**

Your soundboard will be live at:  
`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Local development

```bash
npm install
npm run dev
```

## Customising

| What | Where |
|------|-------|
| Sounds list | `src/sounds.js` |
| Colours / fonts | `src/index.css` |
| Repo base path | `vite.config.js` |

l