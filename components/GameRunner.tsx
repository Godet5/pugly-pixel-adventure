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
const JUMP_FORCE = -13; // Slightly higher jump for platforms
const SPEED = 5;
const GROUND_Y = 380;
const SPAWN_RATE_MIN = 60;
const SPAWN_RATE_MAX = 140;

export const GameRunner: React.FC<GameRunnerProps> = ({ activeSkin, onGameOver, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScore, setCurrentScore] = useState(0);
  
  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playJumpSound = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtxRef.current.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.1);
  };

  const playScoreSound = () => {
    // Pass sound (points just for survival)
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtxRef.current.currentTime); // Quieter
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.1);
  };

  const playBiscuitSound = () => {
    // Satisfying crunch/ding
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, audioCtxRef.current.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.15);
  };

  useEffect(() => {
    // Init Audio
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game State
    let frameId = 0;
    let score = 0;
    let gameSpeed = SPEED;
    let frameCount = 0;
    let nextSpawn = 50;

    // Player
    const player = {
      x: 50,
      y: 300,
      width: 40,
      height: 40,
      dy: 0,
      grounded: false
    };

    // Arrays for different entity types
    let obstacles: Array<{ x: number, y: number, width: number, height: number, type: 'teapot' | 'bee' }> = [];
    let platforms: Array<{ x: number, y: number, width: number, height: number }> = [];
    let biscuits: Array<{ x: number, y: number, width: number, height: number, collected: boolean }> = [];
    
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

    // Helper: Draw Skin
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
    };

    const spawnSomething = () => {
      const rand = Math.random();
      
      // 20% Chance: Platform (Upper Dimension)
      if (rand < 0.25) {
        // Create a Floating Tea Tray
        const platWidth = 120;
        const platY = 220; // Reacheable jump height
        platforms.push({
          x: CANVAS_WIDTH,
          y: platY,
          width: platWidth,
          height: 15
        });
        
        // 80% chance to put a biscuit on the platform
        if (Math.random() > 0.2) {
          biscuits.push({
            x: CANVAS_WIDTH + 40, // Middle of platform
            y: platY - 40, // Floating above it
            width: 25,
            height: 25,
            collected: false
          });
        }
      } 
      // 25% Chance: Flying Bee (High Obstacle)
      else if (rand < 0.50) {
        obstacles.push({
          x: CANVAS_WIDTH,
          y: 260, // Air height
          width: 35,
          height: 30,
          type: 'bee'
        });
        
        // Sometimes put a biscuit underneath the bee (risky!)
        if (Math.random() > 0.7) {
           biscuits.push({
            x: CANVAS_WIDTH + 10,
            y: 350, // Ground
            width: 25,
            height: 25,
            collected: false
          });
        }
      }
      // 25% Chance: Ground Biscuit (Safe points)
      else if (rand < 0.75) {
         biscuits.push({
            x: CANVAS_WIDTH,
            y: 340, // Hovering slightly above ground
            width: 25,
            height: 25,
            collected: false
          });
      }
      // Remaining: Ground Obstacle (Teapot)
      else {
        obstacles.push({
          x: CANVAS_WIDTH,
          y: 340,
          width: 40,
          height: 40,
          type: 'teapot'
        });
      }
    };

    const update = () => {
      // --- PHYSICS ---
      player.dy += GRAVITY;
      player.y += player.dy;

      let onGround = false;

      // Platform Collision (Upper Dimension)
      // Only land if falling downwards and feet are near the top surface
      for (const plat of platforms) {
        if (
          player.dy >= 0 && // Falling
          player.y + player.height <= plat.y + 15 && // Was above/near top
          player.y + player.height >= plat.y - 5 && // Is touching top
          player.x + player.width > plat.x + 5 && // Within X bounds (slight inset)
          player.x < plat.x + plat.width - 5
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

      // --- SPAWNING ---
      frameCount++;
      if (frameCount >= nextSpawn) {
        spawnSomething();
        frameCount = 0;
        nextSpawn = Math.floor(Math.random() * (SPAWN_RATE_MAX - SPAWN_RATE_MIN + 1) + SPAWN_RATE_MIN);
      }

      // --- MOVEMENT & COLLISION ---

      // Platforms
      for (let i = platforms.length - 1; i >= 0; i--) {
        const plat = platforms[i];
        plat.x -= gameSpeed;
        if (plat.x + plat.width < 0) platforms.splice(i, 1);
      }

      // Biscuits (Collectibles)
      for (let i = biscuits.length - 1; i >= 0; i--) {
        const b = biscuits[i];
        b.x -= gameSpeed;

        if (!b.collected) {
          // AABB Collision
          if (
            player.x < b.x + b.width &&
            player.x + player.width > b.x &&
            player.y < b.y + b.height &&
            player.y + player.height > b.y
          ) {
            b.collected = true;
            score += 50; // BIG POINTS!
            playBiscuitSound();
            setCurrentScore(Math.floor(score));
          }
        }
        
        if (b.x + b.width < 0 || b.collected) {
           // Keep collected briefly to maybe show effect? No, just remove for now.
           if (b.x + b.width < 0) biscuits.splice(i, 1);
           // Actually, if collected we can remove immediately or draw a sparkle.
           // Removing for simplicity.
           if (b.collected) biscuits.splice(i, 1);
        }
      }

      // Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameSpeed;

        // Collision
        if (
          player.x + 5 < obs.x + obs.width &&
          player.x + player.width - 5 > obs.x &&
          player.y + 5 < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          cancelAnimationFrame(frameId);
          onGameOver(Math.floor(score));
          return;
        }

        if (obs.x + obs.width < 0) {
          obstacles.splice(i, 1);
          score += 5; // Survival points
          setCurrentScore(Math.floor(score));
          playScoreSound();
          gameSpeed += 0.02; // Slow speed increase
        }
      }

      // --- DRAWING ---
      
      // Sky
      ctx.fillStyle = '#B3E5FC';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Background Elements
      ctx.fillStyle = '#81C784';
      const bushOffset = (score * 1) % 1000;
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
      ctx.beginPath();
      ctx.arc(100 - (score * 0.2) % 900, 80, 30, 0, Math.PI * 2);
      ctx.arc(140 - (score * 0.2) % 900, 80, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw Platforms (Tea Trays)
      platforms.forEach(plat => {
        // Silver Tray
        const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
        grad.addColorStop(0, '#E0E0E0');
        grad.addColorStop(0.5, '#F5F5F5');
        grad.addColorStop(1, '#9E9E9E');
        ctx.fillStyle = grad;
        
        // Shadow underneath
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 10;
        
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        
        // Reset Shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Details
        ctx.strokeStyle = '#757575';
        ctx.strokeRect(plat.x + 5, plat.y + 2, plat.width - 10, plat.height - 4);
      });

      // Draw Biscuits
      biscuits.forEach(b => {
        if (b.collected) return;
        // Cookie Body
        ctx.fillStyle = '#D7CCC8'; // Light brown
        ctx.beginPath();
        ctx.arc(b.x + b.width/2, b.y + b.height/2, b.width/2, 0, Math.PI*2);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#8D6E63';
        ctx.stroke();

        // Chips/Jam
        ctx.fillStyle = '#5D4037'; // Choco
        ctx.beginPath();
        ctx.arc(b.x + 8, b.y + 10, 3, 0, Math.PI*2);
        ctx.arc(b.x + 16, b.y + 8, 2, 0, Math.PI*2);
        ctx.arc(b.x + 12, b.y + 18, 3, 0, Math.PI*2);
        ctx.fill();
      });

      // Draw Player
      drawPlayer();

      // Draw Obstacles
      obstacles.forEach(obs => {
        if (obs.type === 'teapot') {
          // Teapot
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
        } else {
          // Bumblebee
          ctx.fillStyle = '#FFEB3B'; 
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = '#212121';
          ctx.fillRect(obs.x + 8, obs.y, 8, obs.height);
          ctx.fillRect(obs.x + 24, obs.y, 8, obs.height);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.ellipse(obs.x + 10, obs.y - 10, 10, 15, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      frameId = requestAnimationFrame(update);
    };

    // Input Handling
    const handleInput = (e: KeyboardEvent | TouchEvent) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).code === 'Space') {
         e.preventDefault();
      }
      
      if (player.grounded) {
        player.dy = JUMP_FORCE;
        player.grounded = false;
        playJumpSound();
      }
    };

    window.addEventListener('keydown', handleInput);
    window.addEventListener('touchstart', handleInput);

    // Start
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
      <div className="absolute top-4 left-4 flex gap-4">
        <div className="bg-[#3E2723]/80 p-2 rounded text-white text-sm md:text-xl pixel-text border-2 border-[#D7CCC8]">
          PARTY POINTS: <span className="text-[#FFEB3B]">{currentScore}</span>
        </div>
      </div>
      
       <button
        onClick={onBack}
        className="absolute top-4 right-4 bg-[#D84315] hover:bg-[#BF360C] text-white text-xs py-2 px-4 rounded border-b-4 border-[#870000] active:border-b-0 active:mt-1 font-bold shadow-lg"
      >
        EXIT
      </button>
      <div className="absolute bottom-2 left-0 w-full text-center text-white/70 text-sm pointer-events-none select-none drop-shadow-md bg-black/20 p-1">
        Tap/Space to Jump • Hop on Tea Trays for Biscuits!
      </div>
    </div>
  );
};