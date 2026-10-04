/**
 * ISLA PERDIDA: SAR RESCUE - FIRST PERSON CAMERA & CONTROLS
 * Handles Pointer Lock, Mouse Look (Pitch & Yaw), WASD Movement, Jumping,
 * Head-bobbing, and terrain boundary collision.
 */

class FPSControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    this.isLocked = false;
    this.pitch = 0; // Look up/down
    this.yaw = 0;   // Look left/right

    // Velocity & Physics
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 12; // normal walk
    this.sprintMultiplier = 1.7;
    this.isSprinting = false;

    // Jumping & Gravity
    this.canJump = true;
    this.verticalVelocity = 0;
    this.gravity = 32;
    this.jumpForce = 11;
    this.playerHeight = 2.4;

    // Head-bobbing
    this.bobTimer = 0;
    this.bobAmount = 0.08;
    this.bobFrequency = 10;

    // Keys state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.initEvents();
  }

  initEvents() {
    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = (document.pointerLockElement === this.domElement);
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.opacity = this.isLocked ? '1' : '0.4';
    });

    this.domElement.addEventListener('click', () => {
      // Don't lock if clicking on active modal
      const anyModalOpen = document.querySelector('.game-modal.show') || 
                           (document.getElementById('start-screen') && document.getElementById('start-screen').style.display !== 'none');
      if (!anyModalOpen && !this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    // Mouse movement for 3D Camera Look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      // Track mouse delta for weapon inertia and sway
      this.mouseDeltaX = (this.mouseDeltaX || 0) + movementX;
      this.mouseDeltaY = (this.mouseDeltaY || 0) + movementY;

      // Sensitivity
      const sensitivity = 0.0022;
      this.yaw -= movementX * sensitivity;
      this.pitch -= movementY * sensitivity;

      // Clamp vertical pitch (-85 to +85 degrees)
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

      this.updateCameraRotation();
    });

    // Key handlers
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'Space':
          if (this.canJump) {
            this.verticalVelocity = this.jumpForce;
            this.canJump = false;
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = false;
          break;
      }
    });
  }

  updateCameraRotation() {
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  update(dt, player, world3D) {
    if (!this.isLocked && !player.isAlive) return;

    // Movement Direction in horizontal plane (XZ)
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const isMoving = (this.direction.x !== 0 || this.direction.z !== 0);

    // Apply sprint stamina check
    const actuallySprinting = this.isSprinting && player.stamina > 10 && isMoving;
    const currentSpeed = this.speed * (actuallySprinting ? this.sprintMultiplier : 1.0);

    // Camera forward and right vectors projected onto XZ plane
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveVector = new THREE.Vector3();
    if (this.direction.z !== 0) moveVector.addScaledVector(forward, this.direction.z);
    if (this.direction.x !== 0) moveVector.addScaledVector(right, this.direction.x);
    moveVector.normalize().multiplyScalar(currentSpeed * dt);

    // Predict next XZ position
    const nextX = this.camera.position.x + moveVector.x;
    const nextZ = this.camera.position.z + moveVector.z;

    // Boundary check: Player cannot walk into deep ocean
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter < world3D.islandRadius - 5) {
      this.camera.position.x = nextX;
      this.camera.position.z = nextZ;
    }

    // Gravity and Jumping
    this.verticalVelocity -= this.gravity * dt;
    this.camera.position.y += this.verticalVelocity * dt;

    // Get terrain height at current position
    const groundHeight = world3D.getTerrainHeightAt(this.camera.position.x, this.camera.position.z);
    const minCameraY = groundHeight + this.playerHeight;

    if (this.camera.position.y <= minCameraY) {
      this.camera.position.y = minCameraY;
      this.verticalVelocity = 0;
      this.canJump = true;
    }

    // Head-bobbing effect
    if (isMoving && this.canJump) {
      const bobFreq = actuallySprinting ? 14 : 10;
      this.bobTimer += dt * bobFreq;
      const bobOffset = Math.sin(this.bobTimer) * this.bobAmount;
      this.camera.position.y += bobOffset;

      // Footstep sound interval
      this.footstepTimer = (this.footstepTimer || 0) + dt;
      if (this.footstepTimer > (actuallySprinting ? 0.32 : 0.48)) {
        this.footstepTimer = 0;
        const terrain = world3D.getTerrainTypeAt(this.camera.position.x, this.camera.position.z);
        if (window.soundEngine) window.soundEngine.playFootstep(terrain);
      }
    } else {
      this.bobTimer = 0;
    }

    // Drain stamina when sprinting
    if (actuallySprinting) {
      player.stamina = Math.max(0, player.stamina - dt * 22);
    } else {
      player.stamina = Math.min(player.maxStamina, player.stamina + dt * 15);
    }

    // Smoothly decay mouse sway deltas
    if (this.mouseDeltaX) this.mouseDeltaX *= Math.max(0, 1 - dt * 8);
    if (this.mouseDeltaY) this.mouseDeltaY *= Math.max(0, 1 - dt * 8);

    // Sync player position vector with camera
    player.x = this.camera.position.x;
    player.y = this.camera.position.y;
    player.z = this.camera.position.z;
    player.yaw = this.yaw;
  }
}

window.FPSControls = FPSControls;
