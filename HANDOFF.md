# Handoff проекта «Абибян» (подготовка к 21 ноября)

**Дата составления:** 17 ноября 2026 г., 00:17 (MSK)  
**Репозиторий:** `/Users/emoorpheus/Documents/antigravity/friendly-turing` (ветка `main`, HEAD `bd805cf`)  
**Сервер Homelab:** `192.168.10.8:8080` (сервис `abibyan-server`, `/root/projects/abibyan`, симлинк `/data/game`)  
**Целевая дата запуска:** 21.11.2026 (День рождения Дарьи, 24 года)

---

## 1. Ссылки на ключевые сборки и материалы

- **Тестовая репетиция (100k монет, разблокировано всё):**  
  `http://192.168.10.8:8080/test.html` (локальная сеть)  
  `https://emoorpheus.github.io/abibyan/test.html` (интернет)
- **Чистый запуск 21.11 (коробка на ковре, нулевой прогресс):**  
  `http://192.168.10.8:8080/fresh.html` (локальная сеть)  
  `https://emoorpheus.github.io/abibyan/fresh.html` (интернет)
- **Основная игра:**  
  `http://192.168.10.8:8080/index.html`  
  `https://emoorpheus.github.io/abibyan/`
- **Файлы открытки для печати (A4 -> A5 буклет):**
  - Внешняя сторона (Обложка + QR): [`dist/abibyan-card-outer.png`](file:///Users/emoorpheus/Documents/antigravity/friendly-turing/dist/abibyan-card-outer.png) (300 DPI, 3508×2479 px)
  - Внутренняя сторона (Стол + письмо): [`dist/abibyan-card-inner.png`](file:///Users/emoorpheus/Documents/antigravity/friendly-turing/dist/abibyan-card-inner.png) (300 DPI, 3508×2479 px)
  - Векторный PDF (двусторонний): [`dist/abibyan-card.pdf`](file:///Users/emoorpheus/Documents/antigravity/friendly-turing/dist/abibyan-card.pdf)
  - Ссылка в сети: `http://192.168.10.8:8080/dist/abibyan-card.pdf`

---

## 2. Что выполнено и полностью верифицировано

1. **Комплексные тесты игровых механик (ALL GREEN):**
   - `test/play.js` — стресс-тесты всех 5 мини-игр (`catch`, `vine`, `balloon`, `bongo`, `gym`): 0 ошибок, PASS.
   - `test/probe.js` — 20 цепочек состояний (шкалы голода, усталости, сна, кормления молоком, монет): `PROBE PASS`.
   - `test/persist.js` — сохранение/загрузка из `localStorage`, миграции версий: PASS.
   - `test/r15.js` — визиты друзей, спонтанные визиты, диалоги Жучка, Пуси, Монти, Москита: 25 из 25 PASS.
   - `test/r26.js` — шифрование записок фразой Даши (AES-GCM 256 бит, PBKDF2-SHA256, подсказка после 3 ошибок): 19 из 19 PASS.
   - `test/r28.js` — адаптация под экран iPhone 17 / iPhone 17 Pro Max, безопасные зоны Dynamic Island, шторка магазина: 58 из 58 PASS.
   - `tools/compat.js` — проверка синтаксиса и Web API на совместимость с Safari 15 (28 файлов, 0 проблем).
   - `test/party_verify.js` — праздник 21.11: раздача торта на тарелочках, танец друзей, акустический компас сердечек.
   - `test/test_r35_verify.js` — траектория Жучка на кухне огибает стол и стулья без прохода сквозь мебель (80 точек пути, 0 коллизий).

2. **Исправление падений в Service Worker на `file://`:**
   - В `build.py` вызовы `navigator.serviceWorker.getRegistrations()` и `caches.keys()` обёрнуты проверкой `location.protocol.indexOf('http') === 0`. Устранено падение тестов `The URL protocol of the current origin ('null') is not supported`.

3. **Синхронизация AES-GCM шифрования в тестах:**
   - В `src/dasha.js` добавлен флаг `dbg.unseal`, поддержанный в `test/r23.js`, что позволило изолированно тестировать логику поиска сердечек без конфликта с реальными зашифрованными записками. Секция `seq` в `test/r23.js` проходит на 100%.

4. **Генерация полиграфических файлов открытки (300 DPI):**
   - Файлы разбиты на отдельные страницы A4 (3508×2479 px):
     - `dist/abibyan-card-outer.png` — внешняя сторона (обложка + QR-код).
     - `dist/abibyan-card-inner.png` — внутренняя сторона (стол + линии для письма).

---

## 3. Выявленные проблемы и готовые решения (точки внимания)

### Проблема А: На iPhone нет звука до разрешения микрофона
- **Корневая причина:**  
  В `src/audio.js` (строка 11) функция `init()` выполняет:
  ```javascript
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
  ```
  В движке WebKit (iOS Safari) только что созданный `AudioContext` всегда имеет статус `'suspended'`. Метод `ac.resume()` вызывался только при повторных вызовах `init()`, если `ac` уже существовал, но **не вызывался при первичном создании**.  
  В результате `ac` оставался на паузе вплоть до сцены задувания свечей, где в `micStart()` стоял явный вызов `ac.resume()`.
- **Готовое решение (в `src/audio.js`):**  
  Сразу после создания контекста добавить явный вызов `resume()`:
  ```javascript
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
  try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  silent();
  ```
  Это обеспечит звук с первого же клика/тапа по экрану (при открытии коробки), независимо от микрофона.

---

### Проблема Б: Верстка открытки (наложение текста и системный шрифт)
- **Корневая причина:**  
  1. В `tools/card.py` блок `.in` имел виртуальную высоту `height: 148mm` с `zoom: 1.29`. Из-за этого карточка приветствия упиралась в отметку 132 мм, а футер *«Мы все тебя очень любим!»* стоял на `bottom: 8.5mm` (отметка 132.5 мм), наезжая прямо поверх последней строки текста.
  2. Шрифты подключались через относительные пути `../../assets/fonts/...`. При рендере через Chromium в режиме `file://` пути блокировались браузером, и шрифт откатывался в стандартный системный Serif (Times New Roman).
- **Готовое решение (в `tools/card.py`):**  
  1. Закодировать 4 шрифта (`comfortaa700.woff2`, `caveat700.woff2`, `nunito400.woff2`, `nunito700.woff2`) напрямую в CSS через `data:font/woff2;base64,...`. Это на 100% исключит fallback на Times New Roman.
  2. Задать координаты на честную высоту A5 (197 мм): сместить карточку на `top: 86mm`, а футер опустить на `bottom: 12mm` (появится 4-5 см чистого пространства между ними).

---

### Проблема В: Отображение зеркала в прихожей (`src/hall.js`)
- **Корневая причина:**  
  В `src/hall.js` (функция `reflect()`):
  1. На изображение отражения накладывается серая заливка `#c9d6dc` с прозрачностью 0.28 (`source-atop`), из-за чего обезьянка выглядит грязно-мутной.
  2. Поверх лица персонажа накладываются жесткие пиксели бликов `P.p(mx + 5 + k, ...)` из буфера `P`, перечеркивая мордочку грубыми белыми линиями.
- **Готовое решение (в `src/hall.js`):**  
  Смягчить наложение стекла (градиент вместо сплошной серой заливки) и перенести статичные блики под спрайт отражения, оставив сверху только динамический бегущий блик `me.shine`.

---

## 4. Сводная таблица измененных файлов рабочего каталога

| Файл | Статус | Суть изменений |
|---|---|---|
| `build.py` | Модифицирован | Защита от падений Service Worker на origin `file://` |
| `src/dasha.js` | Модифицирован | Добавлен хук `dbg.unseal` для тестов слотов |
| `test/r23.js` | Модифицирован | Поддержка зашифрованных записок в тестах `seq` |
| `test/test_r35_verify.js` | Модифицирован | Инициализация `AUDIO.init()` перед тестом речи |
| `tools/card.py` | В процессе | Подготовка base64-шрифтов и разрядка верстки |
| `dist/abibyan-card-*.png` | Сгенерированы | Отдельные файлы для печати внешней и внутренней стороны |

---

## 5. Инструкция по сборке и развертыванию

```bash
# 1. Сборка всех версий (index.html, test.html, fresh.html, PWA-архив):
python3 build.py

# 2. Быстрый прогон проверки всех ключевых механик:
node test/probe.js && node test/play.js && node test/persist.js && node test/r26.js

# 3. Синхронизация на homelab (192.168.10.8):
rsync -avz -e "ssh -p 1488 -i ~/.ssh/homelab_ed25519" dist/ root@192.168.10.8:/root/projects/abibyan/dist/
rsync -avz -e "ssh -p 1488 -i ~/.ssh/homelab_ed25519" src/ root@192.168.10.8:/root/projects/abibyan/src/
ssh -p 1488 -i ~/.ssh/homelab_ed25519 root@192.168.10.8 "cd /root/projects/abibyan && python3 build.py"
```
