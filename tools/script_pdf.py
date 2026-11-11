#!/usr/bin/env python3
"""Recording script for Abibyan's voice: dist/abibyan-script.pdf (A5, phone-friendly), dist/abibyan-script.txt,
tools/script_manifest.json (numbered items -> exact game strings, for auto-alignment of the recordings later)."""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ast
_T = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tts.py'), encoding='utf-8').read()
PHRASES = ast.literal_eval(re.search(r'^PHRASES = (\[.*?\])$', _T, re.S | re.M).group(1))  # tts.py needs heavy audio deps; read the list only
def norm(s):  # same as tts.norm / audio.js normT
    s = s.lower().replace('ё', 'е')
    s = re.sub(r'[^a-zа-я0-9\- ]+', ' ', s)
    s = re.sub(r'(^|\s)-+|-+(\s|$)', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, CondPageBreak, KeepTogether

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
FD = '/usr/share/fonts/msttcore/'
for n, f in (('A', 'arial.ttf'), ('AB', 'arialbd.ttf'), ('AI', 'ariali.ttf'), ('ABI', 'arialbi.ttf')):
    pdfmetrics.registerFont(TTFont(n, FD + f))
addMapping('A', 0, 0, 'A'); addMapping('A', 1, 0, 'AB'); addMapping('A', 0, 1, 'AI'); addMapping('A', 1, 1, 'ABI')

S = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools', 'lines_struct.js')], capture_output=True, text=True, cwd='/data').stdout)
L, MISC, WANT = S['LINES'], S['misc'], S['want']
def M(*xs):
    for x in xs: assert x in MISC, x
    return list(xs)

HINT = {  # line -> short acting hint
    'Привет! Я так скучал!': 'радостно', 'О, ты вернулся!': 'удивлённо-радостно', 'Ура, гости!': 'восторженно',
    'Агу! Ты пришёл!': 'по-детски', 'Абибя-а-ан!': 'тянет своё имя', 'Обними меня!': 'просит',
    'Хочу молочка!': 'капризно', 'Я расту?': 'с любопытством', 'Ням?': 'вопросительно', 'Абибя!': 'малыш зовёт себя',
    'Поиграй со мной!': 'просит', 'Я уже большой!': 'гордо', 'А что это?': 'любопытно', 'Смотри, как я умею!': 'хвастается',
    'Скучно... шучу!': 'скучающе, потом весело', 'Можно мне шаурму?': 'хитро', 'Банан бы сейчас...': 'мечтательно',
    'Я пушистый и это прекрасно.': 'довольно', 'Скажи что-нибудь в микрофон!': 'зовёт поиграть',
    'Я голодный!': 'жалобно', 'Пузико урчит...': 'жалобно', 'Покорми меня, пожалуйста!': 'просит',
    'Мне скууучно!': 'тянет «у»', 'Я так устал...': 'устало', 'Пора спатеньки...': 'сонно', 'Фу, я весь грязный!': 'брезгливо',
    'Голова кружится...': 'растерянно', 'Ой-ой-ой...': 'шатается', 'Не мешай, я сплю...': 'сонно, тихо',
    'Хррр... что?': 'похрапывает, потом просыпается', 'Я слишком устал для игр...': 'устало', 'Дай поспать сначала!': 'ворчит',
    'Выспался!': 'бодро', 'Я полон сил!': 'бодро', 'Ну вот, разбудили...': 'недовольно, сонно',
    'Хочу кое-что!': 'загадочно', 'Мне такое ещё рано!': 'серьёзно, как взрослый', 'Ням-ням!': 'довольно', 'Ещё!': 'требует',
    'Ой, я лопну!': 'объелся', 'Больше не влезет... но давай!': 'сначала сыто, потом бодро', 'Буэ... то есть спасибо!': 'шуточная отрыжка, потом вежливо',
    'Фу, салат...': 'брезгливо', 'Ну ладно, ради фигуры.': 'вздыхает', 'Бодрячком!': 'после кофе', 'Вжух! Я заряжен!': 'после энергетика',
    'Чувствую лёгкость!': 'после диет-чая', 'Хи-хи-хи!': 'хихикает', 'Ха-ха, перестань!': 'смеётся', 'Мур... то есть ух-ух!': 'мурлычет, потом по-обезьяньи',
    'Буп!': 'нажали на нос', 'Пип!': 'нажали на нос', 'Ля-ля-ля!': 'напевает', 'Блестю!': 'ударение на «ю»',
    'Ура! Я Абибян!': 'получил имя', 'Красавчик!': 'смотрит в зеркало', 'Солидный мужчина.': 'в зеркало, важно',
    'Эх, сейчас бы на диванчик...': 'лениво', 'Раньше бананы были слаще.': 'ворчит', 'Я не толстый, я пушистый!': 'обиженно',
    'Опять эти ваши зарядки...': 'ворчит', 'Я похудел!': 'радостно', 'Кажется, я поправился...': 'смущённо',
}
FXL = [('Хи-хи!', 'короткий смешок'), ('Ха-ха-ха!', 'смеётся от души'), ('Уи-и!', 'радостный писк'), ('Ммм!', 'вкусно / приятно'),
       ('Ого!', 'удивился'), ('Хм?', 'не понял'), ('Ох...', 'грустный вздох'), ('Эх...', 'досада'), ('У-у-у...', 'хнычет'),
       ('А-а-ах...', 'настоящий зевок'), ('Ой!', 'испугался'), ('Хр-р... пс-с...', 'храпит во сне, 2–3 раза'),
       ('Чмок!', 'поцелуй'), ('Апчхи!', 'чихает')]
STORY = [
    'Жил-был плюшевый обезьянёнок по имени Абибян. Он был серый, пушистый и очень любопытный. Каждое утро он потягивался, '
    'зевал и говорил: «Доброе утро! Что сегодня будем делать?»',
    'Однажды Абибян нашёл в саду огромное банановое дерево. «Ого! Сколько тут бананов? Раз, два, три, четыре, пять, шесть, семь, '
    'восемь, девять, десять! Целых десять!» Он залез на самую верхнюю ветку, сорвал самый жёлтый банан и съел его в один присест.',
    'Тут к нему прилетела болтливая сорока.<br/>— Чего ты такой довольный? — спросила она.<br/>— Потому что у меня есть друг, — ответил '
    'Абибян. — Он меня кормит, гладит и играет со мной. Разве это не счастье?<br/>Сорока почесала клювом крыло и сказала:<br/>'
    '— Счастье — это когда тебя ждут дома.<br/>— Вот именно! — засмеялся Абибян.',
    'Вечером пошёл дождь. Капли стучали по крыше: кап-кап, тук-тук. Абибян залез в тёплую ванну с мыльной пеной, пускал пузыри '
    'и пел: «Ля-ля-ля, я чистый, я пушистый, я весёлый!»',
    'Перед сном он выпил чашку тёплого молока, обнял подушку и тихонько сказал: «Спасибо тебе за этот день. Ты мой самый лучший '
    'друг. Спокойной ночи!»',
]
TWISTERS = ['Съешь же ещё этих мягких французских булок, да выпей чаю.', 'В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!',
            'Шла Саша по шоссе и сосала сушку.', 'Ёжик в чаще щёлкал шишки, а цапля ловила рыбу.']
TALK = ['Кто ты такой и что ты любишь?', 'Какая у тебя любимая еда? А что терпеть не можешь?', 'Что ты делаешь, когда скучно?',
        'Чего ты боишься?', 'Кем ты станешь, когда вырастешь?', 'Расскажи про своего лучшего друга.',
        'Посчитай до двадцати.', 'Назови имена своих друзей и родных.']

SEC = [
    dict(t='Проверка звука', tone='голосом Абибяна', note='Запиши <b>только этот раздел</b> и пришли мне — проверю звук и отвечу. '
         'Остальное записывай после этого.', items=['Раз, два, три, четыре, пять.', 'Привет! Я Абибян.', 'Это проверка звука.'], kind='test'),
    dict(t='Привет! Абибян-малыш', tone='по-детски, радостно', items=L['hello'] + L['helloBaby'] + L['baby']),
    dict(t='Подрастаю', tone='гордо, весело', items=L['kid'] + L['teen'] + L['grew']),
    dict(t='Просто так и просьбы', tone='живо, ласково', items=L['idle'] + M('Давай поиграем в игру!', 'Погладь меня по голове!',
         'Хочу в душ с мыльной пеной!', 'Сорви мне банан с дерева!', 'Пощекочи мне пузико!')),
    dict(t='Настроение', tone='по ситуации — смотри подсказки', items=L['hungry'] + L['bored'] + L['tired'] + L['dirty'] + L['dizzy']
         + L['sleepy'] + L['tooTired'] + M('Выспался!', 'Доброе утро!', 'Я полон сил!', 'Ну вот, разбудили...')),
    dict(t='Еда', tone='с аппетитом', note='«Хочу …!» — каждое отдельной фразой, с паузой.', items=WANT + M('Хочу кое-что!', 'Мне такое ещё рано!')
         + L['yum'] + L['full'] + L['yuck'] + M('Бодрячком!', 'Вжух! Я заряжен!', 'Чувствую лёгкость!')),
    dict(t='Игры, ласка и дом', tone='весело', items=L['tickle'] + L['pet'] + L['boop'] + M('Красавчик!', 'Ну я и пушистик!', 'Какой я милашка!',
         'Какой стройный!', 'Свежий банан!', 'Прямо с ветки!', 'Урожай!', 'Ля-ля-ля!', 'Тёпленькая!', 'Буль-буль!', 'Чистенький!', 'Свежесть!',
         'Блестю!', 'Сначала намыль меня!', 'Спасибо!', 'Ура, ты лучший!', 'Обожаю тебя!', 'Ура! Я Абибян!')),
    dict(t='Абибян-скуф', tone='тот же голос, но вальяжно и лениво, как дядя на диване', note='Ниже голос не делай — для скуфа '
         'игра понизит его сама.', items=L['skuf'] + M('Солидный мужчина.', 'Мангал — это святое.', 'Шашлычок бы...',
         'Я стал настоящим скуфом!', 'Кажется, я поправился...', 'Я похудел!')),
    dict(t='Повторюшка', tone='радостно повторяет за тобой', note='Это то, что ребёнок говорит в микрофон, а Абибян повторяет '
         'своим голосом.', items=None, kind='phrases'),
    dict(t='Звуки без слов', tone='по подсказкам', note='Можно по 2 раза подряд — возьму лучший.', items=None, kind='fx'),
    dict(t='Сказка', tone='спокойно, как рассказываешь сказку', note='Это для «голосовой модели»: по ней Повторюшка научится '
         'говорить любые слова твоим голосом. Читай без спешки, с выражением. Сбился — вернись к началу предложения.', kind='story'),
    dict(t='Болтовня (по желанию)', tone='свободно, голосом Абибяна', note='3–5 минут: отвечай на вопросы как Абибян, своими словами. '
         'Можно смеяться, делать паузы, «э-э» — всё нормально. Чем больше живой речи, тем лучше Повторюшка.', kind='talk'),
]

def items_of(sec, seen):
    if sec.get('kind') == 'phrases': src = [(p, '') for p in PHRASES]
    elif sec.get('kind') == 'fx': src = list(FXL)
    elif sec.get('items') is not None: src = [(s, HINT.get(s, '')) for s in sec['items']]
    else: return []
    out = []
    for s, h in src:
        k = norm(s)
        if k in seen: continue
        seen.add(k); out.append((s, h))
    return out

def syl(s): return len(re.findall(r'[аоуыэяёюиеАОУЫЭЯЁЮИЕ]', s))

def build():
    seen, n, man = set(), 0, []
    for i, sec in enumerate(SEC):
        sec['i'] = i; sec['rows'] = []
        for s, h in items_of(sec, seen):
            n += 1; sec['rows'].append((n, s, h)); man.append(dict(n=n, sec=i, text=s, kind=sec.get('kind', 'line')))
        if sec.get('kind') == 'story': sy = sum(syl(re.sub('<[^>]+>', ' ', p)) for p in STORY + TWISTERS); sec['sec_s'] = sy / 4.0 + 20
        elif sec.get('kind') == 'talk': sec['sec_s'] = 240
        else: sec['sec_s'] = sum(syl(s) / 4.5 + 2.0 for _, s, _ in sec['rows']) + 3
    game = set(norm(x) for x in json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools', 'lines.js')], capture_output=True, text=True, cwd='/data').stdout))
    covered = set(norm(m['text']) for m in man)
    assert game <= covered, game - covered
    assert all(norm(p) in covered for p in PHRASES)
    return man

def minutes(s):
    m = max(0.5, round(s / 60 * 2) / 2)
    return ('%g' % m).replace('.', ',')

def plural(n, a, b, c):
    n10, n100 = n % 10, n % 100
    return a if n10 == 1 and n100 != 11 else b if 2 <= n10 <= 4 and not 12 <= n100 <= 14 else c

def pdf(man, path):
    OR, DK, GR, BG = colors.HexColor('#E8892B'), colors.HexColor('#3B2F2F'), colors.HexColor('#8A8178'), colors.HexColor('#FBF4EA')
    st = dict(
        title=ParagraphStyle('t', fontName='AB', fontSize=20, leading=23, textColor=DK, spaceAfter=2),
        sub=ParagraphStyle('s', fontName='A', fontSize=11, leading=14, textColor=GR, spaceAfter=5),
        h=ParagraphStyle('h', fontName='AB', fontSize=13, leading=16, textColor=colors.white),
        h2=ParagraphStyle('h2', fontName='AB', fontSize=12.5, leading=16, textColor=DK, spaceBefore=6, spaceAfter=3),
        meta=ParagraphStyle('m', fontName='A', fontSize=9, leading=11.5, textColor=GR),
        body=ParagraphStyle('b', fontName='A', fontSize=9.8, leading=12.8, textColor=DK),
        note=ParagraphStyle('n', fontName='AI', fontSize=9.5, leading=12.5, textColor=DK),
        item=ParagraphStyle('i', fontName='A', fontSize=12.5, leading=15.5, textColor=DK),
        num=ParagraphStyle('nu', fontName='A', fontSize=8.5, leading=10, textColor=GR, alignment=2),
        story=ParagraphStyle('st', fontName='A', fontSize=12, leading=16.5, textColor=DK, spaceAfter=6),
    )
    W = A5[0] - 24 * mm
    def footer(c, d):
        c.saveState(); c.setFont('A', 8); c.setFillColor(GR)
        c.drawString(12 * mm, 7 * mm, 'Озвучка Абибяна · сценарий записи'); c.drawRightString(A5[0] - 12 * mm, 7 * mm, str(d.page)); c.restoreState()
    doc = SimpleDocTemplate(path, pagesize=A5, leftMargin=12 * mm, rightMargin=12 * mm, topMargin=11 * mm, bottomMargin=13 * mm,
                            title='Озвучка Абибяна — сценарий записи', author='Notion AI')
    E = []
    total_items = sum(1 for m in man if m['kind'] != 'story')
    rec = sum(s['sec_s'] for s in SEC if s.get('kind') != 'talk')
    E += [Paragraph('Озвучка Абибяна', st['title']), Paragraph('Сценарий записи голоса', st['sub'])]
    E.append(Paragraph('Всё, что Абибян говорит в игре, плюс звуки и сказка. Фразы попадут в игру ровно такими, как ты их запишешь, '
                       'а по сказке Повторюшка научится говорить любые слова тем же голосом.', st['body']))
    E.append(Spacer(1, 6))
    box = Table([[Paragraph('<b>Сколько времени</b><br/>• %d короткие фразы и звука + сказка на ~2 минуты<br/>'
                            '• сама запись — около %s минут, с перерывами и дублями — 30–40<br/>'
                            '• можно в 2–3 захода: то же место, тот же телефон, тот же голос' % (total_items, minutes(rec)), st['body'])]],
                colWidths=[W])
    box.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), BG), ('BOX', (0, 0), (-1, -1), 0.8, OR),
                             ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
    E += [box, Spacer(1, 4), Paragraph('Как записывать', st['h2'])]
    RULES = [
        '<b>Сначала только раздел 0</b> (20 секунд) — пришли, я проверю звук. Так не придётся переписывать всё.',
        '<b>Тихая комната</b> с мягкой мебелью и шторами — меньше эха. Выключи вентилятор, кондиционер и телевизор, '
        'закрой окна, телефон — в режим «Не беспокоить».',
        '<b>Приложение «Диктофон»</b>, а не голосовые в Telegram или WhatsApp — они портят звук. '
        'На iPhone найди «Диктофон» в Настройках и в пункте о качестве выбери «Без потерь».',
        '<b>Телефон — на стол</b>, микрофоном к себе, 15–20 см от рта и чуть сбоку (чтобы не дуть на «п» и «б»). '
        'Расстояние всё время одно. Сценарий удобнее читать с компьютера или распечатки.',
        '<b>В начале файла — 3 секунды тишины</b> (по ним я уберу шум). Дальше читай по порядку; номера и подсказки '
        'в скобках вслух не читай. Между фразами — пауза 2 секунды.',
        '<b>Ошибся</b> — пауза и скажи фразу заново целиком. Я всегда беру последний дубль.',
        '<b>Голос — как в твоих примерах</b>, одинаковый во всех разделах. Эмоции — интонацией, а не громкостью: не кричи и не шепчи.',
        '<b>Если в примерах был эффект</b> (ускорение, «гелий», изменялка голоса) — записывай без него, обычным голосом. '
        'Напиши, чем пользовался, и пришли 2–3 фразы с эффектом — наложу такой же.',
        '<b>Один раздел — один файл</b>, имя — номер раздела: 00, 01, 02… Формат любой. Отправляй файлом, а не голосовым.',
    ]
    rt = Table([[Paragraph('%d' % (i + 1), ParagraphStyle('rn', parent=st['body'], fontName='AB', textColor=OR)), Paragraph(r, st['body'])]
                for i, r in enumerate(RULES)], colWidths=[6 * mm, W - 6 * mm])
    rt.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                            ('TOPPADDING', (0, 0), (-1, -1), 1.2), ('BOTTOMPADDING', (0, 0), (-1, -1), 1.2)]))
    E.append(rt)
    for sec in SEC:
        E.append(PageBreak() if sec['i'] in (0, 10) else CondPageBreak(45 * mm))
        hd = Table([[Paragraph('%d&nbsp;&nbsp;·&nbsp;&nbsp;%s' % (sec['i'], sec['t']), st['h'])]], colWidths=[W])
        hd.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), OR), ('LEFTPADDING', (0, 0), (-1, -1), 7), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
        cnt = len(sec['rows'])
        meta = 'Файл <b>%02d</b>' % sec['i']
        if cnt: meta += ' · %d %s' % (cnt, plural(cnt, 'звук', 'звука', 'звуков') if sec.get('kind') == 'fx' else plural(cnt, 'фраза', 'фразы', 'фраз'))
        meta += ' · ≈%s мин · <b>Тон:</b> %s' % (minutes(sec['sec_s']), sec['tone'])
        head = [hd, Spacer(1, 3), Paragraph(meta, st['meta'])]
        if sec.get('note'): head += [Spacer(1, 2), Paragraph(sec['note'], st['note'])]
        head.append(Spacer(1, 4))
        if sec['rows']:
            rows = [[Paragraph(str(n), st['num']), Paragraph(s.replace('...', '…') + ('&nbsp;&nbsp;<font name="AI" size="9" color="#8A8178">(%s)</font>' % h if h else ''), st['item'])]
                    for n, s, h in sec['rows']]
            t = Table(rows, colWidths=[9 * mm, W - 9 * mm], repeatRows=0)
            t.setStyle(TableStyle([('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, BG]), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                   ('LEFTPADDING', (0, 0), (0, -1), 0), ('RIGHTPADDING', (0, 0), (0, -1), 5), ('LEFTPADDING', (1, 0), (1, -1), 4),
                                   ('TOPPADDING', (0, 0), (-1, -1), 2.2), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.2)]))
            E += [KeepTogether(head + [Spacer(1, 0)]), t]
        elif sec.get('kind') == 'story':
            E += head + [Paragraph(p, st['story']) for p in STORY]
            E += [Spacer(1, 2), Paragraph('Напоследок — медленно и чётко:', st['note']), Spacer(1, 3)]
            E += [Paragraph('• ' + p, st['story']) for p in TWISTERS]
        elif sec.get('kind') == 'talk':
            E += head + [Paragraph('• ' + p, st['story']) for p in TALK]
    E += [CondPageBreak(52 * mm), Spacer(1, 8), Paragraph('Что прислать', st['h2'])]
    CHECK = ['00 — проверка звука (сначала, отдельно)', '01–07 — фразы из игры', '08 — Повторюшка', '09 — звуки', '10 — сказка',
             '11 — болтовня (по желанию)', 'Пару слов: как сделан голос в примерах — твой голос, эффект в приложении (каким?) или голос из приложения/видео']
    E += [Paragraph('□&nbsp;&nbsp;' + c, ParagraphStyle('c', parent=st['body'], fontSize=10.5, leading=15, leftIndent=12, firstLineIndent=-12)) for c in CHECK]
    E += [Spacer(1, 8), Paragraph('Дальше я сам порежу записи на фразы, почищу от шума, выровняю громкость и вставлю в игру.', st['note'])]
    doc.build(E, onFirstPage=footer, onLaterPages=footer)

