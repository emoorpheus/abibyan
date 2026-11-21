# Notes
- GitHub nickname of the user: **emoorpheus** (already has an account, has uploaded before). Do NOT publish anything until the user explicitly says so.
- Pet / game name: «Абибян» (renamed from «Мартын»).
- Voice (v2, current): tools/tts.py -> src/speech.js (SPEECH). Every line the monkey says (tools/lines.js collects DATA.LINES + literals in say() + wantLine variants) is pre-spoken by Silero TTS v4_ru (speaker xenia, model /data/voice/v4_ru.pt) and transformed toward the owner's recordings (assets/voice_src): WORLD (pyworld) pitch -> 570 Hz (range x0.5), formants x1.6, tempo x0.92, + EQ matched to the references' long-term spectrum (tools/eq_fir.npy). Clips: 22.05 kHz MP3 (lines 40k, words/syllables 32k, -cutoff 10500 — lower bitrates hurt clarity). Typed «Повторюшка» text / custom names: whole line if known, else word bank (~1700 words: line words, pet/kid words, names, numerals, top OpenSubtitles words), unknown words by CV syllables. No speechSynthesis and no random fragments any more. Old fragment bank (voice.py/voice.js) removed. Rebuild: python3 tools/tts.py (cache in /data/voice/cache), then build.py; test/speech.js checks coverage. When adding a new spoken line: just add it (DATA.LINES or a say('...') literal) and re-run tools/tts.py. Round 19: the bank is not in the main script any more — build.py turns speech.js + voice_rec.js into text ('@section', 'key\tb64\tnum…'): inert .vb blocks after the main script in the one-file html (AUDIO.voiceInline), voice1.txt/voice2.txt on the website (fetched, SW-cached); SPEECH starts empty (src/voicebank.js), SPEECH.ready bits 1|2.
- Growth: DATA.AGES (Малыш → Детёныш 150 pts/2 days → Подросток 450/5 → Взрослый 1000/10 → Легенда 2000/20), care cap 100/day, day counts from 30 (DATA.GROW). Daily tasks: DATA.TASKS (3 per day + chest). Old v1 saves migrate to a baby (kg ×0.32), coins/items kept.
- Save key stays 'martyn_tamagotchi_v1' (so existing progress is kept); export code prefix ABIBYAN1 (MARTYN1 accepted).
- Tests: test/play.js, test/persist.js, test/qa.js <steps.json>, test/speech.js (voice coverage), test/voicedemo.js (records voice demo), test/stages.js. Voice pitch per stage: DATA.AGES[i].voice (1 / 0.98 / 0.96 / 0.94 / 0.93; skuf x0.92).

## Skills (how to work) — read first
- Router skill in Notion: **abibyan-workflow** https://app.notion.com/p/c7a7f12550184605a02b5135cfb3bed3 — rules, verified commands, which skill for which task. Load it (notion_load_page) at the start of any work on the game; then load the skills it routes to BEFORE acting.
- Skills DB: collection://6c846cc9-18c5-489f-908b-694bd780860f (25 skills). Added 2026-11-02 from skills.sh: brainstorming, openai-develop-web-game, probing-web-game-mechanics, smoke-testing-web-games, maximizing-game-feel, designing-mini-games, ios-safari-quirks, ui-sound-design, ffmpeg-audio-processing.
- Correction: pixel-art-sprites IS relevant (engine-agnostic pixel-art craft → monkey.js/items.js/rooms.js). Not relevant: game-development (Unity/Lua), phaser-*, blender-*, threejs-*, openscad, cad.
- Local copies with runnable scripts: /data/skills/<skill>/ (patched: CHROMIUM_PATH + --no-sandbox; /data/skills/node_modules -> /vercel/sandbox/node_modules). Run from /data/skills, e.g. `CHROMIUM_PATH=/usr/local/bin/chromium node smoke-testing-web-games/scripts/smoke-test.mjs /data/game/dist/index.html` (PASS on current build).
- Skills can't be enabled programmatically here (notion_update_enabled_skills → "addSkillUrls should be not present"); the user can attach one via "/" in chat.
- Debug hooks (done): window.advanceTime(ms) (steps APP.step(1/60) n times: sim + update + render) and window.render_game_to_text() (scene, room, needs, coins, lvl, age, sleeping, want, monkey x/y, game id/level/hearts). Room ids: living/kitchen/bath/bed/yard (NOT 'home').

## Testing (one command)
- `test/all.sh` — build + smoke (skill script) + probe + play + persist + speech + qa s1 + pwa; prints ok/FAIL per step, logs in /tmp/abibyan_tests. Must be ALL GREEN before handing off.
- `node test/probe.js` — 20 mechanic chains (decay/h, offline floor 12, feed, empty inventory, sleep +1.3/s, wake on room change, coins, 5 mini-games on advanceTime).
- Art before/after: `node test/gallery.js <tag> [cpuRate]` → test/gallery/<tag>_room_*.png, _game_*.png + perf/colors JSON; `python3 test/compare.py base <tag> rooms|games out.png`. Time of day: Playwright `page.clock.setFixedTime(new Date(2026,10,2,HH))` (see /tmp/phases.js pattern: 7 morning, 12 day, 19 evening, 23 night). Baseline build of an old commit: `git worktree add /tmp/base_wt <sha>` + mkdir dist + patch root in build.py.
- test/shots and test/gallery are untracked artifacts (.gitignore).

