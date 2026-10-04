/**
 * ISLA PERDIDA: SAR RESCUE - 3D ENTITIES & FIRST-PERSON HELD MODELS
 * First-person 3D hand/tool rig, 3D wild animals (Crab, Rabbit, Boar, Wolf),
 * 3D dropped loot items, and 3D floating hit text.
 */

// =========================================================================
// 1. FIRST PERSON HELD WEAPON / TOOL RIG
// =========================================================================
class FirstPersonToolRig {
  constructor(targetParent, worldCamera) {
    this.targetParent = targetParent;
    this.worldCamera = worldCamera || targetParent;

    this.container = new THREE.Group();
    // Default resting position (lower-right first-person view)
    this.basePos = new THREE.Vector3(0.26, -0.24, -0.44);
    this.container.position.copy(this.basePos);
    this.targetParent.add(this.container);

    this.currentTool = 'hands';
    this.swingProgress = 0;
    this.isSwinging = false;
    this.punchHand = 0; // Alternates 0 (right) and 1 (left)
    this.idleTime = 0;
    this.swayX = 0;
    this.swayY = 0;

    // First-person held torch light (lights the hand and tool)
    this.torchLight = new THREE.PointLight(0xf59e0b, 0, 3.5);
    this.torchLight.position.set(0, 0.45, -0.15);
    this.container.add(this.torchLight);

    // World torch light (illuminates surrounding trees, ground, animals in main scene)
    if (this.worldCamera) {
      this.worldTorchLight = new THREE.PointLight(0xf59e0b, 0, 24);
      this.worldTorchLight.position.set(0, 0, 0);
      this.worldCamera.add(this.worldTorchLight);
    }

    this.models = {};
    this.initModels();
    this.setEquipped('hands');
  }

