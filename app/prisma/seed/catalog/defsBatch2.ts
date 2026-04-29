import { lesson, t } from './lessonHelpers'
import { moduleBlock, type CourseDef } from './courseTypes'

export const DEFS_BATCH_2: CourseDef[] = [
  {
    slug: 'python-dict-set-lab',
    categoryLeafSlug: 'seed-leaf-syn-dicts',
    title: 'Словари и множества',
    summary: 'dict/set, подсчёты уникальности, обход ключей.',
    shortSummary: 'Частоты и быстрые проверки вхождения.',
    description:
      'Практика словарей для частот, обращения по ключу и множеств для уникальных значений и операций над наборами.',
    difficulty: 'intermediate',
    durationHours: 16,
    xpReward: 1650,
    tags: ['dict', 'set', 'частоты'],
    author: 'secondary',
    modules: [
      moduleBlock('Частоты', 'dict[int] счётчик.', [
        lesson(
          'pdsl-m1-l1',
          'Уникальные встречи',
          '## Условие\n\nСтрока stdin: целые через пробел. Выведи **число уникальных** значений.\n\n**Формат:** целое.',
          'nums = list(map(int, input().split()))\n',
          'nums = list(map(int, input().split()))\nprint(len(set(nums)))',
          [t('все разные', '3', '1 2 3'), t('повторы', '2', '1 1 2 2 2')]
        ),
        lesson(
          'pdsl-m1-l2',
          'Самый частый элемент',
          '## Условие\n\nСтрока: слова через пробел. Найди слово с **максимальной** частотой; при равенстве выведи лексикографически **минимальное** среди лидеров.\n\n**Формат:** одно слово.',
          'words = input().split()\n',
          'from collections import Counter\n\nwords = input().split()\nc = Counter(words)\nmx = max(c.values())\nbest = min(w for w, k in c.items() if k == mx)\nprint(best)',
          [t('ничья a b', 'a', 'b a b a c'), t('одно слово', 'x', 'x')]
        )
      ]),
      moduleBlock('Множества', 'Операции ∩∪.', [
        lesson(
          'pdsl-m2-l1',
          'Пересечение списков',
          '## Условие\n\nДве строки stdin: целые через пробел. Выведи **отсортированные** по возрастанию элементы пересечения **через пробел**. Если пусто — выведи `пусто`.\n\n**Формат:** числа или слово `пусто`.',
          'a = list(map(int, input().split()))\nb = list(map(int, input().split()))\n',
          'a = list(map(int, input().split()))\nb = list(map(int, input().split()))\ninter = sorted(set(a) & set(b))\nprint(" ".join(map(str, inter)) if inter else "пусто")',
          [t('есть общие', '2 3', '1 2 3\n3 4 2'), t('нет', 'пусто', '1\n2')]
        ),
        lesson(
          'pdsl-m2-l2',
          'Уникальные в объединении',
          '## Условие\n\nДве строки слов через пробел. Выведи количество слов в **объединении** множеств.\n\n**Формат:** целое.',
          'wa = input().split()\nwb = input().split()\n',
          'wa = input().split()\nwb = input().split()\nprint(len(set(wa) | set(wb)))',
          [t('пересечение слов', '3', 'a b\nb c'), t('нет дублей между', '4', 'w x\ny z')]
        )
      ]),
      moduleBlock('Словари по ключу', 'get и значения по умолчанию.', [
        lesson(
          'pdsl-m3-l1',
          'Телефонная книга',
          '## Условие\n\nПервая строка `n`. Затем `n` строк вида `имя:номер`. Затем строка `q` — имя. Выведи номер или `нет`.\n\n**Формат:** строка.',
          '',
          'n = int(input())\nbook = {}\nfor _ in range(n):\n    name, num = input().split(":")\n    book[name.strip()] = num.strip()\nq = input().strip()\nprint(book.get(q, "нет"))',
          [t('найдено', '+1', '2\na:1\nb:+1\nb'), t('нет', 'нет', '1\nx:0\ny')]
        ),
        lesson(
          'pdsl-m3-l2',
          'Инверсия словаря',
          '## Условие\n\nСтрока `n`, затем `n` строк `k v` (ключ и значение — одно слово). Построй словарь. Выведи строку всех ключей **в порядке возрастания значения** (сортировка по `v`, при равенстве по ключу), ключи через пробел.\n\n**Формат:** ключи через пробел.',
          '',
          'n = int(input())\nd = {}\nfor _ in range(n):\n    k, v = input().split()\n    d[k] = int(v)\norder = sorted(d.keys(), key=lambda x: (d[x], x))\nprint(" ".join(order))',
          [
            t('порядок по значению', 'b a', '2\na 2\nb 1'),
            t('равные значения', 'a c b', '3\na 1\nb 2\nc 1')
          ]
        )
      ])
    ]
  },
  {
    slug: 'python-complexity-basics',
    categoryLeafSlug: 'seed-leaf-algo-loops',
    title: 'Циклы и оценка шагов',
    summary: 'Вложенные циклы, избегаем лишних проходов.',
    shortSummary: 'Считаем итерации простыми задачами.',
    description:
      'Разбираем, как вложенность циклов влияет на время работы, через маленькие шаговые задачи и аккуратные границы.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1400,
    tags: ['циклы', 'сложность'],
    author: 'algo',
    modules: [
      moduleBlock('Двойные циклы', 'O(n·m) интуиция.', [
        lesson(
          'pcb-m1-l1',
          'Таблица умножения строка',
          '## Условие\n\nЦелое `k` (1≤k≤9). Выведи строку: произведения `1*k, 2*k, ..., 9*k` через пробел.\n\n**Формат:** девять чисел.',
          'k = int(input())\n',
          'k = int(input())\nprint(" ".join(str(i * k) for i in range(1, 10)))',
          [t('k=1', '1 2 3 4 5 6 7 8 9', '1'), t('k=5', '5 10 15 20 25 30 35 40 45', '5')]
        ),
        lesson(
          'pcb-m1-l2',
          'Флаги в матрице',
          '## Условие\n\n`n` и `m`, затем `n` строк по `m` символов `0`/`1` без пробелов. Посчитай количество единиц.\n\n**Формат:** целое.',
          '',
          'n = int(input())\nm = int(input())\ntotal = 0\nfor _ in range(n):\n    total += input().strip().count("1")\nprint(total)',
          [t('2x2', '3', '2\n2\n01\n11'), t('нет единиц', '0', '1\n3\n000')]
        )
      ]),
      moduleBlock('Одна переменная состояния', 'while.', [
        lesson(
          'pcb-m2-l1',
          'Свести к нулю',
          '## Условие\n\nЦелое `n > 0`. Пока `n` чётное — дели на 2, иначе вычти 1; считай шаги до нуля. Выведи число шагов.\n\n**Формат:** целое.',
          'n = int(input())\n',
          'n = int(input())\nsteps = 0\nwhile n > 0:\n    if n % 2 == 0:\n        n //= 2\n    else:\n        n -= 1\n    steps += 1\nprint(steps)',
          [t('8', '4', '8'), t('1', '1', '1')]
        ),
        lesson(
          'pcb-m2-l2',
          'Поиск делителя',
          '## Условие\n\nЦелое `n > 1`. Найди **наименьший** делитель `d > 1`. Выведи `d`.\n\n**Формат:** целое.',
          'n = int(input())\n',
          'n = int(input())\nd = 2\nwhile n % d:\n    d += 1\nprint(d)',
          [t('простое 17', '17', '17'), t('составное 15', '3', '15')]
        )
      ]),
      moduleBlock('Префиксы', 'Накопление за O(n).', [
        lesson(
          'pcb-m3-l1',
          'Префиксные суммы',
          '## Условие\n\n`n`, затем `n` целых по строкам. Выведи максимальную **префиксную** сумму (max по k от 1 до n суммы первых k).\n\n**Формат:** целое.',
          '',
          'n = int(input())\na = [int(input()) for _ in range(n)]\ns = 0\nm = a[0]\nfor x in a:\n    s += x\n    m = max(m, s)\nprint(m)',
          [t('рост', '10', '4\n1\n2\n3\n4'), t('спад в конце', '6', '3\n5\n2\n-10')]
        ),
        lesson(
          'pcb-m3-l2',
          'Два указателя на массиве',
          '## Условие\n\nОтсортированный по неубыванию список: строка целых через пробел, затем `t`. Найди **количество** пар `(i,j)` с `i<j` и `a[i]+a[j]==t` за O(n) двумя индексами.\n\n**Формат:** целое.',
          'nums = list(map(int, input().split()))\nt = int(input())\n',
          'nums = list(map(int, input().split()))\nt = int(input())\ni, j = 0, len(nums) - 1\ncnt = 0\nwhile i < j:\n    s = nums[i] + nums[j]\n    if s == t:\n        cnt += 1\n        i += 1\n        j -= 1\n    elif s < t:\n        i += 1\n    else:\n        j -= 1\nprint(cnt)',
          [t('одна пара', '1', '1 2 3 4\n5'), t('нет', '0', '1 2 3\n10')]
        )
      ])
    ]
  },
  {
    slug: 'python-recursion-starter',
    categoryLeafSlug: 'seed-leaf-algo-rec',
    title: 'Рекурсия без страха',
    summary: 'База, шаг, глубина для классических задач.',
    shortSummary: 'Факториал, числа Фибоначчи, разворот строки.',
    description:
      'Учимся формулировать рекурсивные решения с явной базой и уменьшением аргумента; следим за стеком на малых n.',
    difficulty: 'intermediate',
    durationHours: 15,
    xpReward: 1550,
    tags: ['рекурсия', 'факториал'],
    author: 'algo',
    modules: [
      moduleBlock('Классика', 'fac и fib.', [
        lesson(
          'prs-m1-l1',
          'Факториал',
          '## Условие\n\n`0 <= n <= 12`. Выведи `n!`.\n\n**Формат:** целое.',
          'def fac(n):\n    pass\n\nprint(fac(int(input())))\n',
          'def fac(n):\n    return 1 if n <= 1 else n * fac(n - 1)\n\nprint(fac(int(input())))',
          [t('5', '120', '5'), t('0', '1', '0')]
        ),
        lesson(
          'prs-m1-l2',
          'Фибоначчи',
          '## Условие\n\n`0 <= n <= 25`. `F(0)=0`, `F(1)=1`. Выведи `F(n)` рекурсивно (не оптимизируй мемоизацией — n маленькие).\n\n**Формат:** целое.',
          'def fib(n):\n    pass\n\nprint(fib(int(input())))\n',
          'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(int(input())))',
          [t('6', '8', '6'), t('1', '1', '1')]
        )
      ]),
      moduleBlock('Строки', 'Рекурсивный разворот.', [
        lesson(
          'prs-m2-l1',
          'Разворот строки',
          '## Условие\n\nСтрока `s` без переводов строк. Рекурсивно (разбей на первый символ + хвост) верни развернутую строку. **Нельзя** использовать `s[::-1]`.\n\n**Формат:** строка.',
          'def rev(s):\n    pass\n\nprint(rev(input().strip()))\n',
          'def rev(s):\n    if len(s) <= 1:\n        return s\n    return rev(s[1:]) + s[0]\n\nprint(rev(input().strip()))',
          [t('abc', 'cba', 'abc'), t('z', 'z', 'z')]
        ),
        lesson(
          'prs-m2-l2',
          'Степень двойки',
          '## Условие\n\n`n >= 0`. Рекурсивно: `pow2(n) = 2**n` через `pow2(n)=2*pow2(n-1)`, база `pow2(0)=1`. Выведи `pow2(n)`.\n\n**Формат:** целое.',
          'def pow2(n):\n    pass\n\nprint(pow2(int(input())))\n',
          'def pow2(n):\n    return 1 if n == 0 else 2 * pow2(n - 1)\n\nprint(pow2(int(input())))',
          [t('10', '1024', '10'), t('0', '1', '0')]
        )
      ]),
      moduleBlock('Разбор случаев', 'Две рекурсии.', [
        lesson(
          'prs-m3-l1',
          'Сумма цифр',
          '## Условие\n\nЦелое `x` (может отрицательным). Выведи сумму **десятичных** цифр модуля `|x|` рекурсивно.\n\n**Формат:** неотрицательное целое.',
          'def digit_sum(x):\n    pass\n\nprint(digit_sum(int(input())))\n',
          'def digit_sum(x):\n    x = abs(x)\n    if x < 10:\n        return x\n    return x % 10 + digit_sum(x // 10)\n\nprint(digit_sum(int(input())))',
          [t('123', '6', '123'), t('-99', '18', '-99')]
        ),
        lesson(
          'prs-m3-l2',
          'Длина списка без len',
          '## Условие\n\nСтрока: целые через пробел (может быть пустая). Рекурсивно посчитай количество элементов **без** `len()`.\n\n**Формат:** целое.',
          'nums = list(map(int, input().split()))\n\ndef countlst(a):\n    pass\n\nprint(countlst(nums))\n',
          'nums = list(map(int, input().split()))\n\ndef countlst(a):\n    if not a:\n        return 0\n    return 1 + countlst(a[1:])\n\nprint(countlst(nums))',
          [t('три', '3', '1 2 3'), t('пусто', '0', '')]
        )
      ])
    ]
  },
  {
    slug: 'python-sorting-kit',
    categoryLeafSlug: 'seed-leaf-algo-sort',
    title: 'Сортировки и ключи',
    summary: 'sorted, key=, стабильность на практике.',
    shortSummary: 'Упорядочиваем данные в одну строку.',
    description:
      'Сортировка встроенным `sorted`, пользовательские ключи и сортировка кортежей для приоритетов.',
    difficulty: 'intermediate',
    durationHours: 12,
    xpReward: 1300,
    tags: ['sorted', 'key'],
    author: 'algo',
    modules: [
      moduleBlock('Простой sorted', 'Числа и строки.', [
        lesson(
          'psk-m1-l1',
          'По абсолютной величине',
          '## Условие\n\nЦелые через пробел. Выведи **по возрастанию** `|x|`, при равенстве по самому числу.\n\n**Формат:** числа через пробел.',
          'nums = list(map(int, input().split()))\n',
          'nums = list(map(int, input().split()))\nprint(" ".join(str(x) for x in sorted(nums, key=lambda x: (abs(x), x))))',
          [t('знаки', '-3 -1 2 4', '-3 2 -1 4'), t('ровно', '1 1 1', '1 1 1')]
        ),
        lesson(
          'psk-m1-l2',
          'Длина слова',
          '## Условие\n\nСлова через пробел. Отсортируй по **убыванию длины**, при равенстве лексикографически.\n\n**Формат:** слова через пробел.',
          'words = input().split()\n',
          'words = input().split()\nprint(" ".join(sorted(words, key=lambda w: (-len(w), w))))',
          [t('aa bbbbb c', 'bbbbb aa c', 'c aa bbbbb'), t('ровно', 'x y', 'x y')]
        )
      ]),
      moduleBlock('Кортежи ключей', 'Несколько критериев.', [
        lesson(
          'psk-m2-l1',
          'Студенты по баллам',
          '## Условие\n\n`n`, затем `n` строк `имя балл`. Сортируй по **убыванию балла**, затем по имени по возрастанию. Выведи имена через пробел.\n\n**Формат:** имена.',
          '',
          'n = int(input())\nrows = [input().split() for _ in range(n)]\nrows.sort(key=lambda r: (-int(r[1]), r[0]))\nprint(" ".join(r[0] for r in rows))',
          [t('ничья', 'a b', '2\nb 5\na 5'), t('разные', 'z x', '2\nx 3\nz 9')]
        ),
        lesson(
          'psk-m2-l2',
          'Чётные первыми',
          '## Условие\n\nСписок целых через пробел. Стабильно отсортируй так: **чётные** перед **нечётными**, внутри групп по возрастанию значения.\n\n**Формат:** числа через пробел.',
          'nums = list(map(int, input().split()))\n',
          'nums = list(map(int, input().split()))\nprint(" ".join(str(x) for x in sorted(nums, key=lambda x: (x % 2, x))))',
          [t('перемешка', '2 4 1 3', '3 2 1 4'), t('только нечётные', '1 3', '3 1')]
        )
      ]),
      moduleBlock('Перестановка индексов', 'sorted(range).', [
        lesson(
          'psk-m3-l1',
          'Индексы по значениям',
          '## Условие\n\n`n`, затем `n` чисел. Выведи индексы `0..n-1` отсортированные по **возрастанию значений** массива.\n\n**Формат:** индексы через пробел.',
          '',
          'n = int(input())\na = [int(input()) for _ in range(n)]\nidx = sorted(range(n), key=lambda i: a[i])\nprint(" ".join(str(i) for i in idx))',
          [t('пример', '1 0 2', '3\n10\n5\n7'), t('ровно', '0 1', '2\n1\n1')]
        ),
        lesson(
          'psk-m3-l2',
          'Последний по алфавиту',
          '## Условие\n\n`n`, затем `n` слов по строке. Какое слово будет **последним** при стандартной сортировке Python (`sorted`)? Выведи его.\n\n**Формат:** слово.',
          '',
          'n = int(input())\nwords = [input().strip() for _ in range(n)]\nprint(max(words))',
          [t('набор', 'я', '3\nа\nб\nя'), t('одно', 'solo', '1\nsolo')]
        )
      ])
    ]
  },
  {
    slug: 'python-files-workshop',
    categoryLeafSlug: 'seed-leaf-data-files',
    title: 'Текст как поток',
    summary: 'Многострочный stdin, «строки файла», splitlines.',
    shortSummary: 'Считаем строки и поля без реального FS.',
    description:
      'Платформенные тесты подают ввод как «содержимое»: учимся обрабатывать несколько строк stdin как файл.',
    difficulty: 'beginner',
    durationHours: 11,
    xpReward: 1150,
    tags: ['строки', 'файлы', 'stdin'],
    author: 'secondary',
    modules: [
      moduleBlock('Многострочный ввод', 'read until EOF-style.', [
        lesson(
          'pfw-m1-l1',
          'Строки из stdin',
          '## Условие\n\nЧитай строки stdin до пустой строки-терминатора (остановись на **пустой** строке, её не включай). Выведи количество прочитанных строк.\n\n**Формат:** целое.',
          'lines = []\nwhile True:\n    s = input()\n    if s == "":\n        break\n    lines.append(s)\n',
          'lines = []\nwhile True:\n    s = input()\n    if s == "":\n        break\n    lines.append(s)\nprint(len(lines))',
          [t('две строки', '2', 'a\nb\n\n'), t('сразу пусто', '0', '\n')]
        ),
        lesson(
          'pfw-m1-l2',
          'Сумма чисел построчно',
          '## Условие\n\nПервая строка `n`. Затем `n` строк — по одному целому. Выведи сумму.\n\n**Формат:** целое.',
          '',
          'n = int(input())\nprint(sum(int(input()) for _ in range(n)))',
          [t('1+2+3', '6', '3\n1\n2\n3'), t('одно', '42', '1\n42')]
        )
      ]),
      moduleBlock('Разбор полей', 'split по разделителю.', [
        lesson(
          'pfw-m2-l1',
          'CSV-подобно',
          '## Условие\n\nСтрока заголовка пропущена: первая строка stdin — число `n`. Затем `n` строк вида `a;b;c` (ровно три поля). Выведи сумму средних полей как целых.\n\n**Формат:** целое.',
          '',
          'n = int(input())\ntotal = 0\nfor _ in range(n):\n    a, b, c = input().split(";")\n    total += int(b)\nprint(total)',
          [t('две строки', '7', '2\n1;3;0\n9;4;1'), t('одна', '5', '1\n0;5;0')]
        ),
        lesson(
          'pfw-m2-l2',
          'Убрать пустые токены',
          '## Условие\n\nОдна строка — слова через **запятую** (могут быть пустые места). Разбей по `,`, у каждого токена сделай `strip`, удали пустые. Выведи количество токенов.\n\n**Формат:** целое.',
          'line = input()\n',
          'line = input()\ntoks = [x.strip() for x in line.split(",") if x.strip()]\nprint(len(toks))',
          [t('пробелы', '3', ' a , b ,  c '), t('пусто', '0', ' , , ')]
        )
      ]),
      moduleBlock('Нормализация', 'lower/strip.', [
        lesson(
          'pfw-m3-l1',
          'Уникальные слова в регистре',
          '## Условие\n\nСтрока слов через пробел. Приведи к нижнему регистру, уникальные отсортируй и выведи через пробел.\n\n**Формат:** слова через пробел.',
          'words = input().split()\n',
          'words = input().split()\nprint(" ".join(sorted({w.lower() for w in words})))',
          [t('Aa bb BB', 'aa bb', 'Aa bb BB'), t('одно', 'x', 'X')]
        ),
        lesson(
          'pfw-m3-l2',
          'Максимальная строка по длине',
          '## Условие\n\n`n`, затем `n` строк. Выведи самую длинную строку; при равенстве — **первую** по вводу.\n\n**Формат:** строка.',
          '',
          'n = int(input())\nbest = input()\nfor _ in range(n - 1):\n    s = input()\n    if len(s) > len(best):\n        best = s\nprint(best)',
          [t('ничья берём первую', 'aa', '2\naa\nxx'), t('длиннее', 'zzz', '2\na\nzzz')]
        )
      ])
    ]
  },
  {
    slug: 'python-json-recipes',
    categoryLeafSlug: 'seed-leaf-data-json',
    title: 'JSON в Python',
    summary: 'json.loads, dumps, вложенные структуры.',
    shortSummary: 'Парсим и собираем ответ.',
    description:
      'Без внешних библиотек: стандартный `json` для чтения компактной строки и вывода полей.',
    difficulty: 'intermediate',
    durationHours: 13,
    xpReward: 1350,
    tags: ['json', 'парсинг'],
    author: 'primary',
    modules: [
      moduleBlock('loads', 'Словари из строки.', [
        lesson(
          'pjr-m1-l1',
          'Поле name',
          '## Условие\n\nОдна строка stdin — JSON объект с ключами `name` и `age` (строка и число). Выведи `name`.\n\n**Формат:** строка.',
          'import json\ns = input().strip()\n',
          'import json\ns = input().strip()\nobj = json.loads(s)\nprint(obj["name"])',
          [
            t('анна', 'Анна', '{"name": "Анна", "age": 30}'),
            t('латынь', 'Anna', '{"name": "Anna", "age": 1}')
          ]
        ),
        lesson(
          'pjr-m1-l2',
          'Сумма массива в JSON',
          '## Условие\n\nJSON массив целых в одну строку. Выведи сумму элементов.\n\n**Формат:** целое.',
          'import json\n',
          'import json\narr = json.loads(input().strip())\nprint(sum(arr))',
          [t('1 2 3', '6', '[1,2,3]'), t('пусто', '0', '[]')]
        )
      ]),
      moduleBlock('dumps', 'Сборка JSON строки.', [
        lesson(
          'pjr-m2-l1',
          'Объект из stdin пар',
          '## Условие\n\n`n`, затем `n` строк `ключ число`. Собери словарь `{"ключ": число}` и выведи **компактный** JSON без пробелов (`separators=(",", ":")`).\n\n**Формат:** JSON.',
          '',
          'import json\nn = int(input())\nd = {}\nfor _ in range(n):\n    k, v = input().split()\n    d[k] = int(v)\nprint(json.dumps(d, ensure_ascii=False, separators=(",", ":")))',
          [t('два ключа', '{"a":1,"b":2}', '2\na 1\nb 2'), t('один', '{"x":0}', '1\nx 0')]
        ),
        lesson(
          'pjr-m2-l2',
          'Вложенность',
          '## Условие\n\nСтрока JSON: `{"user": {"score": N}}`. Выведи число `N`.\n\n**Формат:** целое.',
          'import json\n',
          'import json\nobj = json.loads(input().strip())\nprint(obj["user"]["score"])',
          [t('5', '5', '{"user":{"score":5}}'), t('0', '0', '{"user":{"score":0}}')]
        )
      ]),
      moduleBlock('Границы', 'ensure_ascii.', [
        lesson(
          'pjr-m3-l1',
          'Кириллица в JSON',
          '## Условие\n\nОдна строка — слово на кириллице. Выведи JSON массив из одного элемента — этого слова — с **ensure_ascii=False** через `json.dumps` (внешние кавычки как у печати json-строки).\n\n**Формат:** строка вида `["слово"]`.',
          'import json\nw = input().strip()\n',
          'import json\nw = input().strip()\nprint(json.dumps([w], ensure_ascii=False, separators=(",", ":")))',
          [t('кириллица', '["привет"]', 'привет'), t('en', '["hi"]', 'hi')]
        ),
        lesson(
          'pjr-m3-l2',
          'Сортировка ключей в дампе',
          '## Условие\n\n`n`, затем `n` строк `ключ целое`. Собери dict и выведи `json.dumps(..., sort_keys=True, separators=(",", ":"))`.\n\n**Формат:** JSON.',
          '',
          'import json\n\nn = int(input())\nd = {}\nfor _ in range(n):\n    k, v = input().split()\n    d[k] = int(v)\nprint(json.dumps(d, sort_keys=True, separators=(",", ":")))',
          [
            t('три ключа', '{"a":1,"b":2,"c":3}', '3\nb 2\na 1\nc 3'),
            t('два ключа', '{"x":0,"y":1}', '2\ny 1\nx 0')
          ]
        )
      ])
    ]
  }
]
