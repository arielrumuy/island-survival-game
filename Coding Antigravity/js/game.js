/**
 * ISLA PERDIDA: SAR RESCUE - 3D FIRST-PERSON GAME ENGINE (HD EDITION)
 * Enhanced with ACES Filmic Tone Mapping, 9-slot reliable hotbar (Keys 1-9),
 * 3D navigational compass, raycasting crosshairs, and survival loops.
 */

class GameEngine3D {
  constructor() {
    this.canvas = document.getElementById('game-canvas');

    // 1. High-Fidelity Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Cinematic Tone Mapping & Exposure
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Initial position on beach near shipwreck
    this.camera.position.set(-60, 4.5, 125);
    this.camera.rotation.y = Math.PI;
    this.scene.add(this.camera);

    // Dedicated First-Person Weapon/Tool Viewmodel Scene & Camera (Zero clipping)
    this.weaponScene = new THREE.Scene();
    this.weaponCamera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.01, 20);
    this.weaponCamera.position.set(0, 0, 0);

    // Dedicated lighting for hands and held items
    const weaponAmbient = new THREE.AmbientLight(0xffffff, 0.95);
    const weaponSun = new THREE.DirectionalLight(0xfff7ed, 1.4);
    weaponSun.position.set(2, 4, 3);
    const weaponFill = new THREE.DirectionalLight(0x93c5fd, 0.6);
    weaponFill.position.set(-3, -1, 2);
    this.weaponScene.add(weaponAmbient, weaponSun, weaponFill);

    // 2. Subsystems
    this.controls = new FPSControls(this.camera, this.canvas);
    this.world3D = new World3D(this.scene);
    this.toolRig = new FirstPersonToolRig(this.weaponScene, this.camera);
    this.crafting = window.craftingSystem;

    // Hotbar Selected Index (0 to 8)
    this.selectedHotbarIndex = 0;

    // Player Vitals
    this.player = {
      x: -60,
      y: 4.5,
      z: 125,
      yaw: 0,
      hp: 100,
      maxHp: 100,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      warmth: 100,
      maxWarmth: 100,
      stamina: 100,
      maxStamina: 100,
      equippedTool: 'hands',
      isAlive: true,
      causeOfDeath: '',
      takeDamage: (amount, reason) => this.damagePlayer(amount, reason),
      feed: (hungerAmt, hpAmt = 0) => this.feedPlayer(hungerAmt, hpAmt),
      quenchThirst: (amt) => this.drinkPlayer(amt),
      heal: (amt) => { this.player.hp = Math.min(this.player.maxHp, this.player.hp + amt); }
    };

    // First-Person Raycasting
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 6.0;
    this.centerScreen = new THREE.Vector2(0, 0);

    // Collections
    this.animals = [];
    this.droppedItems = [];

    // State
    this.isVictory = false;
    this.isGameOver = false;
    this.stats = {
      treesFelled: 0,
      rocksMined: 0,
      animalsHunted: 0,
      structuresBuilt: 0
    };

    this.lastTime = performance.now();

    this.initWindow();
    this.initWildlife();
    this.initUI();
    this.initInputKeysAndClicks();

    // Default select slot 1 (Kapak Batu)
    this.selectHotbarSlot(0);