## Art systems (2026-11-02 rebuild)
- rooms.js: wallAt(ctx, sprite, x, y, depth, wallY) — sprite + crisp silhouette shadow on the wall (offset +d,+0.67d, alpha .16, clipped to the wall). Use it for anything standing/hanging on the wall.
- Window light: WIN (glass rects), BEAM (per phase colour + slant), sunbeam() baked into the cached bg (shaft .07 + floor patch with 4 panes .2), motes() in dyn (8 px). polyFill = integer scanlines (no AA halos).
- ambient(ctx, room, lightOn) after ROOMS.front: multiply AMB (evening #fff0dc, night #dcd8ee); yard AMB_YARD with a vertical gradient so the sky/moon stay untouched; bedroom with lights off keeps ROOMS.night.
- home.js: two-tone contact shadow under the monkey. games.js: jungle() far layer for Лианы (parallax .12, zones 0–1).
- ui.js: coinsTo() count-up + .up/.down pill animation; .stat.gain pulse when a need rises ≥2.5 (CSS keyframes cup/cdown/sgain, reduced-motion respected). CSS unit 'u' needs a leading digit (0.8u, not .8u).
- main.js fit(): integer snap also for k≥4 when loss ≤6%. iOS: AUDIO.init() resumes any state except running/closed ('interrupted'); navigator.storage.persist() at boot.

## Voice v3 — real recordings (in progress)
- User feedback on v2: "too pitched / differs from refs". My first guess (formant shift fs=1.6 too strong → fs≈1.35) was WRONG — measured with tools/diag_voice.py (Praat): refs F0 580 Hz, F1/F2/F3 892/2282/4059, centroid 1148; game demo F0 539, 827/2546/4017, 1102; speech.js lines F0 546, 854/2568/4139, 1108. So the phrase voice is not higher than the refs (F0 slightly lower, F2 ~12% higher). Do NOT apply fs=1.35 blindly.
- Root-cause candidate: Повторюшка with a microphone (home.js onMic → AUDIO.mic.playback(buf, 1.55)) plays the player's own recording sped up ×1.55 — chipmunk, not Абибян's voice. Only the no-mic fallback (repeatText) uses AUDIO.say. Asked the user where exactly they heard the "too pitched" voice.
- Sent the user a recording script: `python3 tools/script_pdf.py` → dist/abibyan-script.pdf (A5, 13 pages) + dist/abibyan-script.txt; numbering → exact game strings in tools/script_manifest.json (182 items: sec 0 test, 1–7 game lines (126), 8 Повторюшка PHRASES (39, «Доброе утро!» deduped), 9 non-verbal FX (14), 10 story + twisters, 11 optional free talk). One section = one file named 00..11, 3 s silence at file start, 2 s between phrases, last take wins.
- Asked the user how the reference voice was made (own voice + effect/app? natural? AI/app voice?). If effect: record clean + 2–3 phrases with effect → match effect in DSP.
- When files arrive: split by silence, align to manifest with vosk (/data/voice/vosk-model-small-ru-0.22; slow ×0.8 if squeaky), take last take, denoise (noise profile from the first 3 s), normalize, encode → SPEECH.lines / SPEECH.fx; word/syllable bank for Повторюшка: recalibrate DSP to the recordings or voice conversion (kNN-VC) using story + talk; rebuild + run all tests.
- NB: the sandbox was reset — torch (CPU), pyworld, scipy, soundfile, vosk, librosa, parselmouth, resemblyzer must be reinstalled before running tools/tts.py.

## Friends (NPC) & bed pillows (2026-11-02)
- Design approved by the user: plush friends from photos are NPCs (no voices — creature sounds only), the teddy is gone (old saves: owned.teddy → removed, +90 coins, toast after intro), carrot & pepper = big pillows on the bed.
- Art: src/friends_art.js (FART.sprite(id,{pose,mood,lie,k,f,look}), FART.hit alpha-mask, FART.portrait). Sheet: `node test/friends_art.js` → test/gallery/friends_sheet.png.
- Data: DATA.FRIENDS (pusya/monty/mosq: chat scenes ['f'|'a', text, mood], sp special + cd, spGo/spDone/spCd/spFull, stories, visit, hi/bye/win/lose), DATA.PILLOW_LINES, DATA.DUELS (d_catch first 15 vs Пуся, d_bongo vs Монти, d_gym first 10 vs Москит). Ach 'bff' (chat with all 3), 'duelist' (5 wins).
- Logic: src/friends.js (FRIENDS). Homes: Пуся on the sofa (living), Монти by the palm (yard), Москит over the tub (bath, first-aid kit on the wall). Visits: gap 4 min, Москит if energy<30 & bite ready, Пуся if fun<35, Монти random; follow on room change; leave on timeout/sleep. Tap friend → card (Болтать / special / Дуэль). Specials: massage (energy+12 fun+10, 20 min), story (fun+14, 10 min), bite (energy+35, 3 h). All timers use internal game time (`later()`), never setTimeout.
- Pillows: tap carrot = shy (3 quick taps → hides), tap pepper = wink/proud + flame crumbs; hold ≥0.45 s = hug (fun+1.5, cd 3 s). Lights off → he sleeps hugging the carrot ON TOP of the blanket (layer 'hug' after bedFront + hugPaws), pepper sleeps at the headboard.
- Duels (games.js): seeded rng (mulberry32 + mix), MINI.seed(n) for tests, duelIntro modal, duel HUD «Абибян N : N Друг», duelResults (win 8+2·stage coins, loss 2, Реванш/Домой). Gym duel: cursor keeps moving during the miss lock (1.0 s) — a frozen cursor made mashing a systematic scan that won; AI re-rolls its aim after a miss (else it could miss forever).
- Tests: `node test/friends.js` (in test/all.sh): presence, card, chat, specials+cooldowns, visits, pillows, duel invariants (idle/mash lose, skilled wins), rewards, migration; gallery test/gallery/fr_*.png (modal shots need a real 500 ms wait — CSS transitions ignore advanceTime).
- Voice: tools/lines.js also collects Абибян's 'a' lines from DATA.FRIENDS and monkeySay() literals in friends.js → `python3 tools/tts.py` (20 new lines). They are NOT in the v3 recording script (tools/script_manifest.json) yet.

## Rooms from the real flat (design: docs/superpowers/specs/2026-11-02-apartment-rooms-design.md)
- Step 2 DONE (commit "Step 2: the whole flat", restored after the sandbox rollback from the delivered build): room ids balcony / kitchen / hall / zal / bath (DATA.ROOMS order = arrows), new game starts in 'zal'. Each room = own module (src/balcony.js, kitchen.js, hall.js, zal.js, bath.js; build.py order 'rooms','zal','hall','kitchen','bath','balcony','data',...) registered via ROOMS.register(id, { bg, dyn, front, night, bedFront, spots, thumbs }); ROOMS.spots(room, items) = all hotspot rects (home.js + tests read them); ROOMS.upThumb(k, v) → shop icon.
- Hall: wardrobe (→ Гардероб sheet), mirror, front door (visitors come in through it), doors to Зал / Ванная (tap → go). Balcony: PC (→ mini-games), palm, Монти's box. Kitchen: fridge (→ food shop), sofa (Пуся). Bath: shower, mirror, toilet, Москит + first-aid kit.
- Upgrades: DATA.UPGRADES { tv: room zal, pc: room balcony, steps [...] }; GAME.upgradeInfo(k) / GAME.upgrade(k) (pay, next step, stop at the last). Shop shows «step i/N» + next step (.card .stp). Wallpapers / floors / sofas / pool / grill removed.
- Migration (state.js flat()): ROOM_OF old ids (living→hall, yard→balcony, bed→zal), REFUND coins for removed things (+ one toast with the sum), tv_plasma owner → tv step 'plasma'.
- Friends: Пуся kitchen sofa, Монти balcony box, Москит bath; visit spot per room (zal [146,273]). Pillows PK = 1: lie on the bed (carrot on the blanket, pepper on top); asleep he hugs the carrot, pepper sits at the headboard. Ambient sounds AMB for every room.
- Tests: test/flat.js (rooms, doors, bars, spots, upgrades, shop, decor drawn, migration, gallery flat_*.png), test/zal.js, test/friends.js; tools/shots.js <hour> <rooms> [items-json] [outdir] → s_<room>.png.
- Зал layout (canvas): chandelier [78,14] (light switch), window glass [86,62,28,62], panel wall x≥126, fireplace sprite 52×54 at [128,176], firebox [141,197,26,25] (tap → sparks + 'sizzle'/'pop' + line), TV steps on the mantel / wall (zal.js TV table); sleep spot [44,236]. Rooms ignore H.wall/H.floor.

## Backlog (user ideas, not started)
- Friends visits: they already live in the flat (Пуся kitchen, Монти balcony, Москит bath), so coming in through the hall front door is illogical → they should walk in from the side of their own room (flat order balcony–kitchen–hall–zal–bath), e.g. Пуся enters the hall from the kitchen side. Think through before implementing (user, 2026-11-02).
- Event «все вместе»: all friends gather in one room, chat and have fun with each other (and Абибян). Needs design (trigger, room, scenes, reward).
- Computers (PC upgrade steps): user will describe the models later.

## Round 3 (2026-11-02): kitchen / hall / bath fixes + 5 real TVs
- TV steps (DATA.UPGRADES.tv): crt (start) → hiper «Hiper 40″ IPS» 120 ур.2 → tcl «TCL 43″ QLED» 220 ур.3 → digma «Digma Pro 50″ VA» 380 ур.4 → dexp «DEXP 55OCG 55″ OLED» 700 ур.6 → lg «LG G5 65″ OLED» 1500 ур.8. Migration: plasma→tcl, big→digma, owned tv_plasma→tcl (state.js TV_OF).
- zal.js TV table: {at, w, sh (screen h), foot 'feet'|'stand' | wall:1, label parts}; scr/lab computed; S.flat(k) draws the body + 7-px chin with the brand in a 5-px font (GL); user: names only, no inches on the TV. Mantel: hiper/tcl/digma; wall: dexp/lg (figurines 'wall' layout + digital clock). spots.tvLabel for tests. Shop card: «Телевизор i/6», current name + «→ next».
- Kitchen: S.table (black metal frame, smoked glass, candles + box) + S.chair (black metal, beige floral cushion — no pink) ×2 (one behind the table). spots.table/chair.
- Hall: MIRROR 30 px wide; SCONCES [[59,66,warm],[111,66,soft]] symmetric about the front door (glow per lamp); folded rack RACK [4,184,26,52] leaning on the wardrobe; wall carpet in the hall is R.FUR.carpet(54,46) at CARPET [124,36] (carpet(W,H) is parametric now; default 76×62). spots.rack/sconces/wallart.
- Bath: CATRUG [127,232,50,28] in front of the vanity. Test: test/tweaks.js (in all.sh).

## Round 4 (2026-11-02): no TV at start, sheet reset, Polaris kettle, black microwave, walk-to trips, tiny newborn, whine, feeding friends
- TV: UPGRADES.tv step 0 = 'none' («Нет телевизора»; zal shows the mantel with figurines), migration crt→none, GAME.hasUp(k); shop «Телевизор 0/5».
- Sheet bug (systematic-debugging): MINI.start switched scene without closing the sheet → UI.reset() (sheet + modal stack + bubble) in MINI.start; FRIENDS.card closes the sheet.
- Kitchen: Polaris PWK 1725CGLD glass kettle (boil: blue LED water, bubbles, steam), black microwave (run: warm window + turntable, ding); polka-dot kettle item refunded (60). Balcony lamp + hall sconces toggle. HOME.things() → text state.
- Growth: 7 stages (DATA.AGES newborn .42 / baby .54 / kid .68 / teen .84 / young 1.0 / adult 1.2 / legend), items age by stage id (DATA.AGE), save v2→v3. Babies whine «Э-э-э» + head shake (synth cry) instead of «Агу».
- Friends: card «Угостить» → food picker from the stock; fat +kg×0.12 (diet tea slims), 4 fat steps in the friend sprites.
- Trips (home.js TRIPS fridge/pc/wardrobe): tap → he walks (back view p.back, legs walkL/walkR, step SFX) → does the thing (fridge door overlay kitchen.fridgeOpen + food pops / sits on the office chair typing / digs, clothes fly) → sheet; second tap = open now; room change cancels. Kitchen right chair is live (dyn/front, st.chairDx 9 px, 'scrape'); s < .75 climbs onto the chair (trip.climb). Bar buttons still open sheets instantly; the mirror opens the wardrobe at once.
- Tests: test/r4.js sections tv, reset, kitchen, lamps, growth, whine, feed, trips (in all.sh); flat.js waits for trips (sheetAfter).

## Round 5 (2026-11-02): friends from their side, «Все вместе», friendship + tastes, interactive things
- A: friends enter from the side of their own room (flat line balcony–kitchen–hall–zal–bath); in the hall from the zal/bath door (doors open); leave toward home; the front door is not for friends any more.
- B: friendship points → 5 levels (Знакомый … Друг навек) with coins + perks (gifts, special more often, more visits); mood 0–100 drifting to 60; tastes ★ favourite / likes / hates (refused), full after 3 treats in 10 min, a daily whim (+5 coins); friend card hearts/bar/«Любит: ?»; ★♥✕ + «хочет!» in the food picker. Ach «Знаток вкусов», «Не разлей вода».
- C: «Все вместе» — card button (every 2 h) + a once-a-day evening surprise (17–22 h); 4 activities (disco / cake / photo / jokes, never the same twice), rewards, ach «Все в сборе»; cancels on room change / sleep / mini-game.
- D: src/gags.js (built after friends.js, before home.js). GAGS.hit(room,x,y,pre) — table T[room] = [id, rect(sp,it), fn, pre?]; pre entries go before home.js hotspot0 (pigeon, bed, parcel, bell, rack, stove, gnome), the rest after it. FRIENDS.at and the monkey still win over everything (so Монти's soil is diggable only while he is out). GAGS.view() → st.g for the rooms' dyn (win, gust, cook, wash, tap, rail, aid, cat, bsc, poster, garland, front, rack, wink, ham, gnome, desk, cab, drawer, candles, clock, gondola, chair); GAGS.draw(c,P,'mid'|'top') draws flyers (pigeon, stars, parcel, moth, aid lid / pancakes, frog, butterfly, plaster). GAGS.info() → text state .gags; _reset/_force({head,sock,pigeon}) for tests.
- Kitchen: MW [68,124,26,16], PAN [94,128,20,12] (hob between microwave and kettle), KET [114,114,22,26], OVEN [92,149,20,74], CABS / DRAWERS / CANDLES, cactus on the microwave, sofaGap [4,198,16,16] (the floor lamp covers the sofa's right end). TRIPS.stove (wait while cooking, cookPose arms; little ones hop). FOODS.pancake cook:1 (not in the shop, buyFood refuses). S.gags { sofa, parcel, blin, desk: day strings, seen{} }.
- Bath: vanity → sink slab SINK [135,158] (46×18) + washer WASH [136,176,44,52], porthole [158,204] (drawn live in dyn: shakes on the spin). Spots: faucet, rail, aid (kit [8,44]), fern, fresco, bathmat, sconceL/R (both toggle V.bsc).
- Zal: right casement opens inward (sky clip that leaves the drape alone, panel hinged at x=114 swings to ~120°); posterPeel; R.garland(…, mode) 0 twinkle / 1 chase / 2 flash / 3 off. Hall: rack live (pivot on its right foot, falls flat: rotate + squash), painting wink, plafond spot. Balcony: middle sash bar + handle live, opens outward behind the frame (seen through the left sash), tulle stirs, hammock skew, gnome bounce, desk drawer [172,181,8,17].
- Tests: test/r5.js sections sides, friendship, taste, party, stove, washer, window, gags (in all.sh after r4).

## Round 8 (2026-11-04): 10 smaller growth stages, real voice, vacuum ride, mandala rug, etagere from the photos, friend sizes, guitar ×1.25
- Growth: DATA.AGES 10 stages (newborn s.42 … adult .761, legend .785; heights 44→70/72 px), babble for the first 3; DATA.AGES_V4 kept for the v4→v5 save migration (by id, kg × new/old factor); GAME.little() = stage < teen (replaces `ageDef().s < 0.75`).
- Friends: FART.get(…, sc) re-rasterises shapes at a scale and maps decals (Пуся .85, Монти 1.2 with a big white belly, claws only on the feet); Москит in rooms = pixel map QM 15×16 (portrait / gym stay big), Жучок map 17 wide. Balcony BOX [-4,236,82,38], MONTY [48,256].
- Zal: guitar/bag/stand ×1.25 (ZAL.GK/GW/GH, guitarSpr canvas 128), HOME.guitarHold(); knitted mandala rug ZAL.rugSpr(pal) always drawn at RUG [42,250,96,37] (tap → dance), DECOR.rug removed, owners refunded 80 coins once (state.js rugRefund + toast).
- Hall etagere (ETAG [132,104,46,124]): no drum lamp / masks; router + 2 Hornets on the top tray (FIGS[1]), figurines on the 2nd, Linux box on the 3rd, the bottom toys incl. Скромник/Спайк/Монти Мол; lines g_figSpike/g_figMole/g_figShy/g_hornet.
- Vacuum: 28 px (lidar, bumper, brushes); tap → HOME trip 'vac' (go → hop on → ride: after GAGS.update the monkey is pinned to V.vac at lid height VAC_TOP 4 → hop off → walk back); GAGS.vacGo(ride), vacRiding(), info().vacRide; asleep/busy → it drives alone (he hops over it). Line g_vacRide.
- Voice: tools/rec.py → src/voice_rec.js SPEECH.rec (178 recordings, hand-aligned to tools/script_manifest.json with the ASR as a guide; trimmed, gated, −17 dBFS, mp3 22 kHz 40k). audio.js plan(): R whole line → per sentence/clause R → L → words. tools/tts_add.py tops up speech.js (new lines + the non-recorded parts of lines with a recorded sentence/clause) without touching the word/syllable bank. build order: … speech, voice_rec, audio …
- Friends greet: entering a friend's room he calls them by name (FRIENDS.CALL, recorded), the friend answers 1.5 s later; FRIENDS._greetNow() for tests. The shower stops on any room change.
- Tests: test/r8.js sections shower, etag, vacuum, growth, voice, guitar, rug, friends, chatter (in all.sh after r5); test/lib/h.js boot() waits for the home scene.

## Round 9 (2026-11-04): магазин вещей (v6), гитара для малышей, ковёр какао + джига, уточки-путешественники, голос выше и противнее, Москит с носом и 6 лапками, этажерка без розовой фигурки и птички, Жучок −15 %, Москит ×1.5, рост до 58 px
- Друзья. Жучок: карта 13×16 (zhukPx, MX = 12 − x), сытый +2 колонки. Москит: карта 25×24 (mosqPx, MX = 24 − x), 6 лапок, хоботок ≥ 12 px от рта вниз (QNOSE), сытый +4 колонки. На большом портрете нос ≥ 18 px. Живот Монти без точек (проверка-сторож).
- Рост: масштабы 0.42 / 0.443 / 0.459 / 0.486 / 0.514 / 0.544 / 0.565 / 0.596 / 0.621 / 0.623. Каждый этап на 1–3 px выше, взрослый ≈ 57 px, легенда 58 px (как 5-й этап в R8).
- Этажерка (hall.js): нижний ярус без «pink» и «bird» (и без реплики «Чирик-чирик»). Фигурки делятся на figsN и figsSP (hankey / alien / towel), HALL.figOn / figList.
- Голос: tools/rec.py SQUEAK (rubberband +3 полутона, formant=shifted, EQ 200 Гц / −2 дБ на 700 Гц / +5 дБ на 3.2 кГц). TTS: rate ×2^(1/12) + o.sq EQ. Плач малышей (VOX.whine) играет запись REC 185 «Э-э-э-э-э!», пила осталась запасным вариантом. tools/f0_banks.py меряет F0 банков.
- Уточки (src/ducks.js, DUCKS): папа → 3 утёнка (самый маленький с ресничками) → мама. Маршрут по всем комнатам, смена комнаты сдвигает колонну на 8–40 px, в его комнате они ковыляют ≤ 3 px/с. Тап: писк и прыжок. Положение в S сохраняется.
- Гитара: если у ageDef() есть babble (Кроха, Малыш, Карапуз), он 3 раза шлёпает по чехлу (GB: 0.2 / 0.75 / 1.3 с, SFX bzdyn, чехол трясётся, bagDx), потом хнычет (whine {noAct}) и показывает тост «Гитару откроет, когда подрастёт до «Детёныш»». С «Детёныша» играет как раньше.
- Ковёр (zal.js RUG_PAL): 7 тонов какао. Тап → ACTS.jig, 3.3 с (прыжки в 6/8, нотки, коричневая пыль, SFX jig + tada).
- Магазин «Дом» (data.js DECOR, DATA.BOUGHT9): kettle 40, micro 90, candles 35, guitar 150, vacuum 200, router 60, hornets 80, toys 70, linux 60, figsN 70, figsSP 90, washer 180. У каждой вещи DECOR есть desc, в карточке это .stp. Миниатюры: ROOMS.upThumb(id) + trim(). Не купленное не рисуется, без зоны тапа и без действия (гитара, пылесос и т. д.). Без стиралки под раковиной сифон, без микроволновки кактус на столешнице (y = 118).
- Сохранение v6: v5 → v6 даёт GAME._ownAll() (всё, что стояло, остаётся куплено и на месте), shopGift → тост один раз. Возврат 60 за чайник в горошек только при v0 < 6, потом выдаётся Polaris.
- Тесты: test/r9.js friends, growth, mosq, etagere, voice, ducks, guitar, rug, shop (в all.sh после r8). Старые r4 и r5 сначала покупают вещи. Красные логи: test/look/r9_red_d7d35a2.log, test/look/r9_red2_2a117d3.log.
- Открыто: вопрос про сезонные события (ждёт ответа пользователя).

## Round 10 (2026-11-04): утки меньше и тапаются на телефоне, прихожая без картины, ковра и фикуса (v7), ходит по тапу на пол, ручки батареи, своя музыка у каждой игры, размер по возрасту в играх, сезонные события
- Утки (ducks.js): KIND на 20–25 % меньше, LANE 276. На коротком телефоне #bar перекрывает холст с y ≥ 277, поэтому всё тапаемое держать выше 276. DUCKS.at() проверяется в HOME.down первым. У #bar pointer-events:none, кроме кнопок.
- Сохранение v7: art_painting, art_carpet, plant убраны (DECOR, hall.js, gags carpet и painting). Купленные возвращаются монетами (state.js HALL10), тост в main.js.
- HOME.walkTo(x, y): тап по полу (y ≥ FLOOR + 8) после проверки зон. Полоса WALK x 16–164, y 246–272. rest = где он стоит, походы возвращают его туда, при смене комнаты rest сбрасывается. trip 'walk' отменяется любым другим походом.
- Ручки батареи (zal.js KNOB, gags.js V.knob: on, wobble, fall, floor, held): 7 тапов за 4 с, падение с физикой до y 236. Поход 'knob' (home.js TRIPS.knob) стартует только когда ручка на полу. Пока он её несёт, ручка рисуется у руки (sp.handR).
- Музыка (audio.js TRACKS): mel — восьмые ('C5', '_' — держать, '.' — пауза), prog — аккорды по тактам, bar — длина такта (6 = вальс), bass, comp, drum — стиль. AUDIO.track(id): MINI.start(gid) ставит трек игры, у дуэли трек её base, у d_keys — stack. MINI.home() → 'home'. AUDIO.trackId, AUDIO._musLog для тестов.
- Размер в играх (games.js GS/GK): s = homeS × min(1.1, s0 / 0.621). В «Банановой дуэли» зона рук остаётся взрослой, чтобы было честно против Пуси: малыш подпрыгивает за бананом (m.hop). У mp(s, o, fixed) третий аргумент оставляет размер как есть (Super, Race). Хитбоксы, завязанные на рост, умножаются на GK(s0).
- Сезоны (seasons.js, в build после ducks): SEASONS.at(days), check() на старте и через 2.6 с после careDay, set(id) — только предпросмотр, sky() вызывается из ZAL.dyn (окно по 4 стёклам) и BALCONY.dyn (под рамами), draw() — предмет на подоконнике (100, 128), spots и hit — тап раньше окна. Лист роста: SEASONS.sheet(im). Предпросмотр: #season=<id>.
- Тесты: test/r10.js (в all.sh после r9). Красный лог test/look/r10_red_e607daa.log.

## Round 11 (2026-11-04): тень под ногами при ходьбе, коричневые ручки батареи, стол без тумбы, утки (мама впереди), серая плитка у двери, танец в центре ковра
- Тень: home.js renderScene, shY = mk.y (null в кровати), в поездках trip.shY. mk.shY смотрит тест.
- Ручки: zal.js KBRL (левая) и KBROWN (правая, упавшая, в руке), экспорт ZAL.KBROWN вместо KBLUE.
- Стол на балконе: крышка и 2 ножки. Гэг desk «заначка» (+2 монеты раз в день) удалён вместе с тумбой. GAGS.ids() всё равно ≥ 25, так что «Всё потрогал» достижимо.
- Утки: DUCKS.LINE = [mama, lash, kid1, kid2, papa].
- Прихожая: плитка у входной двери в серых тонах (hall.js floor).
- walkTo(x, y, then) в HOME: колбэк по прибытии. Гэг rug: walkTo(центр ковра) → spring + jig.
- Тесты: test/r11.js (в all.sh после r10). Красный лог test/look/r11_red_89bf20a.log. Адаптированы r5 (без desk), r9 (порядок уток), r10 (цвет ручек).

## Round 12 (2026-11-04): танец обрывается при уходе из зала, Жучок отцепляется от ключницы
- home.js setRoom: jig → mk.act = null, AUDIO.stop('jig'), ноты (fx 'note') удаляются. audio.js: jig на liveBus('jig'), AUDIO.liveOn(n).
- friends.js: hanging(f) = на своём месте (не onFur, ближе 2 px к HOMES), иначе на крючке короткий кусок цепочки. f.hung отслеживает переход «прицепился» → 'keys'.
- Тесты: test/r12.js (в all.sh после r11), красный лог test/look/r12_red_2f657f3.log.
- Brainstorm направлений (предложено пользователю, ждёт выбора): «Абибян живёт сам» (распорядок дня, сам ходит по комнатам, друзья общаются между собой, событие «Все вместе» из бэклога); «Альбом и гардероб» (фотоальбом воспоминаний, карта найденных приколов, одежда, праздник на каждой стадии роста); «За дверью» (двор, парк, магазин, дача — новые локации); «Мини-игры 2.0» (одна большая игра, турнир недели с друзьями); «Телефон-ready» (index.html 10,9 МБ → быстрая загрузка, офлайн, батарея, iOS-проход); «Поделиться» (фото с наклейками, открытка-ссылка «привет» без сервера).

## Round 13 (2026-11-04): обучение — «Пропустить обучение» + экскурсия по квартире (этап R13 плана)
- План этапов: docs/superpowers/plans/2026-11-04-roadmap-r13.md (R14–R15 «Живёт сам», R16–R17 альбом и гардероб, R18 мини-игры 2.0, «быстро на телефоне» понемногу; «За дверью» ждёт фото пользователя).
- DATA.TUT: 14 шагов. Шаги экскурсии с tour: 1, auto ('room' | 'fed' | 'washed' | 'sleep' | 'gag') или ev ('friend' | 'walk'). t(name, room), at — строка или функция комнаты (navTo(to, room) → '#nav-L' / '#nav-R').
- tut.js: next() / finish() / skipAll(); tick(dt) из main.step; on(ev) из FRIENDS.card и тапа по полу в home.js.
- state.js: v8. gamesOpen = phone && tut > TUT_AT('play'). Миграция v7 → v8: tut ≥ 4 → TUT.length.
- Тест: test/r13.js, красный лог test/look/r13_red_2e28c4a.log.

## Round 13b (2026-11-04): правки после демо R13
- «Банановая дуэль» с Пусей стала настоящей борьбой: Пуся быстрая, прыгает за высокими бананами, не мешается под ногами, бананы быстрее и качаются на ветру. Баланс сделан на симуляциях (test/lib/duelsim.js + node-копия): хороший игрок выигрывает примерно половину на первой стадии роста и всё реже потом, расслабленный почти всегда проигрывает, идеальная игра всегда побеждает.
- Бонго-дуэль: барабаны снова красный/жёлтый/зелёный/синий (номера материалов спрайтов больше не обрезаются на 256).
- Балкон: утята идут перед ящиком с растениями, а не под ним; в ванной горшок по-прежнему впереди.
- Тест: test/r13b.js (в all.sh).

## Round 13c (2026-11-04): прыжок в банановых играх
- Прыжок: ↑ / W / пробел, смахнуть вверх или быстро тапнуть по Абибяну. В воздухе руки достают выше — так можно перехватить банан у Пуси. После приземления короткий отдых, в воздухе рулит медленнее — без спама.
- Есть и в одиночном «Банановом ливне». Баланс дуэли: tools/duelbal.js (node-копия, тысячи матчей с ботами). Хороший игрок с прыжками выигрывает большинство матчей, без прыжков — около половины в начале.

## Round 14 (2026-11-04): «Живёт сам» ч.1 — распорядок дня
- Если его не трогать 20 с, он сам живёт по часам: утром (6–11) идёт на балкон делать зарядку (раз в день, +веселье +бодрость); днём, когда голоден, идёт на кухню, сам открывает холодильник и ест самое сытное из запаса, а если пусто — просит купить еды; вечером (18–22), если грязноват, идёт в ванную и просит помыть; ночью (22–6) зевает, идёт в зал и просит выключить свет.
- Ходит по-настоящему: выходит за край комнаты в нужную сторону, вид съезжает за ним, заходит с другого края.
- Не мешает: не во время обучения, магазина/окон, игр и сцен с друзьями; любой тап его останавливает и снова ждёт 20 с.
- Код: src/routine.js (ROUTINE), HOME.travel / stopTravel / fridgeSnack, действие exercise, GAME.wish. Тест: test/r14.js (в all.sh).

## Round 14b (2026-11-04): замечания после R14
- Распорядок виден: через 15 с без касаний он сам идёт заниматься делами в любое время дня (зеркало, пылесос, гитара, телевизор, окно, танец), один раз подсказка «живёт сам».
- Облачко желания обходит друзей; подпись фото и дата не наезжают; «Сохранить» делится файлом / скачивает PNG.
- dist/abibyan-test.html — тестовая сборка со 100 000 монет и своим сохранением.
- Сушилку он поднимает сам (анимация с натугой); кухня ниже; блины — с табуретом-стремянкой, который он приносит и уносит.
- Тест: test/r14b.js (в all.sh).

## Round 15 (2026-11-04): «Живёт сам» ч.2 — друзья между собой
- Друзья ходят друг к другу в гости (Жучок ↔ Пуся, Москит ↔ Монти): гость выходит из своей комнаты в сторону комнаты друга, заходит с той стороны, садится рядом, они болтают по очереди (16 диалогов), потом прощаются и идут домой тем же путём.
- Абибян поворачивается к говорящему, иногда вставляет «О чём болтаете?»; тап по болтающим — «Можно с вами?», друг отвечает, сердечки, +веселье.
- Если друга нет дома — «А где Жучок? Наверное, у Пуси!»; если ушёл при нём — «Жучок пошёл к Пусе!».
- «Все вместе» само: днём 10:00–21:59, через 1,5–4 мин в игре, раз в день; на вечеринке друзья обращаются друг к другу по имени.
- Порядок событий: нужный визит → вечеринка → случайный заход → гости друг у друга. Пока у него гости, распорядок не уводит.
- Код: src/friends.js (PAIR, GSPOT, startGuest/guestTick/joinChat/pairTalk), DATA.FCHAT, 14 новых озвученных реплик. Тест: test/r15.js (в all.sh).

## Round 15b (2026-11-04): замечания после R15
- Тестовая сборка (dist/abibyan-test.html): 100 000 монет, максимальный уровень и этап «Легенда» — открыто всё, своё сохранение.
- Зеркало в прихожей ниже (108 px вместо 140), по-прежнему напольное.
- Жучок — тихоня-авантюрист и сообщник Абибяна: «Вылазка» за вкусняшками Пуси (из карточки, по его шёпоту и сама в течение дня, раз в 40 мин), разговоры и шутки про «сквозняк».
- Ручку батареи Абибян чинит, забравшись на угол кровати.
- Скиллы со skills.sh в /data/skills (game-qa, game-audio, test-driven-development, writing-plans, game-feel, animation-for-game-feel, game-balance-economy, playwright-best-practices); test/inv.js — QA-инварианты. Тесты: test/r15b.js, test/inv.js (в all.sh).

## Round 16 (2026-11-04): альбом и карта приколов
- Кнопка «Фото» открывает «Альбом»: «Сделать фото», полароиды (до 36), тап — большое фото и «Сохранить».
- Яркие моменты снимаются сами: первый танец, новый этап роста, «Скуф», первый визит каждого друга, «Все вместе», первая «Вылазка».
- Вкладка «Приколы»: найденные — картинка места и название (тап — туда), остальные — силуэт «?», счёт «Найдено N из M».
- Код: src/album.js (ALBUM), GAGS.map/found, UI.openAlbum/bigPhoto, DATA.GAG_NAMES. Фото — под своим ключом в localStorage. Тест: test/r16.js (в all.sh).

## Round 17 (2026-11-04): гардероб по этапам и праздник роста
- 9 новых вещей — по одной на каждый этап: Чепчик, Слюнявчик, Панамка, Галстук, Наушники, Кожанка, Кеды, Шляпа-федора, Плащ Легенды. Её дарят друзья на празднике этапа; потом её можно и купить. Если уже куплена — дарят 30 монет.
- Праздник роста: после карточки «подрос» приходят друзья, торт со свечой-цифрой этапа, он задувает, подарок (сразу надевает), общее фото «Праздник: <этап>» в альбом. Ждёт, пока он спит; не тратит «Все вместе».
- В «Гардеробе» вещи будущих этапов помечены «Подарок на празднике».
- «Живёт сам» больше не ждёт, пока он доерзает (праздные действия обрываются) — старт без задержек.
- Код: DATA.CLOTHES (+age, gift), DATA.GIFT, DATA.GPARTY; GAME.giftCloth; FRIENDS.growParty/growScript/drawGrowCake; main.js growParty(); новые вещи нарисованы в src/monkey.js. Тест: test/r17.js (в all.sh).

## Round 18 (2026-11-04): «Крыши» и турнир недели
- Перед раундом папка откатилась к копии времени Round 13b; Round 14–17 восстановлены из архива round17 (коммит 0ece482, старая история коммитов R14–R17 потеряна, код и тесты целы).
- Новая игра «Крыши» (телефон, с этапа «Детёныш»): бег по крышам города, одна кнопка — короткий тап низкий прыжок, держишь — высокий. Бельё на верёвке — прыгай низко (запутался — −1 сердце), козырёк сам подбрасывает («Пружинка!»), антенны и трубы, бананы дугами, золотой банан. Упал — шарик спасает. У флажка «Высоко!» +1. 5 районов по 3 уровня: заводы, купола, стройка, набережная, ночное стекло.
- Турнир недели: вкладка «Турнир» в «Мини-играх» — игра недели (каждую неделю другая), таблица с Пусей, Монти, Москитом и Жучком (их очки растут всю неделю), «Играть». Счёт — лучший уровень за неделю; в окне итогов игры «Турнир недели: N-е место», тосты «Ты лидер турнира!» / «Ты обогнал …!».
- В понедельник дома — «Итоги турнира»: место и приз 100/50/30/15/10; 1-е место — кубок, фото «Чемпион недели» в альбом, фраза голосом, ачивка «Чемпион недели» (+50). Неделя без игры — без итогов.
- Код: src/games.js (RF, rfGen, rfPhys, Roofs + pilot), src/tour.js (TOUR), UI.tourTab, DATA.ACH champ, s.tour; 3 новые фразы в speech.js. Тест: test/r18.js (в all.sh).

## Round 19 (2026-11-05): «Лёгкий и быстрый»
- Перед раундом папка снова откатилась к копии Round 13b; Round 14–18 восстановлены из архива round18 (коммит b978db3).
- Игра показывает первый кадр в 3–4 раза быстрее: 0,29 с вместо 0,9 с на компьютере, 0,85 с вместо 3,4 с на среднем телефоне (CPU ×4). Голос приходит сразу следом (≈1–2 с); фраза, сказанная до него, звучит, когда он пришёл.
- Сайт: index.html весит 1 МБ вместо 11,3 МБ — голос лежит рядом (voice1.txt, voice2.txt), качается после старта и хранится для офлайна.
- Один файл abibyan.html по-прежнему всё в одном (тот же размер), но голос стоит после игры, а не перед ней.
- Интерфейс мини-игр не переписывает уровень и монеты каждый кадр.
- Инструменты: tools/perf.js (замер запуска, кучи, нагрузки дома и в «Крышах»), test/r19.js (в all.sh).

## Round 20 (2026-11-05): «Телефон-ready ч.2»
- Звук на телефоне просыпается с первого касания (по правилам iPhone: на отпускании пальца, плюс тихий сэмпл для старых iPhone); после звонка/блокировки — с одного касания.
- Батарея: дома, когда он просто сидит, игра рисует 30 кадров/с, во сне 15; от касания, в мини-играх, при переходе между комнатами, когда он идёт или приходят гости — снова 60. Нагрузка дома на среднем телефоне 38 % → 23 %.
- iPhone: один раз совет «Поделиться → На экран „Домой“» (иначе Safari стирает сохранение сайта, если не заходить неделю) и строчка в настройках, там же «нет звука — выключи „Без звука“». Без «резинки» при свайпе.
- Проверено: ничего новее Safari 15 в коде (tools/compat.js), канвасы занимают 6 МБ.
- Голос легче — только на выбор: dist/abibyan-voice-ab.html (A как сейчас 10,2 МБ, B 7,9 МБ, C 5,8 МБ). Ждёт ответа владельца — буква.
- В архиве раунда теперь и история коммитов (.git).

## Round 21 (2026-11-05): голос B
- Владелец выбрал B в A/B: фразы, реакции и его записи — 32 кбит/с, слова и слоги набранного текста — 24 кбит/с. Те же клипы (ключи и длительности), перекодированы из исходника (кэш TTS, его оригиналы m4a), из MP3 — только 8 клипов без исходника (7 фраз не из tools/lines.js и слово «чем»).
- Голос 10,2 → 7,9 МБ, abibyan.html 11,3 → 9,0 МБ, сайт (zip) 7,7 → 6,0 МБ; первый кадр на среднем телефоне 0,83 → 0,50 с.
- Новые идеи: docs/superpowers/specs/2026-11-05-brainstorm-r21.md (рекомендация — «Прятки по квартире», потом «Новый год» к 1 декабря).

## Round 22 (2026-11-05): «Подарок для Дашулика»
- Игра — подарок Даше («Дашулик») на 24-летие, 21.11.2026. Первый запуск — коробка «Дашулик, это тебе!»: стучишь — прыгает, на третий раз (или «Открыть») выпрыгивает Абибян: «Привет, Дашулик! Я Абибян, теперь я живу у тебя!». Окна имени больше нет.
- В её день рождения (или в первый вход в течение недели) зал украшен, приходят друзья, выносят торт с 24 свечками. Свечки задувают в микрофон (проверено тестовыми записями: дутьё тушит, речь/музыка/хлопки/тишина — нет; на настоящем iPhone — проверить репетицией) или пальцем. Подарки: 100 монет и 3 торта, фото в альбом навсегда. На следующий день украшения убраны. Каждый год 21.11 — снова, свечек на одну больше.
- «24 секрета»: сердечки с записками по квартире (8 сразу, +2 в день), вкладка «Сердечки» в альбоме. Тексты владелец впишет в docs/24-secrets.md (+ картинки assets/secrets/N.jpg) — сборка подставит сама.
- Репетиция на его телефоне: https://emoorpheus.github.io/abibyan/#bday — ничего не засчитывает.
- Хостинг: GitHub Pages, бесплатно, https (нужно для микрофона и «На экран Домой») — пошагово docs/GITHUB_PAGES.md; ссылка https://emoorpheus.github.io/abibyan/ (не публиковали — загрузит сам).
- Открытка с QR: dist/abibyan-card.pdf (A6, 2 стороны) и .png — tools/card.py. С Round 27 — лист A4.
- Мелочи: сцена больше не может «уехать» прокруткой; плач малыша прерывает речь; золотые цифры-шары цельные.

## Round 23 (2026-11-05): сердечки по одному, репетиция 21.11, monkey2d
- Перед раундом папка снова откатилась; Round 22 восстановлен из архива round22 (коммит 35229f1), старая .git — в /data/.git_rollback_backup_1793881783.
- Сердечки прячутся по одному: открыла подарок — спрятано №1; нашла — записка, и он прячет следующее, всегда в другой комнате. Пустые номера пропускаются. Дней больше нет.
- Спрятаны лучше: сердечко 7×6 вместо 11×10, не прыгает, вырезано из самой комнаты — выглядывает из-за вещей, лежит в тени, за стеклом, в листьях. Чем дальше, тем хитрее (первые 6 видно на 61 %, последние 6 на 44 %). Блеснёт раз в ~7 с и когда тап рядом.
- Подсказки: минута без находки — «Тепло-тепло!» в нужной комнате, «Холодно-холодно!» в другой, потом «Загляни в зал!» (12 новых фраз озвучены).
- Ни одно сердечко не под Абибяном, друзьями, панелью сверху и кнопками снизу — даже на маленьком телефоне 360×640.
- Альбом «Сердечки»: найденные, «?» + комната для того, что ищем сейчас, «Потом» для остальных.
- Обучение: карточка теперь сразу под верхней панелью и не закрывает Абибяна и его облачко.
- Репозиторий — monkey2d: ссылки, docs/GITHUB_PAGES.md, открытка с QR → https://emoorpheus.github.io/monkey2d/
- Тестовая сборка = репетиция её дня рождения: «сегодня» 21.11.2026 (реальное время суток), 100 000 монет, коробка с подарком; в настройках «Начать репетицию заново», ссылка …/test.html#fresh тоже. Свое сохранение, настоящее не трогает. На сайте лежит рядом: https://emoorpheus.github.io/monkey2d/test.html (https → микрофон работает).
- docs/24-secrets.md переписан: 24 номера «Комната: место» по порядку + Финал.
- Тесты: test/r23.js (seq, hide, hint, album, tut, url, test21, site, look) в all.sh.

## Round 24 (2026-11-05): открытка «твой Loveашик», снова abibyan, сердечки сложнее, iPhone 17, «по ссылке»
- Открытка: «С любовью, твой Loveашик ♥» одной строкой; QR и адрес → https://emoorpheus.github.io/abibyan/.
- Репозиторий снова abibyan: docs, сборка, тесты (адрес один — SITE_URL в test/lib/h.js; старое имя нигде не осталось).
- Сердечки сложнее: каждое чуть глубже в тени — видно не больше 53 % (было 73 %), в среднем 41 % (было 52 %), последние шесть ≈ 31 %;
  первые всё ещё легче. Блик реже (раз в 13 с), «тепло-холодно» позже (через 1,5 мин), блик от близкого тапа — только в 18 px.
- iPhone 17: тесты на профилях iPhone 17 / 17 Pro Max / 17e — в Safari и «с экрана Домой» (вырез и полоска снизу через безопасные
  зоны), и в WebKit 18 (движок Safari; tools/webkit_setup.sh). Найдено и исправлено: поле ввода было мельче 16 px (iPhone увеличивал
  страницу при наборе), кнопки сверху 34 px на 17e — теперь 36.
- «Не для всех, а по ссылке»: noindex во всех сборках; docs/PRIVATE_RELEASE.md — варианты (бесплатные GitHub Pages требуют открытый
  репозиторий; приватно — GitHub Pro или Netlify / Cloudflare Pages); сайт работает и из корня домена.
- docs/ROADMAP.md: до 21.11 — записки, хостинг, QR, репетиция на iPhone, печать открытки; после — новогодний сезон, «Прятки», рисунок…
- Тесты: test/r24.js (card, url, harder, iphone, webkit, private, look) в all.sh (36 шагов). Старые нестабильные проверки сделаны
  устойчивыми (каждая причина воспроизведена нарочно): r5 — «Вылазка» уводила его от плиты; tweaks — его румянец у стола; r20 — шум машины.

## Round 25 (2026-11-06; в исходники возвращён 2026-11-08): весь экран телефона (FILL)
- Когда комната в портрете почти во всю ширину, пол и стены дорисовываются до краёв экрана (холст #ext, src/fill.js); на iPhone
  «с экрана Домой» слой тянется до полной высоты экрана (screen.height), а страница под ним — цвета пола.
- Сайт 06.11 (коммит сайта 43ac3ef) собрали из кода, которого не было в репозитории. 08.11 код восстановлен из самой сборки: src/fill.js,
  rooms.js (полы комнат), home/zal/hall/kitchen/bath/balcony (пол с высотой), style.css, main.js, build.py, шаблон (#ext).
  Сборка из src/ совпадает с сайтом байт в байт: index.html, test.html, sw.js, manifest, voice1/2.
- Тесты на FILL — с Round 28 (test/r28.js); на iPhone 17 «с экрана Домой» всё ещё видны полосы — разбор в LOG.md.
- Хостинг (08.11): остаёмся на GitHub Pages — Cloudflare Pages из России не грузится, у Netlify Free нет пароля (docs/PRIVATE_RELEASE.md).

## Round 26 (2026-11-08, ветка r26-phrase): записки под замком (фраза Даши)
- Записки попадают в страницу только шифром (AES-GCM, ключ из фразы через PBKDF2-SHA256, 600 000 итераций). На первом найденном сердечке игра задаёт вопрос; верный ответ (регистр, «ё», пробелы и знаки не важны) открывает все записки сразу, ключ хранится в сохранении — второй раз не спросит. После 3 неверных ответов — подсказка; «Потом» — сердечко в альбоме «Под замком».
- На GitHub уходят только шифр, вопрос, подсказка и номера с записками; самой фразы там нет ни в каком виде. Armbian нужен только для сборки, игра работает без него.
- Фраза: ~/.config/abibyan/phrase.txt (chmod 600), строки «вопрос:», «ответ:», «подсказка:» (по желанию); проверка — `python3 tools/secret_box.py check`. Есть записки, нет фразы — build.py останавливается.
- build.py собирает из своей папки и сам создаёт dist/ (worktree и чистый клон собираются).
- Сборка с записками каждый раз разная (случайный IV): «совпадает с сайтом байт в байт» верно только без записок.
- Тесты: test/r26.js — Chromium 18/18, WebKit 26.6 на Armbian 2/2 (WebCrypto в движке Safari). На iPhone не проверено. abibyan.html, открытый не по https, может не расшифровать — игра скажет «нужна ссылка https://».
- Не сделано: merge в master и полный test/all.sh на ветке (r22/r23 через test/lib/h.js смотрят в /data/game = master); настоящая фраза — за пользователем.

## Round 27 (2026-11-09, ветка r27-card-a4): открытка на A4
- Открытка — лист A4 (210×297 мм), 2 стороны: лицо и оборот с QR. Каждая сторона — панель в пиксельной рамке со ступенчатыми углами,
  вокруг 7 мм белой бумаги: домашний принтер не печатает до края.
- Внутри — та же открытка Round 22 (105×148 мм), увеличенная ×1,87: слова векторные, картинки игры заранее увеличены ×16
  (≥ 300 dpi, квадратные пиксели), QR на бумаге 87,7 мм.
- Печать: A4, масштаб 100 % (не «по размеру страницы»), двусторонняя, переворот по длинному краю, плотная бумага —
  или две страницы и склеить.
- Торт в открытку не вошёл: его рисует сама игра из состояния праздника, отдельной картинки нет.
- Проверка: node test/r27.js — размер A4, поля, 8 мм от края, без наложений, шрифт, dpi картинок, QR с «печати» 150 dpi, тексты.
  На бумаге A4 ещё не проверена.

## Round 28 (2026-11-09, ветка r28-fill-tests): тесты на FILL, скорость на Armbian, r5 без флака
- FILL под тестами: `node test/r28.js` — iPhone 17 / 17e / 17 Pro Max в Chromium и WebKit: окружение на весь экран без дыр, сверху
  потолок (темнее к краю), снизу пол, бока — зеркало краёв, все комнаты, затемнение под окном, шторка магазина до низа, переход
  между комнатами, iOS 26 «с экрана Домой»; на компьютере и в альбомной FILL выключен.
- Что показывает настоящий iPhone 17 под статус-баром и ниже окна приложения, тест не видит: на iPhone не проверено.
- Скорость: на Armbian (4× Cortex-A55) r19/r20/inv краснели на лимитах x86-песочницы. test/lib/speed.js берёт профиль по машине:
  «a55» — лимиты из замеров (×4,50 и ×6,75 на первый кадр, ×1,87 на простой и fps), «ref» — как было; `ABI_SPEED=ref` — строгие.
- test/lib/h.js открывает сборку рядом с собой (раньше — всегда /data/game/dist, то есть master: тест в worktree проверял master).
  18 старых тестов (r5.js в их числе) и smoke в all.sh ещё открывают /data/game/dist напрямую — в worktree это сборка master.
- r5 «плита» больше не флакает: тест выключает распорядок и перед тапами ждёт, пока Абибян свободен и на кухне.
- FILL на Armbian не стоит ничего измеримого. Код игры (src/) не менялся — сборка и сайт те же.
- Проверка: r28 — 78/0, все 9 мутаций FILL пойманы; r5 «плита» — 9 из 9 подряд (5 без нагрузки, 4 под нагрузкой),
  полный r5 — 156/0; busymut 70 мс теперь валит и r20, и inv. Коммит только локальный, на GitHub ничего не уходило.
- Дальше: 18 старых тестов и smoke — на dist рядом с собой, как h.js; тогда тест в worktree проверяет свою сборку.

## Round 29 (2026-11-11): устранение рамок на iPhone 17 в режиме PWA («На экран „Домой“»)
- Решена проблема с рамками сверху и снизу и висящей панелью кнопок на iPhone 17 (402×874 px).
- Убраны искусственные затемнения потолка и пола в `src/fill.js`.
- Настроена геометрия безопасных зон в `src/style.css` и `src/main.js` (HUD под Dynamic Island, #bar над Home Indicator).
- Проверено скриншотами Playwright на всех комнатах и состояниях (зал, кухня, ванная, балкон, шторка, мини-игра) — 100% экран без полей.
- Тесты `test/r28.js` на Armbian homelab: 63/63 PASS. Мутации `test/r28mut.sh` работают.

## Round 30 (2026-11-11): шифрование 24 секретов («Вонючка») и сброс тестового билда для первого входа
- Секреты Даши зашифрованы AES-GCM (PBKDF2-SHA256, 600k раундов) с ключом из ключевого слова («Вонючка»).
- В открытом коде страниц лежит только шифротекст; ни в git, ни в html открытого текста нет.
- В тестовый билд добавлен `resetToken` ("20261111_fresh1"), очищающий старые тестовые сохранения при первом запуске нового билда.
- Игра стартует как в самый первый раз: коробка с бантом на ковре, затем сердечко №1 на камине за статуэткой, по клику — окно ввода пароля («Вонючка»).
- Тесты r23 (8/8), r26 (19/19), r28 (63/63) полностью зеленые. На GitHub ничего не отправлено (коммиты только локальные).

## Round 31 (2026-11-11): позиция Жука на праздничном фото, 24 секрета и вопрос про обезьянку
- Жук на общем праздничном фото в Зале подвинут ближе к обезьянке (`src/zal.js`: `party.zhuk` из `[18, 290]` в `[50, 283]`). Теперь он не срезается краем полароидной рамки (`sx = 15..165`), а гармонично виден рядом с Пусей и Абибяном.
- В игре задействованы все 24 сердечка-секрета (и финальная записка): заполнен `docs/24-secrets.md`, зашифрован `build.py` (24 секрета + финал), карточка показывает «Найдено 1 из 24 | Искать следующее».
- Секретный вопрос уточнен: «Вонючка» — это то, как Даша иногда любя называет плюшевую обезьянку. Вопрос обновлен в `~/.config/abibyan/phrase.txt` («Как ты иногда любя называешь эту обезьянку?») и в тексте Записки №1.
- Верификация: Playwright скриншот полароида, тесты r23 (8/8), r26 (19/19), r28 (63/63) на Armbian homelab. Коммиты строго локальные.

## Round 32 (2026-11-11): оптимизация производительности в Safari (iPhone 17 и Mac), защита секретов
- Причина падения FPS в Safari на Mac и iPhone 17:
  1) `wantFps()` принудительно переключал игру в 30 FPS в покое (>2.5 с без кликов/тапов) и 15 FPS во сне.
  2) Условие пропуска vsync `now - last < 1/fpsT - 0.004` (допуск 4 мс) при квантовании таймеров Safari и динамическом ProMotion (10–120 Гц) приводило к пропуску тиков: кадр, пришедший на 0.7 мс раньше расчетного, откладывался еще на 33 мс, обрушивая фактический фреймрейт до ~10 FPS.
  3) Метод `sample()` в `src/fill.js` читал `getImageData` прямо с видимого DOM-канваса `#cv`, вызывая синхронный GPU-to-CPU stall и сброс пайплайна WebKit/Metal на каждом кадре.
- Решения:
  1) `src/main.js`: для десктопа (`isDesk()`, ширина > 600 px или ландшафт) установлен постоянный 60 FPS без троттлинга; на телефоне сохранен энергосберегающий режим (60 активный / 30 покой / 15 сон).
  2) `src/main.js`: допуск дрожания таймера увеличен с 4 мс до 8 мс (`1/fpsT - 0.008`), исключая пропуск vsync-тиков на ProMotion-экранах (iPhone 17, Mac).
  3) `src/fill.js`: выборка цветов для фонового расширения переведена на оффскрин-буфер `HOME.off`, устраняя GPU stalls.
  4) `src/style.css`: на канвас `#cv` добавлен `transform: translateZ(0); will-change: transform;`, выносящий его в отдельный слой CoreAnimation/Metal в iOS Safari.
  5) Конфиденциальность: `docs/24-secrets.md` добавлен в `.gitignore` и исключен из git, чтобы открытый текст записок не ушел на GitHub; в репозитории на GitHub публикуется только зашифрованный AES-GCM шифротекст в `index.html`.
