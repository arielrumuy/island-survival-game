/**
 * ISLA PERDIDA: SAR RESCUE - HD 3D WORLD & ENVIRONMENT ENGINE
 * High-definition procedural terrain, instanced grass tufts, lush textured palm trees,
 * animated ocean with normal map waves, dynamic sun/moon sky, and SAR rescue helicopter.
 */

class World3D {
  constructor(scene) {
    this.scene = scene;
    this.islandRadius = 195; // 3D units (meters)

    // Time of day (0.0 to 24.0, starts at 07:00 AM)
    this.time = 7.0;
    this.day = 1;
    this.maxDaysForSar = 5;
    this.timeSpeed = 24 / 220; // 1 full day = 220 seconds
    this.isNight = false;

    // Weather
    this.weather = 'sunny';
    this.weatherTimer = 0;

    // SAR Status
    this.sarBeaconBuilt = false;
    this.sarBeaconLit = false;
    this.sarCountdown = 0;
    this.sarArrived = false;
    this.heliMesh = null;

    // Key points of interest
    this.waterSpringPos = new THREE.Vector3(-45, 0, -25);
    this.shipwreckPos = new THREE.Vector3(-60, 0, 140);
    this.rescueZonePos = new THREE.Vector3(120, 0, 130);

    // Collections
    this.objects3D = [];
    this.structures3D = [];
    this.interactableMeshes = [];

    // Animation timers
    this.waterTimer = 0;
    this.grassTime = 0;

    this.initLightingAndSky();
    this.initTerrain();
    this.initOcean();
    this.initGrassTufts();
    this.initShipwreck();
    this.initRescueBeaconZone();
    this.initVegetationAndRocks();
  }

  initLightingAndSky() {
    // Soft ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    // Sun directional light with shadow mapping
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 420;
    this.sunLight.shadow.camera.left = -160;
    this.sunLight.shadow.camera.right = 160;
    this.sunLight.shadow.camera.top = 160;
    this.sunLight.shadow.camera.bottom = -160;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Night Moon directional light
    this.moonLight = new THREE.DirectionalLight(0x93c5fd, 0.18);
    this.scene.add(this.moonLight);

    // Atmospheric fog
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0035);

