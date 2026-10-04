/**
 * ISLA PERDIDA: SAR RESCUE - CRAFTING & 9-SLOT FIXED HOTBAR SYSTEM
 * Dedicated 9-slot hotbar, reliable key 1-9 bindings, item definitions, and crafting recipes.
 */

class CraftingSystem {
  constructor() {
    // Inventory dictionary: { itemId: count }
    this.inventory = {
      wood: 4,
      stone: 2,
      flint: 1,
      berry: 3,
      coconut: 2,
      canned_food: 1
    };

    // 9 Fixed Hotbar Slots (indices 0 to 8, mapped to keys 1 to 9)
    this.hotbarSlots = [
      'axe',         // Slot 1
      'spear',       // Slot 2
      'torch',       // Slot 3
      'berry',       // Slot 4
      'coconut',     // Slot 5
      'canned_food', // Slot 6
      'wood',        // Slot 7
      'stone',       // Slot 8
      'flint'        // Slot 9
    ];

    // Item definitions with metadata, names, icons, and consumption effects
    this.itemDefs = {
      wood: { name: 'Kayu Gelondong', icon: '🪵', type: 'material', desc: 'Bahan dasar membuat perkakas dan api unggun.' },
      stone: { name: 'Batu Keras', icon: '🪨', type: 'material', desc: 'Bahan membuat kapak, beliung, dan pondasi tungku.' },
      flint: { name: 'Batu Api (Flint)', icon: '🔥', type: 'material', desc: 'Menghasilkan percikan api untuk menyalakan unggun & obor.' },
      twig: { name: 'Ranting Kering', icon: '🌿', type: 'material', desc: 'Bahan penyulut api dan pengikat.' },
      palm_leaf: { name: 'Daun Palem Lebar', icon: '🍃', type: 'material', desc: 'Atap pelindung gubuk dan pembuat sinyal asap.' },
      fiber: { name: 'Serat Tali Alami', icon: '🌾', type: 'material', desc: 'Serat tumbuhan kuat untuk mengikat perkakas.' },
      cloth: { name: 'Kain Layar Kapal', icon: '🧣', type: 'material', desc: 'Kain tebal bekas kapal karam untuk pakaian dan tenda.' },
      leather: { name: 'Kulit Hewan Tebal', icon: '🥩', type: 'material', desc: 'Kulit babi hutan untuk perlengkapan pelindung.' },
      fur: { name: 'Bulu Kelinci', icon: '🐇', type: 'material', desc: 'Bulu lembut penghangat tubuh.' },
      wolf_fang: { name: 'Taring Serigala', icon: '🦷', type: 'material', desc: 'Trofi berburu predator malam.' },

      // Consumables / Food & Drink
      berry: { 
        name: 'Buah Beri Segar', 
        icon: '🫐', 
        type: 'food', 
        desc: 'Buah hutan manis. Memulihkan +15 Lapar dan +5 Haus.',
        use: (p) => { p.feed(15); p.quenchThirst(5); }
      },
      coconut: { 
        name: 'Kelapa Muda Segar', 
        icon: '🥥', 
        type: 'food', 
        desc: 'Air kelapa segar dan daging gurih. Memulihkan +30 Haus & +15 Lapar.',
        use: (p) => { p.quenchThirst(30); p.feed(15); }
      },
      crab_meat: { 
        name: 'Daging Kepiting', 
        icon: '🦀', 
        type: 'food', 
        desc: 'Daging kepiting mentah. Memulihkan +15 Lapar.',
        use: (p) => { p.feed(15); }
      },
      rabbit_meat: { 
        name: 'Daging Kelinci Mentah', 
        icon: '🥩', 
        type: 'food', 
        desc: 'Daging kelinci mentah. Memulihkan +20 Lapar.',
        use: (p) => { p.feed(20); }
      },
      raw_meat: { 
        name: 'Daging Mentah Babi Hutan', 
        icon: '🥩', 
        type: 'food', 
        desc: 'Daging mentah tebal. Memulihkan +25 Lapar.',
        use: (p) => { p.feed(25); }
      },
      cooked_meat: { 
        name: 'Daging Panggang Lezat', 
        icon: '🍖', 
        type: 'food', 
        desc: 'Daging matang beraroma harum! Memulihkan +50 Lapar & +30 HP!',
        use: (p) => { p.feed(50, 30); }
      },
      canned_food: { 
        name: 'Ransum Makanan Kaleng', 
        icon: '🥫', 
        type: 'food', 
        desc: 'Makanan kaleng selamat dari kapal karam. Memulihkan +45 Lapar & +20 HP!',
        use: (p) => { p.feed(45, 20); }
      },
      herb: { 
        name: 'Tanaman Obat Herbal', 
        icon: '🌱', 
        type: 'medicine', 
        desc: 'Dapat dikunyah untuk mengobati luka ringan (+15 HP).',
        use: (p) => { p.heal(15); if (window.soundEngine) window.soundEngine.playEat(); }
      },
      bandage: { 
        name: 'Perban Daun Herbal', 
        icon: '🩹', 
        type: 'medicine', 
        desc: 'Membalut luka parah dan memulihkan +40 HP.',
        use: (p) => { p.heal(40); if (window.soundEngine) window.soundEngine.playCraftSuccess(); }
      },

      // Tools & Weapons (Equippable)
      axe: { name: 'Kapak Batu', icon: '🪓', type: 'tool', toolId: 'axe', desc: 'Menebang pohon kelapa & kayu hutan 3x lebih cepat.' },
      pickaxe: { name: 'Beliung Batu', icon: '⛏️', type: 'tool', toolId: 'pickaxe', desc: 'Menambang batu keras dan batu api dengan efektif.' },
      spear: { name: 'Tombak Berburu', icon: '🗡️', type: 'tool', toolId: 'spear', desc: 'Senjata jarak jauh berdamage tinggi untuk berburu babi hutan.' },
      torch: { name: 'Obor Api Kayu', icon: '🔥', type: 'tool', toolId: 'torch', desc: 'Cahaya bergerak di malam hari, menghangatkan suhu tubuh, dan mengusir serigala.' }
    };

    // Crafting Recipes
    this.recipes = [
      // 1. Tools & Weapons
      {
        id: 'craft_axe',
        name: 'Kapak Batu',
        category: 'tools',
        resultItem: 'axe',
        resultCount: 1,
        cost: { wood: 3, stone: 2 },
        desc: 'Alat penting untuk menebang pohon kelapa & kayu hutan.'
      },
      {
        id: 'craft_pickaxe',
        name: 'Beliung Batu',
        category: 'tools',
        resultItem: 'pickaxe',
        resultCount: 1,
        cost: { wood: 3, stone: 3 },
        desc: 'Alat esensial untuk memecah bongkahan batu besar dan flint.'
      },
      {
        id: 'craft_spear',
        name: 'Tombak Berburu',
        category: 'tools',
        resultItem: 'spear',
        resultCount: 1,
        cost: { wood: 4, stone: 2, fiber: 2 },
        desc: 'Senjata ampuh menyerang hewan liar dari jarak aman.'
      },
      {
        id: 'craft_torch',
        name: 'Obor Api Kayu',
        category: 'tools',
        resultItem: 'torch',
        resultCount: 1,
        cost: { wood: 2, flint: 1, fiber: 2 },
        desc: 'Penerangan bergerak di malam hari & menghangatkan suhu tubuh.'
      },

      // 2. Structures & Shelters
      {
        id: 'build_campfire',
        name: 'Api Unggun (Campfire)',
        category: 'structures',
        isStructure: true,
        structureType: 'campfire',
        cost: { wood: 4, stone: 3, flint: 1 },
        desc: 'Penting! Mencegah kedinginan/hipotermia di malam hari dan tempat memasak daging.'
      },
      {
        id: 'build_shelter',
        name: 'Gubuk / Tenda Daun (Shelter)',
        category: 'structures',
        isStructure: true,
        structureType: 'shelter',
        cost: { wood: 6, palm_leaf: 6, fiber: 3 },
        desc: 'Tempat berteduh dari hujan badai dan tempat TIDUR untuk melewati malam dengan selamat.'
      },
      {
        id: 'build_beacon',
        name: 'Api Sinyal Raksasa SOS (SAR Beacon)',
        category: 'structures',
        isStructure: true,
        structureType: 'beacon',
        cost: { wood: 10, stone: 6, palm_leaf: 6, flint: 2 },
        desc: 'Tujuan Akhir! Dibangun di pantai untuk memancarkan sinyal asap raksasa ke Helikopter Tim SAR!'
      },

      // 3. Food & Medicine
      {
        id: 'craft_cooked_meat',
        name: 'Panggang Daging Lezat',
        category: 'food',
        resultItem: 'cooked_meat',
        resultCount: 1,
        requiresCampfire: true,
        cost: { raw_meat: 1 },
        desc: 'Dibuat di dekat Api Unggun! Memulihkan 50 Lapar & 30 HP.'
      },
      {
        id: 'craft_bandage',
        name: 'Perban Daun Herbal',
        category: 'food',
        resultItem: 'bandage',
        resultCount: 1,
        cost: { herb: 2, fiber: 2 },
        desc: 'Pertolongan pertama untuk menyembuhkan luka (+40 HP).'
      }
    ];

    this.structureToPlace = null;
    this.syncHotbar();
  }