- Верификация (все тесты на Armbian homelab):
  - `node tools/compat.js`: 28 файлов, 0 проблем совместимости с Safari.
  - `test/r20.js` (fps, battery, perf, canvas memory): 22 passed, 0 failed (idle 30, tap 60, sleep 15, desktop 60).
  - `test/r28.js` (iPhone 17 fullscreen, FILL edge-to-edge, safe areas): 63 passed, 0 failed.
  - `test/r26.js` (AES-GCM WebCrypto, lock modal, hint): 19 passed, 0 failed.
  - `test/r23.js test21` (birthday rehearsal on 21.11, fresh gift box): 8 passed, 0 failed.

## Round 33 (2026-11-12): две тестовые сборки (с бонусами 100к и чистый запуск 21.11 с нуля)
- Добавлена вторая тестовая сборка `abibyan-fresh.html` / `fresh.html` («чистый запуск 21.11 без плюшек»):
  - Дата перенесена на 21.11.2026 в реальное время суток (активируется праздник Даши).
  - Монеты: стандартные 60 монет (DEF), никаких 100 000 монет.
  - Уровень: 1 уровень, стадия крохи (DEF), весь магазин закрыт по уровням, никаких накруток.
  - Первый старт: розовая подарочная коробка с золотым бантом на ковре («Дашулик, это тебе!»), после открытия — день рождения с гостями, свечками на торте, микрофоном и поиском 24 сердечек.
  - Изоляция сохранений: отдельный ключ `martyn_tamagotchi_fresh_v1` со своим `resetToken`. Тестовая сборка с деньгами (`test.html`, `martyn_tamagotchi_test_v1`) и реальная игра (`index.html`, `martyn_tamagotchi_v1`) не пересекаются.
  - Сброс: в настройках «Начать репетицию заново» или `#fresh` в строке браузера сбрасывают чистую репетицию.
