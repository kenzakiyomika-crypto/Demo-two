# OPERATOR RPG — v2 Architecture Blueprint

## โครงสร้างไฟล์

```
Operator_RPG_v2/
│
├── index.html              ← Entry point + Onboarding 3-Step
├── style.css               ← All styles (รวมไว้ที่เดียว)
├── manifest.json           ← PWA manifest
├── service-worker.js       ← Offline cache
│
├── /core                   ← RPG Engine Layer (ไม่มี UI)
│   ├── conversionEngine.js ← Physical → RPG Stats
│   ├── attributeEngine.js  ← Stat Storage + Level System
│   ├── rankSystem.js       ← Military Rank + SF Tiers
│   ├── medalSystem.js      ← Achievements + Badges
│   ├── goalEngine.js       ← ✨ NEW: Goal Config + Training Template
│   └── fatigueEngine.js    ← ✨ NEW: Fatigue + Deload Advisory
│
├── /app                    ← Application Logic Layer
│   ├── db.js               ← IndexedDB + localStorage hybrid
│   ├── state_manager.js    ← Single source of truth (SM)
│   ├── engine.js           ← Production engine (central store)
│   ├── ascension_engine.js ← Ascension system
│   ├── elite_engine.js     ← Elite tier mechanics
│   ├── progression_engine.js ← Progressive overload tracking
│   ├── trend_analyzer.js   ← Weekly trend analysis
│   ├── decision_engine.js  ← Adaptive workout decisions
│   ├── conversion_layer.js ← Fitness→Game bridge
│   ├── meta_system.js      ← Skill tree + Character sheet
│   ├── game_loop.js        ← Session report + risk/reward
│   └── rpgController.js    ← RPG UI controller
│
├── /ai                     ← AI System Layer
│   ├── ai_utils.js         ← Shared utilities
│   ├── ai_prompt_templates.js ← Prompt library
│   ├── ai_providers.js     ← OpenAI / Gemini adapter
│   ├── ai_local_engine.js  ← Local fallback engine
│   ├── ai_hybrid_engine.js ← Hybrid AI orchestrator
│   └── coach_engine.js     ← AI Coach chatbot
│
├── /data                   ← Static Data
│   └── exerciseDB.js       ← Exercise database
│
└── /assets                 ← Images / Icons
    ├── icon-192.png
    └── icon-512.png
```

---

## Data Flow Architecture

```
User Input (Workout)
       ↓
Raw Physical Data
  reps, weight, sets, duration, distance
       ↓
[core/conversionEngine.js]
  exercise → STR/END/SPD/POW/DISC/PRC/STA deltas
       ↓
[core/fatigueEngine.js]
  applyFatigueModifier(deltas, fatigueScore)
       ↓
[core/goalEngine.js]
  getAttrMultipliers() → scale by primary/secondary goal
       ↓
[core/attributeEngine.js]
  applyDeltas() → update stat points + level
       ↓
[core/rankSystem.js]
  evaluateRank(CP, stats, streak) → check promotion
       ↓
[core/medalSystem.js]
  checkAll() → award achievements
       ↓
UI Update (rpgController.js)
```

---

## Goal Engine — Attribute Scaling

| Goal | STR | END | SPD | POW | DISC | PRC | STA |
|------|-----|-----|-----|-----|------|-----|-----|
| Strength | ×1.3 | ×0.9 | ×0.8 | ×1.1 | ×1.0 | ×1.1 | ×0.9 |
| Hypertrophy | ×1.1 | ×1.0 | ×0.9 | ×1.0 | ×1.0 | ×1.2 | ×1.0 |
| Fat Loss | ×0.9 | ×1.2 | ×1.2 | ×1.0 | ×1.1 | ×0.9 | ×1.1 |
| Endurance | ×0.8 | ×1.4 | ×1.2 | ×0.8 | ×1.0 | ×0.9 | ×1.2 |
| Military Prep | ×1.1 | ×1.2 | ×1.1 | ×1.0 | ×1.3 | ×1.0 | ×1.1 |
| Hybrid | ×1.0 | ×1.0 | ×1.0 | ×1.0 | ×1.0 | ×1.0 | ×1.0 |

