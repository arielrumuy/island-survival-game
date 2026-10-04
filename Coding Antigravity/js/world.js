/**
 * ISLA PERDIDA: SAR RESCUE - WORLD, MAP & ENVIRONMENT ENGINE
 * Generates the island terrain, resources, freshwater lake, shipwreck, weather, and day/night cycle.
 */

class World {
  constructor() {
    this.width = 3000;
    this.height = 3000;
    this.centerX = 1500;
    this.centerY = 1500;
    this.islandRadius = 1100;

    // Time & Day Cycle (1 day = 180 seconds, can sleep at night)
    this.time = 7.0; // Starts at 07:00 AM (morning)
    this.day = 1;
    this.maxDaysForSar = 5;
    this.timeSpeed = 24 / 180; // 24 hours per 180 sec (~0.133 hrs/sec)
    this.isNight = false;

    // Weather: 'sunny', 'rain', 'storm'
    this.weather = 'sunny';
    this.weatherTimer = 0;
    this.rainParticles = [];
    this.ambientWaveTimer = 0;

    // SAR Status
    this.sarBeaconBuilt = false;
    this.sarBeaconLit = false;
    this.sarCountdown = 0; // seconds until SAR helicopter arrives once beacon is lit
    this.sarArrived = false;
    this.sarHeliPosition = { x: -200, y: -200, landingX: 2000, landingY: 2200 };

    // Environmental Objects (Trees, Rocks, Bushes, Crates, Water sources, Player structures)
    this.objects = [];
    this.structures = []; // Campfires, Shelters, Beacon
    this.waterSpring = { x: 1300, y: 1450, radius: 110 };
    this.shipwreck = { x: 1050, y: 2250, radius: 100 };

    this.initTerrain();
    this.initResources();
  }