    // Starfield for Night Sky
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 600; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 380;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 10;
      const z = r * Math.sin(phi) * Math.sin(theta);
      starCoords.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0 });
    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  initTerrain() {
    const size = 520;
    const segments = 140;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position.array;
    const colors = [];

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const height = this.getTerrainHeightAt(x, z);
      positions[i + 1] = height;

      // Realistic vertex colors
      const color = new THREE.Color();
      if (height < 0.2) {
        color.setHex(0x1e3a5f); // Deep seabed
      } else if (height < 2.8) {
        color.setHex(0xeab308); // Golden sand
      } else if (height > 12) {
        color.setHex(0x64748b); // Slate Mountain Rock
      } else {
        // Subtle grass color variation
        const varGreen = Math.sin(x * 0.2) * 0.04;
        color.setRGB(0.12 + varGreen, 0.50 + varGreen, 0.20); // Lush Tropical Green
      }

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const sandTex = window.textureGen.getSandTexture();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.08,
      bumpMap: sandTex,
      bumpScale: 0.15
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  getTerrainHeightAt(x, z) {
    const dist = Math.hypot(x, z);
    if (dist >= this.islandRadius) return -9.0; // Deep ocean floor

    const normDist = dist / this.islandRadius;

    if (normDist > 0.72) {
      // Beach shoreline (0.3m to 2.5m)
      const t = (1 - normDist) / 0.28;
      return 0.3 + t * 2.2 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.4;
    }

    // Inner Hills & Jungle
    const hillNoise = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 4.0 +
                      Math.sin(x * 0.08 + z * 0.06) * 1.6;
    let height = 2.5 + hillNoise;

    // Mountain elevation in North-East quadrant
    if (x > 15 && z < -15) {
      const mDist = Math.hypot(x - 75, z - -70);
      if (mDist < 75) {
        height += (1 - mDist / 75) * 18;
      }
    }

    // Freshwater Lake depression in West
    const lakeDist = Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z);
    if (lakeDist < 19) {
      height = -0.6 - (1 - lakeDist / 19) * 1.4;
    }

    return height;
  }

  getTerrainTypeAt(x, z) {
    const dist = Math.hypot(x, z);
    if (dist > this.islandRadius - 10) return 'water';
    if (Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z) < 19) return 'water';
    if (dist > this.islandRadius * 0.72) return 'sand';
    return 'grass';
  }

  initOcean() {
    // 3D Animated Ocean Water with Normal Map
    const oceanGeo = new THREE.PlaneGeometry(850, 850, 60, 60);
    oceanGeo.rotateX(-Math.PI / 2);

    this.waterNormalTex = window.textureGen.getWaterNormalMap();

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.82,
      roughness: 0.1,
      metalness: 0.45,
      normalMap: this.waterNormalTex,
      normalScale: new THREE.Vector2(0.8, 0.8)
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = 0.0;
    this.scene.add(this.oceanMesh);

    // Freshwater Spring Disk in Lake Crater
    const lakeGeo = new THREE.CircleGeometry(17, 32);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
      roughness: 0.06,
      normalMap: this.waterNormalTex,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });
    this.lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
    this.lakeMesh.position.set(this.waterSpringPos.x, 0.15, this.waterSpringPos.z);
    this.lakeMesh.userData = { isFreshwater: true, name: 'Danau Air Tawar Alami' };
    this.scene.add(this.lakeMesh);
    this.interactableMeshes.push(this.lakeMesh);
  }

  // --- Instanced 3D Grass Tufts Across Island ---
  initGrassTufts() {
    const grassTex = window.textureGen.getGrassTexture();
    const count = 2400;

    // Cross quad geometry with base sunken into ground so grass never hovers on slopes
    const bladeGeo = new THREE.BufferGeometry();
    const w = 1.35;
    const h = 1.6;
    const ySink = -0.35;

    // Vertices for cross-planes
    const vertices = new Float32Array([
      // Plane 1
      -w/2, ySink, 0,   w/2, ySink, 0,   w/2, h + ySink, 0,
      -w/2, ySink, 0,   w/2, h + ySink, 0,  -w/2, h + ySink, 0,
      // Plane 2 (rotated 90 deg)
      0, ySink, -w/2,   0, ySink, w/2,   0, h + ySink, w/2,
      0, ySink, -w/2,   0, h + ySink, w/2,   0, h + ySink, -w/2
    ]);

    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,
      0, 0,  1, 1,  0, 1,
      0, 0,  1, 0,  1, 1,
      0, 0,  1, 1,  0, 1
    ]);

    bladeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    bladeGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    bladeGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.8
    });

    this.grassInstanced = new THREE.InstancedMesh(bladeGeo, grassMat, count);
    this.grassInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 122;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;

      // Skip lake and high rocky mountain peaks
      if (Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z) < 22) continue;
      if (x > 50 && z < -50) continue;

      const y = this.getTerrainHeightAt(x, z);
      if (y > 1.8 && y < 11.5) {
        dummy.position.set(x, y, z);
        dummy.rotation.y = Math.random() * Math.PI;
        const s = 0.85 + Math.random() * 0.55;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        this.grassInstanced.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    this.grassInstanced.count = placed;
    this.grassInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassInstanced);
  }

  initShipwreck() {
    const shipGroup = new THREE.Group();
    shipGroup.position.copy(this.shipwreckPos);
    shipGroup.position.y = this.getTerrainHeightAt(this.shipwreckPos.x, this.shipwreckPos.z) + 0.2;
    shipGroup.rotation.y = 0.6;
    shipGroup.rotation.z = 0.22;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.88 });
    const hullGeo = new THREE.BoxGeometry(8, 4.5, 20);
    const hull = new THREE.Mesh(hullGeo, woodMat);
    hull.castShadow = true;
    shipGroup.add(hull);

    // Broken mast
    const mastGeo = new THREE.CylinderGeometry(0.35, 0.45, 14, 8);
    const mast = new THREE.Mesh(mastGeo, woodMat);
    mast.position.set(0, 7.5, 2);
    mast.rotation.x = -0.35;
    mast.castShadow = true;
    shipGroup.add(mast);

    // Tattered canvas sail
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide, roughness: 0.7 });
    const sailGeo = new THREE.PlaneGeometry(6, 8);
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(2.5, 6.5, 1);
    sail.rotation.y = 0.4;
    shipGroup.add(sail);

    this.scene.add(shipGroup);

    // Scattered Cargo Crates
    for (let i = 0; i < 5; i++) {
      const cx = this.shipwreckPos.x + (Math.random() - 0.5) * 22;
      const cz = this.shipwreckPos.z + (Math.random() - 0.5) * 22;
      this.createCrate(cx, cz);
    }
  }

  initRescueBeaconZone() {
    const sx = this.rescueZonePos.x;
    const sz = this.rescueZonePos.z;
    const sy = this.getTerrainHeightAt(sx, sz) + 0.12;

    const ringGeo = new THREE.RingGeometry(8, 9.5, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(sx, sy, sz);
    this.scene.add(ring);
  }

  initVegetationAndRocks() {
    // 1. HD Palm Trees along beaches (r: 135 to 175)
    for (let i = 0; i < 42; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 135 + Math.random() * 40;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      this.createPalmTree(x, z);
    }

    // 2. HD Jungle Trees (r: 30 to 125)
    for (let i = 0; i < 52; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 30 + Math.random() * 95;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      if (Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z) < 26) continue;
      this.createJungleTree(x, z);
    }

    // 3. HD Rocks & Boulders
    for (let i = 0; i < 35; i++) {
      let x, z;
      if (i < 18) {
        x = 65 + (Math.random() - 0.5) * 45;
        z = -65 + (Math.random() - 0.5) * 45;
      } else {
        const ang = Math.random() * Math.PI * 2;
        const r = 40 + Math.random() * 110;
        x = Math.cos(ang) * r;
        z = Math.sin(ang) * r;
      }
      this.createRock(x, z);
    }

    // 4. Berry Bushes
    for (let i = 0; i < 30; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 35 + Math.random() * 95;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      this.createBerryBush(x, z);
    }
  }

  createPalmTree(x, z) {
    const y = this.getTerrainHeightAt(x, z);
    if (y < 0.6) return; // Prevent spawning in ocean water
    if (Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z) < 22) return; // Not in lake
    const group = new THREE.Group();
    // Anchor trunk base 0.5m deep into the earth so on slopes/hills it NEVER floats!
    group.position.set(x, y - 0.5, z);

    // Textured Trunk
    const trunkTex = window.textureGen.getPalmTrunkTexture();
    const trunkMat = new THREE.MeshStandardMaterial({
      map: trunkTex,
      roughness: 0.85,
      bumpScale: 0.25
    });

    // Realistic multi-tier curved palm trunk
    const leanAngle = (Math.random() - 0.5) * 0.28;
    const leanDir = Math.random() * Math.PI * 2;

    // Lower trunk segment
    const trunkLowerGeo = new THREE.CylinderGeometry(0.42, 0.62, 5.0, 10);
    const trunkLower = new THREE.Mesh(trunkLowerGeo, trunkMat);
    trunkLower.position.set(0, 2.5, 0);
    trunkLower.rotation.z = leanAngle * 0.5;
    trunkLower.castShadow = true;
    group.add(trunkLower);

    // Upper trunk segment (leaning more outward towards the sun)
    const trunkUpperGeo = new THREE.CylinderGeometry(0.32, 0.44, 5.0, 10);
    const trunkUpper = new THREE.Mesh(trunkUpperGeo, trunkMat);
    const upperX = Math.sin(leanDir) * 0.65;
    const upperZ = Math.cos(leanDir) * 0.65;
    trunkUpper.position.set(upperX, 6.8, upperZ);
    trunkUpper.rotation.z = leanAngle;
    trunkUpper.castShadow = true;
    group.add(trunkUpper);

    // Coconut husk collar ring right beneath the fronds
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x3d1d0c, roughness: 0.95 });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 0.6, 8), collarMat);
    collar.position.set(upperX * 1.35, 9.2, upperZ * 1.35);
    group.add(collar);

    // Crown group that holds all fronds and coconuts (animated by wind!)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(upperX * 1.35, 9.4, upperZ * 1.35);

    // Detailed Palm Fronds with Feathered Alpha Leaflets
    const frondTex = window.textureGen.getPalmFrondTexture();
    const frondMat = new THREE.MeshStandardMaterial({
      map: frondTex,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.6
    });

    // Frond geometry translated so pivot is at the stem base!
    const frondGeoUpper = new THREE.PlaneGeometry(1.9, 6.5);
    frondGeoUpper.translate(0, 3.25, 0);

    const frondGeoLower = new THREE.PlaneGeometry(2.1, 7.5);
    frondGeoLower.translate(0, 3.75, 0);

    // Tier 1: 6 Upper Fronds arching slightly upward
    const numUpper = 6;
    for (let i = 0; i < numUpper; i++) {
      const ang = (i * Math.PI * 2) / numUpper + 0.15;
      const frond = new THREE.Mesh(frondGeoUpper, frondMat);
      frond.rotation.y = ang;
      frond.rotation.x = 0.52; // Tilted ~30 deg from vertical
      frond.rotation.z = (Math.random() - 0.5) * 0.12;
      frond.castShadow = true;
      crownGroup.add(frond);
    }

    // Tier 2: 9 Lower Fronds drooping gracefully downward
    const numLower = 9;
    for (let i = 0; i < numLower; i++) {
      const ang = (i * Math.PI * 2) / numLower + 0.45;
      const frond = new THREE.Mesh(frondGeoLower, frondMat);
      frond.rotation.y = ang;
      frond.rotation.x = 1.15; // Drooping ~65 deg
      frond.rotation.z = (Math.random() - 0.5) * 0.18;
      frond.castShadow = true;
      crownGroup.add(frond);
    }

    // Natural Coconut Clusters
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
    const greenNutMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
    for (let i = 0; i < 5; i++) {
      const isGreen = i % 2 === 0;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), isGreen ? greenNutMat : nutMat);
      const nAng = i * 1.25;
      nut.position.set(Math.cos(nAng) * 0.65, -0.25, Math.sin(nAng) * 0.65);
      nut.scale.set(1.0, 1.25, 1.0);
      crownGroup.add(nut);
    }

    group.add(crownGroup);
    group.userData = {
      type: 'palm_tree',
      name: 'Pohon Kelapa Tropis',
      hp: 3,
      crown: crownGroup,
      drops: [
        { item: 'wood', count: 2 },
        { item: 'palm_leaf', count: 2 },
        { item: 'coconut', count: 1 }
      ]
    };

    this.scene.add(group);
    this.objects3D.push(group);
    this.interactableMeshes.push(trunkLower, trunkUpper);
    trunkLower.userData = group.userData;
    trunkUpper.userData = group.userData;
  }

  createJungleTree(x, z) {
    const y = this.getTerrainHeightAt(x, z);
    if (y < 1.6) return; // Jungle trees grow on land/hills
    if (Math.hypot(x - this.waterSpringPos.x, z - this.waterSpringPos.z) < 24) return; // Not in lake
    const group = new THREE.Group();
    // Anchor trunk base 0.6m deep into hill
    group.position.set(x, y - 0.6, z);

    // Textured Jungle Trunk
    const trunkTex = window.textureGen.getJungleBarkTexture();
    const trunkMat = new THREE.MeshStandardMaterial({
      map: trunkTex,
      roughness: 0.88,
      bumpScale: 0.3
    });

    const trunkGeo = new THREE.CylinderGeometry(0.65, 1.15, 10.5, 12);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 5.25;
    trunk.castShadow = true;
    group.add(trunk);

    // Flared Buttress Roots at base (anchor deeply into slopes)
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI * 2) / 4 + Math.random() * 0.3;
      const rootGeo = new THREE.BoxGeometry(0.38, 2.8, 2.0);
      const root = new THREE.Mesh(rootGeo, trunkMat);
      root.position.set(Math.cos(ang) * 1.0, 0.9, Math.sin(ang) * 1.0);
      root.rotation.y = -ang;
      root.rotation.x = 0.25;
      root.castShadow = true;
      group.add(root);
    }

    // Canopy Group
    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = 10.5;

    // Multi-layer Volumetric Canopies with subtle shade variations
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.82 });
    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(4.6, 1), leafMat1);
    foliage1.castShadow = true;
    canopyGroup.add(foliage1);

    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.6, 1), leafMat2);
    foliage2.position.set(1.8, 1.5, 1.2);
    foliage2.castShadow = true;
    canopyGroup.add(foliage2);

    const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.88 });
    const foliage3 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), leafMat3);
    foliage3.position.set(-1.6, 1.2, -1.2);
    foliage3.castShadow = true;
    canopyGroup.add(foliage3);

    // Hanging tropical vines / lianas
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const vAng = i * 2.1;
      const vineGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0, 4);
      const vine = new THREE.Mesh(vineGeo, vineMat);
      vine.position.set(Math.cos(vAng) * 2.8, -1.8, Math.sin(vAng) * 2.8);
      canopyGroup.add(vine);
    }

    group.add(canopyGroup);

    group.userData = {
      type: 'jungle_tree',
      name: 'Pohon Hutan Lebat',
      hp: 4,
      canopy: canopyGroup,
      drops: [
        { item: 'wood', count: 3 },
        { item: 'twig', count: 2 },
        { item: 'fiber', count: 1 }
      ]
    };

    this.scene.add(group);
    this.objects3D.push(group);
    this.interactableMeshes.push(trunk, foliage1);
    trunk.userData = group.userData;
    foliage1.userData = group.userData;
  }

  createRock(x, z) {
    const y = this.getTerrainHeightAt(x, z);
    if (y < 0.4) return;
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95, flatShading: true });
    const rad = 2.0 + Math.random() * 0.9;
    const rockGeo = new THREE.DodecahedronGeometry(rad, 1);
    const rock = new THREE.Mesh(rockGeo, rockMat);
    // Sit naturally embedded in hill slope
    rock.position.set(x, y + rad * 0.45, z);
    rock.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    rock.castShadow = true;

    rock.userData = {
      type: 'rock',
      name: 'Bongkahan Batu & Flint',
      hp: 4,
      drops: [
        { item: 'stone', count: 2 },
        { item: 'flint', count: Math.random() > 0.35 ? 1 : 0 }
      ]
    };

    this.scene.add(rock);
    this.objects3D.push(rock);
    this.interactableMeshes.push(rock);
  }

  createBerryBush(x, z) {
    const y = this.getTerrainHeightAt(x, z);
    if (y < 1.2) return;
    const group = new THREE.Group();
    // Embedded slightly so bush sits nicely on slopes
    group.position.set(x, y + 0.5, z);

    const bushMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const bush = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), bushMat);
    bush.castShadow = true;
    group.add(bush);

    // Red berries
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), berryMat);
      b.position.set((Math.random() - 0.5) * 1.8, 0.3 + Math.random() * 0.8, (Math.random() - 0.5) * 1.8);
      group.add(b);
    }

    group.userData = {
      type: 'berry_bush',
      name: 'Semak Buah Beri',
      hp: 1,
      drops: [
        { item: 'berry', count: 2 },
        { item: 'fiber', count: 2 }
      ]
    };

    this.scene.add(group);
    this.objects3D.push(group);
    this.interactableMeshes.push(bush);
    bush.userData = group.userData;
  }

  createCrate(x, z) {
    const y = this.getTerrainHeightAt(x, z);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), crateMat);
    crate.position.set(x, y + 0.68, z); // Embedded slightly to prevent hovering corner
    crate.rotation.y = Math.random() * Math.PI;
    crate.castShadow = true;

    crate.userData = {
      type: 'crate',
      name: 'Peti Kayu Kapal Karam',
      hp: 2,
      drops: [
        { item: 'cloth', count: 2 },
        { item: 'wood', count: 2 },
        { item: 'canned_food', count: 1 }
      ]
    };

    this.scene.add(crate);
    this.objects3D.push(crate);
    this.interactableMeshes.push(crate);
  }

  // --- Dynamic Player Structures (Campfire, Shelter, Beacon) ---
  buildStructure(type, pos) {
    const y = this.getTerrainHeightAt(pos.x, pos.z);
    const group = new THREE.Group();
    group.position.set(pos.x, y, pos.z);

    if (type === 'campfire') {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38), stoneMat);
        s.position.set(Math.cos(ang) * 1.3, 0.25, Math.sin(ang) * 1.3);
        group.add(s);
      }

      const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2), logMat);
      log1.rotation.z = Math.PI / 2;
      log1.rotation.y = 0.5;
      group.add(log1);

      // Flickering Fire Light
      const fireLight = new THREE.PointLight(0xf59e0b, 2.8, 24);
      fireLight.position.y = 1.1;
      group.add(fireLight);

      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.3, 6), flameMat);
      flame.position.y = 0.7;
      group.add(flame);

      group.userData = { type: 'campfire', name: 'Api Unggun Hangat', fireLight };

    } else if (type === 'shelter') {
      const thatchMat = new THREE.MeshStandardMaterial({ color: 0x166534, side: THREE.DoubleSide, roughness: 0.85 });
      const roofL = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.8), thatchMat);
      roofL.position.set(-1.3, 1.8, 0);
      roofL.rotation.y = Math.PI / 2;
      roofL.rotation.x = -0.65;
      group.add(roofL);

      const roofR = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.8), thatchMat);
      roofR.position.set(1.3, 1.8, 0);
      roofR.rotation.y = Math.PI / 2;
      roofR.rotation.x = 0.65;
      group.add(roofR);

      group.userData = { type: 'shelter', name: 'Gubuk / Tenda Daun (Tidur Melewati Malam)' };

    } else if (type === 'beacon') {
      const beamMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.9, 5.5, 6), beamMat);
      tower.position.y = 2.75;
      group.add(tower);

      const beaconLight = new THREE.PointLight(0xf97316, 0, 50);
      beaconLight.position.y = 5.6;
      group.add(beaconLight);

      group.userData = { type: 'beacon', name: 'Api Sinyal Raksasa SOS', beaconLight };
    }

    this.scene.add(group);
    this.structures3D.push(group);
    this.interactableMeshes.push(group);
    return group;
  }

  spawnSarHelicopter() {
    this.sarArrived = true;
    const hGroup = new THREE.Group();
    hGroup.position.set(this.rescueZonePos.x, 65, this.rescueZonePos.z + 190);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.4, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 9.5), bodyMat);
    hGroup.add(body);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.1, 2.6), glassMat);
    glass.position.set(0, 0.4, -4.0);
    hGroup.add(glass);

    const tailMat = new THREE.MeshStandardMaterial({ color: 0xc2410c });
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 8.5), tailMat);
    tail.position.set(0, 0.5, 8.0);
    hGroup.add(tail);

    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(19, 0.1, 0.85), rotorMat);
    rotor.position.set(0, 2.3, 0);
    hGroup.add(rotor);
    hGroup.userData = { rotor };

    // Searchlight
    const rescueLight = new THREE.SpotLight(0xfef08a, 4.5, 140, Math.PI / 4, 0.3);
    rescueLight.position.set(0, 0, 0);
    rescueLight.target.position.set(0, -65, 0);
    hGroup.add(rescueLight);
    hGroup.add(rescueLight.target);

    this.scene.add(hGroup);
    this.heliMesh = hGroup;

    if (window.soundEngine) {
      window.soundEngine.startHelicopterRotor();
    }
  }

  update(dt) {
    // 1. Advance Day/Night Clock
    this.time += dt * this.timeSpeed;
    if (this.time >= 24) {
      this.time = 0;
      this.day++;
    }

    this.isNight = (this.time >= 19.5 || this.time < 5.5);

    // 2. Day/Night Sun & Sky Cycle
    const sunAngle = ((this.time - 6) / 24) * Math.PI * 2;
    const sunDist = 240;
    this.sunLight.position.x = Math.cos(sunAngle) * sunDist;
    this.sunLight.position.y = Math.sin(sunAngle) * sunDist;
    this.sunLight.position.z = Math.sin(sunAngle * 0.5) * 80;

    if (this.time >= 6 && this.time < 18) {
      // Daytime
      this.sunLight.intensity = Math.max(0.2, Math.sin(sunAngle) * 1.35);
      this.ambientLight.intensity = 0.45;
      this.scene.fog.color.setHex(0x7dd3fc);
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.starPoints) this.starPoints.material.opacity = 0;
    } else if (this.time >= 18 && this.time < 19.5) {
      // Golden/Orange Sunset
      this.sunLight.intensity = 0.4;
      this.scene.fog.color.setHex(0xc2410c);
      this.scene.background = new THREE.Color(0x7c2d12);
      if (this.starPoints) this.starPoints.material.opacity = 0.2;
    } else {
      // Nighttime
      this.sunLight.intensity = 0.0;
      this.ambientLight.intensity = 0.08;
      this.scene.fog.color.setHex(0x050811);
      this.scene.background = new THREE.Color(0x020617);
      if (this.starPoints) this.starPoints.material.opacity = 0.9;
    }

    // 3. Water Waves Normal Map Offset Animation & Dynamic Wind Sway
    this.waterTimer += dt * 0.035;
    this.grassTime = (this.grassTime || 0) + dt;

    if (this.waterNormalTex) {
      this.waterNormalTex.offset.x = this.waterTimer;
      this.waterNormalTex.offset.y = this.waterTimer * 0.65;
    }

    // Natural wind sway on tree crowns and jungle canopies
    const windWobble = Math.sin(this.grassTime * 2.2);
    const windWobbleCos = Math.cos(this.grassTime * 1.8);
    for (let i = 0; i < this.objects3D.length; i++) {
      const obj = this.objects3D[i];
      if (obj.userData) {
        if (obj.userData.crown) {
          obj.userData.crown.rotation.z = windWobble * 0.045;
          obj.userData.crown.rotation.x = windWobbleCos * 0.03;
        } else if (obj.userData.canopy) {
          obj.userData.canopy.rotation.y = windWobble * 0.025;
        }
      }
    }

    // 4. SAR Countdown & Helicopter
    if (this.sarBeaconLit && !this.sarArrived) {
      this.sarCountdown -= dt;
      if (this.sarCountdown <= 0) {
        this.spawnSarHelicopter();
      }
    } else if (this.day >= this.maxDaysForSar && !this.sarArrived) {
      this.spawnSarHelicopter();
    }

    if (this.heliMesh) {
      this.heliMesh.userData.rotor.rotation.y += dt * 35;
      if (this.heliMesh.position.y > 6.5) {
        this.heliMesh.position.y -= dt * 7;
        this.heliMesh.position.z -= dt * 18;
      }
    }

    // 5. Flickering Lights
    this.structures3D.forEach(s => {
      if (s.userData.type === 'campfire' && s.userData.fireLight) {
        s.userData.fireLight.intensity = 2.2 + Math.random() * 0.8;
      }
      if (s.userData.type === 'beacon' && this.sarBeaconLit && s.userData.beaconLight) {
        s.userData.beaconLight.intensity = 4.2 + Math.random() * 1.6;
      }
    });
  }

  getAmbientTemperature() {
    let base = 27;
    if (this.isNight) base = 12;
    if (this.weather === 'rain') base -= 6;
    return base;
  }
}

window.World3D = World3D;