---

## Rank System — CP Requirements

| Tier | ยศ | CP Required | Gate |
|------|-----|-------------|------|
| 0 | พลเรือน | 0 | - |
| 0 | ผู้ฝึกขั้นต้น | 150 | - |
| 0 | พลทหาร | 300 | Basic Test |
| 1 | สิบตรี | 600 | - |
| 1 | สิบเอก | 900 | - |
| 1 | จ่าสิบเอก | 1,300 | END≥150 |
| 2 | ร้อยตรี | 1,800 | - |
| 2 | ร้อยเอก | 2,400 | Streak 60d |
| 2 | พันตรี | 3,200 | Officer Qual |
| 3 | พันโท | 4,200 | - |
| 3 | พันเอก | 5,500 | - |
| 3 | พันเอกพิเศษ | 7,000 | Elite Badge ×2 |

---

## Fatigue System

**Fatigue Levels:**
- 🟢 Fresh (0-25): gain ×1.0
- 🟡 Normal (26-50): gain ×0.95
- 🟠 Tired (51-70): gain ×0.85
- 🔴 High Fatigue (71-85): gain ×0.70, Deload Advisory แสดง
- 💀 Overreaching (86-100): gain ×0.50

**Deload Triggers (1 ข้อขึ้นไป = แสดง Advisory):**
1. ฝึก ≥ 6 วันติดต่อกัน
2. Volume เพิ่ม > 20% จาก 4-week average
3. Performance ลด 2 session ติด
4. Fatigue Score ≥ 75

---

## Combat Power Formula

```
CP = (STR × 2) + (END × 1.5) + (POW × 1.5) + (SPD × 1) + (DISC × 3)
   + (PRC × 0.5) + (STA × 0.5)
```

DISC ให้น้ำหนักสูงสุด = เน้นความเป็นทหาร (ความสม่ำเสมอ)

---

## Onboarding Flow (3 Steps)

```
Step 1: Profile
  name, age, height, weight, fitness level
       ↓
Step 2: Goal Configuration
  primaryGoal, secondaryGoal, bodyFocus (3-2-1 system)
       ↓
Step 3: Baseline Test (optional)
  pushup, pullup, run 2.4km, plank, days/week
       ↓
Main App
```

---

## ขั้นตอนถัดไป (Roadmap)

- [ ] Skill Tree System (Infantry / Assault / Recon paths)
- [ ] Deload Advisory UI component ใน Dashboard
- [ ] Goal Config accessible จาก Settings
- [ ] Rank System อัปเดตใหม่ตาม Blueprint (CP threshold ใหม่)
- [ ] 12-month Periodization ที่ใช้ goalEngine เป็นฐาน

---

## v2.1 Update — Multi-Profile + Template Engine

### โครงสร้างใหม่

```
/profile
  storageEngine.js    ← localStorage/IDB + Export/Import
  profileManager.js   ← Create/Switch/Sync profiles
```

```
/core
  templateEngine.js   ← 4-Week Adaptive Plan Generator (rule-based)
  rankSystem.js       ← v2 Blueprint (CP threshold + 4 Tier + SF Tiers)
```

### App Flow ใหม่

```
Splash (1.2s)
    ↓
[มีโปรไฟล์?]
  No  → Profile Select → Create → Onboarding 3-step → Main App
  Yes → Profile Select (เลือก) → Main App (sync engines)
```

### Multi-Profile Storage

แต่ละโปรไฟล์มี key แยก:
- `operator_rank_{id}`    — rank data
- `operator_attributes_{id}` — stat data (future)
- `operator_workouts_{id}` — workout history
- `operator_plan_{id}`    — 4-week plan

### 4-Week Template Engine

```
generate4WeekPlan({ primaryGoal, secondaryGoal, daysPerWeek, equipment, fitnessLevel })
→ { weeks: [W1 Foundation, W2 Build, W3 Peak, W4 Deload] }
```

- W1: base load
- W2: +7% volume (Build Week)
- W3: +14% volume (Peak Week)
- W4: 55% load (Deload — ลด fatigue ก่อนรอบใหม่)