- В сборке теперь доступны обе версии:
  - `dist/abibyan-test.html` / `test.html` — тестовая с 100 000 монет и макс. уровнем.
  - `dist/abibyan-fresh.html` / `fresh.html` — чистая репетиция 21.11 первого запуска.
- Верификация:
  - `test/r23.js test21,site`: 11 passed, 0 failed (проверены обе сборки, их ключи сохранений и сайт).
  - `test/r28.js`: 63 passed, 0 failed (iPhone 17 fullscreen FILL).
  - `test/r26.js`: 19 passed, 0 failed (AES-GCM шифрование).
  - Playwright visual capture на iPhone 17 (402×874 DPR 3): коробка, праздник, торт, сердечко №1, окно замка.

## Round 34 (2026-11-13): открытка-буклет А4->А5 (эстетичный дизайн без спойлеров, правильное склонение), раздача торта на тарелочках, праздничный танец, акустический компас сердечек
- Редизайн открытки на день рождения (Вариант 1 — буклет А4 со сгибом в А5):
  - Эстетика и благородный стиль: убраны тяжелые черные пиксельные контуры текста и грубые ступенчатые рамки. Добавлена элегантная двойная рамка с уголками-сердечками, нежные пастельные фоны (сливочный, нежно-розовый), изысканная типографика (Comfortaa для праздничных заголовков, Caveat для личных рукописных акцентов, Nunito для чистого текста).
  - Полное устранение спойлеров: убраны все персонажи-друзья (Пуся, Монти, Жук, Москит), чтобы не раскрывать сюрпризы игры заранее. На открытке только именинный Абибян и праздничный торт со свечками!
  - Безупречное склонение имени: «С днём рождения!» / «Дашуля, с твоим днём! ✨», «Привет, Дашуля! ❤️», в заголовке письма — «Дорогая Дашуля! ❤️» (вместо несогласованного «Дорогая Дашулик!»).
  - Внешний разворот: слева — паспорт-инструкция по запуску PWA, памятка про микрофон для задувания свечей, QR-код на `emoorpheus.github.io/abibyan` и подпись «С любовью, твой Loveашик ❤️»; справа — праздничная обложка с золотыми шарами 24, прыгающим Абибяном и конфетти.
  - Внутренний разворот: слева — уютная сцена с Абибяном, двухъярусным тортом со свечками и теплым посланием; справа — 8 аккуратных линеек цвета пыльной розы для письма ручкой и заголовок «Дорогая Дашуля! ❤️».
  - Файлы: `dist/abibyan-card.pdf` (627 КБ, векторный PDF) и `dist/abibyan-card.png` (1.1 МБ).
