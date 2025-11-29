# Pugly's Pixel Adventure - Setup Guide

Quick setup guide for development and deployment.

---

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Gemini API key (from Google AI Studio)

---

## Initial Setup

### 1. Install Dependencies
```bash
cd /data/data/com.termux/files/home/pugly-games-website
npm install
```

### 2. Configure Environment Variables
```bash
# Edit .env.local
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**⚠️ CRITICAL BUG FIX NEEDED**:
The current code has a mismatch. Before running, you need to fix:

**File**: `services/geminiService.ts` (line 4)

Change:
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

To:
```typescript
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy to `.env.local`

---

## Development

### Start Dev Server
```bash
npm run dev
```

Then open: `http://localhost:5173`

### Build for Production
```bash
npm run build
```

Output in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

---

## Project Structure

```
pugly-games-website/
├── components/
│   ├── GameRunner.tsx      # Main game engine (500+ lines)
│   └── SkinCreator.tsx     # AI skin generator UI
├── services/
│   └── geminiService.ts    # Gemini API integration
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main app component
├── index.tsx               # React entry point
├── index.html              # HTML entry point
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── IMPROVEMENTS_ROADMAP.md # Detailed improvement plan
└── SETUP_GUIDE.md          # This file
```

---

## Key Features

### Current Features ✅
- Endless runner gameplay
- Jump mechanics (space/tap)
- Obstacles: Teapots (ground), Bees (air)
- Platforms: Floating tea trays
- Collectibles: Biscuits (+50 points)
- Survival scoring (+5 per obstacle avoided)
- Custom skin generation via Gemini AI
- Multiple skins support
- Responsive UI (partial)
- Sound effects (Web Audio API)

### Missing Features ❌
- Persistent high scores (localStorage)
- Difficulty progression
- Power-ups
- Achievements
- Tutorial/onboarding
- Mobile optimization
- Error boundaries
- Testing
- Accessibility features

See `IMPROVEMENTS_ROADMAP.md` for complete list.

---

## Testing the Game

### Basic Playthrough
1. Start dev server
2. Click "START TEA" button
3. Press SPACE or tap screen to jump
4. Collect biscuits (golden circles)
5. Avoid teapots (ground) and bees (air)
6. Jump on silver tea trays for platform biscuits
7. Game over when you hit an obstacle

### Testing Skin Generator
1. Click "NEW SKIN" button (+ icon)
2. Enter a prompt (e.g., "A pug wearing a crown")
3. Wait for Gemini to generate
4. New skin appears in selection grid
5. Select to play with custom skin

**Note**: Requires valid Gemini API key!

---

## Common Issues

### Issue: "Cannot read properties of undefined (reading 'API_KEY')"
**Cause**: Environment variable mismatch
**Fix**: See "Critical Bug Fix" in Setup section above

### Issue: Skin generation fails
**Cause**: Invalid/missing API key or API quota exceeded
**Fix**:
- Verify API key in `.env.local`
- Check Gemini API quota in Google Cloud Console
- Ensure billing is enabled (if required)

### Issue: Game runs slow on mobile
**Cause**: Fixed canvas size + no optimization
**Fix**: See `IMPROVEMENTS_ROADMAP.md` Priority 3.5

### Issue: High scores don't persist
**Cause**: No localStorage implementation
**Fix**: See `IMPROVEMENTS_ROADMAP.md` Priority 2.1

---

## Deployment

### Option 1: Hugo Static Site Integration

```bash
# Build production bundle
npm run build

# Copy to Hugo static directory
cp -r dist/* /data/data/com.termux/files/home/dgf-creations-website/static/games/pugly-pixel-adventure/

# Rebuild Hugo site
cd /data/data/com.termux/files/home/dgf-creations-website
hugo
```

Then create Hugo content file:
```bash
# Create content/games/pugly-pixel-adventure.md
---
title: "Pugly's Pixel Adventure"
description: "A retro endless runner featuring everyone's favorite pug!"
type: games
---

<iframe src="/games/pugly-pixel-adventure/index.html" width="100%" height="600px" frameborder="0"></iframe>
```

### Option 2: Standalone Deployment

Deploy `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any static host

**Environment Variables**: Configure `VITE_GEMINI_API_KEY` in hosting platform

---

## Development Workflow

### Before Starting Work
1. Pull latest changes (if using git)
2. Check `IMPROVEMENTS_ROADMAP.md` for current priorities
3. Run `npm install` to ensure dependencies are updated

### Making Changes
1. Create feature branch (if using git)
2. Make changes
3. Test locally with `npm run dev`
4. Build and preview with `npm run build && npm run preview`
5. Update documentation if needed

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add comments for complex logic
- Keep components under 300 lines (refactor if larger)

---

## Performance Tips

### Development
- Use `npm run dev` for hot reload
- Keep browser DevTools open for console errors
- Test on multiple screen sizes (responsive mode)

### Production
- Minimize bundle size (check with `npm run build`)
- Optimize images (use tinypng.com)
- Enable compression on server
- Use CDN for assets (optional)

---

## COPPA Compliance Checklist

**⚠️ IMPORTANT**: If targeting children under 13, you MUST:

- [ ] Add age gate before skin generation
- [ ] Implement parental consent flow
- [ ] Disable analytics for users <13
- [ ] Add privacy policy
- [ ] No persistent cookies for <13 users
- [ ] Clear data deletion mechanism

See: `/storage/emulated/0/DGF-Creations/Compliance/COPPA_POLICY.md`

---

## Support & Resources

### Documentation
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Gemini API Docs](https://ai.google.dev/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Game Development
- [HTML5 Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### DGF Creations
- Main docs: `/data/data/com.termux/files/home/CLAUDE.md`
- System architecture: `/storage/emulated/0/DGF-Creations/001-System/`

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing (when implemented)
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report

# Code Quality (when implemented)
npm run lint             # Run ESLint
npm run type-check       # TypeScript validation
npm run format           # Prettier formatting
```

---

## Next Steps

1. **Fix Critical Bug**: Update `geminiService.ts` env variable
2. **Test Locally**: Run `npm run dev` and playtest
3. **Review Roadmap**: Read `IMPROVEMENTS_ROADMAP.md`
4. **Choose Phase**: Start with Phase 1 (Foundation)
5. **Implement**: Begin with priority 1 improvements

---

**Last Updated**: 2025-11-28
**Status**: Ready for Development
