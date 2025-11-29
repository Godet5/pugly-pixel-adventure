# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Overview

This is a **dual-game educational collection** featuring Pugly the Pug, targeting children ages 5-18 with COPPA compliance requirements. The repository contains two complete React/TypeScript games built with Vite.

**Live Repository**: https://github.com/Godet5/pugly-pixel-adventure

---

## Project Structure

### Two Independent Games

**1. Pugly's Pixel Party** (Root Directory)
- **Type**: Endless runner with AI-powered skin generation
- **Entry Point**: `App.tsx` (root)
- **Game Engine**: `components/GameRunner.tsx` (500+ lines, Canvas-based)
- **AI Integration**: `services/geminiService.ts` (Gemini API for 8-bit sprite generation)
- **Key Feature**: Unlock system (skin creator @ 500 points) + LocalStorage persistence

**2. Pugly's Garden Mystery** (`garden-mystery/`)
- **Type**: Stealth strategy puzzle game
- **Entry Point**: `garden-mystery/App.tsx`
- **Core Components**:
  - `GameCanvas.tsx` - Rendering engine with particle system
  - `Controls.tsx` - Mobile D-pad controls for touch devices
  - `UIOverlay.tsx` - HUD and game UI
  - `utils/gameLogic.ts` - Collision detection and game mechanics
- **Level System**: `constants.ts` contains 6 ASCII-mapped levels with cat patrol paths

---

## Development Commands

### Pixel Party (Root Directory)
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build
```

### Garden Mystery
```bash
cd garden-mystery
npm install              # Install dependencies (separate from root)
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview build
```

**Note**: Each game has **separate** `node_modules` and must be installed independently.

---

## Environment Configuration

### Pixel Party Requires Gemini API Key

**Setup**:
```bash
cp .env.example .env.local
# Edit .env.local and add your Gemini API key
```

**Environment Variable**:
```bash
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**⚠️ CRITICAL BUG**: `services/geminiService.ts:4` currently references `process.env.API_KEY` which is **INCORRECT** for Vite. Must use `import.meta.env.VITE_GEMINI_API_KEY`.

**Fix Required**:
```typescript
// In services/geminiService.ts line 4:
// WRONG:
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// CORRECT:
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```

This bug is documented in `IMPROVEMENTS_ROADMAP.md` Priority 1.1.

---

## Architecture Deep Dive

### Pixel Party Architecture

**Game State Flow**:
```
MENU → (Start Game) → PLAYING → (Game Over) → GAME_OVER → (Restart) → MENU
                           ↓
                    (Unlock at 500pts)
                           ↓
                    SKIN_CREATOR → (Generate with AI) → MENU
```

**Key Systems**:
1. **LocalStorage Persistence**: High scores saved in `localStorage.getItem('pugly_high_score')`
2. **Unlock Progression**: `UNLOCK_SCORE = 500` gates skin creator access
3. **Enemy System**: 4 types with "angry" visual cues (teapot, bee, macaron, teabag)
4. **Canvas Rendering**: All drawing in `GameRunner.tsx` using Canvas 2D API
5. **Sound Effects**: Web Audio API square/triangle wave synthesis

**Component Hierarchy**:
```
App.tsx
  ├─ GameRunner (when PLAYING)
  │   └─ Canvas-based game loop with requestAnimationFrame
  ├─ SkinCreator (when SKIN_CREATOR)
  │   └─ Gemini AI integration for sprite generation
  └─ Menu/GameOver screens (conditional rendering)
```

---

### Garden Mystery Architecture

**Game State Machine**:
```
Player Movement → Collision Detection → Cat AI Update → Render
     ↓                    ↓                    ↓           ↓
  D-pad input      gameLogic.ts        Vision cones    GameCanvas
  Controls.tsx         ↓                    ↓              ↓
                  Gravel noise        Patrol paths    Particles
                  Water visibility    Alert/Chase     Screen shake
```

**Level Data Structure** (`constants.ts`):
- **ASCII Map**: 2D array of strings representing tile types
- **Legend**: `#` = Wall, `.` = Path, `,` = Grass (hiding), `~` = Water, `:` = Gravel (noisy)
- **Cat Patrols**: Array of waypoint coordinates `[{x, y}, {x, y}, ...]`
- **Par Time**: Target completion time for each level