  // Realistic human forearm, wrist, palm, curved fingers, and gripping thumb
  createHandAndArm(group, isLeft = false) {
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdf9f75,
      roughness: 0.6,
      metalness: 0.05
    });
    const armGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // 1. Forearm (slanted inward from screen edge)
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.082, 0.46, 12), skinMat);
    forearm.position.set(sign * 0.04, -0.22, 0.16);
    forearm.rotation.x = Math.PI / 4.2;
    forearm.rotation.z = sign * -Math.PI / 16;
    armGroup.add(forearm);

    // 2. Wrist joint
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.09, 10), skinMat);
    wrist.position.set(sign * 0.02, -0.06, 0.05);
    wrist.rotation.x = Math.PI / 5;
    armGroup.add(wrist);

    // 3. Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.08, 0.09), skinMat);
    palm.position.set(0, 0, 0);
    armGroup.add(palm);

    // 4. 4 Knuckles & Fingers wrapping tightly around the tool handle
    for (let f = 0; f < 4; f++) {
      const fy = 0.028 - f * 0.018;
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.014, 0.055), skinMat);
      finger.position.set(sign * -0.02, fy, -0.035);
      finger.rotation.y = sign * 0.3;
      armGroup.add(finger);
    }

    // 5. Thumb wrapping securely over the fingers from the side
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.035), skinMat);
    thumb.position.set(sign * 0.032, 0.025, -0.025);
    thumb.rotation.z = sign * -0.4;
    thumb.rotation.y = sign * -0.3;
    armGroup.add(thumb);

    group.add(armGroup);
    return armGroup;
  }

  initModels() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdf9f75, roughness: 0.6 });
    const woodTex = window.textureGen.getToolWoodTexture ? window.textureGen.getToolWoodTexture() : null;
    const stoneTex = window.textureGen.getStoneHeadTexture ? window.textureGen.getStoneHeadTexture() : null;
    const leatherTex = window.textureGen.getLeatherWrapTexture ? window.textureGen.getLeatherWrapTexture() : null;

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x5c2c16,
      map: woodTex,
      roughness: 0.75,
      bumpScale: 0.15
    });
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: stoneTex,
      roughness: 0.85,
      flatShading: true
    });
    const bladeEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.2,
      flatShading: true
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      map: leatherTex,
      roughness: 0.85
    });
    const cordMat = new THREE.MeshStandardMaterial({
      color: 0xa88464,
      roughness: 0.9
    });
    const flintMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      flatShading: true
    });

    // -------------------------------------------------------------
    // 1. Bare Hands (Survivalist Ready Fists)
    // -------------------------------------------------------------
    const handsGroup = new THREE.Group();

    // Right Fist
    const rArm = new THREE.Group();
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.46, 12), skinMat);
    rForearm.position.set(0.06, -0.2, 0.16);
    rForearm.rotation.x = Math.PI / 3.8;
    rForearm.rotation.z = -Math.PI / 14;
    const rFist = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.13), skinMat);
    rFist.position.set(0.02, 0.02, -0.02);
    const rKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.04, 0.05), skinMat);
    rKnuckles.position.set(0.02, 0.03, -0.07);
    rArm.add(rForearm, rFist, rKnuckles);
    handsGroup.add(rArm);
    this.fistRight = rArm;

    // Left Fist (Guard Stance)
    const lArm = new THREE.Group();
    lArm.position.set(-0.42, -0.04, 0.08);
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.46, 12), skinMat);
    lForearm.position.set(-0.06, -0.2, 0.16);
    lForearm.rotation.x = Math.PI / 3.6;
    lForearm.rotation.z = Math.PI / 14;
    const lFist = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.13), skinMat);
    lFist.position.set(-0.02, 0.02, -0.02);
    const lKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.04, 0.05), skinMat);
    lKnuckles.position.set(-0.02, 0.03, -0.07);
    lArm.add(lForearm, lFist, lKnuckles);
    handsGroup.add(lArm);
    this.fistLeft = lArm;

    this.container.add(handsGroup);
    this.models['hands'] = handsGroup;

    // -------------------------------------------------------------
    // 2. High-Detail Stone Axe (Kapak Batu Solid)
    // -------------------------------------------------------------
    const axeGroup = new THREE.Group();
    this.createHandAndArm(axeGroup, false);

    const axeHaftGroup = new THREE.Group();

    // Leather Grip on lower handle
    const gripHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.28, 10), leatherMat);
    gripHaft.position.set(0, -0.06, 0);
    axeHaftGroup.add(gripHaft);

    // Flared bottom pommel swell
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), woodMat);
    pommel.position.set(0, -0.21, 0.02);
    pommel.scale.set(1, 1.2, 1);
    axeHaftGroup.add(pommel);

    // Upper curved hardwood haft
    const upperHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.32, 10), woodMat);
    upperHaft.position.set(0, 0.22, -0.03);
    upperHaft.rotation.x = -0.15;
    axeHaftGroup.add(upperHaft);

    // Wooden haft tip protruding through top of stone head with wedge
    const topHaftTip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.08, 8), woodMat);
    topHaftTip.position.set(0, 0.39, -0.06);
    const wedge = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.025), flintMat);
    wedge.position.set(0, 0.41, -0.06);
    axeHaftGroup.add(topHaftTip, wedge);

    // Stone Axe Head Group (Solid, complete geometry)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.32, -0.05);

    // Central Stone Collar / Eye (securely encasing the haft)
    const stoneCollar = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.08), stoneMat);
    headGroup.add(stoneCollar);

    // Rear Hammer Poll (counterweight blunt stone head)
    const stonePoll = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.065), stoneMat);
    stonePoll.position.set(0, 0, 0.065);
    headGroup.add(stonePoll);

    // Forward Flared Cutting Blade Bit (Wide bearded crescent shape)
    const bladeNeck = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.13, 0.09), stoneMat);
    bladeNeck.position.set(0, -0.01, -0.075);
    headGroup.add(bladeNeck);

    // Flared blade bit
    const bladeBit = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.21, 0.08), bladeEdgeMat);
    bladeBit.position.set(0, -0.02, -0.14);
    // Honed razor cutting edge
    const sharpEdge = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.23, 0.03), bladeEdgeMat);
    sharpEdge.position.set(0, -0.02, -0.185);
    headGroup.add(bladeBit, sharpEdge);

    // Rawhide / Sinew Lashings in tight 'X' binding
    for (let c = 0; c < 5; c++) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.014, 8), cordMat);
      cord.position.set(0, -0.04 + c * 0.02, 0);
      cord.rotation.x = Math.PI / 2;
      cord.scale.set(1.2, 1, 1.4);
      headGroup.add(cord);
    }
    const xLash1 = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.015, 0.12), cordMat);
    xLash1.rotation.y = 0.55;
    const xLash2 = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.015, 0.12), cordMat);
    xLash2.rotation.y = -0.55;
    headGroup.add(xLash1, xLash2);

    axeHaftGroup.add(headGroup);
    axeHaftGroup.rotation.x = Math.PI / 4.8;
    axeHaftGroup.rotation.y = -Math.PI / 18;
    axeHaftGroup.position.set(0, 0.03, -0.04);
    axeGroup.add(axeHaftGroup);

    this.container.add(axeGroup);
    this.models['axe'] = axeGroup;

    // -------------------------------------------------------------
    // 3. High-Detail Stone Pickaxe (Beliung Batu)
    // -------------------------------------------------------------
    const pickGroup = new THREE.Group();
    this.createHandAndArm(pickGroup, false);

    const pickHandleGroup = new THREE.Group();
    const pickGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.28, 10), leatherMat);
    pickGrip.position.set(0, -0.06, 0);
    const pickPommel = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), woodMat);
    pickPommel.position.set(0, -0.21, 0.02);
    const pickShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.34, 10), woodMat);
    pickShaft.position.set(0, 0.23, -0.02);
    pickHandleGroup.add(pickGrip, pickPommel, pickShaft);

    // Double-ended flint pick head
    const pickHeadGroup = new THREE.Group();
    pickHeadGroup.position.set(0, 0.35, -0.03);

    const pCenter = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.09, 0.08), flintMat);
    pickHeadGroup.add(pCenter);

    // Front Piercing Beak Spike
    const frontSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.24, 6), flintMat);
    frontSpike.position.set(0, -0.03, -0.16);
    frontSpike.rotation.x = -Math.PI / 2.3;
    // Rear Chisel Claw
    const rearChisel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.15), flintMat);
    rearChisel.position.set(0, -0.01, 0.12);
    rearChisel.rotation.x = 0.2;
    pickHeadGroup.add(frontSpike, rearChisel);

    // Lashings
    const pLash1 = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.016, 0.13), cordMat);
    pLash1.rotation.y = 0.6;
    const pLash2 = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.016, 0.13), cordMat);
    pLash2.rotation.y = -0.6;
    pickHeadGroup.add(pLash1, pLash2);

    pickHandleGroup.add(pickHeadGroup);
    pickHandleGroup.rotation.x = Math.PI / 4.8;
    pickHandleGroup.position.set(0, 0.03, -0.04);
    pickGroup.add(pickHandleGroup);

    this.container.add(pickGroup);
    this.models['pickaxe'] = pickGroup;

    // -------------------------------------------------------------
    // 4. High-Detail Hunting Spear (Tombak Berburu)
    // -------------------------------------------------------------
    const spearGroup = new THREE.Group();
    this.createHandAndArm(spearGroup, false);

    const spearShaftGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 1.4, 10), woodMat);
    shaft.position.set(0, 0, -0.42);
    shaft.rotation.x = Math.PI / 2;
    spearShaftGroup.add(shaft);

    const sGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 10), leatherMat);
    sGrip.position.set(0, 0, 0.02);
    sGrip.rotation.x = Math.PI / 2;
    spearShaftGroup.add(sGrip);

    // Knapped Flint Spearhead (Leaf Dagger Point)
    const spearHeadGroup = new THREE.Group();
    spearHeadGroup.position.set(0, 0, -1.14);

    const spearPoint = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.28, 4), flintMat);
    spearPoint.rotation.x = -Math.PI / 2;
    spearPoint.scale.set(1.4, 1, 0.4);

    const sCord = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 8), cordMat);
    sCord.rotation.x = Math.PI / 2;
    sCord.position.set(0, 0, 0.12);
    spearHeadGroup.add(spearPoint, sCord);

    spearShaftGroup.add(spearHeadGroup);
    spearShaftGroup.position.set(-0.02, 0.02, 0.06);
    spearGroup.add(spearShaftGroup);

    this.container.add(spearGroup);
    this.models['spear'] = spearGroup;

    // -------------------------------------------------------------
    // 5. High-Detail Burning Torch (Obor Api Kayu)
    // -------------------------------------------------------------
    const torchGroup = new THREE.Group();
    this.createHandAndArm(torchGroup, false);

    const torchStickGroup = new THREE.Group();
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.58, 10), woodMat);
    branch.position.set(0, 0.12, -0.05);
    branch.rotation.x = Math.PI / 8;
    torchStickGroup.add(branch);

    const headWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.14, 10), leatherMat);
    headWrap.position.set(0, 0.36, -0.15);
    headWrap.rotation.x = Math.PI / 8;
    torchStickGroup.add(headWrap);

    const twine = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.06, 8), cordMat);
    twine.position.set(0, 0.36, -0.15);
    twine.rotation.x = Math.PI / 8;
    torchStickGroup.add(twine);

    // Multi-Layer Animated 3D Flame
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 0.46, -0.19);

    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.28, 8),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.18, 6),
      new THREE.MeshBasicMaterial({ color: 0xffedd5 })
    );
    innerFlame.position.y = -0.02;
    flameGroup.add(outerFlame, innerFlame);
    torchStickGroup.add(flameGroup);

    torchGroup.add(torchStickGroup);
    this.torchFlameMesh = flameGroup;

    this.container.add(torchGroup);
    this.models['torch'] = torchGroup;

    // -------------------------------------------------------------
    // 6. Consumables & Held Resources
    // -------------------------------------------------------------

    // Coconut (Fresh Cracked Coconut)
    const coconutGroup = new THREE.Group();
    this.createHandAndArm(coconutGroup, false);
    const cocoShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      leatherMat
    );
    cocoShell.rotation.x = Math.PI;
    cocoShell.position.set(0, 0.08, -0.08);
    const cocoMeat = new THREE.Mesh(
      new THREE.SphereGeometry(0.098, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
    );
    cocoMeat.rotation.x = Math.PI;
    cocoMeat.position.set(0, 0.08, -0.08);
    coconutGroup.add(cocoShell, cocoMeat);
    this.container.add(coconutGroup);
    this.models['coconut'] = coconutGroup;

    // Red Berries
    const berryGroup = new THREE.Group();
    this.createHandAndArm(berryGroup, false);
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    for (let b = 0; b < 9; b++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), berryMat);
      s.position.set((Math.random() - 0.5) * 0.08, 0.06 + Math.random() * 0.04, -0.07 + (Math.random() - 0.5) * 0.08);
      berryGroup.add(s);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09), leafMat);
    stem.position.set(0, 0.1, -0.07);
    berryGroup.add(stem);
    this.container.add(berryGroup);
    this.models['berry'] = berryGroup;

    // Meat (Raw Meat on wooden spit)
    const rawMeatGroup = new THREE.Group();
    this.createHandAndArm(rawMeatGroup, false);
    const rSpit = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42), woodMat);
    rSpit.rotation.x = Math.PI / 4;
    rSpit.position.set(0, 0.08, -0.08);
    const rSteak = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
    );
    rSteak.position.set(0, 0.14, -0.14);
    rSteak.rotation.x = Math.PI / 4;
    rawMeatGroup.add(rSpit, rSteak);
    this.container.add(rawMeatGroup);
    this.models['raw_meat'] = rawMeatGroup;

    // Cooked Meat (Grilled Meat on wooden spit)
    const cookedMeatGroup = new THREE.Group();
    this.createHandAndArm(cookedMeatGroup, false);
    const cSpit = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42), woodMat);
    cSpit.rotation.x = Math.PI / 4;
    cSpit.position.set(0, 0.08, -0.08);
    const cSteak = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    cSteak.position.set(0, 0.14, -0.14);
    cSteak.rotation.x = Math.PI / 4;
    cookedMeatGroup.add(cSpit, cSteak);
    this.container.add(cookedMeatGroup);
    this.models['cooked_meat'] = cookedMeatGroup;

    // Canned Food
    const canGroup = new THREE.Group();
    this.createHandAndArm(canGroup, false);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 14), canMat);
    can.position.set(0, 0.07, -0.07);
    canGroup.add(can);
    this.container.add(canGroup);
    this.models['canned_food'] = canGroup;

    // Bandage / Medicine
    const bandGroup = new THREE.Group();
    this.createHandAndArm(bandGroup, false);
    const rollMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), rollMat);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 0.07, -0.07);
    bandGroup.add(roll);
    this.container.add(bandGroup);
    this.models['bandage'] = bandGroup;

    // Wood Log
    const woodGroup = new THREE.Group();
    this.createHandAndArm(woodGroup, false);
    const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.28, 10), woodMat);
    logMesh.rotation.x = Math.PI / 4;
    logMesh.position.set(0, 0.06, -0.07);
    woodGroup.add(logMesh);
    this.container.add(woodGroup);
    this.models['wood'] = woodGroup;

    // Stone / Flint
    const stoneGroup = new THREE.Group();
    this.createHandAndArm(stoneGroup, false);
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065), flintMat);
    chunk.position.set(0, 0.06, -0.07);
    stoneGroup.add(chunk);
    this.container.add(stoneGroup);
    this.models['stone'] = stoneGroup;

    // Construction Mallet (Campfire, Shelter, Beacon blueprint)
    const malletGroup = new THREE.Group();
    this.createHandAndArm(malletGroup, false);
    const malletHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.42, 8), woodMat);
    malletHaft.position.set(0, 0.06, -0.06);
    malletHaft.rotation.x = Math.PI / 4;
    const malletHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), woodMat);
    malletHead.position.set(0, 0.2, -0.2);
    malletHead.rotation.x = Math.PI / 4;
    malletGroup.add(malletHaft, malletHead);
    this.container.add(malletGroup);
    this.models['blueprint'] = malletGroup;
  }

  setEquipped(toolName) {
    let key = toolName;
    if (['rabbit_meat', 'crab_meat'].includes(toolName)) key = 'raw_meat';
    if (['flint'].includes(toolName)) key = 'stone';
    if (['fiber', 'leather', 'cloth', 'wolf_fang'].includes(toolName)) key = 'bandage';
    if (['campfire', 'shelter', 'beacon'].includes(toolName)) key = 'blueprint';
    if (!this.models[key]) key = 'hands';

    this.currentTool = key;
    for (let k in this.models) {
      this.models[k].visible = (k === key);
    }

    const isTorch = (key === 'torch');
    if (this.torchLight) this.torchLight.intensity = isTorch ? 2.5 : 0;
    if (this.worldTorchLight) this.worldTorchLight.intensity = isTorch ? 2.8 : 0;
  }

  triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
    if (this.currentTool === 'hands') {
      this.punchHand = (this.punchHand + 1) % 2; // Alternates left & right punches
    }
  }

  update(dt, controls) {
    this.idleTime += dt;

    // Torch flame flickering
    if (this.currentTool === 'torch') {
      const flicker = 0.88 + Math.random() * 0.25;
      if (this.torchLight) this.torchLight.intensity = 2.4 * flicker;
      if (this.worldTorchLight) this.worldTorchLight.intensity = 2.8 * flicker;
      if (this.torchFlameMesh) {
        this.torchFlameMesh.scale.set(flicker, 0.9 + Math.random() * 0.25, flicker);
      }
    }

    // Weapon Swing animation progress
    if (this.isSwinging) {
      const speed = (this.currentTool === 'spear') ? 7.0 : (this.currentTool === 'hands' ? 8.5 : 6.0);
      this.swingProgress += dt * speed;
      if (this.swingProgress >= 1.0) {
        this.swingProgress = 1.0;
        this.isSwinging = false;
      }
    } else {
      this.swingProgress = Math.max(0, this.swingProgress - dt * 4);
    }

    const t = this.swingProgress;
    const currentModel = this.models[this.currentTool];

    // Smooth Mouse Look Inertia Sway
    const mouseX = controls && controls.mouseDeltaX ? controls.mouseDeltaX : 0;
    const mouseY = controls && controls.mouseDeltaY ? controls.mouseDeltaY : 0;
    const targetSwayX = THREE.MathUtils.clamp(-mouseX * 0.0006, -0.06, 0.06);
    const targetSwayY = THREE.MathUtils.clamp(-mouseY * 0.0006, -0.05, 0.05);
    this.swayX += (targetSwayX - this.swayX) * Math.min(1, dt * 10);
    this.swayY += (targetSwayY - this.swayY) * Math.min(1, dt * 10);

    // Gentle breathing idle sway
    const breathY = Math.sin(this.idleTime * 2.2) * 0.004;
    const breathX = Math.cos(this.idleTime * 1.1) * 0.003;

    // Apply base container position
    this.container.position.set(
      this.basePos.x + breathX + this.swayX,
      this.basePos.y + breathY + this.swayY,
      this.basePos.z
    );

    if (currentModel) {
      if (this.currentTool === 'spear') {
        // High-velocity thrust along forward axis
        const thrust = Math.sin(t * Math.PI) * 0.38;
        currentModel.position.set(0, 0, -thrust);
        currentModel.rotation.set(0, 0, 0);
      } else if (this.currentTool === 'hands') {
        // Dual survival fists punching
        currentModel.position.set(0, 0, 0);
        currentModel.rotation.set(0, 0, 0);
        const punch = Math.sin(t * Math.PI) * 0.28;
        if (this.punchHand === 0 && this.fistRight) {
          this.fistRight.position.set(0, punch * 0.15, -punch);
          this.fistRight.rotation.z = punch * 0.8;
          if (this.fistLeft) this.fistLeft.position.set(-0.42, -0.04, 0.08);
        } else if (this.fistLeft) {
          this.fistLeft.position.set(-0.42, -0.04 + punch * 0.15, 0.08 - punch);
          this.fistLeft.rotation.z = -punch * 0.8;
          if (this.fistRight) this.fistRight.position.set(0, 0, 0);
        }
      } else if (['coconut', 'berry', 'raw_meat', 'cooked_meat', 'canned_food', 'bandage'].includes(this.currentTool)) {
        // Consumable eating/drinking motion: bring toward mouth
        const lift = Math.sin(t * Math.PI) * 0.18;
        currentModel.position.set(0, lift * 0.8, -lift * 0.5);
        currentModel.rotation.set(-lift * 1.2, 0, 0);
      } else {
        // Axe, Pickaxe, Blueprint: Powerful diagonal downward chop with windup & snap
        if (t < 0.35) {
          // Windup up and back
          const p = t / 0.35;
          currentModel.position.set(0.04 * p, 0.08 * p, 0.05 * p);
          currentModel.rotation.set(0.45 * p, 0.2 * p, -0.15 * p);
        } else {
          // Strike downward across center with recovery
          const p = (t - 0.35) / 0.65;
          const strike = Math.sin(p * Math.PI);
          currentModel.position.set(0.04 * (1 - p), -strike * 0.12, -strike * 0.15);
          currentModel.rotation.set(
            (0.45 * (1 - p)) - strike * 0.85,
            0.2 * (1 - p) - strike * 0.15,
            -0.15 * (1 - p) + strike * 0.25
          );
        }
      }
    }
  }
}

