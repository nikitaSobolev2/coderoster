import { lesson, t } from './lessonHelpers'
import { moduleBlock, type CourseDef } from './courseTypes'

export const DEFS_BATCH_3: CourseDef[] = [
  {
    slug: 'python-string-parsing',
    categoryLeafSlug: 'seed-leaf-data-parse',
    title: 'Парсинг строк',
    summary: 'split, strip, find, replace, проверки формата.',
    shortSummary: 'Достаём поля из текста.',
    description:
      'Типовые приёмы разбора одной строки на части: разделители, префиксы/суффиксы, замены.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1450,
    tags: ['строки', 'split'],
    author: 'secondary',
    modules: [
      moduleBlock('Разделители', 'split и join.', [
        lesson(
          'psp-m1-l1',
          'Две части по двоеточию',
          '## Условие\n\nСтрока вида `ключ:значение` (ровно одно двоеточие). Выведи **значение** без пробелов по краям ключа и значения.\n\n**Формат:** строка.',
          's = input().strip()\n',
          's = input().strip()\nk, v = s.split(":")\nprint(v.strip())',
          [t('пробелы', '1', '  a : 1  '), t('слово', 'ok', 'x:ok')]
        ),
        lesson(
          'psp-m1-l2',
          'Последний сегмент',
          '## Условие\n\nСтрока путей с `/`. Выведи **последний** сегмент (после последнего `/`). Если `/` нет, выведи всю строку.\n\n**Формат:** строка.',
          'path = input().strip()\n',
          'path = input().strip()\nprint(path.split("/")[-1])',
          [t('файл', 'main.py', 'src/app/main.py'), t('нет слэш', 'solo', 'solo')]
        )
      ]),
      moduleBlock('Префиксы', 'startswith.', [
        lesson(
          'psp-m2-l1',
          'HTTP-метод',
          '## Условие\n\nСтрока начинается с `GET ` или `POST ` (ровно так). Выведи метод **заглавными** буквами одним словом.\n\n**Формат:** `GET` или `POST`.',
          'line = input().strip()\n',
          'line = input().strip()\nif line.startswith("GET "):\n    print("GET")\nelse:\n    print("POST")',
          [t('get', 'GET', 'GET /'), t('post', 'POST', 'POST /api')]
        ),
        lesson(
          'psp-m2-l2',
          'Убрать префикс user:',
          '## Условие\n\nСтрока может начинаться с `user:`. Если да — выведи часть **после** префикса (без пробела после двоеточия). Иначе выведи строку как есть.\n\n**Формат:** строка.',
          's = input().strip()\n',
          's = input().strip()\nprint(s[5:] if s.startswith("user:") else s)',
          [t('с префиксом', 'anna', 'user:anna'), t('без', 'guest', 'guest')]
        )
      ]),
      moduleBlock('Цифры в строке', 'isdigit.', [
        lesson(
          'psp-m3-l1',
          'Только цифры',
          '## Условие\n\nОдна строка. Если все символы — цифры, выведи `да`, иначе `нет`.\n\n**Формат:** русские слова.',
          's = input().strip()\n',
          's = input().strip()\nprint("да" if s.isdigit() else "нет")',
          [t('123', 'да', '123'), t('12a', 'нет', '12a')]
        ),
        lesson(
          'psp-m3-l2',
          'Замена запятых',
          '## Условие\n\nСтрока с **запятыми** как разделителями тысяч в числе (`1,234,567`). Убери все `,` и выведи целое число одной строкой.\n\n**Формат:** цифры подряд.',
          's = input().strip()\n',
          's = input().strip()\nprint(s.replace(",", ""))',
          [t('пример', '1234567', '1,234,567'), t('нет запятых', '42', '42')]
        )
      ])
    ]
  },
  {
    slug: 'python-http-concepts',
    categoryLeafSlug: 'seed-leaf-app-http',
    title: 'HTTP в консоли',
    summary: 'Статус-строка, заголовки, упрощённые ответы без сокетов.',
    shortSummary: 'Формируем корректные текстовые ответы.',
    description:
      'Учимся собирать текстовые представления ответов и разбирать псевдо-заголовки из stdin — всё выводим в stdout.',
    difficulty: 'intermediate',
    durationHours: 12,
    xpReward: 1280,
    tags: ['http', 'заголовки'],
    author: 'primary',
    modules: [
      moduleBlock('Статус', 'Код и фраза.', [
        lesson(
          'phc-m1-l1',
          'Статус 200',
          '## Условие\n\nОдна строка путь, например `/ping`. Выведи **ровно** строку `HTTP/1.1 200 OK`.\n\n**Формат:** одна строка.',
          'path = input().strip()\n',
          'path = input().strip()\nprint("HTTP/1.1 200 OK")',
          [t('ping', 'HTTP/1.1 200 OK', '/ping'), t('root', 'HTTP/1.1 200 OK', '/')]
        ),
        lesson(
          'phc-m1-l2',
          '404 Not Found',
          '## Условие\n\nСлово `ok` или `missing`. Если `ok` — выведи `HTTP/1.1 200 OK`, иначе `HTTP/1.1 404 NOT FOUND`.\n\n**Формат:** строка статуса.',
          'flag = input().strip()\n',
          'flag = input().strip()\nprint("HTTP/1.1 200 OK" if flag == "ok" else "HTTP/1.1 404 NOT FOUND")',
          [t('ok', 'HTTP/1.1 200 OK', 'ok'), t('missing', 'HTTP/1.1 404 NOT FOUND', 'missing')]
        )
      ]),
      moduleBlock('Заголовки', 'Content-Type.', [
        lesson(
          'phc-m2-l1',
          'Тип json',
          '## Условие\n\nВыведи две строки: первая `Content-Type: application/json`, вторая пустая строка, третья `{"ok":true}`.\n\n**Формат:** ровно три строки в stdout.',
          '# три print\n',
          'print("Content-Type: application/json")\nprint("")\nprint(\'{"ok":true}\')',
          [
            t('ровно три строки', 'Content-Type: application/json\n\n{"ok":true}'),
            t('второй тест тот же ответ', 'Content-Type: application/json\n\n{"ok":true}')
          ]
        ),
        lesson(
          'phc-m2-l2',
          'Длина тела',
          '## Условие\n\nСтрока `body` без переносов. Выведи сначала `Content-Length: <длина UTF-8 байт>`, затем пустую строку, затем `body`.\n\n**Формат:** три логические части через \\n.',
          'body = input().strip()\n',
          'body = input().strip()\nb = body.encode("utf-8")\nprint("Content-Length: " + str(len(b)))\nprint()\nprint(body)',
          [
            t('два байта ascii', 'Content-Length: 2\n\nok', 'ok'),
            t('один символ', 'Content-Length: 1\n\nz', 'z')
          ]
        )
      ]),
      moduleBlock('Хост', 'Host header.', [
        lesson(
          'phc-m3-l1',
          'Строка запроса',
          '## Условие\n\nТри строки: `method`, `path`, `host`. Выведи `METHOD path HTTP/1.1`, затем `Host: host`, затем пустую строку. METHOD — upper(method).\n\n**Формат:** блок из строк.',
          'method = input().strip()\npath = input().strip()\nhost = input().strip()\n',
          'method = input().strip()\npath = input().strip()\nhost = input().strip()\nprint(method.upper() + " " + path + " HTTP/1.1")\nprint("Host: " + host)\nprint()',
          [
            t('get', 'GET / HTTP/1.1\nHost: x.test\n\n', 'get\n/\nx.test'),
            t('post', 'POST /a HTTP/1.1\nHost: api\n\n', 'post\n/a\napi')
          ]
        ),
        lesson(
          'phc-m3-l2',
          'Флаг gzip',
          '## Условие\n\n`1` или `0`. Если `1`, выведи `Content-Encoding: gzip`, иначе `Content-Encoding: identity`. Одна строка.\n\n**Формат:** заголовок.',
          'b = int(input())\n',
          'b = int(input())\nprint("Content-Encoding: gzip" if b == 1 else "Content-Encoding: identity")',
          [
            t('gzip', 'Content-Encoding: gzip', '1'),
            t('identity', 'Content-Encoding: identity', '0')
          ]
        )
      ])
    ]
  },
  {
    slug: 'python-oop-essentials',
    categoryLeafSlug: 'seed-leaf-app-oop',
    title: 'ООП в Python',
    summary: 'Классы, методы, dataclass на малых примерах.',
    shortSummary: 'Инкапсулируем состояние.',
    description:
      'Создаём простые классы с конструктором и методами; подключаем `@dataclass` для кортежей данных.',
    difficulty: 'intermediate',
    durationHours: 18,
    xpReward: 1750,
    tags: ['class', 'dataclass'],
    author: 'secondary',
    modules: [
      moduleBlock('Класс и методы', '__init__.', [
        lesson(
          'poe-m1-l1',
          'Точка на плоскости',
          '## Условие\n\nКласс `Point` с `x,y` int в конструкторе. Метод `dist2()` возвращает `x*x+y*y`. С stdin два int, создай точку, выведи `dist2()`.\n\n**Формат:** целое.',
          'class Point:\n    def __init__(self, x, y):\n        pass\n    def dist2(self):\n        pass\n\nx = int(input())\ny = int(input())\n',
          'class Point:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n    def dist2(self):\n        return self.x * self.x + self.y * self.y\n\nx = int(input())\ny = int(input())\nprint(Point(x, y).dist2())',
          [t('3 4', '25', '3\n4'), t('0 0', '0', '0\n0')]
        ),
        lesson(
          'poe-m1-l2',
          'Счётчик инкремент',
          '## Условие\n\nКласс `Counter` с полем `n=0`, метод `inc(k)` увеличивает `n` на `k`. Из stdin три int `a,b,c` — три раза инкремент, выведи `n`.\n\n**Формат:** целое.',
          'class Counter:\n    def __init__(self):\n        pass\n    def inc(self, k):\n        pass\n\nc = Counter()\na = int(input())\nb = int(input())\nd = int(input())\n',
          'class Counter:\n    def __init__(self):\n        self.n = 0\n    def inc(self, k):\n        self.n += k\n\nc = Counter()\na = int(input())\nb = int(input())\nd = int(input())\nc.inc(a)\nc.inc(b)\nc.inc(d)\nprint(c.n)',
          [t('1+2+3', '6', '1\n2\n3'), t('нули', '0', '0\n0\n0')]
        )
      ]),
      moduleBlock('dataclass', 'from dataclasses import dataclass', [
        lesson(
          'poe-m2-l1',
          'Пользователь',
          '## Условие\n\n`@dataclass class User: name: str; score: int`. С stdin имя и число, создай `User`, выведи `f"{u.name}:{u.score}"`.\n\n**Формат:** `имя:балл`.',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nname = input().strip()\nscore = int(input())\n',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nname = input().strip()\nscore = int(input())\nu = User(name, score)\nprint(f"{u.name}:{u.score}")',
          [t('anna', 'anna:5', 'anna\n5'), t('z', 'z:0', 'z\n0')]
        ),
        lesson(
          'poe-m2-l2',
          'Сравнение по score',
          '## Условие\n\nДва `User` как выше из stdin (имя1 балл1 имя2 балл2 по строкам). Выведи имя пользователя с **большим** score; при равенстве выведи лексикографически меньшее имя.\n\n**Формат:** имя.',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nu1 = User(input().strip(), int(input()))\nu2 = User(input().strip(), int(input()))\n',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nu1 = User(input().strip(), int(input()))\nu2 = User(input().strip(), int(input()))\nif u1.score != u2.score:\n    print(u1.name if u1.score > u2.score else u2.name)\nelse:\n    print(min(u1.name, u2.name))',
          [t('разные', 'b', 'a\n1\nb\n9'), t('ничья', 'a', 'b\n3\na\n3')]
        )
      ]),
      moduleBlock('Инкапсуляция', 'Свойства не нужны — метод formatted.', [
        lesson(
          'poe-m3-l1',
          'Rectangle площадь',
          '## Условие\n\nКласс `Rect(w,h)` целые >0, метод `area()` возвращает `w*h`. stdin два числа, выведи площадь.\n\n**Формат:** целое.',
          'class Rect:\n    def __init__(self, w, h):\n        pass\n    def area(self):\n        pass\n\n',
          'class Rect:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n    def area(self):\n        return self.w * self.h\n\nprint(Rect(int(input()), int(input())).area())',
          [t('3 4', '12', '3\n4'), t('1 1', '1', '1\n1')]
        ),
        lesson(
          'poe-m3-l2',
          'Stack pop',
          '## Условие\n\nКласс `Stack`: `push(x)`, `pop()` возвращает последний или `None` если пусто. Операции: строка `n`, затем `n` строк вида `+ x` или `-`. Для `-` выведи результат `pop()` (или строку `None`).\n\n**Формат:** последовательность результатов через пробел для каждого `-`.',
          '',
          'class Stack:\n    def __init__(self):\n        self.a = []\n    def push(self, x):\n        self.a.append(x)\n    def pop(self):\n        return self.a.pop() if self.a else None\n\ns = Stack()\nn = int(input())\nouts = []\nfor _ in range(n):\n    op = input().split()\n    if op[0] == "+":\n        s.push(int(op[1]))\n    else:\n        v = s.pop()\n        outs.append(str(v) if v is not None else "None")\nprint(" ".join(outs))',
          [t('push pop', '5', '3\n+ 5\n-\n+ 1'), t('пустой pop', 'None', '1\n-')]
        )
      ])
    ]
  },
  {
    slug: 'python-stdlib-gems',
    categoryLeafSlug: 'seed-leaf-app-stdlib',
    title: 'Стандартная библиотека',
    summary: 'itertools, functools, datetime без pip.',
    shortSummary: 'Готовые инструменты вместо ручного кода.',
    description:
      'Комбинаторика, частичное применение и простые вычисления дат средствами библиотеки.',
    difficulty: 'advanced',
    durationHours: 16,
    xpReward: 1600,
    tags: ['stdlib', 'itertools'],
    author: 'algo',
    modules: [
      moduleBlock('itertools', 'Пары и циклы.', [
        lesson(
          'psg-m1-l1',
          'Подсчёт пар',
          '## Условие\n\nЦелое `n`, список из `n` int через пробел на следующей строке. Сколько **упорядоченных пар** `(i,j)` с `i<j` и `a[i]+a[j]==0`? Выведи число.\n\n**Формат:** целое.',
          'from itertools import combinations\n\nn = int(input())\na = list(map(int, input().split()))\n',
          'from itertools import combinations\n\nn = int(input())\na = list(map(int, input().split()))\nc = sum(1 for i, j in combinations(range(n), 2) if a[i] + a[j] == 0)\nprint(c)',
          [t('1 -1 2', '1', '3\n1 -1 0'), t('нет', '0', '2\n1 2')]
        ),
        lesson(
          'psg-m1-l2',
          'Декартово произведение меток',
          '## Условие\n\nЧисло `n`, затем `n` строк — элементы множества A. Число `m`, затем `m` строк — элементы множества B. Выведи пары `a|b` для всех `a` из `sorted(A)` и `b` из `sorted(B)` в порядке `itertools.product`.\n\n**Формат:** пары через один пробел.',
          '',
          'n = int(input())\nxs = [input().strip() for _ in range(n)]\nm = int(input())\nys = [input().strip() for _ in range(m)]\nfrom itertools import product\n\nprint(" ".join(f"{x}|{y}" for x, y in product(sorted(xs), sorted(ys))))',
          [
            t('2x2', 'a|x a|y b|x b|y', '2\na\nb\n2\ny\nx'),
            t('1x1', 'solo|solo', '1\nsolo\n1\nsolo')
          ]
        )
      ]),
      moduleBlock('functools', 'reduce.', [
        lesson(
          'psg-m2-l1',
          'Произведение через reduce',
          '## Условие\n\nСписок целых через пробел (непустой). Выведи **произведение** всех чисел через `functools.reduce` и `operator.mul`.\n\n**Формат:** целое.',
          'from functools import reduce\nimport operator\nnums = list(map(int, input().split()))\n',
          'from functools import reduce\nimport operator\nnums = list(map(int, input().split()))\nprint(reduce(operator.mul, nums, 1))',
          [t('2 3 4', '24', '2 3 4'), t('одно', '-5', '-5')]
        ),
        lesson(
          'psg-m2-l2',
          'НОД цепочки',
          '## Условие\n\nДва натуральных `a b`. Выведи `gcd(a,b)` через `math.gcd`.\n\n**Формат:** натуральное.',
          'import math\n',
          'import math\na = int(input())\nb = int(input())\nprint(math.gcd(a, b))',
          [t('12 18', '6', '12\n18'), t('17 13', '1', '17\n13')]
        )
      ]),
      moduleBlock('datetime', 'fromisoformat.', [
        lesson(
          'psg-m3-l1',
          'День недели',
          '## Условие\n\nДата `YYYY-MM-DD` со stdin. Выведи номер дня недели **понедельник=0 ... воскресенье=6** для **UTC-календаря** (локаль не важна — используй `datetime.date.fromisoformat` и `weekday()` где понедельник 0).\n\nВ Python `weekday()`: понедельник 0. **Формат:** одно целое 0..6.',
          'from datetime import date\n',
          'from datetime import date\ns = input().strip()\nd = date.fromisoformat(s)\nprint(d.weekday())',
          [t('2026-04-29 ср', '2', '2026-04-29'), t('2026-01-01', '3', '2026-01-01')]
        ),
        lesson(
          'psg-m3-l2',
          'Разница дней',
          '## Условие\n\nДве даты `YYYY-MM-DD` подряд. Выведи абсолютную разницу в днях (неотрицательное целое).\n\n**Формат:** целое.',
          'from datetime import date\n',
          'from datetime import date\na = date.fromisoformat(input().strip())\nb = date.fromisoformat(input().strip())\nprint(abs((a - b).days))',
          [t('соседние', '1', '2026-01-01\n2026-01-02'), t('равны', '0', '2026-05-01\n2026-05-01')]
        )
      ])
    ]
  }
]