**Core Mechanics**:
1. **Gravel Noise System**: Stepping on `:` tiles alerts cats within 4-tile radius
2. **Water Visibility**: Cats can see over `~` tiles (line-of-sight not blocked)
3. **Particle System**: Dust on movement, sparkles on collectibles
4. **Screen Shake**: Triggered when cats enter ALERT or CHASE mode
5. **Touch Controls**: Mobile D-pad in `Controls.tsx` with directional buttons

**Component Responsibilities**:
- `GameCanvas.tsx`: Rendering, particle spawning, camera shake
- `Controls.tsx`: Touch event handling, button states
- `UIOverlay.tsx`: Level info, timer, collected items display
- `gameLogic.ts`: Collision detection, pathfinding, cat AI states

---

## Data Persistence

### Pixel Party
- **High Scores**: `localStorage.getItem('pugly_high_score')`
- **Generated Skins**: Stored in React state only (lost on refresh)
- **Note**: No server-side persistence (COPPA requirement for <13 age group)

### Garden Mystery
- **Progress**: Currently no persistence (each session starts fresh)
- **Future**: Could add level completion tracking to localStorage

---

## COPPA Compliance Requirements

**Critical for Both Games**:
1. **Age Gate**: Must implement before collecting any data from users <13
2. **Parental Consent**: Required for AI features (Pixel Party skin generation)
3. **No PII Collection**: Games use pseudonymous data only
4. **LocalStorage Only**: No server-side data sync for children <13
5. **Privacy Policy**: Must be accessible and updated with game specifics

**See**: `IMPROVEMENTS_ROADMAP.md` sections 1.2, 2.1 and `/storage/emulated/0/DGF-Creations/Compliance/COPPA_POLICY.md` for full requirements.

---

## Key Files Reference

### Documentation
- `README.md` - Complete game collection overview
- `IMPROVEMENTS_ROADMAP.md` - 50+ identified enhancements across 6 priority levels
- `SETUP_GUIDE.md` - Deployment, troubleshooting, COPPA checklist
- `DGF_INTEGRATION_SUMMARY.md` - Business strategy, revenue model ($90K ARR target)

### Configuration
- `.env.example` - Template for environment setup
- `.gitignore` - Enhanced with secret protection patterns
- `tsconfig.json` - TypeScript configuration (both games)
- `vite.config.ts` - Vite build configuration (both games)

### Type Definitions
- `types.ts` (root) - Pixel Party types (`GameState`, `PugSkin`)
- `garden-mystery/types.ts` - Garden Mystery types (`LevelConfig`, `TileType`, `CatState`, etc.)

---

## Common Development Tasks

### Adding New Levels to Garden Mystery

Edit `garden-mystery/constants.ts`:
```typescript
export const LEVELS: LevelConfig[] = [
  // ... existing levels
  {
    id: 7,
    name: "Your Level Name",
    description: "Level description",
    map: [
      "#########",
      "#P.....E#",
      "#########",
    ],
    catPatrols: [
      [{ x: 4, y: 1 }, { x: 6, y: 1 }] // Waypoints
    ],
    parTime: 30
  }
];
```

**Map Symbols**:
- `P` = Player start position
- `E` = Exit/goal
- `T` = Treat (collectible)
- `Y` = Yarn (distraction item)
- `#` = Wall/hedge (blocks movement and vision)
- `,` = Grass (hiding spot, slows movement)
- `~` = Water (obstacle, cats can see over)
- `:` = Gravel (creates noise when stepped on)

---

### Adding New Enemy Types to Pixel Party

Edit `components/GameRunner.tsx` in the `spawnSomething()` function and drawing logic:

```typescript
// In spawnSomething():
else if (rand < 0.XX) {
  obstacles.push({
    x: CANVAS_WIDTH,
    y: XXX, // Height position
    width: XX,
    height: XX,
    type: 'new_enemy_type'
  });
}

// In draw loop, add new enemy rendering:
obstacles.forEach(obs => {
  if (obs.type === 'new_enemy_type') {
    // Custom drawing logic
  }
});
```

