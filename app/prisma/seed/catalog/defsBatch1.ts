import { lesson, t } from './lessonHelpers'
import { moduleBlock, type CourseDef } from './courseTypes'

export const DEFS_BATCH_1: CourseDef[] = [
  {
    slug: 'python-basics',
    categoryLeafSlug: 'seed-leaf-env-io',
    title: 'Python с нуля: ввод-вывод',
    summary: 'Первая программа, print, чтение строки со stdin.',
    shortSummary: 'От Hello World до чтения ввода.',
    description:
      'Пошагово осваиваем запуск кода и обмен с консолью: печать текста, форматирование простых ответов и чтение одной строки ввода.',
    difficulty: 'beginner',
    durationHours: 14,
    xpReward: 1400,
    tags: ['основы', 'console', 'python'],
    author: 'primary',
    modules: [
      moduleBlock('Старт в консоли', 'Печать и литералы.', [
        lesson(
          'python-basics-m1-l1',
          'Привет, CodeRoster',
          '## Условие\n\nВыведи **ровно** одну строку: `Hello, CodeRoster`.\n\n**Формат вывода:** одна строка в stdout, без лишних пробелов в начале/конце.',
          '# выведи строку\n',
          'print("Hello, CodeRoster")',
          [
            t('Ровный текст приветствия', 'Hello, CodeRoster'),
            t('Повторная проверка той же строки', 'Hello, CodeRoster')
          ]
        ),
        lesson(
          'python-basics-m1-l2',
          'Две строки подряд',
          '## Условие\n\nВыведи две строки: первая `Курс`, вторая `Старт`. Каждая с новой строки.\n\n**Формат:** ровно две строки.',
          '# print дважды\n',
          'print("Курс")\nprint("Старт")',
          [t('Две строки кряду', 'Курс\nСтарт'), t('Без третьей строки', 'Курс\nСтарт')]
        )
      ]),
      moduleBlock('Числа как текст', 'str() и конкатенация.', [
        lesson(
          'python-basics-m2-l1',
          'Склейка числа и текста',
          '## Условие\n\nС stdin целое `n`. Выведи строку вида `Год: <n>` **без** лишнего пробела в конце.\n\n**Формат stdout:** одна строка `Год: <число>`.',
          'n = int(input())\n# используй str(n)\n',
          'n = int(input())\nprint("Год: " + str(n))',
          [t('Для 2026', 'Год: 2026', '2026'), t('Другое число', 'Год: 7', '7')]
        ),
        lesson(
          'python-basics-m2-l2',
          'Повтор слова',
          '## Условие\n\nСо stdin придёт одно слово без пробелов (одна строка). Выведи его **дважды** через пробел.\n\n**Пример:** stdin `code` → stdout `code code`.',
          'w = input().strip()\n',
          'w = input().strip()\nprint(w + " " + w)',
          [t('Слово test', 'test test', 'test'), t('Слово да', 'да да', 'да')]
        )
      ]),
      moduleBlock('Мини-сценарии', 'Несколько print подряд.', [
        lesson(
          'python-basics-m3-l1',
          'Баннер курса',
          '## Условие\n\nВыведи три строки: `---`, затем `CodeRoster`, затем `---`.\n\n**Формат:** три строки, символы ровно как в условии.',
          '# три print\n',
          'print("---")\nprint("CodeRoster")\nprint("---")',
          [
            t('Полный баннер', '---\nCodeRoster\n---'),
            t('Середина не пустая', '---\nCodeRoster\n---')
          ]
        ),
        lesson(
          'python-basics-m3-l2',
          'Счётчик из stdin',
          '## Условие\n\nС stdin целое `k`. Выведи строку `Старт k` где вместо `k` подставлено число.\n\n**Формат:** `Старт <число>`, одна строка.',
          'k = int(input())\n',
          'k = int(input())\nprint("Старт " + str(k))',
          [t('k=1', 'Старт 1', '1'), t('k=42', 'Старт 42', '42'), t('k=0', 'Старт 0', '0')]
        )
      ])
    ]
  },
  {
    slug: 'python-types-mastery',
    categoryLeafSlug: 'seed-leaf-env-types',
    title: 'Типы и приведения в Python',
    summary: 'int, float, bool, аккуратные преобразования и проверки.',
    shortSummary: 'Превращаем строки в числа и обратно.',
    description:
      'Учимся читать смешанный ввод, приводить типы и избегать скрытых ошибок: целые, вещественные и логические значения.',
    difficulty: 'beginner',
    durationHours: 12,
    xpReward: 1200,
    tags: ['типы', 'int', 'float'],
    author: 'primary',
    modules: [
      moduleBlock('Целые и вещественные', 'int и float.', [
        lesson(
          'ptm-m1-l1',
          'Сумма двух целых из stdin',
          '## Условие\n\nДве строки stdin: целые `a` и `b`. Выведи их **сумму** как целое (без `.0`).\n\n**Формат:** одно целое число.',
          'a = int(input())\nb = int(input())\n',
          'a = int(input())\nb = int(input())\nprint(a + b)',
          [t('2+3', '5', '2\n3'), t('10+-4', '6', '10\n-4'), t('0+0', '0', '0\n0')]
        ),
        lesson(
          'ptm-m1-l2',
          'Среднее float',
          '## Условие\n\nДва float через stdin (по строке). Выведи их среднее арифметическое **с точностью до 2 знаков** после запятой (используй `round(x, 2)` и печать числа).\n\n**Пример:** `1` и `2` → `1.5` или `1.50` — проверка сравнивает **строковый** вывод после trim; выведи минимально без лишних нулей: `round` даёт `1.5` для 1.5.',
          'x = float(input())\ny = float(input())\n',
          'x = float(input())\ny = float(input())\nprint(round((x + y) / 2, 2))',
          [t('1 и 3 → 2.0', '2.0', '1\n3'), t('0.1 и 0.2', '0.15', '0.1\n0.2')]
        )
      ]),
      moduleBlock('Логические значения', 'bool и сравнения.', [
        lesson(
          'ptm-m2-l1',
          'Метка чётности',
          '## Условие\n\nЦелое `n` со stdin. Если чётное — выведи `YES`, иначе `NO`.\n\n**Формат:** одно слово верхним регистром.',
          'n = int(input())\n',
          'n = int(input())\nprint("YES" if n % 2 == 0 else "NO")',
          [t('n=4', 'YES', '4'), t('n=7', 'NO', '7'), t('n=0', 'YES', '0')]
        ),
        lesson(
          'ptm-m2-l2',
          'Порог по float',
          '## Условие\n\nДва числа `t` и `p` (float). Если `t >= p` выведи `достаточно`, иначе `мало`.\n\n**Формат:** одно русское слово в нижнем регистре.',
          't = float(input())\np = float(input())\n',
          't = float(input())\np = float(input())\nprint("достаточно" if t >= p else "мало")',
          [t('равны', 'достаточно', '5\n5'), t('меньше', 'мало', '1\n9')]
        )
      ]),
      moduleBlock('Строки как данные', 'strip и split по одному слову.', [
        lesson(
          'ptm-m3-l1',
          'Цифра из строки',
          '## Условие\n\nОдна строка stdin — целое (может с пробелами по краям). Выведи число **+1**.\n\n**Формат:** одно целое.',
          's = input()\n',
          's = input()\nprint(int(s.strip()) + 1)',
          [t(' «5» ', '6', ' 5 '), t('-1 → 0', '0', '-1')]
        ),
        lesson(
          'ptm-m3-l2',
          'Bool как число',
          '## Условие\n\nС stdin `1` или `0`. Преобразуй: если `1` выведи `True`, если `0` выведи `False` (именно такие литералы Python строкой не нужно — выведи текстом `True`/`False`).\n\n**Формат:** `True` или `False`.',
          'b = int(input())\n',
          'b = int(input())\nprint(bool(b))',
          [t('ввод 1', 'True', '1'), t('ввод 0', 'False', '0')]
        )
      ])
    ]
  },
  {
    slug: 'python-exceptions-handbook',
    categoryLeafSlug: 'seed-leaf-env-errors',
    title: 'Исключения и устойчивый код',
    summary: 'try/except, безопасное деление, контроль ввода.',
    shortSummary: 'Обрабатываем ошибки без падения.',
    description:
      'Практика печати сообщений об ошибках и возврата к запасному пути: деление на ноль, неверный ввод.',
    difficulty: 'beginner',
    durationHours: 10,
    xpReward: 1100,
    tags: ['exceptions', 'try', 'except'],
    author: 'secondary',
    modules: [
      moduleBlock('Деление и ZeroDivisionError', 'Явные сообщения.', [
        lesson(
          'peh-m1-l1',
          'Безопасное частное',
          '## Условие\n\nДва целых `a` и `b`. Если `b==0`, выведи ровно `ошибка`. Иначе выведи целое `a // b`.\n\n**Формат:** либо `ошибка`, либо целое.',
          'a = int(input())\nb = int(input())\n',
          'a = int(input())\nb = int(input())\nif b == 0:\n    print("ошибка")\nelse:\n    print(a // b)',
          [
            t('норма', '3', '7\n2'),
            t('деление на ноль', 'ошибка', '5\n0'),
            t('отрицательные', '-2', '-7\n3')
          ]
        ),
        lesson(
          'peh-m1-l2',
          'float деление или ошибка',
          '## Условие\n\nДва float `x` и `y`. Если `y==0.0` выведи `nan`. Иначе выведи `x/y` через `round(..., 4)`.\n\n**Формат:** либо `nan`, либо число.',
          'x = float(input())\ny = float(input())\n',
          'x = float(input())\ny = float(input())\nif y == 0.0:\n    print("nan")\nelse:\n    print(round(x / y, 4))',
          [t('ok', '2.0', '4\n2'), t('ноль', 'nan', '3\n0')]
        )
      ]),
      moduleBlock('ValueError вручную', 'Простая валидация.', [
        lesson(
          'peh-m2-l1',
          'Только положительное',
          '## Условие\n\nЦелое `n`. Если `n > 0` выведи `ok`. Иначе выведи `плохо`.\n\n**Формат:** одно русское слово.',
          'n = int(input())\n',
          'n = int(input())\nprint("ok" if n > 0 else "плохо")',
          [t('5', 'ok', '5'), t('0', 'плохо', '0'), t('-3', 'плохо', '-3')]
        ),
        lesson(
          'peh-m2-l2',
          'Длина строки',
          '## Условие\n\nСтрока `s` со stdin. Если длина `< 3` выведи `коротко`, иначе выведи длину числом.\n\n**Формат:** слово или целое.',
          's = input().strip()\n',
          's = input().strip()\nif len(s) < 3:\n    print("коротко")\nelse:\n    print(len(s))',
          [t('ab', 'коротко', 'ab'), t('hello', '5', 'hello')]
        )
      ]),
      moduleBlock('Сообщения пользователю', 'Единый стиль ответа.', [
        lesson(
          'peh-m3-l1',
          'Индекс в пределах',
          '## Условие\n\nВ stdin три целых: `n`, `i`, `x`. Если `0 <= i < n` выведи `да`, иначе `нет`.\n\n**Формат:** `да` или `нет`.',
          'n = int(input())\ni = int(input())\nx = int(input())\n',
          'n = int(input())\ni = int(input())\n_ = int(input())\nprint("да" if 0 <= i < n else "нет")',
          [
            t('внутри', 'да', '5\n2\n9'),
            t('граница', 'нет', '5\n5\n0'),
            t('ноль элементов', 'нет', '0\n0\n1')
          ]
        ),
        lesson(
          'peh-m3-l2',
          'Минимум двух',
          '## Условие\n\nДва целых. Выведи **минимум** из них.\n\n**Формат:** одно целое.',
          'a = int(input())\nb = int(input())\n',
          'a = int(input())\nb = int(input())\nprint(min(a, b))',
          [t('3 7', '3', '3\n7'), t('-1 -5', '-5', '-1\n-5')]
        )
      ])
    ]
  },
  {
    slug: 'python-functions-deep',
    categoryLeafSlug: 'seed-leaf-syn-funcs',
    title: 'Функции: параметры и возврат',
    summary: 'def, return, значения по умолчанию, лямбда не нужна.',
    shortSummary: 'Собираем логику в вызываемые блоки.',
    description:
      'Курс про разбиение программы на функции: сигнатуры, возвращаемые значения, значения по умолчанию и маленькие проверки.',
    difficulty: 'beginner',
    durationHours: 16,
    xpReward: 1600,
    tags: ['функции', 'def', 'return'],
    author: 'primary',
    modules: [
      moduleBlock('Базовые def', 'Один return.', [
        lesson(
          'pfd-m1-l1',
          'Квадрат числа',
          '## Условие\n\nРеализуй функцию `sq(x)` возвращающую `x*x`. В stdin одно целое `n`. Выведи `sq(n)`.\n\n**Формат:** одно целое.',
          'def sq(x):\n    pass\n\nn = int(input())\n',
          'def sq(x):\n    return x * x\n\nn = int(input())\nprint(sq(n))',
          [t('n=3', '9', '3'), t('n=-4', '16', '-4')]
        ),
        lesson(
          'pfd-m1-l2',
          'Приветствие по имени',
          '## Условие\n\nФункция `hi(name)` возвращает строку `Привет, <name>!` без лишних пробелов. stdin — имя одной строкой. Выведи результат.\n\n**Формат:** одна строка UTF-8.',
          'def hi(name):\n    pass\n\nname = input().strip()\n',
          'def hi(name):\n    return "Привет, " + name + "!"\n\nname = input().strip()\nprint(hi(name))',
          [t('Анна', 'Привет, Анна!', 'Анна'), t('x', 'Привет, x!', 'x')]
        )
      ]),
      moduleBlock('Значения по умолчанию', 'Неизменяемые дефолты.', [
        lesson(
          'pfd-m2-l1',
          'Сумма с базой',
          '## Условие\n\nФункция `add(a, b=0)` возвращает `a+b`. stdin два целых через две строки. Выведи `add(a,b)`.\n\n**Формат:** целое.',
          'def add(a, b=0):\n    pass\n\na = int(input())\nb = int(input())\n',
          'def add(a, b=0):\n    return a + b\n\na = int(input())\nb = int(input())\nprint(add(a, b))',
          [t('1 2', '3', '1\n2'), t('5 -5', '0', '5\n-5')]
        ),
        lesson(
          'pfd-m2-l2',
          'Разделитель слов',
          '## Условие\n\nФункция `join_words(a, b, sep=" ")` возвращает `a + sep + b`. stdin: три строки — `a`, `b`, `sep`. Выведи результат.\n\n**Формат:** одна строка.',
          'def join_words(a, b, sep=" "):\n    pass\n\na = input().strip()\nb = input().strip()\nsep = input().strip()\n',
          'def join_words(a, b, sep=" "):\n    return a + sep + b\n\na = input().strip()\nb = input().strip()\nsep = input().strip()\nprint(join_words(a, b, sep))',
          [t('дефис', 'foo-bar', 'foo\nbar\n-'), t('пробел как разделитель', 'x y', 'x\ny\n ')]
        )
      ]),
      moduleBlock('Композиция', 'Функция вызывает функцию.', [
        lesson(
          'pfd-m3-l1',
          'Двойной квадрат',
          '## Условие\n\nИспользуя уже определённую `sq`, добавь `quad(x)` = `sq(sq(x))`. stdin целое `n`, выведи `quad(n)`.\n\n**Формат:** целое.',
          'def sq(x):\n    return x * x\n\ndef quad(x):\n    pass\n\nprint(quad(int(input())))\n',
          'def sq(x):\n    return x * x\n\ndef quad(x):\n    return sq(sq(x))\n\nprint(quad(int(input())))',
          [t('2', '16', '2'), t('1', '1', '1')]
        ),
        lesson(
          'pfd-m3-l2',
          'Абсолютная разница',
          '## Условие\n\nФункция `dist(a,b)` возвращает `abs(a-b)`. stdin два целых, выведи `dist`.\n\n**Формат:** неотрицательное целое.',
          'def dist(a, b):\n    pass\n',
          'def dist(a, b):\n    return abs(a - b)\n\nprint(dist(int(input()), int(input())))',
          [t('3 10', '7', '3\n10'), t('равны', '0', '4\n4')]
        )
      ])
    ]
  },
  {
    slug: 'python-list-power',
    categoryLeafSlug: 'seed-leaf-syn-lists',
    title: 'Списки и включения',
    summary: 'list, range, comprehensions, агрегаты.',
    shortSummary: 'Массовые операции над последовательностями.',
    description:
      'От простых списков до генераторных выражлений: суммы, фильтрация, преобразование элементов.',
    difficulty: 'intermediate',
    durationHours: 18,
    xpReward: 1800,
    tags: ['списки', 'comprehension'],
    author: 'primary',
    modules: [
      moduleBlock('Создание и обход', 'range и for.', [
        lesson(
          'plp-m1-l1',
          'Сумма от 1 до n',
          '## Условие\n\nЦелое `n >= 1`. Выведи сумму `1+2+...+n`.\n\n**Формат:** целое.',
          'n = int(input())\n',
          'n = int(input())\nprint(sum(range(1, n + 1)))',
          [t('n=1', '1', '1'), t('n=5', '15', '5'), t('n=10', '55', '10')]
        ),
        lesson(
          'plp-m1-l2',
          'Квадраты в строку',
          '## Условие\n\nВ stdin `n`. Выведи через пробел квадраты `1..n`.\n\n**Формат:** числа через один пробел, без хвостового пробела.',
          'n = int(input())\n',
          'n = int(input())\nprint(" ".join(str(i * i) for i in range(1, n + 1)))',
          [t('n=3', '1 4 9', '3'), t('n=1', '1', '1')]
        )
      ]),
      moduleBlock('Фильтрация', 'Условия в comprehension.', [
        lesson(
          'plp-m2-l1',
          'Только чётные',
          '## Условие\n\nСтрока stdin: целые через пробел. Выведи **сумму** только чётных.\n\n**Формат:** целое.',
          'nums = list(map(int, input().split()))\n',
          'nums = list(map(int, input().split()))\nprint(sum(x for x in nums if x % 2 == 0))',
          [t('1 2 3 4', '6', '1 2 3 4'), t('нет чётных', '0', '1 3 5')]
        ),
        lesson(
          'plp-m2-l2',
          'Длины строк',
          '## Условие\n\nСтрока: слова через пробел. Выведи **максимальную** длину слова (если слов нет — `0`).\n\n**Формат:** целое.',
          'words = input().split()\n',
          'words = input().split()\nprint(max((len(w) for w in words), default=0))',
          [t('a bb ccc', '3', 'a bb ccc'), t('пусто', '0', '')]
        )
      ]),
      moduleBlock('Копирование и срезы', 'Без побочных эффектов.', [
        lesson(
          'plp-m3-l1',
          'Разворот без reverse',
          '## Условие\n\nСписок целых в stdin (через пробел). Выведи его в обратном порядке **через пробел**.\n\n**Формат:** числа через пробел.',
          'nums = list(map(int, input().split()))\n',
          'nums = list(map(int, input().split()))\nprint(" ".join(str(x) for x in reversed(nums)))',
          [t('1 2 3', '3 2 1', '1 2 3'), t('один', '7', '7')]
        ),
        lesson(
          'plp-m3-l2',
          'Срез середины',
          '## Условие\n\nТри целых `n`, `a`, `b` где `0<=a<=b<n`. Затем `n` целых по строкам. Выведи элементы с индекса `a` включительно до `b` включительно **через пробел**.\n\n**Формат:** подсписок.',
          'n = int(input())\na = int(input())\nb = int(input())\n# затем n строк с числами\n',
          'n = int(input())\na = int(input())\nb = int(input())\narr = [int(input()) for _ in range(n)]\nprint(" ".join(str(x) for x in arr[a : b + 1]))',
          [t('пример', '20 30', '3\n1\n2\n10\n20\n30'), t('один элемент', '5', '2\n0\n0\n5\n9')]
        )
      ])
    ]
  }
]