// =========================================================================
// 2. 3D WILD ANIMAL ENTITY
// =========================================================================
class Animal3D {
  constructor(type, x, z, scene, world3D) {
    this.type = type;
    this.scene = scene;
    this.world3D = world3D;

    this.hp = 3;
    this.maxHp = 3;
    this.speed = 4;
    this.radius = 1.2;
    this.state = 'idle';
    this.stateTimer = Math.random() * 3;
    this.angle = Math.random() * Math.PI * 2;
    this.attackCooldown = 0;
    this.animTimer = Math.random() * 10;
    this.hurtTimer = 0;
    this.threatDisplay = 0; // Crab defensive threat display

    if (type === 'crab') {
      this.name = 'Kepiting Pantai';
      this.hp = 2;
      this.maxHp = 2;
      this.speed = 2.8;
      this.radius = 0.9;
      this.drops = [{ item: 'crab_meat', count: 1 }];
    } else if (type === 'rabbit') {
      this.name = 'Kelinci Liar';
      this.hp = 3;
      this.maxHp = 3;
      this.speed = 8.5;
      this.radius = 0.7;
      this.drops = [{ item: 'rabbit_meat', count: 1 }, { item: 'fur', count: 1 }];
    } else if (type === 'boar') {
      this.name = 'Babi Hutan';
      this.hp = 8;
      this.maxHp = 8;
      this.speed = 5.0;
      this.chargeSpeed = 11.5;
      this.radius = 1.8;
      this.drops = [{ item: 'raw_meat', count: 2 }, { item: 'leather', count: 1 }];
    } else if (type === 'wolf') {
      this.name = 'Serigala Malam';
      this.hp = 7;
      this.maxHp = 7;
      this.speed = 9.2;
      this.radius = 1.6;
      this.drops = [{ item: 'raw_meat', count: 1 }, { item: 'wolf_fang', count: 1 }];
    }

    this.mesh = this.createMesh(type);
    const y = this.world3D.getTerrainHeightAt(x, z);
    this.mesh.position.set(x, y, z);
    this.scene.add(this.mesh);

    this.mesh.userData = { isAnimal: true, entity: this };
  }

  createMesh(type) {
    if (type === 'crab') return this.createCrab();
    if (type === 'rabbit') return this.createRabbit();
    if (type === 'boar') return this.createBoar();
    if (type === 'wolf') return this.createWolf();
    return new THREE.Group();
  }

