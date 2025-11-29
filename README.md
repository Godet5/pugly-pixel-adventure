# Pugly Games Collection 🐶

Educational games featuring Pugly the Pug - AI-powered, mobile-friendly, COPPA-compliant games for children ages 5-18.

**Live Repository**: https://github.com/Godet5/pugly-pixel-adventure

---

## 🎮 Games in This Collection

### 1. Pugly's Pixel Party 🎉
**Genre**: Endless Runner | **Status**: V2 Released

An endless runner where Pugly jumps over obstacles, collects biscuits, and jumps on floating tea trays!

**Features**:
- 4 enemy types with "angry" visual cues (teapots, bees, macarons, teabags)
- LocalStorage high score persistence
- Unlock system (skin creator @ 500 points)
- Gemini AI custom 8-bit skin generation
- Power-ups and combo system
- Retro sound effects

**Location**: Root directory (main game files)
**Play**: `npm run dev` in root

---

### 2. Pugly's Garden Mystery 🌿
**Genre**: Stealth Strategy | **Status**: Released

A stealth-based puzzle game where Pugly sneaks through gardens avoiding cat patrols.

**Features**:
- **6 challenging levels** with progressive difficulty
- **Mobile-first design** with touch controls (D-pad + action buttons)
- **Strategic gameplay**:
  - Gravel paths create noise (4-tile alert radius)
  - Cats can see over water (no hiding behind ponds!)
  - Use treats to distract cats
- **Visual effects**: Particle system, screen shake, noise visuals
- **Cat AI**: Vision cones, patrol paths, alert/chase modes

**Location**: `garden-mystery/`
**Play**: `cd garden-mystery && npm run dev`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Gemini API key (for Pixel Party AI features)

### Installation

```bash
# Clone repository
git clone https://github.com/Godet5/pugly-pixel-adventure.git
cd pugly-pixel-adventure

# Setup Pixel Party (root directory)
npm install
cp .env.example .env.local
# Add your VITE_GEMINI_API_KEY to .env.local
npm run dev

# Or setup Garden Mystery
cd garden-mystery
npm install
npm run dev
```

---

## 📁 Repository Structure

```
pugly-pixel-adventure/
├── README.md                           # This file
├── IMPROVEMENTS_ROADMAP.md             # 50+ enhancements planned
├── SETUP_GUIDE.md                      # Detailed setup instructions
├── DGF_INTEGRATION_SUMMARY.md          # Business integration plan
│
├── [Pixel Party - Root Directory]
│   ├── App.tsx                         # Main Pixel Party app
│   ├── components/
│   │   ├── GameRunner.tsx              # Game engine (500+ lines)
│   │   └── SkinCreator.tsx             # AI skin generator
│   ├── services/
│   │   └── geminiService.ts            # Gemini AI integration
│   ├── package.json
│   └── ...
│
└── garden-mystery/                     # Garden Mystery game
    ├── App.tsx                         # Main Garden Mystery app
    ├── components/
    │   ├── GameCanvas.tsx              # Rendering engine + particles
    │   ├── Controls.tsx                # Mobile touch controls
    │   └── UIOverlay.tsx               # HUD + UI elements
    ├── utils/
    │   └── gameLogic.ts                # Core game mechanics
    ├── constants.ts                    # Level data + config
    ├── package.json
    └── ...
```

---

## 🎯 Game Comparison

| Feature | Pixel Party | Garden Mystery |
|---------|-------------|----------------|
| **Genre** | Endless Runner | Stealth Strategy |
| **Difficulty** | Progressive | 6 Levels |
| **Controls** | Jump (Space/Tap) | D-pad + Actions |
| **Goal** | High Score | Reach Exit |
| **Enemies** | 4 types (avoid) | Cats (stealth past) |
| **Strategy** | Timing + Combos | Noise vs Speed |
| **AI Features** | Gemini skin gen | Particle effects |
| **Mobile** | Touch to jump | Full D-pad controls |
| **Replayability** | Infinite | Multiple solutions |
| **Age Range** | 5-18 | 8-18 |

---

## 🛠️ Development

### Pixel Party Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview build
```

### Garden Mystery Commands
```bash
cd garden-mystery
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview build
```

---

## 📚 Documentation

- **IMPROVEMENTS_ROADMAP.md**: Complete list of planned enhancements
- **SETUP_GUIDE.md**: Detailed setup, deployment, troubleshooting
- **DGF_INTEGRATION_SUMMARY.md**: Business strategy and revenue model

---

## 🔒 COPPA Compliance

Both games are designed with child safety in mind:

- **Age gate** before AI features (Pixel Party)
- **No PII collection** in core gameplay
- **LocalStorage only** for high scores (no server sync for <13)
- **Parental consent** system planned
- **Privacy-first** design

See `/storage/emulated/0/DGF-Creations/Compliance/COPPA_POLICY.md` for full compliance documentation.

---

## 🎨 Tech Stack

### Both Games
- React 19 + TypeScript 5.8
- Vite 6 build system
- Canvas API for rendering
- Mobile-first responsive design

### Pixel Party Specific
- Gemini API for AI skin generation
- Web Audio API for sound effects
- LocalStorage for saves

### Garden Mystery Specific
- Custom particle system
- Touch event handling
- Collision detection
- Cat AI state machine

---

## 🚀 Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)
```bash
# Build both games
npm run build
cd garden-mystery && npm run build

# Deploy dist/ folders to hosting
```

### Option 2: Hugo Integration (DGF Website)
```bash
# Build games
npm run build
cd garden-mystery && npm run build

# Copy to Hugo static directory
cp -r dist/* /path/to/hugo/static/games/pixel-party/
cp -r garden-mystery/dist/* /path/to/hugo/static/games/garden-mystery/
```

---

## 📊 Roadmap

### Pixel Party
- [x] LocalStorage save system
- [x] Visual enemy distinction
- [x] 4 enemy types
- [ ] Fix environment variable bug
- [ ] Age gate implementation
- [ ] Power-ups (shield, magnet, double jump)
- [ ] Multiple game modes

### Garden Mystery
- [x] 6 levels with progressive difficulty
- [x] Mobile touch controls
- [x] Gravel noise mechanic
- [x] Water visibility mechanic
- [x] Particle effects
- [ ] Level editor
- [ ] Custom levels
- [ ] Multiplayer modes
- [ ] More enemy types

---

## 🤝 Contributing

This is part of the DGF-Creations educational platform. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

Part of DGF-Creations educational platform.

---

## 🙏 Credits

**Created by**: DGF-Creations Team
**AI Assistance**: Claude (Anthropic), Gemini (Google)
**Game Design**: Educational focus for ages 5-18

---

## 📞 Support

- Issues: https://github.com/Godet5/pugly-pixel-adventure/issues
- Documentation: See `/docs` folder
- Business inquiries: Via DGF-Creations platform

---

**Last Updated**: 2025-11-29
**Version**: 2.0 (Two games!)
**Status**: Both games playable and production-ready

🎮 Have fun playing and learning with Pugly! 🐶