---

## Testing & Debugging

### Pixel Party
**Key Debug Points**:
- `GameRunner.tsx:318-326` - Collision detection (adjust hitbox with ±5 pixel offsets)
- `App.tsx:22-30` - LocalStorage read (check console for errors)
- `services/geminiService.ts:8-24` - Gemini API response parsing

**Console Logs to Check**:
- "Failed to access local storage" (localStorage blocked)
- "Gemini Image Gen Error" (API key or quota issues)

### Garden Mystery
**Key Debug Points**:
- `utils/gameLogic.ts` - Cat AI state transitions, collision detection
- `components/GameCanvas.tsx` - Particle rendering, screen shake
- `constants.ts` - Level map parsing and validation

**Common Issues**:
- Cat patrols: Ensure waypoints are within map bounds
- Gravel noise: Check 4-tile radius calculation in `gameLogic.ts`
- Touch controls: Verify `Controls.tsx` button event handlers

---

## Deployment

### Production Build (Both Games)
```bash
# Pixel Party
npm run build
# Output: dist/

# Garden Mystery
cd garden-mystery
npm run build
# Output: garden-mystery/dist/
```

### Hugo Website Integration
```bash
# After building both games
cp -r dist/* /path/to/hugo/static/games/pixel-party/
cp -r garden-mystery/dist/* /path/to/hugo/static/games/garden-mystery/

# Hugo template example (layouts/games/single.html):
<iframe src="/games/pixel-party/index.html" width="100%" height="600px"></iframe>
```

### Static Hosting (Netlify, Vercel, etc.)
Deploy `dist/` folders directly. **Ensure** environment variables are set in hosting platform:
- `VITE_GEMINI_API_KEY` for Pixel Party

---

## Known Issues & Roadmap

### Priority 1 (Critical - Blocks Production)
- [ ] **Environment variable bug** in `services/geminiService.ts:4`
- [ ] **Age gate implementation** (COPPA requirement)
- [ ] **Error boundaries** (both games)
- [ ] **Mobile responsive canvas** (Pixel Party)

### Priority 2 (High - Improve UX)
- [ ] Power-ups (Pixel Party: shield, double jump, magnet)
- [ ] Level editor (Garden Mystery)
- [ ] Multiplayer modes
- [ ] Analytics integration

**Full Roadmap**: See `IMPROVEMENTS_ROADMAP.md` (6 priority levels, 50+ items)

---

## Business Context

**Part of DGF-Creations Educational Platform**:
- **Revenue Model**: Free-to-play → Premium subscription ($9.99/mo)
- **Target**: $90K ARR Year 1 (2,250 subscribers @ 15% conversion)
- **Age Range**: 5-18 (educational focus)
- **Compliance**: COPPA, FERPA, GDPR frameworks in place

**Strategic Goals** (from DGF Master Telos):
- G1: Website Launch (Revenue) - Games as lead magnets
- G2: HBC Platform Enhancement - Gamified breaks
- G9: COPPA/FERPA Compliance - Privacy-first design

**See**: `DGF_INTEGRATION_SUMMARY.md` for 6-week implementation timeline and multi-agent coordination strategy.

---

## Git Workflow

**Repository Structure**:
- `master` branch - Production-ready code
- No feature branches (direct commits to master)
- 4 commits total as of 2025-11-29

**Commit Message Format**:
```
feat: Brief description

Detailed changes:
- Change 1
- Change 2

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Never Commit**:
- `.env.local` files (secrets)
- `node_modules/` (dependencies)
- `dist/` folders (build artifacts)
- API keys or credentials

---

## Questions & Support

**GitHub Issues**: https://github.com/Godet5/pugly-pixel-adventure/issues
**Documentation**: All docs in root directory (README, ROADMAP, SETUP_GUIDE)
**Business/Compliance**: See `/storage/emulated/0/DGF-Creations/` directory structure

---

**Last Updated**: 2025-11-29
**Repository Status**: Production Ready (with known critical bug)
**Games**: 2 (Pixel Party V2 + Garden Mystery V1)
