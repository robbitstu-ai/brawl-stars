const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hpEl = document.getElementById("hp");
const ammoEl = document.getElementById("ammo");
const superEl = document.getElementById("super");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");

const W = canvas.width;
const H = canvas.height;

const keys = new Set();
let mouse = { x: W / 2, y: H / 2, down: false };

let running = false;
let score = 0;
let kills = 0;
let message = "";
let introDone = false;
let introIndex = 0;
let introTimer = 0;

const INTRO_STEPS = [
  { id: "supercell", duration: 1600 },
  { id: "loading1", duration: 900, label: "ZAGRUZKA" },
  { id: "brawl", duration: 3500 },
  { id: "loading2", duration: 1000, label: "ZAGRUZKA" }
];

const HIDE_FACES = false;

const STORAGE_KEY = "downbird_progress_v2";
const RARITIES = {
  rare: { name: "Rare", color: "#7dd6ff", gemCost: 120, dropWeight: 42 },
  super_rare: { name: "Super Rare", color: "#5cff9c", gemCost: 240, dropWeight: 26 },
  epic: { name: "Epic", color: "#ff8dde", gemCost: 520, dropWeight: 16 },
  mythic: { name: "Mythic", color: "#ffb657", gemCost: 900, dropWeight: 9 },
  legendary: { name: "Legendary", color: "#ffd24a", gemCost: 1600, dropWeight: 5 },
  ultra_legendary: { name: "Ultra Legendary", color: "#ff5f59", gemCost: 2600, dropWeight: 2 }
};
const RARITY_ORDER = ["rare", "super_rare", "epic", "mythic", "legendary", "ultra_legendary"];

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { gems: 0, owned: [], lastDailyDrop: "" };
    const data = JSON.parse(raw);
    return {
      gems: Number(data.gems || 0),
      owned: Array.isArray(data.owned) ? data.owned : [],
      lastDailyDrop: String(data.lastDailyDrop || "")
    };
  } catch (_) {
    return { gems: 0, owned: [], lastDailyDrop: "" };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getTodayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function canClaimDaily() {
  return progress.lastDailyDrop !== getTodayKey();
}

function isOwned(id) {
  return progress.owned.includes(id);
}

function getDefaultBrawler() {
  return BRAWLERS.find((b) => isOwned(b.id)) || BRAWLERS[0];
}

const TEAM_SIZE = 2;
const TEAM_COLORS = {
  blue: "rgba(70, 168, 255, 0.9)",
  red: "rgba(255, 92, 92, 0.9)"
};

const GEM_REWARD_PER_KILL = 2;

const BRAWLERS = [
  {
    id: "shelly",
    name: "Shelly",
    desc: "Yaqin masofali kuchli shotgun.",
    rarity: "rare",
    hp: 3700,
    speed: 2.95,
    ammoMax: 3,
    reloadMs: 980,
    fireCd: 420,
    weapon: "shotgun",
    skin: { body: "#7a4dff", bodyHit: "#b293ff", head: "#ffd39a", hair: "#6e2ab8", jacket: "#36245d", eye: "#ffffff" }
  },
  {
    id: "colt",
    name: "Colt",
    desc: "Uzoq masofada tez blaster.",
    rarity: "rare",
    hp: 3300,
    speed: 3.1,
    ammoMax: 3,
    reloadMs: 860,
    fireCd: 240,
    weapon: "blaster",
    skin: { body: "#2f76ff", bodyHit: "#84adff", head: "#ffd6a8", hair: "#d94149", jacket: "#1d3f9b", eye: "#ffffff" }
  },
  {
    id: "nita",
    name: "Nita",
    desc: "3 ta wave bilan maydon nazorati.",
    rarity: "rare",
    hp: 4200,
    speed: 2.85,
    ammoMax: 3,
    reloadMs: 1020,
    fireCd: 360,
    weapon: "wave",
    skin: { body: "#ee5b5b", bodyHit: "#ff9c9c", head: "#ffd4a3", hair: "#63311f", jacket: "#9d2b2b", eye: "#ffffff" }
  },
  {
    id: "jessie",
    name: "Jessie",
    desc: "Balansli blaster, qulay control.",
    rarity: "super_rare",
    hp: 3600,
    speed: 2.96,
    ammoMax: 3,
    reloadMs: 900,
    fireCd: 280,
    weapon: "blaster",
    skin: { body: "#ff8a52", bodyHit: "#ffc0a2", head: "#ffd7ab", hair: "#a32c1c", jacket: "#8a4a2f", eye: "#ffffff" }
  },
  {
    id: "poco",
    name: "Poco",
    desc: "Keng wave va barqaror HP.",
    rarity: "super_rare",
    hp: 3950,
    speed: 2.84,
    ammoMax: 3,
    reloadMs: 970,
    fireCd: 340,
    weapon: "wave",
    skin: { body: "#43b9b9", bodyHit: "#8df3f3", head: "#d6f8f8", hair: "#2a3a48", jacket: "#26676b", eye: "#ffffff" }
  },
  {
    id: "brock",
    name: "Brock",
    desc: "Burst raketa uslubida kuchli o'q.",
    rarity: "epic",
    hp: 3050,
    speed: 3.05,
    ammoMax: 3,
    reloadMs: 920,
    fireCd: 420,
    weapon: "burst",
    skin: { body: "#f17e2a", bodyHit: "#ffc294", head: "#ffd5ab", hair: "#111111", jacket: "#4e2e1e", eye: "#ffffff" }
  },
  {
    id: "rico",
    name: "Rico",
    desc: "Uzoq masofali blaster va nazorat.",
    rarity: "epic",
    hp: 3250,
    speed: 3.0,
    ammoMax: 3,
    reloadMs: 880,
    fireCd: 260,
    weapon: "blaster",
    skin: { body: "#3bd1ff", bodyHit: "#8feaff", head: "#d9f7ff", hair: "#1a3a49", jacket: "#1d5a72", eye: "#ffffff" }
  },
  {
    id: "tara",
    name: "Tara",
    desc: "Keng wave va maydon nazorati.",
    rarity: "mythic",
    hp: 3750,
    speed: 2.9,
    ammoMax: 3,
    reloadMs: 940,
    fireCd: 320,
    weapon: "wave",
    skin: { body: "#6e3bd6", bodyHit: "#a88bff", head: "#f5d7ff", hair: "#2e1f5f", jacket: "#3b1f7b", eye: "#ffffff" }
  },
  {
    id: "gene",
    name: "Gene",
    desc: "Burst bilan uzoqdan zarba.",
    rarity: "mythic",
    hp: 3650,
    speed: 2.88,
    ammoMax: 3,
    reloadMs: 960,
    fireCd: 310,
    weapon: "burst",
    skin: { body: "#d98b2e", bodyHit: "#f0c27a", head: "#ffe7bf", hair: "#633000", jacket: "#8a4a12", eye: "#ffffff" }
  },
  {
    id: "spike",
    name: "Spike",
    desc: "Sekin ammo, kuchli burst damage.",
    rarity: "legendary",
    hp: 3350,
    speed: 2.78,
    ammoMax: 3,
    reloadMs: 1040,
    fireCd: 460,
    weapon: "burst",
    skin: { body: "#71bf59", bodyHit: "#a8e89a", head: "#d6f8c4", hair: "#5e9f48", jacket: "#2d6d2f", eye: "#ffffff" }
  },
  {
    id: "leon",
    name: "Leon",
    desc: "Tez yurish, qisqa masofa.",
    rarity: "legendary",
    hp: 3400,
    speed: 3.25,
    ammoMax: 3,
    reloadMs: 820,
    fireCd: 220,
    weapon: "shotgun",
    skin: { body: "#6fd36b", bodyHit: "#a9f4a7", head: "#ffd7ab", hair: "#3f7a3a", jacket: "#2d5c2a", eye: "#ffffff" }
  },
  {
    id: "omega",
    name: "Omega",
    desc: "Ultra kuchli blaster va tezlik.",
    rarity: "ultra_legendary",
    hp: 4200,
    speed: 3.2,
    ammoMax: 3,
    reloadMs: 820,
    fireCd: 210,
    weapon: "blaster",
    skin: { body: "#ff3d93", bodyHit: "#ff8bc0", head: "#ffe0f0", hair: "#6a0d2f", jacket: "#a31246", eye: "#ffffff" }
  }
];

let progress = loadProgress();
let menuMessage = "";
let autoDropShown = false;
let dropTimeout = null;

function ensureStarter() {
  progress.owned = progress.owned.filter((id) => BRAWLERS.some((b) => b.id === id));
  if (progress.owned.length) return;
  const starters = BRAWLERS.filter((b) => b.rarity === "rare");
  const starter = starters[(Math.random() * starters.length) | 0] || BRAWLERS[0];
  progress.owned = [starter.id];
  saveProgress();
  menuMessage = `Boshlang'ich brawler: ${starter.name}`;
}

function grantGems(amount) {
  progress.gems = Math.max(0, progress.gems + amount);
  saveProgress();
}

function unlockBrawler(brawler) {
  if (isOwned(brawler.id)) return false;
  progress.owned.push(brawler.id);
  saveProgress();
  return true;
}

function rollRarity() {
  const pool = [];
  for (const key of RARITY_ORDER) {
    const weight = RARITIES[key].dropWeight;
    for (let i = 0; i < weight; i++) pool.push(key);
  }
  return pool[(Math.random() * pool.length) | 0] || "rare";
}

function openStarrDrop() {
  if (!canClaimDaily()) {
    return { type: "none", message: "Bugun starr drop olingan." };
  }
  const rarity = rollRarity();
  const candidates = BRAWLERS.filter((b) => b.rarity === rarity && !isOwned(b.id));
  let result = { type: "gems", message: "", rarity };
  if (candidates.length) {
    const b = candidates[(Math.random() * candidates.length) | 0];
    unlockBrawler(b);
    result = { type: "brawler", brawler: b, message: `${b.name} chiqdi.`, rarity };
  } else {
    const gems = Math.max(20, Math.round(RARITIES[rarity].gemCost * 0.28));
    grantGems(gems);
    result = { type: "gems", gems, message: `${gems} gems berildi.`, rarity };
  }
  progress.lastDailyDrop = getTodayKey();
  saveProgress();
  return result;
}

ensureStarter();

function grantWinReward() {
  const base = selectedMode.goals ? 30 : selectedMode.gems ? 26 : 20;
  const bonus = Math.min(12, Math.floor(kills / 3));
  const total = base + bonus;
  grantGems(total);
  return total;
}

function showDropAnimation(result) {
  if (!result || result.type === "none") {
    menuMessage = result?.message || "";
    return;
  }
  overlay.style.display = "grid";
  const rarity = RARITIES[result.rarity] || RARITIES.rare;
  const title = result.type === "brawler" ? result.brawler.name : `${result.gems} Gems`;
  const avatar = result.type === "brawler"
    ? `
      <div class="drop-avatar" style="--body:${result.brawler.skin.body};--head:${result.brawler.skin.head};--hair:${result.brawler.skin.hair};--jacket:${result.brawler.skin.jacket};">
        <span class="avatar-eyes"></span>
        <span class="avatar-jacket"></span>
      </div>
    `
    : `<div class="drop-gem">${result.gems}</div>`;

  overlay.innerHTML = `
    <div class="drop-stage">
      <div class="drop-card" style="--rarity:${rarity.color};">
        ${avatar}
        <div class="drop-name">${title}</div>
        <div class="drop-rarity">${rarity.name}</div>
      </div>
    </div>
  `;

  clearTimeout(dropTimeout);
  dropTimeout = setTimeout(() => {
    menuMessage = `Starr Drop: ${rarity.name} -> ${result.message}`;
    renderStartMenu();
  }, 2600);
}

const MODES = {
  knockout: {
    id: "knockout",
    name: "Knockout",
    desc: "Bir jonlik jang. 12 kill qilsangiz g'alaba.",
    startEnemies: 1,
    maxEnemies: 3,
    spawnInterval: 3000,
    enemyHpMul: 1,
    enemyDamageMul: 1,
    killToWin: 12,
    gems: false
  },
  gemgrab: {
    id: "gemgrab",
    name: "Gem Grab",
    desc: "10 gem yig'ing va omon qoling.",
    startEnemies: 2,
    maxEnemies: 2,
    spawnInterval: 3200,
    enemyHpMul: 1.05,
    enemyDamageMul: 1,
    killToWin: 999,
    gems: true,
    team: true
  },
  duel: {
    id: "duel",
    name: "Duel",
    desc: "1v1 ketma-ket duel, 8 kill g'alaba.",
    startEnemies: 1,
    maxEnemies: 1,
    spawnInterval: 3800,
    enemyHpMul: 1.2,
    enemyDamageMul: 1.1,
    killToWin: 8,
    gems: false
  },
  brawlball: {
    id: "brawlball",
    name: "Brawl Ball",
    desc: "Goal zonaga 3 marta yetib boring.",
    startEnemies: 2,
    maxEnemies: 2,
    spawnInterval: 3200,
    enemyHpMul: 1,
    enemyDamageMul: 1,
    killToWin: 999,
    gems: false,
    goals: true,
    team: true
  }
};

const ARENAS = {
  canyon: {
    id: "canyon",
    name: "Skull Canyon",
    desc: "Markazda zich to'siqlar va ikki portal.",
    spawns: [
      { x: 80, y: 80 },
      { x: W - 80, y: 90 },
      { x: W - 90, y: H - 90 },
      { x: 85, y: H - 85 }
    ],
    walls: [
      { x: 120, y: 110, w: 190, h: 56 },
      { x: 400, y: 98, w: 140, h: 70 },
      { x: 760, y: 110, w: 210, h: 56 },
      { x: 470, y: 210, w: 150, h: 120 },
      { x: 210, y: 355, w: 180, h: 66 },
      { x: 700, y: 360, w: 190, h: 66 },
      { x: 490, y: 470, w: 120, h: 66 }
    ],
    bushes: [
      { x: 62, y: 66, w: 92, h: 60 },
      { x: 936, y: 66, w: 96, h: 58 },
      { x: 70, y: 496, w: 92, h: 62 },
      { x: 936, y: 496, w: 96, h: 62 },
      { x: 332, y: 255, w: 78, h: 60 },
      { x: 700, y: 250, w: 78, h: 62 }
    ],
    waters: [
      { x: 30, y: 250, w: 90, h: 120 },
      { x: 980, y: 250, w: 90, h: 120 }
    ],
    portals: [
      { x: 90, y: 310, r: 24, to: 1, color: "#9a58ff" },
      { x: 1010, y: 310, r: 24, to: 0, color: "#3ed6ff" }
    ]
  },
  temple: {
    id: "temple",
    name: "Temple Ruins",
    desc: "Uzun yo'laklar va diagonal portal yo'llari.",
    spawns: [
      { x: 90, y: 120 },
      { x: W - 100, y: 120 },
      { x: W - 110, y: H - 120 },
      { x: 100, y: H - 120 }
    ],
    walls: [
      { x: 210, y: 80, w: 72, h: 180 },
      { x: 818, y: 80, w: 72, h: 180 },
      { x: 310, y: 270, w: 480, h: 80 },
      { x: 220, y: 430, w: 120, h: 100 },
      { x: 760, y: 430, w: 120, h: 100 }
    ],
    bushes: [
      { x: 40, y: 40, w: 110, h: 70 },
      { x: 950, y: 40, w: 110, h: 70 },
      { x: 40, y: 510, w: 110, h: 70 },
      { x: 950, y: 510, w: 110, h: 70 },
      { x: 455, y: 176, w: 180, h: 56 }
    ],
    waters: [
      { x: 512, y: 20, w: 74, h: 86 },
      { x: 512, y: 514, w: 74, h: 86 }
    ],
    portals: [
      { x: 140, y: 520, r: 22, to: 1, color: "#ff74c9" },
      { x: 960, y: 100, r: 22, to: 0, color: "#59c6ff" }
    ]
  },
  scrapyard: {
    id: "scrapyard",
    name: "Scrapyard",
    desc: "Keng arena, ko'p o't va 3 portal.",
    spawns: [
      { x: 120, y: 80 },
      { x: W - 120, y: 90 },
      { x: W - 120, y: H - 90 },
      { x: 120, y: H - 90 }
    ],
    walls: [
      { x: 200, y: 120, w: 180, h: 64 },
      { x: 720, y: 120, w: 180, h: 64 },
      { x: 505, y: 190, w: 90, h: 240 },
      { x: 220, y: 420, w: 200, h: 70 },
      { x: 690, y: 420, w: 200, h: 70 }
    ],
    bushes: [
      { x: 40, y: 240, w: 110, h: 110 },
      { x: 950, y: 240, w: 110, h: 110 },
      { x: 430, y: 80, w: 240, h: 50 },
      { x: 430, y: 490, w: 240, h: 50 },
      { x: 470, y: 290, w: 160, h: 55 }
    ],
    waters: [
      { x: 46, y: 46, w: 84, h: 84 },
      { x: 968, y: 488, w: 84, h: 84 }
    ],
    portals: [
      { x: 548, y: 64, r: 20, to: 1, color: "#9a58ff" },
      { x: 548, y: 556, r: 20, to: 0, color: "#3ed6ff" },
      { x: 1000, y: 310, r: 20, to: 2, color: "#ff7f4d" }
    ]
  }
};

let selectedBrawler = getDefaultBrawler();
let selectedMode = MODES.knockout;
let selectedArena = ARENAS.canyon;

let arenaWalls = [];
let arenaBushes = [];
let arenaWaters = [];
let arenaPortals = [];
let arenaSpawns = [];

let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let allies = [];
let gems = [];
let goals = [];
let ball = null;
let spawnTick = 0;
let allySpawnTick = 0;
let gemTick = 0;
let gemScore = 0;
let goalScore = 0;

let audioCtx = null;
let musicStarted = false;
let musicTimer = null;
let beatStep = 0;

function chooseArena(arenaId) {
  selectedArena = ARENAS[arenaId] || selectedArena;
  arenaWalls = selectedArena.walls.map((x) => ({ ...x }));
  arenaBushes = selectedArena.bushes.map((x) => ({ ...x }));
  arenaWaters = selectedArena.waters.map((x) => ({ ...x }));
  arenaPortals = selectedArena.portals.map((x) => ({ ...x }));
  arenaSpawns = selectedArena.spawns.map((x) => ({ ...x }));
}

function pickBotBrawler(excludeId = null) {
  let pool = BRAWLERS;
  if (excludeId) pool = BRAWLERS.filter((b) => b.id !== excludeId);
  return pool[(Math.random() * pool.length) | 0] || BRAWLERS[0];
}

function getTeamSpawn(team, index) {
  const total = arenaSpawns.length || 1;
  if (!selectedMode.team || total < 2) return arenaSpawns[index % total];
  const half = Math.floor(total / 2);
  const group = team === "blue" ? arenaSpawns.slice(0, half) : arenaSpawns.slice(half);
  const list = group.length ? group : arenaSpawns;
  return list[index % list.length];
}

function makeAlly(spawnIndex) {
  const b = pickBotBrawler(selectedBrawler.id);
  const s = getTeamSpawn("blue", spawnIndex);
  const hp = b.hp * 0.86;
  return {
    x: s.x + (Math.random() * 28 - 14),
    y: s.y + (Math.random() * 28 - 14),
    r: 20,
    hp,
    maxHp: hp,
    speed: b.speed * 0.96,
    ammo: b.ammoMax,
    ammoMax: b.ammoMax,
    ammoTimer: 0,
    reloadMs: b.reloadMs,
    fireCd: 200 + Math.random() * 400,
    baseFireCd: b.fireCd,
    weapon: b.weapon,
    skin: b.skin,
    hit: 0,
    portalCd: 0,
    wanderA: Math.random() * Math.PI * 2,
    wanderT: 0,
    team: "blue"
  };
}

function makePlayer() {
  return {
    x: 140,
    y: H / 2,
    r: 22,
    speed: selectedBrawler.speed,
    hp: selectedBrawler.hp,
    maxHp: selectedBrawler.hp,
    ammo: selectedBrawler.ammoMax,
    ammoMax: selectedBrawler.ammoMax,
    ammoTimer: 0,
    reloadMs: selectedBrawler.reloadMs,
    fireCd: 0,
    baseFireCd: selectedBrawler.fireCd,
    weapon: selectedBrawler.weapon,
    skin: selectedBrawler.skin,
    superMeter: 0,
    ultaMeter: 0,
    hyperMeter: 0,
    superMs: 0,
    hyperMs: 0,
    flash: 0,
    portalCd: 0,
    team: "blue"
  };
}

function makeEnemy(spawnIndex) {
  const mode = selectedMode;
  const b = pickBotBrawler();
  const s = getTeamSpawn("red", spawnIndex);
  const hpBase = b.hp * 0.82;
  const hp = hpBase * mode.enemyHpMul;
  let speed = b.speed * (0.86 + Math.random() * 0.12) + Math.min(0.35, kills * 0.02);
  if (player) {
    speed = Math.min(speed, player.speed * 0.9);
  }
  const e = {
    x: s.x + (Math.random() * 28 - 14),
    y: s.y + (Math.random() * 28 - 14),
    r: 20,
    hp,
    maxHp: hp,
    speed,
    fireCd: 300 + Math.random() * 500,
    baseFireCd: b.fireCd,
    hit: 0,
    portalCd: 0,
    wanderA: Math.random() * Math.PI * 2,
    wanderT: 0,
    weapon: b.weapon,
    skin: b.skin,
    team: "red"
  };
  return e;
}


function circleRectCollide(cx, cy, cr, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < cr * cr;
}

function isBlockedAt(x, y, r) {
  for (const w of arenaWalls) {
    if (circleRectCollide(x, y, r, w)) return true;
  }
  return false;
}

function findSafeSpot(x, y, r) {
  if (!isBlockedAt(x, y, r)) return { x, y };

  const maxRadius = 140;
  const step = 6;
  const steps = 14;

  for (let radius = step; radius <= maxRadius; radius += step) {
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      const nx = Math.max(r, Math.min(W - r, x + Math.cos(ang) * radius));
      const ny = Math.max(r, Math.min(H - r, y + Math.sin(ang) * radius));
      if (!isBlockedAt(nx, ny, r)) return { x: nx, y: ny };
    }
  }

  return { x: Math.max(r, Math.min(W - r, x)), y: Math.max(r, Math.min(H - r, y)) };
}

