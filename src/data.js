'use strict';
// ===== Game data / catalogs =====
const DATA = (() => {
  const FOODS = {
    milk: { name: 'Молочко', price: 2, food: 12, kg: 0.05, energy: 4, lvl: 1, desc: 'Тёплое молочко в бутылочке. Малыши обожают.' },
    puree: { name: 'Фруктовое пюре', price: 4, food: 17, kg: 0.08, fun: 3, lvl: 1, desc: 'Баночка яблочно-бананового пюре.' },
    banana: { name: 'Банан', price: 3, food: 12, kg: 0.12, lvl: 1, desc: 'Классика. Любимая еда.' },
    apple: { name: 'Яблоко', price: 3, food: 9, kg: 0.04, lvl: 1, desc: 'Хрустит! Почти не полнит.' },
    salad: { name: 'Салат', price: 6, food: 10, kg: -0.35, fun: -3, lvl: 1, desc: 'Худеем: −0,35 кг. Но скучно.' },
    porridge: { name: 'Каша', acc: 'кашу', price: 5, food: 22, kg: 0.2, energy: 5, lvl: 1, desc: 'Сытно и полезно.' },
    pancake: { name: 'Блинчик', acc: 'блинчик', price: 0, food: 16, fun: 4, kg: 0.12, lvl: 1, cook: 1, desc: 'Сам испёк на плите! Нужно молочко.' },
    watermelon: { name: 'Арбуз', price: 8, food: 18, kg: 0.15, fun: 4, lvl: 2, desc: 'Сочный летний арбуз.' },
    coffee: { name: 'Кофе', price: 6, food: 3, kg: 0.02, energy: 25, lvl: 2, age: 'teen', desc: '+25 энергии. Бодрит!' },
    icecream: { name: 'Мороженое', price: 7, food: 10, kg: 0.4, fun: 10, lvl: 2, desc: 'Пломбир с вишенкой.' },
    kvass: { name: 'Квас', price: 6, food: 6, kg: 0.35, fun: 8, lvl: 3, age: 'adult', desc: 'Для настоящих ценителей.' },
    doshirak: { name: 'Доширак', price: 5, food: 20, kg: 0.45, fun: 2, lvl: 3, age: 'kid', desc: 'Студенческая классика.' },
    pelmeni: { name: 'Пельмени', price: 10, food: 30, kg: 0.6, lvl: 4, age: 'kid', desc: 'Со сметанкой!' },
    shawarma: { name: 'Шаурма', acc: 'шаурму', price: 14, food: 35, kg: 0.8, fun: 5, lvl: 5, age: 'teen', desc: 'Большая, сочная. Пузо растёт.' },
    burger: { name: 'Бургер', price: 15, food: 38, kg: 0.9, fun: 5, lvl: 6, age: 'teen', desc: 'Двойной сыр. Путь к скуфу.' },
    cake: { name: 'Торт', price: 22, food: 30, kg: 1.1, fun: 20, lvl: 7, desc: 'Праздник каждый день.' },
    energy: { name: 'Энергетик', price: 15, food: 2, kg: 0.05, energy: 50, lvl: 3, age: 'teen', special: 1, desc: '+50 энергии.' },
    tea: { name: 'Диет-чай', price: 25, food: 2, kg: -1, lvl: 4, age: 'kid', special: 1, desc: 'Волшебный: −1 кг.' },
    potion: { name: 'Зелье радости', price: 20, food: 0, kg: 0, fun: 40, lvl: 5, special: 1, desc: '+40 веселья.' },
    fertilizer: { name: 'Удобрение', price: 18, lvl: 2, special: 1, nonfood: 1, desc: 'Дерево сразу даст 3 банана. Используй во дворе.' },
  };
  const FOOD_ORDER = ['milk', 'banana', 'apple', 'puree', 'porridge', 'doshirak', 'salad', 'coffee', 'kvass', 'icecream', 'watermelon', 'pelmeni', 'shawarma', 'burger', 'cake', 'pancake', 'energy', 'fertilizer', 'potion', 'tea'];
  const SLOTS = { hat: 'Шапки', glasses: 'Очки', top: 'Верх', bottom: 'Низ', neck: 'Шея', feet: 'Обувь' };
  const CLOTHES = {
    // hat (Шапки)
    headband: { slot: 'hat', name: 'Повязка', price: 35, lvl: 1 },
    cap: { slot: 'hat', name: 'Кепка', price: 40, lvl: 1 },
    bonnet: { slot: 'hat', name: 'Чепчик', price: 50, lvl: 1, age: 'baby', gift: 'baby' },
    panama: { slot: 'hat', name: 'Панамка', price: 60, lvl: 1, age: 'kid', gift: 'kid' },
    ushanka: { slot: 'hat', name: 'Ушанка', price: 120, lvl: 3 },
    propeller: { slot: 'hat', name: 'Кепка с пропеллером', price: 140, lvl: 4 },
    party_hat: { slot: 'hat', name: 'Праздничный колпак', price: 150, lvl: 1 },
    headphones: { slot: 'hat', name: 'Наушники', price: 150, lvl: 1, age: 'teen', gift: 'teen' },
    beret: { slot: 'hat', name: 'Берет художника', price: 220, lvl: 2 },
    fedora: { slot: 'hat', name: 'Шляпа-федора', price: 260, lvl: 1, age: 'adult', gift: 'adult' },
    cowboy: { slot: 'hat', name: 'Ковбойская шляпа', price: 280, lvl: 5, age: 'teen' },
    tophat: { slot: 'hat', name: 'Цилиндр', price: 400, lvl: 7, age: 'adult' },
    sombrero: { slot: 'hat', name: 'Сомбреро', price: 420, lvl: 3 },
    viking: { slot: 'hat', name: 'Шлем викинга', price: 950, lvl: 6, age: 'teen' },
    crown: { slot: 'hat', name: 'Корона', price: 1500, lvl: 10, age: 'adult' },
    halo: { slot: 'hat', name: 'Святой нимб', price: 2200, lvl: 9, age: 'adult' },
    bday_hat: { slot: 'hat', name: 'Вязаный колпачок', price: 3000, lvl: 1 },

    // glasses (Очки)
    round: { slot: 'glasses', name: 'Круглые очки', price: 60, lvl: 2 },
    sun: { slot: 'glasses', name: 'Тёмные очки', price: 90, lvl: 3, age: 'teen' },
    aviator: { slot: 'glasses', name: 'Очки авиатора', price: 280, lvl: 3, age: 'teen' },
    pixel: { slot: 'glasses', name: 'Пиксельные очки', price: 320, lvl: 6 },
    monocle: { slot: 'glasses', name: 'Золотой монокль', price: 500, lvl: 4, age: 'adult' },
    cyber_visor: { slot: 'glasses', name: 'Кибер-визор', price: 750, lvl: 5, age: 'teen' },

    // top (Верх)
    tank: { slot: 'top', name: 'Майка-алкоголичка', price: 30, lvl: 1, age: 'adult' },
    tshirt: { slot: 'top', name: 'Футболка «Банан»', price: 50, lvl: 1 },
    sailor: { slot: 'top', name: 'Тельняшка', price: 90, lvl: 2 },
    hawaii: { slot: 'top', name: 'Гавайская рубашка', price: 110, lvl: 4 },
    hoodie: { slot: 'top', name: 'Худи', price: 130, lvl: 3 },
    leather: { slot: 'top', name: 'Кожанка', price: 450, lvl: 1, age: 'young', gift: 'young' },
    foncor_hoodie: { slot: 'top', name: 'Худи Фонкор', price: 650, lvl: 4 },
    kimono: { slot: 'top', name: 'Кимоно самурая', price: 800, lvl: 5, age: 'teen' },
    tux: { slot: 'top', name: 'Смокинг', price: 850, lvl: 8, age: 'adult' },
    cyber_jacket: { slot: 'top', name: 'Кибер-куртка', price: 1200, lvl: 7, age: 'teen' },
    royal_robe: { slot: 'top', name: 'Мантия монарха', price: 2500, lvl: 10, age: 'adult' },

    // bottom (Низ)
    shorts: { slot: 'bottom', name: 'Джинсовые шорты', price: 45, lvl: 1 },
    sweats: { slot: 'bottom', name: 'Треники с лампасами', price: 70, lvl: 2 },
    cargo: { slot: 'bottom', name: 'Штаны карго', price: 260, lvl: 2 },
    royal_pants: { slot: 'bottom', name: 'Бархатные брюки', price: 800, lvl: 7, age: 'adult' },

    // neck (Шея)
    scarf: { slot: 'neck', name: 'Шарф', price: 40, lvl: 1 },
    bib: { slot: 'neck', name: 'Слюнявчик', price: 40, lvl: 1, age: 'toddler', gift: 'toddler' },
    bowtie: { slot: 'neck', name: 'Бабочка', price: 60, lvl: 3 },
    tie: { slot: 'neck', name: 'Галстук', price: 70, lvl: 1, age: 'school', gift: 'school' },
    medal: { slot: 'neck', name: 'Золотая медаль', price: 550, lvl: 4 },
    chain: { slot: 'neck', name: 'Золотая цепь', price: 600, lvl: 6, age: 'adult' },
    diamond_chain: { slot: 'neck', name: 'Бриллиантовая цепь', price: 1700, lvl: 8, age: 'adult' },
    cape: { slot: 'neck', name: 'Плащ Легенды', price: 1800, lvl: 1, age: 'legend', gift: 'legend' },

    // feet (Обувь)
    slippers: { slot: 'feet', name: 'Тапки', price: 35, lvl: 1 },
    sneakers: { slot: 'feet', name: 'Кроссовки', price: 120, lvl: 4 },
    keds: { slot: 'feet', name: 'Кеды', price: 140, lvl: 1, age: 'grown', gift: 'grown' },
    cyber_boots: { slot: 'feet', name: 'Неоновые кроссы', price: 750, lvl: 5, age: 'teen' },
    golden_boots: { slot: 'feet', name: 'Золотые ботинки', price: 1400, lvl: 8, age: 'adult' },
  };
  // decor: kind 'wall' | 'floor' | 'item'; for items: key in home.items and value
  const DECOR = {
    // kitchen:
    cactus: { kind: 'item', room: 'kitchen', key: 'cactus', v: 1, name: 'Кактус', desc: 'Колючий! Лучше не трогать', price: 35, lvl: 1, noShop: 1 },
    candles: { kind: 'item', room: 'kitchen', key: 'candles', v: 1, name: 'Свечи на стол', desc: 'Зажги, а потом задуй и загадай желание', price: 35, lvl: 1 },
    magnets: { kind: 'item', room: 'kitchen', key: 'magnets', v: 1, name: 'Магнитики', desc: 'На дверцу холодильника', price: 40, lvl: 1 },
    kettle: { kind: 'item', room: 'kitchen', key: 'kettle', v: 1, name: 'Чайник Polaris', desc: 'Стеклянный, с подсветкой. Тапни — закипит', price: 40, lvl: 1 },
    clock: { kind: 'item', room: 'kitchen', key: 'clock', v: 1, name: 'Часы (идут!)', desc: 'Настоящее время и кукушка', price: 70, lvl: 2, noShop: 1 },
    lamp: { kind: 'item', room: 'kitchen', key: 'lamp', v: 1, name: 'Торшер', desc: 'Тёплый свет на кухне', price: 90, lvl: 2 },
    micro: { kind: 'item', room: 'kitchen', key: 'micro', v: 1, name: 'Микроволновка', desc: 'Гудит, крутит тарелку и звенит «дзынь!»', price: 90, lvl: 2 },
    disco: { kind: 'item', room: 'kitchen', key: 'disco', v: 1, name: 'Диско-шар', desc: 'Цветные зайчики по стенам', price: 250, lvl: 5, noShop: 1 },

    // zal:
    poster: { kind: 'item', room: 'zal', key: 'poster', v: 1, name: 'Постер', desc: 'У него отклеивается уголок', price: 50, lvl: 1, noShop: 1 },
    nightlight: { kind: 'item', room: 'zal', key: 'nightlight', v: 1, name: 'Ночник-звёздочка', desc: 'Звёзды на потолке ночью', price: 60, lvl: 1, noShop: 1 },
    garland: { kind: 'item', room: 'zal', key: 'garland', v: 1, name: 'Гирлянда', desc: 'Тапни — сменит огоньки', price: 120, lvl: 3, noShop: 1 },
    guitar: { kind: 'item', room: 'zal', key: 'guitar', v: 1, name: 'Гитара в чехле', desc: 'Сыграет, как умеет. Открыть чехол — с «Детёныша»', price: 150, lvl: 2 },

    // bath:
    duck: { kind: 'item', room: 'bath', key: 'duck', v: 1, name: 'Резиновая уточка', desc: 'Плавает в ванне', price: 30, lvl: 1 },
    bathmat: { kind: 'item', room: 'bath', key: 'bathmat', v: 1, name: 'Коврик для ванны', desc: 'Мягко лапкам перед душем', price: 45, lvl: 1 },
    fern: { kind: 'item', room: 'bath', key: 'fern', v: 1, name: 'Папоротник', desc: 'В нём кто-то живёт…', price: 55, lvl: 2, noShop: 1 },
    washer: { kind: 'item', room: 'bath', key: 'washer', v: 1, name: 'Стиральная машина', desc: 'Стирает, полощет и отжимает под раковиной', price: 180, lvl: 3 },

    // hall:
    linux: { kind: 'item', room: 'hall', key: 'linux', v: 1, name: 'Приставка на Linux', desc: 'Тапни — из-за неё выглянет пингвин Tux', price: 60, lvl: 2 },
    router: { kind: 'item', room: 'hall', key: 'router', v: 1, name: 'Роутер GL.iNet', desc: 'Наверх этажерки. Тапни — перезагрузится', price: 60, lvl: 1 },
    figsN: { kind: 'item', room: 'hall', key: 'figsN', v: 1, name: 'Фигурки Nintendo', desc: 'Спайк, кротик Монти, гумба, Скромник, мишка', price: 70, lvl: 2 },
    toys: { kind: 'item', room: 'hall', key: 'toys', v: 1, name: 'Игрушки на полку', desc: 'Орангутанчики, лошадка, гномики, котик', price: 70, lvl: 2 },
    hornets: { kind: 'item', room: 'hall', key: 'hornets', v: 1, name: 'Фигурки Хорнет', desc: 'Две Хорнет из Silksong — у роутера', price: 80, lvl: 2 },
    figsSP: { kind: 'item', room: 'hall', key: 'figsSP', v: 1, name: 'Фигурки South Park', desc: 'Мистер Хэнки, пришелец и Полотенчик', price: 90, lvl: 3 },
    vacuum: { kind: 'item', room: 'hall', key: 'vacuum', v: 1, name: 'Робот-пылесос', desc: 'Убирает прихожую и катает Абибяна', price: 200, lvl: 3 },

    // balcony:
    gnome: { kind: 'item', room: 'balcony', key: 'gnome', v: 1, name: 'Садовый гном', desc: 'Пружинит, если тапнуть', price: 70, lvl: 2 },
    feeder: { kind: 'item', room: 'balcony', key: 'feeder', v: 1, name: 'Кормушка для птиц', desc: 'К ней прилетают птички', price: 70, lvl: 2 },
    flamingo: { kind: 'item', room: 'balcony', key: 'flamingo', v: 1, name: 'Фламинго', desc: 'Розовый и гордый', price: 80, lvl: 2 },
    lava: { kind: 'item', room: 'balcony', key: 'lava', v: 1, name: 'Лава-лампа', desc: 'В ней плавают пузыри', price: 90, lvl: 2 },
    radio: { kind: 'item', room: 'balcony', key: 'radio', v: 1, name: 'Радиоприёмник', desc: 'Играет весёлую песенку', price: 110, lvl: 3 },
    flowers: { kind: 'item', room: 'balcony', key: 'flowers', v: 1, name: 'Ящик с цветами', desc: 'Пахнут… апчхи!', price: 120, lvl: 3 },
    hammock: { kind: 'item', room: 'balcony', key: 'hammock', v: 1, name: 'Гамак', desc: 'Покачаться на балконе', price: 150, lvl: 3 },
    telescope: { kind: 'item', room: 'balcony', key: 'telescope', v: 1, name: 'Телескоп', desc: 'Смотреть на звёзды', price: 240, lvl: 5 },

    // tech:
    soundbar: { kind: 'item', room: 'zal', key: 'soundbar', v: 1, name: 'Sony BRAVIA Theater Bar 8', desc: 'Премиальный объёмный звук для ТВ', price: 800, lvl: 6, need: 'tv', tech: 1, fixed: 1 },
    switch2: { kind: 'item', room: 'zal', key: 'switch2', v: 1, name: 'Nintendo Switch 2', desc: 'Приставка к телевизору. Игра «Супер Абибян»', price: 1600, lvl: 7, need: 'tv', tech: 1, fixed: 1 },
    ps5: { kind: 'item', room: 'zal', key: 'ps5', v: 1, name: 'PS5 Pro', desc: 'Мощная приставка к телевизору. Игра «Банановые гонки»', price: 2400, lvl: 8, need: 'tv', tech: 1, fixed: 1 },
  };
  // things that were replaced by newer ones in real life: bought step by step (step 1 is what the flat starts with)
  const UPGRADES = {
    tv: { room: 'zal', name: 'Телевизор', steps: [{ v: 'none', name: 'Нет телевизора', none: 1 }, { v: 'hiper', name: 'Hiper 40″ IPS', price: 120, lvl: 2 }, { v: 'tcl', name: 'TCL 43″ QLED', price: 220, lvl: 3 },
      { v: 'digma', name: 'Digma Pro 50″ VA', price: 380, lvl: 4 }, { v: 'dexp', name: 'DEXP 55OCG 55″ OLED', price: 700, lvl: 6 }, { v: 'lg', name: 'LG G5 65″ OLED', price: 1500, lvl: 8 }] },
    // Round 6 E: the balcony desk starts empty; phone games need only the phone, the rest a computer (DATA.DEVS)
    pc: { room: 'balcony', name: 'Компьютер', steps: [{ v: 'none', name: 'Нет компьютера', none: 1 }, { v: 'old', name: 'Старый компьютер', price: 90, lvl: 2 }, { v: 'laptop', name: 'Ноутбук', price: 200, lvl: 3 }, { v: 'tower', name: 'Мощный компьютер', price: 400, lvl: 6 }] },
  };
  const ROOMS = [
    { id: 'balcony', name: 'Балкон' }, { id: 'kitchen', name: 'Кухня' }, { id: 'hall', name: 'Прихожая' }, { id: 'zal', name: 'Зал' }, { id: 'bath', name: 'Ванная' },
  ];
  // Round 6 E: where a game runs — the phone, or a computer at least this good (index in DEVS)
  const DEVS = ['phone', 'old', 'laptop', 'tower'], DEV_NAME = { phone: 'Телефон', old: 'Старый компьютер', laptop: 'Ноутбук', tower: 'Мощный компьютер', switch2: 'Nintendo Switch 2', ps5: 'PS5 Pro' };
  const BOUGHT9 = ['kettle', 'micro', 'candles', 'guitar', 'vacuum', 'router', 'hornets', 'toys', 'linux', 'figsN', 'figsSP', 'washer']; // Round 9 #2: free before v6
  const CONSOLES = ['switch2', 'ps5']; // Round 7 #6: console games run on the zal TV (GAMES.dev = the console's DECOR id); pay = coins per level × pay
  const PHONE = { name: 'Телефон', price: 50, desc: 'В нём мини-игры. Без телефона игры закрыты!' }; // Round 7: bought in the tutorial with the starting 60 coins
  // Round 7 #4: the tutorial (GAME.S.tut = index of the current step; done at TUT.length); games stay locked until it is done AND the phone is bought
  const TUT = [
    { id: 'pet', t: (n) => `Знакомься — это ${n}! Погладь его: нажми ему на голову.` },
    { id: 'needs', t: (n) => `Вверху — его шкалы: еда, веселье, энергия и чистота. Следи, чтобы они не пустели!`, btn: 'Понятно', at: '#s-food' },
    { id: 'phone', t: (n) => `Мини-игры живут в телефоне. Открой магазин и купи телефон — монет как раз хватит!`, at: '#h-shop' },
    { id: 'play', t: (n) => `Ура, телефон есть! Нажми на него вверху — там игры.`, at: '#h-phone' },
    // Round 13: a tour of the flat after the phone (the games are open already; «Дальше» on every step, the step also passes by itself)
    { id: 'rooms', tour: 1, auto: 'room', t: (n) => `В квартире 5 комнат. Листай их стрелками внизу или свайпом — загляни в соседнюю!`, btn: 'Дальше', at: '#nav-R' },
    { id: 'feed', tour: 1, auto: 'fed', t: (n, r) => (r === 'kitchen' ? `Кухня! Выбери еду стрелками внизу и перетащи её прямо на него — он поест.` : `Проголодается — корми его на кухне. Иди туда по светящейся стрелке.`), btn: 'Дальше', at: (r) => (r === 'kitchen' ? '#c-slot' : navTo('kitchen', r)) },
    { id: 'wash', tour: 1, auto: 'washed', t: (n, r) => (r === 'bath' ? `Ванная! Намыль его мылом, а потом смой пену душем.` : `Испачкался — веди его в ванную: мыло и душ там.`), btn: 'Дальше', at: (r) => (r === 'bath' ? '#a-soap' : navTo('bath', r)) },
    { id: 'sleep', tour: 1, auto: 'sleep', t: (n, r) => (r === 'zal' ? `Устал — выключи свет, и он ляжет спать. Разбудить — снова включи свет.` : `Спит он в зале: выключи там свет — и он ляжет в кровать.`), btn: 'Дальше', at: (r) => (r === 'zal' ? '#a-light' : navTo('zal', r)) },
    { id: 'friends', tour: 1, ev: 'friend', t: (n) => `В квартире живут друзья: Пуся, Монти, Москит и Жучок. Нажми на друга — поболтать, угостить, поиграть.`, btn: 'Дальше' },
    { id: 'gags', tour: 1, auto: 'gag', t: (n) => `Трогай всё подряд: окна, шкафы, ковёр, батарею… В квартире спрятано много приколов!`, btn: 'Дальше' },
    { id: 'walk', tour: 1, ev: 'walk', t: (n) => `Нажми на пустой пол — ${n} пойдёт туда. А на ковре в зале он станцует!`, btn: 'Дальше' },
    { id: 'shop', tour: 1, t: (n) => `В магазине — еда, вещи для дома и техника. Одежда — в гардеробе в прихожей.`, btn: 'Дальше', at: '#h-shop' },
    { id: 'grow', tour: 1, t: (n) => `Росток вверху — задания дня и рост. За задания дают монеты, а он подрастает.`, btn: 'Дальше', at: '#h-grow' },
    { id: 'ach', tour: 1, t: (n) => `Кубок — достижения. Собери их все! Вот и всё — дальше сам. Удачи!`, btn: 'Готово', at: '#h-ach' },
  ];
  // Round 13: the arrow at the bottom that leads to that room (rooms go in DATA.ROOMS order)
  function navTo(to, r) { const ids = ROOMS.map((q) => q.id), a = ids.indexOf(to), b = ids.indexOf(r); return a < 0 || b < 0 || a === b ? null : a < b ? '#nav-L' : '#nav-R'; }
  const GAMES = [
    { id: 'catch', dev: 'phone', name: 'Банановый ливень', icon: 'banana', iconKind: 'f', desc: 'Двигай Абибяна и лови бананы, прыгай за высокими. Кокосы бьют больно! Золотой банан — монетка.' },
    { id: 'vine', dev: 'old', age: 'kid', name: 'Лианы', icon: 'tree', iconKind: 'i', desc: 'Прыгай по веткам всё выше. Наклоняй влево-вправо. Ломкие ветки трескаются!' },
    { id: 'balloon', dev: 'old', age: 'kid', name: 'Воздушный шарик', icon: 'balloon', iconKind: 'i', desc: 'Жми, чтобы подлететь. Пролетай между колючими лианами.' },
    { id: 'bongo', dev: 'phone', name: 'Бонго-память', icon: 'drum', iconKind: 'i', desc: 'Запомни ритм и повтори его на барабанах. С каждым уровнем — длиннее.' },
    { id: 'gym', dev: 'laptop', age: 'teen', name: 'Качалка', icon: 'barbell', iconKind: 'i', desc: 'Жми, когда стрелка в зелёной зоне. Сжигает лишние килограммы!' },
    { id: 'stack', dev: 'tower', age: 'kid', name: 'Банановая башня', icon: 'stack', iconKind: 'i', desc: 'Кран носит ящики с бананами. Тапай — ящик падает на башню. Что свисает — отпиливается!' },
    { id: 'super', dev: 'switch2', pay: 3, name: 'Супер Абибян', icon: 'shroom', iconKind: 'i', desc: 'Беги направо до флажка! Тапай — прыжок, держи — выше. Прыгай грибам на головы, бей блоки «?» снизу, не падай в ямы.' },
    { id: 'roofs', dev: 'phone', age: 'kid', pay: 2, name: 'Крыши', icon: 'roofs', iconKind: 'i', desc: 'Беги по крышам города до флажка! Под бельём — прыгай низко, на козырёк — не прыгай: он подбросит сам. Упадёшь — шарик спасёт.' },
    { id: 'race', dev: 'ps5', pay: 4, name: 'Банановые гонки', icon: 'car', iconKind: 'i', desc: 'Гонка по шоссе! Веди машину пальцем, объезжай других, собирай бананы. Успей к финишу до конца времени!' },
  ];
  // every friend, in one place (FRIENDS, the save, the party, achievements all read this); Round 7 #2: + Жучок
  const FIDS = ['pusya', 'monty', 'mosq', 'zhuk'];
  const ACH = [
    // --- Уровни ---
    { id: 'lvl10', name: 'Бронзовый примат', desc: 'Достигни 10 уровня', goal: 10, val: (s) => s.lvl, coins: 25, tier: 'bronze', chain: 'lvl' },
    { id: 'lvl25', name: 'Серебряный примат', desc: 'Достигни 25 уровня', goal: 25, val: (s) => s.lvl, coins: 50, tier: 'silver', chain: 'lvl' },
    { id: 'lvl50', name: 'Золотой примат', desc: 'Достигни 50 уровня', goal: 50, val: (s) => s.lvl, coins: 100, tier: 'gold', chain: 'lvl' },

    // --- Еда и сытость ---
    { id: 'first_meal', name: 'Первый перекус', desc: 'Покорми Абибяна', goal: 1, val: (s) => s.stats.fed, coins: 10, tier: 'bronze', chain: 'fed' },
    { id: 'fed_silver', name: 'Сытый друг', desc: 'Покорми Абибяна 50 раз', goal: 50, val: (s) => s.stats.fed, coins: 35, tier: 'silver', chain: 'fed' },
    { id: 'fed_gold', name: 'Шеф-повар', desc: 'Покорми Абибяна 150 раз', goal: 150, val: (s) => s.stats.fed, coins: 80, tier: 'gold', chain: 'fed' },
    { id: 'gourmet', name: 'Гурман', desc: 'Попробуй 8 разных блюд', goal: 8, val: (s) => Object.keys(s.tried).length, coins: 30, tier: 'silver' },
    { id: 'skuf', name: 'Настоящий скуф', desc: 'Откорми до скуфа (в любом возрасте)', goal: 1, val: (s) => fat(s.kg, (AGES[s.grow.stage] || AGES[0]).kg) >= SKUF ? 1 : 0, coins: 40, tier: 'silver' },
    { id: 'slim', name: 'Фитоняшка', desc: 'Взрослым похудей до 7 кг после 11+ кг', goal: 1, val: (s) => (s.grow.stage >= AGE.adult && (s.stats.maxKgA || 0) >= 11 && s.kg <= 7) ? 1 : 0, coins: 40, tier: 'gold' },

    // --- Чистота ---
    { id: 'clean10', name: 'Чистюля', desc: 'Помой Абибяна 10 раз', goal: 10, val: (s) => s.stats.washed, coins: 25, tier: 'bronze', chain: 'clean' },
    { id: 'clean50', name: 'Сияющий мех', desc: 'Помой Абибяна 50 раз', goal: 50, val: (s) => s.stats.washed, coins: 50, tier: 'silver', chain: 'clean' },
    { id: 'clean150', name: 'Стерильный босс', desc: 'Помой Абибяна 150 раз', goal: 150, val: (s) => s.stats.washed, coins: 100, tier: 'gold', chain: 'clean' },

    // --- Сон и уют ---
    { id: 'sleepy', name: 'Соня', desc: 'Поспи 10 минут в сумме', goal: 600, val: (s) => Math.floor(s.stats.slept), coins: 25, fmt: (v) => Math.floor(v / 60) + ' мин', tier: 'bronze' },
    { id: 'fashion', name: 'Модник', desc: 'Купи 5 вещей', goal: 5, val: (s) => s.stats.boughtClothes, coins: 30, tier: 'silver' },
    { id: 'designer', name: 'Дизайнер', desc: 'Купи 5 вещей для дома', goal: 5, val: (s) => s.stats.boughtDecor, coins: 30, tier: 'silver' },

    // --- Мини-игры ---
    { id: 'g_catch', name: 'Бананоед', desc: '10 уровень в «Банановом ливне»', goal: 10, val: (s) => s.best.catch, coins: 30, tier: 'bronze' },
    { id: 'g_vine', name: 'Тарзан', desc: '10 уровень в «Лианах»', goal: 10, val: (s) => s.best.vine, coins: 30, tier: 'bronze' },
    { id: 'g_balloon', name: 'Аэронавт', desc: '10 уровень в «Шарике»', goal: 10, val: (s) => s.best.balloon, coins: 30, tier: 'bronze' },
    { id: 'g_bongo', name: 'Ритм-мастер', desc: '10 уровень в «Бонго»', goal: 10, val: (s) => s.best.bongo, coins: 30, tier: 'bronze' },
    { id: 'g_gym', name: 'Качок', desc: '10 уровень в «Качалке»', goal: 10, val: (s) => s.best.gym, coins: 30, tier: 'bronze' },
    { id: 'g_stack', name: 'Прораб', desc: '10 уровень в «Банановой башне»', goal: 10, val: (s) => s.best.stack || 0, coins: 40, tier: 'silver' },
    { id: 'g_super', name: 'Супер-прыгун', desc: '10 уровень в «Супер Абибяне»', goal: 10, val: (s) => s.best.super || 0, coins: 60, tier: 'silver' },
    { id: 'g_race', name: 'Гонщик', desc: '10 уровень в «Банановых гонках»', goal: 10, val: (s) => s.best.race || 0, coins: 70, tier: 'gold' },

    // --- Богатство ---
    { id: 'rich', name: 'Копилка', desc: 'Заработай 500 монет', goal: 500, val: (s) => s.totalCoins, coins: 30, tier: 'bronze', chain: 'rich' },
    { id: 'rich2500', name: 'Банкир', desc: 'Заработай 2500 монет', goal: 2500, val: (s) => s.totalCoins, coins: 70, tier: 'silver', chain: 'rich' },
    { id: 'rich10000', name: 'Миллионер', desc: 'Заработай 10000 монет', goal: 10000, val: (s) => s.totalCoins, coins: 150, tier: 'gold', chain: 'rich' },

    // --- Ласка и общение ---
    { id: 'talk', name: 'Болтушка', desc: 'Поболтай с Абибяном 5 раз', goal: 5, val: (s) => s.stats.petted || 0, coins: 15, tier: 'bronze', chain: 'pet' },
    { id: 'pet50', name: 'Обнимашки', desc: 'Погладь Абибяна 50 раз', goal: 50, val: (s) => s.stats.petted, coins: 25, tier: 'silver', chain: 'pet' },
    { id: 'pet200', name: 'Главный ласкун', desc: 'Погладь Абибяна 200 раз', goal: 200, val: (s) => s.stats.petted, coins: 75, tier: 'gold', chain: 'pet' },

    // --- Фотографии ---
    { id: 'photo', name: 'Фотограф', desc: 'Сделай фото', goal: 1, val: (s) => s.stats.photos, coins: 10, tier: 'bronze', chain: 'photo' },
    { id: 'photo10', name: 'Фотокорреспондент', desc: 'Сделай 10 снимков', goal: 10, val: (s) => s.stats.photos, coins: 35, tier: 'silver', chain: 'photo' },
    { id: 'photo30', name: 'Папарацци', desc: 'Сделай 30 снимков', goal: 30, val: (s) => s.stats.photos, coins: 80, tier: 'gold', chain: 'photo' },

    // --- Желания ---
    { id: 'wants10', name: 'Исполнитель желаний', desc: 'Исполни 10 желаний', goal: 10, val: (s) => s.stats.wants, coins: 25, tier: 'bronze', chain: 'wants' },
    { id: 'wants40', name: 'Добрый джинн', desc: 'Исполни 40 желаний', goal: 40, val: (s) => s.stats.wants, coins: 60, tier: 'silver', chain: 'wants' },
    { id: 'wants100', name: 'Повелитель судеб', desc: 'Исполни 100 желаний', goal: 100, val: (s) => s.stats.wants, coins: 120, tier: 'gold', chain: 'wants' },

    // --- Серия посещений ---
    { id: 'streak7', name: 'Неделя дружбы', desc: 'Заходи 7 дней подряд', goal: 7, val: (s) => s.daily.best || 0, coins: 35, tier: 'bronze', chain: 'streak' },
    { id: 'streak21', name: 'Верный друг', desc: 'Заходи 21 день подряд', goal: 21, val: (s) => s.daily.best || 0, coins: 75, tier: 'silver', chain: 'streak' },
    { id: 'streak50', name: 'Неразлучные', desc: 'Заходи 50 дней подряд', goal: 50, val: (s) => s.daily.best || 0, coins: 150, tier: 'gold', chain: 'streak' },

    // --- Дуэли с друзьями ---
    { id: 'duelist', name: 'Дуэлянт', desc: 'Выиграй 5 дуэлей у друзей', goal: 5, val: (s) => FIDS.reduce((n, k) => n + ((s.friends && s.friends[k] && s.friends[k].w) || 0), 0), coins: 25, tier: 'bronze', chain: 'duels' },
    { id: 'duelist20', name: 'Мастер дуэлей', desc: 'Выиграй 20 дуэлей у друзей', goal: 20, val: (s) => FIDS.reduce((n, k) => n + ((s.friends && s.friends[k] && s.friends[k].w) || 0), 0), coins: 60, tier: 'silver', chain: 'duels' },
    { id: 'duelist50', name: 'Чемпион ринга', desc: 'Выиграй 50 дуэлей у друзей', goal: 50, val: (s) => FIDS.reduce((n, k) => n + ((s.friends && s.friends[k] && s.friends[k].w) || 0), 0), coins: 120, tier: 'gold', chain: 'duels' },

    // --- Задания дня ---
    { id: 'tasks10', name: 'Работяга', desc: 'Выполни 10 заданий дня', goal: 10, val: (s) => s.stats.tasks || 0, coins: 25, tier: 'bronze', chain: 'tasks' },
    { id: 'tasks50', name: 'Стахановец', desc: 'Выполни 50 заданий дня', goal: 50, val: (s) => s.stats.tasks || 0, coins: 70, tier: 'silver', chain: 'tasks' },
    { id: 'tasks150', name: 'Герой труда', desc: 'Выполни 150 заданий дня', goal: 150, val: (s) => s.stats.tasks || 0, coins: 150, tier: 'gold', chain: 'tasks' },

    // --- Взросление и сад ---
    { id: 'garden', name: 'Садовник', desc: 'Собери 20 бананов с дерева', goal: 20, val: (s) => s.stats.harvested, coins: 25, tier: 'bronze' },
    { id: 'grow1', name: 'Подрос!', desc: 'Вырасти до Детёныша', goal: 1, val: (s) => s.grow.stage >= AGE.kid ? 1 : 0, coins: 30, tier: 'bronze', chain: 'grow' },
    { id: 'grow2', name: 'Переходный возраст', desc: 'Вырасти до Подростка', goal: 1, val: (s) => s.grow.stage >= AGE.teen ? 1 : 0, coins: 50, tier: 'silver', chain: 'grow' },
    { id: 'grow3', name: 'Совсем взрослый', desc: 'Вырасти до Взрослого', goal: 1, val: (s) => s.grow.stage >= AGE.adult ? 1 : 0, coins: 80, tier: 'gold', chain: 'grow' },
    { id: 'grow4', name: 'Легенда двора', desc: 'Стань Легендой', goal: 1, val: (s) => s.grow.stage >= AGE.legend ? 1 : 0, coins: 150, tier: 'gold', chain: 'grow' },
    { id: 'care7', name: 'Заботливый', desc: '7 дней заботы', goal: 7, val: (s) => s.grow.days, coins: 40, tier: 'bronze' },

    // --- Друзья и события ---
    { id: 'bff', name: 'Лучшие друзья', desc: 'Поболтай с Пусей, Монти, Москитом и Жучком', goal: 4, val: (s) => FIDS.filter((k) => s.friends && s.friends[k] && s.friends[k].chat > 0).length, coins: 20, tier: 'silver' },
    { id: 'tastes', name: 'Знаток вкусов', desc: 'Узнай любимую еду Пуси, Монти, Москита и Жучка', goal: 4, val: (s) => FIDS.filter((k) => s.friends && s.friends[k] && s.friends[k].known && Object.values(s.friends[k].known).includes('fav')).length, coins: 30, tier: 'silver' },
    { id: 'chef', name: 'Блинный мастер', desc: 'Испеки 10 блинчиков', goal: 10, val: (s) => s.stats.pancakes || 0, coins: 25, tier: 'silver' },
    { id: 'laundry', name: 'Прачечная', desc: 'Постирай 5 раз', goal: 5, val: (s) => s.stats.washes || 0, coins: 20, tier: 'bronze' },
    { id: 'explorer', name: 'Всё потрогал', desc: 'Найди 25 приколов в квартире', goal: 25, val: (s) => Object.keys((s.gags && s.gags.seen) || {}).length, coins: 40, tier: 'silver' },
    { id: 'party', name: 'Все в сборе', desc: 'Устрой вечеринку «Все вместе»', goal: 1, val: (s) => s.stats.parties || 0, coins: 20, tier: 'bronze' },
    { id: 'bestie', name: 'Не разлей вода', desc: 'Стань лучшим другом для кого-нибудь', goal: 1, val: (s) => FIDS.some((k) => s.friends && s.friends[k] && (s.friends[k].lv || 0) >= 3) ? 1 : 0, coins: 50, tier: 'gold' },
    { id: 'champ', name: 'Чемпион недели', desc: 'Займи 1-е место в турнире недели', goal: 1, val: (s) => (s.tour && s.tour.wins) || 0, coins: 50, tier: 'gold' },
    { id: 'dasha24', name: '24 секрета', desc: 'Найди все 24 спрятанных сердечка Дашулика', goal: 24, val: (s) => Object.keys((s.dasha && s.dasha.found) || {}).length, coins: 50, cond: (s) => !!(s && ((s.ach && s.ach.dasha24) || (s.dasha && Object.keys(s.dasha.found || {}).length > 0))), tier: 'gold' },
  ];
  const achList = (s) => ACH.filter((a) => !a.cond || a.cond(s));
  const visibleAchs = (s) => {
    const all = achList(s);
    const seen = new Set();
    const res = [];
    for (const a of all) {
      if (a.chain) {
        if (seen.has(a.chain)) continue;
        seen.add(a.chain);
        const chainItems = all.filter((x) => x.chain === a.chain);
        const active = chainItems.find((x) => !s.ach[x.id]);
        res.push(active || chainItems[chainItems.length - 1]);
      } else {
        res.push(a);
      }
    }
    return res;
  };
  const STAGES = [{ f: 0, name: 'Стройняшка' }, { f: 0.2, name: 'Упитанный' }, { f: 0.45, name: 'Пузатик' }, { f: 0.72, name: 'Скуф' }];
  const KG0 = 6, KG1 = 18.5; // fatness 0..1 maps to weight range
  const fat = (kg, k = 1) => Math.max(0, Math.min(1, (kg - KG0 * k) / ((KG1 - KG0) * k)));
  const stage = (kg, k = 1) => { const f = fat(kg, k); let s = STAGES[0]; for (const st of STAGES) if (f >= st.f) s = st; return s; }; // Round 6: a skuf at any age
  const SKUF = STAGES[3].f, skufKg = (k = 1) => KG0 * k + SKUF * (KG1 - KG0) * k;
  // ---- growth: the monkey grows up from care over many days (pts = care points, days = days with 30+ care) ----
  // Round 8: 10 smaller stages — the newborn keeps its size (44 px), every stage only a little taller (adult 70 px, was 108); Кроха, Малыш, Карапуз only babble («Э-э-э»), the adult can become a skuf
  const AGES = [
    // 10 stages: slow growth up to 90 days for the final Legend stage, proportional milestones
    { id: 'newborn', name: 'Кроха', pts: 0, days: 0, age: 0, s: 0.42, voice: 1.03, kg: 0.2, babble: 1, lines: 'baby' },
    { id: 'baby', name: 'Малыш', pts: 350, days: 5, age: 0.1, s: 0.443, voice: 1.02, kg: 0.3, babble: 1, lines: 'baby' },
    { id: 'toddler', name: 'Карапуз', pts: 700, days: 9, age: 0.2, s: 0.459, voice: 1.005, kg: 0.38, babble: 1, lines: 'baby' },
    { id: 'kid', name: 'Детёныш', pts: 1100, days: 14, age: 0.3, s: 0.486, voice: 0.99, kg: 0.45, lines: 'kid' },
    { id: 'school', name: 'Школьник', pts: 1500, days: 18, age: 0.45, s: 0.514, voice: 0.98, kg: 0.53, lines: 'kid' },
    { id: 'teen', name: 'Подросток', pts: 2000, days: 23, age: 0.6, s: 0.544, voice: 0.965, kg: 0.62, lines: 'teen' },
    { id: 'young', name: 'Юнец', pts: 2600, days: 28, age: 0.75, s: 0.565, voice: 0.955, kg: 0.7, lines: 'teen' },
    { id: 'grown', name: 'Молодой', pts: 3600, days: 38, age: 0.88, s: 0.596, voice: 0.95, kg: 0.8, lines: 'teen' },
    { id: 'adult', name: 'Взрослый', pts: 5200, days: 56, age: 1, s: 0.621, voice: 0.94, kg: 1, perk: 'вырос совсем большим' },
    { id: 'legend', name: 'Легенда', pts: 8000, days: 90, age: 1, s: 0.623, voice: 0.93, kg: 1, legend: 1, perk: 'ежедневный подарок ×2' },
  ];
  // the Round 6/7 table (7 stages) — v4 saves keep their stage by id, the weight follows the new factor
  const AGES_V4 = [
    { id: 'newborn', kg: 0.2 }, { id: 'baby', kg: 0.3 }, { id: 'kid', kg: 0.45 }, { id: 'teen', kg: 0.62 }, { id: 'young', kg: 0.8 }, { id: 'adult', kg: 1 }, { id: 'legend', kg: 1 },
  ];
  // items name the stage they open at ('kid' | 'teen' | 'adult'); turned into stage indices once, so the rules compare numbers
  const AGE = {}; AGES.forEach((a, i) => { AGE[a.id] = i; });
  for (const o of [...Object.values(FOODS), ...Object.values(CLOTHES), ...GAMES]) if (typeof o.age === 'string') { if (!(o.age in AGE)) throw new Error('unknown age ' + o.age); o.age = AGE[o.age]; }
  for (const o of Object.values(CLOTHES)) if (typeof o.gift === 'string') o.gift = AGE[o.gift]; // Round 17: the growth-party gift of that stage
  const GIFT = (i) => Object.keys(CLOTHES).find((id) => CLOTHES[id].gift === i) || null;
  // daily care cap; per-source caps stop spamming one action
  const GROW = { cap: 100, dayMin: 30, caps: { friend: 8, pet: 10, sleep: 15, game: 30, food: 30, wash: 18, want: 20, harvest: 8, mic: 3, photo: 2, water: 2 } };
  // daily tasks: progress = stats[k] growth since the day started
  const TASKS = [
    { id: 'feed', t: 'Покорми 4 раза', k: 'fed', n: 4, coins: 15, ic: ['f', 'banana'], care: 1 },
    { id: 'wash', t: 'Искупай под душем', k: 'washed', n: 1, coins: 15, ic: ['i', 'shower'], care: 1 },
    { id: 'sleep', t: 'Уложи спать на 3 минуты', k: 'slept', n: 180, coins: 15, ic: ['i', 'moon'], care: 1, fmt: (v) => Math.floor(v / 60) + '/3 мин' },
    { id: 'pet', t: 'Погладь 15 раз', k: 'petted', n: 15, coins: 12, ic: ['i', 'heart'] },
    { id: 'tickle', t: 'Пощекочи пузико 6 раз', k: 'tickled', n: 6, coins: 12, ic: ['i', 'fun'] },
    { id: 'levels', t: 'Пройди 3 уровня в мини-играх', k: 'levels', n: 3, coins: 20, ic: ['i', 'game'] },
    { id: 'gcoins', t: 'Заработай 15 монет в играх', k: 'gameCoins', n: 15, coins: 20, ic: ['i', 'coin'] },
    { id: 'harvest', t: 'Собери 3 банана с дерева', k: 'harvested', n: 3, coins: 15, ic: ['i', 'tree'] },
    { id: 'water', t: 'Полей банановое дерево', k: 'watered', n: 1, coins: 10, ic: ['i', 'can'] },
    { id: 'wants', t: 'Исполни 2 желания', k: 'wants', n: 2, coins: 20, ic: ['i', 'star'] },
    { id: 'photo', t: 'Сделай фото на память', k: 'photos', n: 1, coins: 10, ic: ['i', 'camera'] },
    { id: 'cloth', t: 'Примерь наряд в гардеробе', k: 'cloth', n: 1, coins: 10, ic: ['i', 'shirt'] },
  ];
  const TASK = {}; for (const t of TASKS) TASK[t.id] = t;
  // what opens up at growth stage i (foods, clothes, games with age === i)
  function unlocks(i) {
    const n = []; for (const id of FOOD_ORDER) if ((FOODS[id].age || 0) === i) n.push(FOODS[id].name);
    for (const g of GAMES) if ((g.age || 0) === i) n.push('игра «' + g.name + '»');
    for (const id in CLOTHES) if ((CLOTHES[id].age || 0) === i) n.push(CLOTHES[id].name);
    if (AGES[i] && AGES[i].perk) n.push(AGES[i].perk); return n;
  }

  // ---- friends (NPC plushies from the owner's photos). Scenes: ['f'|'a', text, mood] — 'a' lines are pre-spoken by the monkey (tools/lines.js) ----
  const FRIENDS = {
    pusya: { name: 'Пуся', she: 1, voice: 'purr', tag: 'Пушистая кошечка. Мурлычет и делает массаж.', home: 'kitchen', duel: 'd_catch',
      trait: 'добрая и ласковая кошечка. Обожает мурлыкать, дремать на кухне и делать Абибяну расслабляющий массаж.',
      sp: { id: 'massage', name: 'Массаж', icon: 'heart', cd: 1200, desc: '+бодрость, +веселье' },
      chat: [
        [['f', 'Мур-р… Привет, Абибян!'], ['a', 'Привет, Пушя! Как дела?'], ['f', 'Мур-мур! Лучше всех!', 'happy']],
        [['f', 'Знаешь, почему кошки любят компьютер?'], ['a', 'Почему?'], ['f', 'Следят за мышкой! Мур-хи-хи!', 'happy'], ['a', 'Ха-ха-ха!', 'happy']],
        [['a', 'Пушя, а ты умеешь мурлыкать?'], ['f', 'Мур-р-р-р-р…', 'happy'], ['a', 'Как трактор!', 'happy']],
        [['f', 'Мур… Я сегодня спала целых три раза.'], ['a', 'Вот это шоня!']],
        [['f', 'У тебя такие мягкие ушки!'], ['a', 'Шпашибо! А у тебя хвоштик пушиштый!'], ['f', 'Мур!', 'happy']],
        [['a', 'Пушя, давай дружить вшегда!'], ['f', 'Мур-р… Мы уже друзья навсегда!', 'happy']],
        [['f', 'Я поймала солнечного зайчика!'], ['a', 'А где он?'], ['f', 'Убежал… Мур.']],
        [['f', 'Хочешь, расскажу секрет?'], ['a', 'Хочу!'], ['f', 'Я тебя люблю! Мур-р!', 'happy'], ['a', 'И я тебя!', 'happy']],
        [['a', 'Пушя, что ты любишь больше вшего?'], ['f', 'Тёплое молочко и обнимашки!', 'happy']],
        [['f', 'Мур-р… Ты меня любишь?'], ['a', 'Я тебя люблю!'], ['f', 'Мур-мур! А как сильно?', 'happy'], ['a', 'Я тоже тебя люблю!'], ['f', 'Мур-р-р… Обними меня!', 'happy'], ['a', 'Обними меня!']],
        [['f', 'Мур… Я самая красивая кошечка?'], ['a', 'Ты милый!'], ['f', 'Мур-хи-хи! А ты самый забавный!', 'happy'], ['a', 'Ты лучший!'], ['f', 'Мур! Мы оба лучшие!', 'happy'], ['a', 'Ура, дружба крепнет!']],
        [['f', 'Мур-р… Почеши мне за ушком!'], ['a', 'Почеши мне пузико!'], ['f', 'Мур! Договорились!', 'happy'], ['a', 'Приятно!']],
        [['f', 'Мур… Смотри, как я прыгаю!'], ['a', 'Шмотри, как я умею!'], ['f', 'Мур-мур! Вот это трюк!', 'happy'], ['a', 'Ха-ха-ха!']],
        [['f', 'Мур… Давай устроим праздник?'], ['a', 'Эй, вше шюда, тушим!'], ['f', 'Мур-дискотека!', 'happy'], ['a', 'Танцуют вше!'], ['f', 'Мур-мур-мур!', 'happy'], ['a', 'Дишкотека!']],
        [['f', 'Мур… Кто в доме красавчик?'], ['a', 'Кто это такой крашивый?'], ['f', 'Мур! Конечно мы оба!', 'happy'], ['a', 'Крашавчик!']]
      ],
      spGo: [['f', 'Мур-р… Ложись, сделаю массаж!']], spDone: [['a', 'Ох, как хорошо!', 'happy'], ['f', 'Мур! Теперь ты бодрячок!', 'happy']],
      spCd: 'Мур… Лапки отдыхают. Приходи позже!',
      visit: [['f', 'Мур… Тебе грустно? Я пришла!', 'happy'], ['a', 'Пушя! Как я рад!', 'happy']],
      hi: ['Мур!', 'Мяу!', 'Мур-р…'], bye: 'Мур… Пойду вздремну. Пока!', win: 'Мур! Я быстрее! Реванш?', lose: 'Мур… Ты ловкий! Молодец!' },
    monty: { name: 'Крот Монти', short: 'Монти', voice: 'mumble', tag: 'Старенький крот. Бормочет байки.', home: 'balcony', duel: 'd_bongo',
      trait: 'старенький мудрый крот. Постоянно бормочет себе под нос непонятные байки, безвредный и добрый как дедушка.',
      sp: { id: 'story', name: 'Байка', icon: 'chat', cd: 600, desc: '+веселье' },
      chat: [
        [['f', 'Бу-бу-бу… В наше время червяки были вот такие!'], ['a', 'Что-что, дедушка Монти?'], ['f', 'Бу-бу… говорю, вот такие!', 'happy']],
        [['a', 'Монти, шыграем в прятки?'], ['f', 'Бу-бу… Кроты всегда выигрывают. Мы же под землёй!', 'happy'], ['a', 'Нечештно!', 'happy']],
        [['f', 'Зубик мой… единственный… бу-бу…'], ['a', 'Береги его, Монти!']],
        [['f', 'Бу-бу… Где мои очки?'], ['a', 'Монти, ты же их не ношишь!'], ['f', 'Бу… То-то я их не вижу!', 'happy']],
        [['a', 'Монти, что ты копаешь?'], ['f', 'Бу-бу-бу… Метро! Для червячков.', 'happy'], ['a', 'Ого!']],
        [['f', 'Бу-бу… Молодёжь пошла… пушистая!'], ['a', 'Это я пушиштый!', 'happy']],
        [['a', 'Монти, рашшкажи что-нибудь!'], ['f', 'Бу-бу… бу-бу-бу… вот так-то!', 'happy'], ['a', 'Ничего не понял, но здорово!', 'happy']],
        [['f', 'В моё время… бу-бу… бананы росли под землёй!'], ['a', 'Правда?'], ['f', 'Бу… Нет. Шучу!', 'happy']],
        [['f', 'Бу-бу… Носом чую — дождик будет.'], ['a', 'А у меня нош чует бананы!', 'happy']],
        [['f', 'Бу-бу… Старый крот видит носом!'], ['a', 'А у меня нош чует бананы!'], ['f', 'Бу-бу… Бананы на кухне, а под землёй — клад!', 'happy'], ['a', 'Ого!'], ['f', 'Бу-бу… Клад из старых пуговиц!', 'happy'], ['a', 'Ха-ха, ну ты даёшь, Монти!']],
        [['f', 'Бу-бу-бу… Ты уже большой стал, Абибян.'], ['a', 'Я уже большой!'], ['f', 'Бу… А кроты с годами только мудреют.', 'happy'], ['a', 'Я почти взрошлый!'], ['f', 'Бу-бу… До крота ещё расти и расти!', 'happy'], ['a', 'Ого!']],
        [['f', 'Бу-бу… Сыграем в шахматы?'], ['a', 'Шыграем во что-нибудь!'], ['f', 'Бу… Червячки против жучков!', 'happy'], ['a', 'Давай играть!'], ['f', 'Бу-бу… Чур, я хожу первый!', 'happy'], ['a', 'Нечештно!']],
        [['f', 'Бу-бу… Я тебе сказку расскажу…'], ['a', 'Монти, рашшкажи что-нибудь!'], ['f', 'Бу-бу… Жил-был крот… и уснул! Хр-р…'], ['a', 'Ха-ха, ну ты даёшь, Монти!']],
        [['f', 'Бу-бу… Устал старый крот…'], ['a', 'Дай пошпать шначала!'], ['f', 'Бу… Вот и я говорю — тихий час!', 'happy'], ['a', 'Пора шпатеньки!']],
        [['f', 'Бу-бу… А дом у нас хороший, уютный.'], ['a', 'Мне нравитшя наш дом!'], ['f', 'Бу-бу… Особенно коврик мягкий!', 'happy'], ['a', 'Уютно у наш!']]
      ],
      stories: [
        [['f', 'Бу-бу… Расскажу байку…'], ['f', 'Иду я, значит… бу-бу… а червяк мне: бу-бу-бу!'], ['f', 'А я ему ка-ак… бу-бу!', 'happy']],
        [['f', 'Бу-бу… Было это давно…'], ['f', 'Прорыл я нору… бу-бу… а там — бабушка-крот!'], ['f', 'Бу-бу-бу! Вот так встреча!', 'happy']],
        [['f', 'Бу-бу… Слушай…'], ['f', 'Нашёл я морковку… бу-бу… а она — подушка!'], ['f', 'Бу-бу-бу! Ну и дела!', 'happy']],
      ],
      spDone: [['a', 'Ха-ха! Ну ты даёшь, Монти!', 'happy']], spCd: 'Бу-бу… Все байки рассказал. Приходи потом!',
      visit: [['f', 'Бу-бу-бу… Зашёл вот…', 'happy'], ['a', 'Привет, Монти!', 'happy']],
      hi: ['Бу-бу!', 'Бу?', 'Бу-бу-бу…'], bye: 'Бу-бу… Пойду я. Пока-пока!', win: 'Бу-бу… Старый крот — не промах!', lose: 'Бу-бу… Сбился старик. Молодец!' },
    mosq: { name: 'Москит', voice: 'buzz', tag: 'Добрый доктор. Его укус бодрит!', home: 'bath', duel: 'd_gym',
      trait: 'заботливый добрый доктор. Всегда готов измерить температуру и взбодрить целебным укусом.',
      sp: { id: 'bite', name: 'Укус', icon: 'energy', cd: 10800, desc: '+35 бодрости' },
      chat: [
        [['f', 'З-з-з! Так-с, пациент, на что жалуемся?'], ['a', 'На шкуку, доктор!'], ['f', 'Прописываю: играть и смеяться!', 'happy']],
        [['f', 'Откройте рот, скажите «А-а-а»!'], ['a', 'А-а-а!'], ['f', 'З-з-з! Здоров как банан!', 'happy']],
        [['f', 'Доктор прописывает: банан, сон и обнимашки!'], ['a', 'Обожаю такое лечение!', 'happy']],
        [['a', 'Доктор Мошкит, а вы болеете?'], ['f', 'Доктора не болеют! Ап-чхи!'], ['a', 'Будьте здоровы!', 'happy']],
        [['f', 'З-з-з… Мой хоботок — лучший градусник!'], ['a', 'А какая у меня температура?'], ['f', 'Тридцать шесть и банан!', 'happy']],
        [['a', 'Мошкит, ты летаешь вшю ночь?'], ['f', 'Ночью доктор спит! З-з-з… почти.'], ['a', 'Ха-ха!', 'happy']],
        [['f', 'Мойте лапки перед едой! З-з-з!'], ['a', 'Хорошо, доктор!']],
        [['f', 'Пульс в норме… Хвостик в норме…'], ['a', 'А ушки?'], ['f', 'Ушки — просто восторг!', 'happy']],
        [['f', 'З-з-з! Зарядка каждый день — и будешь сильным!'], ['a', 'Как вы, доктор?'], ['f', 'Как я! З-з-з!', 'happy']],
        [['f', 'З-з-з! Как самочувствие, пациент?'], ['a', 'Я полон шил!'], ['f', 'З-з! Прекрасно! А витамины пил?', 'happy'], ['a', 'Банан бы шейчаш!'], ['f', 'З-з-з! Банан — лучший витамин!', 'happy'], ['a', 'Хочу банан!']],
        [['f', 'З-з-з! Измеряем рост! Встаньте прямо!'], ['a', 'Шмотри, какой я большой!'], ['f', 'З-з! На целый сантиметр вырос!', 'happy'], ['a', 'Я рашту!'], ['f', 'З-з-з! И хвост вырос на два миллиметра!', 'happy'], ['a', 'Ха-ха-ха!']],
        [['f', 'З-з-з! Абибян, не сиди на сквозняке!'], ['a', 'Хорошо, доктор!'], ['f', 'З-з! А то придётся ставить горчичники!', 'happy'], ['a', 'Ай, ого, я полон шил!']],
        [['f', 'З-з-з! Пациент, вы слишком много улыбаетесь!'], ['a', 'Живот болит от шмеха!'], ['f', 'З-з! Диагноз: приступ безудержного веселья!', 'happy'], ['a', 'Ой, не могу, ха-ха!']],
        [['f', 'З-з-з! Кто сегодня готов к великим делам?'], ['a', 'Крашавчик!'], ['f', 'З-з! Прекрасный настрой! А зарядка?', 'happy'], ['a', 'Утро, пойду на зарядку!']],
        [['f', 'З-з-з! Доктор напоминает: чистые лапки — залог здоровья!'], ['a', 'Чиштенький!'], ['f', 'З-з! Блестишь как новенький!', 'happy'], ['a', 'Блештю!']]
      ],
      spGo: [['f', 'Так-с, сейчас будет чуточку щекотно! З-з-з!']], spPuk: 'Пук!', spDone: [['a', 'Ай! Ого! Я полон шил!', 'happy'], ['f', 'Будьте здоровы! З-з-з!', 'happy']],
      spCd: 'Укус бодрости — раз в три часа. Отдыхай!', spFull: 'Ты и так бодрячком! Приходи, когда устанешь.',
      visit: [['f', 'З-з-з! Вызывали доктора?', 'happy'], ['a', 'Доктор Мошкит!', 'happy'], ['f', 'Устал? Нажми на меня — укус бодрости!']],
      hi: ['З-з-з!', 'Привет, пациент!', 'З-з?'], bye: 'З-з-з! Не болей! Пока!', win: 'З-з-з! Доктор в отличной форме!', lose: 'З-з-з! Вот это силач! Восхищён!' },
    // Round 7 #2: Жучок — a tiny plush keychain bug from the key rack by the front door (IMG_7806/7807/7808); «жу-жу», not voiced
    zhuk: { name: 'Жучок', voice: 'chirr', tag: 'Крошка-брелок с ключей. Пушистый, как щёточка!', home: 'hall', duel: 'd_keys',
      // Round 15b #3 (the owner): not a thief himself, but always in on Абибян's adventures — together they secretly sneak treats
      trait: 'тихоня-авантюрист. Сам не ворует, но в любую авантюру с Абибяном — первым! Вместе они тайком таскают Пусины вкусняшки, а Жучок стоит на шухере.',
      sp: { id: 'brush', name: 'Щёточка', icon: 'clean', cd: 3600, desc: '+25 чистоты' },
      chat: [
        [['f', 'Жу-жу! Я вчера катался в кармане!'], ['a', 'А что ты видел?'], ['f', 'Темноту и одну конфетку! Жу-хи-хи!', 'happy']],
        [['a', 'Жучок, ты такой маленький!'], ['f', 'Маленький, да удаленький! Жу!', 'happy']],
        [['f', 'Жу! Смотри, какие у меня крылышки!'], ['a', 'Крашивые! А летать умеешь?'], ['f', 'Только когда меня подбрасывают! Жу-у-у!', 'happy']],
        [['a', 'Жучок, тебе не шкучно на крючке?'], ['f', 'Жу! Тут ключики — они звенят и болтают!', 'happy']],
        [['f', 'Жу-жу! Я пушистый, как щёточка!'], ['a', 'А я пушиштый, как я!'], ['f', 'Жу-хи-хи! Мы оба пушистики!', 'happy']],
        [['a', 'Ты крашавчик, Жучок!'], ['f', 'Жу-у! Я весь в стежках — это модно!', 'happy']],
        [['a', 'Жучок, а ты кушаешьшя?'], ['f', 'Жу! Я только щекочусь!'], ['a', 'Ой, щекотно! Ха-ха!', 'happy']],
        [['f', 'Жу-жу! Я брелок-счастливчик. Загадывай желание!'], ['a', 'Одно, но большое!'], ['f', 'Жу! Записал! Сбудется!', 'happy']],
        [['f', 'Жу! Я знаю все ключики в доме!'], ['a', 'И какой шамый главный?'], ['f', 'Тот, что от холодильника! Жу-хи-хи!', 'happy']],
        [['f', 'Жу-жу… А помнишь, как мы стащили варенье?'], ['a', 'Тшш! Это шекрет!'], ['f', 'Жу! Я — могила!', 'happy']],
        [['f', 'Жу-жу! Если что — прикрою! Я на шухере лучше всех!', 'happy'], ['a', 'Ты крашавчик, Жучок!', 'happy'], ['f', 'Жу! На том и стоим!', 'happy']],
        [['f', 'Жу! Я сам ничего не беру. Я только помогаю!'], ['a', 'Ты лучший помощник!'], ['f', 'Жу-хи-хи! Тайный помощник!', 'happy']],
        [['f', 'Жу-жу! Пойдём на вылазку?'], ['a', 'Ешть шекретное дело!'], ['f', 'Жу! Пуся уснула на кухне!', 'happy'], ['a', 'Пушя шпит, а в холодильнике вкушняшки!'], ['f', 'Жу-хи-хи! Я на стрёме!', 'happy'], ['a', 'Я в деле, ты на шухере!']],
        [['f', 'Жу-жу! А если Пуся проснётся?'], ['a', 'Ешли что!'], ['f', 'Жу! Скажем, искали салфетки!', 'happy'], ['a', 'Мы прошто мимо проходили!'], ['f', 'Жу-хи-хи! Отличный план!', 'happy'], ['a', 'Тшш, это наш шекрет!']],
        [['f', 'Жу-жу! А ты меня не выдашь?'], ['a', 'Тшш, это шекрет!'], ['f', 'Жу! И я тебя не выдам!', 'happy'], ['a', 'Ты лучший помощник!'], ['f', 'Жу-хи-хи! Друзья навек!', 'happy'], ['a', 'Ты мой друг!']],
        [['f', 'Жучок на крючке скучает…'], ['a', 'Пойдем поиграем!'], ['f', 'Жу! Во что поиграем?', 'happy'], ['a', 'Во что поиграем?'], ['f', 'В прятки! Я спрячусь в замочную скважину!', 'happy'], ['a', 'Нечештно!']],
        [['f', 'Жу! Ты меня уважаешь?'], ['a', 'Ты крашавчик, Жучок!'], ['f', 'Жу-жу! А ты?'], ['a', 'Крашавчик!'], ['f', 'Жу-хи-хи! Два красавчика!', 'happy'], ['a', 'Ха-ха-ха!']],
        [['f', 'Жу-жу! Смотри, как блестят ключики!'], ['a', 'Крашота!'], ['f', 'Жу! А мы с тобой ещё красивее!', 'happy'], ['a', 'Причешка огонь!']]
      ],
      spGo: [['f', 'Жу-жу! Стой смирно — сейчас почищу!']], spDone: [['a', 'Ой, щекотно! Ха-ха!', 'happy'], ['f', 'Блестишь, как новый ключик! Жу!', 'happy']],
      spCd: 'Жу… Щёточка отдыхает. Приходи через часик!', spFull: 'Жу-жу! Ты и так чистенький!',
      visit: [['f', 'Жу-жу! Я пришёл тебя почистить!', 'happy'], ['a', 'Жучок! Привет, малыш!', 'happy'], ['f', 'Ты чуть-чуть пыльный. Нажми на меня — щёточка!']],
      hi: ['Жу-жу!', 'Жу?', 'Жу-жу, привет!'], bye: 'Жу-жу! Мне пора на крючок. Пока!', win: 'Жу-жу! Я помню все ключики!', lose: 'Жу! Вот это память! Молодец!' },
  };
  const PILLOW_LINES = { carrot: ['…привет', 'ой…', '…', '…спасибо'], carrotHug: '…тепло…', pepper: ['Я самый острый!', 'Огонь!', 'Перец — это стиль!', 'Кто тут лучший? Я!', 'Остренько, да?'], pepperHug: 'Полегче, я же острый!' };
  // friend duels: own rules on top of the solo games' art
  // ---- Round 5: tastes (★ fav, likes, hates), reactions (friends speak in creature sounds — not voiced), daily whims; friendship levels ----
  Object.assign(FRIENDS.pusya, { taste: { fav: 'milk', like: ['puree', 'icecream', 'cake', 'pancake', 'porridge'], bad: ['salad', 'apple', 'coffee', 'energy', 'kvass'] },
    eat: { fav: 'Мур-р-р! Молочко! Обожаю!', like: ['Мур! Вкусно!', 'Мяу! Ещё кусочек?', 'Мур, спасибо!'], meh: ['Мур… Съедобно.', 'Ну… Спасибо, мур.'], bad: ['Фр-р! Не буду!', 'Мяу! Фу-фу-фу!'],
      badOf: { salad: 'Траву? Я же не корова! Фр-р!', apple: 'Яблоко? Я же кошка! Фр-р!' }, full: 'Мур… Я наелась. Потом!', crave: 'Мур-р! То, что я хотела!', gift: 'Мур! Я тебе гостинец принесла!', sulk: 'Фр-р… Не хочу. Я обиделась.' } });
  Object.assign(FRIENDS.monty, { taste: { fav: 'porridge', like: ['pelmeni', 'doshirak', 'kvass', 'apple', 'pancake', 'banana'], bad: ['icecream', 'coffee', 'energy'] },
    eat: { fav: 'Бу-бу! Кашка! Как у бабушки!', like: ['Бу-бу… Хорошо пошло!', 'Ням… Бу-бу!', 'Сытый крот — добрый крот!'], meh: ['Бу… Сойдёт.', 'Бу-бу… Спасибо.'], bad: ['Бу-бу! Не по-нашему!', 'Бр-р! Не надо!'],
      badOf: { icecream: 'Бр-р! Зубик мёрзнет!', coffee: 'Бу-бу! Мне кофе нельзя, давление!' }, full: 'Бу-бу… Больше не лезет!', crave: 'Бу-бу-бу! Угадал!', gift: 'Бу-бу… Вот, гостинец принёс.', sulk: 'Бу-бу… Не буду. Обиделся я.' } });
  Object.assign(FRIENDS.mosq, { taste: { fav: 'watermelon', like: ['salad', 'apple', 'banana', 'tea', 'milk'], bad: ['burger', 'shawarma', 'doshirak', 'cake', 'energy'] },
    eat: { fav: 'З-з-з! Арбуз! Сочно!', like: ['З-з! Витамины!', 'Полезно! З-з-з!', 'Вот это по-докторски!'], meh: ['З-з… Допустимо.', 'Ну… Приемлемо, з-з.'], bad: ['Это вредно! Как доктор говорю!', 'З-з-з! Фу, жирное!'],
      badOf: { energy: 'З-з-з! Сердечко не казённое!' }, full: 'Доктор сыт! З-з-з.', crave: 'З-з-з! Как ты угадал?!', gift: 'З-з-з! Витаминчик для пациента!', sulk: 'З-з… Доктор не в духе.' } });
  Object.assign(FRIENDS.zhuk, { taste: { fav: 'pancake', like: ['apple', 'banana', 'tea', 'watermelon', 'icecream'], bad: ['coffee', 'shawarma', 'kvass', 'energy', 'doshirak'] },
    eat: { fav: 'Жу-у-у! Блинчик! Самый вкусный!', like: ['Жу! Вкусно!', 'Жу-жу! Ещё крошечку?', 'Жу, спасибо!'], meh: ['Жу… Съедобно.', 'Ну… Спасибо, жу.'], bad: ['Жу-жу! Не буду!', 'Жу! Фу-фу!'],
      badOf: { coffee: 'Жу! От кофе я зажужжу на всю ночь!', energy: 'Жу-у! Я и так шустрый!' }, full: 'Жу… Я крошечный, больше не влезет!', crave: 'Жу-жу! Как раз этого хотел!', gift: 'Жу! Нашёл тебе гостинец в кармане!', sulk: 'Жу… Не хочу. Я обиделся.' } });
  // friendship: points to reach each level, coins for it, what it gives; names by gender
  const FSHIP = { at: [0, 50, 150, 350, 750], coins: [0, 15, 30, 50, 100], m: ['Знакомый', 'Приятель', 'Друг', 'Лучший друг', 'Друг навек'], f: ['Знакомая', 'Приятельница', 'Подруга', 'Лучшая подруга', 'Подруга навек'],
    perk: ['', 'приносит гостинцы, когда приходит в гости', 'особый приём чаще (перезарядка −25%)', 'приходит в гости чаще и с гостинцами', 'особый приём вдвое чаще'],
    mood: { happy: ['счастлив', 'счастлива'], ok: ['доволен', 'довольна'], meh: ['скучает', 'скучает'], sulky: ['обиделся', 'обиделась'] } };
  // «Все вместе»: what the friends say at a party (creature sounds — not voiced)
  // Round 15: the friends visit each other (Жучок ↔ Пуся, Москит ↔ Монти) and talk among themselves; 'guest>host' → dialogs [who, text, pose]
  // Round 15b #3: «Вылазка» — Абибян and Жучок sneak Пуся's treats from the fridge while she naps (FRIENDS.heist)
  const HEIST = {
    plan: [['a', 'Жучок! Ешть шекретное дело…'], ['f', 'Жу! Я в деле! А какое?'], ['a', 'Пушя шпит, а в холодильнике — вкушняшки!'], ['f', 'Жу-хи-хи! Я на шухере!', 'happy']],
    offer: ['Жу-жу… Тсс! Пуся задремала. Вылазка?', 'Жу! Тсс… Есть дело. Пойдём за вкусняшками?'],
    yes: [['a', 'Я в деле! Ты на шухере!', 'happy'], ['f', 'Жу-хи-хи! Поехали!', 'happy']],
    tiptoe: [['a', 'Тшш… На цыпочках…']],
    caught: [['p', 'Мур?! Кто тут шуршит?'], ['a', 'Мы… прошто мимо проходили!'], ['f', 'Жу… Это сквозняк! Жу!'], ['p', 'Мур… Сквозняк… Ну ладно…']],
    home: [['f', 'Жу-хи-хи! Удачная вылазка!', 'happy'], ['a', 'Тшш! Это наш шекрет!', 'happy']],
    empty: [['a', 'Ой… Тут пушто!'], ['f', 'Жу… Кто-то нас опередил!']],
  };
  // Round 17: the growth party ('a' lines are his — voiced; the friends' ones are creature sounds)
  const GPARTY = {
    surprise: { pusya: 'Мур! Сюрприз! С новым этапом!', monty: 'Бу-бу! Сюрприз! Ты подрос!', mosq: 'З-з-з! Сюрприз! Ты вырос!', zhuk: 'Жу-жу! Сюрприз! С новым этапом!' },
    wow: ['Ого! Это вшё для меня?', 'Вот это праздник!'],
    blow: { pusya: 'Мур! Задувай свечку!', monty: 'Бу-бу… Загадай желание!', mosq: 'З-з! Дуй сильнее!', zhuk: 'Жу! Задувай! Раз, два, три!' },
    cheer: { pusya: 'Мур-р! С днём роста!', monty: 'Бу-бу! Расти большой!', mosq: 'З-з-з! Ура-а-а!', zhuk: 'Жу-жу! Ура! Ура!' },
    gift: { pusya: 'Мур! А это тебе подарок!', monty: 'Бу-бу… Держи, это от всех нас!', mosq: 'З-з-з! Подарок! Открывай скорее!', zhuk: 'Жу-жу! Это тебе! Я сам завязывал бантик!' },
    thanks: ['Ух ты! Как раз по размеру!', 'Шпашибо, друзья! Мне так нравитшя!'], coins: ['Шпашибо, друзья! Куплю что-нибудь!'],
    photo: ['Праздничное фото! Вше в кадр!'], bye: ['Это лучший праздник!', 'Шпашибо, друзья! Приходите ещё!'],
  };
  // Round 16: the gag map names (the album page «Приколы»)
  const GAG_NAMES = { pigeon: 'Голубь', bed: 'Кровать', curtains: 'Шторы', nightlight: 'Ночник', window: 'Окно', knob: 'Ручка батареи', valve: 'Вентиль', radiator: 'Батарея', poster: 'Постер', rug: 'Ковёр', garland: 'Гирлянда',
    parcel: 'Посылка', bell: 'Звонок', rack: 'Сушилка', plafond: 'Плафон', router: 'Роутер', linux: 'Линукс', hornet: 'Хорнеты', toys: 'Игрушки', figs: 'Фигурки', vacuum: 'Пылесос',
    stove: 'Плита', cactus: 'Кактус', clock: 'Часы', cabinet: 'Шкафчик', drawer: 'Ящик', candles: 'Свечи', chair: 'Стул', sofa: 'Диван', gondola: 'Гондола',
    washer: 'Стиралка', sconce: 'Бра', sink: 'Кран', rail: 'Змеевик', aid: 'Аптечка', frog: 'Лягушка', cat: 'Коврик-кот', bathmat: 'Коврик', fresco: 'Ангелы',
    gnome: 'Гномик', flowers: 'Цветы', flamingo: 'Фламинго', hammock: 'Гамак', dig: 'Грядка' };
  const FCHAT = {
  "zhuk>pusya": [
    [
      [
        "zhuk",
        "Пуся, привет! Я тебе ключик принёс!"
      ],
      [
        "pusya",
        "Мур! А от чего он?"
      ],
      [
        "zhuk",
        "Не знаю! Зато блестит!",
        "happy"
      ],
      [
        "pusya",
        "Мур-р… Красивый!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а почему ты всё время спишь?"
      ],
      [
        "pusya",
        "Мур… Я не сплю. Я думаю с закрытыми глазами."
      ],
      [
        "zhuk",
        "Жу-жу! Я тоже так попробую!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, давай играть в прятки!"
      ],
      [
        "pusya",
        "Мур! Ты прячься, а я посижу."
      ],
      [
        "zhuk",
        "Жу! Так нечестно!"
      ],
      [
        "pusya",
        "Мур-хи-хи!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, у тебя на диване крошки!"
      ],
      [
        "pusya",
        "Мур… Это Абибян печенье ел!"
      ],
      [
        "zhuk",
        "Жу-жу! Вкусные крошки!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а ты ничего не теряла?"
      ],
      [
        "pusya",
        "Мур! Мои вкусняшки опять пропали!"
      ],
      [
        "zhuk",
        "Жу… Наверное, сквозняк унёс!"
      ],
      [
        "pusya",
        "Мур-р… Подозрительный сквозняк."
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, смотри, как я умею качаться!"
      ],
      [
        "pusya",
        "Мур… Не свались в миску с молоком!"
      ],
      [
        "zhuk",
        "Жу! Я буду молочным жуком!",
        "happy"
      ],
      [
        "pusya",
        "Мур-хи-хи! Смешной!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а холодильник ночью сам открывается?"
      ],
      [
        "pusya",
        "Мур… Только если Абибян не спит."
      ],
      [
        "zhuk",
        "Жу-жу! И если я на шухере!",
        "happy"
      ],
      [
        "pusya",
        "Мур! Я так и знала!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, давай я тебя почищу как щёточка!"
      ],
      [
        "pusya",
        "Мур-р… Давай за ушком!"
      ],
      [
        "zhuk",
        "Жу-жу-жу! Готово, блестишь!",
        "happy"
      ],
      [
        "pusya",
        "Мур-р… Какой полезный брелок.",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а почему у тебя хвост дёргается?"
      ],
      [
        "pusya",
        "Мур… Он живёт своей жизнью."
      ],
      [
        "zhuk",
        "Жу! Можно с ним поздороваться?"
      ],
      [
        "pusya",
        "Мяу! Только осторожно!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, я нашёл под диваном фантик!"
      ],
      [
        "pusya",
        "Мур! Это моё главное сокровище!"
      ],
      [
        "zhuk",
        "Жу-жу! Я положу его обратно!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а ты умеешь летать?"
      ],
      [
        "pusya",
        "Мур… Только во сне. Высоко-высоко!"
      ],
      [
        "zhuk",
        "Жу! Во сне все умеют!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, давай споём дуэтом?"
      ],
      [
        "pusya",
        "Мур-мур-мур…"
      ],
      [
        "zhuk",
        "Жу-жу-жу! Отличный хор!",
        "happy"
      ],
      [
        "pusya",
        "Мур-хи-хи!",
        "happy"
      ]
    ]
  ],
  "pusya>zhuk": [
    [
      [
        "pusya",
        "Жучок, ты опять висишь?"
      ],
      [
        "zhuk",
        "Жу-жу! Я сторожу ключи!",
        "happy"
      ],
      [
        "pusya",
        "Мур! Молодец, сторож!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, тебе не скучно на крючке?"
      ],
      [
        "zhuk",
        "Жу! Отсюда всё видно!"
      ],
      [
        "pusya",
        "Мур… А я снизу всё вижу."
      ],
      [
        "zhuk",
        "Жу-жу! Вместе всё видим!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, пойдём ко мне на диван?"
      ],
      [
        "zhuk",
        "Жу! А там мягко?"
      ],
      [
        "pusya",
        "Мур-р! Мягче всех!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, почему у тебя крошки на усиках?"
      ],
      [
        "zhuk",
        "Жу! Это… пыль! Я же щёточка!"
      ],
      [
        "pusya",
        "Мур… Пыль со вкусом мороженого?"
      ],
      [
        "zhuk",
        "Жу-хи-хи! Тайна!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, а кто там за дверью ходит?"
      ],
      [
        "zhuk",
        "Жу! Это соседи топают!"
      ],
      [
        "pusya",
        "Мур… Главное, чтобы не пылесос."
      ],
      [
        "zhuk",
        "Жу-жу! Пылесос тут не пройдёт!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, у тебя такие красивые ниточки!"
      ],
      [
        "zhuk",
        "Жу! Это ручная работа!"
      ],
      [
        "pusya",
        "Мур-р… Мягенький брелок.",
        "happy"
      ],
      [
        "zhuk",
        "Жу-хи-хи! Самый мягкий!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, посторожи мой сон пять минуточек?"
      ],
      [
        "zhuk",
        "Жу! Буду стоять на посту!"
      ],
      [
        "pusya",
        "Мур-р… Хрр…"
      ],
      [
        "zhuk",
        "Жу-жу! Спит без задних лап!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, а почему ключи звенят?"
      ],
      [
        "zhuk",
        "Жу! Они так рассказывают анекдоты!"
      ],
      [
        "pusya",
        "Мур… И какой самый смешной?"
      ],
      [
        "zhuk",
        "«Дзынь-дзынь»! Жу-хи-хи!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, не замёрз на крючке?"
      ],
      [
        "zhuk",
        "Жу! У меня пушистая спинка!"
      ],
      [
        "pusya",
        "Мур… А я всё равно погрею лапкой."
      ],
      [
        "zhuk",
        "Жу-жу! Спасибо, Пусечка!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, а вы с Абибяном сегодня шалили?"
      ],
      [
        "zhuk",
        "Жу… Мы? Ни за что на свете!"
      ],
      [
        "pusya",
        "Мур… А почему у тебя нос в варенье?"
      ],
      [
        "zhuk",
        "Жу-у! Раскусила!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, смотри, шнурок висит!"
      ],
      [
        "zhuk",
        "Жу! Это от ботинка!"
      ],
      [
        "pusya",
        "Мур… Но поиграть-то можно? Мяу!"
      ],
      [
        "zhuk",
        "Жу-жу! Лови его, лови!",
        "happy"
      ]
    ]
  ],
  "mosq>monty": [
    [
      [
        "mosq",
        "Монти, привет! Ты опять под землёй?"
      ],
      [
        "monty",
        "Бу-бу… Я копаю тоннель."
      ],
      [
        "mosq",
        "З-з-з! Куда?"
      ],
      [
        "monty",
        "К тебе в гости, бу-бу!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, а что ты там нашёл?"
      ],
      [
        "monty",
        "Бу-бу… Червячка. Он со мной дружит."
      ],
      [
        "mosq",
        "З-з! Передай ему привет!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, хочешь, я тебе спою?"
      ],
      [
        "monty",
        "Бу-бу… Только не над ухом!"
      ],
      [
        "mosq",
        "З-з-з-з-з!",
        "happy"
      ],
      [
        "monty",
        "Бу-бу-бу! Громко!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, ты видишь, какое небо?"
      ],
      [
        "monty",
        "Бу-бу… Я в очках не вижу. Но верю!"
      ],
      [
        "mosq",
        "З-з! Голубое-голубое!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, пациент, дышите глубже!"
      ],
      [
        "monty",
        "Бу-бу… Чем дышать? Землёй?"
      ],
      [
        "mosq",
        "З-з-з! Свежим балконным воздухом!"
      ],
      [
        "monty",
        "Бу-бу… Ну ладно. Вдох… хороший воздух!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, как ваше давление?"
      ],
      [
        "monty",
        "Бу-бу… Атмосферное давит!"
      ],
      [
        "mosq",
        "З-з-з! Прописываю чай с ромашкой!"
      ],
      [
        "monty",
        "Бу-бу… А печеньку к чаю?",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, а ты звёзды ночью считаешь?"
      ],
      [
        "monty",
        "Бу-бу… Я их на ощупь знаю."
      ],
      [
        "mosq",
        "З-з! Как это — на ощупь?"
      ],
      [
        "monty",
        "Бу-бу… Тёпленькие они!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, смотри, какой цветок вырос!"
      ],
      [
        "monty",
        "Бу-бу… Пахнет сладко."
      ],
      [
        "mosq",
        "З-з-з! Это Абибян поливал!"
      ],
      [
        "monty",
        "Бу-бу… Молодец малыш!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, давай зарядку сделаем! Лапки вверх!"
      ],
      [
        "monty",
        "Бу-бу… Старые лапки не поднимаются."
      ],
      [
        "mosq",
        "З-з! А хвостик?"
      ],
      [
        "monty",
        "Бу-бу-бу! Хвостик всегда готов!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, а правда, что кроты спят всю зиму?"
      ],
      [
        "monty",
        "Бу-бу… Не всю. Перекус по расписанию!"
      ],
      [
        "mosq",
        "З-з-з! Правильное питание — залог здоровья!"
      ]
    ],
    [
      [
        "mosq",
        "Монти, держи витаминку-росинку!"
      ],
      [
        "monty",
        "Бу-бу… Спасибо, доктор."
      ],
      [
        "mosq",
        "З-з! Теперь ты самый бодрый крот в доме!"
      ],
      [
        "monty",
        "Бу-бу! Пойду перекопаю балкон!",
        "happy"
      ]
    ]
  ],
  "monty>mosq": [
    [
      [
        "monty",
        "Москит, бу-бу! Тут мокро!"
      ],
      [
        "mosq",
        "З-з-з! Зато прохладно!"
      ],
      [
        "monty",
        "Бу-бу… Мне бы в землю."
      ]
    ],
    [
      [
        "monty",
        "Москит, а ты не устаёшь летать?"
      ],
      [
        "mosq",
        "З-з! А ты не устаёшь копать?"
      ],
      [
        "monty",
        "Бу-бу! Вот и поговорили!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, давай дружить крепко-крепко!"
      ],
      [
        "mosq",
        "З-з-з! Только не кусаться!",
        "happy"
      ],
      [
        "monty",
        "Бу-бу! Договорились!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, бу-бу… Что это капает?"
      ],
      [
        "mosq",
        "З-з-з! Это кран поёт песню!"
      ],
      [
        "monty",
        "Бу-бу… Без слуха поёт, фальшивит."
      ],
      [
        "mosq",
        "З-з! Зато от души!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, а зачем тут зеркало?"
      ],
      [
        "monty",
        "Бу-бу… Я подошёл, а там какой-то дед с усами!"
      ],
      [
        "mosq",
        "З-з-з! Так это же ты, Монти!"
      ],
      [
        "monty",
        "Бу-бу-бу! А я ещё ничего!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, бу-бу… Полотенце мягкое."
      ],
      [
        "mosq",
        "З-з! Укутайся, чтобы не простудиться!"
      ],
      [
        "monty",
        "Бу-бу… Уютно, как в норке.",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, а пена мыльная вкусная?"
      ],
      [
        "mosq",
        "З-з-з! Ни в коем случае не ешь!"
      ],
      [
        "monty",
        "Бу-бу… А пахнет клубникой."
      ],
      [
        "mosq",
        "З-з! Это шампунь Абибяна!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, бу-бу… Слышишь, стиралка гудит?"
      ],
      [
        "mosq",
        "З-з! Это она бельё отжимает!"
      ],
      [
        "monty",
        "Бу-бу… Прямо как землетрясение!"
      ],
      [
        "mosq",
        "З-з-з! Но домашнее и чистое!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, а у тебя крылышки промокают?"
      ],
      [
        "mosq",
        "З-з! Доктор всегда летает между капельками!"
      ],
      [
        "monty",
        "Бу-бу… Ловкий ты комарик.",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, бу-бу… Резиновая уточка на меня смотрит."
      ],
      [
        "mosq",
        "З-з-з! Она добрая, не бойся!"
      ],
      [
        "monty",
        "Бу-бу… Я ей подмигнул. Вроде своя!",
        "happy"
      ]
    ]
  ],
  "pusya>monty": [
    [
      [
        "pusya",
        "Мур-р… Монти, на балконе такое солнышко!"
      ],
      [
        "monty",
        "Бу-бу… Грейся, кошечка, грейся."
      ],
      [
        "pusya",
        "Мур… Полежу рядом с твоим ящиком!"
      ],
      [
        "monty",
        "Бу-бу… Только землю лапками не разбрасывай.",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Монти, а ты птичек за окном слышишь?"
      ],
      [
        "monty",
        "Бу-бу… Чирикают без умолку."
      ],
      [
        "pusya",
        "Мур! Я бы с ними поиграла… во сне!"
      ],
      [
        "monty",
        "Бу-бу-бу! Правильно, во сне безопаснее!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Монти, почему ты всё время в земле копаешься?"
      ],
      [
        "monty",
        "Бу-бу… Земля — она родная, тёплая."
      ],
      [
        "pusya",
        "Мур… А диван мягче!"
      ],
      [
        "monty",
        "Бу-бу… Каждому своё, Пуся.",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Мур! Монти, смотри, какой у меня пушистый хвост!"
      ],
      [
        "monty",
        "Бу-бу… Погладил… Ого, как шёлк!"
      ],
      [
        "pusya",
        "Мур-мур! Я за ним ухаживаю!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Монти, хочешь, я тебе сказку про мышку расскажу?"
      ],
      [
        "monty",
        "Бу-бу… Про полевую? Расскажи!"
      ],
      [
        "pusya",
        "Мур… Жила-была мышка, и мы с ней подружились!"
      ],
      [
        "monty",
        "Бу-бу! Хорошая добрая сказка!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Мур… Монти, ты такой спокойный дедушка."
      ],
      [
        "monty",
        "Бу-бу… Года берут своё."
      ],
      [
        "pusya",
        "Мур! Помурчу тебе, чтобы спина не болела!",
        "happy"
      ],
      [
        "monty",
        "Бу-бу-бу… Спасибо, ласковая.",
        "happy"
      ]
    ]
  ],
  "monty>pusya": [
    [
      [
        "monty",
        "Бу-бу… Пуся, чем это так вкусно пахнет?"
      ],
      [
        "pusya",
        "Мур! Абибяну блинчики пекли!"
      ],
      [
        "monty",
        "Бу-бу… А кротам блинчик положен?"
      ],
      [
        "pusya",
        "Мур-р! Если попросишь вежливо — обязательно!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Пуся, бу-бу… Какой у тебя диван мягкий."
      ],
      [
        "pusya",
        "Мур! Залезай, поделюсь подушкой!"
      ],
      [
        "monty",
        "Бу-бу… Эх, хорошо на пенсии!",
        "happy"
      ],
      [
        "pusya",
        "Мур-хи-хи!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Бу-бу… Пуся, а холодильник большой?"
      ],
      [
        "pusya",
        "Мур! Огромный! Там молочко и сыр!"
      ],
      [
        "monty",
        "Бу-бу… Прямо как продуктовая пещера!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Пуся, бу-бу… Чайник на плите свистит!"
      ],
      [
        "pusya",
        "Мур! Это он чай зовёт пить!"
      ],
      [
        "monty",
        "Бу-бу… Я с чабрецом люблю."
      ],
      [
        "pusya",
        "Мур-р… А я со сливками!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Бу-бу… Пуся, а ты мышей ловишь?"
      ],
      [
        "pusya",
        "Мур?! Зачем их ловить? Мы же все плюшевые!"
      ],
      [
        "monty",
        "Бу-бу-бу! Точно! Запамятовал старик!",
        "happy"
      ]
    ]
  ],
  "zhuk>monty": [
    [
      [
        "zhuk",
        "Монти! Дедушка Монти! Смотри, как я высоко прыгнул!"
      ],
      [
        "monty",
        "Бу-бу… Ого, кузнечик настоящий!"
      ],
      [
        "zhuk",
        "Жу! Я не кузнечик, я Жучок!",
        "happy"
      ],
      [
        "monty",
        "Бу-бу… Шустрый Жучок!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Монти, а ты научишь меня копать норы?"
      ],
      [
        "monty",
        "Бу-бу… Твоими лапками только пыль смахивать."
      ],
      [
        "zhuk",
        "Жу-жу! Зато я смахиваю со скоростью света!",
        "happy"
      ],
      [
        "monty",
        "Бу-бу-бу! Это ценный навык!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Монти, а в темноте не страшно?"
      ],
      [
        "monty",
        "Бу-бу… В темноте все свои."
      ],
      [
        "zhuk",
        "Жу! Я тоже темных карманов не боюсь!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Монти, я принёс тебе семечко!"
      ],
      [
        "monty",
        "Бу-бу… Какое круглое. Посадим в ящик!"
      ],
      [
        "zhuk",
        "Жу-жу! Вырастет дерево до потолка!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Монти, потри мою спинку!"
      ],
      [
        "monty",
        "Бу-бу… Потёр. Ой, заблестел!"
      ],
      [
        "zhuk",
        "Жу-хи-хи! Теперь я брелок повышенной яркости!",
        "happy"
      ]
    ]
  ],
  "monty>zhuk": [
    [
      [
        "monty",
        "Бу-бу… Жучок, сколько тут обуви стоит!"
      ],
      [
        "zhuk",
        "Жу! Я знаю все ботинки в доме!"
      ],
      [
        "monty",
        "Бу-бу… И какие самые удобные?"
      ],
      [
        "zhuk",
        "Жу-жу! Домашние тапочки с помпонами!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Жучок, бу-бу… Звонок в дверь громкий?"
      ],
      [
        "zhuk",
        "Жу! «Динь-дон» делает! Я всегда подпрыгиваю!"
      ],
      [
        "monty",
        "Бу-бу… От неожиданности?"
      ],
      [
        "zhuk",
        "Жу! От радости, что гости пришли!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Бу-бу… Жучок, ты такой крошечный."
      ],
      [
        "zhuk",
        "Жу! Мал золотник, да дорог!"
      ],
      [
        "monty",
        "Бу-бу… И в хозяйстве полезен.",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Жучок, а ключики тяжёлые?"
      ],
      [
        "zhuk",
        "Жу! Железные, звенящие! Я их обнимаю лапками!"
      ],
      [
        "monty",
        "Бу-бу-бу! Силач на вешалке!",
        "happy"
      ]
    ]
  ],
  "mosq>pusya": [
    [
      [
        "mosq",
        "З-з-з! Плановый осмотр пушистой кошечки!"
      ],
      [
        "pusya",
        "Мур… Доктор, я совершенно здорова."
      ],
      [
        "mosq",
        "З-з! Диагноз: избыток милоты и нехватка поглаживаний!"
      ],
      [
        "pusya",
        "Мур-р… Выписывайте рецепт на обнимашки!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "З-з-з! Пуся, покажите язык!"
      ],
      [
        "pusya",
        "Мяу… Розовый, шершавый."
      ],
      [
        "mosq",
        "З-з! Прекрасный язык! Молочко усваивается отлично!"
      ],
      [
        "pusya",
        "Мур-хи-хи! Ещё бы!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Пуся, замеряю пульс: мур-мур-мур…"
      ],
      [
        "pusya",
        "Мур-р… Шестьдесят мурлыканий в минуту."
      ],
      [
        "mosq",
        "З-з-з! Моторчик работает как часы!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Пуся, вам полезны пробежки по коридору!"
      ],
      [
        "pusya",
        "Мур… Доктор, бегать — это не по-королевски."
      ],
      [
        "mosq",
        "З-з! А тыгыдык в три часа ночи?!"
      ],
      [
        "pusya",
        "Мур… Ну это святое дело!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "З-з-з! Пуся, не кусай градусник!"
      ],
      [
        "pusya",
        "Мур… Я думала, это сосиска."
      ],
      [
        "mosq",
        "З-з! Докторские инструменты невкусные!"
      ],
      [
        "pusya",
        "Мур-хи-хи!",
        "happy"
      ]
    ]
  ],
  "pusya>mosq": [
    [
      [
        "pusya",
        "Мур-р… Москит, ты тут живёшь один?"
      ],
      [
        "mosq",
        "З-з-з! Со мной уточка и зубные щётки!"
      ],
      [
        "pusya",
        "Мур… Целая компания!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Москит, а включи капельку из крана?"
      ],
      [
        "mosq",
        "З-з! Кап-кап!"
      ],
      [
        "pusya",
        "Мур! Я поймаю капельку лапкой! Цап!"
      ],
      [
        "mosq",
        "З-з-з! Ловкая кошка!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Мур… Тут зеркало такое запотевшее."
      ],
      [
        "mosq",
        "З-з! Абибян купался в тёплой воде!"
      ],
      [
        "pusya",
        "Мур-р… Нарисую лапкой сердечко!",
        "happy"
      ],
      [
        "mosq",
        "З-з! Очень красиво получилось!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Москит, доктор, а от лени есть лекарство?"
      ],
      [
        "mosq",
        "З-з-з! Есть! Вкусный банан и зарядка!"
      ],
      [
        "pusya",
        "Мур… Банан беру, зарядку оставь себе!",
        "happy"
      ]
    ]
  ],
  "zhuk>mosq": [
    [
      [
        "zhuk",
        "Москит, привет! Ты летаешь, и я умею летать!"
      ],
      [
        "mosq",
        "З-з-з! Но у меня есть крылья, а у тебя?"
      ],
      [
        "zhuk",
        "Жу! А у меня цепочка пружинит! Жу-у-у!",
        "happy"
      ],
      [
        "mosq",
        "З-з-з! Отличный катапульт!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Москит, посмотри в зеркало — мы оба красавчики!"
      ],
      [
        "mosq",
        "З-з! Ты пушистый, а я стройный!"
      ],
      [
        "zhuk",
        "Жу-жу! Идеальная команда!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Москит, а почему в ванной эхо?"
      ],
      [
        "zhuk",
        "Жу-у-у-у-у!"
      ],
      [
        "mosq",
        "З-з-з-з-з!"
      ],
      [
        "zhuk",
        "Жу-хи-хи! Как в пещере!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Москит, доктор, посмотри мои усики!"
      ],
      [
        "mosq",
        "З-з-з! Симметричные, чистые, нарядные!"
      ],
      [
        "zhuk",
        "Жу! Я их сам причёсывал!",
        "happy"
      ]
    ]
  ],
  "mosq>zhuk": [
    [
      [
        "mosq",
        "З-з-з! Жучок, на посту не засыпаешь?"
      ],
      [
        "zhuk",
        "Жу! Ни в одном глазу! Глазки-бусинки открыты!"
      ],
      [
        "mosq",
        "З-з! Настоящий часовой!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Жучок, держи профилактическую пылинку!"
      ],
      [
        "zhuk",
        "Жу! Спасибо, доктор! Я её в карман спрячу!",
        "happy"
      ],
      [
        "mosq",
        "З-з-з! Только не в нос!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Жучок, а кто сегодня приходил?"
      ],
      [
        "zhuk",
        "Жу! Курьер приносил посылку!"
      ],
      [
        "mosq",
        "З-з! А в посылке что?"
      ],
      [
        "zhuk",
        "Жу-жу! Наверное, новые наряды для Абибяна!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "З-з-з! Жучок, давай устроим соревнование: кто дольше провисит?"
      ],
      [
        "zhuk",
        "Жу! Я на карабине могу вечно висеть!"
      ],
      [
        "mosq",
        "З-з… Ну тогда ты заранее победил!",
        "happy"
      ]
    ]
  ],
  "party": [
    [
      [
        "zhuk",
        "Пуся, потанцуем?"
      ],
      [
        "pusya",
        "Мур! Только не наступи на хвост!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, у тебя ключики звенят в такт!"
      ],
      [
        "zhuk",
        "Жу-жу! Я музыкант!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, лови ритм!"
      ],
      [
        "monty",
        "Бу-бу… Я его копаю!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, не жужжи мне в ухо!"
      ],
      [
        "mosq",
        "З-з-з! Это я подпеваю!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Монти, станцуй краковяк!"
      ],
      [
        "monty",
        "Бу-бу… Старые косточки только брейк-данс могут!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Москит, включи цветомузыку крылышками!"
      ],
      [
        "mosq",
        "З-з-з! Диско-режим активирован!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Пуся, подвинься, я тоже на ковёр хочу!"
      ],
      [
        "pusya",
        "Мур! Ковёр большой, всем хватит!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, крикнем хором «С днём рождения!»?"
      ],
      [
        "pusya",
        "Мур! Раз, два, три — с днём рождения!",
        "happy"
      ]
    ],
    [
      [
        "mosq",
        "Монти, пульс праздничный, сто двадцать ударов!"
      ],
      [
        "monty",
        "Бу-бу-бу! Это от тортика!",
        "happy"
      ]
    ],
    [
      [
        "pusya",
        "Жучок, у тебя колпак набекрень!"
      ],
      [
        "zhuk",
        "Жу! Это такой праздничный стиль!",
        "happy"
      ]
    ],
    [
      [
        "monty",
        "Москит, спой ту песню про бананы!"
      ],
      [
        "mosq",
        "З-з-з-банан-банан-банан! З-з!",
        "happy"
      ]
    ],
    [
      [
        "zhuk",
        "Пуся, а мы торт весь съедим?"
      ],
      [
        "pusya",
        "Мур-р… Пока крошки не останется!",
        "happy"
      ]
    ]
  ],
  "join": {
    "pusya": "Мур! Садись рядом!",
    "zhuk": "Жу-жу! Конечно, можно!",
    "mosq": "З-з-з! Залетай к нам!",
    "monty": "Бу-бу! Места всем хватит!"
  },
  "bye": {
    "zhuk": "Жу-жу! Пока-пока!",
    "pusya": "Мур! Пока-пока!",
    "mosq": "З-з! Пока-пока!",
    "monty": "Бу-бу! Пока-пока!"
  }
};
  const PARTY = {
    surprise: 'Мур! Сюрприз! Мы все к тебе!',
    hi: { pusya: 'Мур! Я тут!', monty: 'Бу-бу! Иду-иду!', mosq: 'З-з-з! Я первый! Ой, нет…', zhuk: 'Жу-жу! И я, и я!' },
    disco: { pusya: 'Мур-мур-диско!', monty: 'Бу-бу! Эх, молодость!', mosq: 'З-з-з! Танцуют все!', zhuk: 'Жу-жу! Звеним ключиками!' },
    cake: { pusya: 'Мур! Тортик! Ням!', monty: 'Бу-бу… Мне кусочек побольше!', mosq: 'З-з… Один кусочек можно!', zhuk: 'Жу! Мне самую крошечку!' },
    photo: { pusya: 'Мур! Я красивая?', monty: 'Бу-бу… А где птичка?', mosq: 'З-з! Я в кадре?', zhuk: 'Жу! Меня видно? Я тут, внизу!' },
    jokes: { // Round 7 #3: ten each; FRIENDS.joke() deals them from a bag (no repeats until all are told)
      pusya: [['Мур! Почему кошка смотрит в окно?', 'Там птички показывают сериал! Мур-хи-хи!'], ['Мур! Что кошка говорит пылесосу?', 'Фр-р-р! И убегает! Мур-хи-хи!'],
        ['Мур! Почему я сплю шестнадцать часов?', 'Потому что в сутках больше нет! Мур-хи-хи!'], ['Мур! Какая у кошки любимая игра?', '«Скинь со стола»! Мур-хи-хи!'],
        ['Мур! Мышка спрашивает: «Ты меня съешь?»', 'А я: «Нет, я на диете… до обеда!» Мур-хи-хи!'], ['Мур! Почему коробка лучше кровати?', 'В неё надо залезть! Это приключение! Мур-хи-хи!'],
        ['Мур! Что кошка делает в шесть утра?', 'Будит всех: пора меня кормить! Мур-хи-хи!'], ['Мур! Зачем кошке девять жизней?', 'Чтобы девять раз поспать после обеда! Мур-хи-хи!'],
        ['Мур! Почему я сижу на клавиатуре?', 'Пишу письмо: «ййййййй»! Мур-хи-хи!'], ['Мур! Как кошка считает до трёх?', 'Раз, два… а, лень! Мур-хи-хи!']],
      monty: [['Бу-бу… Купил я как-то очки.', 'А потом вспомнил: я же крот! Бу-бу-бу!'], ['Бу-бу… Как крот ходит в гости?', 'Напрямик — через пол! Бу-бу-бу!'],
        ['Бу-бу… Спрашивают крота: «Как дела?»', '«Всё в норме!» В норке, значит! Бу-бу-бу!'], ['Бу-бу… Почему кроты не играют в прятки?', 'Нас и так никто не видит! Бу-бу-бу!'],
        ['Бу-бу… Встретил я червяка.', 'Он: «Не ешь меня!» А я морковку люблю! Бу-бу-бу!'], ['Бу-бу… В молодости я был чемпионом.', 'По копанию! Лопата завидовала! Бу-бу-бу!'],
        ['Бу-бу… Пошёл я в кино.', 'Ничего не видно — как дома! Бу-бу-бу!'], ['Бу-бу… Почему у крота нет будильника?', 'Под землёй всегда ночь — спи сколько хочешь! Бу-бу-бу!'],
        ['Бу-бу… Копал я, копал…', 'И выкопал… свою же нору! Бу-бу-бу!'], ['Бу-бу… Звонит мне бабушка-крот: «Ты где?»', 'А я: «Внизу, конечно!» Бу-бу-бу!']],
      mosq: [['З-з! Пациент: «Доктор, меня все игнорируют!»', 'А я ему: «Следующий!» З-з-з!'], ['З-з! Почему я ношу халат?', 'Чтобы все думали, что укол — это лечение! З-з-з!'],
        ['З-з! Пациент: «Доктор, я вижу будущее!»', '«Давно?» — «Со следующего вторника!» З-з-з!'], ['З-з! Пациент: «Доктор, мне кажется, я банан!»', '«Не волнуйтесь, вы просто созрели!» З-з-з!'],
        ['З-з! Почему комары летают ночью?', 'Днём у нас приём пациентов! З-з-з!'], ['З-з! Какое лекарство самое вкусное?', 'Арбуз! Три раза в день! З-з-з!'],
        ['З-з! Пациент: «Доктор, я всё забываю!»', '«С каких пор?» — «С каких пор что?» З-з-з!'], ['З-з! Пациент: «Доктор, у меня хвост чешется!»', '«Так вы же обезьянка — это нормально!» З-з-з!'],
        ['З-з! Почему я пищу над ухом?', 'Проверяю слух! Бесплатно! З-з-з!'], ['З-з! Пациент: «Доктор, я боюсь уколов!»', '«Не бойтесь, я пукну — и будет смешно!» З-з-з!']],
      zhuk: [['Жу! Почему я всегда стою на шухере?', 'Меня не видно — я же самый маленький! Жу-хи-хи!'], ['Жу! Что сказал Абибян у холодильника?', '«Я только посмотреть!» Жу-хи-хи!'], ['Жу! Почему я не ворую?', 'Я просто помогаю нести! Жу-хи-хи!'],
        ['Жу! Почему ключи всегда теряются?', 'Они играют в прятки, а я вожу! Жу-хи-хи!'], ['Жу! Что сказал ключ замку?', '«Открой, это я!» Жу-хи-хи!'],
        ['Жу! Почему я не боюсь темноты?', 'Я живу в кармане — там всегда темно! Жу-хи-хи!'], ['Жу! Какой жук самый чистый?', 'Жук-щёточка! Это я! Жу-хи-хи!'],
        ['Жу! Почему брелок всегда весёлый?', 'Его всё время подбрасывают! Жу-хи-хи!'], ['Жу! Как жук считает ключи?', 'Раз ключик, два ключик… а третий в двери! Жу-хи-хи!'],
        ['Жу! Почему я такой маленький?', 'Чтобы влезать в любой карман! Жу-хи-хи!'], ['Жу! Что делает жук на крючке?', 'Висит и думает о блинчиках! Жу-хи-хи!'],
        ['Жу! Почему ключи звенят?', 'Они смеются над моими шутками! Жу-хи-хи!'], ['Жу! Как найти потерянный ключ?', 'Спросить меня — у меня глаза большие! Жу-хи-хи!']] },
    bye: { pusya: 'Мур! Было весело! Пока!', monty: 'Бу-бу… Спасибо, внучек! Пока!', mosq: 'З-з-з! Будь здоров! Пока!', zhuk: 'Жу-жу! Спасибо! Пока!' },
  };
  const DUELS = [
    { id: 'd_catch', fid: 'pusya', base: 'catch', name: 'Банановая дуэль', first: 15, desc: 'Кто первым наберёт 15 очков? Банан — 1, золотой — 3. Бананы качаются на ветру, кокос оглушает! Пуся шустрая — прыгай: в прыжке достаёшь выше неё.', hint: 'веди пальцем или ← →; прыжок — смахни вверх, тапни по Абибяну или ↑' },
    { id: 'd_bongo', fid: 'monty', base: 'bongo', name: 'Бонго-дуэль', desc: 'Монти играет ритм. Повтори его и добавь свой удар. Кто первым собьётся — проиграл!', hint: 'тапай барабаны или 1–4' },
    { id: 'd_gym', fid: 'mosq', base: 'gym', name: 'Силач-дуэль', first: 10, desc: 'Жми, когда стрелка в зелёной зоне. В центре зоны — сразу +2! Кто первым сделает 10?', hint: 'тапай или пробел' },
    { id: 'd_keys', fid: 'zhuk', base: 'keys', name: 'Ключики', first: 5, desc: 'Брелоки лежат рубашкой вверх. Открой два: одинаковые — пара твоя, и ходишь ещё. Запоминай, что открывал Жучок! Кто первым соберёт 5 пар?', hint: 'тапай брелоки или стрелки + пробел' },
  ];
  const xpNeed = (lvl) => 30 + lvl * 20;
  const LINES = {
    // Round 22: the birthday present for Даша («Дашулик») — his own lines (voiced whole, tools/tts_add.py)
    dHello: ['Привет, Дашулик! Я Абибян, теперь я живу у тебя!'], dBday: ['Ш днём рождения, Дашулик!'], dBday2: ['Шегодня твой праздник! Я позвал друзей!'],
    dKnock: ['Кто там?', 'Открой меня!'], dWake: ['Ой! Шегодня же праздник!'], dGoZal: ['Пойдём в зал, там шюрприз!'],
    dWow: ['Ура! Вше пришли поздравить Дашулика!'], dWish: ['Загадай желание и задуй швечки!'], dHarder: ['Подуй шильнее!'], dAlmost: ['Ещё чуть-чуть!'],
    dYay: ['Ура! Желание обязательно шбудетшя!'], dGifts: ['Оштавшиешя кушочки я положил в холодильник!'], dPhoto: ['Праздничное фото! Вше в кадр!'],
    dSecrets: ['А ещё я шпрятал шердечки ш шекретами. Найдёшь?'], dHeart: ['Ой, шердечко!', 'Нашла!'], dAllHearts: ['Ты нашла вше шердечки!'],
    dNext: ['Я шпрятал шледующее шердечко! Ищи!', 'А шледующее шердечко я шпрятал в другом меште! Ищи!'],
    dHot: ['Тепло-тепло! Оно где-то здешь!', 'Горячо! Шердечко в этой комнате!'], dCold: ['Холодно! Поищи в другой комнате!', 'Холодно-холодно! Шердечко не здешь!'],
    dRoom: ['Загляни в зал!', 'Загляни на кухню!', 'Загляни в ванную!', 'Загляни в прихожую!', 'Загляни на балкон!'], // zal, kitchen, bath, hall, balcony (dasha.js)
    dBye: ['Это лучший день рождения!'],
    // Round 14: his day by himself (ROUTINE)
    rt_exGo: ['Утро! Пойду на зарядку!', 'Доброе утро! Пора на зарядку!'], rt_ex: ['Раз-два! Раз-два!', 'И раз, и два, и три!'], rt_exDone: ['Ух, бодрячком!', 'Зарядка шделана!'],
    rt_snackGo: ['Что-то я проголодалшя…', 'Пойду перекушу!'], rt_empty: ['Пушто… Купи мне поешть!', 'В холодильнике пушто…'],
    rt_bathGo: ['Вечер — пора купатьшя!', 'Пойду помоюшь перед шном!'], rt_nightGo: ['Ох, шпать пора…', 'Что-то я зашыпаю…'], rt_night: ['Выключи швет, я шпать хочу!', 'Уложи меня шпать!'],
    hello: ['Привет! Я так шкучал!', 'О, ты вернулшя!', 'Ура, гошти!'],
    helloBaby: ['Абибя-а-ан!', 'Обними меня!'],
    baby: ['Хочу молочка!', 'Обними меня!', 'Я рашту?', 'Ням?', 'Абибя!', 'Поиграй шо мной!'],
    kid: ['Я уже большой!', 'Поиграем в лианы?', 'Хочу пюрешку!', 'А что это?', 'Шмотри, как я умею!'],
    teen: ['Я почти взрошлый!', 'Шкучно... шучу!', 'Можно мне шаурму?', 'Шфоткай меня!'],
    grew: ['Я подрош!', 'Шмотри, какой я большой!', 'Ура, я вырош!'],
    idle: ['Почеши мне пузико!', 'Пойдём поиграем?', 'Банан бы шейчаш...', 'Я пушиштый и это прекрашно.', 'Мне нравитшя наш дом!', 'Мы ш тобой лучшие друзья!'],
    skuf: ['Эх, шейчаш бы на диванчик...', 'Где мой пульт?', 'Раньше бананы были шлаще.', 'Я не толштый, я пушиштый!', 'Пузо — мозоль от шчаштья.', 'Шаурмы бы...', 'Опять эти ваши зарядки...'],
    hungry: ['Я голодный!', 'Пузико урчит...', 'Покорми меня, пожалуйшта!'],
    bored: ['Мне шкууучно!', 'Поиграй шо мной!'],
    tired: ['Я так уштал...', 'Пора шпатеньки...'],
    dirty: ['Фу, я вешь грязный!', 'Помоешь меня?'],
    full: ['Ой, я лопну!', 'Больше не влезет... но давай!', 'Буэ... то ешть шпашибо!'],
    yum: ['Ням-ням!', 'Вкушнятина!', 'Ещё!', 'Объедение!'],
    yuck: ['Фу, шалат...', 'Ну ладно, ради фигуры.'],
    tickle: ['Хи-хи-хи!', 'Щекотно!', 'Ха-ха, перештань!'],
    pet: ['Мур... то ешть ух-ух!', 'Приятно!', 'Ещё погладь!'],
    boop: ['Буп!', 'Мой нош!', 'Пип!'],
    dizzy: ['Голова кружитшя...', 'Ой-ой-ой...'],
    sleepy: ['Не мешай, я шплю...', 'Хррр... что?'],
    tooTired: ['Я шлишком уштал для игр...', 'Дай пошпать шначала!'],
    // Round 6 E: the phone and the computer
    phone: ['Где мой телефон? Вот он!', 'Шыграем во что-нибудь!', 'Телефончик мой!'], noPhone: ['У меня нет телефона...', 'Купи мне телефон, пожалуйшта!'],
    noPc: ['Тут нет компьютера...', 'Хочу компьютер!'], toPc: ['Бегу к компьютеру!', 'Пойду к компьютеру!'], toTv: ['Бегу к приштавке!', 'Поиграю на телевизоре!'], console: ['Ура, приштавка!', 'Во что поиграем?'],
    // Round 5: friendship
    pCall: ['Эй, вше шюда! Тушим!', 'Друзья, вше ко мне!'], pWow: ['Ого! Вше пришли!', 'Вот это шюрприз!'], p_disco: ['Дишкотека!', 'Танцуют вше!'], p_cake: ['А у меня ешть торт!', 'Чай ш тортиком!'],
    p_photo: ['Вше в кадр! Фото на память!', 'Шкажите: банан!'], p_jokes: ['Кто знает анекдот?', 'Давайте шутки!'], pWish: ['Загадываю желание!'], pYum: ['Вкушнотища!', 'Ням! Мне тоже кушочек!'],
    radio: ['Музыка!', 'Обожаю эту пешню!', 'Танцуем!'], guitar: ['Трям-брям!', 'Я рок-звезда!', 'Шейчаш шыграю!'], gTwang: ['Ой, не та штруна!', 'Кажетшя, она рашштроена...', 'Ай! Не та нота!'], gEnd: ['Ну, почти получилошь!', 'Я ещё научушь!'], soundbar: ['Вот это баш!', 'Как в кино!'], pLaugh: ['Ха-ха-ха!', 'Ой, не могу! Ха-ха!', 'Хи-хи! Вот это шутка!', 'Ха-ха! Ещё, ещё!', 'Ой, живот болит от шмеха!'], pBye: ['Клашшно пошидели!', 'Приходите ещё!'],
    fSulk: ['Ну не дуйшя!', 'Ладно, потом помиримшя.'], fLv: ['Ура! Дружба крепнет!', 'Вот это дружба!'], fGift: ['Ой, шпашибо!', 'Гоштинец! Шпашибо!'], fNope: ['Не угадал…', 'Ну и ладно, мне больше доштанетшя!'],
    // Round 5 D: every thing in the flat has its own gag
    g_air: ['Швежий воздух!', 'Ах, ветерок!'], g_pigeon: ['Ой, голубь!', 'Гули-гули!'], g_shoo: ['Кыш-кыш!', 'Лети, голубь!'], g_cold: ['Брр! Дует! Закрою.', 'Холодно! Закрою окно.'],
    g_plane: ['Бумажный шамолётик!', 'Ого, шамолётик прилетел!'], g_busyCook: ['Я жарю блинчики!', 'Подожди, блинчик подгорит!'], g_noMilk: ['Нет молока для блинчиков!', 'Без молока блинов не будет!'],
    g_cook: ['Пеку блинчики!', 'Шейчаш будут блины!'], g_burnt: ['Первый блин — комом!'], g_head: ['Блин!', 'Блин! Прямо на голову!'], g_pancakes: ['Готово! Блинчики!', 'Вкушные блинчики!'],
    g_washOpen: ['Не открывай — там вода!', 'Нельзя открывать, вшё вытечет!'], g_wash: ['Поштираем!', 'Штирка!'], g_dizzyWash: ['Голова кружитшя...', 'Ой, закружило!'], g_sock: ['А где второй ношок?'], g_knob: ['Ой! Ручка отвалилашь!', 'Ой-ой! Ручка упала!'], g_knobPick: ['Ага, вот ты где!'], g_knobFix: ['Вот так, на мешто!', 'Починил!'], g_valve: ['Горячо!', 'Тёпленько!'],
    // Round 10 #8: seasonal events (start + the windowsill thing's trick)
    s_halloween: ['Ура, Хэллуин! Тыква на окне!', 'Хэллуин! Будем пугатьшя!'], s_newyear: ['Ура, Новый год! Ёлочка!', 'Шнег пошёл! Новый год!'], s_spring: ['Вешна пришла! Балдёж!', 'Вешна! Тепло и цветочки!'],
    s_summer: ['Лето! Шолнышко!', 'Ура, лето! Жарко!'], s_bday: ['У меня день рождения!', 'Ура! Мой день рождения!'],
    g_boo: ['Ой! Тыква шказала «бу»!', 'А-а! Привидение!'], g_newyear: ['Ш Новым годом!', 'Огоньки горят!'], g_spring: ['Птичка прилетела!', 'Чик-чирик!'],
    g_summer: ['Ух, прохладно!', 'Ветерок! Хорошо!'], g_bday: ['Бах! Шарик лопнул!', 'Ш днём рождения меня!'], g_clean: ['Чиштенько!', 'Пахнет швежештью!'],
    g_parcel: ['Пошылка!', 'Ура, пошылка!'], g_parcelOpen: ['Это мне?', 'Вкушняшка!'], g_catDoor: ['Мяу? Там кошка!', 'Шошедшкая кошка!'], g_nobody: ['Тук-тук! Никого...', 'Кто там?', 'Шкоро придут гошти!'],
    g_angry: ['Ой, шошеди злятшя!'], g_neigh: ['Шошеди отвечают!', 'Тук-тук! Это шошеди!'], g_poster: ['Ой, отклеилшя!'], g_posterFix: ['Вот так!'], g_garland: ['Огоньки бегут!', 'Крашота!'], g_sneeze: ['Апчхи!'],
    g_wink: ['Она мне подмигнула!'], g_moth: ['Моль!', 'Ой, моль!'], g_cactus: ['Ай! Колючий!'], g_cuckoo: ['Ку-ку!'], g_wish: ['Загадал желание!'], g_venice: ['Хочу в Венецию!'], g_paws: ['Мою лапки!'],
    g_warm: ['Тёплое полотенечко!'], g_aid: ['На вшякий шлучай!', 'Плаштырь на вшякий шлучай!'], g_frog: ['Тут лягушка!'], g_cat: ['Коврик ожил!'], g_feet: ['Вытер лапки!'], g_angels: ['Ангелы поют!'],
    g_gnome: ['Гном Геннадий!'], g_flamingo: ['Он живой?!'], g_dig: ['Монти, ты тут?'], g_rack: ['Ой! Шушилка упала!'], g_rackUp: ['Подниму!'], g_rackDone: ['Фух! Тяжёлая!', 'Штоит как новенькая!'], 
    fc_peek: ['О чём болтаете?', 'Ой, у наш гошти!', 'Шекретничают!'], fc_join: ['Можно ш вами?', 'А я тоже хочу!', 'Я ш вами!'], // Round 15: the friends among themselves
    fc_away_zhuk: ['Жучок пошёл к Пуше!'], fc_away_pusya: ['Пушя пошла к Жучку!'], fc_away_mosq: ['Мошкит полетел к Монти!'], fc_away_monty: ['Монти пошёл к Мошкиту!'],
    fc_miss_zhuk: ['А где Жучок? Наверное, у Пуши!'], fc_miss_pusya: ['А где Пушя? Наверное, у Жучка!'], fc_miss_mosq: ['А где Мошкит? Наверное, у Монти!'], fc_miss_monty: ['А где Монти? Наверное, у Мошкита!'],
    g_wobble: ['Шатаетшя...'],
    g_toyOrang: ['Ух-ух! Родштвенники!', 'Привет, орангутан!'], g_toyHorse: ['Иго-го!', 'Лошадка!'], g_toyGnome: ['Гномики в шапочках!'], g_toyCoins: ['Монетки на шчаштье!'], g_toyCat: ['Киш-киш!', 'Котик ш бантиком!'],
    g_figSpike: ['Шпайк! Какой гребешок!', 'Зелёный, ш шиним хохолком!'], g_figAlien: ['Пришелец! Мы ш миром!'], g_figHankey: ['Хауди-хо!'], g_figBear: ['Рашпишной мишка!'], g_figMole: ['Монти, ты и на полке?', 'Кротик Монти!'], g_figShy: ['Шкромник! Не прячьшя под машкой!', 'Шай Гай, привет!'], g_hornet: ['Хорнет! Шоу!', 'Иголка наготове!'], g_figGoomba: ['Гумба! Прыг на него!'], g_figTowel: ['Не забудь полотенце!'],
    ducks: ['Уточки-путешештвенницы!', 'Папа впереди, мама шзади!', 'Кря-кря! Куда идёте?', 'Утята, не отштавайте!'], // Round 9 #12: a tap on a rubber duck
    g_router: ['Интернет ешть!', 'Вай-фай ловит!'], g_linux: ['Линукш! Тут вшё шерьёзно.', 'Пингвин!'], g_vacuum: ['Пылешош, вперёд!', 'Уборка!'], g_vacuumHop: ['Ой, по ногам!', 'Прыг!'], g_vacRide: ['Поехали!', 'Я на пылешоше!', 'Би-бип, дорогу!'],
    g_curtainDay: ['Темно и уютно!', 'Шторы закрыты — как в кино!'], g_curtainNight: ['Шпокойной ночи, улица!'], g_curtainOpen: ['Привет, окошко!', 'Да будет швет!'],
    // Round 6 D: the hall mirror — one set per pose (hips: a little one is cute, a skuf is solid)
    m_flex: ['Качок!', 'Вот это бицепш!', 'Мушкулы что надо!'], m_hips: ['Крашавчик!', 'Ну я и пушиштик!'], m_comb: ['Причёшка — огонь!', 'Шёрштка блештит!'],
    m_kiss: ['Чмок!', 'Обожаю шебя!'], m_wave: ['Привет, крашавчик!', 'Кто это такой крашивый?'], m_cute: ['Какой я милашка!', 'Ути-пути, какой я!'], m_skuf: ['Шолидный мужчина.', 'Шразу видно — шолидный!'],
    g_lid: ['Ой! Крышка!'], g_china: ['Бабушкин шервиз!'], g_cookie: ['Печенька!'], g_spoons: ['Ложки, вилки...'], g_bags: ['Пакет ш пакетами!'], g_sofaCoin: ['Монетка в диване!'], g_sofa: ['Только крошки...'],
    g_stash: ['Заначка!'], g_empty: ['Пушто...'],
    toilet: ['Фу-у-х!', 'Уединение...', 'Не подглядывай!', 'Кайф!', 'Жур-жур!'],
    toiletTap: ['Буль!', 'Тут занято!', 'Крышка деревянная!'],
    massage: ['М-м-м, кайф!', 'Как приятно!', 'Шпашибо, Пушя!', 'Вот это машшаж!'],
  };
  // «Как играть» (UI.help)
  const HELP = [
    ['Зал', 'Свет — спать и копить энергию. Шторы, телевизор, камин и фото.'], ['Кухня', 'Тяни еду из слота прямо в рот. Холодильник — магазин еды.'],
    ['Ванная', 'Три мылом, потом душ.'], ['Прихожая', 'Гардероб с одеждой, зеркало, этажерка с игрушками.'], ['Балкон', 'Пальма растит бананы — тапай по ним, поливай. Компьютер на столе.'],
    ['Телефон', 'Кнопка с телефоном вверху: мини-игры «в телефоне». Купи его в магазине — без телефона игры закрыты.'],
    ['Компьютер', 'Остальные игры — на компьютере на балконе: старый, ноутбук, мощный. Покупай в магазине «Техника».'],
    ['Ласка', 'Гладь голову, щекочи пузо, жми на нос.'], ['Рост', 'Кнопка с ростком: задания дня и этапы. Малыш растёт от заботы — до 100 очков в день.'],
  ];
  // Round 22 «Подарок для Дашулика»: the game is a 24th-birthday present. The first start is a gift box; on her birthday (or on her first
  // visit within GRACE days after it) the zal is decorated and the friends throw a party with a cake of AGE candles she blows out into the
  // microphone; «24 секрета» — hearts with his notes hidden around the flat, one at a time (texts: docs/24-secrets.md → text below).
  const DASHA = {
    name: 'Дашулик', m: 11, d: 21, year0: 2026, age0: 24, grace: 8, coins: 0, cakes: 2,
    // heart spots, scene coords
    // Round 23: ONE heart at a time — №1, then №2 … (a number with no text is skipped), each next one in another room, harder and harder.
    // A spot: x, y = the middle of the 7×6 heart; how it hides — clip [x0, y0, x1, y1]: only this part shows (the rest is behind something);
    // behind: 'leaf' | 'dark' | 'light' | 'grey' — the room's own pixels of that kind cover it (leaves, folds, bars, a rug); dark 0..1 — in
    // shadow; a 0..1 — behind glass. The room's front things (the balcony planter) cover it by themselves. Never where Абибян stands
    // (x 72…113, y 210…275), where a friend sits at home, or under the HUD / the bottom bar of a small phone (y < 44, y > 274) —
    // test/r23.js measures it all. Round 24 «посложнее»: every spot a bit more in shadow — at most 60 % of a plain heart shows
    // (was 73 %), 41 % on average (was 52 %), the last six ≈ 31 % (test/r24.js «harder»).
    spots: {
      mantel: { room: 'zal', w: 'на камине, за статуэткой', x: 150, y: 174, clip: [147, 0, 151, 320], dark: 0.2 },
      curtain: { room: 'zal', w: 'за шторой', x: 69, y: 150, clip: [0, 0, 70, 320], dark: 0.35 },
      underbed: { room: 'zal', w: 'под кроватью', x: 30, y: 232, dark: 0.66 },
      headboard: { room: 'zal', w: 'за спинкой кровати', x: 40, y: 123, clip: [0, 0, 180, 122], dark: 0.1 },
      radiator: { room: 'zal', w: 'за батареей', x: 100, y: 172, behind: 'light', dark: 0.4 },
      fridge: { room: 'kitchen', w: 'на холодильнике', x: 160, y: 84, clip: [0, 0, 180, 84], dark: 0.15 },
      cupboard: { room: 'kitchen', w: 'в шкафчике за стеклом', x: 101, y: 88, a: 0.45 },
      table: { room: 'kitchen', w: 'под столом', x: 138, y: 238, dark: 0.72 },
      oven: { room: 'kitchen', w: 'в духовке', x: 101, y: 197, a: 0.35 },
      fridgegap: { room: 'kitchen', w: 'за холодильником', x: 179, y: 150, clip: [178, 0, 180, 320], dark: 0.6 },
      rack: { room: 'hall', w: 'на этажерке', x: 146, y: 149, clip: [0, 0, 180, 149], dark: 0.35 },
      mirror: { room: 'hall', w: 'за зеркалом', x: 60, y: 124, clip: [0, 0, 180, 124], dark: 0.38 },
      dryer: { room: 'hall', w: 'в сушилке', x: 17, y: 205, behind: 'light', dark: 0.25 },
      underrack: { room: 'hall', w: 'под этажеркой', x: 158, y: 224, dark: 0.7 },
      sconce: { room: 'hall', w: 'за светильником на стене', x: 68, y: 76, clip: [69, 0, 180, 320], dark: 0.33 },
      cabinet: { room: 'bath', w: 'на зеркальном шкафчике', x: 152, y: 82, clip: [0, 0, 180, 82], dark: 0.18 },
      shower: { room: 'bath', w: 'в душевой кабине', x: 64, y: 182, a: 0.4 },
      toilet: { room: 'bath', w: 'за унитазом', x: 32, y: 196, clip: [0, 0, 180, 195], dark: 0.1 },
      rug: { room: 'bath', w: 'под ковриком-котиком', x: 174, y: 248, behind: 'light' },
      sink: { room: 'bath', w: 'под раковиной', x: 172, y: 184, dark: 0.8 },
      desk: { room: 'balcony', w: 'на столе за креслом', x: 139, y: 169, clip: [0, 0, 140, 320], dark: 0.22 },
      planter: { room: 'balcony', w: 'в ящике с цветами', x: 10, y: 243, clip: [0, 0, 180, 243], dark: 0.3 },
      underdesk: { room: 'balcony', w: 'под столом', x: 124, y: 230, dark: 0.72 },
      palm: { room: 'balcony', w: 'в пальме', x: 31, y: 80, behind: 'leaf', dark: 0.15 },
    },
    // the 24 secrets in the order she finds them (one at a time). text '' = not hidden (skipped); img = an optional picture.
    // Fill in from docs/24-secrets.md (build.py puts the texts in).
    secrets: [
      'mantel', 'fridge', 'rack', 'cabinet', 'desk', 'cupboard', 'curtain', 'shower', 'mirror', 'planter', 'table', 'toilet',
      'underbed', 'dryer', 'oven', 'underdesk', 'sink', 'headboard', 'underrack', 'fridgegap', 'rug', 'palm', 'radiator', 'sconce',
    ].map((spot, i) => ({ n: i + 1, spot, text: '', img: '' })),
    final: '', // a last note shown when all the hearts are found ('' = just his line)
    party: { // the friends at her party (they speak in their own sounds, the text is in the bubble)
      surprise: { pusya: 'Мур! Сюрприз! С днём рождения, Дашулик!', monty: 'Бу-бу! С днём рождения, Дашулик!', mosq: 'З-з-з! Поздравляем! Ура-а-а!', zhuk: 'Жу-жу! С днём рождения! Я принёс шарик!' },
      cheer: { pusya: 'Мур-р! Все свечки задула!', monty: 'Бу-бу! Вот это сила!', mosq: 'З-з-з! Ура! Ура!', zhuk: 'Жу-жу! Желание сбудется!' },
      gift: { pusya: 'Мур! А наш подарок — этот большущий торт!', monty: 'Бу-бу… Мы вместе испекли этот торт!', mosq: 'З-з-з! Угощайтесь все тортиком!', zhuk: 'Жу-жу! Мы все старались над тортиком!' },
      bye: { pusya: 'Мур! С праздником, Дашулик!', monty: 'Бу-бу… Расти большой! Ой, ты уже…', mosq: 'З-з-з! Самый лучший праздник!', zhuk: 'Жу-жу! Пока-пока, Дашулик!' },
    },
  };
  return { DASHA, GIFT, GPARTY, GAG_NAMES, HEIST, FCHAT, DEVS, DEV_NAME, BOUGHT9, CONSOLES, PHONE, TUT, HELP, SKUF, skufKg, FOODS, FOOD_ORDER, SLOTS, CLOTHES, DECOR, UPGRADES, ROOMS, GAMES, ACH, achList, visibleAchs, STAGES, fat, stage, xpNeed, LINES, KG0, KG1, AGES, AGES_V4, AGE, GROW, TASKS, TASK, unlocks, FRIENDS, FIDS, PILLOW_LINES, DUELS, FSHIP, PARTY };
})();
