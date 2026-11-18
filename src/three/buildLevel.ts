/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Three.js Level Builder
   Procedurally textured first-person chambers per world theme.
   ============================================================ */
import * as THREE from 'three';
import type { LevelDef } from '../game/levels';

export interface BuiltLevel {
  scene: THREE.Scene;
  interactables: THREE.Object3D[];
  colliders: { x: number; z: number; r: number }[];
  doorZ: number;
  update: (dt: number, elapsed: number, doorOpen: number) => void;
  dispose: () => void;
}

/* ---------- seeded RNG ---------- */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- procedural canvas textures ---------- */
function makeCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  return c;
}

function stoneTexture(base: string, mortar: string, block: number, seed: number): THREE.CanvasTexture {
  const rand = mulberry32(seed);
  const tex = new THREE.CanvasTexture(makeCanvas(512, 512, ctx => {
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, 512, 512);
    const rows = Math.floor(512 / block);
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (block / 2);
      for (let cx = -1; cx < 512 / block + 1; cx++) {
        const x = cx * block + offset;
        const y = r * block;
        const shade = 0.72 + rand() * 0.5;
        ctx.fillStyle = shadeColor(base, shade);
        ctx.fillRect(x + 2, y + 2, block - 4, block - 4);
        // wear noise
        for (let n = 0; n < 90; n++) {
          ctx.fillStyle = `rgba(0,0,0,${rand() * 0.16})`;
          ctx.fillRect(x + 2 + rand() * (block - 4), y + 2 + rand() * (block - 4), rand() * 22 + 2, rand() * 8 + 1);
        }
        for (let n = 0; n < 40; n++) {
          ctx.fillStyle = `rgba(255,255,255,${rand() * 0.08})`;
          ctx.fillRect(x + 2 + rand() * (block - 4), y + 2 + rand() * (block - 4), rand() * 16 + 2, rand() * 5 + 1);
        }
      }
    }
  }));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function shadeColor(hex: string, mult: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * mult));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) * mult));
  const b = Math.min(255, Math.max(0, ((n) & 255) * mult));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function runeDiscTexture(glow: string): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(makeCanvas(512, 512, ctx => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = glow;
    ctx.fillStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(256, 256, 200, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(256, 256, 158, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(256, 256, 116, 0, Math.PI * 2); ctx.stroke();
    const glyphs = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ'];
    ctx.font = '44px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(256 + Math.cos(a) * 177, 256 + Math.sin(a) * 177);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(glyphs[i], 0, 0);
      ctx.restore();
    }
    // inner triangle
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const px = 256 + Math.cos(a) * 116, py = 256 + Math.sin(a) * 116;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function doorTexture(): THREE.CanvasTexture {
  const rand = mulberry32(777);
  const tex = new THREE.CanvasTexture(makeCanvas(256, 512, ctx => {
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#241c10'); grad.addColorStop(0.5, '#4a3a20'); grad.addColorStop(1, '#241c10');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = '#0e0a05'; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, 40 + i * 88); ctx.lineTo(256, 40 + i * 88); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(212,175,55,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, 46 + i * 88); ctx.lineTo(256, 46 + i * 88); ctx.stroke();
    }
    for (let n = 0; n < 120; n++) {
      ctx.fillStyle = `rgba(0,0,0,${rand() * 0.4})`;
      ctx.fillRect(rand() * 256, rand() * 512, rand() * 30 + 3, rand() * 6 + 1);
    }
  }));
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ================= BUILD ================= */
export function buildLevel(level: LevelDef): BuiltLevel {
  const rand = mulberry32(level.id * 9973 + 17);
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(res: T): T => { disposables.push(res); return res; };

  const world = level.world;
  const W = {
    1: { fog: 0x191207, floor: '#4a3f2c', wall: '#57503f', mortar: '#241d12', accent: 0xd4af37, accentCss: '#f5d76e', particle: 0xffc86e, hemiSky: 0x8a7346, hemiGround: 0x141005 },
    2: { fog: 0x05161d, floor: '#12333f', wall: '#173d4d', mortar: '#03151c', accent: 0x67e8f9, accentCss: '#a5f3fc', particle: 0x8be9ff, hemiSky: 0x2c6f87, hemiGround: 0x04121a },
    3: { fog: 0x160608, floor: '#231114', wall: '#2e161a', mortar: '#0b0304', accent: 0xfb7185, accentCss: '#fda4af', particle: 0xff8a5e, hemiSky: 0x6e2528, hemiGround: 0x0d0304 },
  }[world];

  scene.background = new THREE.Color(W.fog);
  scene.fog = new THREE.FogExp2(W.fog, world === 3 ? 0.075 : 0.058);

  /* ----- lights ----- */
  const hemi = new THREE.HemisphereLight(W.hemiSky, W.hemiGround, 1.35);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(amb);
  const dirLight = new THREE.DirectionalLight(world === 2 ? 0xbfefff : 0xffe9c4, 2.1);
  dirLight.position.set(4.5, 7.5, 3.5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = -9; dirLight.shadow.camera.right = 9;
  dirLight.shadow.camera.top = 9; dirLight.shadow.camera.bottom = -9;
  dirLight.shadow.camera.far = 22;
  dirLight.shadow.bias = -0.0008;
  scene.add(dirLight);

  const accentLight = new THREE.PointLight(W.accent, 42, 12, 1.9);
  accentLight.position.set(0, 2.7, -0.5);
  scene.add(accentLight);

  const doorLight = new THREE.PointLight(W.accent, 26, 9, 1.9);
  doorLight.position.set(0, 2.4, -5.4);
  scene.add(doorLight);

  /* ----- materials ----- */
  const floorTex = track(stoneTexture(W.floor, W.mortar, 128, 100 + level.id));
  floorTex.repeat.set(4, 4);
  const wallTex = track(stoneTexture(W.wall, W.mortar, 110, 200 + level.id));
  wallTex.repeat.set(3, 1.4);
  const stoneFloorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.94, metalness: 0.05 });
  const stoneWallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.96, metalness: 0.04 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.42, metalness: 0.88 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, emissive: 0x5a4510, roughness: 0.3, metalness: 0.95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: W.accent, emissive: W.accent, emissiveIntensity: 1.35, roughness: 0.25, metalness: 0.15 });

  /* ----- room shell ----- */
  const ROOM = 13.4, HEIGHT = 5.4;
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(ROOM, ROOM)), stoneFloorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(track(new THREE.PlaneGeometry(ROOM, ROOM)), new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = HEIGHT;
  scene.add(ceil);

  const half = ROOM / 2;
  const mkWall = (w: number, h: number) => {
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), stoneWallMat);
    m.receiveShadow = true;
    return m;
  };
  // north wall built with a real doorway opening (2.65 wide × 3.7 high)
  const OPEN_W = 2.65, OPEN_H = 3.7;
  const sideW = (ROOM - OPEN_W) / 2;
  const wallNL = mkWall(sideW, HEIGHT); wallNL.position.set(-(OPEN_W / 2 + sideW / 2), HEIGHT / 2, -half); scene.add(wallNL);
  const wallNR = mkWall(sideW, HEIGHT); wallNR.position.set(OPEN_W / 2 + sideW / 2, HEIGHT / 2, -half); scene.add(wallNR);
  const wallNT = mkWall(OPEN_W, HEIGHT - OPEN_H); wallNT.position.set(0, OPEN_H + (HEIGHT - OPEN_H) / 2, -half); scene.add(wallNT);
  // darkness catch-plane behind the door so the portal reads against black
  const voidPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(OPEN_W + 0.6, OPEN_H + 0.4)), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  voidPlane.position.set(0, OPEN_H / 2, -half - 0.55);
  scene.add(voidPlane);
  const wallS = mkWall(ROOM, HEIGHT); wallS.position.set(0, HEIGHT / 2, half); wallS.rotation.y = Math.PI; scene.add(wallS);
  const wallE = mkWall(ROOM, HEIGHT); wallE.position.set(half, HEIGHT / 2, 0); wallE.rotation.y = -Math.PI / 2; scene.add(wallE);
  const wallW = mkWall(ROOM, HEIGHT); wallW.position.set(-half, HEIGHT / 2, 0); wallW.rotation.y = Math.PI / 2; scene.add(wallW);

  /* ----- glowing rune circle on floor ----- */
  const runeTex = track(runeDiscTexture(W.accentCss));
  const runeMat = new THREE.MeshBasicMaterial({ map: runeTex, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const runeDisc = new THREE.Mesh(track(new THREE.PlaneGeometry(4.6, 4.6)), runeMat);
  runeDisc.rotation.x = -Math.PI / 2;
  runeDisc.position.set(0, 0.02, -0.5);
  scene.add(runeDisc);

  const colliders: { x: number; z: number; r: number }[] = [];

  /* ----- pillars ----- */
  const pillarGeo = track(new THREE.CylinderGeometry(0.46, 0.56, HEIGHT, 12));
  const capGeo = track(new THREE.BoxGeometry(1.35, 0.42, 1.35));
  const pillarSpots: [number, number][] = [[-4.6, -3.6], [4.6, -3.6], [-4.6, 2.8], [4.6, 2.8]];
  for (const [px, pz] of pillarSpots) {
    const p = new THREE.Mesh(pillarGeo, stoneWallMat);
    p.position.set(px, HEIGHT / 2, pz);
    p.castShadow = true; p.receiveShadow = true;
    scene.add(p);
    const cap = new THREE.Mesh(capGeo, goldMat);
    cap.position.set(px, 2.25, pz);
    scene.add(cap);
    colliders.push({ x: px, z: pz, r: 0.75 });
  }

  /* ----- world-specific set dressing ----- */
  const emberColors = { 1: [0xff9d3d, 0xffc86e], 2: [0x67e8f9, 0xc084fc], 3: [0xfb7185, 0xff8a5e] }[world];

  if (world === 1) {
    // twin braziers
    const bowlGeo = track(new THREE.CylinderGeometry(0.52, 0.3, 0.4, 10));
    const poleGeo = track(new THREE.CylinderGeometry(0.14, 0.2, 1.15, 8));
    for (const bx of [-2.6, 2.6]) {
      const pole = new THREE.Mesh(poleGeo, darkMetal);
      pole.position.set(bx, 0.57, -3.4); scene.add(pole);
      const bowl = new THREE.Mesh(bowlGeo, darkMetal);
      bowl.position.set(bx, 1.35, -3.4); scene.add(bowl);
      const flame = new THREE.Mesh(track(new THREE.ConeGeometry(0.34, 0.85, 8)), new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.92 }));
      flame.position.set(bx, 1.95, -3.4);
      flame.name = 'flame';
      scene.add(flame);
      const fireLight = new THREE.PointLight(0xff8a2a, 30, 7.5, 1.9);
      fireLight.position.set(bx, 2.1, -3.4);
      fireLight.name = 'fireLight';
      scene.add(fireLight);
      colliders.push({ x: bx, z: -3.4, r: 0.62 });
    }
  } else if (world === 2) {
    // crystal clusters
    const crystalGeo = track(new THREE.ConeGeometry(0.32, 1.7, 6));
    const clusterSpots: [number, number][] = [[-5.3, -1.2], [5.3, -1.2], [-3.0, 4.6], [3.0, 4.6]];
    clusterSpots.forEach(([cx, cz], i) => {
      for (let j = 0; j < 4; j++) {
        const h = 0.9 + rand() * 1.5;
        const crystal = new THREE.Mesh(crystalGeo, new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x67e8f9 : 0xc084fc,
          emissive: i % 2 ? 0x22d3ee : 0xa855f7,
          emissiveIntensity: 1.5,
          roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.96,
        }));
        crystal.scale.y = h / 1.7;
        crystal.position.set(cx + (rand() - 0.5) * 0.9, (h / 2) - 0.06, cz + (rand() - 0.5) * 0.9);
        crystal.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI, (rand() - 0.5) * 0.35);
        scene.add(crystal);
      }
      const cLight = new THREE.PointLight(i % 2 ? 0x22d3ee : 0xa855f7, 18, 6.5, 2);
      cLight.position.set(cx, 1.3, cz);
      scene.add(cLight);
      colliders.push({ x: cx, z: cz, r: 0.7 });
    });
  } else {
    // obsidian obelisks + void shards
    const obGeo = track(new THREE.BoxGeometry(0.62, 3.1, 0.62));
    const obSpots: [number, number][] = [[-5.2, 0.6], [5.2, 0.6], [-2.7, -4.9], [2.7, -4.9]];
    obSpots.forEach(([ox, oz]) => {
      const ob = new THREE.Mesh(obGeo, new THREE.MeshStandardMaterial({ color: 0x171114, emissive: 0x450a0a, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.7 }));
      ob.position.set(ox, 1.55, oz);
      ob.rotation.y = rand() * 0.6;
      ob.castShadow = true;
      scene.add(ob);
      colliders.push({ x: ox, z: oz, r: 0.6 });
    });
  }

  /* ----- central puzzle pedestal ----- */
  const pedestalBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.72, 0.95, 1.12, 10)), stoneWallMat);
  pedestalBase.position.set(0, 0.56, -0.5);
  pedestalBase.castShadow = true; pedestalBase.receiveShadow = true;
  scene.add(pedestalBase);
  const pedestalRim = new THREE.Mesh(track(new THREE.TorusGeometry(0.72, 0.07, 8, 24)), goldMat);
  pedestalRim.rotation.x = Math.PI / 2;
  pedestalRim.position.set(0, 1.12, -0.5);
  scene.add(pedestalRim);
  colliders.push({ x: 0, z: -0.5, r: 1.0 });

  // floating puzzle artifact — the main interactable
  const artifact = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.34, 0)), accentMat.clone());
  artifact.position.set(0, 1.72, -0.5);
  artifact.name = 'artifact';
  scene.add(artifact);
  const artifactHalo = new THREE.Mesh(track(new THREE.TorusGeometry(0.52, 0.025, 6, 32)), new THREE.MeshBasicMaterial({ color: W.accent, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
  artifactHalo.position.copy(artifact.position);
  artifactHalo.name = 'artifactHalo';
  scene.add(artifactHalo);

  const puzzleGroup = new THREE.Group();
  puzzleGroup.add(artifact, artifactHalo);
  puzzleGroup.userData.interact = { id: 'puzzle', label: level.type === 'hidden' ? 'Search the shrine' : 'Activate the ancient mechanism' };
  artifact.userData.interact = puzzleGroup.userData.interact;
  artifactHalo.userData.interact = puzzleGroup.userData.interact;
  scene.add(puzzleGroup);

  /* ----- the great door ----- */
  const doorTex = track(doorTexture());
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.62, metalness: 0.35 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1a16, roughness: 0.4, metalness: 0.8, emissive: 0x241a06, emissiveIntensity: 0.5 });
  const frameGeo = track(new THREE.BoxGeometry(0.62, 4.15, 0.7));
  const frameL = new THREE.Mesh(frameGeo, frameMat); frameL.position.set(-1.52, 2.05, -half + 0.28); scene.add(frameL);
  const frameR = new THREE.Mesh(frameGeo, frameMat); frameR.position.set(1.52, 2.05, -half + 0.28); scene.add(frameR);
  const lintel = new THREE.Mesh(track(new THREE.BoxGeometry(3.7, 0.58, 0.7)), frameMat);
  lintel.position.set(0, 4.0, -half + 0.28); scene.add(lintel);

  const doorPanelGeo = track(new THREE.BoxGeometry(1.24, 3.55, 0.3));
  const doorL = new THREE.Mesh(doorPanelGeo, doorMat); doorL.position.set(-0.63, 1.78, -half + 0.26); doorL.castShadow = true; scene.add(doorL);
  const doorR = new THREE.Mesh(doorPanelGeo, doorMat); doorR.position.set(0.63, 1.78, -half + 0.26); doorR.castShadow = true; scene.add(doorR);

  // door seal rune (fades when opened)
  const sealMat = new THREE.MeshBasicMaterial({ map: runeTex, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const seal = new THREE.Mesh(track(new THREE.PlaneGeometry(2.1, 2.1)), sealMat);
  seal.position.set(0, 1.95, -half + 0.44);
  scene.add(seal);

  // portal glow behind the door (revealed on open)
  const portalMat = new THREE.MeshBasicMaterial({ color: W.accent, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const portal = new THREE.Mesh(track(new THREE.PlaneGeometry(2.65, 3.6)), portalMat);
  portal.position.set(0, 1.85, -half - 0.15);
  scene.add(portal);
  const portalLight = new THREE.PointLight(W.accent, 0, 10, 1.6);
  portalLight.position.set(0, 2.1, -half + 0.5);
  scene.add(portalLight);

  /* ----- clue tablet beside the door ----- */
  const tablet = new THREE.Mesh(track(new THREE.PlaneGeometry(1.05, 1.4)), new THREE.MeshStandardMaterial({ color: 0x3a3a44, emissive: W.accent, emissiveIntensity: 0.32, roughness: 0.35, metalness: 0.6 }));
  tablet.position.set(3.35, 1.75, -half + 0.06);
  tablet.userData.interact = { id: 'tablet', label: 'Read the carved inscription' };
  scene.add(tablet);
  const tabletFrame = new THREE.Mesh(track(new THREE.BoxGeometry(1.32, 1.68, 0.1)), frameMat);
  tabletFrame.position.set(3.35, 1.75, -half + 0.02);
  scene.add(tabletFrame);

  /* ----- collectibles (star shards / hidden relics) ----- */
  const isHidden = level.type === 'hidden';
  const collectibleCount = isHidden ? (level.puzzle as { relics: number }).relics : 3;
  const spotPool: [number, number][] = [
    [-5.4, -4.4], [5.2, -4.7], [-3.5, 1.6], [4.9, 2.4], [0.2, 4.6],
    [-5.5, -0.8], [3.3, -5.6], [-1.6, -4.6], [5.6, 4.4], [-4.9, 4.3],
  ];
  // deterministic pick
  const chosen: [number, number][] = [];
  const pool = [...spotPool];
  while (chosen.length < collectibleCount && pool.length) {
    chosen.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }

  const collectibleGeo = track(isHidden ? new THREE.OctahedronGeometry(0.3) : new THREE.OctahedronGeometry(0.21));
  const interactables: THREE.Object3D[] = [puzzleGroup, tablet];
  chosen.forEach(([sx, sz], idx) => {
    const mat = new THREE.MeshStandardMaterial({
      color: isHidden ? 0xffd977 : W.accent,
      emissive: isHidden ? 0xffb72e : W.accent,
      emissiveIntensity: 2.0, roughness: 0.15, metalness: 0.3,
    });
    const shard = new THREE.Mesh(collectibleGeo, mat);
    shard.position.set(sx, isHidden ? 0.55 : 1.05, sz);
    shard.name = `collectible-${idx}`;
    shard.userData.interact = { id: `collectible-${idx}`, label: isHidden ? 'Recover the Ancient Relic' : 'Claim the Star Shard' };
    shard.userData.bobPhase = rand() * Math.PI * 2;
    scene.add(shard);
    interactables.push(shard);
  });

  /* ----- ambient particles ----- */
  const P_COUNT = world === 3 ? 320 : 240;
  const pGeo = track(new THREE.BufferGeometry());
  const pPos = new Float32Array(P_COUNT * 3);
  const pVel = new Float32Array(P_COUNT);
  for (let i = 0; i < P_COUNT; i++) {
    pPos[i * 3] = (rand() - 0.5) * (ROOM - 1);
    pPos[i * 3 + 1] = rand() * HEIGHT;
    pPos[i * 3 + 2] = (rand() - 0.5) * (ROOM - 1);
    pVel[i] = 0.12 + rand() * 0.3;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: emberColors[0], size: world === 3 ? 0.075 : 0.06, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ----- per-frame animation ----- */
  const update = (dt: number, elapsed: number, doorOpen: number) => {
    // artifact bob + spin
    artifact.position.y = 1.72 + Math.sin(elapsed * 1.6) * 0.09;
    artifact.rotation.y += dt * 0.9;
    artifact.rotation.x = Math.sin(elapsed * 0.7) * 0.18;
    artifactHalo.position.y = artifact.position.y;
    artifactHalo.rotation.y -= dt * 0.7;
    artifactHalo.rotation.x = Math.PI / 2.6 + Math.sin(elapsed * 0.9) * 0.12;
    const haloMat = artifactHalo.material as THREE.MeshBasicMaterial;
    haloMat.opacity = 0.55 + Math.sin(elapsed * 2.1) * 0.3;

    // rune disc slow rotate
    runeDisc.rotation.z += dt * 0.07;
    (runeDisc.material as THREE.MeshBasicMaterial).opacity = 0.62 + Math.sin(elapsed * 1.3) * 0.22;

    // accent light pulse
    accentLight.intensity = 40 + Math.sin(elapsed * 1.7) * 9;
    doorLight.intensity = 24 + Math.sin(elapsed * 1.2 + 1.5) * 7;

    // brazier flames
    for (const child of scene.children) {
      if (child.name === 'flame') {
        const s = 1 + Math.sin(elapsed * 11 + child.position.x) * 0.13 + Math.sin(elapsed * 23) * 0.05;
        child.scale.set(s, 1 + Math.sin(elapsed * 9 + 1) * 0.2, s);
      } else if (child.name === 'fireLight') {
        (child as THREE.PointLight).intensity = 27 + Math.sin(elapsed * 13 + child.position.x) * 7 + Math.sin(elapsed * 29) * 3;
      }
    }

    // collectible bob & spin
    for (const child of scene.children) {
      if (child.name.startsWith('collectible-')) {
        const ph = child.userData.bobPhase ?? 0;
        child.position.y = (isHidden ? 0.55 : 1.05) + Math.sin(elapsed * 1.9 + ph) * 0.14;
        child.rotation.y += dt * 1.6;
      }
    }

    // particles drift upward
    const pos = pGeo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < P_COUNT; i++) {
      arr[i * 3 + 1] += pVel[i] * dt;
      arr[i * 3] += Math.sin(elapsed * 0.8 + i * 1.7) * 0.0011;
      if (arr[i * 3 + 1] > HEIGHT - 0.15) arr[i * 3 + 1] = 0.12;
    }
    pos.needsUpdate = true;

    // door opening
    const open = THREE.MathUtils.clamp(doorOpen, 0, 1);
    doorL.position.x = -0.63 - open * 1.28;
    doorR.position.x = 0.63 + open * 1.28;
    sealMat.opacity = Math.max(0, 0.95 * (1 - open * 1.15));
    seal.rotation.z += dt * (0.25 + open * 1.6);
    portalMat.opacity = open * 0.88;
    portalLight.intensity = open * 55;
  };

  const dispose = () => {
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m?.dispose());
      }
    });
    disposables.forEach(d => d.dispose());
  };

  return { scene, interactables, colliders, doorZ: -half + 0.4, update, dispose };
}