function kickBall(from, angle, power) {
  if (!ball) return;
  ball.carrier = null;
  ball.pickupCd = 220;
  ball.x = from.x + Math.cos(angle) * (from.r + ball.r + 2);
  ball.y = from.y + Math.sin(angle) * (from.r + ball.r + 2);
  ball.vx = Math.cos(angle) * power;
  ball.vy = Math.sin(angle) * power;
}

function tryKickBall() {
  if (!running || !player || !ball) return;
  if (ball.carrier !== player) return;
  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  kickBall(player, ang, 9.2);
}

function createBall() {
  const safe = findSafeSpot(W / 2, H / 2, 12);
  return {
    x: safe.x,
    y: safe.y,
    r: 12,
    vx: 0,
    vy: 0,
    carrier: null,
    pickupCd: 0
  };
}

function updateBall(dt) {
  if (!ball) return;

  if (ball.pickupCd > 0) ball.pickupCd -= dt;

  if (ball.carrier && ball.carrier.hp <= 0) {
    ball.carrier = null;
  }

  if (ball.carrier) {
    ball.x = ball.carrier.x;
    ball.y = ball.carrier.y;

    const opponents = ball.carrier.team === "blue" ? enemies : [player, ...allies];
    for (const opp of opponents) {
      if (!opp) continue;
      const d = Math.hypot(opp.x - ball.x, opp.y - ball.y);
      if (d < ball.r + opp.r * 0.6) {
        ball.carrier = opp;
        break;
      }
    }
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vx *= 0.985;
  ball.vy *= 0.985;

  if (ball.x < ball.r || ball.x > W - ball.r) {
    ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
    ball.vx *= -0.6;
  }
  if (ball.y < ball.r || ball.y > H - ball.r) {
    ball.y = Math.max(ball.r, Math.min(H - ball.r, ball.y));
    ball.vy *= -0.6;
  }

  for (const w of arenaWalls) {
    if (circleRectCollide(ball.x, ball.y, ball.r, w)) {
      const safe = findSafeSpot(ball.x, ball.y, ball.r);
      ball.x = safe.x;
      ball.y = safe.y;
      ball.vx *= -0.6;
      ball.vy *= -0.6;
      break;
    }
  }

  const units = [player, ...allies, ...enemies];
  const pickupRadius = ball.r + 16;
  if (ball.pickupCd <= 0) {
    for (const u of units) {
      if (!u) continue;
      const d = Math.hypot(u.x - ball.x, u.y - ball.y);
      if (d < pickupRadius) {
        ball.carrier = u;
        break;
      }
    }
  }
}

function drawBall() {
  if (!ball) return;
  const drawX = ball.carrier ? ball.carrier.x : ball.x;
  const drawY = ball.carrier ? ball.carrier.y - (ball.carrier.r + 6) : ball.y;
  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.fillStyle = "#f7d65a";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b07b1d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}


function isInBush(entity) {
  for (const b of arenaBushes) {
    if (circleRectCollide(entity.x, entity.y, entity.r, b)) return true;
  }
  return false;
}

function moveWithWalls(obj, dx, dy) {
  obj.x += dx;
  for (const w of arenaWalls) {
    if (circleRectCollide(obj.x, obj.y, obj.r, w)) obj.x -= dx;
  }
  obj.y += dy;
  for (const w of arenaWalls) {
    if (circleRectCollide(obj.x, obj.y, obj.r, w)) obj.y -= dy;
  }
  obj.x = Math.max(obj.r, Math.min(W - obj.r, obj.x));
  obj.y = Math.max(obj.r, Math.min(H - obj.r, obj.y));
}

function applyPortals(entity, dt) {
  entity.portalCd = Math.max(0, entity.portalCd - dt);
  if (entity.portalCd > 0) return;

  for (let i = 0; i < arenaPortals.length; i++) {
    const p = arenaPortals[i];
    const d = Math.hypot(entity.x - p.x, entity.y - p.y);
    if (d < p.r + entity.r * 0.35) {
      const target = arenaPortals[p.to];
      if (!target) return;
      entity.x = target.x;
      entity.y = target.y;
      const safe = findSafeSpot(entity.x, entity.y, entity.r);
      entity.x = safe.x;
      entity.y = safe.y;
      entity.portalCd = 850;
      break;
    }
  }
}

function shootProjectile(from, angle, speed, dmg, life, mine, kind, size) {
  const b = {
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: size,
    dmg,
    life,
    mine,
    kind
  };
  (mine ? bullets : enemyBullets).push(b);
}

function playerShoot() {
  const p = player;
  const base = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  const hyperMul = p.hyperMs > 0 ? 1.2 : 1;

  if (p.weapon === "shotgun") {
    for (let i = -2; i <= 2; i++) {
      shootProjectile(p, base + i * 0.09, 8.4, 255 * hyperMul, 480, true, "shell", 5.2);
    }
    return;
  }

  if (p.weapon === "wave") {
    for (let i = -1; i <= 1; i++) {
      shootProjectile(p, base + i * 0.12, 8.3, 355 * hyperMul, 760, true, "wave", 6.1);
    }
    return;
  }

  if (p.weapon === "burst") {
    for (let i = -1; i <= 1; i++) {
      shootProjectile(p, base + i * 0.04, 9.2, 465 * hyperMul, 980, true, "burst", 6.8);
    }
    return;
  }

  shootProjectile(p, base, 10.3, 530 * hyperMul, 920, true, "blaster", 6.5);
}

function castSuper() {
  player.superMeter = 0;
  player.superMs = 4300;
  const base = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  for (let i = -3; i <= 3; i++) {
    shootProjectile(player, base + i * 0.08, 9.4, 300, 700, true, "super", 6.4);
  }
}

function castUlta() {
  player.ultaMeter = 0;
  const base = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  shootProjectile(player, base, 8.1, 980, 1200, true, "ulta", 9.5);
}

function castHyper() {
  player.hyperMeter = 0;
  player.hyperMs = 6200;
}

function botShoot(bot, target, team) {
  const angle = Math.atan2(target.y - bot.y, target.x - bot.x);
  const mine = team === "blue";
  const dmgMul = team === "red" ? 0.65 * selectedMode.enemyDamageMul : 0.6;
  const kind = team === "red" ? "enemy" : bot.weapon;

  if (bot.weapon === "shotgun") {
    for (let i = -2; i <= 2; i++) {
      shootProjectile(bot, angle + i * 0.09, 7.8, 255 * dmgMul, 480, mine, kind, 5.2);
    }
    return;
  }

  if (bot.weapon === "wave") {
    for (let i = -1; i <= 1; i++) {
      shootProjectile(bot, angle + i * 0.12, 7.6, 355 * dmgMul, 760, mine, kind, 6.1);
    }
    return;
  }

  if (bot.weapon === "burst") {
    for (let i = -1; i <= 1; i++) {
      shootProjectile(bot, angle + i * 0.04, 8.2, 465 * dmgMul, 980, mine, kind, 6.8);
    }
    return;
  }

  shootProjectile(bot, angle, 9.1, 530 * dmgMul, 920, mine, kind, 6.5);
}

function getNearestTarget(from, targets) {
  let best = null;
  let bestDist = Infinity;
  for (const t of targets) {
    if (!t) continue;
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    if (d < bestDist) {
      best = t;
      bestDist = d;
    }
  }
  return { target: best, dist: bestDist };
}


function spawnEnemy() {
  if (enemies.length >= selectedMode.maxEnemies) return;
  enemies.push(makeEnemy((Math.random() * arenaSpawns.length) | 0));
}

function spawnGem() {
  const center = { x: W / 2 + (Math.random() * 90 - 45), y: H / 2 + (Math.random() * 70 - 35) };
  const safe = findSafeSpot(center.x, center.y, 10);
  gems.push({ x: safe.x, y: safe.y, r: 9, ttl: 15000 });
}

function beginModeObjects() {
  gems = [];
  goals = [];
  ball = null;
  gemScore = 0;
  goalScore = 0;

  if (selectedMode.gems) {
    for (let i = 0; i < 2; i++) spawnGem();
  }

  if (selectedMode.goals) {
    goals.push({ x: 10, y: H / 2 - 65, w: 22, h: 130, side: "left" });
    goals.push({ x: W - 32, y: H / 2 - 65, w: 22, h: 130, side: "right" });
    ball = createBall();
  }
}

function checkWinLose() {
  if (player.hp <= 0) {
    running = false;
    showEndMenu(false, "Mag'lubiyat", 0);
    return;
  }

  if (selectedMode.gems && gemScore >= 10) {
    running = false;
    const reward = grantWinReward();
    showEndMenu(true, "Gem Grab G'alaba", reward);
    return;
  }

  if (selectedMode.goals && goalScore >= 3) {
    running = false;
    const reward = grantWinReward();
    showEndMenu(true, "Brawl Ball G'alaba", reward);
    return;
  }

  if (kills >= selectedMode.killToWin) {
    running = false;
    const reward = grantWinReward();
    showEndMenu(true, "G'alaba", reward);
  }
}

function update(dt) {
  if (!player) return;

  let dx = 0;
  let dy = 0;
  if (keys.has("w")) dy -= 1;
  if (keys.has("s")) dy += 1;
  if (keys.has("a")) dx -= 1;
  if (keys.has("d")) dx += 1;

  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    let speed = player.speed;
    if (player.superMs > 0) speed *= 1.2;
    if (player.hyperMs > 0) speed *= 1.25;
    moveWithWalls(player, (dx / len) * speed, (dy / len) * speed);
  }

  applyPortals(player, dt);
  if (isBlockedAt(player.x, player.y, player.r)) {
    const safe = findSafeSpot(player.x, player.y, player.r);
    player.x = safe.x;
    player.y = safe.y;
  }

  player.fireCd -= dt;
  player.ammoTimer += dt;
  if (player.ammo < player.ammoMax && player.ammoTimer >= player.reloadMs) {
    player.ammo++;
    player.ammoTimer = 0;
  }

  player.superMs = Math.max(0, player.superMs - dt);
  player.hyperMs = Math.max(0, player.hyperMs - dt);
  player.flash = Math.max(0, player.flash - dt);

  if (mouse.down && player.fireCd <= 0 && player.ammo > 0) {
    player.fireCd = player.baseFireCd;
    player.ammo--;
    player.ammoTimer = 0;
    playerShoot();
  }

  if (selectedMode.team) {
    spawnTick += dt;
    if (spawnTick > selectedMode.spawnInterval) {
      spawnTick = 0;
      if (enemies.length < TEAM_SIZE) enemies.push(makeEnemy(enemies.length + 1));
    }

    allySpawnTick += dt;
    if (allySpawnTick > selectedMode.spawnInterval) {
      allySpawnTick = 0;
      if (allies.length < TEAM_SIZE - 1) allies.push(makeAlly(allies.length + 1));
    }
  } else {
    spawnTick += dt;
    if (spawnTick > selectedMode.spawnInterval) {
      spawnTick = 0;
      spawnEnemy();
    }
  }

  if (selectedMode.gems) {
    gemTick += dt;
    if (gemTick > 3400 && gems.length < 6) {
      gemTick = 0;
      spawnGem();
    }
  }

  const playerHidden = isInBush(player);

  for (const e of enemies) {
    applyPortals(e, dt);

    const targets = [player, ...allies];
    const { target, dist } = getNearestTarget(e, targets);

    if (target) {
      const targetHidden = target === player && playerHidden;
      const targetVisible = !targetHidden || dist < 165;

      if (targetVisible) {
        const ang = Math.atan2(target.y - e.y, target.x - e.x);
        moveWithWalls(e, Math.cos(ang) * e.speed, Math.sin(ang) * e.speed);
        e.fireCd -= dt;
        if (e.fireCd <= 0 && dist < 620) {
          e.fireCd = e.baseFireCd + 260 + Math.random() * 520;
          botShoot(e, target, "red");
        }
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          e.wanderT = 500 + Math.random() * 1200;
          e.wanderA += Math.random() * 1.7 - 0.85;
        }
        moveWithWalls(e, Math.cos(e.wanderA) * e.speed * 0.7, Math.sin(e.wanderA) * e.speed * 0.7);
      }
    } else {
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 500 + Math.random() * 1200;
        e.wanderA += Math.random() * 1.7 - 0.85;
      }
      moveWithWalls(e, Math.cos(e.wanderA) * e.speed * 0.7, Math.sin(e.wanderA) * e.speed * 0.7);
    }

    e.hit = Math.max(0, e.hit - dt);
  }

  for (const a of allies) {
    applyPortals(a, dt);

    const { target, dist } = getNearestTarget(a, enemies);

    if (target) {
      const ang = Math.atan2(target.y - a.y, target.x - a.x);
      moveWithWalls(a, Math.cos(ang) * a.speed, Math.sin(ang) * a.speed);
      a.fireCd -= dt;
      if (a.fireCd <= 0 && dist < 620) {
        a.fireCd = a.baseFireCd + 220 + Math.random() * 480;
        botShoot(a, target, "blue");
      }
    } else {
      a.wanderT -= dt;
      if (a.wanderT <= 0) {
        a.wanderT = 500 + Math.random() * 1200;
        a.wanderA += Math.random() * 1.7 - 0.85;
      }
      moveWithWalls(a, Math.cos(a.wanderA) * a.speed * 0.7, Math.sin(a.wanderA) * a.speed * 0.7);
    }

    a.hit = Math.max(0, a.hit - dt);
  }

  updateBall(dt);

  for (const arr of [bullets, enemyBullets]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const b = arr[i];
      b.life -= dt;
      b.x += b.vx;
      b.y += b.vy;

      let remove = b.life <= 0 || b.x < -20 || b.y < -20 || b.x > W + 20 || b.y > H + 20;

      for (const w of arenaWalls) {
        if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) {
          remove = true;
          break;
        }
      }

      if (arr === bullets) {
        for (const e of enemies) {
          const d = Math.hypot(b.x - e.x, b.y - e.y);
          if (d < b.r + e.r) {
            e.hp -= b.dmg;
            e.hit = 120;
            remove = true;

            player.superMeter = Math.min(100, player.superMeter + 4.5);
            player.ultaMeter = Math.min(100, player.ultaMeter + 3.8);
            player.hyperMeter = Math.min(100, player.hyperMeter + 3.2);

            if (b.kind === "ulta") {
              for (const x of enemies) {
                const aoe = Math.hypot(b.x - x.x, b.y - x.y);
                if (aoe < 95) x.hp -= 320;
              }
            }

            if (e.hp <= 0) {
              score += 1;
              kills += 1;
              grantGems(GEM_REWARD_PER_KILL);
              player.superMeter = Math.min(100, player.superMeter + 17);
              player.ultaMeter = Math.min(100, player.ultaMeter + 14);
              player.hyperMeter = Math.min(100, player.hyperMeter + 11);

              if (selectedMode.gems && Math.random() < 0.45) {
                gems.push({ x: e.x, y: e.y, r: 9, ttl: 12000 });
              }
            }
            break;
          }
        }
      } else {
        if (player) {
          const d = Math.hypot(b.x - player.x, b.y - player.y);
          if (d < b.r + player.r) {
            player.hp -= b.dmg;
            player.flash = 150;
            remove = true;
          }
        }

        if (!remove) {
          for (const a of allies) {
            const d2 = Math.hypot(b.x - a.x, b.y - a.y);
            if (d2 < b.r + a.r) {
              a.hp -= b.dmg;
              a.hit = 120;
              remove = true;
              break;
            }
          }
        }
      }

      if (remove) arr.splice(i, 1);
    }
  }

  enemies = enemies.filter((e) => e.hp > 0);
  allies = allies.filter((a) => a.hp > 0);

  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i];
    g.ttl -= dt;
    let picked = false;
    if (player) {
      const d = Math.hypot(g.x - player.x, g.y - player.y);
      picked = d < g.r + player.r;
    }

    if (!picked) {
      for (const a of allies) {
        const d2 = Math.hypot(g.x - a.x, g.y - a.y);
        if (d2 < g.r + a.r) {
          picked = true;
          break;
        }
      }
    }

    if (picked) {
      gemScore += 1;
      gems.splice(i, 1);
      continue;
    }
    if (g.ttl <= 0) gems.splice(i, 1);
  }

  if (selectedMode.goals) {
    if (ball && ball.carrier) {
      for (const goal of goals) {
        if (!circleRectCollide(ball.carrier.x, ball.carrier.y, ball.carrier.r, goal)) continue;

        const team = ball.carrier.team || "blue";
        const isBlueScore = team === "blue" && goal.side === "right";
        const isRedScore = team === "red" && goal.side === "left";

        if (isBlueScore) {
          goalScore += 1;
        }

        if (isBlueScore || isRedScore) {
          ball = createBall();
          if (player) {
            const safe = findSafeSpot(W / 2, H / 2, player.r);
            player.x = safe.x;
            player.y = safe.y;
          }
          for (const a of allies) {
            const safeA = findSafeSpot(W / 2 + (Math.random() * 40 - 20), H / 2 + (Math.random() * 40 - 20), a.r);
            a.x = safeA.x;
            a.y = safeA.y;
          }
        }
      }
    }
  }

  message = selectedMode.gems
    ? `Gems: ${gemScore}/10`
    : selectedMode.goals
      ? `Goals: ${goalScore}/3`
      : `Kills: ${kills}/${selectedMode.killToWin}`;

  hpEl.textContent = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
  ammoEl.textContent = String(player.ammo);
  superEl.textContent = `S ${Math.floor(player.superMeter)}% | U ${Math.floor(player.ultaMeter)}% | H ${Math.floor(player.hyperMeter)}%`;
  scoreEl.textContent = `${score} | ${progress.gems}g`;

  checkWinLose();
}

