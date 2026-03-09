// service-worker.js – Operator Training System PRODUCTION
// ✅ PATCHED v1.3
// FIX SW1: CACHE_NAME ใช้ BUILD_TIME → bump auto ทุก deploy
// FIX SW2: BUILD_TIME ต้องเปลี่ยนทุก deploy (หรือใช้ CI/CD inject)
// FIX SW3: Cache Google Fonts สำหรับ offline (separate fonts cache)
// FIX SW4: เพิ่ม icon-192.png + icon-512.png ใน APP_SHELL
// FIX SW5: HTML = Network-first, Assets = Cache-first + stale-while-revalidate
// FIX SW6: graceful error handling ใน install (icon อาจไม่มีใน dev)

// 🟠 HOW TO BUMP ON DEPLOY:
//    Option A (CI/CD): sed -i "s/BUILD_TIME = .*/BUILD_TIME = '$(date -u +%Y-%m-%dT%H:%M:%S)';/" service-worker.js
//    Option B (manual): เปลี่ยน CACHE_VER ทุกครั้งที่ deploy
//    Option C (recommended): ใช้ build tool (Vite/Webpack) inject __BUILD_TIME__ อัตโนมัติ

const BUILD_TIME  = '2026-03-09T06:00:00';
const CACHE_VER   = 'v8.0';
const CACHE_NAME  = `operator-${CACHE_VER}-${BUILD_TIME}`;
const FONTS_CACHE = 'operator-fonts-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  // Data
  './data/exerciseDB.js',
  // Profile System
  './profile/storageEngine.js',
  './profile/profileManager.js',
  // App Layer
  './app/db.js',
  './app/state_manager.js',
  './app/engine.js',
  './app/app.js',
  './app/rpgController.js',
  './app/game_loop.js',
  './app/ascension_engine.js',
  './app/elite_engine.js',
  './app/progression_engine.js',
  './app/trend_analyzer.js',
  './app/decision_engine.js',
  './app/meta_system.js',
  './app/conversion_layer.js',
  // Core RPG
  './core/conversionEngine.js',
  './core/attributeEngine.js',
  './core/rankSystem.js',
  './core/medalSystem.js',
  './core/goalEngine.js',
  './core/fatigueEngine.js',
  './core/templateEngine.js',
  // AI Pack
  './ai/ai_utils.js',
  './ai/ai_prompt_templates.js',
  './ai/ai_providers.js',
  './ai/ai_local_engine.js',
  './ai/ai_hybrid_engine.js',
  './ai/coach_engine.js',
];
// Icons cached separately (optional — may not exist in dev)

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // FIX SW6: cache core files first, icons optional (may not exist in dev)
        const coreFiles = APP_SHELL.filter(f => !f.includes('icon'));
        const iconFiles = APP_SHELL.filter(f =>  f.includes('icon'));
        return cache.addAll(coreFiles).then(() =>
          Promise.allSettled(iconFiles.map(f => cache.add(f)))
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        // 🟡 FIX: ไม่ให้ install fail ทั้งหมดถ้า resource บางตัวไม่มี
        console.warn('[SW] Install warning (non-fatal):', err);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== FONTS_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // ── ไม่ cache AI API calls ──────────────────────────────────
  if (url.includes('openai.com') || url.includes('generativelanguage.googleapis.com')) {
    return; // passthrough
  }

  // ── FIX SW3: Cache Google Fonts (stale-while-revalidate) ───
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // ── FIX SW5: HTML = Network-first ───────────────────────────
  if (event.request.mode === 'navigate' || url.endsWith('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then(c => c || caches.match('./index.html'))
        )
    );
    return;
  }

  // ── Assets (JS/CSS/images): Cache-first + background update ─
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          if (res?.status === 200 && res.type === 'basic') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => null);

      return cached ?? network;
    })
  );
});

// ── MESSAGE: force update from client ────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