  initTerrain() {
    // Generate rain particles pool
    for (let i = 0; i < 150; i++) {
      this.rainParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 12 + Math.random() * 10,
        speed: 16 + Math.random() * 8
      });
    }
  }

  initResources() {
    this.objects = [];

    // Helper random within circle
    const getPosInIsland = (minR, maxR) => {
      const angle = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * (maxR - minR);
      return {
        x: this.centerX + Math.cos(angle) * r,
        y: this.centerY + Math.sin(angle) * r
      };
    };

    // 1. Palm Trees along beaches (r: 750 - 1050)
    for (let i = 0; i < 55; i++) {
      const p = getPosInIsland(750, 1050);
      this.objects.push({
        id: 'palm_' + i,
        type: 'palm_tree',
        x: p.x,
        y: p.y,
        radius: 26,
        hp: 3,
        maxHp: 3,
        name: 'Pohon Kelapa',
        drops: [
          { item: 'wood', count: 2 },
          { item: 'palm_leaf', count: 2 },
          { item: 'coconut', count: Math.random() > 0.4 ? 1 : 0 }
        ]
      });
    }

    // 2. Hardwood Jungle Trees (r: 150 - 750)
    for (let i = 0; i < 60; i++) {
      const p = getPosInIsland(150, 750);
      // Skip lake area
      if (Math.hypot(p.x - this.waterSpring.x, p.y - this.waterSpring.y) < 140) continue;

      this.objects.push({
        id: 'tree_' + i,
        type: 'jungle_tree',
        x: p.x,
        y: p.y,
        radius: 30,
        hp: 4,
        maxHp: 4,
        name: 'Pohon Hutan Lebat',
        drops: [
          { item: 'wood', count: 3 },
          { item: 'twig', count: 2 }
        ]
      });
    }

    // 3. Rocks & Flint Boulders (concentrated around rocky cliff North-East, and scattered)
    for (let i = 0; i < 40; i++) {
      let p;
      if (i < 20) {
        // Northeast mountain area
        p = {
          x: 1800 + (Math.random() - 0.5) * 350,
          y: 1100 + (Math.random() - 0.5) * 350
        };
      } else {
        p = getPosInIsland(300, 950);
      }

      this.objects.push({
        id: 'rock_' + i,
        type: 'rock',
        x: p.x,
        y: p.y,
        radius: 24,
        hp: 4,
        maxHp: 4,
        name: 'Bongkahan Batu & Flint',
        drops: [
          { item: 'stone', count: 2 },
          { item: 'flint', count: Math.random() > 0.35 ? 1 : 0 }
        ]
      });
    }

    // 4. Berry Bushes (r: 200 - 850)
    for (let i = 0; i < 35; i++) {
      const p = getPosInIsland(200, 850);
      this.objects.push({
        id: 'bush_' + i,
        type: 'berry_bush',
        x: p.x,
        y: p.y,
        radius: 20,
        hp: 1,
        maxHp: 1,
        name: 'Semak Buah Beri',
        drops: [
          { item: 'berry', count: 2 },
          { item: 'fiber', count: 2 }
        ]
      });
    }

    // 5. Medicinal Herb Plants
    for (let i = 0; i < 20; i++) {
      const p = getPosInIsland(200, 800);
      this.objects.push({
        id: 'herb_' + i,
        type: 'herb_plant',
        x: p.x,
        y: p.y,
        radius: 16,
        hp: 1,
        maxHp: 1,
        name: 'Tanaman Obat Herbal',
        drops: [
          { item: 'herb', count: 2 },
          { item: 'fiber', count: 1 }
        ]
      });
    }

    // 6. Shipwreck Cargo Crates (near South-West beach)
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 0.7) + (i * 0.12);
      const r = 1000 + (Math.random() * 80);
      const x = this.centerX + Math.cos(angle) * r;
      const y = this.centerY + Math.sin(angle) * r;

      this.objects.push({
        id: 'crate_' + i,
        type: 'salvage_crate',
        x: x,
        y: y,
        radius: 22,
        hp: 2,
        maxHp: 2,
        name: 'Peti Bekas Kapal Karam',
        drops: [
          { item: 'cloth', count: 2 },
          { item: 'wood', count: 2 },
          { item: 'canned_food', count: 1 }
        ]
      });
    }
  }

  update(dt) {
    // Advance day-night clock
    this.time += dt * this.timeSpeed;
    if (this.time >= 24) {
      this.time = 0;
      this.day++;
    }

    this.isNight = (this.time >= 20 || this.time < 5.5);

    // Weather transitions every ~90 seconds
    this.weatherTimer += dt;
    if (this.weatherTimer > 90) {
      this.weatherTimer = 0;
      const r = Math.random();
      if (r < 0.65) this.weather = 'sunny';
      else if (r < 0.88) this.weather = 'rain';
      else this.weather = 'storm';
    }

    // SAR Signal logic
    if (this.sarBeaconLit && !this.sarArrived) {
      this.sarCountdown -= dt;
      if (this.sarCountdown <= 0) {
        this.triggerSarArrival();
      }
    } else if (this.day >= this.maxDaysForSar && !this.sarArrived) {
      // Natural rescue on Day 5
      this.triggerSarArrival();
    }

    // Heli movement towards landing zone
    if (this.sarArrived && this.sarHeliPosition.x < this.sarHeliPosition.landingX) {
      this.sarHeliPosition.x += dt * 180;
      this.sarHeliPosition.y += dt * 160;
    }
  }

  triggerSarArrival() {
    this.sarArrived = true;
    this.sarHeliPosition = {
      x: 1000,
      y: 1200,
      landingX: 2000,
      landingY: 2200
    };
    if (window.soundEngine) {
      window.soundEngine.startHelicopterRotor();
    }
  }

  isPointInWater(x, y) {
    const distFromCenter = Math.hypot(x - this.centerX, y - this.centerY);
    return distFromCenter > this.islandRadius;
  }

  isPointNearFreshwater(x, y) {
    const dist = Math.hypot(x - this.waterSpring.x, y - this.waterSpring.y);
    return dist <= this.waterSpring.radius + 35;
  }

  getTerrainTypeAt(x, y) {
    const dist = Math.hypot(x - this.centerX, y - this.centerY);
    if (dist > this.islandRadius) return 'ocean';
    if (dist > 750) return 'sand';
    if (Math.hypot(x - this.waterSpring.x, y - this.waterSpring.y) <= this.waterSpring.radius) return 'lake';
    if (x > 1650 && y < 1300) return 'rocky';
    return 'grass';
  }

  // Calculate environmental temperature (affects warmth)
  getAmbientTemperature() {
    let base = 26; // 26°C normal day
    // Day-night swing
    if (this.time >= 10 && this.time <= 15) {
      base = 34; // midday hot
    } else if (this.isNight) {
      base = 12; // cold night
    }

    if (this.weather === 'rain') base -= 6;
    if (this.weather === 'storm') base -= 10;
    return base;
  }

  render(ctx, camera) {
    const startX = camera.x - 50;
    const startY = camera.y - 50;
    const endX = camera.x + camera.width + 50;
    const endY = camera.y + camera.height + 50;

    // 1. Draw Ocean Background
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(startX, startY, camera.width + 100, camera.height + 100);

    // Ocean Animated Waves
    this.renderOceanWaves(ctx, camera);

    // 2. Draw Sandy Beach Island Outline
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.islandRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fde68a'; // Golden sand
    ctx.fill();

    // Sand edge wave foam
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();

    // 3. Draw Interior Jungle (Grassland)
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 750, 0, Math.PI * 2);
    ctx.fillStyle = '#15803d'; // Lush tropical jungle
    ctx.fill();

    // Transition blending between sand and grass
    ctx.lineWidth = 45;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.stroke();

    // 4. Rocky North-East Mountain Area
    ctx.beginPath();
    ctx.ellipse(1850, 1100, 240, 180, Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = '#64748b'; // Mountain gray
    ctx.fill();

    // 5. Draw Freshwater Lake
    ctx.beginPath();
    ctx.arc(this.waterSpring.x, this.waterSpring.y, this.waterSpring.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8'; // Crystal freshwater blue
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

    // Lake reeds & lily pads
    ctx.fillStyle = '#22c55e';
    for (let r = 0; r < 5; r++) {
      const angle = r * 1.25;
      const lx = this.waterSpring.x + Math.cos(angle) * (this.waterSpring.radius * 0.65);
      const ly = this.waterSpring.y + Math.sin(angle) * (this.waterSpring.radius * 0.65);
      ctx.beginPath();
      ctx.arc(lx, ly, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Shipwreck at beach
    this.renderShipwreck(ctx);

    // 7. Designated SOS Rescue Beach Zone Markings
    this.renderRescueZone(ctx);

    ctx.restore();

    // 8. Draw Player Built Structures (Campfires, Shelters, Beacon)
    this.structures.forEach(s => this.renderStructure(ctx, s));

    // 9. Draw Natural Harvestable Objects (Trees, Rocks, Bushes, Crates)
    this.objects.forEach(obj => {
      if (obj.x > startX && obj.x < endX && obj.y > startY && obj.y < endY) {
        this.renderObject(ctx, obj);
      }
    });

    // 10. Weather Effects (Rain)
    if (this.weather === 'rain' || this.weather === 'storm') {
      this.renderRain(ctx, camera);
    }

    // 11. SAR Helicopter if arrived
    if (this.sarArrived) {
      this.renderHelicopter(ctx);
    }
  }

  renderOceanWaves(ctx, camera) {
    this.ambientWaveTimer += 0.03;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2.5;

    for (let i = 0; i < 18; i++) {
      const dist = this.islandRadius + 40 + i * 45;
      const waveShift = Math.sin(this.ambientWaveTimer + i) * 6;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, dist + waveShift, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderShipwreck(ctx) {
    const x = this.shipwreck.x;
    const y = this.shipwreck.y;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.35);

    // Broken wooden ship hull
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(0, 0, 70, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#291002';
    ctx.stroke();

    // Broken mast & tattered sail
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -60, 12, 60);

    ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
    ctx.beginPath();
    ctx.moveTo(6, -55);
    ctx.lineTo(45, -30);
    ctx.lineTo(6, -10);
    ctx.closePath();
    ctx.fill();

    // Water puddle inside hull
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-10, 0, 35, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderRescueZone(ctx) {
    // SOS Beacon pad on South-East beach
    const sx = 2000;
    const sy = 2200;

    ctx.save();
    // SOS Letters written on sand with rocks
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(120, 53, 15, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('S . O . S', sx, sy + 70);

    // Landing marker circle for SAR
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(sx, sy, 75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('ZONA SINYAL SAR', sx, sy - 85);
    ctx.restore();
  }

  renderObject(ctx, obj) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    if (obj.type === 'palm_tree') {
      // Tree trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Lush palm leaves extending out
      ctx.fillStyle = '#16a34a';
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * 28, Math.sin(ang) * 28, 26, 9, ang, 0, Math.PI * 2);
        ctx.fill();
      }

      // Coconuts in center
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(4, 4, 5, 0, Math.PI * 2);
      ctx.arc(-4, -2, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (obj.type === 'jungle_tree') {
      // Dense Oak / Hardwood canopy
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(4, 6, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-8, -8, 20, 0, Math.PI * 2);
      ctx.fill();

    } else if (obj.type === 'rock') {
      // Stone boulder with flint highlights
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(3, 4, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 15, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Sharp flint edge
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(8, -10);
      ctx.lineTo(4, 6);
      ctx.closePath();
      ctx.fill();

    } else if (obj.type === 'berry_bush') {
      // Green Bush with red berries
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Red berries
      ctx.fillStyle = '#ef4444';
      const bPos = [[-6, -5], [5, -4], [0, 6], [-7, 4], [7, 5]];
      bPos.forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (obj.type === 'herb_plant') {
      // Medicinal green leaves & blue flower
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * 10, Math.sin(ang) * 10, 12, 5, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (obj.type === 'salvage_crate') {
      // Cargo wooden box
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-16, -16, 32, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#451a03';
      ctx.strokeRect(-16, -16, 32, 32);

      // Crate cross braces
      ctx.beginPath();
      ctx.moveTo(-16, -16);
      ctx.lineTo(16, 16);
      ctx.moveTo(-16, 16);
      ctx.lineTo(16, -16);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderStructure(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);

    if (s.type === 'campfire') {
      // Stone ring
      ctx.fillStyle = '#64748b';
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 18, Math.sin(ang) * 18, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Logs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-14, -4, 28, 8);
      ctx.fillRect(-4, -14, 8, 28);

      // Animated Fire Flame
      const flicker = (Math.random() - 0.5) * 4;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 7 + flicker * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Smoke particles
      ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.beginPath();
      ctx.arc((Math.random() - 0.5) * 6, -18 - Math.random() * 10, 8, 0, Math.PI * 2);
      ctx.fill();

    } else if (s.type === 'shelter') {
      // A-frame leaf tent
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(-35, -25, 70, 50);

      // Leaf roof
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(-35, -25);
      ctx.lineTo(0, -45);
      ctx.lineTo(35, -25);
      ctx.lineTo(35, 25);
      ctx.lineTo(0, 5);
      ctx.lineTo(-35, 25);
      ctx.closePath();
      ctx.fill();

      // Tent entrance
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(-14, 25);
      ctx.lineTo(0, 5);
      ctx.lineTo(14, 25);
      ctx.closePath();
      ctx.fill();

    } else if (s.type === 'beacon') {
      // Giant SOS Signal Beacon Tower
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-20, -20, 40, 40);

      // Large rock base
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(-22, -22, 44, 44);

      if (this.sarBeaconLit) {
        // Massive roaring signal fire
        const flk = Math.random() * 8;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 26 + flk, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 16 + flk * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Plume of thick signal smoke
        ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
        for (let smk = 1; smk <= 4; smk++) {
          ctx.beginPath();
          ctx.arc((Math.random() - 0.5) * 12, -smk * 30, 16 + smk * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText('Siap Dinyalakan', 0, 4);
      }
    }

    ctx.restore();
  }

  renderRain(ctx, camera) {
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.lineWidth = 1.5;

    this.rainParticles.forEach(p => {
      p.y += p.speed;
      p.x -= p.speed * 0.35; // wind slant
      if (p.y > window.innerHeight) p.y = -20;
      if (p.x < 0) p.x = window.innerWidth + 20;

      ctx.beginPath();
      ctx.moveTo(camera.x + p.x, camera.y + p.y);
      ctx.lineTo(camera.x + p.x - 6, camera.y + p.y + p.length);
      ctx.stroke();
    });

    // Lightning flash on storm
    if (this.weather === 'storm' && Math.random() < 0.015) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(camera.x, camera.y, camera.width, camera.height);
    }
  }

  renderHelicopter(ctx) {
    const h = this.sarHeliPosition;
    ctx.save();
    ctx.translate(h.x, h.y);

    // SAR Bright Orange Body
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // SAR White Stripes & Letters
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIM SAR', 0, 5);

    // Tail boom & tail rotor
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-90, -4, 45, 8);
    ctx.fillRect(-95, -16, 6, 24);

    // Cockpit glass
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(36, 0, 16, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spinning Main Rotor Blade
    const bladeAngle = Date.now() * 0.05;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(bladeAngle) * 85, Math.sin(bladeAngle) * 85);
    ctx.lineTo(-Math.cos(bladeAngle) * 85, -Math.sin(bladeAngle) * 85);
    ctx.stroke();

    // Rescue Spotlight on Ground
    const spotGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 180);
    spotGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    spotGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Night Darkness Overlay with Dynamic Light Cutouts (Player Torch, Campfire, Beacon)
  renderNightLighting(ctx, camera, player) {
    let darknessAlpha = 0;

    // Time curve: 06:00 to 18:00 = day (0 alpha)
    // 19:00 = dusk (0.3 alpha)
    // 21:00 to 04:30 = pitch dark (0.88 alpha)
    if (this.time >= 18 && this.time < 21) {
      darknessAlpha = ((this.time - 18) / 3) * 0.88;
    } else if (this.time >= 21 || this.time < 4.5) {
      darknessAlpha = 0.88;
    } else if (this.time >= 4.5 && this.time < 6.5) {
      darknessAlpha = (1 - (this.time - 4.5) / 2) * 0.88;
    }

    if (this.weather === 'storm') {
      darknessAlpha = Math.max(darknessAlpha, 0.55);
    }

    if (darknessAlpha <= 0.02) return; // Daylight, no lighting mask needed

    // Create full screen darkness mask with 'destination-out' composition to cut out light
    ctx.save();
    ctx.fillStyle = `rgba(3, 7, 18, ${darknessAlpha})`;
    ctx.fillRect(camera.x, camera.y, camera.width, camera.height);

    ctx.globalCompositeOperation = 'destination-out';

    // 1. Light from Player (holding torch gives big radius, otherwise small vision circle)
    const playerRadius = (player.equippedTool === 'torch') ? 160 : 65;
    const pGrad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, playerRadius);
    pGrad.addColorStop(0, 'rgba(0,0,0,1)');
    pGrad.addColorStop(0.7, 'rgba(0,0,0,0.7)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Light from Campfires & Beacon
    this.structures.forEach(s => {
      let r = 0;
      if (s.type === 'campfire') r = 210;
      else if (s.type === 'beacon' && this.sarBeaconLit) r = 380;
      else if (s.type === 'shelter') r = 50;

      if (r > 0) {
        const sGrad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, r);
        sGrad.addColorStop(0, 'rgba(0,0,0,1)');
        sGrad.addColorStop(0.75, 'rgba(0,0,0,0.6)');
        sGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }
}

window.World = World;