function drawArena() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#3ea55a");
  grad.addColorStop(1, "#26693b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y += 54) {
    for (let x = (y / 54) % 2 ? 27 : 0; x < W; x += 54) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x + 2, y + 2, 5, 5);
    }
  }

  for (const water of arenaWaters) {
    ctx.fillStyle = "#2e78b8";
    ctx.fillRect(water.x, water.y, water.w, water.h);
    ctx.strokeStyle = "#89e4ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(water.x, water.y, water.w, water.h);
  }

  for (const bush of arenaBushes) {
    ctx.fillStyle = "#165f2b";
    ctx.fillRect(bush.x, bush.y, bush.w, bush.h);
    ctx.fillStyle = "rgba(66, 188, 98, 0.7)";
    ctx.fillRect(bush.x + 4, bush.y + 4, bush.w - 8, bush.h - 8);
  }

  for (const w of arenaWalls) {
    ctx.fillStyle = "#7a573a";
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = "#523720";
    ctx.lineWidth = 3;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  for (const p of arenaPortals) {
    const pulse = 2 + Math.sin(performance.now() / 120) * 2;
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.24;
    ctx.arc(p.x, p.y, p.r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 4;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const g of gems) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(performance.now() / 450);
    ctx.fillStyle = "#b866ff";
    ctx.beginPath();
    ctx.moveTo(0, -g.r);
    ctx.lineTo(g.r, 0);
    ctx.lineTo(0, g.r);
    ctx.lineTo(-g.r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (const goal of goals) {
    ctx.fillStyle = "rgba(255, 235, 128, 0.35)";
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
    ctx.strokeStyle = "#ffd65d";
    ctx.strokeRect(goal.x, goal.y, goal.w, goal.h);
  }
}

function drawProjectile(b) {
  if (b.kind === "shell") ctx.fillStyle = "#b76cff";
  else if (b.kind === "wave") ctx.fillStyle = "#ff7f66";
  else if (b.kind === "burst") ctx.fillStyle = "#ffb24a";
  else if (b.kind === "super") ctx.fillStyle = "#ffe059";
  else if (b.kind === "ulta") ctx.fillStyle = "#ff3d93";
  else if (b.kind === "enemy") ctx.fillStyle = "#ff5f59";
  else ctx.fillStyle = "#53b7ff";

  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.globalAlpha = 0.35;
  ctx.arc(b.x - b.vx * 0.9, b.y - b.vy * 0.9, b.r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawBrawler(x, y, r, skin, hp, maxHp, hit, hidden = false, hyper = false, team = null) {
  const pulse = hit > 0 ? Math.sin(performance.now() / 24) * 1.8 : 0;
  if (hidden) ctx.globalAlpha = 0.5;

  ctx.beginPath();
  ctx.fillStyle = hit > 0 ? skin.bodyHit : skin.body;
  ctx.arc(x, y, r + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.jacket;
  ctx.fillRect(x - r * 0.64, y + r * 0.1, r * 1.28, r * 0.74);

  if (!HIDE_FACES) {
    ctx.beginPath();
    ctx.fillStyle = skin.hair;
    ctx.arc(x, y - r * 0.38, r * 0.6, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = skin.head;
    ctx.arc(x, y - r * 0.2, r * 0.56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a2633";
    ctx.fillRect(x - r * 0.35, y - r * 0.24, r * 0.7, r * 0.22);

    ctx.beginPath();
    ctx.fillStyle = skin.eye;
    ctx.arc(x - r * 0.14, y - r * 0.14, r * 0.07, 0, Math.PI * 2);
    ctx.arc(x + r * 0.14, y - r * 0.14, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3a2323";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.04, r * 0.12, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  const bw = r * 2.2;
  const bh = 8;
  const hx = x - bw / 2;
  const hy = y - r - 14;
  ctx.fillStyle = "#15242e";
  ctx.fillRect(hx, hy, bw, bh);
  ctx.fillStyle = "#4ee36f";
  ctx.fillRect(hx, hy, bw * Math.max(0, hp / maxHp), bh);

  if (hyper) {
    ctx.strokeStyle = "rgba(255, 53, 154, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 7 + Math.sin(performance.now() / 85) * 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (team) {
    ctx.strokeStyle = TEAM_COLORS[team] || team;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function draw() {
  drawArena();

  for (const b of bullets) drawProjectile(b);
  for (const b of enemyBullets) drawProjectile(b);

  if (!player) {
    return;
  }

  for (const e of enemies) {
    const hidden = isInBush(e) && Math.hypot(e.x - player.x, e.y - player.y) > 160;
    drawBrawler(e.x, e.y, e.r, e.skin, e.hp, e.maxHp, e.hit, hidden, false, "red");
  }

  for (const a of allies) {
    const hidden = isInBush(a) && Math.hypot(a.x - player.x, a.y - player.y) > 160;
    drawBrawler(a.x, a.y, a.r, a.skin, a.hp, a.maxHp, a.hit, hidden, false, "blue");
  }

  const playerHidden = isInBush(player);
  drawBrawler(
    player.x,
    player.y,
    player.r,
    player.skin,
    player.hp,
    player.maxHp,
    player.flash,
    playerHidden,
    player.hyperMs > 0,
    "blue"
  );

  drawBall();

  const ang = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(ang) * 34, player.y + Math.sin(ang) * 34);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(10, 10, 330, 34);
  ctx.fillStyle = "#ffe98c";
  ctx.font = "bold 16px Trebuchet MS";
  ctx.fillText(`${selectedMode.name} | ${selectedArena.name} | ${message}`, 18, 32);
}

function playTone(freq, duration, type, gainValue) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  gain.gain.linearRampToValueAtTime(gainValue, audioCtx.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

function playKick() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(46, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.14);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function playSnare() {
  const bufferSize = audioCtx.sampleRate * 0.09;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1600;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);

  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.1);
}

function tryStartMenuMusic() {
  if (musicStarted) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = audioCtx || new AudioContextClass();

    const bassLine = [82.41, 98, 110, 82.41, 123.47, 110, 98, 92.5];
    const leadLine = [659.25, 587.33, 523.25, 587.33, 698.46, 659.25, 587.33, 523.25];

    const tick = () => {
      if (!audioCtx) return;
      const step = beatStep % 16;
      const bass = bassLine[beatStep % bassLine.length];

      if (step % 4 === 0 || step === 6 || step === 14) playKick();
      if (step === 4 || step === 12) playSnare();
      if (step % 2 === 1) playTone(7600, 0.025, "square", 0.018);
      if (step % 2 === 0) playTone(bass, 0.19, "sawtooth", 0.06);
      if (step === 2 || step === 7 || step === 10 || step === 15) {
        playTone(leadLine[(beatStep / 2) % leadLine.length | 0], 0.11, "triangle", 0.036);
      }
      if (step === 3 || step === 11) {
        playTone(392, 0.09, "square", 0.028);
      }

      beatStep++;
    };

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    tick();
    musicTimer = setInterval(tick, 95);
    musicStarted = true;
  } catch (_) {
    // Browser may block audio before user interaction.
  }
}

function resetGame() {
  chooseArena(selectedArena.id);
  if (selectedMode.goals) {
    arenaPortals = arenaPortals.filter((p) => p.x > 140 && p.x < W - 140);
  }

  if (!isOwned(selectedBrawler.id)) {
    selectedBrawler = getDefaultBrawler();
  }

  player = makePlayer();
  const safeStart = findSafeSpot(player.x, player.y, player.r);
  player.x = safeStart.x;
  player.y = safeStart.y;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  allies = [];
  score = 0;
  kills = 0;
  message = "";
  spawnTick = 0;
  allySpawnTick = 0;
  gemTick = 0;

  beginModeObjects();

  if (selectedMode.team) {
    const s = getTeamSpawn("blue", 0);
    player.x = s.x;
    player.y = s.y;

    for (let i = 0; i < TEAM_SIZE; i++) {
      enemies.push(makeEnemy(i + 1));
    }
    for (let i = 0; i < TEAM_SIZE - 1; i++) {
      allies.push(makeAlly(i + 1));
    }
  } else {
    for (let i = 0; i < selectedMode.startEnemies; i++) {
      enemies.push(makeEnemy(i + 1));
    }
  }

  running = true;
  overlay.innerHTML = "";
  overlay.style.display = "none";
}

function renderIntroStep(step) {
  overlay.style.display = "grid";
  if (step.id === "supercell") {
    overlay.innerHTML = `
      <div class="splash">
        <div class="supercell">
          <span>SUP</span>
          <span>ERC</span>
          <span>ELL</span>
        </div>
      </div>
    `;
    return;
  }

  if (step.id === "brawl") {
    overlay.innerHTML = `
      <div class="splash">
        <h1 class="logo logo--splash">BRAWL STARS</h1>
      </div>
    `;
    return;
  }

  const label = step.label || "ZAGRUZKA";
  overlay.innerHTML = `
    <div class="splash">
      <div class="loading-text">${label}...</div>
      <div class="loading-bar">
        <span class="loading-fill" style="animation-duration:${step.duration}ms"></span>
      </div>
    </div>
  `;
}

function startIntro() {
  introDone = false;
  introIndex = 0;
  introTimer = 0;
  renderIntroStep(INTRO_STEPS[0]);
}

function updateIntro(dt) {
  if (introDone) return;
  introTimer += dt;
  const step = INTRO_STEPS[introIndex];
  if (!step) {
    introDone = true;
    renderStartMenu();
    return;
  }
  if (introTimer >= step.duration) {
    introIndex += 1;
    introTimer = 0;
    if (introIndex >= INTRO_STEPS.length) {
      introDone = true;
      renderStartMenu();
    } else {
      renderIntroStep(INTRO_STEPS[introIndex]);
    }
  }
}

function renderStartMenu() {
  overlay.style.display = "grid";
  if (!isOwned(selectedBrawler.id)) {
    selectedBrawler = getDefaultBrawler();
  }
  overlay.innerHTML = `
    <div class="menu">
      <h1 class="logo logo--menu">BRAWL STARS</h1>
      <p class="logo-sub">Portal, Ulta, Hypercharge bilan jang</p>
      <div class="pickers">
        <div class="picker-row" id="modePick"></div>
        <div class="picker-row" id="arenaPick"></div>
      </div>
      <div class="wallet">
        <div class="currency">Gems: ${progress.gems}</div>
        <button class="chip ${canClaimDaily() ? "active" : "disabled"}" id="dailyDropBtn">
          ${canClaimDaily() ? "Starr Drop (Free)" : "Starr Drop (Ertaga)"}
        </button>
      </div>
      <div class="cards" id="cards"></div>
      <p class="logo-sub" id="summary"></p>
      <p class="menu-msg" id="menuMsg">${menuMessage}</p>
      <button class="start-btn" id="startBtn">Boshlash</button>
      <p class="hint2">WASD, SPACE Shoot, R Super, Q Ulta, H Hypercharge, E/Right click Top</p>
    </div>
  `;

  const modePick = overlay.querySelector("#modePick");
  modePick.innerHTML = Object.values(MODES)
    .map((m) => `<button class="chip ${m.id === selectedMode.id ? "active" : ""}" data-mode="${m.id}">${m.name}</button>`)
    .join("");

  const arenaPick = overlay.querySelector("#arenaPick");
  arenaPick.innerHTML = Object.values(ARENAS)
    .map((a) => `<button class="chip ${a.id === selectedArena.id ? "active" : ""}" data-arena="${a.id}">${a.name}</button>`)
    .join("");

  const cards = overlay.querySelector("#cards");
  cards.innerHTML = BRAWLERS.map((b) => {
    const rarity = RARITIES[b.rarity] || RARITIES.rare;
    const owned = isOwned(b.id);
    const cost = rarity.gemCost;
    return `
      <button class="card ${owned ? "" : "locked"} ${b.id === selectedBrawler.id ? "active" : ""}" data-id="${b.id}" data-locked="${!owned}">
        <div class="card-top">
          <div class="avatar" style="--body:${b.skin.body};--head:${b.skin.head};--hair:${b.skin.hair};--jacket:${b.skin.jacket};">
            <span class="avatar-eyes"></span>
            <span class="avatar-jacket"></span>
          </div>
          <div class="meta">
            <h3>${b.name}</h3>
            <p>${b.desc}</p>
            <span class="rarity-tag" style="--rarity:${rarity.color};">${rarity.name}</span>
          </div>
        </div>
        <p>HP: ${b.hp} | Reload: ${(b.reloadMs / 1000).toFixed(2)}s | Qurol: ${b.weapon}</p>
        ${owned ? "" : `<p>Cost: ${cost} gems</p>`}
        ${owned ? "" : `<div class="lock-layer"><span class="lock-icon"></span><span class="lock-text">LOCKED</span></div>`}
      </button>
    `;
  }).join("");

  const summary = overlay.querySelector("#summary");
  summary.textContent = `${selectedMode.name}: ${selectedMode.desc} | Arena: ${selectedArena.desc} | Owned: ${progress.owned.length}/${BRAWLERS.length}`;

  cards.querySelectorAll(".card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const b = BRAWLERS.find((x) => x.id === btn.dataset.id);
      if (!b) return;
      const owned = isOwned(b.id);
      if (!owned) {
        const cost = RARITIES[b.rarity].gemCost;
        if (progress.gems >= cost) {
          progress.gems -= cost;
          unlockBrawler(b);
          menuMessage = `${b.name} ochildi.`;
        } else {
          menuMessage = `Gems yetarli emas (${cost}).`;
        }
        renderStartMenu();
        return;
      }
      selectedBrawler = b;
      renderStartMenu();
    });
  });

  modePick.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMode = MODES[btn.dataset.mode] || selectedMode;
      renderStartMenu();
    });
  });

  arenaPick.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedArena = ARENAS[btn.dataset.arena] || selectedArena;
      renderStartMenu();
    });
  });

  const dailyBtn = overlay.querySelector("#dailyDropBtn");
  if (dailyBtn) {
    dailyBtn.addEventListener("click", () => {
      if (!canClaimDaily()) {
        menuMessage = "Bugun starr drop olingan.";
        renderStartMenu();
        return;
      }
      const result = openStarrDrop();
      autoDropShown = true;
      showDropAnimation(result);
    });
  }

  if (canClaimDaily() && !autoDropShown) {
    autoDropShown = true;
    const result = openStarrDrop();
    showDropAnimation(result);
  }

  overlay.querySelector("#startBtn").addEventListener("click", () => {
    tryStartMenuMusic();
    resetGame();
  });
}