def txt(man, path):
    out = ['ОЗВУЧКА АБИБЯНА — список фраз (номера и заголовки вслух не читать)', '']
    for sec in SEC:
        out.append('== %d. %s (файл %02d) ==' % (sec['i'], sec['t'], sec['i']))
        if sec['rows']: out += ['%d. %s' % (n, s) for n, s, h in sec['rows']]
        elif sec.get('kind') == 'story': out += [re.sub('<br/>', '\n', p) for p in STORY] + [''] + TWISTERS
        elif sec.get('kind') == 'talk': out += ['- ' + p for p in TALK]
        out.append('')
    open(path, 'w', encoding='utf-8').write('\n'.join(out))

if __name__ == '__main__':
    man = build()
    json.dump(dict(sections=[dict(i=s['i'], t=s['t'], kind=s.get('kind', 'lines')) for s in SEC], items=man, story=STORY, twisters=TWISTERS),
              open(os.path.join(ROOT, 'tools', 'script_manifest.json'), 'w'), ensure_ascii=False, indent=1)
    pdf(man, os.path.join(DIST, 'abibyan-script.pdf')); txt(man, os.path.join(DIST, 'abibyan-script.txt'))
    print('items', len(man), 'per section', [len(s['rows']) for s in SEC], 'rec min', round(sum(s['sec_s'] for s in SEC if s.get('kind') != 'talk') / 60, 1))