- Тестирование сборок в локальной сети:
  - На homelab (192.168.10.8:8080) поднят локальный HTTP-сервер для мгновенной проверки с iPhone 17 (192.168.10.10) и Mac (192.168.10.3):
    - `http://192.168.10.8:8080/test.html` — репетиция с деньгами (100k) и макс. уровнем.
    - `http://192.168.10.8:8080/fresh.html` — чистый запуск 21.11 с нуля без бонусов (коробка на ковре).
    - `http://192.168.10.8:8080/dist/abibyan-card.pdf` — открытка в PDF.
- Раздача торта (`src/friends.js`):
  - Убран баллистический разлет кусков торта по комнате.
  - Теперь каждый персонаж (Пуся, Монти, Жук, Москит и сам Абибян) подходит к блюду с тортом, берет свой кусочек на тарелочку (`f.plate = true`), возвращается на место и кушает (2 звука `chomp`, крошки, сердечко и подскок).
- Праздничный танец (`src/friends.js`):
  - Добавлена фаза танца `phase('dance')` (3.8 с) сразу после задувания свечей: диско-подсветка (`party.lt = 1`), приглушение фоновой музыки, вылетающие разноцветные ноты, искры и звездочки, синхронные движения всех друзей.
- Акустический компас для 24 сердечек (`src/audio.js`, `src/dasha.js`):
  - Добавлен SFX `chime(pitch)` (гармоничные колокольчики).
  - При тапе рядом со спрятанным сердечком (в радиусе до 45 px) звучит звон, частота которого растет по мере приближения:
    - `< 18 px`: высокий тон (`pitch 1.6`) + золотой блеск.
    - `< 30 px`: средний тон (`pitch 1.25`).
    - `< 45 px`: мягкий низкий тон (`pitch 1.0`).
