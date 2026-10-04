/**
 * ISLA PERDIDA: SAR RESCUE - PROCEDURAL HD TEXTURE GENERATOR
 * Generates high-resolution textures on HTML5 Canvas without external image files.
 * Provides bark, palm fronds, grass blades, sand, rock, and water normal maps.
 */

class TextureGenerator {
  constructor() {
    this.cache = {};
  }

  // 1. Water Ripple Normal Map (for ocean specular sparkle)
  getWaterNormalMap() {
    if (this.cache.waterNormal) return this.cache.waterNormal;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const idx = (y * 512 + x) * 4;
        const wave1 = Math.sin(x * 0.07 + y * 0.035);
        const wave2 = Math.cos(x * 0.045 - y * 0.065);
        const wave3 = Math.sin((x + y) * 0.055);
        const micro = Math.cos(x * 0.2 + y * 0.15) * 0.25;
        const total = (wave1 + wave2 + wave3 + micro) / 3.25;

        // Normal map tangents: R=X, G=Y, B=Z (upward)
        const nx = Math.sin(total * Math.PI) * 0.45 + 0.5;
        const ny = Math.cos(total * Math.PI) * 0.45 + 0.5;
        const nz = 0.92;

        data[idx] = Math.floor(nx * 255);
        data[idx + 1] = Math.floor(ny * 255);
        data[idx + 2] = Math.floor(nz * 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    this.cache.waterNormal = texture;
    return texture;
  }

  // 2. HD Palm Leaf Frond Texture (with alpha transparency)
  getPalmFrondTexture() {
    if (this.cache.palmFrond) return this.cache.palmFrond;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 1024);

    // Center rachis (tapered leaf stem)
    const stemGrad = ctx.createLinearGradient(256, 1024, 256, 20);
    stemGrad.addColorStop(0, '#65a30d');
    stemGrad.addColorStop(0.6, '#84cc16');
    stemGrad.addColorStop(1, '#bef264');
    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(256, 1020);
    ctx.quadraticCurveTo(256, 450, 256, 30);
    ctx.stroke();

    // Secondary rachis highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(254, 1000);
    ctx.quadraticCurveTo(254, 450, 254, 40);
    ctx.stroke();

    // Leaflets fanning out to left and right with high density
    const numLeaflets = 110;
    for (let i = 0; i < numLeaflets; i++) {
      const y = 1000 - (i / numLeaflets) * 970;
      const progress = i / numLeaflets;
      const length = Math.sin(progress * Math.PI) * 220 + 25;

      // Color variation across leaflets
      const greenHue = 100 + Math.random() * 35;
      const lightness = 28 + Math.random() * 22;
      ctx.fillStyle = `hsl(${greenHue}, 75%, ${lightness}%)`;

      // Left leaflet
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.quadraticCurveTo(256 - length * 0.65, y - 28, 256 - length, y + 45);
      ctx.quadraticCurveTo(256 - length * 0.5, y + 12, 256, y + 10);
      ctx.fill();

      // Left highlight
      ctx.strokeStyle = `hsl(${greenHue}, 85%, ${lightness + 18}%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(256, y + 2);
      ctx.quadraticCurveTo(256 - length * 0.65, y - 26, 256 - length, y + 45);
      ctx.stroke();

      // Right leaflet
      ctx.fillStyle = `hsl(${greenHue + 5}, 70%, ${lightness - 4}%)`;
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.quadraticCurveTo(256 + length * 0.65, y - 28, 256 + length, y + 45);
      ctx.quadraticCurveTo(256 + length * 0.5, y + 12, 256, y + 10);
      ctx.fill();

      // Right highlight
      ctx.strokeStyle = `hsl(${greenHue + 5}, 85%, ${lightness + 14}%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(256, y + 2);
      ctx.quadraticCurveTo(256 + length * 0.65, y - 26, 256 + length, y + 45);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.palmFrond = texture;
    return texture;
  }

  // 3. HD Grass Blade Cluster Texture (With flower buds & gradient shading)
  getGrassTexture() {
    if (this.cache.grass) return this.cache.grass;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    // Draw 34 curved, detailed grass blades
    for (let i = 0; i < 34; i++) {
      const startX = 60 + Math.random() * 392;
      const height = 240 + Math.random() * 240;
      const curve = (Math.random() - 0.5) * 160;

      const baseHue = 105 + Math.random() * 35;
      const bladeGrad = ctx.createLinearGradient(startX, 512, startX + curve, 512 - height);
      bladeGrad.addColorStop(0, `hsl(${baseHue}, 80%, 22%)`);
      bladeGrad.addColorStop(0.5, `hsl(${baseHue}, 75%, 38%)`);
      bladeGrad.addColorStop(1, `hsl(${baseHue + 15}, 85%, 55%)`);

      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(startX - 9, 512);
      ctx.quadraticCurveTo(startX + curve * 0.35, 512 - height * 0.6, startX + curve, 512 - height);
      ctx.quadraticCurveTo(startX + curve * 0.65, 512 - height * 0.4, startX + 9, 512);
      ctx.closePath();
      ctx.fill();

      // Blade center spine line for depth
      ctx.strokeStyle = `rgba(255, 255, 255, 0.22)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, 512);
      ctx.quadraticCurveTo(startX + curve * 0.4, 512 - height * 0.5, startX + curve, 512 - height);
      ctx.stroke();

      // Wildflower blossoms on select blades (yellow, coral, or white buds)
      if (i % 7 === 0) {
        const flowerColor = (i % 14 === 0) ? '#fde047' : '#f43f5e';
        const tipX = startX + curve;
        const tipY = 512 - height;

        ctx.fillStyle = flowerColor;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.grass = texture;
    return texture;
  }

  // 4. Palm Trunk Bark Texture (Ringed horizontal bark with fibrous husk)
  getPalmTrunkTexture() {
    if (this.cache.palmTrunk) return this.cache.palmTrunk;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base rich coconut wood
    const baseGrad = ctx.createLinearGradient(0, 0, 512, 0);
    baseGrad.addColorStop(0, '#5c2c0e');
    baseGrad.addColorStop(0.5, '#78350f');
    baseGrad.addColorStop(1, '#5c2c0e');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 1024);

    // Horizontal bark rings and leaf scar joints
    for (let y = 0; y < 1024; y += 26) {
      // Dark under-crevice
      ctx.fillStyle = 'rgba(30, 15, 5, 0.85)';
      ctx.fillRect(0, y, 512, 8);

      // Light raised lip
      ctx.fillStyle = 'rgba(217, 119, 6, 0.45)';
      ctx.fillRect(0, y + 8, 512, 6);

      // Fine fiber notches
      for (let x = 0; x < 512; x += 18) {
        ctx.fillStyle = 'rgba(15, 8, 3, 0.5)';
        ctx.fillRect(x + (y % 16), y, 3, 14);
      }
    }

    // Vertical coconut fibrous noise
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(20, 10, 5, 0.35)' : 'rgba(245, 158, 11, 0.18)';
      ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 12 + Math.random() * 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    this.cache.palmTrunk = texture;
    return texture;
  }

  // 5. Sand Surface Texture (Ripples & Shells)
  getSandTexture() {
    if (this.cache.sand) return this.cache.sand;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 512, 512);

    // Wave ripples
    for (let y = 0; y < 512; y += 22) {
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(128, y - 6, 384, y + 6, 512, y);
      ctx.stroke();
    }

    // Shell speckles
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.6 ? 'rgba(254, 243, 199, 0.65)' : 'rgba(161, 98, 7, 0.35)';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2.5, 2.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    this.cache.sand = texture;
    return texture;
  }

  // 6. Jungle Bark Texture (With vertical crevices and natural moss)
  getJungleBarkTexture() {
    if (this.cache.jungleBark) return this.cache.jungleBark;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep ancient hardwood base
    ctx.fillStyle = '#27160c';
    ctx.fillRect(0, 0, 512, 1024);

    // Deep vertical bark grooves
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 512;
      const width = 6 + Math.random() * 12;
      ctx.fillStyle = 'rgba(15, 8, 4, 0.85)';
      ctx.fillRect(x, 0, width, 1024);

      // Edge highlight
      ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
      ctx.fillRect(x + width, 0, 3, 1024);

      // Tropical moss & lichen patches
      if (Math.random() > 0.45) {
        const mossY = Math.random() * 850;
        const mossHeight = 50 + Math.random() * 140;
        const mossGrad = ctx.createLinearGradient(x, mossY, x, mossY + mossHeight);
        mossGrad.addColorStop(0, 'rgba(34, 197, 94, 0.65)');
        mossGrad.addColorStop(0.5, 'rgba(22, 101, 52, 0.8)');
        mossGrad.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
        ctx.fillStyle = mossGrad;
        ctx.fillRect(x - 4, mossY, width + 8, mossHeight);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    this.cache.jungleBark = texture;
    return texture;
  }

  // 7. Polished Hardwood Texture for Tool Hafts & Handles
  getToolWoodTexture() {
    if (this.cache.toolWood) return this.cache.toolWood;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base warm oak / hickory gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.3, '#78350f');
    grad.addColorStop(0.7, '#92400e');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Fine wood grain lines
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(30, 10, 2, 0.45)' : 'rgba(217, 119, 6, 0.2)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (Math.random() - 0.5) * 16, 170, x + (Math.random() - 0.5) * 16, 340, x + (Math.random() - 0.5) * 8, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    this.cache.toolWood = texture;
    return texture;
  }

  // 8. Chiseled Stone & Flint Texture for Axe / Pickaxe Heads
  getStoneHeadTexture() {
    if (this.cache.stoneHead) return this.cache.stoneHead;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark slate gray base
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 256, 256);

    // Chiseled fracture lines and mineral specks
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random();
      if (r < 0.3) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'; // Dark fracture
      } else if (r < 0.6) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)'; // Mid slate
      } else {
        ctx.fillStyle = 'rgba(203, 213, 225, 0.3)'; // Sharp quartz highlight
      }
      ctx.fillRect(x, y, 2 + Math.random() * 4, 1.5 + Math.random() * 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.stoneHead = texture;
    return texture;
  }

  // 9. Rawhide Leather & Cord Wrap Texture
  getLeatherWrapTexture() {
    if (this.cache.leatherWrap) return this.cache.leatherWrap;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Rich tanned leather base
    ctx.fillStyle = '#713f12';
    ctx.fillRect(0, 0, 256, 256);

    // Diagonal cord wrap bands
    ctx.strokeStyle = '#3e230a';
    ctx.lineWidth = 14;
    for (let y = -256; y < 512; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + 256);
      ctx.stroke();
    }

    // Cord highlight line
    ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)';
    ctx.lineWidth = 3;
    for (let y = -256; y < 512; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y - 5);
      ctx.lineTo(256, y + 256 - 5);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.leatherWrap = texture;
    return texture;
  }
}

window.textureGen = new TextureGenerator();
