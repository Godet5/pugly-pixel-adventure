import React, { useEffect, useRef, useState } from 'react';
import { PugSkin } from '../types';

interface GameRunnerProps {
  activeSkin: PugSkin;
  onGameOver: (score: number) => void;
  onBack: () => void;
}

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.6;
const JUMP_FORCE = -13; 
const GROUND_Y = 380;

// Platform Heights
const PLATFORM_LOW_Y = 280;
const PLATFORM_HIGH_Y = 180;

// Score Multiplier Threshold
const UPPER_DIMENSION_Y = 230;

export const GameRunner: React.FC<GameRunnerProps> = ({ activeSkin, onGameOver, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [storedItem, setStoredItem] = useState<'shield' | 'sugar' | null>(null);
  
  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Functions
  const playSound = (type: 'jump' | 'score' | 'biscuit' | 'levelup' | 'powerup' | 'smash' | 'store') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'score') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.02, now); 
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start();
      osc.stop(now + 0.1);
    } else if (type === 'biscuit') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start();
      osc.stop(now + 0.15);
    } else if (type === 'levelup') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start();
      osc.stop(now + 0.6);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start();
      osc.stop(now + 0.5);
    } else if (type === 'store') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
    } else if (type === 'smash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start();
      osc.stop(now + 0.2);
    }
  };

  // Exposed for the UI button
  const activatePowerUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Init Audio
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game Loop Variables
    let frameId = 0;
    let score = 0;
    let internalLevel = 1;
    let gameSpeed = 5;
    let frameCount = 0;
    let totalFrames = 0; 
    let shakeIntensity = 0;
    
    // Spawning controls
    let nextSpawnTime = 60; 
    let spawnRateMin = 60;
    let spawnRateMax = 140;

    // Power-Up State
    let storedPowerUp: 'shield' | 'sugar' | null = null;
    let activeEffectType: 'shield' | 'sugar' | null = null;
    let activeEffectTimer = 0; // Frames

    // Player State
    const player = {
      x: 50,
      y: 300,
      width: 40,
      height: 40,
      dy: 0,
      grounded: false
    };

    // Entities
    interface Obstacle {
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'teapot' | 'bee' | 'macaron' | 'teabag';
        vx?: number;
        centerY?: number; 
        phase?: number; 
    }

    let obstacles: Obstacle[] = [];
    let platforms: Array<{ x: number, y: number, width: number, height: number }> = [];
    let biscuits: Array<{ x: number, y: number, width: number, height: number, collected: boolean }> = [];
    let powerUps: Array<{ x: number, y: number, width: number, height: number, type: 'shield' | 'sugar' }> = [];
    let particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }> = [];
    
    const spawnParticles = (x: number, y: number, color: string, count: number, speedMultiplier: number = 1) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6 * speedMultiplier,
          vy: (Math.random() - 0.5) * 6 * speedMultiplier,
          life: 1.0,
          color,
          size: Math.random() * 5 + 2
        });
      }
    };

    // Helper: Draw Default Pug
    const drawDefaultPug = (x: number, y: number) => {
      // Body
      ctx.fillStyle = '#E5C098'; // Fawn color
      ctx.fillRect(x, y + 10, 40, 30);
      
      // Pink Tutu
      ctx.fillStyle = '#F48FB1'; // Soft pink
      ctx.fillRect(x - 5, y + 25, 50, 15);
      // Ruffles
      ctx.fillStyle = '#F8BBD0';
      ctx.fillRect(x - 5, y + 35, 50, 5);

      // Head
      ctx.fillStyle = '#E5C098';
      ctx.fillRect(x + 20, y, 30, 30);
      
      // Ears
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 20, y, 10, 10);
      ctx.fillRect(x + 40, y, 10, 10);
      
      // Flower Crown
      ctx.fillStyle = '#FFEB3B'; 
      ctx.fillRect(x + 22, y - 5, 6, 6);
      ctx.fillStyle = '#F06292'; 
      ctx.fillRect(x + 32, y - 5, 6, 6);
      ctx.fillStyle = '#9C27B0'; 
      ctx.fillRect(x + 42, y - 5, 6, 6);

      // Mask
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 35, y + 15, 15, 15);
      
      // Eye
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 30, y + 10, 5, 5);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 32, y + 12, 2, 2);
    };

    const skinImage = new Image();
    let skinLoaded = false;
    if (activeSkin.imageUrl) {
      skinImage.src = activeSkin.imageUrl;
      skinImage.onload = () => { skinLoaded = true; };
    }

    const drawPlayer = () => {
      if (activeSkin.imageUrl && skinLoaded) {
        ctx.drawImage(skinImage, player.x, player.y, player.width, player.height);
      } else {
        drawDefaultPug(player.x, player.y);
      }

      // Draw active effect visuals
      if (activeEffectType === 'shield') {
         ctx.strokeStyle = `rgba(255, 235, 59, ${0.5 + Math.sin(frameCount * 0.2) * 0.3})`;
         ctx.lineWidth = 4;
         ctx.beginPath();
         ctx.arc(player.x + player.width/2, player.y + player.height/2, 40, 0, Math.PI * 2);
         ctx.stroke();
      } else if (activeEffectType === 'sugar') {
         // Sugar Rush Aura
         ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(frameCount * 0.5) * 0.4})`;
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.arc(player.x + player.width/2, player.y + player.height/2, 35, 0, Math.PI * 2);
         ctx.stroke();
      }
    };

    // --- LOGIC: Spawning ---
    
    const spawnPlatform = (xOffset: number, yLevel: number, hasItem: boolean) => {
        const platWidth = 120;
        platforms.push({
          x: CANVAS_WIDTH + xOffset,
          y: yLevel,
          width: platWidth,
          height: 15
        });

        if (hasItem) {
           if (Math.random() < 0.1) {
              powerUps.push({
                 x: CANVAS_WIDTH + xOffset + 40,
                 y: yLevel - 40,
                 width: 30,
                 height: 30,
                 type: Math.random() > 0.6 ? 'sugar' : 'shield'
              });
           } else {
               biscuits.push({
                x: CANVAS_WIDTH + xOffset + 40, 
                y: yLevel - 40, 
                width: 25,
                height: 25,
                collected: false
              });
           }
        }
    };

    const spawnSomething = () => {
      const rand = Math.random();
      
      const canSpawnBees = internalLevel >= 2;
      const canSpawnStairs = internalLevel >= 2; 
      const canSpawnMacarons = internalLevel >= 2;
      const canSpawnTeabags = internalLevel >= 3;
      
      // Pattern 1: The Staircase
      if (canSpawnStairs && rand < 0.15) {
          spawnPlatform(0, PLATFORM_LOW_Y, true);
          spawnPlatform(200, PLATFORM_HIGH_Y, true);
          return 60;
      }

      // Pattern 2: Bobbing Teabag
      else if (canSpawnTeabags && rand < 0.30) {
          obstacles.push({
            x: CANVAS_WIDTH,
            y: 200,
            width: 30,
            height: 40,
            type: 'teabag',
            centerY: 200,
            phase: Math.random() * Math.PI * 2
          });
      }

      // Pattern 3: Rolling Macaron
      else if (canSpawnMacarons && rand < 0.45) {
          obstacles.push({
            x: CANVAS_WIDTH,
            y: 355, 
            width: 30,
            height: 25,
            type: 'macaron',
            vx: 3 
          });
      }

      // Pattern 4: High Platform
      else if (rand < 0.60) {
          spawnPlatform(0, PLATFORM_LOW_Y, true);
      }

      // Pattern 5: Bees
      else if (canSpawnBees && rand < 0.75) {
        obstacles.push({
          x: CANVAS_WIDTH,
          y: 260, 
          width: 35,
          height: 30,
          type: 'bee'
        });
        
        if (Math.random() > 0.5) {
           biscuits.push({
            x: CANVAS_WIDTH + 10,
            y: 340, 
            width: 25,
            height: 25,
            collected: false
          });
        }
      }

      // Pattern 6: Power Up / Biscuit
      else if (rand < 0.85) {
         if (Math.random() < 0.15) {
             powerUps.push({
               x: CANVAS_WIDTH,
               y: 340,
               width: 30,
               height: 30,
               type: Math.random() > 0.5 ? 'sugar' : 'shield'
             });
         } else {
             biscuits.push({
                x: CANVAS_WIDTH,
                y: 340,
                width: 25,
                height: 25,
                collected: false
              });
         }
      }

      // Pattern 7: Teapot
      else {
        obstacles.push({
          x: CANVAS_WIDTH,
          y: 340,
          width: 40,
          height: 40,
          type: 'teapot'
        });
      }

      return 0;
    };

    // Define function for manual activation
    activatePowerUpRef.current = () => {
        if (storedPowerUp) {
            playSound('powerup');
            if (storedPowerUp === 'shield') {
                activeEffectType = 'shield';
                activeEffectTimer = 300; 
                spawnParticles(player.x + 20, player.y + 20, '#FFEB3B', 15);
            } else {
                activeEffectType = 'sugar';
                activeEffectTimer = 180;
                spawnParticles(player.x + 20, player.y + 20, '#FFFFFF', 20, 2);
            }
            storedPowerUp = null;
            setStoredItem(null);
        }
    };

    const update = () => {
      
      const speedMultiplier = activeEffectType === 'sugar' ? 2.5 : 1.0;
      const currentSpeed = gameSpeed * speedMultiplier;

      // Handle Effects
      if (activeEffectTimer > 0) {
        activeEffectTimer--;
        if (activeEffectTimer <= 0) {
          activeEffectType = null;
        }
      }
      
      // Shake Decay
      if (shakeIntensity > 0) {
          shakeIntensity *= 0.9;
          if (shakeIntensity < 0.5) shakeIntensity = 0;
      }

      // --- PHYSICS ---
      player.dy += GRAVITY;
      player.y += player.dy;

      let onGround = false;

      // Platform Collision
      for (const plat of platforms) {
        if (
          player.dy >= 0 &&
          player.y + player.height <= plat.y + 20 &&
          player.y + player.height >= plat.y - 5 &&
          player.x + player.width > plat.x + 10 && 
          player.x < plat.x + plat.width - 10
        ) {
          player.y = plat.y - player.height;
          player.dy = 0;
          player.grounded = true;
          onGround = true;
        }
      }

      // Ground Collision
      if (!onGround) {
        if (player.y + player.height >= GROUND_Y) { 
          player.y = GROUND_Y - player.height;
          player.dy = 0;
          player.grounded = true;
        } else {
          player.grounded = false;
        }
      }

      // --- UPPER DIMENSION LOGIC ---
      const isUpperDimension = player.y < UPPER_DIMENSION_Y;
      const scoreMultiplier = isUpperDimension ? 3 : 1;

      // --- SPAWNING ---
      frameCount++;
      totalFrames++;
      
      if (frameCount >= nextSpawnTime) {
        const rushFactor = activeEffectType === 'sugar' ? 0.5 : 1.0;
        const extraDelay = spawnSomething();
        frameCount = 0;
        const currentMin = Math.max(30, spawnRateMin - (internalLevel * 5));
        const currentMax = Math.max(60, spawnRateMax - (internalLevel * 10));
        nextSpawnTime = Math.floor((Math.random() * (currentMax - currentMin + 1) + currentMin) * rushFactor) + extraDelay;
      }

      // --- LEVEL UP LOGIC ---
      const newLevel = Math.floor(score / 500) + 1;
      if (newLevel > internalLevel) {
        internalLevel = newLevel;
        setCurrentLevel(internalLevel);
        gameSpeed += 0.5;
        playSound('levelup');
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 2000);
      }

      // --- ENTITY UPDATE ---

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Platforms
      for (let i = platforms.length - 1; i >= 0; i--) {
        const plat = platforms[i];
        plat.x -= currentSpeed;
        if (plat.x + plat.width < 0) platforms.splice(i, 1);
      }

      // Biscuits
      for (let i = biscuits.length - 1; i >= 0; i--) {
        const b = biscuits[i];
        b.x -= currentSpeed;

        if (!b.collected) {
          if (
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y
          ) {
            b.collected = true;
            score += 50 * scoreMultiplier; // Apply Multiplier
            playSound('biscuit');
            spawnParticles(b.x + b.width / 2, b.y + b.height / 2, '#8D6E63', 8, 1.5);
            setCurrentScore(Math.floor(score));
          }
        }
        
        if (b.x + b.width < 0 || b.collected) {
           if (b.collected) biscuits.splice(i, 1);
           else if (b.x + b.width < 0) biscuits.splice(i, 1);
        }
      }

      // Power Ups (Inventory System)
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.x -= currentSpeed;

        // Collision
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y
        ) {
            playSound('store'); // New Store Sound
            storedPowerUp = p.type;
            setStoredItem(p.type); // Update React State for UI
            spawnParticles(player.x + 20, player.y + 20, '#FFF', 10);
            powerUps.splice(i, 1);
            continue;
        }

        if (p.x + p.width < 0) {
            powerUps.splice(i, 1);
        }
      }

      // Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        let moveX = currentSpeed;
        if (obs.vx) moveX += obs.vx;
        obs.x -= moveX;

        if (obs.type === 'teabag' && obs.centerY !== undefined && obs.phase !== undefined) {
             obs.y = obs.centerY + Math.sin(totalFrames * 0.05 + obs.phase) * 50;
        }

        const padding = 8;
        if (
          player.x + padding < obs.x + obs.width &&
          player.x + player.width - padding > obs.x &&
          player.y + padding < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          if (activeEffectType) {
              // SMASH
              obstacles.splice(i, 1);
              score += 20 * scoreMultiplier;
              playSound('smash');
              shakeIntensity = 10; // Trigger Shake
              
              let partColor = '#EC407A';
              if (obs.type === 'bee') partColor = '#FFEB3B';
              if (obs.type === 'macaron') partColor = '#B2DFDB';
              if (obs.type === 'teabag') partColor = '#FFFFFF';
              
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, partColor, 10, 2);
              setCurrentScore(Math.floor(score));
              continue;
          } else {
            // GAME OVER
            cancelAnimationFrame(frameId);
            onGameOver(Math.floor(score));
            return;
          }
        }

        if (obs.x + obs.width < 0) {
          obstacles.splice(i, 1);
          score += (10 * scoreMultiplier); // Survival points multiplied
          setCurrentScore(Math.floor(score));
          playSound('score');
        }
      }

      // --- DRAWING ---
      ctx.save();
      
      // Apply Shake
      if (shakeIntensity > 0) {
          const dx = (Math.random() - 0.5) * shakeIntensity;
          const dy = (Math.random() - 0.5) * shakeIntensity;
          ctx.translate(dx, dy);
      }
      
      // Sky
      const skyHue = (190 + (internalLevel * 10)) % 360; 
      // Darker sky in upper dimension to signal "Deep Space" feel
      const lightness = isUpperDimension ? 75 : 85; 
      ctx.fillStyle = `hsl(${skyHue}, 70%, ${lightness}%)`;
      ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20); // Oversize for shake
      
      // Speed Lines
      if (activeEffectType === 'sugar') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          for(let i=0; i<10; i++) {
              const lx = Math.random() * CANVAS_WIDTH;
              const ly = Math.random() * CANVAS_HEIGHT;
              const lw = Math.random() * 100 + 50;
              ctx.fillRect(lx, ly, lw, 2);
          }
      }

      // Upper Dimension Indicator
      if (isUpperDimension) {
          ctx.fillStyle = 'rgba(255, 235, 59, 0.1)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, UPPER_DIMENSION_Y);
          
          // Draw "3x" floating text
          ctx.font = '20px "Press Start 2P"';
          ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(frameCount * 0.2) * 0.5})`;
          ctx.fillText("3x ZONE!", CANVAS_WIDTH - 150, 50);
      }

      // Background Bushes
      ctx.fillStyle = '#81C784';
      const bushOffset = (score * 1.5 * (activeEffectType === 'sugar' ? 1.0 : 1.0)) % 1000;
      for(let i=0; i<6; i++) {
         const bx = (i * 250) - bushOffset;
         if (bx > -100 && bx < CANVAS_WIDTH + 100) {
             ctx.beginPath();
             ctx.arc(bx, GROUND_Y, 30, 0, Math.PI * 2);
             ctx.arc(bx + 40, GROUND_Y - 20, 40, 0, Math.PI * 2);
             ctx.arc(bx + 80, GROUND_Y, 30, 0, Math.PI * 2);
             ctx.fill();
         }
      }

      // Ground
      ctx.fillStyle = '#558B2F';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.fillStyle = '#7CB342'; 
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 5);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const cloudSpeed = score * 0.2;
      ctx.beginPath();
      ctx.arc(100 - cloudSpeed % 900, 80, 30, 0, Math.PI * 2);
      ctx.arc(140 - cloudSpeed % 900, 80, 40, 0, Math.PI * 2);
      ctx.fill();

      // Platforms
      platforms.forEach(plat => {
        const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
        grad.addColorStop(0, '#E0E0E0');
        grad.addColorStop(0.5, '#F5F5F5');
        grad.addColorStop(1, '#9E9E9E');
        ctx.fillStyle = grad;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.strokeStyle = '#757575';
        ctx.strokeRect(plat.x + 5, plat.y + 2, plat.width - 10, plat.height - 4);
      });

      // Biscuits
      biscuits.forEach(b => {
        if (b.collected) return;
        ctx.fillStyle = '#D7CCC8'; 
        ctx.beginPath();
        ctx.arc(b.x + b.width/2, b.y + b.height/2, b.width/2, 0, Math.PI*2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#8D6E63';
        ctx.stroke();
        ctx.fillStyle = '#5D4037'; 
        ctx.beginPath();
        ctx.arc(b.x + 8, b.y + 10, 3, 0, Math.PI*2);
        ctx.arc(b.x + 16, b.y + 8, 2, 0, Math.PI*2);
        ctx.arc(b.x + 12, b.y + 18, 3, 0, Math.PI*2);
        ctx.fill();
      });

      // Power Ups on Ground
      powerUps.forEach(p => {
          if (p.type === 'shield') {
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(p.x + 15, p.y + 15, 12, 0, Math.PI, false);
              ctx.fill();
              ctx.fillRect(p.x + 3, p.y + 8, 24, 8);
              ctx.strokeStyle = '#FFD700';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(p.x + 25, p.y + 12, 6, 0, Math.PI * 2);
              ctx.stroke();
          } else {
              ctx.fillStyle = '#FFF';
              ctx.fillRect(p.x + 5, p.y + 5, 20, 20);
              ctx.strokeStyle = '#E0E0E0';
              ctx.lineWidth = 2;
              ctx.strokeRect(p.x + 5, p.y + 5, 20, 20);
          }
      });

      drawPlayer();

      obstacles.forEach(obs => {
        if (obs.type === 'teapot') {
          ctx.fillStyle = '#F8BBD0'; 
          ctx.fillRect(obs.x, obs.y + 10, obs.width, obs.height - 10);
          ctx.fillStyle = '#EC407A'; 
          ctx.fillRect(obs.x + 10, obs.y, 15, 10);
          ctx.strokeStyle = '#EC407A';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width, obs.y + 15);
          ctx.quadraticCurveTo(obs.x + obs.width + 12, obs.y + 20, obs.x + obs.width, obs.y + 35);
          ctx.stroke();
        } else if (obs.type === 'bee') {
          ctx.fillStyle = '#FFEB3B'; 
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#212121';
          ctx.fillRect(obs.x + 8, obs.y, 8, obs.height);
          ctx.fillRect(obs.x + 24, obs.y, 8, obs.height);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          const wingOffset = Math.sin(totalFrames * 0.5) * 5;
          ctx.beginPath();
          ctx.ellipse(obs.x + 10, obs.y - 10 + wingOffset, 10, 15, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'macaron') {
          ctx.fillStyle = '#B2DFDB'; 
          ctx.beginPath();
          ctx.ellipse(obs.x + 15, obs.y + 6, 15, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#F06292'; 
          ctx.fillRect(obs.x + 2, obs.y + 6, 26, 8);
          ctx.fillStyle = '#B2DFDB'; 
          ctx.beginPath();
          ctx.ellipse(obs.x + 15, obs.y + 16, 15, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'teabag') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obs.x + 15, obs.y);
          ctx.lineTo(obs.x + 15, obs.y - 100); 
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(obs.x, obs.y, 30, 35);
          ctx.fillStyle = '#D84315';
          ctx.fillRect(obs.x + 10, obs.y - 20, 10, 10);
        }
      });

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0;
      });

      // Power Up UI Timer (Canvas Overlay)
      if (activeEffectType) {
          const maxTime = activeEffectType === 'shield' ? 300 : 180;
          const pct = activeEffectTimer / maxTime;
          const barWidth = 200;
          const barHeight = 20;
          const barX = (CANVAS_WIDTH - barWidth) / 2;
          const barY = 60;
          
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = activeEffectType === 'shield' ? '#FFD700' : '#FFFFFF';
          ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * pct, barHeight - 4);
          ctx.fillStyle = '#FFF';
          ctx.font = '10px "Press Start 2P"';
          ctx.textAlign = 'center';
          ctx.fillText(activeEffectType === 'shield' ? "SHIELD" : "SUGAR RUSH!", CANVAS_WIDTH / 2, barY - 10);
      }
      
      ctx.restore();

      frameId = requestAnimationFrame(update);
    };

    const handleInput = (e: KeyboardEvent | TouchEvent) => {
      // Jump
      if ((e.type === 'keydown' && (e as KeyboardEvent).code === 'Space') || e.type === 'touchstart') {
          if (e.type === 'keydown') e.preventDefault();
          if (player.grounded) {
            player.dy = JUMP_FORCE;
            player.grounded = false;
            playSound('jump');
            spawnParticles(player.x + player.width / 2, player.y + player.height, '#E0E0E0', 6);
          }
      }
      // Use Item
      if ((e.type === 'keydown' && (e as KeyboardEvent).code === 'Enter')) {
          activatePowerUpRef.current();
      }
    };

    window.addEventListener('keydown', handleInput);
    window.addEventListener('touchstart', handleInput);

    frameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('touchstart', handleInput);
      cancelAnimationFrame(frameId);
    };
  }, [activeSkin, onGameOver]);

  return (
    <div className="relative w-full max-w-4xl mx-auto border-8 border-[#3E2723] rounded-lg overflow-hidden shadow-2xl bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto block"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* HUD */}
      <div className="absolute top-4 left-4 flex gap-4 bg-[#3E2723]/90 p-2 rounded border-2 border-[#D7CCC8]">
        <div className="text-white text-sm md:text-xl pixel-text">
          PTS: <span className="text-[#FFEB3B]">{currentScore}</span>
        </div>
        <div className="w-0.5 bg-[#D7CCC8]"></div>
        <div className="text-white text-sm md:text-xl pixel-text">
          LVL: <span className="text-[#F06292]">{currentLevel}</span>
        </div>
      </div>
      
      {/* Inventory Slot */}
      <div 
        className="absolute bottom-4 right-4 flex flex-col items-center cursor-pointer group"
        onClick={() => activatePowerUpRef.current()}
      >
        <div className={`w-16 h-16 border-4 bg-[#3E2723]/90 flex items-center justify-center relative ${storedItem ? 'border-[#FFEB3B] animate-pulse' : 'border-[#5D4037]'}`}>
            {storedItem === 'shield' && (
                <div className="text-2xl">☕</div>
            )}
            {storedItem === 'sugar' && (
                 <div className="text-2xl">🧊</div>
            )}
            {!storedItem && <span className="text-[#5D4037] text-xs">EMPTY</span>}
            
            {/* Key hint */}
            <div className="absolute -top-3 -right-3 bg-white text-black text-[8px] px-1 font-bold border border-black hidden md:block">
                ENTER
            </div>
        </div>
        <span className="text-white text-[8px] mt-1 bg-black/50 px-1">INVENTORY</span>
      </div>
      
      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <h2 className="text-5xl md:text-7xl text-[#FFEB3B] pixel-text drop-shadow-[4px_4px_0_#000] animate-bounce">
                LEVEL UP!
            </h2>
             <p className="text-white text-xl pixel-text bg-black/50 p-2 rounded mt-2">FASTER & HARDER!</p>
        </div>
      )}

       <button
        onClick={onBack}
        className="absolute top-4 right-4 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs py-2 px-4 rounded border-b-4 border-[#870000] active:border-b-0 active:mt-1 font-bold shadow-lg"
      >
        EXIT
      </button>
      <div className="absolute bottom-2 left-4 text-white/70 text-[10px] md:text-xs pointer-events-none select-none drop-shadow-md bg-black/20 p-1 rounded text-left">
        <div>Space/Tap: Jump</div>
        <div>Enter/Tap Icon: Use Item</div>
        <div>Upper Path: <span className="text-[#FFEB3B]">3x Points!</span></div>
      </div>
    </div>
  );
};