function showEndMenu(win, title, rewardGems) {
  overlay.style.display = "grid";
  const summaryParts = [`Score: ${score}`, `Kills: ${kills}`];
  if (selectedMode.gems) summaryParts.push(`Gems: ${gemScore}`);
  if (selectedMode.goals) summaryParts.push(`Goals: ${goalScore}`);
  if (win && rewardGems) summaryParts.push(`Reward: +${rewardGems} gems`);
  if (canClaimDaily()) summaryParts.push("Free Starr Drop tayyor");
  const summary = summaryParts.join(" | ");
  overlay.innerHTML = `
    <div class="menu">
      <h1 class="logo logo--menu">${title}</h1>
      <p class="logo-sub">${summary}</p>
      <button class="start-btn" id="retryBtn">Qayta o'ynash</button>
      <button class="start-btn" id="menuBtn">Menu</button>
    </div>
  `;

  overlay.querySelector("#retryBtn").addEventListener("click", () => {
    tryStartMenuMusic();
    resetGame();
  });

  overlay.querySelector("#menuBtn").addEventListener("click", () => {
    renderStartMenu();
  });
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  const code = e.code;
  keys.add(k);

  if (!musicStarted) tryStartMenuMusic();

  if (!running || !player) return;

  if ((code === "KeyR" || k === "r") && player.superMeter >= 100 && player.superMs <= 0) castSuper();
  if ((code === "KeyQ" || k === "q") && player.ultaMeter >= 100) castUlta();
  if ((code === "KeyH" || k === "h") && player.hyperMeter >= 100 && player.hyperMs <= 0) castHyper();
  if (code === "KeyE" || k === "e") tryKickBall();
  if (code === "Space" || k === " ") {
    mouse.down = true;
  }
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  keys.delete(k);
  if (e.code === "Space" || k === " ") {
    mouse.down = false;
  }
});

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * W;
  mouse.y = ((e.clientY - r.top) / r.height) * H;
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    tryKickBall();
    return;
  }
  mouse.down = true;
  if (!musicStarted) tryStartMenuMusic();
});
window.addEventListener("mouseup", () => (mouse.down = false));

let last = performance.now();
function frame(t) {
  const dt = t - last;
  last = t;

  if (overlay.style.display === "none" && !player) {
    resetGame();
  }

  if (!introDone) {
    updateIntro(dt);
  }

  if (running) update(dt);
  draw();
  requestAnimationFrame(frame);
}

chooseArena("canyon");
startIntro();
requestAnimationFrame(frame);