  getItemName(id) {
    return this.itemDefs[id] ? this.itemDefs[id].name : id;
  }

  getItemIcon(id) {
    return this.itemDefs[id] ? this.itemDefs[id].icon : '📦';
  }

  hasItem(id, count = 1) {
    // Check weapons/tools which may not have countable inventory entry
    if (this.itemDefs[id] && this.itemDefs[id].type === 'tool') {
      return this.hotbarSlots.includes(id) || (this.inventory[id] || 0) >= count;
    }
    return (this.inventory[id] || 0) >= count;
  }

  addItem(id, count = 1) {
    this.inventory[id] = (this.inventory[id] || 0) + count;
    this.syncHotbar();
  }

  removeItem(id, count = 1) {
    if (!this.hasItem(id, count)) return false;
    if (this.inventory[id]) {
      this.inventory[id] -= count;
      if (this.inventory[id] <= 0) {
        delete this.inventory[id];
      }
    }
    this.syncHotbar();
    return true;
  }

  // Ensures hotbar slots are cleanly filled without gaps
  syncHotbar() {
    const invItems = Object.keys(this.inventory);

    // Make sure all hotbar items still exist
    for (let i = 0; i < 9; i++) {
      const item = this.hotbarSlots[i];
      if (item) {
        const isTool = this.itemDefs[item] && this.itemDefs[item].type === 'tool';
        if (!isTool && (!this.inventory[item] || this.inventory[item] <= 0)) {
          this.hotbarSlots[i] = null;
        }
      }
    }

    // Place new inventory items into first available slot
    invItems.forEach(item => {
      if (!this.hotbarSlots.includes(item)) {
        const emptyIdx = this.hotbarSlots.indexOf(null);
        if (emptyIdx !== -1) {
          this.hotbarSlots[emptyIdx] = item;
        }
      }
    });
  }