    // Start 3D Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initWindow() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      if (this.weaponCamera) {
        this.weaponCamera.aspect = window.innerWidth / window.innerHeight;
        this.weaponCamera.updateProjectionMatrix();
      }
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initWildlife() {
    // 6 Shore Crabs along the beach
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 130 + Math.random() * 40;
      this.animals.push(new Animal3D('crab', Math.cos(ang) * r, Math.sin(ang) * r, this.scene, this.world3D));
    }

    // 7 Wild Rabbits in meadows and forest edges
    for (let i = 0; i < 7; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 35 + Math.random() * 75;
      this.animals.push(new Animal3D('rabbit', Math.cos(ang) * r, Math.sin(ang) * r, this.scene, this.world3D));
    }

    // 5 Wild Boars in dense jungle
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 45 + Math.random() * 65;
      this.animals.push(new Animal3D('boar', Math.cos(ang) * r, Math.sin(ang) * r, this.scene, this.world3D));
    }

    // 4 Timber Wolves in rocky mountain forests
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 55 + Math.random() * 55;
      this.animals.push(new Animal3D('wolf', Math.cos(ang) * r, Math.sin(ang) * r, this.scene, this.world3D));
    }
  }

  // --- Keyboard & Mouse Inputs ---
  initInputKeysAndClicks() {
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.controls.isLocked) {
        this.handlePlayerAttackOrAction();
      }
    });

    // Mouse wheel hotbar slot cycle (scroll up = previous slot, scroll down = next slot)
    window.addEventListener('wheel', (e) => {
      const craftModal = document.getElementById('crafting-modal');
      if (craftModal && craftModal.classList.contains('show')) return;
      if (!this.player.isAlive || this.isVictory || this.isGameOver) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const nextIdx = (this.selectedHotbarIndex + dir + 9) % 9;
      this.selectHotbarSlot(nextIdx);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      // 1. Comprehensive 1-9 Hotbar selection (handles numbers, numpad, shifted symbols, and keyCodes)
      let slotNum = -1;

      // By direct character
      if (e.key >= '1' && e.key <= '9') {
        slotNum = parseInt(e.key, 10);
      }
      // By event code (Digit1..Digit9)
      else if (e.code && e.code.startsWith('Digit')) {
        const val = parseInt(e.code.replace('Digit', ''), 10);
        if (val >= 1 && val <= 9) slotNum = val;
      }
      // By event code (Numpad1..Numpad9)
      else if (e.code && e.code.startsWith('Numpad')) {
        const val = parseInt(e.code.replace('Numpad', ''), 10);
        if (val >= 1 && val <= 9) slotNum = val;
      }
      // By numeric keyCode fallback (49-57 for 1-9, 97-105 for Numpad 1-9)
      else if (e.keyCode >= 49 && e.keyCode <= 57) {
        slotNum = e.keyCode - 48;
      } else if (e.keyCode >= 97 && e.keyCode <= 105) {
        slotNum = e.keyCode - 96;
      }
      // Shifted symbols on top row when sprinting (!, @, #, $, %, ^, &, *, ()
      else {
        const shiftMap = { '!': 1, '@': 2, '#': 3, '$': 4, '%': 5, '^': 6, '&': 7, '*': 8, '(': 9 };
        if (shiftMap[e.key]) slotNum = shiftMap[e.key];
      }

      if (slotNum >= 1 && slotNum <= 9) {
        this.selectHotbarSlot(slotNum - 1);
        return;
      }

      // 2. Interaction & Menu Keys
      if (e.code === 'KeyE') {
        this.handleInteractionE();
      } else if (e.code === 'KeyC' || e.code === 'Tab') {
        e.preventDefault();
        this.toggleCraftingModal();
      } else if (e.code === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // Guaranteed Hotbar Slot Trigger & 3D Tool Rig Synchronization
  selectHotbarSlot(idx) {
    if (idx < 0 || idx >= 9) return;

    const previousIdx = this.selectedHotbarIndex;
    this.selectedHotbarIndex = idx;
    const itemId = this.crafting.hotbarSlots[idx];

    // Tactile audio feedback on selection
    if (window.soundEngine) window.soundEngine.playFootstep('sand');

    if (!itemId) {
      // Empty slot: unequip weapons to bare hands
      this.player.equippedTool = 'hands';
      this.toolRig.setEquipped('hands');
      this.showFloatingText(`Slot [${idx + 1}]: Kosong`, '#94a3b8');
    } else {
      const def = this.crafting.itemDefs[itemId];
      if (def) {
        if (def.type === 'tool') {
          // Equip weapon/tool in first person
          this.player.equippedTool = def.toolId;
          this.toolRig.setEquipped(def.toolId);
          this.showFloatingText(`⚔️ Memegang: ${def.name} [Slot ${idx + 1}]`, '#38bdf8');
        } else if (def.type === 'food' || def.type === 'medicine') {
          // Equip 3D held food / medicine model in first person
          this.player.equippedTool = itemId;
          this.toolRig.setEquipped(itemId);

          // If pressed again while already selected, consume immediately!
          if (previousIdx === idx) {
            this.toolRig.triggerSwing();
            const consumed = this.crafting.useItem(itemId, this.player);
            if (consumed) {
              this.showFloatingText(`😋 Mengonsumsi: ${def.name}!`, '#34d399');
            }
          } else {
            const count = this.crafting.inventory[itemId] || 1;
            this.showFloatingText(`🍽️ ${def.name} x${count} (Klik Kiri atau Tekan [${idx + 1}] Lagi untuk Konsumsi)`, '#fde047');
          }
        } else {
          // Crafting material (wood, stone, flint, etc.) or structure blueprint
          this.player.equippedTool = itemId;
          this.toolRig.setEquipped(itemId);
          const count = this.crafting.inventory[itemId] || 1;
          this.showFloatingText(`📦 ${def.name} x${count} [Slot ${idx + 1}] (Gunakan di Menu Crafting [C])`, '#cbd5e1');
        }
      }
    }

    this.renderHotbar();
  }

  handlePlayerAttackOrAction() {
    if (!this.player.isAlive || this.isVictory || this.isGameOver) return;

    // 1. Structure Placement
    if (this.crafting.structureToPlace) {
      this.confirmStructurePlacement();
      return;
    }

    // 2. Check if currently holding food/medicine in selected hotbar slot
    const activeItemId = this.crafting.hotbarSlots[this.selectedHotbarIndex];
    if (activeItemId) {
      const def = this.crafting.itemDefs[activeItemId];
      if (def && (def.type === 'food' || def.type === 'medicine')) {
        this.toolRig.triggerSwing();
        this.crafting.useItem(activeItemId, this.player);
        this.renderHotbar();
        // If out of item, refresh equip
        if (!this.crafting.inventory[activeItemId] || this.crafting.inventory[activeItemId] <= 0) {
          this.selectHotbarSlot(this.selectedHotbarIndex);
        }
        return;
      }
    }

    // 3. Melee Weapon / Tool Swing
    this.toolRig.triggerSwing();
    if (window.soundEngine) window.soundEngine.playSwingWeapon();

    // 4. Raycast Forward from crosshair
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const targetObj = this.findTargetUserData(hit.object);

      if (targetObj) {
        // Direct Left-Click pickup on Dropped Items
        if (targetObj.isDroppedItem) {
          const dist = Math.hypot(this.player.x - targetObj.entity.mesh.position.x, this.player.z - targetObj.entity.mesh.position.z);
          if (dist < 8.0) {
            this.collectDroppedItem(targetObj.entity);
            return;
          }
        } else if (targetObj.isAnimal) {
          // Hit wild animal
          let dmg = 1;
          if (this.player.equippedTool === 'spear') dmg = 4;
          else if (this.player.equippedTool === 'axe') dmg = 2;
          else if (this.player.equippedTool === 'pickaxe') dmg = 2;

          this.showFloatingText(`-${dmg} HP`, '#ef4444');
          if (targetObj.entity.takeDamage(dmg)) {
            this.stats.animalsHunted++;
            targetObj.entity.drops.forEach(d => {
              this.spawnDroppedLoot(d.item, d.count, targetObj.entity.mesh.position.x, targetObj.entity.mesh.position.z);
            });
            this.showFloatingText(`${targetObj.entity.name} Berhasil Diburu! 🍖`, '#fbbf24');
            targetObj.entity.destroy();
            this.animals = this.animals.filter(a => a !== targetObj.entity);
          }
        } else if (targetObj.type) {
          this.harvest3DObject(targetObj, hit.object);
        }
      }
    }
  }

  findTargetUserData(mesh) {
    let cur = mesh;
    while (cur) {
      if (cur.userData && (cur.userData.type || cur.userData.isAnimal || cur.userData.isFreshwater || cur.userData.isDroppedItem)) {
        return cur.userData;
      }
      cur = cur.parent;
    }
    return null;
  }

  collectDroppedItem(loot, index) {
    if (!loot || loot.isCollected) return;
    loot.isCollected = true;

    this.crafting.addItem(loot.itemType, loot.count);
    if (window.soundEngine && typeof window.soundEngine.playItemPickup === 'function') {
      window.soundEngine.playItemPickup();
    }

    const name = this.crafting.getItemName(loot.itemType);
    this.showFloatingText(`+${loot.count} ${name}`, '#34d399');
    loot.destroy();

    if (typeof index === 'number' && index >= 0) {
      this.droppedItems.splice(index, 1);
    } else {
      const idx = this.droppedItems.indexOf(loot);
      if (idx !== -1) this.droppedItems.splice(idx, 1);
    }

    this.renderHotbar();
  }

  harvest3DObject(data, mesh) {
    let toolBonus = 1;
    if (data.type.includes('tree') && this.player.equippedTool === 'axe') {
      toolBonus = 2.5;
      if (window.soundEngine) window.soundEngine.playChopWood();
    } else if (data.type === 'rock' && this.player.equippedTool === 'pickaxe') {
      toolBonus = 2.5;
      if (window.soundEngine) window.soundEngine.playMineStone();
    } else if (data.type.includes('tree')) {
      if (window.soundEngine) window.soundEngine.playChopWood();
    } else if (data.type === 'rock') {
      if (window.soundEngine) window.soundEngine.playMineStone();
    } else {
      if (window.soundEngine) window.soundEngine.playNoiseCrack(0.12, 0.08);
    }

    data.hp -= toolBonus;
    this.showFloatingText(`-${Math.round(toolBonus)}`, '#cbd5e1');

    if (data.hp <= 0) {
      const group = this.world3D.objects3D.find(g => g.userData === data);
      if (group) {
        if (data.type.includes('tree')) this.stats.treesFelled++;
        if (data.type === 'rock') this.stats.rocksMined++;

        // Spawn dropped 3D loot on ground for player to pick up
        data.drops.forEach(d => {
          if (d.count > 0) {
            this.spawnDroppedLoot(d.item, d.count, group.position.x, group.position.z);
          }
        });

        this.scene.remove(group);
        this.world3D.objects3D = this.world3D.objects3D.filter(g => g !== group);
      }
    }
  }

  spawnDroppedLoot(item, count, x, z) {
    const rx = x + (Math.random() - 0.5) * 1.5;
    const rz = z + (Math.random() - 0.5) * 1.5;
    this.droppedItems.push(new DroppedItem3D(item, count, rx, rz, this.scene, this.world3D));
  }

  handleInteractionE() {
    if (!this.player.isAlive || this.isVictory || this.isGameOver) return;

    // 1. Reach SAR Helicopter evacuation point
    if (this.world3D.sarArrived && this.world3D.heliMesh) {
      const distToHeli = Math.hypot(this.world3D.rescueZonePos.x - this.player.x, this.world3D.rescueZonePos.z - this.player.z);
      if (distToHeli < 18) {
        this.triggerVictory();
        return;
      }
    }

    // 2. Check raycast target for dropped items, lake, or structures
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const targetObj = this.findTargetUserData(hit.object);

      if (targetObj) {
        // Direct pickup of aimed dropped item
        if (targetObj.isDroppedItem) {
          const dist = Math.hypot(this.player.x - targetObj.entity.mesh.position.x, this.player.z - targetObj.entity.mesh.position.z);
          if (dist < 8.5) {
            this.collectDroppedItem(targetObj.entity);
            return;
          }
        }

        // Drink from Freshwater Lake
        if (targetObj.isFreshwater) {
          this.player.quenchThirst(45);
          this.showFloatingText('💧 Minum Air Tawar Bersih (+45 Haus)', '#38bdf8');
          return;
        }

        // Sleep in Shelter
        if (targetObj.type === 'shelter') {
          this.world3D.time = 6.0;
          this.world3D.day++;
          this.player.stamina = this.player.maxStamina;
          this.player.warmth = this.player.maxWarmth;
          this.player.heal(40);
          this.player.hunger = Math.max(10, this.player.hunger - 25);
          this.player.thirst = Math.max(10, this.player.thirst - 30);
          this.showFloatingText('💤 Tidur Nyenyak Sampai Fajar! (+40 HP & Stamina)', '#a7f3d0');
          if (window.soundEngine) window.soundEngine.playCraftSuccess();
          return;
        }

        // Light SOS Beacon
        if (targetObj.type === 'beacon' && !this.world3D.sarBeaconLit) {
          if (this.crafting.hasItem('flint', 1)) {
            this.world3D.sarBeaconLit = true;
            this.world3D.sarCountdown = 45;
            if (window.soundEngine) window.soundEngine.playRescueSuccessFanfare();
            this.showFloatingText('🔥 API SINYAL SOS MENYALA! HELIKOPTER SAR MENUJU KEMARI!', '#fbbf24');
          } else {
            this.showFloatingText('Perlu Batu Api (Flint) untuk menyalakan!', '#f87171');
          }
          return;
        }
      }
    }

    // 3. Proximity sweep for any dropped loot within 6.5 meters on pressing [E]
    let collectedAny = false;
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const loot = this.droppedItems[i];
      const dist = Math.hypot(this.player.x - loot.mesh.position.x, this.player.z - loot.mesh.position.z);
      if (dist < 6.5) {
        this.collectDroppedItem(loot, i);
        collectedAny = true;
      }
    }
    if (collectedAny) {
      this.renderHotbar();
    }
  }

  damagePlayer(amount, reason) {
    if (!this.player.isAlive) return;
    this.player.hp -= amount;
    if (window.soundEngine) window.soundEngine.playPlayerHurt();

    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.style.opacity = '1';
      setTimeout(() => vignette.style.opacity = '0', 350);
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.player.isAlive = false;
      this.player.causeOfDeath = reason;
      if (window.soundEngine) window.soundEngine.playGameOver();
      this.triggerGameOver();
    }
  }

  feedPlayer(hungerAmt, hpAmt = 0) {
    this.player.hunger = Math.min(this.player.maxHunger, this.player.hunger + hungerAmt);
    if (hpAmt > 0) this.player.heal(hpAmt);
    if (window.soundEngine) window.soundEngine.playEat();
    this.showFloatingText(`+${hungerAmt} Lapar`, '#f97316');
  }

  drinkPlayer(amt) {
    this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + amt);
    if (window.soundEngine) window.soundEngine.playDrink();
    this.showFloatingText(`+${amt} Haus`, '#38bdf8');
  }

  confirmStructurePlacement() {
    const type = this.crafting.structureToPlace;
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObject(this.world3D.terrainMesh);

    if (intersects.length > 0) {
      const hitPoint = intersects[0].point;

      if (type === 'beacon') {
        const distToRescueZone = Math.hypot(hitPoint.x - this.world3D.rescueZonePos.x, hitPoint.z - this.world3D.rescueZonePos.z);
        if (distToRescueZone > 25) {
          this.showFloatingText('Api Sinyal SAR harus dibangun di Zona Sinyal Pantai Selatan!', '#fbbf24');
          return;
        }
        this.world3D.sarBeaconBuilt = true;
      }

      this.world3D.buildStructure(type, hitPoint);
      this.stats.structuresBuilt++;
      this.crafting.structureToPlace = null;
      if (window.soundEngine) window.soundEngine.playCraftSuccess();
      this.showFloatingText('Bangunan Berhasil Didirikan! 🔨', '#38bdf8');
    }
  }

  showFloatingText(text, color = '#fff') {
    const banner = document.getElementById('action-feed-text');
    if (banner) {
      banner.textContent = text;
      banner.style.color = color;
      banner.style.opacity = '1';
      clearTimeout(this.feedTimeout);
      this.feedTimeout = setTimeout(() => { banner.style.opacity = '0'; }, 2400);
    }
  }

  triggerVictory() {
    this.isVictory = true;
    document.exitPointerLock();
    if (window.soundEngine) window.soundEngine.playRescueSuccessFanfare();
    const modal = document.getElementById('victory-modal');
    if (modal) {
      document.getElementById('stat-days').textContent = this.world3D.day;
      document.getElementById('stat-hunted').textContent = this.stats.animalsHunted;
      document.getElementById('stat-trees').textContent = this.stats.treesFelled;
      document.getElementById('stat-structures').textContent = this.stats.structuresBuilt;
      modal.classList.add('show');
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    document.exitPointerLock();
    const modal = document.getElementById('gameover-modal');
    if (modal) {
      document.getElementById('death-reason').textContent = `Penyebab: ${this.player.causeOfDeath}`;
      document.getElementById('death-day').textContent = `Bertahan hingga Hari ke-${this.world3D.day}`;
      modal.classList.add('show');
    }
  }

  restartGame() {
    location.reload();
  }

  loop(currentTime) {
    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (!this.isVictory && !this.isGameOver) {
      this.update(dt);
    }

    // Two-pass viewmodel rendering:
    // 1. Render main 3D world scene
    this.renderer.autoClear = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // 2. Clear depth buffer so held weapon/hands NEVER clip into trees, rocks, terrain, or near-plane!
    this.renderer.clearDepth();
    this.renderer.render(this.weaponScene, this.weaponCamera);

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.controls.update(dt, this.player, this.world3D);
    this.world3D.update(dt);
    this.toolRig.update(dt, this.controls);

    this.updatePlayerVitals(dt);
    this.animals.forEach(a => a.update(dt, this.player));

    // Guaranteed proximity pickup & magnetic motion for dropped items
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.update(dt, this.player);
      const dist = Math.hypot(this.player.x - item.mesh.position.x, this.player.z - item.mesh.position.z);
      if (dist < 2.4 || item.isReadyToCollect) {
        this.collectDroppedItem(item, i);
      }
    }

    this.updateCrosshairPrompt();
    this.updateCompassAndRadar();
    this.updateHUD();
  }

  updatePlayerVitals(dt) {
    const hungerDrain = (this.controls.isSprinting ? 1.6 : 0.8) * (dt * 0.35);
    this.player.hunger = Math.max(0, this.player.hunger - hungerDrain);

    const ambientTemp = this.world3D.getAmbientTemperature();
    const thirstMult = ambientTemp > 30 ? 1.5 : 1.0;
    const thirstDrain = (this.controls.isSprinting ? 2.0 : 1.0) * thirstMult * (dt * 0.45);
    this.player.thirst = Math.max(0, this.player.thirst - thirstDrain);

    let nearHeat = (this.player.equippedTool === 'torch');
    this.world3D.structures3D.forEach(s => {
      if (s.userData.type === 'campfire' && Math.hypot(s.position.x - this.player.x, s.position.z - this.player.z) < 14) {
        nearHeat = true;
      }
      if (s.userData.type === 'beacon' && this.world3D.sarBeaconLit && Math.hypot(s.position.x - this.player.x, s.position.z - this.player.z) < 25) {
        nearHeat = true;
      }
    });

    if (nearHeat) {
      this.player.warmth = Math.min(this.player.maxWarmth, this.player.warmth + dt * 25);
    } else {
      if (ambientTemp < 18) {
        const coldRate = (18 - ambientTemp) * 0.8 * dt;
        this.player.warmth = Math.max(0, this.player.warmth - coldRate);
      } else {
        this.player.warmth = Math.min(this.player.maxWarmth, this.player.warmth + dt * 5);
      }
    }

    const frostVignette = document.getElementById('frost-vignette');
    if (frostVignette) {
      if (this.player.warmth < 30) {
        frostVignette.style.opacity = `${(30 - this.player.warmth) / 30}`;
      } else {
        frostVignette.style.opacity = '0';
      }
    }

    if (this.player.hunger <= 0) this.damagePlayer(dt * 3, 'Mati Kelaparan');
    if (this.player.thirst <= 0) this.damagePlayer(dt * 4, 'Mati Kehausan / Dehidrasi');
    if (this.player.warmth <= 0) this.damagePlayer(dt * 6, 'Mati Kedinginan / Hipotermia');

    if (this.player.hunger > 60 && this.player.thirst > 60 && this.player.warmth > 60 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * 1.5);
    }
  }

  // --- Dynamic Navigational Compass Ribbon ---
  updateCompassAndRadar() {
    const compassRibbon = document.getElementById('compass-ribbon');
    if (!compassRibbon) return;

    // Player yaw angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
    let deg = (-this.controls.yaw * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;

    // Shift compass background ticks
    compassRibbon.style.backgroundPosition = `${-deg * 3}px 0`;

    // Update compass degree readouts
    const degEl = document.getElementById('compass-heading-text');
    if (degEl) {
      const cardinal = deg >= 315 || deg < 45 ? 'N (Utara)' :
                       deg >= 45 && deg < 135 ? 'E (Timur)' :
                       deg >= 135 && deg < 225 ? 'S (Selatan)' : 'W (Barat)';
      degEl.textContent = `${Math.round(deg)}° ${cardinal}`;
    }
  }

  updateCrosshairPrompt() {
    const promptEl = document.getElementById('crosshair-prompt');
    if (!promptEl) return;

    if (this.crafting.structureToPlace) {
      promptEl.textContent = '[KLIK KIRI] Bangun Struktur di Sini';
      promptEl.style.display = 'block';
      return;
    }

    if (this.world3D.sarArrived) {
      const distToHeli = Math.hypot(this.world3D.rescueZonePos.x - this.player.x, this.world3D.rescueZonePos.z - this.player.z);
      if (distToHeli < 18) {
        promptEl.textContent = 'Tekan [E] NAIK KE HELIKOPTER TIM SAR! 🚁';
        promptEl.style.display = 'block';
        return;
      }
    }

    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const target = this.findTargetUserData(hit.object);

      if (target) {
        if (target.isDroppedItem) {
          promptEl.textContent = `[E] Ambil ${target.name} (+${target.count}) 📦`;
        } else if (target.isFreshwater) {
          promptEl.textContent = 'Tekan [E] untuk Minum Air Tawar 💧';
        } else if (target.isAnimal) {
          promptEl.textContent = `[KLIK KIRI] Serang ${target.entity.name} 🗡️`;
        } else if (target.type === 'shelter') {
          promptEl.textContent = 'Tekan [E] untuk Tidur Melewati Malam 💤';
        } else if (target.type === 'beacon' && !this.world3D.sarBeaconLit) {
          promptEl.textContent = 'Tekan [E] Nyalakan Api Sinyal SOS Darurat 🔥';
        } else if (target.type === 'campfire') {
          promptEl.textContent = 'Dekat Api Unggun (Buka Crafting [C] untuk Memanggang) 🍖';
        } else if (target.name) {
          promptEl.textContent = `[KLIK KIRI] Tebang / Panen ${target.name}`;
        }
        promptEl.style.display = 'block';
        return;
      }
    }

    promptEl.style.display = 'none';
  }

  updateHUD() {
    const setBar = (id, val, max) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.max(0, Math.min(100, (val / max) * 100))}%`;
    };

    setBar('bar-hp', this.player.hp, this.player.maxHp);
    setBar('bar-hunger', this.player.hunger, this.player.maxHunger);
    setBar('bar-thirst', this.player.thirst, this.player.maxThirst);
    setBar('bar-warmth', this.player.warmth, this.player.maxWarmth);
    setBar('bar-stamina', this.player.stamina, this.player.maxStamina);

    const hpText = document.getElementById('text-hp');
    if (hpText) hpText.textContent = `${Math.round(this.player.hp)} / 100`;

    const clockEl = document.getElementById('hud-clock');
    if (clockEl) {
      const hrs = Math.floor(this.world3D.time);
      const mins = Math.floor((this.world3D.time % 1) * 60);
      clockEl.textContent = `Hari ${this.world3D.day} • ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} WIB`;
    }

    const sarBar = document.getElementById('sar-progress-bar');
    const sarStatus = document.getElementById('sar-status-text');

    if (this.world3D.sarArrived) {
      if (sarStatus) sarStatus.textContent = '🚨 HELIKOPTER SAR TELAH MENDARAT DI PANTAI! LARI KE SANA SEKARANG!';
      if (sarBar) sarBar.style.width = '100%';
    } else if (this.world3D.sarBeaconLit) {
      const remainingSecs = Math.max(0, Math.round(this.world3D.sarCountdown));
      if (sarStatus) sarStatus.textContent = `🔥 SINYAL SOS AKTIF! Helikopter SAR Tiba dalam: ${remainingSecs} Detik`;
      if (sarBar) sarBar.style.width = `${((45 - remainingSecs) / 45) * 100}%`;
    } else {
      const daysLeft = Math.max(1, 5 - this.world3D.day);
      if (sarStatus) sarStatus.textContent = `Pencarian Standar SAR: ~${daysLeft} Hari Lagi (Tip: Buat Api Sinyal SOS di pantai)`;
      if (sarBar) sarBar.style.width = `${(this.world3D.day / 5) * 100}%`;
    }
  }

  // --- 9-Slot Dedicated Hotbar Rendering ---
  renderHotbar() {
    const hotbarContainer = document.getElementById('hotbar-slots');
    if (!hotbarContainer) return;

    let html = '';

    for (let i = 0; i < 9; i++) {
      const itemId = this.crafting.hotbarSlots[i];
      const isSelected = (this.selectedHotbarIndex === i);

      if (itemId) {
        const def = this.crafting.itemDefs[itemId];
        const isTool = def && def.type === 'tool';
        const count = isTool ? 1 : (this.crafting.inventory[itemId] || 1);
        const icon = this.crafting.getItemIcon(itemId);
        const name = this.crafting.getItemName(itemId);

        html += `
          <div class="hotbar-slot ${isSelected ? 'active-selected' : ''}" data-slot-index="${i}" title="${name} (Tekan [${i + 1}])">
            <span class="slot-num-badge">${i + 1}</span>
            <span class="slot-icon">${icon}</span>
            ${!isTool ? `<span class="slot-count">${count}</span>` : ''}
            <span class="slot-name-pop">${name}</span>
          </div>
        `;
      } else {
        html += `
          <div class="hotbar-slot empty ${isSelected ? 'active-selected' : ''}" data-slot-index="${i}">
            <span class="slot-num-badge">${i + 1}</span>
          </div>
        `;
      }
    }

    hotbarContainer.innerHTML = html;

    // Click handler for each hotbar slot
    hotbarContainer.querySelectorAll('.hotbar-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotIdx = parseInt(slot.getAttribute('data-slot-index'), 10);
        this.selectHotbarSlot(slotIdx);
      });
    });
  }

  initUI() {
    this.renderHotbar();
    this.initCraftingModal();

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        document.getElementById('start-screen').style.display = 'none';
        if (window.soundEngine) window.soundEngine.resume();
        this.canvas.requestPointerLock();
      });
    }

    document.querySelectorAll('.btn-restart-game').forEach(b => {
      b.addEventListener('click', () => this.restartGame());
    });
  }

  initCraftingModal() {
    const modal = document.getElementById('crafting-modal');
    const closeBtn = document.getElementById('btn-close-crafting');
    const btnOpenCrafting = document.getElementById('btn-open-crafting');

    if (closeBtn) closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      this.canvas.requestPointerLock();
    });

    if (btnOpenCrafting) btnOpenCrafting.addEventListener('click', () => this.toggleCraftingModal());

    const tabs = document.querySelectorAll('.craft-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderRecipes(tab.getAttribute('data-category'));
      });
    });
  }

  toggleCraftingModal() {
    const modal = document.getElementById('crafting-modal');
    if (!modal) return;
    const isShowing = modal.classList.contains('show');
    if (isShowing) {
      modal.classList.remove('show');
      this.canvas.requestPointerLock();
    } else {
      document.exitPointerLock();
      modal.classList.add('show');
      this.renderRecipes('all');
    }
  }

  closeAllModals() {
    document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('show'));
    if (this.crafting.structureToPlace) {
      this.crafting.structureToPlace = null;
      this.showFloatingText('Penempatan Bangunan Dibatalkan', '#94a3b8');
    }
    this.canvas.requestPointerLock();
  }

  renderRecipes(category = 'all') {
    const listEl = document.getElementById('crafting-recipes-list');
    if (!listEl) return;

    let recipes = this.crafting.recipes;
    if (category !== 'all') {
      recipes = recipes.filter(r => r.category === category);
    }

    const worldAdapter = {
      structures: this.world3D.structures3D.map(s => ({
        type: s.userData.type,
        x: s.position.x,
        y: s.position.z
      }))
    };

    const playerAdapter = {
      x: this.player.x,
      y: this.player.z
    };

    listEl.innerHTML = recipes.map(r => {
      const check = this.crafting.canCraft(r, playerAdapter, worldAdapter);
      const icon = r.isStructure ? (r.structureType === 'campfire' ? '🔥' : r.structureType === 'shelter' ? '⛺' : '🚨') : this.crafting.getItemIcon(r.resultItem);

      let costStr = '';
      if (r.requiresCampfire) {
        costStr = '🍖 1 Daging Mentah (di dekat Api Unggun 3D)';
      } else {
        costStr = Object.entries(r.cost).map(([item, qty]) => `${this.crafting.getItemIcon(item)} ${qty} ${this.crafting.getItemName(item)}`).join(' + ');
      }

      return `
        <div class="recipe-card ${check.ok ? 'can-craft' : 'locked'}">
          <div class="recipe-icon">${icon}</div>
          <div class="recipe-info">
            <h4 class="recipe-title">${r.name}</h4>
            <p class="recipe-desc">${r.desc}</p>
            <div class="recipe-cost">${costStr}</div>
          </div>
          <button class="btn-craft-action" data-recipe="${r.id}" ${check.ok ? '' : 'disabled'}>
            ${check.ok ? (r.isStructure ? '🔨 Bangun 3D' : '⚡ Buat') : 'Terkunci'}
          </button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-craft-action:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeId = btn.getAttribute('data-recipe');
        const recipe = this.crafting.recipes.find(r => r.id === recipeId);
        if (recipe) {
          const res = this.crafting.craft(recipe, playerAdapter, worldAdapter);
          if (res === 'place_mode') {
            document.getElementById('crafting-modal').classList.remove('show');
            this.canvas.requestPointerLock();
            this.showFloatingText('Bidikan Crosshair ke tanah untuk menempatkan bangunan! [KLIK KIRI]', '#38bdf8');
          } else {
            this.showFloatingText(`Berhasil membuat ${recipe.name}!`, '#34d399');
          }
          this.renderHotbar();
          this.renderRecipes(category);
        }
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine3D = new GameEngine3D();
});