- Верификация (все тесты пройдены на Armbian homelab):
  - `test/r27.js`: 20/20 passed (A4 landscape, QR декодируется при 150 dpi, текст без наложений, без спойлеров, правильное склонение).
  - `test/r23.js test21`: 9/9 passed.
  - `test/r26.js`: 19/19 passed.
  - `test/r28.js`: 63/63 passed.
  - `test/party_verify.js`: сохранены визуальные подтверждения `party_01_dance.png`, `party_02_cake.png`, `party_03_heart_hunt.png`.

## Round 35 (2026-11-14): нейроозвучка Абибяна (кроме плача «эээээ» и восторгов «иииха/уууху») и масштабное расширение диалогов друзей (155 сцен)
- Настройка озвучки обезьянки:
  - Согласно пожеланию пользователя, живые записи голоса из обычной речи Абибяна убраны. Речевые диалоговые реплики переведены на приятную милую нейроозвучку Silero (`SPEECH.lines`).
  - Сохранены ТОЛЬКО ключевые живые эмоциональные звуки:
    - «эээээ» (`AUDIO.whine()` / `'э-э-э-э-э'` — капризный плач при сильном голоде или усталости).
    - «иииха» / «уууху» (`'уи-и'`, `'у-у-у'`, `'иииха'`, `'уууху'` — радостные победные возгласы при играх и успехах).
  - Оригинальный полный файл `src/voice_rec.js` (1.53 МБ, 182 записи) заботливо сохранен в `assets/voice_backup/voice_rec_all.js`.
  - Размер финального HTML-бандла игры уменьшился с 9.5 МБ до 8.08 МБ, что существенно снижает задержку парсинга и кэширования на iPhone 17 в Safari.