  canCraft(recipe, player, world) {
    if (recipe.requiresCampfire) {
      let nearCampfire = false;
      world.structures.forEach(s => {
        if (s.type === 'campfire' && Math.hypot(s.x - player.x, s.y - player.y) < 18) {
          nearCampfire = true;
        }
      });
      if (!nearCampfire) return { ok: false, reason: 'Harus berdiri di dekat Api Unggun!' };

      const hasMeat = this.hasItem('raw_meat') || this.hasItem('crab_meat') || this.hasItem('rabbit_meat');
      if (!hasMeat) return { ok: false, reason: 'Perlu Daging Mentah / Kepiting / Kelinci!' };
      return { ok: true };
    }

    for (let req in recipe.cost) {
      if (!this.hasItem(req, recipe.cost[req])) {
        return { ok: false, reason: `Kurang ${this.getItemName(req)} (Butuh: ${recipe.cost[req]})` };
      }
    }
    return { ok: true };
  }

  craft(recipe, player, world) {
    const check = this.canCraft(recipe, player, world);
    if (!check.ok) return false;

    // Deduct cost
    if (recipe.requiresCampfire) {
      if (this.hasItem('raw_meat')) this.removeItem('raw_meat', 1);
      else if (this.hasItem('rabbit_meat')) this.removeItem('rabbit_meat', 1);
      else if (this.hasItem('crab_meat')) this.removeItem('crab_meat', 1);
    } else {
      for (let req in recipe.cost) {
        this.removeItem(req, recipe.cost[req]);
      }
    }

    if (recipe.isStructure) {
      this.structureToPlace = recipe.structureType;
      return 'place_mode';
    } else {
      this.addItem(recipe.resultItem, recipe.resultCount);
      // Place crafted tool into hotbar
      if (!this.hotbarSlots.includes(recipe.resultItem)) {
        const emptyIdx = this.hotbarSlots.indexOf(null);
        if (emptyIdx !== -1) this.hotbarSlots[emptyIdx] = recipe.resultItem;
      }
      if (window.soundEngine) window.soundEngine.playCraftSuccess();
      return 'crafted';
    }
  }

  useItem(itemId, player) {
    const def = this.itemDefs[itemId];
    if (!def) return false;

    if (def.type === 'food' || def.type === 'medicine') {
      if (this.removeItem(itemId, 1)) {
        def.use(player);
        return true;
      }
    } else if (def.type === 'tool') {
      if (player.equippedTool === def.toolId) {
        player.equippedTool = 'hands';
      } else {
        player.equippedTool = def.toolId;
      }
      if (window.soundEngine) window.soundEngine.playSwingWeapon();
      return true;
    }
    return false;
  }
}

window.craftingSystem = new CraftingSystem();