  // =========================================================================
  // 1. REALISTIC SHORE CRAB (Grapsus grapsus / Sally Lightfoot / Rock Crab)
  // Anatomical vaulted carapace with lateral marginal spines, cervical groove,
  // articulated eyestalks with gloss compound eyes, sensory antennules,
  // heterochelous massive pincers with crushing teeth, and 8 jointed legs.
  // =========================================================================
  createCrab() {
    const group = new THREE.Group();

    // Natural crustacean color palette: mottled rich crimson-orange with sandy gradient
    const carapaceMat = new THREE.MeshStandardMaterial({
      color: 0xb43403,
      roughness: 0.42,
      metalness: 0.08,
      flatShading: false
    });
    const dorsalRidgeMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.5
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.65
    });
    const clawBaseMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.38
    });
    const clawTipMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.3
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.05,
      metalness: 0.3
    });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.5
    });

    const crabBody = new THREE.Group();
    crabBody.position.y = 0.22;

    // 1. Vaulted Dorsal Carapace (Flared oval shield with organic curvature)
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.18, 12), carapaceMat);
    shell.scale.set(1.28, 1.0, 0.95);
    shell.castShadow = true;
    crabBody.add(shell);

    // Raised Gastric & Cardiac Lobes (Dorsal anatomical contours)
    const gastricLobe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), dorsalRidgeMat);
    gastricLobe.scale.set(1.2, 0.4, 0.85);
    gastricLobe.position.set(0, 0.08, -0.06);
    const cardiacLobe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), dorsalRidgeMat);
    cardiacLobe.scale.set(1.1, 0.35, 0.9);
    cardiacLobe.position.set(0, 0.07, 0.15);
    crabBody.add(gastricLobe, cardiacLobe);

    // Lateral Anterolateral Spines (4 sharp jagged protective spines per side)
    for (let side of [-1, 1]) {
      for (let s = 0; s < 4; s++) {
        const spine = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), spineMat);
        const zAngle = -0.15 + s * 0.12;
        spine.position.set(side * (0.60 + Math.sin(s * 0.4) * 0.04), 0.02, zAngle);
        spine.rotation.z = side * (-Math.PI / 2.2 + s * 0.1);
        spine.rotation.y = side * 0.2;
        crabBody.add(spine);
      }
    }

    // 2. Ventral Plastron / Abdominal Apron (Tucked segmented plate on underside)
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.04, 10), bellyMat);
    apron.position.y = -0.10;
    apron.scale.set(1.1, 1.0, 0.9);
    crabBody.add(apron);

    // 3. Eyestalks with Glossy Compound Eyes & Corneal Specular Highlights
    this.eyestalks = [];
    for (let side of [-1, 1]) {
      const stalkGroup = new THREE.Group();
      stalkGroup.position.set(side * 0.15, 0.08, -0.38);

      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.16, 8), carapaceMat);
      stalk.position.y = 0.08;
      stalk.rotation.z = side * -0.22;
      stalk.rotation.x = -0.25;

      const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), eyeMat);
      eyeGlobe.position.set(0, 0.16, -0.04);
      const eyeSpecular = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 4), eyeHighlightMat);
      eyeSpecular.position.set(side * 0.02, 0.18, -0.07);

      stalkGroup.add(stalk, eyeGlobe, eyeSpecular);
      crabBody.add(stalkGroup);
      this.eyestalks.push(stalkGroup);
    }

    // 4. Sensory Antennules & Antennae (Twitching sensory whiskers between eyes)
    this.antennae = [];
    for (let side of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.18, 4), clawTipMat);
      ant.position.set(side * 0.05, 0.06, -0.44);
      ant.rotation.x = -Math.PI / 3;
      ant.rotation.z = side * 0.2;
      crabBody.add(ant);
      this.antennae.push(ant);
    }

    // 5. Maxillipeds (Crustacean mouthparts covering buccal cavity)
    for (let side of [-1, 1]) {
      const mouthPlate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), bellyMat);
      mouthPlate.position.set(side * 0.035, -0.02, -0.40);
      mouthPlate.rotation.x = 0.2;
      crabBody.add(mouthPlate);
    }

    // 6. Massive Articulated Chelipeds (Pincers / Claws)
    this.claws = [];
    for (let side of [-1, 1]) {
      const armRig = new THREE.Group();
      armRig.position.set(side * 0.38, 0.02, -0.26);

      // Merus (Upper arm connecting out from torso)
      const merus = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.26, 8), clawBaseMat);
      merus.position.set(side * 0.10, 0.04, -0.08);
      merus.rotation.z = side * -Math.PI / 3.8;
      merus.rotation.y = side * 0.35;

      // Carpus (Wrist joint)
      const carpus = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), clawBaseMat);
      carpus.position.set(side * 0.22, 0.06, -0.18);

      // Propodus (Swollen muscular palm of claw)
      const isCrusher = (side === 1); // Heterochelous: right is heavy crusher, left is swift cutter
      const palmWidth = isCrusher ? 0.24 : 0.19;
      const palmHeight = isCrusher ? 0.18 : 0.15;
      const propodus = new THREE.Mesh(new THREE.BoxGeometry(palmWidth, palmHeight, 0.28), clawBaseMat);
      propodus.position.set(side * 0.30, 0.10, -0.32);
      propodus.rotation.y = side * -0.25;

      // Fixed Lower Finger (Pollex) with crushing teeth
      const pollex = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), clawTipMat);
      pollex.position.set(side * 0.28, 0.06, -0.48);
      pollex.rotation.x = -Math.PI / 2.1;
      pollex.rotation.z = side * -0.15;

      // Movable Upper Finger (Dactylus) with curved gripping hook
      const dactylus = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.24, 6), clawTipMat);
      dactylus.position.set(side * 0.28, 0.15, -0.47);
      dactylus.rotation.x = -Math.PI / 1.95;
      dactylus.rotation.z = side * -0.15;

      armRig.add(merus, carpus, propodus, pollex, dactylus);
      crabBody.add(armRig);
      this.claws.push(armRig);
    }

    group.add(crabBody);
    this.crabBody = crabBody;

    // 7. 8 Jointed Walking Legs (Pereiopods - 4 on each side with realistic articulation)
    this.legsLeft = [];
    this.legsRight = [];

    for (let i = 0; i < 4; i++) {
      const zSpread = 0.26 - i * 0.18;
      const legScale = 1.0 - i * 0.06;

      // Left Leg
      const legL = new THREE.Group();
      legL.position.set(0.48, 0.18, zSpread);

      const coxaL = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.34 * legScale, 6), carapaceMat);
      coxaL.position.set(0.14, 0.06, 0);
      coxaL.rotation.z = -Math.PI / 3.6;

      const tibiaL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.020, 0.36 * legScale, 6), carapaceMat);
      tibiaL.position.set(0.32, -0.08, 0);
      tibiaL.rotation.z = Math.PI / 3.0;

      const dactylusL = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.22 * legScale, 5), clawTipMat);
      dactylusL.position.set(0.42, -0.22, 0);
      dactylusL.rotation.z = Math.PI / 1.8;

      legL.add(coxaL, tibiaL, dactylusL);
      group.add(legL);
      this.legsLeft.push(legL);

      // Right Leg
      const legR = new THREE.Group();
      legR.position.set(-0.48, 0.18, zSpread);

      const coxaR = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.34 * legScale, 6), carapaceMat);
      coxaR.position.set(-0.14, 0.06, 0);
      coxaR.rotation.z = Math.PI / 3.6;

      const tibiaR = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.020, 0.36 * legScale, 6), carapaceMat);
      tibiaR.position.set(-0.32, -0.08, 0);
      tibiaR.rotation.z = -Math.PI / 3.0;

      const dactylusR = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.22 * legScale, 5), clawTipMat);
      dactylusR.position.set(-0.42, -0.22, 0);
      dactylusR.rotation.z = -Math.PI / 1.8;

      legR.add(coxaR, tibiaR, dactylusR);
      group.add(legR);
      this.legsRight.push(legR);
    }

    return group;
  }

  // =========================================================================
  // 2. REALISTIC WILD HARE / RABBIT (Oryctolagus cuniculus / Lepus)
  // Sculpted arched hare spine, agouti brown coat with white chest ruff & bib,
  // anatomical hare skull with twitching philtrum & nose pad, whiskers,
  // large almond eyes, spoon-sculpted ears with pink inner pinna,
  // slender agile forepaws, and powerful z-folded hind leaping legs.
  // =========================================================================
  createRabbit() {
    const group = new THREE.Group();

    // Natural wild agouti pelt tones
    const agoutiMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b2f,
      roughness: 0.90,
      metalness: 0.02
    });
    const darkFurMat = new THREE.MeshStandardMaterial({
      color: 0x543216,
      roughness: 0.92
    });
    const whiteFurMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      roughness: 0.65
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.04,
      metalness: 0.3
    });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.38;

    // 1. Arched Muscular Spine & Pelvis Haunches
    const haunches = new THREE.Mesh(new THREE.SphereGeometry(0.30, 10, 10), agoutiMat);
    haunches.scale.set(0.92, 1.05, 1.15);
    haunches.position.set(0, 0.06, 0.14);
    haunches.castShadow = true;

    // Dark dorsal spine blanket
    const dorsalSpine = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), darkFurMat);
    dorsalSpine.scale.set(0.85, 0.9, 1.25);
    dorsalSpine.position.set(0, 0.12, 0.02);

    // Slender Thoracic Ribcage & Shoulders
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 10), agoutiMat);
    chest.position.set(0, 0.04, -0.15);
    chest.scale.set(0.88, 0.95, 1.05);

    // Creamy White Throat Bib & Chest Ruff
    const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), whiteFurMat);
    chestBib.position.set(0, -0.05, -0.16);
    chestBib.scale.set(0.85, 0.8, 1.0);

    // White Ventral Underbelly
    const underbelly = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 8), whiteFurMat);
    underbelly.position.set(0, -0.09, 0.08);
    underbelly.scale.set(0.80, 0.6, 1.1);

    bodyGroup.add(haunches, dorsalSpine, chest, chestBib, underbelly);

    // 2. Fluffy White Cottontail (Upward-bobbing scot tail)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.10, 0.35);
    const tailDorsal = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), darkFurMat);
    tailDorsal.position.set(0, 0.02, 0);
    const tailVentral = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), whiteFurMat);
    tailVentral.position.set(0, -0.02, 0.02);
    tailGroup.add(tailDorsal, tailVentral);
    tailGroup.rotation.x = 0.35;
    bodyGroup.add(tailGroup);
    this.rabbitTail = tailGroup;

    // 3. Anatomical Hare Head & Facial Features
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.20, -0.32);

    // Rounded cranium
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), agoutiMat);
    cranium.scale.set(0.88, 0.95, 1.05);

    // Tapering Muzzle with Cleft Philtrum
    const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.18, 8), agoutiMat);
    muzzle.rotation.x = -Math.PI / 2 - 0.15;
    muzzle.position.set(0, -0.04, -0.14);

    // Soft Pink-Toned Rhinarium (Nose Pad)
    const nosePad = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), pinkMat);
    nosePad.position.set(0, -0.02, -0.23);
    nosePad.scale.set(1.1, 0.8, 1.0);
    headGroup.add(cranium, muzzle, nosePad);
    this.rabbitNose = nosePad;

    // Whiskers (Fine sensory vibrissae projecting from muzzle cheeks)
    for (let side of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 3), whiskerMat);
        whisker.position.set(side * 0.08, -0.03 + w * 0.015, -0.18);
        whisker.rotation.z = side * (-Math.PI / 2.2 + w * 0.15);
        whisker.rotation.y = side * 0.3;
        headGroup.add(whisker);
      }
    }

    // Large Almond-Shaped Eyes with Specular Highlights
    for (let side of [-1, 1]) {
      const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeMat);
      eyeGlobe.position.set(side * 0.13, 0.06, -0.06);
      const eyeSpec = new THREE.Mesh(new THREE.SphereGeometry(0.010, 4, 4), eyeHighlightMat);
      eyeSpec.position.set(side * 0.145, 0.08, -0.075);
      headGroup.add(eyeGlobe, eyeSpec);
    }

    // 4. Spoon-Sculpted Alert Ears with Translucent Pink Inner Lining & Dark Tips
    this.ears = [];
    for (let side of [-1, 1]) {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.08, 0.15, -0.02);

      // Outer ear shell (Brown fur)
      const outerEar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.052, 0.44, 8), agoutiMat);
      outerEar.scale.set(0.38, 1.0, 1.0);
      outerEar.position.y = 0.22;

      // Dark brown ear tip
      const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.10, 6), darkFurMat);
      earTip.position.set(0, 0.45, 0);
      earTip.scale.set(0.4, 1.0, 1.0);

      // Pink inner pinna membrane
      const innerEar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.038, 0.36, 6), pinkMat);
      innerEar.scale.set(0.28, 1.0, 0.9);
      innerEar.position.set(0, 0.19, -0.015);

      earGroup.add(outerEar, earTip, innerEar);
      earGroup.rotation.z = side * -0.22;
      earGroup.rotation.x = -0.18;
      headGroup.add(earGroup);
      this.ears.push(earGroup);
    }

    bodyGroup.add(headGroup);
    this.rabbitHead = headGroup;
    group.add(bodyGroup);
    this.rabbitBody = bodyGroup;

    // 5. Slender Agile Forepaws (Front legs)
    this.frontLegs = [];
    for (let side of [-1, 1]) {
      const fLeg = new THREE.Group();
      fLeg.position.set(side * 0.10, 0.24, -0.16);

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.22, 6), agoutiMat);
      upperArm.position.y = -0.10;
      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.032, 0.09), whiteFurMat);
      paw.position.set(0, -0.21, -0.02);

      fLeg.add(upperArm, paw);
      group.add(fLeg);
      this.frontLegs.push(fLeg);
    }

    // 6. Powerful Z-Folded Hind Leaping Legs
    this.hindLegs = [];
    for (let side of [-1, 1]) {
      const hLeg = new THREE.Group();
      hLeg.position.set(side * 0.15, 0.28, 0.15);

      // Heavy Muscular Thigh
      const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), agoutiMat);
      thigh.scale.set(0.65, 1.25, 1.15);
      thigh.position.set(0, -0.04, 0);

      // Elongated Metatarsal Leaping Foot
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.22), agoutiMat);
      foot.position.set(0, -0.26, -0.03);
      const pawPad = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.09), whiteFurMat);
      pawPad.position.set(0, -0.275, -0.07);

      hLeg.add(thigh, foot, pawPad);
      group.add(hLeg);
      this.hindLegs.push(hLeg);
    }

    return group;
  }

  // =========================================================================
  // 3. REALISTIC WILD BOAR (Sus scrofa)
  // Powerful muscular wedge torso, high shoulder wither hump, dense dark
  // bristly coat with grizzled spinal mane, heavy triangular skull,
  // circular cartilaginous snout disc with deep dark nostrils, formidable
  // curved upward ivory lower tusks & whetters, cloven hooves with dewclaws.
  // =========================================================================
  createBoar() {
    const group = new THREE.Group();

    // Natural wild boar palette: coarse grizzled dark umber/charcoal
    const hideMat = new THREE.MeshStandardMaterial({
      color: 0x271912,
      roughness: 0.92,
      metalness: 0.02
    });
    const bristleManeMat = new THREE.MeshStandardMaterial({
      color: 0x120a05,
      roughness: 0.98
    });
    const snoutDiscMat = new THREE.MeshStandardMaterial({
      color: 0x4a2c1d,
      roughness: 0.78
    });
    const nostrilMat = new THREE.MeshStandardMaterial({
      color: 0x090502,
      roughness: 0.9
    });
    const tuskIvoryMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.35,
      metalness: 0.05
    });
    const tuskRootMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.5
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.1
    });
    const hoofMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.65
    });

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.80;

    // 1. Heavy Barrel Ribcage with High Shoulder Wither Hump
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.70, 1.30, 10), hideMat);
    chest.rotation.x = Math.PI / 2;
    chest.scale.set(0.92, 1.15, 1.0);
    chest.castShadow = true;

    // High shoulder hump (distinctive wild boar wither anatomy)
    const shoulderHump = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), hideMat);
    shoulderHump.scale.set(0.85, 1.1, 1.0);
    shoulderHump.position.set(0, 0.28, -0.28);

    // Leaner Sloping Rump / Hindquarters
    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.52, 8, 8), hideMat);
    rump.position.set(0, -0.04, 0.60);
    rump.scale.set(0.82, 0.95, 1.05);

    // 2. Thick Bristly Spinal Crest / Mane running from poll to rump
    const maneGroup = new THREE.Group();
    for (let m = 0; m < 5; m++) {
      const bristleChunk = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.32, 5), bristleManeMat);
      bristleChunk.position.set(0, 0.58 + (m === 1 || m === 2 ? 0.08 : 0), -0.55 + m * 0.28);
      bristleChunk.rotation.x = -0.25 + m * 0.1;
      maneGroup.add(bristleChunk);
    }
    this.boarMane = maneGroup;

    bodyGroup.add(chest, shoulderHump, rump, maneGroup);

    // 3. Heavy Muscular Neck & Wedge Skull
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.22, -0.75);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.50, 8), hideMat);
    neck.rotation.x = -Math.PI / 3.2;
    neck.position.set(0, 0.02, 0.05);

    // Triangular wedge skull with sloping brow
    const skull = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.95, 8), hideMat);
    skull.rotation.x = -Math.PI / 2 - 0.22;
    skull.position.set(0, 0.06, -0.40);
    skull.scale.set(0.82, 1.0, 1.0);

    // 4. Cartilaginous Snout Disc with Nostrils
    const snoutDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 10), snoutDiscMat);
    snoutDisc.rotation.x = -Math.PI / 2 - 0.22;
    snoutDisc.position.set(0, -0.12, -0.88);

    // Dark nostrils
    for (let side of [-1, 1]) {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), nostrilMat);
      nostril.position.set(side * 0.06, -0.11, -0.96);
      headGroup.add(nostril);
    }

    // 5. Formidable Curved Lower Ivory Tusks & Upper Whetters
    for (let side of [-1, 1]) {
      // Lower sharp weapon tusk curving upward & outward
      const tuskRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.10, 6), tuskRootMat);
      tuskRoot.position.set(side * 0.16, -0.12, -0.76);
      tuskRoot.rotation.z = side * -0.5;

      const tuskBlade = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.32, 6), tuskIvoryMat);
      tuskBlade.position.set(side * 0.22, 0.02, -0.78);
      tuskBlade.rotation.x = 0.45;
      tuskBlade.rotation.z = side * -0.55;

      // Upper grinder whetter
      const whetter = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 5), tuskIvoryMat);
      whetter.position.set(side * 0.18, -0.04, -0.72);
      whetter.rotation.x = -0.3;
      whetter.rotation.z = side * -0.4;

      headGroup.add(tuskRoot, tuskBlade, whetter);
    }

    // Deep-set Beady Eyes with protective brow ridges
    for (let side of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.12), hideMat);
      brow.position.set(side * 0.22, 0.22, -0.36);
      brow.rotation.z = side * -0.25;

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      eye.position.set(side * 0.23, 0.18, -0.38);
      headGroup.add(brow, eye);
    }

    // Furry Triangular Ears
    this.boarEars = [];
    for (let side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 4), bristleManeMat);
      ear.position.set(side * 0.28, 0.36, -0.15);
      ear.rotation.z = side * -0.42;
      ear.rotation.x = 0.22;
      headGroup.add(ear);
      this.boarEars.push(ear);
    }

    headGroup.add(neck, skull, snoutDisc);
    bodyGroup.add(headGroup);
    this.boarHead = headGroup;

    // 6. Thin Swishing Tail with Bristly Tuft
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.06, 1.0);
    const tailStem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.40, 4), hideMat);
    tailStem.position.set(0, -0.18, 0.08);
    tailStem.rotation.x = 0.45;
    const tailTuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), bristleManeMat);
    tailTuft.position.set(0, -0.36, 0.17);
    tailTuft.rotation.x = 0.55;
    tailGroup.add(tailStem, tailTuft);
    bodyGroup.add(tailGroup);
    this.boarTail = tailGroup;

    group.add(bodyGroup);
    this.boarBody = bodyGroup;

    // 7. 4 Heavy Muscular Legs with Cloven Hooves & Dewclaws
    this.boarLegs = [];
    const legPositions = [
      { x: -0.34, z: -0.42, front: true },
      { x: 0.34, z: -0.42, front: true },
      { x: -0.30, z: 0.52, front: false },
      { x: 0.30, z: 0.52, front: false }
    ];

    for (let lp of legPositions) {
      const leg = new THREE.Group();
      leg.position.set(lp.x, 0.80, lp.z);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.09, 0.48, 8), hideMat);
      thigh.position.y = -0.24;

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.42, 8), hideMat);
      shin.position.y = -0.54;

      // Cloven Hoof (Split into two keratin digits)
      const hoofLeft = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.14), hoofMat);
      hoofLeft.position.set(-0.038, -0.74, 0);
      const hoofRight = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.14), hoofMat);
      hoofRight.position.set(0.038, -0.74, 0);

      // Dewclaws behind the fetlock
      const dewclaw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), hoofMat);
      dewclaw.position.set(0, -0.68, 0.08);
      dewclaw.rotation.x = -0.5;

      leg.add(thigh, shin, hoofLeft, hoofRight, dewclaw);
      group.add(leg);
      this.boarLegs.push(leg);
    }

    return group;
  }

  // =========================================================================
  // 4. REALISTIC TIMBER WOLF (Canis lupus)
  // Deep athletic ribcage, tucked flank, multi-tone grizzled silver-grey coat
  // with dark charcoal dorsal saddle & pale cream throat bib, full bushy neck ruff,
  // broad wolf cranium with defined stop, black leather nose, powerful jaws
  // with visible razor-sharp white fangs & dark lips, luminous amber eyes,
  // long digitigrade legs with padded paws, and thick bushy brush tail.
  // =========================================================================
  createWolf() {
    const group = new THREE.Group();

    // Natural timber wolf coat palette
    const wolfCoatMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Grizzled timber slate grey
      roughness: 0.85,
      metalness: 0.02
    });
    const dorsalSaddleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark charcoal dorsal mantle
      roughness: 0.90
    });
    const throatBibMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Pale cream throat bib & underbelly
      roughness: 0.92
    });
    const neckRuffMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dense bushy neck fur
      roughness: 0.92
    });
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.35
    });
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24 // Luminous amber predator eyes
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const fangMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25
    });
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.6
    });

    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.74;

    // 1. Deep Athletic Ribcage & Slender Tucked Waist
    const ribcage = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.48, 0.90, 10), wolfCoatMat);
    ribcage.rotation.x = Math.PI / 2;
    ribcage.position.set(0, 0.08, -0.15);
    ribcage.scale.set(0.85, 1.1, 1.0);
    ribcage.castShadow = true;

    // Charcoal dorsal saddle/mantle along back
    const mantle = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), dorsalSaddleMat);
    mantle.position.set(0, 0.24, -0.05);
    mantle.scale.set(0.78, 0.6, 1.35);

    // Tucked flank / athletic loin
    const flank = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.70, 8), wolfCoatMat);
    flank.rotation.x = Math.PI / 2;
    flank.position.set(0, 0.05, 0.48);
    flank.scale.set(0.78, 0.95, 1.0);

    // Creamy white underbelly & throat bib
    const throatBib = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), throatBibMat);
    throatBib.position.set(0, -0.08, -0.34);
    throatBib.scale.set(0.75, 1.0, 1.1);

    bodyGroup.add(ribcage, mantle, flank, throatBib);

    // 2. Thick Bushy Neck Ruff / Mane framing the neck and shoulders
    const neckRuff = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.65, 8), neckRuffMat);
    neckRuff.rotation.x = -Math.PI / 2.5;
    neckRuff.position.set(0, 0.25, -0.58);
    neckRuff.scale.set(0.95, 1.0, 1.1);
    bodyGroup.add(neckRuff);

    // 3. Anatomical Wolf Head & Muzzle
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, -0.92);

    // Broad cranium with defined stop
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), wolfCoatMat);
    cranium.scale.set(0.85, 0.90, 1.15);

    // Tapering muzzle
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.36), wolfCoatMat);
    muzzle.position.set(0, -0.05, -0.24);

    // Moist black leather nose pad
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), noseMat);
    nose.position.set(0, -0.01, -0.42);

    // White Canine Fangs (Upper & lower predatory canines)
    for (let side of [-1, 1]) {
      const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.09, 4), fangMat);
      upperFang.position.set(side * 0.055, -0.10, -0.28);
      upperFang.rotation.x = Math.PI;

      const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.07, 4), fangMat);
      lowerFang.position.set(side * 0.048, -0.12, -0.26);

      headGroup.add(upperFang, lowerFang);
    }

    // Lower jaw & pink tongue
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.28), wolfCoatMat);
    lowerJaw.position.set(0, -0.13, -0.22);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.16), tongueMat);
    tongue.position.set(0, -0.11, -0.24);

    headGroup.add(cranium, muzzle, nose, lowerJaw, tongue);

    // Luminous Amber Predator Eyes with Pupil
    for (let side of [-1, 1]) {
      const eyeGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeMat);
      eyeGlobe.position.set(side * 0.12, 0.07, -0.12);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), pupilMat);
      pupil.position.set(side * 0.13, 0.075, -0.148);
      headGroup.add(eyeGlobe, pupil);
    }

    // Erect Triangular Furry Ears
    this.wolfEars = [];
    for (let side of [-1, 1]) {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.14, 0.22, 0.02);

      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 4), wolfCoatMat);
      ear.rotation.z = side * -0.28;
      ear.rotation.x = -0.14;

      const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.17, 4), throatBibMat);
      earInner.position.set(0, 0, -0.015);
      earInner.rotation.z = side * -0.28;
      earInner.rotation.x = -0.14;

      earGroup.add(ear, earInner);
      headGroup.add(earGroup);
      this.wolfEars.push(earGroup);
    }

    bodyGroup.add(headGroup);
    this.wolfHead = headGroup;

    // 4. Bushy Dense Timber Wolf Tail (Low downward carry with dark tip)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.15, 0.80);

    const tailUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 8), wolfCoatMat);
    tailUpper.position.set(0, -0.18, 0.10);
    tailUpper.rotation.x = 0.50;

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), dorsalSaddleMat);
    tailTip.position.set(0, -0.45, 0.24);
    tailTip.rotation.x = 0.65;

    tailGroup.add(tailUpper, tailTip);
    bodyGroup.add(tailGroup);
    this.wolfTail = tailGroup;

    group.add(bodyGroup);
    this.wolfBody = bodyGroup;

    // 5. 4 Long Digitigrade Running Legs with Paws
    this.wolfLegs = [];
    const wolfLegPositions = [
      { x: -0.26, z: -0.32, front: true },
      { x: 0.26, z: -0.32, front: true },
      { x: -0.24, z: 0.54, front: false },
      { x: 0.24, z: 0.54, front: false }
    ];

    for (let lp of wolfLegPositions) {
      const leg = new THREE.Group();
      leg.position.set(lp.x, 0.74, lp.z);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.44, 8), wolfCoatMat);
      upper.position.y = -0.22;

      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.40, 8), wolfCoatMat);
      lower.position.y = -0.52;

      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.065, 0.14), wolfCoatMat);
      paw.position.set(0, -0.72, -0.02);

      leg.add(upper, lower, paw);
      group.add(leg);
      this.wolfLegs.push(leg);
    }

    return group;
  }

  // =========================================================================
  // ANIMATION & LIFELIKE BEHAVIOR UPDATES
  // =========================================================================
  update(dt, player) {
    const pos = this.mesh.position;
    const distToPlayer = Math.hypot(player.x - pos.x, player.z - pos.z);

    this.stateTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    let moveSpeed = 0;

    // --- 1. CRAB UPDATE & ANIMATION ---
    if (this.type === 'crab') {
      const isPlayerThreat = (distToPlayer < 7.0);

      if (isPlayerThreat) {
        // Threat display: face player, raise claws, scuttle sideways away!
        this.threatDisplay = Math.min(1.0, this.threatDisplay + dt * 4.0);
        this.angle = Math.atan2(pos.z - player.z, pos.x - player.x) + (Math.sin(this.animTimer) > 0 ? 0.6 : -0.6);
        moveSpeed = this.speed * 1.2;
      } else {
        this.threatDisplay = Math.max(0, this.threatDisplay - dt * 2.0);
        if (this.stateTimer <= 0) {
          this.angle = Math.random() * Math.PI * 2;
          this.stateTimer = 2.5 + Math.random() * 3.5;
        }
        moveSpeed = this.speed;
      }

      pos.x += Math.cos(this.angle) * moveSpeed * dt;
      pos.z += Math.sin(this.angle) * moveSpeed * dt;
      this.mesh.rotation.y = this.angle + Math.PI / 2; // Anatomical sideways scuttle

      // Leg & Claw Articulation
      this.animTimer += dt * (moveSpeed * 3.2);

      // Alternating 4-leg wave pattern
      if (this.legsLeft && this.legsRight) {
        for (let i = 0; i < 4; i++) {
          const phase = this.animTimer + i * 0.9;
          this.legsLeft[i].rotation.z = Math.sin(phase) * 0.38;
          this.legsRight[i].rotation.z = -Math.sin(phase) * 0.38;
          this.legsLeft[i].position.y = 0.18 + Math.max(0, Math.sin(phase)) * 0.06;
          this.legsRight[i].position.y = 0.18 + Math.max(0, -Math.sin(phase)) * 0.06;
        }
      }

      // Claws: Snip and raise high during threat display
      if (this.claws) {
        this.claws.forEach((claw, i) => {
          const threatRaise = this.threatDisplay * 0.65;
          claw.rotation.x = -threatRaise + Math.sin(this.animTimer * 0.5 + i) * 0.12;
          claw.rotation.y = (i === 0 ? 1 : -1) * (0.35 + threatRaise * 0.5);
          claw.rotation.z = (i === 0 ? -1 : 1) * threatRaise * 0.4;
        });
      }

      // Twitching sensory antennae & eyestalks
      if (this.antennae) {
        this.antennae.forEach((ant, i) => {
          ant.rotation.z = (i === 0 ? 1 : -1) * (0.2 + Math.sin(this.animTimer * 2.5 + i) * 0.18);
        });
      }

    // --- 2. RABBIT UPDATE & ANIMATION ---
    } else if (this.type === 'rabbit') {
      const isFleeing = (distToPlayer < 15);

      if (isFleeing) {
        this.angle = Math.atan2(pos.z - player.z, pos.x - player.x);
        moveSpeed = this.speed;
      } else {
        if (this.stateTimer <= 0) {
          // 40% chance to pause and enter alert / sniffing idle
          if (Math.random() < 0.4) {
            this.state = 'idle_sniff';
            this.stateTimer = 1.5 + Math.random() * 2.0;
          } else {
            this.state = 'hopping';
            this.angle = Math.random() * Math.PI * 2;
            this.stateTimer = 2.0 + Math.random() * 3.0;
          }
        }
        moveSpeed = (this.state === 'hopping') ? this.speed * 0.45 : 0;
      }

      pos.x += Math.cos(this.angle) * moveSpeed * dt;
      pos.z += Math.sin(this.angle) * moveSpeed * dt;
      this.mesh.rotation.y = -this.angle + Math.PI / 2;

      // Realistic Bounding Hop Animation
      this.animTimer += dt * (moveSpeed > 0 ? moveSpeed * 1.8 : 3.0);
      const hopCycle = (moveSpeed > 0) ? Math.abs(Math.sin(this.animTimer)) : 0;
      const baseTerrainY = this.world3D.getTerrainHeightAt(pos.x, pos.z);
      pos.y = baseTerrainY + hopCycle * 0.32;

      if (this.frontLegs && this.hindLegs) {
        this.frontLegs.forEach(leg => { leg.rotation.x = -hopCycle * 0.70; });
        this.hindLegs.forEach(leg => { leg.rotation.x = hopCycle * 0.85; });
      }

      // Nose pad rapid olfactory twitching (8 Hz)
      if (this.rabbitNose) {
        this.rabbitNose.position.y = -0.02 + Math.sin(this.animTimer * 5.0) * 0.008;
      }

      // Independent ear swivel & alert positioning
      if (this.ears && this.ears.length === 2) {
        const earFlap = (moveSpeed > 0) ? -hopCycle * 0.35 : 0;
        this.ears[0].rotation.x = -0.18 + earFlap + Math.sin(this.animTimer * 0.8) * 0.12;
        this.ears[1].rotation.x = -0.18 + earFlap + Math.cos(this.animTimer * 0.7) * 0.12;
      }

      // Tail bobbing
      if (this.rabbitTail) {
        this.rabbitTail.rotation.x = 0.35 + hopCycle * 0.4;
      }

    // --- 3. WILD BOAR UPDATE & ANIMATION ---
    } else if (this.type === 'boar') {
      const isAggro = (this.hp < this.maxHp || distToPlayer < 11);

      if (isAggro) {
        this.angle = Math.atan2(player.z - pos.z, player.x - pos.x);
        moveSpeed = this.chargeSpeed;

        if (distToPlayer < this.radius + 1.2 && this.attackCooldown <= 0) {
          player.takeDamage(14, 'Diseruduk Babi Hutan');
          this.attackCooldown = 1.2;
          if (window.soundEngine && typeof window.soundEngine.playBoarGrunt === 'function') {
            window.soundEngine.playBoarGrunt();
          }
        }
      } else {
        if (this.stateTimer <= 0) {
          this.angle = Math.random() * Math.PI * 2;
          this.stateTimer = 2.5 + Math.random() * 4.0;
        }
        moveSpeed = this.speed * 0.45;
      }

      pos.x += Math.cos(this.angle) * moveSpeed * dt;
      pos.z += Math.sin(this.angle) * moveSpeed * dt;
      this.mesh.rotation.y = -this.angle + Math.PI / 2;

      // Heavy 4-Legged Muscular Gallop
      this.animTimer += dt * (moveSpeed * 2.2);
      const bGait = Math.sin(this.animTimer);

      if (this.boarLegs && this.boarLegs.length === 4) {
        this.boarLegs[0].rotation.x = bGait * 0.72;
        this.boarLegs[1].rotation.x = -bGait * 0.72;
        this.boarLegs[2].rotation.x = -bGait * 0.72;
        this.boarLegs[3].rotation.x = bGait * 0.72;
      }

      // Torso bobbing & Charging head tilt
      if (this.boarBody) {
        this.boarBody.position.y = 0.80 + Math.abs(bGait) * 0.08;
      }
      if (this.boarHead) {
        this.boarHead.rotation.x = isAggro ? -0.28 : Math.sin(this.animTimer * 0.5) * 0.10;
      }
      if (this.boarTail) {
        this.boarTail.rotation.z = Math.sin(this.animTimer * 1.5) * 0.35;
      }

    // --- 4. TIMBER WOLF UPDATE & ANIMATION ---
    } else if (this.type === 'wolf') {
      let nearFire = (player.equippedTool === 'torch' && distToPlayer < 18);
      this.world3D.structures3D.forEach(s => {
        if (s.userData.type === 'campfire' && Math.hypot(s.position.x - pos.x, s.position.z - pos.z) < 20) nearFire = true;
      });

      if (nearFire) {
        // Flee from fire/torch
        this.angle = Math.atan2(pos.z - player.z, pos.x - player.x);
        moveSpeed = this.speed * 1.1;
      } else if (distToPlayer < 24) {
        // Stalk / Hunt player
        this.angle = Math.atan2(player.z - pos.z, player.x - pos.x);
        moveSpeed = this.speed;

        if (distToPlayer < this.radius + 1.3 && this.attackCooldown <= 0) {
          player.takeDamage(16, 'Dicabik Serigala Hutan');
          this.attackCooldown = 1.0;
          if (window.soundEngine && typeof window.soundEngine.playWolfHowl === 'function') {
            window.soundEngine.playWolfHowl();
          }
        }
      } else {
        if (this.stateTimer <= 0) {
          this.angle = Math.random() * Math.PI * 2;
          this.stateTimer = 2.5 + Math.random() * 4.5;
        }
        moveSpeed = this.speed * 0.38;
      }

      pos.x += Math.cos(this.angle) * moveSpeed * dt;
      pos.z += Math.sin(this.angle) * moveSpeed * dt;
      this.mesh.rotation.y = -this.angle + Math.PI / 2;

      // Predator Diagonal Trotting Gait
      this.animTimer += dt * (moveSpeed * 2.1);
      const wGait = Math.sin(this.animTimer);

      if (this.wolfLegs && this.wolfLegs.length === 4) {
        this.wolfLegs[0].rotation.x = wGait * 0.75;
        this.wolfLegs[1].rotation.x = -wGait * 0.75;
        this.wolfLegs[2].rotation.x = -wGait * 0.75;
        this.wolfLegs[3].rotation.x = wGait * 0.75;
      }

      // Wolf Body & Tail fluid motion
      if (this.wolfBody) {
        this.wolfBody.position.y = 0.74 + Math.abs(wGait) * 0.05;
      }
      if (this.wolfTail) {
        this.wolfTail.rotation.y = Math.sin(this.animTimer * 0.7) * 0.40;
      }
      if (this.wolfHead) {
        this.wolfHead.rotation.x = (distToPlayer < 12) ? -0.15 : Math.sin(this.animTimer * 0.4) * 0.08;
      }
    }

    // Ground Height Clamping
    if (this.type !== 'rabbit') {
      pos.y = this.world3D.getTerrainHeightAt(pos.x, pos.z);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtTimer = 0.25;

    // Flinch recoil
    if (this.mesh) {
      this.mesh.position.y += 0.2;
    }

    if (window.soundEngine && typeof window.soundEngine.playHitFlesh === 'function') {
      window.soundEngine.playHitFlesh();
    }
    return this.hp <= 0;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

// =========================================================================
// 3. 3D DROPPED ITEM LOOT (Rich Realistic 3D Models & Guaranteed Magnetic Pickup)
// =========================================================================
class DroppedItem3D {
  constructor(itemType, count, x, z, scene, world3D) {
    this.itemType = itemType;
    this.count = count;
    this.scene = scene;
    this.world3D = world3D;
    this.isReadyToCollect = false;
    this.isCollected = false;

    this.mesh = this.createItemModel(itemType);
    const y = this.world3D.getTerrainHeightAt(x, z) + 0.38;
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;

    // Metadata for crosshair raycast & manual [E] or Left-Click interaction
    const itemName = window.craftingSystem ? window.craftingSystem.getItemName(itemType) : itemType;
    this.mesh.userData = {
      isDroppedItem: true,
      entity: this,
      name: itemName,
      itemType: itemType,
      count: count
    };

    this.scene.add(this.mesh);
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  createItemModel(itemType) {
    const group = new THREE.Group();

    // 1. Natural Wood Logs / Cut Timber
    if (itemType === 'wood') {
      const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c2c16, roughness: 0.85 });
      const woodRingsMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });

      const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.60, 8), barkMat);
      log1.rotation.z = Math.PI / 2;
      const cap1 = new THREE.Mesh(new THREE.CircleGeometry(0.088, 8), woodRingsMat);
      cap1.position.set(0.301, 0, 0);
      cap1.rotation.y = Math.PI / 2;
      log1.add(cap1);

      const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.52, 8), barkMat);
      log2.rotation.z = Math.PI / 2.2;
      log2.rotation.y = 0.55;
      log2.position.set(0, 0.10, 0);

      group.add(log1, log2);

    // 2. Dry Twigs & Branches
    } else if (itemType === 'twig') {
      const twigMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.015, 0.50, 5), twigMat);
        t.rotation.z = Math.PI / 2.3 + (i - 1) * 0.35;
        t.rotation.y = i * 0.6;
        t.position.y = i * 0.04;
        group.add(t);
      }

    // 3. Heavy Granite Stone Boulder
    } else if (itemType === 'stone') {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.88, flatShading: true });
      const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), stoneMat);
      const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 1), stoneMat);
      r2.position.set(0.18, 0.06, 0.09);
      group.add(r1, r2);

    // 4. Sharp Glossy Flint / Chert Node with Sparks
    } else if (itemType === 'flint') {
      const flintMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.15, flatShading: true });
      const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), flintMat);
      f.scale.set(1.2, 0.7, 0.9);
      const spark = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
      spark.position.set(0.08, 0.12, 0.05);
      group.add(f, spark);

    // 5. Fibrous Husked Coconut
    } else if (itemType === 'coconut') {
      const cocoMat = new THREE.MeshStandardMaterial({ color: 0x613613, roughness: 0.82 });
      const coco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), cocoMat);
      coco.scale.set(0.92, 1.15, 0.92);

      // 3 Germ pores (eyes of the coconut)
      const poreMat = new THREE.MeshBasicMaterial({ color: 0x271406 });
      for (let p = 0; p < 3; p++) {
        const pore = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6), poreMat);
        const ang = (p / 3) * Math.PI * 2;
        pore.position.set(Math.cos(ang) * 0.06, 0.22, Math.sin(ang) * 0.06);
        pore.rotation.x = -Math.PI / 2;
        coco.add(pore);
      }
      group.add(coco);

    // 6. Succulent Wild Red Berries
    } else if (itemType === 'berry') {
      const bMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), stemMat);
      group.add(stem);
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), bMat);
        b.position.set((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.22);
        group.add(b);
      }

    // 7. Fresh Succulent Crab Meat / Claw Cut
    } else if (itemType === 'crab_meat') {
      const meatMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 6), meatMat);
      claw.rotation.z = Math.PI / 3;
      const flesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), whiteMat);
      flesh.position.set(0.08, -0.06, 0);
      group.add(claw, flesh);

    // 8. Tender Rabbit Meat Cutlet
    } else if (itemType === 'rabbit_meat') {
      const rMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.55 });
      const cut = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.18), rMat);
      group.add(cut);

    // 9. Marbled Raw Meat / Steaks
    } else if (itemType === 'raw_meat') {
      const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.5 });
      const steak = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.24), redMat);
      const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 6), boneMat);
      bone.position.set(-0.16, 0, 0);
      group.add(steak, bone);

    // 10. Roasted Cooked Meat
    } else if (itemType === 'cooked_meat') {
      const cMat = new THREE.MeshStandardMaterial({ color: 0x54230b, roughness: 0.7 });
      const steak = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.24), cMat);
      group.add(steak);

    // 11. Tanned Animal Leather / Hide
    } else if (itemType === 'leather') {
      const lMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.38, 8), lMat);
      roll.rotation.z = Math.PI / 2;
      group.add(roll);

    // 12. Soft Fluffy Fur Pelt
    } else if (itemType === 'fur') {
      const furMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
      const pelt = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), furMat);
      pelt.scale.set(1.2, 0.5, 1.4);
      group.add(pelt);

    // 13. Sharp Curved Wolf Fang
    } else if (itemType === 'wolf_fang') {
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.3 });
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), fangMat);
      fang.rotation.z = Math.PI / 4;
      group.add(fang);

    // 14. Broad Palm Leaf Frond
    } else if (itemType === 'palm_leaf') {
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.24), leafMat);
      leaf.rotation.x = -Math.PI / 2.8;
      group.add(leaf);

    // 15. Natural Plant Fiber / Twine
    } else if (itemType === 'fiber') {
      const fibMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 6, 12), fibMat);
      group.add(coil);

    // 16. Clean Canvas Cloth / Bandage
    } else if (itemType === 'cloth' || itemType === 'bandage') {
      const cMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.30, 8), cMat);
      roll.rotation.z = Math.PI / 2;
      group.add(roll);

    // 17. Canned Survival Ration Tin
    } else if (itemType === 'canned_food') {
      const tinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), tinMat);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.14, 12), labelMat);
      group.add(tin, label);

    // Default Fallback
    } else {
      const defMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
      const d = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), defMat);
      group.add(d);
    }

    // Glowing Halo Base Ring so item is instantly visible even in tall grass/shadows
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const haloRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.28, 16), haloMat);
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = -0.15;
    group.add(haloRing);

    return group;
  }

  update(dt, player) {
    if (this.isCollected) return;

    this.bobTimer += dt * 3.2;

    // Follow terrain height dynamically with levitating bob
    const curTerrainY = this.world3D.getTerrainHeightAt(this.mesh.position.x, this.mesh.position.z);
    this.mesh.position.y = curTerrainY + 0.38 + Math.sin(this.bobTimer) * 0.12;
    this.mesh.rotation.y += dt * 1.8;

    // Magnetic attraction to player's torso
    const dx = player.x - this.mesh.position.x;
    const dz = player.z - this.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 7.5 && dist > 0.05) {
      // Smooth accelerating pull towards player
      const spd = Math.min(dist * 0.95, (14 + (7.5 - dist) * 2.8) * dt);
      this.mesh.position.x += (dx / dist) * spd;
      this.mesh.position.z += (dz / dist) * spd;

      // Close proximity collection trigger
      if (dist < 2.2) {
        this.isReadyToCollect = true;
      }
    } else if (dist <= 0.05) {
      this.isReadyToCollect = true;
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

window.FirstPersonToolRig = FirstPersonToolRig;
window.Animal3D = Animal3D;
window.DroppedItem3D = DroppedItem3D;
