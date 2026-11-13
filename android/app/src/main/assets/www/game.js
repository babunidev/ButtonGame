/**
 * Buttongame — HTML5 remake.
 * Developer: Babuni.dev
 *
 * - Timer starts on first target click.
 * - First click: +1 point. Only qualifying combinations award extra time.
 * - Extra clicks while fading: points only.
 * - Floating combat-text points that tumble, merge, and fade.
 */
(function () {
  "use strict";

  const FPS = 15;
  const FRAME_MS = 1000 / FPS;
  const BASE_DURATION_MS = 60000;
  const TRAP_CHANCE = 0.10;
  const TRAP_POINT_INTERVAL_MS = 1000 / 3;
  const RED_BUTTON_IMAGE = "assets/button-red.svg";
  const NORMAL_BUTTON_IMAGE = "assets/button.svg";
  const FADE_START_ALPHA = 100;
  const FADE_END_ALPHA = 5;
  const SPAWN_ANIM_MS = 320;
  const QUICK_STRIKE_WINDOW_MS = 73;
  // Delay breakup while keeping each button's overall life unchanged.
  const POP_DELAY_MS = 160;
  const POP_DURATION_MS = 420;
  const CRACK_PHASE_MS = 100;
  const BREAK_PHASE_MS = 165;
  const SCATTER_FADE_MS = 325;
  const TAP_FLASH_MS = 125;
  const TAP_PULSE_MS = 145;
  const TAP_PULSE_SCALE = 1.10;
  const QUICK_SPIN_MS = 290;
  const QUICK_STRIKE_SCALE = 1.5;
  const STAGE = 450;
  const TARGET_HALF = 40;
  const MAX_SPAWN_TILT_DEG = 45;
  const MERGE_DIST = 34;
  // Only one merge is allowed per short recovery period. Larger values
  // take longer to become mergeable again, preventing instant cascades.
  const MERGE_SPAWN_WAIT_MS = 120;
  const MERGE_RECOVERY_BASE_MS = 320;
  const MERGE_RECOVERY_PER_LOG_MS = 100;
  const FLOAT_LIFE = 3400;
  const FLOAT_GRAVITY = 480;
  const FLOAT_EDGE = 18;
  const FLOAT_REST = 0.42;
  // Exact totals that hang around longer for more combos.
  const LINGER_AT = { 7: true, 14: true };
  // Exact jackpots: burst into ones + double that total added to the score.
  // 21 and 37 have dedicated, exact-value transforms. Natural 42/73 still
  // use the legacy jackpot effect.
  const JACKPOT_AT = { 42: true, 73: true };
  const SPECIAL_LABEL_SCALE = 2.64; // 20% larger than the previous 2.2x 37/73
  const COMBO42_EDGE = 16;
  const COMBO42_BOUNCE_MS = 1140;
  const COMBO42_CHANGE_START_MS = 630;
  const COMBO42_GATHER_MS = 690;
  const COMBO42_HOLD_MS = 360;
  const COMBO42_GREEN_MS = 250;
  const REVERSE_MOVE_MS = 490;
  const REVERSE_FLIP_MS = 360;
  const REVERSE_HOLD_MS = 160;
  const REVERSE_GREEN_MS = 180;
  const REVERSE_CENTER_X = STAGE / 2;
  const REVERSE_CENTER_Y = 110;
  // Seconds awarded per exact value. 21/37 only trigger transformations;
  // their 42/73 results grant the bonus.
  const TIME_BONUS_SECONDS = { 7: 2, 14: 3, 42: 5, 73: 4 };
  const TIME_BONUS_AT = TIME_BONUS_SECONDS;
  const TIME_FLY_MS = 690;
  const TIME_HOLD_MS = 350;
  const TIME_FEED_SECONDS_PER_SECOND = 4;
  const SCORE_FLY_MS = 690;
  const SCORE_HOLD_MS = 350;
  const SCORE_FEED_MIN_PER_SECOND = 18;
  const SCORE_FEED_MAX_PER_SECOND = 180;
  const SEEK_ONE_TO_TWENTY = 118;
  const SEEK_ACCEL = 980;

  // Collision AABBs in 450px stage coordinates, matching the tighter
  // top-corner panels and single bottom-center Reaction/APM plate.
  // Both top boxes include room for the incoming score/time balances.
  const HUD_BOXES = [
    { l: 0, t: 0, r: 175, b: 65 },
    { l: 275, t: 0, r: 450, b: 65 },
    { l: 100, t: 385, r: 350, b: 450 },
  ];

  // Each floater picks one side as "down" so combos tumble every which way.
  const GRAVITY_DIRS = [
    { gx: 0, gy: 1 },
    { gx: 0, gy: -1 },
    { gx: 1, gy: 0 },
    { gx: -1, gy: 0 },
  ];

  const feind = document.getElementById("feind");
  const trapOptionEl = document.getElementById("trap-option");
  const trapToggleEl = document.getElementById("traps-toggle");
  const pointSourceEl = document.getElementById("point-source");
  const punkteEl = document.getElementById("punkte");
  const scoreBufferEl = document.getElementById("score-buffer");
  const stageEl = document.getElementById("stage");
  const scoreFlyLayer = document.getElementById("score-fly-layer");
  const timeEl = document.getElementById("time");
  const timeBufferEl = document.getElementById("time-buffer");
  const apmEl = document.getElementById("apm");
  const reactEl = document.getElementById("react");
  const anleitungEl = document.getElementById("anleitung");
  const endEl = document.getElementById("end");
  const playAgainBtn = document.getElementById("play-again");
  const floatLayer = document.getElementById("float-layer");
  const endWrap = document.getElementById("end-wrap");
  const scoreForm = document.getElementById("score-form");
  const playerNameInput = document.getElementById("player-name");
  const submitScoreBtn = document.getElementById("submit-score");
  const scoreStatus = document.getElementById("score-status");
  const leaderboardBody = document.getElementById("leaderboard-body");
  const previewEl = document.getElementById("live-leaderboard");
  const previewListEl = document.getElementById("live-leaderboard-list");
  let lastHostScores = [];
  const livePlayersEl = document.getElementById("live-players");

  const LOCAL_NAME_KEY = "buttongame_name_v1";
  const LOCAL_SESSION_KEY = "buttongame_session_v1";
  const LOCAL_MUTE_KEY = "buttongame_muted_v1";
  const MAX_NAME = 16;
  const MAX_SCORES = 100;
  // Bell once whenever a NEW qualifying value is reached, not once per lineage.
  const COMBO_BELL_VALUES = { 7: true, 14: true, 21: true, 37: true, 42: true, 73: true };
  const MASTER_VOL = 0.72;

  const soundToggleBtn = document.getElementById("sound-toggle");
  let soundMuted = false;
  try {
    soundMuted = localStorage.getItem(LOCAL_MUTE_KEY) === "1";
  } catch (e) {
    soundMuted = false;
  }

  const IMPACT_FILES = [
    "assets/sfx/impact1.ogg",
    "assets/sfx/impact2.ogg",
    "assets/sfx/impact3.ogg",
    "assets/sfx/impact4.ogg",
  ];
  const BELL_FILES = [
    "assets/sfx/Bell1.ogg",
    "assets/sfx/Bell2.ogg",
    "assets/sfx/Bell3.ogg",
  ];
  // Optional new recordings. Until the actual clips are provided, existing
  // bell/impact sounds are used so all builds remain fully playable.
  const SPECIAL_REVEAL_FILE = "assets/sfx/4273.ogg";
  const QUICK_STRIKE_IMPACT_FILES = [
    "assets/sfx/QuickStrikepoints.ogg",
    "assets/sfx/QuickStrikepoints1.ogg",
  ];

  let audioCtx = null;
  let masterGain = null;
  const buffers = Object.create(null);
  // Media-element backup: the first click can arrive before the Web Audio
  // decoders finish, or a browser may suspend the AudioContext until a gesture.
  // Some browsers also lack Ogg/Vorbis: use the MP3 counterpart when supplied.
  const canPlayOgg = !!document.createElement("audio")
    .canPlayType('audio/ogg; codecs="vorbis"');
  const warnedSoundErrors = Object.create(null);

  function reportSoundIssue(message, error) {
    if (warnedSoundErrors[message]) return;
    warnedSoundErrors[message] = true;
    console.warn("Button Game sound:", message, error || "");
    if (soundToggleBtn && !soundMuted) {
      soundToggleBtn.title = "Sound could not play — check browser audio settings";
    }
  }

  function playMediaFallback(url, opts) {
    if (soundMuted) return;
    try {
      const media = new Audio(canPlayOgg ? url : url.replace(/\.ogg$/i, ".mp3"));
      media.volume = Math.min(1, Math.max(0, (opts.gain != null ? opts.gain : 0.8) * MASTER_VOL));
      media.playbackRate = opts.rate != null ? opts.rate : 1;
      const playing = media.play();
      if (playing && playing.catch) {
        playing.catch(function (error) { reportSoundIssue("Browser prevented or rejected audio playback", error); });
      }
    } catch (error) {
      reportSoundIssue("Audio fallback unavailable", error);
    }
  }

  function applyMasterMute() {
    if (masterGain) {
      masterGain.gain.value = soundMuted ? 0 : MASTER_VOL;
    }
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle("is-muted", soundMuted);
      soundToggleBtn.setAttribute("aria-pressed", soundMuted ? "true" : "false");
      soundToggleBtn.setAttribute(
        "aria-label",
        soundMuted ? "Unmute sound" : "Mute sound"
      );
      soundToggleBtn.title = soundMuted ? "Sound off" : "Sound on";
    }
  }

  function setSoundMuted(muted) {
    soundMuted = !!muted;
    try {
      localStorage.setItem(LOCAL_MUTE_KEY, soundMuted ? "1" : "0");
    } catch (e) {
      /* ignore quota / private mode */
    }
    applyMasterMute();
  }

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = soundMuted ? 0 : MASTER_VOL;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  }

  function loadBuffer(url) {
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("sfx " + url);
        return r.arrayBuffer();
      })
      .then(function (ab) {
        return new Promise(function (resolve, reject) {
          ensureAudio();
          if (!audioCtx) {
            reject(new Error("no audio"));
            return;
          }
          audioCtx.decodeAudioData(
            ab.slice(0),
            function (buf) {
              buffers[url] = buf;
              resolve(buf);
            },
            reject
          );
        });
      })
      .catch(function (error) {
        // Never fail completely silently: the first tap still has the HTML
        // media fallback, and the browser console explains the underlying cause.
        reportSoundIssue("Couldn't preload " + url, error);
      });
  }

  function preloadSfx() {
    Promise.all(IMPACT_FILES.concat(BELL_FILES, QUICK_STRIKE_IMPACT_FILES,
      [SPECIAL_REVEAL_FILE]).map(loadBuffer));
  }

  function playBuffer(url, opts) {
    if (soundMuted) return;
    opts = opts || {};
    const ctx = ensureAudio();
    const buf = buffers[url];
    if (!ctx || !buf || !masterGain || ctx.state !== "running") {
      playMediaFallback(url, opts);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate != null ? opts.rate : 1;

    const g = ctx.createGain();
    const vol = opts.gain != null ? opts.gain : 0.8;
    // Tiny attack so spam-clicks don't click/pop as hard.
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.05, buf.duration * 0.92));

    src.connect(g);
    g.connect(masterGain);
    src.start(t0);
    src.stop(t0 + buf.duration + 0.05);
  }

  function playRandomImpact() {
    const url = IMPACT_FILES[(Math.random() * IMPACT_FILES.length) | 0];
    playBuffer(url, {
      gain: 0.55 + Math.random() * 0.2,
      rate: 0.94 + Math.random() * 0.12,
    });
  }

  function playRandomBell() {
    const url = BELL_FILES[(Math.random() * BELL_FILES.length) | 0];
    playBuffer(url, {
      gain: 0.78 + Math.random() * 0.12,
      rate: 0.98 + Math.random() * 0.04,
    });
  }

  function playSpecialRevealSound() {
    // Replace, rather than layer over, the milestone bell for transformed
    // 42/73. Use the old bell if the new file is not installed yet.
    if (!buffers[SPECIAL_REVEAL_FILE]) {
      playRandomBell();
      return;
    }
    playBuffer(SPECIAL_REVEAL_FILE, { gain: 0.35, rate: 1 });
  }

  function playQuickStrikeImpact() {
    const ready = QUICK_STRIKE_IMPACT_FILES.filter(function (url) {
      return !!buffers[url];
    });
    if (!ready.length) {
      playRandomImpact();
      return;
    }
    const url = ready[(Math.random() * ready.length) | 0];
    playBuffer(url, { gain: 0.26 + Math.random() * 0.04,
      rate: 0.98 + Math.random() * 0.04 });
  }

  function playTapImpact() {
    if (quickStrikeActive) playQuickStrikeImpact();
    else playRandomImpact();
  }

  function ringJackpotBell(value) {
    if (COMBO_BELL_VALUES[value]) playRandomBell();
  }

  applyMasterMute();
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      ensureAudio();
      setSoundMuted(!soundMuted);
    });
  }
  preloadSfx();

  function getSessionId() {
    try {
      let id = localStorage.getItem(LOCAL_SESSION_KEY);
      if (!id) {
        id =
          "p_" +
          Math.random().toString(36).slice(2, 10) +
          Date.now().toString(36);
        localStorage.setItem(LOCAL_SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return "p_" + String(Date.now());
    }
  }

  function getLiveName() {
    const fromInput = (playerNameInput && playerNameInput.value) || "";
    if (fromInput.trim()) return fromInput.trim().slice(0, MAX_NAME);
    try {
      return (localStorage.getItem(LOCAL_NAME_KEY) || "").trim().slice(0, MAX_NAME);
    } catch (e) {
      return "";
    }
  }

  function rememberName(name) {
    const cleaned = String(name || "").trim().slice(0, MAX_NAME);
    if (!cleaned) return;
    try {
      localStorage.setItem(LOCAL_NAME_KEY, cleaned);
    } catch (e) {}
    if (playerNameInput) playerNameInput.value = cleaned;
  }

  const sessionId = getSessionId();

  function currentApmValue() {
    if (!started || !startTime) return 0;
    const minutes = Math.max((performance.now() - startTime) / 60000, 1 / 60);
    return Math.round(hitCount / minutes);
  }

  function currentReactionValue() {
    if (!reactHasValue) return 0;
    return Math.max(0, Math.round(reactDisplay || reactTarget || 0));
  }

  function renderLivePlayers(players) {
    if (!livePlayersEl) return;
    const list = Array.isArray(players) ? players : [];
    livePlayersEl.textContent = "";
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (!p) continue;
      const chip = document.createElement("div");
      chip.className = "live-chip" + (p.id === sessionId ? " is-self" : "");

      const name = document.createElement("div");
      name.className = "live-name";
      name.textContent = p.label || p.name || "Player";
      chip.appendChild(name);

      const scoreLine = document.createElement("div");
      scoreLine.className = "live-score";
      scoreLine.textContent = String(Math.max(0, p.score | 0));
      chip.appendChild(scoreLine);

      const timeLine = document.createElement("div");
      timeLine.className = "live-meta";
      timeLine.textContent = p.playing
        ? "Time " + Math.max(0, p.timeLeft | 0) + "s"
        : "ready";
      chip.appendChild(timeLine);

      const reactLine = document.createElement("div");
      reactLine.className = "live-meta";
      reactLine.textContent =
        p.reactionMs > 0 ? "React " + (p.reactionMs | 0) + " ms" : "React —";
      chip.appendChild(reactLine);

      const apmLine = document.createElement("div");
      apmLine.className = "live-meta";
      apmLine.textContent =
        p.playing && p.apm > 0 ? "APM " + (p.apm | 0) : "APM —";
      chip.appendChild(apmLine);

      livePlayersEl.appendChild(chip);
    }
  }

  function pushPresence() {
    const payload = {
      id: sessionId,
      name: getLiveName(),
      score: score,
      timeLeft: trapEnding ? 0 : Math.max(0, remainingSeconds()),
      reactionMs: currentReactionValue(),
      apm: currentApmValue(),
      playing: started && !gameOver && !trapEnding,
    };
    fetch("api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.players) renderLivePlayers(data.players);
      })
      .catch(function () {});
  }

  function randomint(min, max) {
    return Math.round(Math.random() * (max - min)) + min;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function fadeDurationMs(fluppRate) {
    const frames = Math.ceil((FADE_START_ALPHA - FADE_END_ALPHA) / fluppRate);
    return frames * FRAME_MS;
  }

  function overlapsHud(cx, cy) {
    const left = cx - TARGET_HALF;
    const right = cx + TARGET_HALF;
    const top = cy - TARGET_HALF;
    const bottom = cy + TARGET_HALF;
    for (let i = 0; i < HUD_BOXES.length; i++) {
      const b = HUD_BOXES[i];
      if (left < b.r && right > b.l && top < b.b && bottom > b.t) return true;
    }
    return false;
  }

  function randomSpawnRotation() {
    // Independently tilt each button, carrying the orientation into its shatter.
    return randomint(-MAX_SPAWN_TILT_DEG, MAX_SPAWN_TILT_DEG);
  }

  function randomSpawn() {
    for (let i = 0; i < 50; i++) {
      const nx = randomint(55, 395);
      const ny = randomint(90, 360);
      // The initial start-screen checkbox must not cover the first normal target.
      if (!started && Math.abs(nx - STAGE / 2) < 100 && ny > 110 && ny < 205) continue;
      if (!overlapsHud(nx, ny)) return { x: nx, y: ny };
    }
    return { x: STAGE / 2, y: STAGE / 2 };
  }

  let score = 0;
  let finalStats = null;
  let started = false;
  let deadline = 0;
  let startTime = 0;
  let gameOver = false;
  let roundExpired = false;
  let trapsEnabled = false;
  let trapActive = false;
  let trapEnding = false; // Game Over shown immediately, earned points still settle.
  let trapLossAt = 0;
  let nextTrapEmissionAt = 0;
  let x = STAGE / 2;
  let y = STAGE / 2;
  let rotation = 0;
  let alpha = FADE_START_ALPHA;
  let flupp = 0;
  let fading = false;
  let frameAcc = 0;
  let lastTs = performance.now();

  let hitCount = 0;
  let spawnTime = null;
  let reactionSumMs = 0;
  let reactionSamples = 0;
  let reactDisplay = 0;
  let reactTarget = 0;
  let reactHasValue = false;

  let punchScale = 1;
  let spawnScale = 1;
  let spawnAnimUntil = 0;
  let shakeX = 0;
  let shakeY = 0;
  let shakeUntil = 0;
  let popping = false;
  let popStartedAt = 0;
  let popUntil = 0;
  let pendingPopAt = 0;
  let tapFlashStartedAt = -Infinity;
  let quickSpinStartedAt = -Infinity;
  let quickStrikeActive = false;

  /** @type {Array<{
   *  el: HTMLElement, value: number, x: number, y: number,
   *  vx: number, vy: number, rot: number, spin: number,
   *  scale: number, age: number, life: number, alive: boolean
   * }>} */
  const floaters = [];
  const timeFlies = [];
  const scoreFlies = [];
  const reversing37 = [];
  const fusing42 = [];
  let scoreBank = 0;
  let scoreBankHoldRemaining = 0;
  let scoreBankFraction = 0;
  let timeFlashUntil = 0;
  let timeBankSeconds = 0;
  let timeBankHoldRemaining = 0;
  let timeBankFraction = 0;
  const popShards = [];
  const SHATTER_CELLS = [[[0,0],[20.53,0],[21.33,14.5],[15.14,19.14],[0,15.78]],[[20.53,0],[41,0],[38.5,15.83],[34.32,19.08],[21.33,14.5]],[[41,0],[62,0],[62,17.4],[53.45,20.82],[38.5,15.83]],[[0,40.03],[0,15.78],[15.14,19.14],[16.83,32.67]],[[16.83,32.67],[15.14,19.14],[21.33,14.5],[34.32,19.08],[33.75,30.47],[21.57,35.04]],[[33.75,30.47],[34.32,19.08],[38.5,15.83],[53.45,20.82],[47.75,35.65],[40.79,37.04]],[[62,17.4],[62,42.67],[59.76,42.85],[47.75,35.65],[53.45,20.82]],[[0,44.86],[0,40.03],[16.83,32.67],[21.57,35.04],[23.3,48.03],[18,52.57]],[[23.3,48.03],[21.57,35.04],[33.75,30.47],[40.79,37.04],[37.76,47.98],[35,50.22]],[[50.73,53.88],[37.76,47.98],[40.79,37.04],[47.75,35.65],[59.76,42.85]],[[18,62],[0,62],[0,44.86],[18,52.57]],[[35,62],[18,62],[18,52.57],[23.3,48.03],[35,50.22]],[[51.75,62],[35,62],[35,50.22],[37.76,47.98],[50.73,53.88]],[[62,42.67],[62,62],[51.75,62],[50.73,53.88],[59.76,42.85]]];
  const SVG_NS = "http://www.w3.org/2000/svg";
  let crackOverlay = null;

  function polygonCss(poly) {
    return "polygon(" + poly.map(function (p) {
      return (p[0] / 62 * 100).toFixed(3) + "% " + (p[1] / 62 * 100).toFixed(3) + "%";
    }).join(", ") + ")";
  }

  function clearPopShards() {
    if (crackOverlay) {
      crackOverlay.remove();
      crackOverlay = null;
    }
    for (let i = 0; i < popShards.length; i++) popShards[i].el.remove();
    popShards.length = 0;
    feind.classList.remove("is-shattering");
  }

  function createShatterParts() {
    clearPopShards();
    crackOverlay = document.createElementNS(SVG_NS, "svg");
    crackOverlay.setAttribute("viewBox", "0 0 62 62");
    crackOverlay.setAttribute("aria-hidden", "true");
    crackOverlay.classList.add("button-cracks");
    for (let i = 0; i < SHATTER_CELLS.length; i++) {
      const polygon = document.createElementNS(SVG_NS, "polygon");
      polygon.setAttribute("points", SHATTER_CELLS[i].map(function (p) { return p.join(","); }).join(" "));
      polygon.setAttribute("fill", "none");
      polygon.setAttribute("stroke", "#002126");
      polygon.setAttribute("stroke-width", "1.65");
      polygon.setAttribute("stroke-linejoin", "round");
      crackOverlay.appendChild(polygon);
    }
    feind.appendChild(crackOverlay);

    SHATTER_CELLS.forEach(function (poly, i) {
      const image = document.createElement("img");
      image.className = "button-piece";
      image.src = trapActive ? RED_BUTTON_IMAGE : NORMAL_BUTTON_IMAGE;
      image.alt = "";
      image.draggable = false;
      image.style.clipPath = polygonCss(poly);
      image.style.webkitClipPath = polygonCss(poly);
      image.style.opacity = "0";
      feind.appendChild(image);
      const centroid = poly.reduce(function (acc, pt) {
        acc.x += pt[0]; acc.y += pt[1]; return acc;
      }, {x:0,y:0});
      centroid.x /= poly.length; centroid.y /= poly.length;
      const dx = centroid.x - 31;
      const dy = centroid.y - 31;
      const angle = Math.atan2(dy,dx) + (i % 3 - 1) * 0.13;
      popShards.push({
        el:image,
        tx:Math.cos(angle) * (50 + (i * 17) % 42),
        ty:Math.sin(angle) * (50 + (i * 17) % 42),
        spin:((i % 2) ? -1 : 1) * (24 + (i * 19) % 83)
      });
    });
  }

  function updatePopShards(now) {
    if (!popping) return;
    const age = Math.max(0, now - popStartedAt);
    const crack = age < CRACK_PHASE_MS;
    feind.classList.toggle("is-shattering", !crack);
    if (crackOverlay) crackOverlay.style.display = crack ? "block" : "none";
    for (let i = 0; i < popShards.length; i++) {
      const shard = popShards[i];
      if (crack) {
        shard.el.style.opacity = "0";
        continue;
      }
      let dist, turn;
      if (age < BREAK_PHASE_MS) {
        const t = (age - CRACK_PHASE_MS) / (BREAK_PHASE_MS - CRACK_PHASE_MS);
        dist = 0.07 * t;
        turn = 0.035 * t;
      } else {
        const t = Math.min(1, (age - BREAK_PHASE_MS) / (POP_DURATION_MS - BREAK_PHASE_MS));
        const eased = 1 - Math.pow(1 - t, 2);
        dist = 0.07 + 0.93 * eased;
        turn = 0.035 + 0.965 * eased;
      }
      const opacity = age > SCATTER_FADE_MS
        ? Math.max(0, 1 - (age - SCATTER_FADE_MS) / (POP_DURATION_MS - SCATTER_FADE_MS))
        : 1;
      shard.el.style.opacity = String(opacity);
      shard.el.style.transform = "translate(" + (shard.tx * dist).toFixed(2) + "px, " +
        (shard.ty * dist).toFixed(2) + "px) rotate(" + (shard.spin * turn).toFixed(2) + "deg)";
    }
  }

  function shouldSpawnTrap(enabled, randomValue) {
    return !!enabled && randomValue < TRAP_CHANCE;
  }

  function setTrapActive(enabled) {
    trapActive = !!enabled;
    feind.classList.toggle("is-trap", trapActive);
    feind.setAttribute("aria-label", trapActive ? "Red trap button — do not press" : "Button");
    const asset = trapActive ? RED_BUTTON_IMAGE : NORMAL_BUTTON_IMAGE;
    feind.querySelector(".feind0").src = asset;
    feind.querySelector(".feind1").src = asset;
    nextTrapEmissionAt = trapActive ? performance.now() + TRAP_POINT_INTERVAL_MS : 0;
  }

  function emitTrapPoints(now) {
    // Passive points share the normal visible floater and score-bank lifecycle.
    if (!started || gameOver || roundExpired || trapEnding || !trapActive) return;
    let emitted = 0;
    while (nextTrapEmissionAt && now >= nextTrapEmissionAt && emitted < 6) {
      spawnFloater(3);
      nextTrapEmissionAt += TRAP_POINT_INTERVAL_MS;
      emitted++;
    }
    // The game must not rapidly backfill a long phone-suspension interval.
    if (nextTrapEmissionAt && now >= nextTrapEmissionAt)
      nextTrapEmissionAt = now + TRAP_POINT_INTERVAL_MS;
  }

  function setQuickStrikeActive(enabled) {
    quickStrikeActive = enabled;
    pointSourceEl.classList.toggle("is-quick-strike", enabled);
  }

  function tapPoints() {
    return quickStrikeActive ? 2 : 1;
  }

  function setFeindVisual(hit) {
    feind.classList.toggle("show-idle", !hit);
    feind.classList.toggle("show-hit", hit);
  }

  function applyFeindTransform() {
    const now = performance.now();
    // Press feedback: grow slightly and ease back without automatic shatter scaling.
    const pulseAge = now - tapFlashStartedAt;
    let pulseScale = 1;
    if (pulseAge >= 0 && pulseAge < TAP_PULSE_MS) {
      const fade = 1 - pulseAge / TAP_PULSE_MS;
      pulseScale += (TAP_PULSE_SCALE - 1) * fade * fade;
    }
    // Keep Quick Strike at 150% for most of the spin, then ease smoothly
    // to 100%; ordinary tap pulses still peak at 110%.
    let quickScale = 1;
    let extraRotation = 0;
    const spinTime = now - quickSpinStartedAt;
    if (!popping && spinTime >= 0 && spinTime < QUICK_SPIN_MS) {
      const t = spinTime / QUICK_SPIN_MS;
      extraRotation = 360 * (1 - Math.pow(1 - t, 3));
      const settle = Math.max(0, Math.min(1, (t - 0.6) / 0.4));
      const smooth = settle * settle * (3 - 2 * settle);
      quickScale = 1 + (QUICK_STRIKE_SCALE - 1) * (1 - smooth);
    }
    const scale = (popping ? 1 : Math.min(1, spawnScale)) *
      Math.max(pulseScale, quickScale);
    const flashTime = now - tapFlashStartedAt;
    if (flashTime >= 0 && flashTime < TAP_FLASH_MS) {
      const strength = 1 - flashTime / TAP_FLASH_MS;
      feind.style.filter = "brightness(" + (1 + 1.55 * strength) +
        ") saturate(" + (1 - 0.98 * strength) + ")";
    } else {
      feind.style.filter = "none";
    }
    feind.style.opacity = "1";
    feind.style.transform = "translate(" + (x + shakeX) + "px, " + (y + shakeY) +
      "px) rotate(" + (rotation + extraRotation) + "deg) scale(" + scale + ")";
  }

  function playSpawnIn() {
    spawnScale = 0.15;
    spawnAnimUntil = performance.now() + SPAWN_ANIM_MS;
    applyFeindTransform();
  }

  function respawnTarget() {
    // Return the center source to cyan when a new button spawns.
    setQuickStrikeActive(false);
    setTrapActive(shouldSpawnTrap(started && trapsEnabled, Math.random()));
    popping = false;
    popStartedAt = 0;
    popUntil = 0;
    pendingPopAt = 0;
    clearPopShards();
    feind.style.filter = "none";
    tapFlashStartedAt = -Infinity;
    const spawn = randomSpawn();
    x = spawn.x;
    y = spawn.y;
    rotation = randomSpawnRotation();
    alpha = FADE_START_ALPHA;
    punchScale = 1;
    shakeX = 0;
    shakeY = 0;
    setFeindVisual(false);
    playSpawnIn();
    spawnTime = performance.now();
    // Unlike a normal button, an untouched red trap must expire by itself.
    // Its retirement uses the same fade-step, pop delay and shatter sequence.
    fading = trapActive;
    flupp = trapActive ? randomint(1, 22) : 0;
  }

  function beginPopPhase() {
    pendingPopAt = 0;
    fading = false;
    popping = true;
    popStartedAt = performance.now();
    popUntil = popStartedAt + POP_DURATION_MS;
    alpha = FADE_START_ALPHA;
    punchScale = 1;
    spawnScale = 1;
    spawnAnimUntil = 0;
    shakeX = 0;
    shakeY = 0;
    shakeUntil = 0;
    setFeindVisual(false);
    createShatterParts();
    updatePopShards(popStartedAt);
    applyFeindTransform();
  }

  function setScore(value, notify) {
    score = value;
    punkteEl.textContent = String(score);
    if (notify !== false) pushPresence();
  }

  function updateApm() {
    if (!started) {
      apmEl.textContent = "—";
      return;
    }
    const minutes = Math.max((performance.now() - startTime) / 60000, 1 / 60);
    apmEl.textContent = String(Math.round(hitCount / minutes));
  }

  function syncReactTarget() {
    if (reactionSamples === 0) {
      reactHasValue = false;
      reactEl.textContent = "—";
      return;
    }
    reactHasValue = true;
    reactTarget = Math.round(reactionSumMs / reactionSamples);
  }

  function tweenReactDisplay(dt) {
    if (!reactHasValue) return;
    const diff = reactTarget - reactDisplay;
    if (Math.abs(diff) < 0.5) {
      reactDisplay = reactTarget;
    } else {
      reactDisplay += diff * Math.min(1, dt / 200);
    }
    reactEl.textContent = Math.round(reactDisplay) + " ms";
  }

  function remainingSeconds() {
    if (!started) return Math.ceil(BASE_DURATION_MS / 1000);
    return Math.ceil((deadline - performance.now()) / 1000);
  }

  function updateTimeHud() {
    timeEl.textContent = String(Math.max(0, remainingSeconds()));
  }

  function registerHit() {
    hitCount += 1;
    updateApm();
  }

  function startGame(now) {
    started = true;
    startTime = now;
    trapsEnabled = !!trapToggleEl.checked;
    // The rule is fixed for this round. Re-enable the control at Game Over.
    trapToggleEl.disabled = true;
    trapOptionEl.classList.add("is-locked");
    deadline = now + BASE_DURATION_MS;
    anleitungEl.textContent = "";
    syncScorePreview();
  }

  function triggerQuickFx() {
    punchScale = 1.45;
    shakeUntil = performance.now() + 220;
  }

  function updateFx(now) {
    if (now < shakeUntil) {
      const t = (shakeUntil - now) / 220;
      shakeX = (Math.random() * 2 - 1) * 7 * t;
      shakeY = (Math.random() * 2 - 1) * 7 * t;
      punchScale = 1 + 0.45 * t;
    } else {
      shakeX = 0;
      shakeY = 0;
      if (punchScale > 1) {
        punchScale += (1 - punchScale) * 0.35;
        if (punchScale < 1.01) punchScale = 1;
      }
    }

    if (now < spawnAnimUntil) {
      const t = Math.min(1, 1 - (spawnAnimUntil - now) / SPAWN_ANIM_MS);
      // Ease-out back: pop in small → slight overshoot → settle at 1.
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      spawnScale = 0.12 + 0.88 * Math.max(0, eased);
    } else if (spawnScale !== 1) {
      spawnScale = 1;
    }
  }

  function floaterLabel(value) {
    return "+" + value;
  }

  function floaterFontSize(value) {
    // +1 remains 26px, but multi-digit totals increase more gradually
    // and stop growing at 38px instead of the old 46px ceiling.
    return 23 + Math.min(15, Math.log2(value + 1) * 3);
  }

  function floaterBounds(f) {
    // DOM offset dimensions include the COMPLETE rendered text (+ and all
    // digits), unlike the previous radius derived from font size alone.
    // Offset dimensions are before CSS scale/rotation, as needed here.
    const font = floaterFontSize(f.value);
    const approximateWidth = font * (String(f.value).length + 1) * 0.66;
    const rawWidth = Math.max(approximateWidth, f.el.offsetWidth || 0);
    const rawHeight = Math.max(font * 1.17, f.el.offsetHeight || 0);
    const halfWidth = rawWidth * f.scale * 0.5;
    const halfHeight = rawHeight * f.scale * 0.5;
    const angle = (f.rot || 0) * Math.PI / 180;
    const cs = Math.abs(Math.cos(angle));
    const sn = Math.abs(Math.sin(angle));
    // Rotated bounding box: every digit and the plus sign are enclosed.
    return {
      hx: cs * halfWidth + sn * halfHeight + 3,
      hy: sn * halfWidth + cs * halfHeight + 3,
    };
  }

  function pickGravity() {
    return GRAVITY_DIRS[(Math.random() * GRAVITY_DIRS.length) | 0];
  }

  function spawnFloater(value, opts) {
    opts = opts || {};
    const el = document.createElement("div");
    el.className = "floater";
    el.textContent = floaterLabel(value);
    floatLayer.appendChild(el);

    // Default: burst from stage center so fingers / cursor never cover the +points.
    const cx = opts.x != null ? opts.x : STAGE / 2 + rand(-14, 14);
    const cy = opts.y != null ? opts.y : STAGE / 2 + rand(-18, 10);
    const angle = opts.angle != null ? opts.angle : rand(0, Math.PI * 2);
    const speed = opts.speed != null ? opts.speed : rand(120, 300);
    const g = opts.g || pickGravity();
    const f = {
      el: el,
      value: value,
      // Track earned points separately from cosmetic jackpot shards.
      pendingValue: opts.pendingValue != null ? opts.pendingValue : (opts.visualOnly ? 0 : value),
      gx: g.gx,
      gy: g.gy,
      x: cx,
      y: cy,
      vx: opts.vx != null ? opts.vx : Math.cos(angle) * speed,
      vy: opts.vy != null ? opts.vy : Math.sin(angle) * speed,
      rot: rand(-40, 40),
      spin: rand(-520, 520),
      scale: opts.scale != null ? opts.scale : rand(0.95, 1.25),
      mergeReadyAt: performance.now() + MERGE_SPAWN_WAIT_MS,
      age: 0,
      life: opts.life != null ? opts.life : FLOAT_LIFE + rand(-400, 500),
      alive: true,
      inert: !!opts.inert,
    };
    el.style.fontSize = floaterFontSize(value) + "px";
    if (value >= 5) el.classList.add("big");
    if (f.inert) el.classList.add("jackpot-flash");
    else if (TIME_BONUS_AT[value]) el.classList.add("bonus-eligible");
    floaters.push(f);
    paintFloater(f, 1);
    return f;
  }

  function applyLinger(f) {
    if (!LINGER_AT[f.value]) return;
    f.age = Math.min(f.age, 200);
    f.life = Math.max(f.life, FLOAT_LIFE + 1800) + 900;
    f.scale = Math.min(1.58, f.scale * 1.04);
    f.el.classList.add("linger");
  }

  // 37 is a special transformation, not a generic 2x jackpot.
  // The transformed value (73) is paid once via the existing green pickup flow.
  function begin37Reverse(f) {
    if (!f || !f.alive) return;
    const el = f.el;
    f.alive = false;
    stageEl.appendChild(el);
    el.classList.remove("big", "linger", "score-ready", "jackpot-flash");
    el.classList.add("reverse-37");
    el.style.fontSize = "30px";
    el.style.opacity = "1";
    el.textContent = "37";
    reversing37.push({
      el: el, start: performance.now(), x0: f.x, y0: f.y,
      rotation: f.rot, value: 73, resultBellPlayed: false,
    });
  }

  function update37Reversals(now) {
    for (let i = reversing37.length - 1; i >= 0; i--) {
      const fx = reversing37[i];
      const elapsed = Math.max(0, now - fx.start);
      const moveEnd = REVERSE_MOVE_MS;
      const flipEnd = moveEnd + REVERSE_FLIP_MS;
      const holdEnd = flipEnd + REVERSE_HOLD_MS;
      const greenEnd = holdEnd + REVERSE_GREEN_MS;
      // The newly visible 73 is a separate jackpot milestone from 37.
      if (!fx.resultBellPlayed && elapsed >= moveEnd + REVERSE_FLIP_MS / 2) {
        fx.resultBellPlayed = true;
        playSpecialRevealSound();
        grantTimeBonusFly(REVERSE_CENTER_X, REVERSE_CENTER_Y, 73);
      }
      let x = REVERSE_CENTER_X;
      let y = REVERSE_CENTER_Y;
      let scale = SPECIAL_LABEL_SCALE;
      let angle = 0;
      if (elapsed < moveEnd) {
        const t = Math.min(1, elapsed / moveEnd);
        const ease = 1 - Math.pow(1 - t, 3);
        x = fx.x0 + (REVERSE_CENTER_X - fx.x0) * ease;
        y = fx.y0 + (REVERSE_CENTER_Y - fx.y0) * ease;
        scale = 1 + (SPECIAL_LABEL_SCALE - 1) * ease;
        angle = fx.rotation * (1 - ease);
      } else if (elapsed < flipEnd) {
        const t = Math.min(1, (elapsed - moveEnd) / REVERSE_FLIP_MS);
        // The first number turns edge-on; the reversed digits turn back
        // from edge-on to face the player, avoiding mirrored text.
        const half = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const eased = half * half * (3 - 2 * half);
        const tilt = t < 0.5 ? 90 * eased : -90 * (1 - eased);
        fx.el.textContent = t < 0.5 ? "37" : "73";
        fx.el.style.transform = "translate(" + x + "px, " + y +
          "px) translate(-50%, -50%) rotateY(" + tilt +
          "deg) scale(" + scale + ")";
        continue;
      } else if (elapsed < greenEnd) {
        fx.el.textContent = "73";
        fx.el.classList.add("reverse-green");
        const t = elapsed < holdEnd ? 0 : (elapsed - holdEnd) / REVERSE_GREEN_MS;
        scale = SPECIAL_LABEL_SCALE - (SPECIAL_LABEL_SCALE - 1.05) * Math.min(1, t);
      } else {
        fx.el.remove();
        reversing37.splice(i, 1);
        // Do not spawn a new 73 floater: that would invoke another jackpot.
        // Move the green 73 directly into the shared score-transfer pipeline.
        startScoreFly(fx.value, REVERSE_CENTER_X, REVERSE_CENTER_Y);
        continue;
      }
      fx.el.style.transform = "translate(" + x + "px, " + y +
        "px) translate(-50%, -50%) rotate(" + angle + "deg) scale(" + scale + ")";
    }
  }

  function clear37Reversals() {
    for (let i = 0; i < reversing37.length; i++) reversing37[i].el.remove();
    reversing37.length = 0;
  }

  // Twenty-one full-size "1"s blast outward, bounce off stage walls,
  // turn to "2"s while moving, and join into one 42-point score pickup.
  function begin21To42(f) {
    if (!f || !f.alive) return;
    f.alive = false;
    f.el.remove();
    const parts = [];
    const ox = Math.max(COMBO42_EDGE, Math.min(STAGE - COMBO42_EDGE, f.x));
    const oy = Math.max(COMBO42_EDGE, Math.min(STAGE - COMBO42_EDGE, f.y));
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < 21; i++) {
      const angle = offset + i * Math.PI * 2 / 21;
      const speed = 780 + Math.random() * 400;
      const el = document.createElement("div");
      el.className = "combo-unit";
      el.textContent = "1";
      el.style.fontSize = floaterFontSize(1) + "px";
      stageEl.appendChild(el);
      const part = {
        el: el, x: ox, y: oy, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed, converted: false, bounces: 0,
        homeX: null, homeY: null,
        convertAt: COMBO42_CHANGE_START_MS + ((i * 13) % 21) * 11,
      };
      parts.push(part);
      placeComboUnit(part, ox, oy, 1, 1);
    }
    const label = document.createElement("div");
    label.className = "floater reverse-37 combo-42";
    label.textContent = "42";
    label.style.fontSize = "30px";
    label.style.opacity = "0";
    stageEl.appendChild(label);
    fusing42.push({
      start: performance.now(), lastUpdate: performance.now(),
      parts: parts, label: label, value: 42, resultBellPlayed: false,
    });
  }

  function placeComboUnit(part, x, y, scale, opacity) {
    part.el.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    part.el.style.transform = "translate(" + x + "px, " + y +
      "px) translate(-50%, -50%) scale(" + scale + ")";
  }

  function bounceComboUnit(part, dt) {
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    const lo = COMBO42_EDGE, hi = STAGE - COMBO42_EDGE;
    if (part.x < lo) {
      part.x = lo + lo - part.x;
      part.vx = Math.abs(part.vx) * 0.9;
      part.bounces++;
    } else if (part.x > hi) {
      part.x = hi + hi - part.x;
      part.vx = -Math.abs(part.vx) * 0.9;
      part.bounces++;
    }
    if (part.y < lo) {
      part.y = lo + lo - part.y;
      part.vy = Math.abs(part.vy) * 0.9;
      part.bounces++;
    } else if (part.y > hi) {
      part.y = hi + hi - part.y;
      part.vy = -Math.abs(part.vy) * 0.9;
      part.bounces++;
    }
  }

  function update21To42(now) {
    for (let i = fusing42.length - 1; i >= 0; i--) {
      const fx = fusing42[i];
      const elapsed = Math.max(0, now - fx.start);
      const bounceEnd = COMBO42_BOUNCE_MS;
      const gatherEnd = bounceEnd + COMBO42_GATHER_MS;
      const holdEnd = gatherEnd + COMBO42_HOLD_MS;
      const greenEnd = holdEnd + COMBO42_GREEN_MS;
      // Sound the second bell when the assembled 42 becomes fully visible.
      if (!fx.resultBellPlayed && elapsed >= gatherEnd) {
        fx.resultBellPlayed = true;
        playSpecialRevealSound();
        grantTimeBonusFly(REVERSE_CENTER_X, REVERSE_CENTER_Y, 42);
      }
      if (elapsed < bounceEnd) {
        let remaining = Math.min(64, Math.max(0, now - fx.lastUpdate));
        fx.lastUpdate = now;
        while (remaining > 0) {
          const step = Math.min(16, remaining);
          for (const part of fx.parts) bounceComboUnit(part, step / 1000);
          remaining -= step;
        }
        for (const part of fx.parts) {
          if (!part.converted && elapsed >= part.convertAt) {
            part.converted = true;
            part.el.textContent = "2";
            part.el.style.fontSize = floaterFontSize(2) + "px";
            part.el.classList.add("converted");
          }
          const pop = part.converted && elapsed - part.convertAt < 110;
          placeComboUnit(part, part.x, part.y, pop ? 1.15 : 1, 1);
        }
      } else if (elapsed < gatherEnd) {
        const t = Math.min(1, (elapsed - bounceEnd) / COMBO42_GATHER_MS);
        const eased = t * t * (3 - 2 * t);
        for (const part of fx.parts) {
          if (part.homeX === null) {
            part.homeX = part.x; part.homeY = part.y;
          }
          const x = part.homeX + (REVERSE_CENTER_X - part.homeX) * eased;
          const y = part.homeY + (REVERSE_CENTER_Y - part.homeY) * eased;
          placeComboUnit(part, x, y, Math.max(0.06, 1 - 0.94 * eased),
            Math.max(0, 1 - Math.max(0, (t - 0.74) / 0.26)));
        }
        const show = Math.max(0, Math.min(1, (t - 0.72) / 0.28));
        fx.label.style.opacity = String(show);
        fx.label.style.transform = "translate(" + REVERSE_CENTER_X +
          "px, " + REVERSE_CENTER_Y +
          "px) translate(-50%, -50%) scale(" +
          (SPECIAL_LABEL_SCALE * (0.88 + show * 0.12)) + ")";
      } else if (elapsed < greenEnd) {
        if (fx.parts.length) {
          for (const part of fx.parts) part.el.remove();
          fx.parts.length = 0;
        }
        fx.label.style.opacity = "1";
        const green = elapsed >= holdEnd;
        if (green) fx.label.classList.add("reverse-green");
        const t = green ? Math.min(1, (elapsed - holdEnd) / COMBO42_GREEN_MS) : 0;
        const scale = SPECIAL_LABEL_SCALE - (SPECIAL_LABEL_SCALE - 1.05) * t;
        fx.label.style.transform = "translate(" + REVERSE_CENTER_X +
          "px, " + REVERSE_CENTER_Y +
          "px) translate(-50%, -50%) scale(" + scale + ")";
      } else {
        for (const part of fx.parts) part.el.remove();
        fx.label.remove();
        fusing42.splice(i, 1);
        startScoreFly(fx.value, REVERSE_CENTER_X, REVERSE_CENTER_Y);
      }
    }
  }

  function clear21To42() {
    for (const fx of fusing42) {
      for (const part of fx.parts) part.el.remove();
      fx.label.remove();
    }
    fusing42.length = 0;
  }

  function explodeJackpot(f) {
    const total = f.value;
    const bonus = total * 2;
    const cx = f.x;
    const cy = f.y;
    f.alive = false;
    f.el.remove();

    // Credit both the pending base and the 2x jackpot only after
    // the inert jackpot display finishes and fuses into the score.
    spawnFloater((f.pendingValue || 0) + bonus, {
      x: cx, y: cy,
      vx: rand(-30, 30), vy: rand(-30, 30),
      scale: 1.75, life: 950 + rand(0, 200),
      g: pickGravity(), inert: true,
    });
    const shards = Math.min(total, 28);
    for (let i = 0; i < shards; i++) {
      const ang = (Math.PI * 2 * i) / shards + rand(-0.2, 0.2);
      const spd = rand(180, 420);
      spawnFloater(1, {
        x: cx + Math.cos(ang) * rand(4, 18),
        y: cy + Math.sin(ang) * rand(4, 18),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        scale: rand(0.85, 1.15),
        visualOnly: true,
        life: FLOAT_LIFE + rand(-200, 600),
        g: pickGravity(),
      });
    }
  }

  function renderScoreBank() {
    scoreBufferEl.textContent = "+" + scoreBank;
    scoreBufferEl.classList.toggle("is-visible", scoreBank > 0);
  }

  function toScoreLayerPoint(screenX, screenY) {
    if (scoreFlyLayer &&
        typeof scoreFlyLayer.getBoundingClientRect === "function") {
      const rect = scoreFlyLayer.getBoundingClientRect();
      if (rect.width > 0) {
        const scale = (scoreFlyLayer.clientWidth || 470) / rect.width;
        return {
          x: (screenX - rect.left) * scale,
          y: (screenY - rect.top) * scale,
        };
      }
    }
    return { x: screenX, y: screenY };
  }

  function scoreBankTarget() {
    if (scoreBufferEl &&
        typeof scoreBufferEl.getBoundingClientRect === "function") {
      const rect = scoreBufferEl.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        return toScoreLayerPoint(rect.left + rect.width / 2,
          rect.top + rect.height / 2);
      }
    }
    return { x: 170, y: 58 };
  }

  function scoreFlyOrigin(fromX, fromY) {
    if (stageEl && typeof stageEl.getBoundingClientRect === "function") {
      const rect = stageEl.getBoundingClientRect();
      if (rect.width > 0) {
        return toScoreLayerPoint(rect.left + fromX * rect.width / STAGE,
          rect.top + fromY * rect.height / STAGE);
      }
    }
    return { x: fromX + 10, y: fromY + 10 };
  }

  function startScoreFly(amount, fromX, fromY) {
    if (amount <= 0) return;
    const el = document.createElement("div");
    el.className = "score-fly";
    el.textContent = "+" + amount;
    scoreFlyLayer.appendChild(el);
    const origin = scoreFlyOrigin(fromX, fromY);
    const fly = {
      el: el, value: amount, age: 0,
      x0: origin.x, y0: origin.y, x: origin.x, y: origin.y,
    };
    scoreFlies.push(fly);
    paintScoreFly(fly, 1, 1);
  }

  function paintScoreFly(fly, opacity, scale) {
    fly.el.style.opacity = String(Math.max(0, opacity));
    fly.el.style.transform = "translate(" + fly.x + "px, " + fly.y + "px) " +
      "translate(-50%, -50%) scale(" + scale + ")";
  }

  function depositScore(amount) {
    if (amount <= 0) return;
    const wasEmpty = scoreBank === 0;
    scoreBank += amount;
    // New deposits replenish an active bank; do not restart its countdown.
    if (wasEmpty) {
      scoreBankHoldRemaining = SCORE_HOLD_MS;
      scoreBankFraction = 0;
    }
    renderScoreBank();
  }

  function updateScoreBank(dt) {
    if (scoreBank <= 0) return;
    if (scoreBankHoldRemaining > 0) {
      scoreBankHoldRemaining = Math.max(0, scoreBankHoldRemaining - dt);
      return;
    }
    // Readable when small, fast enough to settle a larger accumulated bank.
    const rate = Math.max(SCORE_FEED_MIN_PER_SECOND,
      Math.min(SCORE_FEED_MAX_PER_SECOND, scoreBank * 1.5));
    scoreBankFraction += (dt / 1000) * rate;
    const amount = Math.min(scoreBank, Math.floor(scoreBankFraction));
    if (amount <= 0) return;
    scoreBankFraction -= amount;
    scoreBank -= amount;
    setScore(score + amount, false);
    renderScoreBank();
    if (scoreBank === 0) {
      scoreBankFraction = 0;
      pushPresence();
    }
  }

  function updateScoreFlies(dt) {
    for (let i = scoreFlies.length - 1; i >= 0; i--) {
      const fly = scoreFlies[i];
      fly.age += dt;
      const t = Math.min(1, fly.age / SCORE_FLY_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const target = scoreBankTarget();
      fly.x = fly.x0 + (target.x - fly.x0) * eased;
      fly.y = fly.y0 + (target.y - fly.y0) * eased;
      paintScoreFly(fly, 1, 1.15 - 0.15 * eased);
      if (t >= 1) {
        depositScore(fly.value);
        fly.el.remove();
        scoreFlies.splice(i, 1);
      }
    }
    updateScoreBank(dt);
  }

  function clearScoreFlies() {
    for (let i = 0; i < scoreFlies.length; i++) scoreFlies[i].el.remove();
    scoreFlies.length = 0;
    scoreBank = 0;
    scoreBankHoldRemaining = 0;
    scoreBankFraction = 0;
    renderScoreBank();
  }

  function hasPendingScore() {
    return reversing37.length > 0 || fusing42.length > 0 ||
      scoreBank > 0 || scoreFlies.length > 0 ||
      floaters.some(function (f) { return f.alive && f.pendingValue > 0; });
  }

  function timeBankTarget() {
    if (timeBufferEl && typeof timeBufferEl.getBoundingClientRect === "function") {
      const rect = timeBufferEl.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        return toScoreLayerPoint(rect.left + rect.width / 2,
          rect.top + rect.height / 2);
      }
    }
    return { x: 412, y: 58 };
  }

  function renderTimeBank() {
    timeBufferEl.textContent = "+" + timeBankSeconds + "s";
    timeBufferEl.classList.toggle("is-visible", timeBankSeconds > 0);
  }

  function depositTimeBonus(seconds) {
    if (seconds <= 0) return;
    const wasEmpty = timeBankSeconds === 0;
    timeBankSeconds += seconds;
    if (wasEmpty) {
      timeBankHoldRemaining = TIME_HOLD_MS;
      timeBankFraction = 0;
    }
    renderTimeBank();
  }

  function grantTimeBonusFly(fromX, fromY, value) {
    const seconds = TIME_BONUS_SECONDS[value] || 0;
    if (!started || gameOver || seconds <= 0) return;
    const el = document.createElement("div");
    el.className = "time-fly";
    el.textContent = "+" + seconds + "s";
    // Use the frame-level foreground HUD pickup layer, not the clipped stage.
    scoreFlyLayer.appendChild(el);
    const origin = scoreFlyOrigin(fromX, fromY);
    timeFlies.push({
      el: el,
      seconds: seconds,
      x0: origin.x,
      y0: origin.y,
      x: origin.x,
      y: origin.y,
      age: 0,
    });
    paintTimeFly(timeFlies[timeFlies.length - 1], 1, 1.15);
  }

  function paintTimeFly(fly, opacity, scale) {
    fly.el.style.opacity = String(Math.max(0, opacity));
    fly.el.style.transform = "translate(" + fly.x + "px, " + fly.y +
      "px) translate(-50%, -50%) scale(" + scale + ")";
  }

  function applyDeadlineBonus(seconds) {
    if (gameOver || !started || seconds <= 0) return;
    deadline += seconds * 1000;
    updateTimeHud();
    timeFlashUntil = performance.now() + 480;
    timeEl.classList.add("time-bonus");
  }

  function updateTimeBank(dt) {
    if (timeBankSeconds <= 0) return;
    if (timeBankHoldRemaining > 0) {
      timeBankHoldRemaining = Math.max(0, timeBankHoldRemaining - dt);
      return;
    }
    // Integer seconds visibly move from the golden balance into the timer.
    timeBankFraction += dt / 1000 * TIME_FEED_SECONDS_PER_SECOND;
    const amount = Math.min(timeBankSeconds, Math.floor(timeBankFraction));
    if (amount <= 0) return;
    timeBankFraction -= amount;
    timeBankSeconds -= amount;
    applyDeadlineBonus(amount);
    renderTimeBank();
    if (timeBankSeconds === 0) timeBankFraction = 0;
  }

  function updateTimeFlies(dt) {
    const now = performance.now();
    if (timeFlashUntil && now >= timeFlashUntil) {
      timeEl.classList.remove("time-bonus");
      timeFlashUntil = 0;
    }

    for (let i = timeFlies.length - 1; i >= 0; i--) {
      const fly = timeFlies[i];
      fly.age += dt;
      const t = Math.min(1, fly.age / TIME_FLY_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const target = timeBankTarget();
      fly.x = fly.x0 + (target.x - fly.x0) * eased;
      fly.y = fly.y0 + (target.y - fly.y0) * eased;
      paintTimeFly(fly, 1, 1.15 - 0.15 * eased);
      if (t >= 1) {
        // Bonus pickups of differing amounts join the existing balance.
        depositTimeBonus(fly.seconds);
        fly.el.remove();
        timeFlies.splice(i, 1);
      }
    }
    updateTimeBank(dt);
  }

  function clearTimeFlies() {
    for (const fly of timeFlies) fly.el.remove();
    timeFlies.length = 0;
    timeBankSeconds = 0;
    timeBankHoldRemaining = 0;
    timeBankFraction = 0;
    renderTimeBank();
    timeEl.classList.remove("time-bonus");
    timeFlashUntil = 0;
  }

  function afterFloaterValue(f) {
    if (!f || !f.alive) return;
    const v = f.value;
    const fx = f.x;
    const fy = f.y;
    applyLinger(f);
    if (TIME_BONUS_AT[v]) {
      grantTimeBonusFly(fx, fy, v);
    }
    // Each time an eligible sum is reached, play one randomly chosen bell.
    // A 7 -> 14 -> 21 progression therefore rings at every milestone.
    ringJackpotBell(v);
    if (v === 21) {
      begin21To42(f);
      return;
    }
    if (v === 37) {
      begin37Reverse(f);
      return;
    }
    if (JACKPOT_AT[v]) {
      explodeJackpot(f);
      return;
    }
  }

  function seekOnesToTwenties(sec) {
    for (let i = 0; i < floaters.length; i++) {
      const one = floaters[i];
      if (!one.alive || one.inert || one.value !== 1) continue;

      let best = null;
      let bestD2 = SEEK_ONE_TO_TWENTY * SEEK_ONE_TO_TWENTY;
      for (let j = 0; j < floaters.length; j++) {
        const twenty = floaters[j];
        if (!twenty.alive || twenty.inert || twenty.value !== 20) continue;
        const dx = twenty.x - one.x;
        const dy = twenty.y - one.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = twenty;
        }
      }
      if (!best) continue;

      const dist = Math.sqrt(bestD2) || 1;
      // Stronger pull the closer they are (still before merge contact).
      const strength = SEEK_ACCEL * (0.45 + 0.55 * (1 - dist / SEEK_ONE_TO_TWENTY));
      one.vx += ((best.x - one.x) / dist) * strength * sec;
      one.vy += ((best.y - one.y) / dist) * strength * sec;
      // Tiny assist on the twenty so they meet in the middle.
      best.vx += ((one.x - best.x) / dist) * strength * 0.18 * sec;
      best.vy += ((one.y - best.y) / dist) * strength * 0.18 * sec;
    }
  }

  function bounceAxis(vel, intoPositive) {
    // Soft land: reverse if moving into the surface, then damp.
    if (intoPositive) {
      if (vel > 0) vel = -vel * FLOAT_REST;
      else vel *= 0.85;
    } else {
      if (vel < 0) vel = -vel * FLOAT_REST;
      else vel *= 0.85;
    }
    return vel;
  }

  function resolveAabb(f, bounds, box) {
    const hx = bounds.hx, hy = bounds.hy;
    const fl = f.x - hx, fr = f.x + hx;
    const ft = f.y - hy, fb = f.y + hy;
    if (fr <= box.l || fl >= box.r || fb <= box.t || ft >= box.b) return;

    const penL = fr - box.l;
    const penR = box.r - fl;
    const penT = fb - box.t;
    const penB = box.b - ft;
    const minPen = Math.min(penL, penR, penT, penB);
    if (minPen === penL) {
      f.x = box.l - hx;
      f.vx = bounceAxis(f.vx, true);
      f.spin *= -0.55;
    } else if (minPen === penR) {
      f.x = box.r + hx;
      f.vx = bounceAxis(f.vx, false);
      f.spin *= -0.55;
    } else if (minPen === penT) {
      f.y = box.t - hy;
      f.vy = bounceAxis(f.vy, true);
      f.spin *= -0.55;
    } else {
      f.y = box.b + hy;
      f.vy = bounceAxis(f.vy, false);
      f.spin *= -0.55;
    }
  }

  function collideFloatersWorld(f) {
    const bounds = floaterBounds(f);
    // HUD collisions use the same full rotated-text extents as the walls.
    for (let i = 0; i < HUD_BOXES.length; i++) {
      resolveAabb(f, bounds, HUD_BOXES[i]);
    }

    // Re-clamp AFTER HUD contacts: HUD collision correction must never
    // push even the last digit outside the clipped game field.
    const minX = FLOAT_EDGE + bounds.hx;
    const maxX = STAGE - FLOAT_EDGE - bounds.hx;
    const minY = FLOAT_EDGE + bounds.hy;
    const maxY = STAGE - FLOAT_EDGE - bounds.hy;
    if (minX >= maxX) f.x = STAGE / 2;
    else if (f.x < minX) {
      f.x = minX;
      f.vx = bounceAxis(f.vx, false);
      f.spin *= -0.5;
    } else if (f.x > maxX) {
      f.x = maxX;
      f.vx = bounceAxis(f.vx, true);
      f.spin *= -0.5;
    }
    if (minY >= maxY) f.y = STAGE / 2;
    else if (f.y < minY) {
      f.y = minY;
      f.vy = bounceAxis(f.vy, false);
      f.spin *= -0.5;
    } else if (f.y > maxY) {
      f.y = maxY;
      f.vy = bounceAxis(f.vy, true);
      f.spin *= -0.5;
    }
  }

  function paintFloater(f, opacity) {
    f.el.style.opacity = String(opacity);
    f.el.style.transform =
      "translate(" +
      f.x +
      "px, " +
      f.y +
      "px) translate(-50%, -50%) rotate(" +
      f.rot +
      "deg) scale(" +
      f.scale +
      ")";
  }

  function clearFloaters() {
    clear37Reversals();
    clear21To42();
    for (let i = 0; i < floaters.length; i++) {
      floaters[i].el.remove();
    }
    floaters.length = 0;
    clearScoreFlies();
    clearTimeFlies();
    clearPopShards();
  }

  function mergeFloaters(a, b) {
    // Keep a, absorb b. Gravity stays with the survivor so clusters keep a direction.
    a.pendingValue += b.pendingValue;
    a.value += b.value;
    a.x = (a.x + b.x) / 2;
    a.y = (a.y + b.y) / 2;
    a.vx = (a.vx + b.vx) / 2 - a.gx * 55;
    a.vy = (a.vy + b.vy) / 2 - a.gy * 55;
    a.spin = (a.spin + b.spin) / 2;
    a.scale = Math.min(1.55, 1 + Math.log2(a.value + 1) * 0.075);
    a.mergeReadyAt = performance.now() + MERGE_RECOVERY_BASE_MS +
      Math.min(460, Math.log2(a.value + 1) * MERGE_RECOVERY_PER_LOG_MS);
    a.age = Math.min(a.age, b.age) * 0.45;
    a.life = Math.max(a.life, b.life) + 280;
    a.el.textContent = floaterLabel(a.value);
    a.el.style.fontSize = floaterFontSize(a.value) + "px";
    a.el.classList.toggle("big", a.value >= 5);
    // Golden glow only for currently eligible totals.
    a.el.classList.toggle("bonus-eligible", !!TIME_BONUS_AT[a.value]);
    a.el.classList.remove("score-ready");
    b.alive = false;
    b.el.remove();
    afterFloaterValue(a);
  }

  function updateFloaters(dt) {
    const sec = dt / 1000;

    seekOnesToTwenties(sec);

    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      if (!f.alive) continue;
      f.age += dt;
      f.vx += f.gx * FLOAT_GRAVITY * sec;
      f.vy += f.gy * FLOAT_GRAVITY * sec;
      // Light air drag on both axes so they settle onto floors / HUD faces.
      f.vx *= 1 - 0.28 * sec;
      f.vy *= 1 - 0.28 * sec;
      f.x += f.vx * sec;
      f.y += f.vy * sec;
      f.rot += f.spin * sec;
      f.spin *= 1 - 0.3 * sec;

      collideFloatersWorld(f);

      const t = f.age / f.life;
      if (t >= 1) {
        f.alive = false;
        if (f.pendingValue > 0) startScoreFly(f.pendingValue, f.x, f.y);
        f.el.remove();
        continue;
      }
      if (t >= 0.90 && f.pendingValue > 0) f.el.classList.add("score-ready");
      paintFloater(f, 1);
    }

    updateTimeFlies(dt);

    // Combine nearby floaters gradually: a newly merged total cannot
    // immediately swallow several neighbors in the same frame.
    const mergeNow = performance.now();
    for (let i = 0; i < floaters.length; i++) {
      const a = floaters[i];
      if (!a.alive || a.inert || mergeNow < a.mergeReadyAt) continue;
      for (let j = i + 1; j < floaters.length; j++) {
        const b = floaters[j];
        if (!b.alive || b.inert || mergeNow < b.mergeReadyAt) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < MERGE_DIST * MERGE_DIST) {
          mergeFloaters(a, b);
          break; // respect the freshly applied recovery interval
        }
      }
    }

    // Compact dead slots occasionally.
    for (let i = floaters.length - 1; i >= 0; i--) {
      if (!floaters[i].alive) floaters.splice(i, 1);
    }
  }

  function addPoints(amount) {
    // Taps create pending floating points; only a completed fusion pays them.
    spawnFloater(amount);
  }

  function safeScoreNumber(value) {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  function formatSessionTime(durationMs) {
    const totalSeconds = Math.round(safeScoreNumber(durationMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function normalizeScores(list) {
    return (list || [])
      .filter(function (e) {
        return e && typeof e.name === "string" && typeof e.score === "number" &&
          Number.isFinite(e.score);
      })
      .map(function (e) {
        return {
          name: String(e.name).trim().slice(0, MAX_NAME) || "Player",
          score: Math.max(0, Math.floor(e.score)),
          reactionMs: Number.isFinite(e.reactionMs) ? safeScoreNumber(e.reactionMs) : null,
          apm: Number.isFinite(e.apm) ? safeScoreNumber(e.apm) : null,
          durationMs: Number.isFinite(e.durationMs) ? safeScoreNumber(e.durationMs) : null,
          trapsEnabled: e.trapsEnabled === true,
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, MAX_SCORES);
  }

  function syncScorePreview() {
    // The host API is the only source. No private guest scoreboard.
    // The lower preview is also the welcome-screen leaderboard. On desktops
    // it stays in the right-hand column, including at Game Over.
    document.body.classList.toggle("game-over", gameOver || trapEnding);
    previewEl.classList.toggle("is-hidden", !lastHostScores.length);
  }

  function appendTrapBadge(parent) {
    const icon = document.createElement("img");
    icon.className = "trap-score-icon";
    icon.src = RED_BUTTON_IMAGE;
    icon.alt = "Traps mode";
    icon.title = "Score earned with Traps enabled";
    parent.appendChild(icon);
  }

  function renderScorePreview(scores) {
    lastHostScores = scores;
    const list = document.createElement("ol");
    for (let i = 0; i < Math.min(5, scores.length); i++) {
      const record = scores[i];
      const row = document.createElement("li");
      const name = document.createElement("span");
      name.className = "preview-name";
      name.textContent = (i + 1) + ". " + record.name;
      if (record.trapsEnabled) appendTrapBadge(name);
      const points = document.createElement("span");
      points.className = "preview-points";
      points.textContent = record.score + " pts";
      row.append(name, points);
      list.appendChild(row);
    }
    previewListEl.replaceChildren(...list.children);
    syncScorePreview();
  }

  function renderLeaderboard(list) {
    // Host is the sole owner of submitted high scores and final statistics.
    const scores = normalizeScores(list);
    renderScorePreview(scores);
    if (!scores.length) {
      leaderboardBody.className = "empty";
      leaderboardBody.textContent = "No scores yet";
      return;
    }
    leaderboardBody.className = "";
    const ol = document.createElement("ol");
    for (let i = 0; i < scores.length; i++) {
      const li = document.createElement("li");
      const e = scores[i];
      const heading = document.createElement("div");
      heading.className = "score-entry-heading";
      heading.textContent = e.name;
      if (e.trapsEnabled) appendTrapBadge(heading);
      heading.appendChild(document.createTextNode(" — " + e.score + " pts"));
      const detail = document.createElement("div");
      detail.className = "score-entry-details";
      detail.textContent = "Reaction " + (e.reactionMs ? e.reactionMs + " ms" : "—") +
        " · APM " + (e.apm == null ? "—" : e.apm) +
        " · Time " + (e.durationMs == null ? "—" : formatSessionTime(e.durationMs));
      li.appendChild(heading);
      li.appendChild(detail);
      ol.appendChild(li);
    }
    leaderboardBody.replaceChildren(ol);
  }

  function loadLeaderboard() {
    fetch("api/scores")
      .then(function (res) {
        if (!res.ok) throw new Error("api");
        return res.json();
      })
      .then(function (data) {
        renderLeaderboard(data.scores || data);
      })
      .catch(function () {
        leaderboardBody.className = "empty";
        leaderboardBody.textContent = "Host leaderboard unavailable";
        renderScorePreview([]);
      });
  }

  function submitScore(name) {
    rememberName(name);
    const entry = {
      name: getLiveName() || "Player",
      score: score,
      reactionMs: finalStats ? finalStats.reactionMs : 0,
      apm: finalStats ? finalStats.apm : 0,
      durationMs: finalStats ? finalStats.durationMs : 0,
      trapsEnabled: trapsEnabled,
    };
    scoreStatus.textContent = "Saving…";
    submitScoreBtn.disabled = true;
    pushPresence();

    return fetch("api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("api");
        return res.json();
      })
      .then(function (data) {
        renderLeaderboard(data.scores || data);
        const remote = data.scores || data;
        const nativeSupportsStats = Array.isArray(remote) && remote.some(function (e) {
          return e && Number.isFinite(e.durationMs);
        });
        scoreStatus.textContent = nativeSupportsStats ? "Saved on host!" :
          "Points on host · host update needed for stats";
        // The public server keeps only its best runs and reports the placing.
        if (data && data.maxScores && "rank" in data) {
          scoreStatus.textContent = data.rank ? "Saved — #" + data.rank + " of top " + data.maxScores + "!" :
            "Not in the top " + data.maxScores + " this time";
        }
        scoreForm.hidden = true;
      })
      .catch(function () {
        scoreStatus.textContent = "Could not reach host — try again";
        // Never claim a guest/device saved this score.
        loadLeaderboard();
      })
      .finally(function () {
        submitScoreBtn.disabled = false;
      });
  }

  function triggerTrapLoss(now) {
    // End play and show Game Over at once. Defer score submission only.
    trapEnding = true;
    trapLossAt = now;
    roundExpired = true;
    nextTrapEmissionAt = 0;
    setQuickStrikeActive(false);
    fading = false;
    pendingPopAt = 0;
    clearPopShards();
    feind.classList.add("is-gone");
    endEl.textContent = "Game Over";
    endWrap.classList.add("visible");
    scoreForm.hidden = true;
    playAgainBtn.hidden = true;
    timeEl.textContent = "0";
    syncScorePreview();
    pushPresence();
  }

  function endGame() {
    // Freeze trap-run duration at the fatal tap, not at final score transfer.
    const finishAt = trapLossAt || performance.now();
    const durationMs = started ? Math.max(0, Math.round(finishAt - startTime)) : 0;
    finalStats = {
      reactionMs: reactionSamples ? Math.round(reactionSumMs / reactionSamples) : 0,
      apm: durationMs > 0 ? Math.round(hitCount * 60000 / durationMs) : 0,
      durationMs: durationMs,
    };
    setQuickStrikeActive(false);
    endEl.textContent = "Game Over";
    clearPopShards();
    feind.classList.add("is-gone");
    gameOver = true;
    fading = false;
    trapToggleEl.disabled = false;
    trapOptionEl.classList.remove("is-locked");
    syncScorePreview();
    timeEl.textContent = "0";
    endWrap.classList.add("visible");
    scoreForm.hidden = false;
    scoreStatus.textContent = "";
    playAgainBtn.hidden = false;
    playerNameInput.value = playerNameInput.value || getLiveName();
    loadLeaderboard();
    pushPresence();
  }

  function resetGame() {
    setQuickStrikeActive(false);
    setTrapActive(false);
    trapEnding = false;
    trapLossAt = 0;
    trapsEnabled = false;
    trapToggleEl.disabled = false;
    trapOptionEl.classList.remove("is-locked");
    score = 0;
    finalStats = null;
    started = false;
    deadline = 0;
    startTime = 0;
    gameOver = false;
    roundExpired = false;
    syncScorePreview();
    fading = false;
    flupp = 0;
    alpha = FADE_START_ALPHA;
    rotation = 0;
    punchScale = 1;
    spawnScale = 1;
    spawnAnimUntil = 0;
    shakeX = 0;
    shakeY = 0;
    shakeUntil = 0;
    popping = false;
    popStartedAt = 0;
    popUntil = 0;
    pendingPopAt = 0;
    tapFlashStartedAt = -Infinity;
    quickSpinStartedAt = -Infinity;
    feind.style.filter = "none";
    feind.style.opacity = "1";
    hitCount = 0;
    reactionSumMs = 0;
    reactionSamples = 0;
    reactDisplay = 0;
    reactTarget = 0;
    reactHasValue = false;
    clearFloaters();

    const spawn = randomSpawn();
    x = spawn.x;
    y = spawn.y;
    spawnTime = performance.now();
    rotation = randomSpawnRotation();

    feind.classList.remove("is-gone");
    setFeindVisual(false);
    playSpawnIn();
    setScore(0);
    anleitungEl.textContent = "Smash it!";
    endEl.textContent = "";
    endWrap.classList.remove("visible");
    scoreForm.hidden = true;
    scoreStatus.textContent = "";
    playAgainBtn.hidden = true;
    updateTimeHud();
    updateApm();
    reactEl.textContent = "—";
  }

  (function init() {
    setQuickStrikeActive(false);
    setTrapActive(false);
    trapToggleEl.disabled = false;
    trapOptionEl.classList.remove("is-locked");
    try {
      const saved = localStorage.getItem(LOCAL_NAME_KEY);
      if (saved && playerNameInput) playerNameInput.value = saved;
    } catch (e) {}
    const spawn = randomSpawn();
    x = spawn.x;
    y = spawn.y;
    rotation = randomSpawnRotation();
    setFeindVisual(false);
    playSpawnIn();
    setScore(0);
    updateTimeHud();
    updateApm();
    reactEl.textContent = "—";
    playAgainBtn.hidden = true;
    scoreForm.hidden = true;
    endWrap.classList.remove("visible");
    spawnTime = performance.now();
    pushPresence();
    setInterval(pushPresence, 900);
    // Keep the lightweight preview current as guests finish rounds.
    loadLeaderboard();
    // Game Over is a shared live leaderboard too: guest submissions may arrive
    // after this player's round has ended, without the host submitting again.
    setInterval(function () { if (gameOver) loadLeaderboard(); }, 3000);
    setInterval(function () { if (started && !gameOver) loadLeaderboard(); }, 12000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && gameOver) loadLeaderboard();
    });
  })();

  function onClick() {
    if (gameOver || roundExpired || trapEnding) return;
    // Even during breakup, red is fatal, not an ordinary scoreable hit.
    if (trapActive) {
      triggerTrapLoss(performance.now());
      return;
    }

    ensureAudio();
    const now = performance.now();
    registerHit();
    tapFlashStartedAt = now;
    applyFeindTransform();

    if (popping) {
      playTapImpact();
      addPoints(tapPoints());
      return;
    }

    if (fading) {
      playTapImpact();
      addPoints(tapPoints());
      return;
    }

    // Ignore the initial page-load button in the Reaction average. Its
    // first tap starts a round, regardless of how long the screen was open.
    const alreadyStarted = started;
    if (!started) startGame(now);

    const isFirstTapOnButton = spawnTime != null;
    if (isFirstTapOnButton) {
      // Reaction starts when the spawn animation finishes, not when it begins.
      // Ignore taps before that moment rather than recording artificial 0ms.
      if (alreadyStarted && now >= spawnAnimUntil) {
        const reactionMs = now - spawnAnimUntil;
        reactionSumMs += reactionMs;
        reactionSamples += 1;
        syncReactTarget();
        if (!reactDisplay) reactDisplay = reactTarget;
      }
      spawnTime = null;
    }

    // Quick Strike still qualifies on the first tap in the same 73ms window,
    // even for the initial button excluded from Reaction statistics.
    if (isFirstTapOnButton && now >= spawnAnimUntil &&
        now <= spawnAnimUntil + QUICK_STRIKE_WINDOW_MS) {
      setQuickStrikeActive(true);
      quickSpinStartedAt = now;
      triggerQuickFx();
    }

    // Pick the sound AFTER checking the trigger so the activating tap also
    // uses a QuickStrikepoints recording, not an ordinary impact.
    playTapImpact();
    flupp = randomint(1, 22);
    // No passive time extension from tapping or spawning buttons.

    setFeindVisual(true);
    addPoints(tapPoints());
    fading = true;
    updateTimeHud();
    applyFeindTransform();
  }

  feind.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    onClick();
  });

  feind.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  });

  playAgainBtn.addEventListener("click", function () {
    resetGame();
  });

  scoreForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!gameOver) return;
    submitScore(playerNameInput.value);
  });

  function fitToPhone() {
    const scaler = document.getElementById("scaler");
    const frame = document.getElementById("frame");
    if (!scaler || !frame) return;
    const frameW = frame.offsetWidth || 470;
    const avail = scaler.clientWidth;
    const scale = Math.min(1, avail / frameW);
    frame.style.transform = "scale(" + scale + ")";
    scaler.style.height = frame.offsetHeight * scale + "px";
  }

  window.addEventListener("resize", fitToPhone);
  window.addEventListener("orientationchange", fitToPhone);
  fitToPhone();

  function feindEnterFrame() {
    if (trapEnding) return;
    if (popping) {
      if (performance.now() >= popUntil) {
        respawnTarget();
        return;
      }
      applyFeindTransform();
      return;
    }
    if (!fading) return;
    // Let an untouched trap finish its 320ms spawn-in before its lifetime ticks.
    if (trapActive && performance.now() < spawnAnimUntil) return;
    // Hold the button intact for another 160ms, then break it faster.
    // Taps during this brief hold still count (including Quick Strike).
    if (pendingPopAt) {
      if (performance.now() >= pendingPopAt) beginPopPhase();
      else applyFeindTransform();
      return;
    }
    alpha -= flupp;
    if (alpha <= FADE_END_ALPHA) {
      pendingPopAt = performance.now() + POP_DELAY_MS;
      return;
    }
    applyFeindTransform();
  }

  function rootEnterFrame() {
    if (gameOver) return;
    if (trapEnding) {
      timeEl.textContent = "0";
      if (!hasPendingScore()) endGame();
      return;
    }

    updateApm();

    if (!started) {
      updateTimeHud();
      return;
    }

    updateTimeHud();
    // Finish all time bonus and outstanding earned score transfers before Game Over.
    if (remainingSeconds() > 0) {
      roundExpired = false; // A pending combination may have restored time.
    } else if (timeFlies.length === 0 && timeBankSeconds === 0) {
      roundExpired = true;
    }
    if (roundExpired && !hasPendingScore()) endGame();
  }

  function tick(ts) {
    const dt = ts - lastTs;
    lastTs = ts;
    frameAcc += dt;

    updateFx(ts);
    tweenReactDisplay(dt);
    emitTrapPoints(ts);
    updateFloaters(dt);
    update37Reversals(ts);
    update21To42(ts);
    updateScoreFlies(dt);
    updatePopShards(ts);
    if (
      shakeX ||
      shakeY ||
      punchScale !== 1 ||
      spawnScale !== 1 ||
      ts < spawnAnimUntil ||
      popping ||
      ts - tapFlashStartedAt < TAP_PULSE_MS ||
      ts - quickSpinStartedAt < QUICK_SPIN_MS
    ) {
      applyFeindTransform();
    }

    while (frameAcc >= FRAME_MS) {
      frameAcc -= FRAME_MS;
      feindEnterFrame();
      rootEnterFrame();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