- Масштабное расширение диалогов друзей (всего добавлено 155 сцен):
  - Диалоги друзей между собой (`DATA.FCHAT`, 88 сцен вместо 20):
    - Расширены базовые пары: Жучок и Пуся на кухне (23 диалога суммарно), Москит и Монти на балконе (21 диалог суммарно).
    - Добавлены новые кросс-визиты (`src/friends.js`): Пуся на балконе у Монти (6 диалогов), Монти на кухне у Пуси (5 диалогов), Жучок на балконе у Монти (5 диалогов), Монти в прихожей у Жучка (4 диалога), Москит на кухне у Пуси (5 диалогов), Пуся в ванной у Москита (4 диалога), Жучок в ванной у Москита (4 диалога), Москит в прихожей у Жучка (4 диалога).
    - Расширен праздничный чат «Все вместе» `party`: 12 персонализированных сценок с живым добрым юмором.
  - Личные разговоры Абибяна с каждым другом (`DATA.FRIENDS[id].chat`, 67 сцен вместо 39):
    - Пуся: 16 сцен (+7 новых).
    - Монти: 16 сцен (+7 новых).
    - Москит: 16 сцен (+7 новых).
    - Жучок: 19 сцен (+7 новых).
- Верификация (Armbian homelab root@192.168.10.8:1488):
  - `test/r15.js`: 25 passed, 0 failed.
  - `test/r23.js test21`: 9 passed, 0 failed.
  - `test/r26.js`: 19 passed, 0 failed.
  - `test/r27.js`: 20 passed, 0 failed.
  - `test/r28.js`: 63 passed, 0 failed.
  - Суммарно 136 проверок Playwright пройдены успешно без единой ошибки.






## Voice & Friends Collision Update (Round 35):
- Нейроозвучка Абибяна настроена точно по спектральному профилю живых референсов владельца (`assets/voice_src/` и `assets/voice_backup/voice_rec_all.js`):
  - `TTS_UP = 1.095`: повышение тона на 1.5 полутона (F0 медиана 611 Гц вместо 557 Гц, цель — 619–662 Гц) и ускорение темпа речи на 9.5%.
  - DSP в WebAudio: `highpass(220 Hz)` отсекает бубнящий гул, параметрический буст `peaking(2500 Hz, Q 1.2, +3.5 dB)` даёт характерный задорный и писклявый тембр обезьянки, `lowpass(7200 Hz)` отсекает резкие призвуки.
  - Межсловная пауза сокращена до 0.045 с.
  - Мастер-компрессор гарантирует отсутствие клиппинга (пик шины 0.90 dBFS).
