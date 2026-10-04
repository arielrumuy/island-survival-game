/**
 * ISLA PERDIDA: SAR RESCUE - ENTITY & WILDLIFE SYSTEM
 * Player mechanics, Animal AI (Crab, Rabbit, Boar, Wolf), Floating Items, and Particles.
 */

// =========================================================================
// 1. FLOATING PARTICLES & TEXT
// =========================================================================
class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class FloatingText {
  constructor(x, y, text, color = '#fff') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.2;
    this.vy = -35;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / 1.2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class DroppedItem {
  constructor(x, y, itemType, count = 1) {
    this.x = x;
    this.y = y;
    this.itemType = itemType;
    this.count = count;
    this.radius = 14;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    this.bob += dt * 4;
    // Magnetic pull toward player
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 80) {
      const speed = 240 * dt;
      this.x += ((player.x - this.x) / dist) * speed;
      this.y += ((player.y - this.y) / dist) * speed;
    }
  }

  render(ctx) {
    const offsetY = Math.sin(this.bob) * 4;
    ctx.save();
    ctx.translate(this.x, this.y + offsetY);

    // Glowing aura
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Emoji or icon badge
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = window.craftingSystem ? window.craftingSystem.getItemIcon(this.itemType) : '📦';
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }
}

// =========================================================================
// 2. WILD ANIMAL AI SYSTEM
// =========================================================================
class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.state = 'idle'; // 'idle', 'wander', 'flee', 'charge'
    this.stateTimer = Math.random() * 3;
    this.attackCooldown = 0;

    if (type === 'crab') {
      this.name = 'Kepiting Pantai';
      this.hp = 2;
      this.maxHp = 2;
      this.speed = 45;
      this.radius = 14;
      this.drops = [{ item: 'crab_meat', count: 1 }];
    } else if (type === 'rabbit') {
      this.name = 'Kelinci Liar';
      this.hp = 3;
      this.maxHp = 3;
      this.speed = 135;
      this.radius = 16;
      this.drops = [{ item: 'rabbit_meat', count: 1 }, { item: 'fur', count: 1 }];
    } else if (type === 'boar') {
      this.name = 'Babi Hutan';
      this.hp = 7;
      this.maxHp = 7;
      this.speed = 100;
      this.chargeSpeed = 190;
      this.radius = 24;
      this.drops = [{ item: 'raw_meat', count: 2 }, { item: 'leather', count: 1 }];
    } else if (type === 'wolf') {
      this.name = 'Serigala Malam';
      this.hp = 6;
      this.maxHp = 6;
      this.speed = 150;
      this.radius = 22;
      this.drops = [{ item: 'raw_meat', count: 1 }, { item: 'wolf_fang', count: 1 }];
    }
  }

  update(dt, player, world) {
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    this.stateTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Type specific AI
    if (this.type === 'crab') {
      // Walks sideways on beach
      if (this.stateTimer <= 0) {
        this.state = Math.random() > 0.4 ? 'wander' : 'idle';
        this.angle = Math.random() * Math.PI * 2;
        this.stateTimer = 1.5 + Math.random() * 2;
      }
      if (this.state === 'wander') {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
      }

    } else if (this.type === 'rabbit') {
      // Flees if player approaches within 140px
      if (distToPlayer < 140) {
        this.state = 'flee';
        this.angle = Math.atan2(this.y - player.y, this.x - player.x);
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
      } else {
        if (this.stateTimer <= 0) {
          this.state = Math.random() > 0.5 ? 'wander' : 'idle';
          this.angle = Math.random() * Math.PI * 2;
          this.stateTimer = 1 + Math.random() * 2;
        }
        if (this.state === 'wander') {
          this.x += Math.cos(this.angle) * (this.speed * 0.4) * dt;
          this.y += Math.sin(this.angle) * (this.speed * 0.4) * dt;
        }
      }

    } else if (this.type === 'boar') {
      // Aggressive if hit or player is closer than 80px
      if (this.hp < this.maxHp || distToPlayer < 80) {
        this.state = 'charge';
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(this.angle) * this.chargeSpeed * dt;
        this.y += Math.sin(this.angle) * this.chargeSpeed * dt;

        // Attack player on contact
        if (distToPlayer < this.radius + player.radius && this.attackCooldown <= 0) {
          player.takeDamage(12, 'Diseruduk Babi Hutan');
          this.attackCooldown = 1.2;
          if (window.soundEngine) window.soundEngine.playBoarGrunt();
        }
      } else {
        if (this.stateTimer <= 0) {
          this.state = Math.random() > 0.4 ? 'wander' : 'idle';
          this.angle = Math.random() * Math.PI * 2;
          this.stateTimer = 2 + Math.random() * 3;
        }
        if (this.state === 'wander') {
          this.x += Math.cos(this.angle) * (this.speed * 0.5) * dt;
          this.y += Math.sin(this.angle) * (this.speed * 0.5) * dt;
        }
      }

    } else if (this.type === 'wolf') {
      // Wolves only active at night, afraid of campfires/torch
      let nearFire = (player.equippedTool === 'torch' && distToPlayer < 160);
      world.structures.forEach(s => {
        if (s.type === 'campfire' && Math.hypot(s.x - this.x, s.y - this.y) < 180) nearFire = true;
      });

      if (nearFire) {
        // Flee from fire
        this.state = 'flee';
        this.angle = Math.atan2(this.y - player.y, this.x - player.x);
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
      } else if (distToPlayer < 240) {
        // Stalk and attack
        this.state = 'charge';
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        if (distToPlayer < this.radius + player.radius && this.attackCooldown <= 0) {
          player.takeDamage(16, 'Dicabik Serigala Hutan');
          this.attackCooldown = 1.0;
          if (window.soundEngine) window.soundEngine.playWolfHowl();
        }
      }
    }

    // Keep animals inside island
    const distCenter = Math.hypot(this.x - world.centerX, this.y - world.centerY);
    if (distCenter > world.islandRadius - 40) {
      const backAngle = Math.atan2(world.centerY - this.y, world.centerX - this.x);
      this.x += Math.cos(backAngle) * 30 * dt;
      this.y += Math.sin(backAngle) * 30 * dt;
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (window.soundEngine) window.soundEngine.playHitFlesh();
    return this.hp <= 0;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'crab') {
      // Red crab body
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pincers
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(10, -6, 5, 0, Math.PI);
      ctx.arc(10, 6, 5, 0, Math.PI);
      ctx.stroke();

    } else if (this.type === 'rabbit') {
      // White/gray cute rabbit
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Long ears
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(-6, -8, 8, 3, -0.6, 0, Math.PI * 2);
      ctx.ellipse(-6, 8, 8, 3, 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy tail
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-13, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'boar') {
      // Dark brown sturdy boar
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & snout
      ctx.fillStyle = '#291002';
      ctx.beginPath();
      ctx.arc(14, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // White Tusks
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.lineTo(22, -10);
      ctx.moveTo(14, 6);
      ctx.lineTo(22, 10);
      ctx.stroke();

    } else if (this.type === 'wolf') {
      // Dark gray predator wolf
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(12, -5);
      ctx.lineTo(22, 0);
      ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill();

      // Glowing night eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(14, -3, 2, 0, Math.PI * 2);
      ctx.arc(14, 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // HP bar for larger animals
    if (this.hp < this.maxHp) {
      const barW = 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, (this.hp / this.maxHp) * barW, 4);
    }
  }
}

// =========================================================================
// 3. PLAYER SURVIVOR ENTITY
// =========================================================================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.angle = 0;
    this.speed = 160;
    this.sprintSpeed = 250;
    this.isSprinting = false;

    // Vitals (0 - 100)
    this.hp = 100;
    this.maxHp = 100;
    this.hunger = 100;
    this.maxHunger = 100;
    this.thirst = 100;
    this.maxThirst = 100;
    this.warmth = 100;
    this.maxWarmth = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    // Equipment & Actions
    this.equippedTool = 'hands'; // 'hands', 'axe', 'pickaxe', 'spear', 'torch'
    this.attackCooldown = 0;
    this.swingAnim = 0;
    this.isAlive = true;
    this.causeOfDeath = '';

    // Damage over time timers
    this.hungerTimer = 0;
    this.thirstTimer = 0;
    this.warmthTimer = 0;
    this.regenTimer = 0;
  }

  update(dt, input, world) {
    if (!this.isAlive) return;

    // Movement calculation
    let moveX = 0;
    let moveY = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;

      this.isSprinting = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) && this.stamina > 10;
      const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;

      const newX = this.x + moveX * currentSpeed * dt;
      const newY = this.y + moveY * currentSpeed * dt;

      // Restrict player from walking into deep ocean water
      if (!world.isPointInWater(newX, newY)) {
        this.x = newX;
        this.y = newY;
      }

      // Stamina drain on sprint
      if (this.isSprinting) {
        this.stamina = Math.max(0, this.stamina - dt * 20);
      }

      // Footstep sound interval
      this.stepTimer = (this.stepTimer || 0) + dt;
      if (this.stepTimer > (this.isSprinting ? 0.28 : 0.42)) {
        this.stepTimer = 0;
        const terrain = world.getTerrainTypeAt(this.x, this.y);
        if (window.soundEngine) window.soundEngine.playFootstep(terrain);
      }
    } else {
      this.isSprinting = false;
      // Recover stamina when not sprinting
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 18);
    }

    // Aim toward mouse cursor
    this.angle = Math.atan2(input.mouseWorldY - this.y, input.mouseWorldX - this.x);

    // Cooldown & Swing animation
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.swingAnim > 0) this.swingAnim -= dt * 6;

    // --- VITAL METABOLISM SYSTEM ---
    this.updateVitals(dt, world);
  }

  updateVitals(dt, world) {
    // 1. Hunger drains (faster when sprinting/chopping)
    const hungerDrain = (this.isSprinting ? 1.8 : 0.8) * (dt * 0.35);
    this.hunger = Math.max(0, this.hunger - hungerDrain);

    // 2. Thirst drains (faster in hot daytime)
    const ambientTemp = world.getAmbientTemperature();
    const thirstMultiplier = ambientTemp > 30 ? 1.5 : 1.0;
    const thirstDrain = (this.isSprinting ? 2.0 : 1.0) * thirstMultiplier * (dt * 0.45);
    this.thirst = Math.max(0, this.thirst - thirstDrain);

    // 3. Warmth / Temperature
    // Check if near any active campfire or holding torch
    let nearHeatSource = (this.equippedTool === 'torch');
    world.structures.forEach(s => {
      if (s.type === 'campfire' && Math.hypot(s.x - this.x, s.y - this.y) < 180) nearHeatSource = true;
      if (s.type === 'beacon' && world.sarBeaconLit && Math.hypot(s.x - this.x, s.y - this.y) < 280) nearHeatSource = true;
    });

    if (nearHeatSource) {
      this.warmth = Math.min(this.maxWarmth, this.warmth + dt * 25);
    } else {
      // Natural ambient temperature effect
      if (ambientTemp < 18) {
        // Cold night or rain -> loss of body heat!
        const coldRate = (18 - ambientTemp) * 0.75 * dt;
        this.warmth = Math.max(0, this.warmth - coldRate);
      } else {
        // Comfortable daytime recovers warmth
        this.warmth = Math.min(this.maxWarmth, this.warmth + dt * 5);
      }
    }

    // --- HEALTH IMPACTS & STARVATION ---
    // Starvation damage
    if (this.hunger <= 0) {
      this.hungerTimer += dt;
      if (this.hungerTimer > 1.5) {
        this.hungerTimer = 0;
        this.takeDamage(4, 'Mati Kelaparan');
      }
    }

    // Dehydration damage
    if (this.thirst <= 0) {
      this.thirstTimer += dt;
      if (this.thirstTimer > 1.2) {
        this.thirstTimer = 0;
        this.takeDamage(6, 'Mati Kehausan / Dehidrasi');
      }
    }

    // Hypothermia freezing damage
    if (this.warmth <= 0) {
      this.warmthTimer += dt;
      if (this.warmthTimer > 1.0) {
        this.warmthTimer = 0;
        this.takeDamage(8, 'Mati Kedinginan / Hipotermia');
      }
    }

    // Natural regeneration if well fed, hydrated, and warm
    if (this.hunger > 60 && this.thirst > 60 && this.warmth > 60 && this.hp < this.maxHp) {
      this.regenTimer += dt;
      if (this.regenTimer > 2.0) {
        this.regenTimer = 0;
        this.hp = Math.min(this.maxHp, this.hp + 2);
      }
    }
  }

  takeDamage(amount, reason = 'Cedera Fisik') {
    if (!this.isAlive) return;
    this.hp -= amount;
    if (window.soundEngine) window.soundEngine.playPlayerHurt();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.causeOfDeath = reason;
      if (window.soundEngine) window.soundEngine.playGameOver();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  feed(hungerAmount, hpAmount = 0) {
    this.hunger = Math.min(this.maxHunger, this.hunger + hungerAmount);
    if (hpAmount > 0) this.heal(hpAmount);
    if (window.soundEngine) window.soundEngine.playEat();
  }

  quenchThirst(amount) {
    this.thirst = Math.min(this.maxThirst, this.thirst + amount);
    if (window.soundEngine) window.soundEngine.playDrink();
  }

  // Sleep in Shelter overnight
  sleepInShelter(world) {
    // Fast forward to 06:00
    world.time = 6.0;
    world.day++;
    this.stamina = this.maxStamina;
    this.warmth = this.maxWarmth;
    this.heal(40);
    this.hunger = Math.max(10, this.hunger - 25);
    this.thirst = Math.max(10, this.thirst - 30);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Player Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player Torso & Clothes (Survivor shirt)
    ctx.fillStyle = '#1e3a8a'; // Blue tattered survivor shirt
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(-3, 0, 9, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // Arms & Hands
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(10, -12, 5, 0, Math.PI * 2);
    ctx.arc(10, 12, 5, 0, Math.PI * 2);
    ctx.fill();

    // Swing Tool / Weapon Representation
    const swingAngle = Math.sin(this.swingAnim) * 1.2;
    ctx.save();
    ctx.translate(14, 12);
    ctx.rotate(swingAngle);

    if (this.equippedTool === 'axe') {
      // Stone Axe
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -3, 20, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(16, -10, 8, 20);
    } else if (this.equippedTool === 'pickaxe') {
      // Pickaxe
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -3, 22, 6);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(18, -12);
      ctx.lineTo(24, 0);
      ctx.lineTo(18, 12);
      ctx.closePath();
      ctx.fill();
    } else if (this.equippedTool === 'spear') {
      // Long Spear
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -2, 34, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(34, -6);
      ctx.lineTo(44, 0);
      ctx.lineTo(34, 6);
      ctx.closePath();
      ctx.fill();
    } else if (this.equippedTool === 'torch') {
      // Burning Torch
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, -3, 16, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(18, 0, 7 + (Math.random() - 0.5) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }
}

window.Player = Player;
window.Animal = Animal;
window.Particle = Particle;
window.FloatingText = FloatingText;
window.DroppedItem = DroppedItem;