- Траектории движения на кухне (`src/friends.js`, `src/home.js`):
  - Зона стола со стульями `[106..178] × [180..258]` теперь является непроходимым препятствием для наземных друзей.
  - Функция `walkTo` направляет персонажей по свободному коридору пола (y=272), исключая проход сквозь мебель.
  - `FRIENDS.behindTable()` перерисовывает стол и стулья спереди, если персонаж оказывается позади них.

## Birthday Polish & Mechanics Update (2026-11-20):
- **Коллизия Монти при сборе**:
  - При движении через центр комнаты наземные друзья (`walkTo`) проверяют зону Абибяна `crossMonkey` и обходят его по свободному нижнему коридору пола (`y=290`), не пересекая спрайт обезьянки.
  - Отрисовка друзей в `FRIENDS.render` разделена по Y-глубине: персонажи с `y > mk.y` отрисовываются перед обезьянкой, исключая графические артефакты.
- **Фотоальбом «Первый танец»**:
  - Танец во время празднования дня рождения Дашулика помечен флагом `noMoment: true`, чтобы не занимать альбомный слот «Первый танец».
- **Поедание тортиков друзьями**:
  - Для Монти, Пуси и Жучка созданы специальные позы `eat` с лапками, сведёнными к центру и удерживающими тарелочку на уровне груди.
  - Позиция тарелки с куском торта поднята к уровню лап (`y - 20` для Монти, `y - 16` для Пуси), тортик попадает прямо к мордочке и жующим щёчкам.
- **Реплика Дашиных секретов**:
  - Текст обновлён на множественное число: «А ещё я спрятал сердечки с секретами. Найдёшь?».
  - В `src/speech.js` и priority-бандл сгенерирован и внедрён чистый нейрозвуковой аудиоклип (2.8 с).
- **Сезонные окна**:
  - `winTick` отслеживает текущее время года (`winter` зимой / в сезон `newyear`).
  - При открытии окна зимой через 2.5 с летят снежинки, идёт пар изо рта, персонажи ёжатся от холода, и находящийся в комнате друг (или Абибян) комментирует и закрывает окно.
- **Тюнинг голоса Абибяна**:
  - `TTS_UP` поднят до 1.12 (голос быстрее и выше, звучит более озорно и живо).
  - WebAudio DSP: каскадный срез `highpass` 260/240 Гц, вырез резонанса 380 Гц и сглаживание атаки 15 мс устраняют любые взрывные щелчки и бубнящие перегрузки.
- **Ачивка на 24-летие**:
  - Достижение «24 секрета» (`dasha24`): цель — 24 найденных сердечка Дашулика, награда 50 монет. Проверяется автоматически при каждом открытии сердечка.

## Birthday Cake Gift, Cold Window Animation, Palm Tree Growth & Wardrobe Expansion (2026-11-20):
- **Подарок на день рождения — торт без монет**:
  - Убран старт со 100 монетами в начале праздника. Подарком от друзей теперь выступает сам праздничный торт («Мур! А наш подарок — этот большущий торт!»).
  - Друзья и Абибян дружно откусывают по кусочку торта (`bite()`), оставшиеся 2 кусочка убираются в холодильник (`s.inv.cake += 2`). Абибян радостно комментирует: «Оставшиеся кусочки я положил в холодильник!».
- **Анимация закрытия окон при холоде**:
  - Если в комнате нет друга, закрывающего окно, Абибян сам спешит его закрыть с динамической анимацией прыжков (`TRIPS.winClose`):
    - На балконе: подходит к столу, запрыгивает на стол (`y = 172`), затем на подоконник (`y = 132`), закрывает створку окна с озвучкой и репликой «Фух! Теперь тепло.», после чего спрыгивает обратно на пол.
    - В зале: подходит к спинке кровати (`x = 86, y = 246`), запрыгивает на изголовье кровати (`y = 178`), дотягивается до форточки, закрывает её и спрыгивает на пол.
- **Поэтапное выращивание пальмы на балконе**:
  - Пальма растёт постепенно на протяжении дней и поливов по 5 стадиям (0..4: Саженец, Молодая пальма, Подросшая пальма, Пышная пальма, Взрослая пальма).
  - Спрайт ствола и количество листьев в `R.FUR.tree` динамически меняются в зависимости от стадии (`treeStage`).
  - Вместимость и урожай бананов масштабируются со стадией: от 1 до 5 бананов, на старших стадиях сбор приносит 2–3 банана сразу, а на взрослой стадии есть шанс получить «Золотой урожай» (+5 бонусных монет).
- **Расширение гардероба и элитные цены**:
  - Добавлено 16 новых предметов одежды и аксессуаров во все слоты: Праздничный колпак, Берет художника, Сомбреро, Шлем викинга, Святой нимб (2200 монет), Очки авиатора, Пиксельные очки, Золотой монокль, Кибер-визор, Худи Фонкор, Кимоно самурая, Смокинг, Кибер-куртка, Мантия монарха (2500 монет), Штаны карго, Бархатные брюки, Золотая медаль, Бриллиантовая цепь (1700 монет), Плащ Легенды (1800 монет), Неоновые кроссы, Золотые ботинки (1400 монет).
  - Настроены уникальные пиксельные спрайты и отрисовка в `src/monkey.js`.

## Voice Consistency & Missing Speech Phrases Fix (2026-11-20):
- **Синтез недостающих фраз (устранение чтения по слогам)**:
  - Выявлены и сгенерированы 64 недостающие реплики и их подфразы (включая «Оставшиеся кусочки я положил в холодильник!», «Привет, Дашулик! Я Абибян, теперь я живу у тебя!», «Ура! Все пришли поздравить Дашулика!», «Фух! Теперь тепло.», «Ой! Сегодня же праздник!», «Ура! Желание обязательно сбудется!» и др.) через полный пайплайн: Silero TTS (v4_ru, xenia) → WORLD vocoder (pitch 570 Hz, formant 1.6, tempo 0.92) → FIR EQ (согласованный с референсами) → MP3 22.05 кГц mono.
  - В `SPEECH.words` добавлены отдельные слова («оставшиеся», «кусочки», «положил», «холодильник», «бодрячком», «хэллуин», «елочка», «отвалилась» и др.), чтобы даже при кастомном вводе слова звучали целиком, а не раскладывались на слоги.
  - В `PRIORITY_KEYS` (`build.py` и `src/voicebank.js`) добавлены 55 приоритетных фраз Дня Рождения и поздравления Даши — они вшиты прямо в первый JS-бандл с нулевой задержкой и доступны на Frame 0 без ожидания загрузки внешних текстовых файлов.
- **Единый тембр и тон голоса (устранение разнобоя)**:
  - Выровнен питч: `TTS_UP` возвращён к единому эталонному значению `1.0`, в `spell()` убран лишний множитель питча слогов (`r: 1.0` вместо `1.12`), благодаря чему целые фразы, отдельные слова и слоги звучат в одной тональности (570 Гц) без внезапных писклявых перепадов.
  - Очищен звуковой тракт WebAudio: убран жесткий двойной каскад `highpass` (260/240 Гц) и вырезы средних частот, создававшие эффект «голоса из жестяной банки». Установлен чистый вещательный тракт:
    - High-pass 150 Гц (Q=0.707) для полного среза задуваний и взрывных призвуков без ущерба для фундаментального тона;
    - Де-эссер (peaking 5400 Гц, -3.5 дБ) для мягкого звучания свистящих;
    - Сглаженная атака гейна (8 мс) для исключения щелчков в начале буферов.

## Round 37: Direct taps, iPhone 17 fullscreen, balance, lisping & friend cards (2026-11-21)
- **Direct Object Interactions & Swipe Navigation**:
  - Removed bottom action/nav buttons (`#nav-L`, `#nav-R`, `.acts`) in `src/ui.js`.
  - Room transitions now purely via horizontal swipe (`src/home.js`, swipe threshold lowered to 22 px for ultra-smooth gestures).
  - Direct object taps: tap fridge in kitchen -> food shop; tap bed in zal -> sleep/wake up; tap wardrobe in hall -> wardrobe; tap sink/faucet in bath -> wash with soap (`soapTap()`); tap palm on balcony -> water/fertilize.
  - In kitchen, only the food carousel (`#c-slot`, `#c-l`, `#c-r`) remains at the bottom for dragging food into the mouth.
- **iPhone 17 Fullscreen & Dynamic Island Fix**:
  - `src/fill.js`: `want = r.width > 0 && vh >= vw * 1.05` ensures full ambient canvas expansion on modern tall aspect ratios (iPhone 17, 19.5:9+).
  - Viewport extends to `screen.height` in PWA / standalone mode.
  - Dynamically updates `<meta name="theme-color">` to match ceiling color, removing the dark status bar blur under Dynamic Island.
- **Gameplay Balance & Difficulty**:
  - Catch game: removed falling hearts (`type = 'heart'`) to increase challenge.
  - Gym game: reduced Mosq sprite to `k: 1`, adjusted dumbbell offsets and sweat particles.
  - Tournament: buffed friends' progression starting from 65% on Monday, with multipliers 0.9..1.4 and min reference score 8.
- **Lisping Monkey Dialogue (шепелявость)**:
  - Added Russian lisping filter in `HOME.say()` (`с` -> `ш`, `С` -> `Ш`), e.g. «шпашибо», «я не шоглашен», «шлава». Speech audio bank keys preserve exact non-lisped strings for zero-latency audio playback.
- **Dialogue & Visit Polish**:
  - Pusya blocked from visiting Monty at night (`ROOMS.phase() === 'night'`), sunshine dialogues filtered out at night.
  - Autonomous monkey activity triggers only after 2 minutes (120 s) of user inactivity.
- **Achievements & Album Fixes**:
  - `src/state.js`: removed `|| DASHA.bday()` from `checkAch()` guard so achievements unlock and update correctly during birthday week.
  - Album group photos: expanded capture box to 176×176 px anchored at floor level (296 px), preventing character cropping (Pusya, Monty, Monkey).
- **Friend Info Cards**:
  - Added unique character traits to all friends in `DATA.FRIENDS` (`pusya`, `monty`, `mosq`, `zhuk`).
  - Switched Mosq and Zhuk card portraits in `friends_art.js` to sharp 3x pixel-art sprites.

