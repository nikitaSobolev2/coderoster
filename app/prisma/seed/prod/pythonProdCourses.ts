import { moduleBlock, type CourseDef } from '../catalog/courseTypes'

import { bi, theoryRU, tt } from './helpers'

/** Двенадцать Python-курсов: билингвальные задачи (RU секции), основной язык карточки — Python. */
export const PYTHON_PROD_COURSES: CourseDef[] = [
  {
    slug: 'prod-py-io',
    categoryLeafSlug: 'seed-leaf-env-io',
    title: 'Python: консоль, потоки данных и первые строки',
    summary: 'Печать, чтение строки через stdin, связка текста и числа.',
    shortSummary: 'Старт в терминале: Hello World → базовый ввод.',
    description:
      'Осваиваем физический поток **stdin → программа → stdout**: литералы, `print`, чтение одной строки и сборки строк с числом. К каждой задаче доступны шаблоны на Python и PHP.',
    difficulty: 'beginner',
    durationHours: 10,
    xpReward: 1000,
    tags: ['python', 'stdin', 'stdout'],
    author: 'primary',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Ориентация', 'Зачем консоль и как платформа проверяет решения.', [
        theoryRU(
          'prod-py-io-th',
          'Как устроен поток ввода-вывода',
          [
            '## Зачем stdin и stdout',
            '',
            'Платформа запускает твою программу как процесс с терминалом. Тесты подставляют текст во **входной поток**; ты читаешь его кодом и печатаешь ответ в **выходной поток**.',
            '',
            '## Что делают стартеры',
            '',
            'На Python используй `input()` для строки. На PHP — читай первую строку через `fgets(STDIN)`. **Не удаляй** этот блок, если задача требует данные со входа.',
            '',
            '## Формат ответа',
            '',
            'Следуй блоку «Формат вывода» в каждом задании: лишние пробелы и строки часто ломают автопроверку.'
          ].join('\n')
        ),
        bi(
          'prod-py-io-m1-t1',
          'Привет, Кодиум',
          'Выведи в stdout **ровно** одну строку текста.',
          'Строка: `Привет, Кодиум` (ровно такая кириллица и запятая). Одна строка вывода.',
          '# Вывод строки\n',
          '<?php\necho "Привет, Кодиум\\n";\n',
          'print("Привет, Кодиум")',
          [tt('Эталон', 'Привет, Кодиум'), tt('Повтор', 'Привет, Кодиум')]
        ),
        bi(
          'prod-py-io-m1-t2',
          'Две строки баннера',
          'Выведи две строки подряд: первая `Курс`, вторая `Старт`.',
          'Ровно две строки, порядок фиксирован.',
          '# два print подряд\n',
          '<?php\necho "Курс\\nСтарт\\n";\n',
          'print("Курс")\nprint("Старт")',
          [tt('Баннер', 'Курс\nСтарт')]
        )
      ]),
      moduleBlock('Строка со входа', 'Чтение одной строки и сборка ответа.', [
        bi(
          'prod-py-io-m2-t1',
          'Год обучения',
          'Со stdin приходит одно целое число `n`. Выведи строку вида `Год: <n>` без лишних пробелов по краям.',
          'Одна строка ASCII вида `Год: 2026` для своего числа.',
          'n = int(input())\n# собери строку\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\necho "Год: " . $n . "\\n";\n',
          'n = int(input())\nprint("Год: " + str(n))',
          [tt('Пример 2026', 'Год: 2026', '2026'), tt('Другое', 'Год: 7', '7')]
        ),
        bi(
          'prod-py-io-m2-t2',
          'Слово дважды',
          'На вход одна строка — слово без пробелов. Выведи это слово два раза через один пробел.',
          'Одна строка: `<слово> <слово>`.',
          'w = input().strip()\n',
          '<?php\n$w = trim((string)fgets(STDIN));\necho $w . " " . $w . "\\n";\n',
          'w = input().strip()\nprint(w + " " + w)',
          [tt('code', 'code code', 'code'), tt('да', 'да да', 'да')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-types',
    categoryLeafSlug: 'seed-leaf-env-types',
    title: 'Python: типы и аккуратные превращения',
    summary: 'int, float, bool и строковые представления.',
    shortSummary: 'Из строки в число и обратно без сюрпризов.',
    description:
      'Цепочки `int/float/str`, деление целочисленное и обычное, простые проверки логики на входных данных.',
    difficulty: 'beginner',
    durationHours: 12,
    xpReward: 1200,
    tags: ['python', 'типы'],
    author: 'primary',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Числа', 'Целые и дробные из stdin.', [
        bi(
          'prod-py-types-m1-t1',
          'Сумма двух целых',
          'Две строки stdin: целые `a` и `b`. Выведи сумму как целое.',
          'Одно целое число без постороннего текста.',
          'a = int(input())\nb = int(input())\n',
          '<?php\n$a = (int)trim((string)fgets(STDIN));\n$b = (int)trim((string)fgets(STDIN));\necho ($a + $b) . "\\n";\n',
          'a = int(input())\nb = int(input())\nprint(a + b)',
          [tt('2+3', '5', '2\n3'), tt('−1+1', '0', '-1\n1')]
        ),
        bi(
          'prod-py-types-m1-t2',
          'Среднее двух float',
          'Две строки stdin — вещественных числа. Выведи среднее арифметическое, округлив до **двух** знаков после запятой (`round(x, 2)`).',
          'Число с точкой; допускается `1.5` или `1.50` после нормализации вывода — выведи через `print` без лишнего.',
          'x = float(input())\ny = float(input())\n',
          '<?php\n$x = (float)trim((string)fgets(STDIN));\n$y = (float)trim((string)fgets(STDIN));\necho round(($x + $y) / 2, 2) . "\\n";\n',
          'x = float(input())\ny = float(input())\nprint(round((x + y) / 2, 2))',
          [tt('1 и 2', '1.5', '1\n2'), tt('0 и 0', '0.0', '0\n0')]
        )
      ]),
      moduleBlock('Логика и строки', 'Булевы и текстовые фильтры.', [
        bi(
          'prod-py-types-m2-t1',
          'Чётность',
          'Целое `n` со stdin. Если число чётное — выведи `YES`, иначе `NO`.',
          'Одно слово верхним регистром.',
          'n = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\necho ($n % 2 === 0 ? "YES" : "NO") . "\\n";\n',
          'n = int(input())\nprint("YES" if n % 2 == 0 else "NO")',
          [tt('чётное', 'YES', '4'), tt('нечётное', 'NO', '7')]
        ),
        bi(
          'prod-py-types-m2-t2',
          'Строка из флага',
          'Строка stdin: `1` или `0`. Выведи текст `True` или `False` соответственно.',
          'Ровно литералы `True` или `False`.',
          'b = input().strip()\n',
          '<?php\n$b = trim((string)fgets(STDIN));\necho ($b === "1" ? "True" : "False") . "\\n";\n',
          'b = input().strip()\nprint("True" if b == "1" else "False")',
          [tt('истина', 'True', '1'), tt('ложь', 'False', '0')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-control',
    categoryLeafSlug: 'seed-leaf-env-io',
    title: 'Python: ветвления и аккуратные сценарии',
    summary: 'if/elif/else, вложенные решения, сравнения строк.',
    shortSummary: 'Управление потоком без лишней копипасты.',
    description:
      'Учимся принимать решения по данным из stdin: диапазоны, отношения строк и комбинированные условия.',
    difficulty: 'beginner',
    durationHours: 14,
    xpReward: 1400,
    tags: ['python', 'if'],
    author: 'primary',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Развилки', 'Базовые условия.', [
        bi(
          'prod-py-control-m1-t1',
          'Минимум двух',
          'Две строки stdin — целые числа. Выведи меньшее из них.',
          'Одно целое.',
          'a = int(input())\nb = int(input())\n',
          '<?php\n$a = (int)trim((string)fgets(STDIN));\n$b = (int)trim((string)fgets(STDIN));\necho min($a, $b) . "\\n";\n',
          'a = int(input())\nb = int(input())\nprint(a if a < b else b)',
          [tt('5 9', '5', '5\n9'), tt('−3 −10', '-10', '-3\n-10')]
        ),
        bi(
          'prod-py-control-m1-t2',
          'Индекс в диапазоне',
          'Три целых в трёх строках: `n`, `i`, `x`. Если `0 <= i < n`, выведи `да`, иначе `нет`.',
          'Строго слова `да` или `нет`.',
          'n = int(input())\ni = int(input())\nx = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\n$i = (int)trim((string)fgets(STDIN));\n$x = (int)trim((string)fgets(STDIN));\n$ok = ($i >= 0 && $i < $n);\necho ($ok ? "да" : "нет") . "\\n";\n',
          'n = int(input())\ni = int(input())\nx = int(input())\nprint("да" if 0 <= i < n else "нет")',
          [tt('валидно', 'да', '10\n3\n0'), tt('нет', 'нет', '5\n10\n1')]
        )
      ]),
      moduleBlock('Строки и классификация', 'Текстовые правила.', [
        bi(
          'prod-py-control-m2-t1',
          'Длина строки',
          'Строка `s` со stdin. Если длина меньше трёх символов — выведи слово `коротко`, иначе выведи длину числом.',
          'Либо `коротко`, либо целое без префиксов.',
          's = input().strip()\n',
          '<?php\n$s = trim((string)fgets(STDIN));\necho (strlen($s) < 3 ? "коротко" : strlen($s)) . "\\n";\n',
          's = input().strip()\nprint("коротко" if len(s) < 3 else len(s))',
          [tt('короткая', 'коротко', 'ab'), tt('длинная', '5', 'abcde')]
        ),
        bi(
          'prod-py-control-m2-t2',
          'Код доступа',
          'Строка-пароль со stdin. Если это ровно `CODIUM2026`, выведи `OPEN`, иначе `LOCK`.',
          'Одно слово латиницей верхним регистром.',
          'p = input().strip()\n',
          '<?php\n$p = trim((string)fgets(STDIN));\necho ($p === "CODIUM2026" ? "OPEN" : "LOCK") . "\\n";\n',
          'p = input().strip()\nprint("OPEN" if p == "CODIUM2026" else "LOCK")',
          [tt('верно', 'OPEN', 'CODIUM2026'), tt('иначе', 'LOCK', 'x')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-functions',
    categoryLeafSlug: 'seed-leaf-syn-funcs',
    title: 'Python: функции как контракты',
    summary: 'def, return, параметры по умолчанию.',
    shortSummary: 'Из блоков кода — к переиспользуемым функциям.',
    description:
      'Вводим функцию как единицу повторного использования: аргументы, возврат значения и значения по умолчанию.',
    difficulty: 'beginner',
    durationHours: 14,
    xpReward: 1450,
    tags: ['python', 'функции'],
    author: 'primary',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Базовые функции', 'Из stdin в вызов функции.', [
        bi(
          'prod-py-fn-m1-t1',
          'Квадрат числа',
          'Реализуй функцию `square(x)`, возвращающую `x*x`. Со stdin целое `n`. Выведи `square(n)`.',
          'Одно целое.',
          'def square(x):\n    pass\n\nn = int(input())\n',
          '<?php\nfunction square($x): int {\n    return $x * $x;\n}\n$n = (int)trim((string)fgets(STDIN));\necho square($n) . "\\n";\n',
          'def square(x):\n    return x * x\n\nprint(square(int(input())))',
          [tt('3', '9', '3'), tt('−4', '16', '-4')]
        ),
        bi(
          'prod-py-fn-m1-t2',
          'Приветствие по имени',
          'Функция `hi(name)` возвращает строку `Привет, <name>!`. stdin — имя одной строкой.',
          'Одна строка UTF-8.',
          'def hi(name):\n    pass\n\n',
          '<?php\nfunction hi(string $name): string {\n    return "Привет, {$name}!";\n}\necho hi(trim((string)fgets(STDIN))) . "\\n";\n',
          'def hi(name):\n    return "Привет, " + name + "!"\n\nprint(hi(input().strip()))',
          [tt('Аня', 'Привет, Аня!', 'Аня')]
        )
      ]),
      moduleBlock('Параметры по умолчанию', 'Гибкие сигнатуры.', [
        bi(
          'prod-py-fn-m2-t1',
          'Сложение с нулём',
          'Функция `add(a, b=0)` возвращает сумму. stdin две строки — числа `a,b`.',
          'Одно целое.',
          'def add(a, b=0):\n    pass\n\n',
          '<?php\nfunction add(int $a, int $b = 0): int {\n    return $a + $b;\n}\n$a = (int)trim((string)fgets(STDIN));\n$b = (int)trim((string)fgets(STDIN));\necho add($a, $b) . "\\n";\n',
          'def add(a, b=0):\n    return a + b\n\na = int(input())\nb = int(input())\nprint(add(a, b))',
          [tt('2 5', '7', '2\n5')]
        ),
        bi(
          'prod-py-fn-m2-t2',
          'Разность модулей',
          'Функция `dist(a,b)` возвращает `abs(a-b)`. stdin два целых.',
          'Одно неотрицательное целое.',
          'def dist(a, b):\n    pass\n\n',
          '<?php\nfunction dist(int $a, int $b): int {\n    return abs($a - $b);\n}\n$a = (int)trim((string)fgets(STDIN));\n$b = (int)trim((string)fgets(STDIN));\necho dist($a, $b) . "\\n";\n',
          'def dist(a, b):\n    return abs(a-b)\n\nprint(dist(int(input()), int(input())))',
          [tt('10 4', '6', '10\n4')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-lists',
    categoryLeafSlug: 'seed-leaf-syn-lists',
    title: 'Python: списки и простые алгоритмы по коллекции',
    summary: 'Индексация, срезы, суммы и фильтрация.',
    shortSummary: 'Списки как рабочая лошадка.',
    description: 'От разбора строки в список чисел до поиска минимума и суммы по условию.',
    difficulty: 'beginner',
    durationHours: 16,
    xpReward: 1600,
    tags: ['python', 'списки'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Разбор линии', 'split/strip/map int.', [
        bi(
          'prod-py-list-m1-t1',
          'Сумма списка',
          'Строка stdin: целые через пробел. Выведи сумму всех чисел.',
          'Одно целое.',
          'nums = list(map(int, input().split()))\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line);\n$sum = 0;\nforeach ($parts as $p) {\n    $sum += (int)$p;\n}\necho $sum . "\\n";\n',
          'nums = list(map(int, input().split()))\nprint(sum(nums))',
          [tt('1 2 3', '6', '1 2 3')]
        ),
        bi(
          'prod-py-list-m1-t2',
          'Последний элемент',
          'Строка stdin: хотя бы одно целое через пробелы. Выведи **последнее** число.',
          'Одно целое.',
          'nums = list(map(int, input().split()))\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line);\n$last = (int)$parts[count($parts) - 1];\necho $last . "\\n";\n',
          'nums = list(map(int, input().split()))\nprint(nums[-1])',
          [tt('10 20 30', '30', '10 20 30')]
        )
      ]),
      moduleBlock('Фильтрация', 'Чётные и положительные.', [
        bi(
          'prod-py-list-m2-t1',
          'Сумма чётных',
          'Строка stdin: целые через пробел. Выведи сумму только **чётных**.',
          'Одно целое.',
          'nums = list(map(int, input().split()))\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line);\n$s = 0;\nforeach ($parts as $p) {\n    $v = (int)$p;\n    if ($v % 2 === 0) {\n        $s += $v;\n    }\n}\necho $s . "\\n";\n',
          'nums = list(map(int, input().split()))\nprint(sum(x for x in nums if x % 2 == 0))',
          [tt('1 2 3 4', '6', '1 2 3 4')]
        ),
        bi(
          'prod-py-list-m2-t2',
          'Максимум подмассива',
          'Первая строка `n`, вторая — `n` целых через пробел. Выведи максимум.',
          'Одно целое.',
          'n = int(input())\nnums = list(map(int, input().split()))\n',
          "<?php\n$n = (int)trim((string)fgets(STDIN));\n$line = trim((string)fgets(STDIN));\n$parts = preg_split('/\\s+/', $line);\n$nums = array_map('intval', array_slice($parts, 0, $n));\necho max($nums) . \"\\n\";\n",
          'n = int(input())\nnums = list(map(int, input().split()))\nprint(max(nums))',
          [tt('простой', '9', '3\n1 9 4')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-dicts',
    categoryLeafSlug: 'seed-leaf-syn-dicts',
    title: 'Python: словари и множества для данных',
    summary: 'Подсчёты, принадлежность, быстрые операции.',
    shortSummary: 'От таблицы ключ→значение до множеств.',
    description:
      'Готовим частотные карты, проверяем наличие ключей и работаем с операциями над множествами.',
    difficulty: 'intermediate',
    durationHours: 16,
    xpReward: 1700,
    tags: ['python', 'dict', 'set'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Частоты', 'dict как счётчик.', [
        bi(
          'prod-py-dict-m1-t1',
          'Уникальные значения',
          'Строка stdin: целые через пробел (возможны повторы). Выведи **число уникальных** значений.',
          'Одно целое.',
          'nums = list(map(int, input().split()))\n',
          "<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split('/\\s+/', $line);\n$uniq = array_unique(array_map('intval', $parts));\necho count($uniq) . \"\\n\";\n",
          'nums = list(map(int, input().split()))\nprint(len(set(nums)))',
          [tt('1 2 2', '2', '1 2 2')]
        ),
        bi(
          'prod-py-dict-m1-t2',
          'Буквы без регистра',
          'Строка stdin из латинских букв. Посчитай частоты **без учёта регистра** (`a` и `A` одинаковы). Выведи количество уникальных букв.',
          'Одно целое.',
          's = input().strip()\n',
          '<?php\n$s = strtolower(trim((string)fgets(STDIN)));\n$counts = count_chars($s, 1);\necho count($counts) . "\\n";\n',
          's = input().strip().lower()\nprint(len(set(s)))',
          [tt('AaB', '2', 'AaB')]
        )
      ]),
      moduleBlock('Множества', 'Пересечение двух линий.', [
        bi(
          'prod-py-dict-m2-t1',
          'Пересечение списков',
          'Две строки stdin: целые через пробел. Выведи элементы пересечения **по возрастанию** через пробел. Если пусто — строка `пусто`.',
          'Числа через один пробел или слово `пусто`.',
          'a = set(map(int, input().split()))\nb = set(map(int, input().split()))\n',
          "<?php\nfunction parseInts(string $line): array {\n    $parts = preg_split('/\\s+/', trim($line));\n    return array_map('intval', $parts);\n}\n$a = parseInts((string)fgets(STDIN));\n$b = parseInts((string)fgets(STDIN));\n$inter = array_values(array_intersect($a, $b));\nsort($inter);\necho count($inter) ? implode(' ', $inter) : \"пусто\";\necho \"\\n\";\n",
          'a = set(map(int, input().split()))\nb = set(map(int, input().split()))\nc = sorted(a & b)\nprint(" ".join(map(str, c)) if c else "пусто")',
          [tt('есть', '2 4', '1 2 4\n4 2 9'), tt('нет', 'пусто', '1\n2')]
        ),
        bi(
          'prod-py-dict-m2-t2',
          'Первый повтор',
          'Строка stdin: слова через пробел. Найди **первое** слово, которое встречается дважды при чтении слева направо; если нет — выведи `нет`.',
          'Одно слово или `нет`.',
          'words = input().split()\n',
          '<?php\n$words = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$seen = [];\nforeach ($words as $w) {\n    if (isset($seen[$w])) {\n        echo $w . "\\n";\n        exit(0);\n    }\n    $seen[$w] = true;\n}\necho "нет\\n";\n',
          'words = input().split()\nseen = set()\nfor w in words:\n    if w in seen:\n        print(w)\n        break\n    seen.add(w)\nelse:\n    print("нет")\n',
          [tt('повтор', 'delta', 'alpha beta delta gamma delta'), tt('нет', 'нет', 'a b c')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-exceptions',
    categoryLeafSlug: 'seed-leaf-env-errors',
    title: 'Python: исключения и контролируемые сбои',
    summary: 'try/except, понятные сообщения и безопасный парсинг.',
    shortSummary: 'Не пугаться ошибок — управлять ими.',
    description:
      'Разбираем типичные исключения при парсинге чисел и создаём предсказуемые ответы пользователю.',
    difficulty: 'beginner',
    durationHours: 12,
    xpReward: 1200,
    tags: ['python', 'try'],
    author: 'primary',
    primaryLanguage: 'python',
    tierRequired: 0,
    modules: [
      moduleBlock('Безопасный парсинг', 'Защититься от мусора.', [
        bi(
          'prod-py-ex-m1-t1',
          'Целое или ошибка',
          'Строка stdin претендует быть целым. Если парсинг возможен — выведи число; если нет — строку `bad`.',
          'Целое или слово `bad`.',
          'raw = input().strip()\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\nif ($raw === "" || !preg_match(\'/^-?\\\\d+$/\', $raw)) {\n    echo "bad\\n";\n} else {\n    echo (int)$raw . "\\n";\n}\n',
          'raw = input().strip()\ntry:\n    print(int(raw))\nexcept ValueError:\n    print("bad")',
          [tt('ok', '42', '42'), tt('bad', 'bad', '12x')]
        ),
        bi(
          'prod-py-ex-m1-t2',
          'Деление с guard',
          'Две строки — целые `a b`. Если `b==0`, выведи `inf`; иначе целую часть от деления `a//b`.',
          'Целое или строка `inf`.',
          'a = int(input())\nb = int(input())\n',
          '<?php\n$a = (int)trim((string)fgets(STDIN));\n$b = (int)trim((string)fgets(STDIN));\nif ($b === 0) {\n    echo "inf\\n";\n} else {\n    echo intdiv($a, $b) . "\\n";\n}\n',
          'a = int(input())\nb = int(input())\nprint("inf" if b == 0 else a // b)',
          [tt('деление', '3', '10\n3'), tt('ноль', 'inf', '5\n0')]
        )
      ]),
      moduleBlock('Иерархия', 'Разные виды ошибок.', [
        theoryRU(
          'prod-py-ex-th',
          'Типы исключений',
          [
            '## Базовые идеи',
            '',
            '`ValueError` часто возникает при `int("abc")`. Деление на ноль в Python даёт `ZeroDivisionError`.',
            '',
            'Лови только то, что ожидаешь: широкий `except Exception` скрывает настоящие баги.'
          ].join('\n')
        ),
        bi(
          'prod-py-ex-m2-t2',
          'Квадратный корень целого',
          'Целое `n` со stdin. Если `n<0`, выведи `complex`; иначе выведи квадратный корень с точностью до **3** знаков после запятой (`round`).',
          'Число с точкой или слово `complex`.',
          'import math\nn = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\nif ($n < 0) {\n    echo "complex\\n";\n} else {\n    echo round(sqrt($n), 3) . "\\n";\n}\n',
          'import math\nn = int(input())\nprint("complex" if n < 0 else round(math.sqrt(n), 3))',
          [tt('4', '2.0', '4'), tt('<0', 'complex', '-1')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-strings',
    categoryLeafSlug: 'seed-leaf-data-parse',
    title: 'Python: строки, шаблоны и парсинг',
    summary: 'strip/split/join и аккуратная работа с форматами.',
    shortSummary: 'Текст как данные.',
    description:
      'Нормализация строк, замены и разбор простых форматов без регулярок там, где можно обойтись split.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1450,
    tags: ['python', 'строки'],
    author: 'secondary',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Очистка', 'strip и регистр.', [
        bi(
          'prod-py-str-m1-t1',
          'Палиндром?',
          'Строка stdin (без пробелов). Если читается одинаково слева направо и справа налево — `yes`, иначе `no`. Регистр **не** учитывать.',
          'Слово `yes` или `no`.',
          's = input().strip().lower()\n',
          '<?php\n$s = strtolower(trim((string)fgets(STDIN)));\n$rev = strrev($s);\necho ($s === $rev ? "yes" : "no") . "\\n";\n',
          's = input().strip().lower()\nprint("yes" if s == s[::-1] else "no")',
          [tt('anna', 'yes', 'Anna'), tt('ab', 'no', 'ab')]
        ),
        bi(
          'prod-py-str-m1-t2',
          'Замена запятых',
          'Строка stdin использует запятые как десятичный разделитель (`3,14`). Замени на точку и выведи как float одной строкой.',
          'Строка числа с точкой.',
          'raw = input().strip()\n',
          "<?php\n$raw = str_replace(',', '.', trim((string)fgets(STDIN)));\necho $raw . \"\\n\";\n",
          'raw = input().strip().replace(",", ".")\nprint(raw)',
          [tt('пример', '3.14', '3,14')]
        )
      ]),
      moduleBlock('Разбор полей', 'CSV-подобные строки.', [
        bi(
          'prod-py-str-m2-t1',
          'Сумма столбца',
          'Строка stdin формата `a;b;c|d;e;f` — два набора по три поля. Выведи сумму **средних** полей (`b+e`) как целое.',
          'Одно целое.',
          'line = input().strip()\n',
          "<?php\n$line = trim((string)fgets(STDIN));\n[$left, $right] = explode('|', $line);\n[, $b] = explode(';', $left);\n[, $e] = explode(';', $right);\necho ((int)$b + (int)$e) . \"\\n\";\n",
          'parts = input().strip().split("|")\na,b,c = parts[0].split(";")\nd,e,f = parts[1].split(";")\nprint(int(b)+int(e))',
          [tt('6', '6', '1;2;3|4;4;5')]
        ),
        bi(
          'prod-py-str-m2-t2',
          'Маска email',
          'Строка stdin — email. Если есть ровно один символ `@` и хотя бы одна точка **после** `@`, выведи `valid`, иначе `invalid`.',
          'Слово `valid` или `invalid`.',
          's = input().strip()\n',
          '<?php\n$s = trim((string)fgets(STDIN));\n$ok = false;\nif (substr_count($s, \'@\') === 1) {\n    [$user, $domain] = explode(\'@\', $s, 2);\n    $ok = str_contains($domain, \'.\');\n}\necho ($ok ? "valid" : "invalid") . "\\n";\n',
          's = input().strip()\nparts = s.split("@")\nok = len(parts)==2 and "." in parts[1]\nprint("valid" if ok else "invalid")',
          [tt('да', 'valid', 'u@v.com'), tt('нет', 'invalid', 'bad')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-files',
    categoryLeafSlug: 'seed-leaf-data-files',
    title: 'Python: файлы как источник данных',
    summary: 'Чтение текста из stdin как из «файла».',
    shortSummary: 'Многострочный ввод и подсчёты.',
    description:
      'В задачах платформа подаёт текст через stdin — учимся трактовать его как последовательность строк файла.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1400,
    tags: ['python', 'файлы'],
    author: 'secondary',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Строки stdin', 'Аналог readlines.', [
        bi(
          'prod-py-file-m1-t1',
          'Сколько строк до пустой',
          'Читай строки stdin, пока не встретишь **пустую** строку (сама пустая не считается). Выведи число прочитанных строк.',
          'Одно целое.',
          'lines = []\nwhile True:\n    line = input()\n    if line == "":\n        break\n    lines.append(line)\n',
          '<?php\n$n = 0;\nwhile (($line = fgets(STDIN)) !== false) {\n    $line = rtrim($line, "\\r\\n");\n    if ($line === "") {\n        break;\n    }\n    $n++;\n}\necho $n . "\\n";\n',
          'lines = []\nwhile True:\n    line = input()\n    if line == "":\n        break\n    lines.append(line)\nprint(len(lines))',
          [tt('2 строки', '2', 'a\nb\n\n')]
        ),
        bi(
          'prod-py-file-m1-t2',
          'Сумма вторых колонок',
          'Первая строка stdin — целое `n`. Далее `n` строк вида `имя;очки`. Выведи сумму `очки`.',
          'Одно целое.',
          'n = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\n$sum = 0;\nfor ($i = 0; $i < $n; $i++) {\n    $line = trim((string)fgets(STDIN));\n    $parts = explode(\';\', $line);\n    $sum += (int)$parts[1];\n}\necho $sum . "\\n";\n',
          'n = int(input())\ns = 0\nfor _ in range(n):\n    name, pts = input().split(";")\n    s += int(pts)\nprint(s)',
          [tt('два', '30', '2\na;10\nb;20')]
        )
      ]),
      moduleBlock('Кодировки мысленно', 'Работа с байтовым текстом.', [
        theoryRU(
          'prod-py-file-th',
          'Текст и байты',
          [
            '## Файлы на практике',
            '',
            'На платформе основной поток — UTF-8 текст. В полевых проектах помни про `encoding=` при `open`.',
            '',
            'Для больших файлов не загружай всё в память: используй итерацию по строкам.'
          ].join('\n')
        ),
        bi(
          'prod-py-file-m2-t2',
          'Самая длинная строка',
          'Несколько строк stdin до EOF (в тестах будет конечный набор). Выведи длину **самой длинной** строки без символа перевода строки.',
          'Одно целое.',
          'import sys\nraw = sys.stdin.read().splitlines()\n',
          '<?php\n$data = stream_get_contents(STDIN);\n$lines = preg_split(\'/\\r?\\n/\', trim($data));\n$max = 0;\nforeach ($lines as $line) {\n    $max = max($max, strlen($line));\n}\necho $max . "\\n";\n',
          'import sys\nraw = sys.stdin.read().splitlines()\nprint(max((len(line) for line in raw), default=0))',
          [tt('mix', '5', 'ab\nabcde\nxy')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-json',
    categoryLeafSlug: 'seed-leaf-data-json',
    title: 'Python: JSON как универсальный формат',
    summary: 'loads/dumps и работа со словарём.',
    shortSummary: 'От строки JSON к данным.',
    description: 'Парсим небольшие JSON-объекты из stdin и формируем ответ в stdout.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1450,
    tags: ['python', 'json'],
    author: 'secondary',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Объекты', 'Ключи и значения.', [
        bi(
          'prod-py-json-m1-t1',
          'Имя пользователя',
          'Строка stdin — JSON объект с ключами `name` (строка) и `age` (число). Выведи значение `name`.',
          'Строка без кавычек JSON.',
          'import json\nraw = input().strip()\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\n$data = json_decode($raw, true);\necho $data[\'name\'] . "\\n";\n',
          'import json\nobj = json.loads(input().strip())\nprint(obj["name"])',
          [tt('имя', 'Ника', '{"name":"Ника","age":19}')]
        ),
        bi(
          'prod-py-json-m1-t2',
          'Сумма массива',
          'Строка stdin — JSON массив целых. Выведи сумму элементов.',
          'Одно целое.',
          'import json\nraw = input().strip()\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\n$arr = json_decode($raw, true);\necho array_sum($arr) . "\\n";\n',
          'import json\nprint(sum(json.loads(input().strip())))',
          [tt('1', '6', '[1,2,3]')]
        )
      ]),
      moduleBlock('Вложенность', 'Обход полей.', [
        bi(
          'prod-py-json-m2-t1',
          'Город доставки',
          'JSON объект: `{ "user": { "city": "..." } }` в одной строке stdin. Выведи город.',
          'Строка.',
          'import json\n',
          "<?php\n$raw = trim((string)fgets(STDIN));\n$data = json_decode($raw, true);\necho $data['user']['city'] . \"\\n\";\n",
          'import json\nobj = json.loads(input().strip())\nprint(obj["user"]["city"])',
          [tt('город', 'Тула', '{"user":{"city":"Тула"}}')]
        ),
        bi(
          'prod-py-json-m2-t2',
          'Флаг enabled',
          'JSON объект содержит ключ `features` — массив строк. Если среди них есть `premium`, выведи `yes`, иначе `no`.',
          '`yes` или `no`.',
          'import json\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\n$data = json_decode($raw, true);\n$has = in_array(\'premium\', $data[\'features\'], true);\necho ($has ? "yes" : "no") . "\\n";\n',
          'import json\nobj = json.loads(input().strip())\nprint("yes" if "premium" in obj["features"] else "no")',
          [
            tt('есть', 'yes', '{"features":["a","premium"]}'),
            tt('нет', 'no', '{"features":["a"]}')
          ],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-oop',
    categoryLeafSlug: 'seed-leaf-app-oop',
    title: 'Python: объекты и простые классы',
    summary: 'Классы, методы и dataclass.',
    shortSummary: 'Инкапсулируем состояние.',
    description: 'От простых классов до `@dataclass`: состояние + методы с понятными контрактами.',
    difficulty: 'intermediate',
    durationHours: 18,
    xpReward: 1800,
    tags: ['python', 'ООП'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Классы', 'Поля и методы.', [
        bi(
          'prod-py-oop-m1-t1',
          'Точка на плоскости',
          'Класс `Point` с целыми `x,y` в конструкторе. Метод `dist2()` возвращает `x*x+y*y`. С stdin два int — создай точку и выведи `dist2()`.',
          'Одно целое.',
          'class Point:\n    pass\n\n',
          '<?php\nfinal class Point {\n    public function __construct(public int $x, public int $y) {}\n    public function dist2(): int {\n        return $this->x * $this->x + $this->y * $this->y;\n    }\n}\n$x = (int)trim((string)fgets(STDIN));\n$y = (int)trim((string)fgets(STDIN));\n$p = new Point($x, $y);\necho $p->dist2() . "\\n";\n',
          'class Point:\n    def __init__(self, x: int, y: int):\n        self.x = x\n        self.y = y\n    def dist2(self) -> int:\n        return self.x * self.x + self.y * self.y\n\nx = int(input())\ny = int(input())\nprint(Point(x, y).dist2())',
          [tt('3 4', '25', '3\n4')]
        ),
        bi(
          'prod-py-oop-m1-t2',
          'Счётчик кликов',
          'Класс `Counter` с полем `n=0`, метод `inc(k)` увеличивает `n` на `k`. stdin три int — три инкремента подряд, выведи `n`.',
          'Одно целое.',
          'class Counter:\n    pass\n\n',
          '<?php\nfinal class Counter {\n    public int $n = 0;\n    public function inc(int $k): void {\n        $this->n += $k;\n    }\n}\n$c = new Counter();\nfor ($i = 0; $i < 3; $i++) {\n    $c->inc((int)trim((string)fgets(STDIN)));\n}\necho $c->n . "\\n";\n',
          'class Counter:\n    def __init__(self):\n        self.n = 0\n    def inc(self, k: int):\n        self.n += k\n\nc = Counter()\nc.inc(int(input()))\nc.inc(int(input()))\nc.inc(int(input()))\nprint(c.n)',
          [tt('1+2+3', '6', '1\n2\n3')]
        )
      ]),
      moduleBlock('Dataclass', 'Быстрые модели данных.', [
        bi(
          'prod-py-oop-m2-t1',
          'Карточка игрока',
          '`@dataclass class User: name: str; score: int`. stdin через пробел — имя и число. Выведи `имя:балл`.',
          'Строка `<имя>:<число>`.',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nparts = input().split()\n',
          '<?php\nfinal readonly class User {\n    public function __construct(public string $name, public int $score) {}\n}\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line, 2);\n$u = new User($parts[0], (int)$parts[1]);\necho $u->name . ":" . $u->score . "\\n";\n',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\nparts = input().split()\nu = User(parts[0], int(parts[1]))\nprint(f"{u.name}:{u.score}")',
          [tt('sample', 'alex:10', 'alex 10')]
        ),
        bi(
          'prod-py-oop-m2-t2',
          'Лучший игрок',
          'Две строки stdin: `имя1 балл1` и `имя2 балл2`. Выведи имя с большим баллом; при равенстве — лексикографически меньшее имя.',
          'Имя UTF-8.',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\n',
          '<?php\nfinal readonly class User {\n    public function __construct(public string $name, public int $score) {}\n}\nfunction parseUser(string $line): User {\n    [$n, $s] = preg_split(\'/\\s+/\', trim($line), 2);\n    return new User($n, (int)$s);\n}\n$a = parseUser((string)fgets(STDIN));\n$b = parseUser((string)fgets(STDIN));\nif ($a->score !== $b->score) {\n    echo ($a->score > $b->score ? $a->name : $b->name) . "\\n";\n} else {\n    echo (strcmp($a->name, $b->name) < 0 ? $a->name : $b->name) . "\\n";\n}\n',
          'from dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    score: int\n\ndef parse_line(line: str) -> User:\n    name, score = line.split()\n    return User(name, int(score))\n\nu1 = parse_line(input())\nu2 = parse_line(input())\nif u1.score != u2.score:\n    print(u1.name if u1.score > u2.score else u2.name)\nelse:\n    print(min(u1.name, u2.name))\n',
          [tt('разные', 'bob', 'alice 5\nbob 9'), tt('равно', 'amy', 'amy 2\nbob 2')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-py-stdlib',
    categoryLeafSlug: 'seed-leaf-app-stdlib',
    title: 'Python: стандартная библиотека в задачах',
    summary: 'datetime, itertools и functools на практике.',
    shortSummary: 'Готовые инструменты вместо изобретения велосипеда.',
    description: 'Короткие задачи на типичные модули stdlib: время, комбинаторика мини, reduce.',
    difficulty: 'advanced',
    durationHours: 16,
    xpReward: 2200,
    tags: ['python', 'stdlib'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 2,
    modules: [
      moduleBlock('Даты', 'datetime без timezone-сюрпризов.', [
        bi(
          'prod-py-stdlib-m1-t1',
          'День недели UTC',
          'Строка stdin — дата `YYYY-MM-DD`. Выведи номер дня недели **понедельник=0 … воскресенье=6** через `datetime.date` и `weekday()`.',
          'Одно целое 0..6.',
          'from datetime import date\n',
          "<?php\n$d = DateTimeImmutable::createFromFormat('Y-m-d', trim((string)fgets(STDIN)));\n$n = (int)$d->format('N');\necho (($n + 6) % 7) . \"\\n\";\n",
          'from datetime import date\ns = input().strip()\nprint(date.fromisoformat(s).weekday())',
          [tt('понедельник', '0', '2026-05-04')]
        ),
        bi(
          'prod-py-stdlib-m1-t2',
          'Разница дней',
          'Две строки stdin — даты `YYYY-MM-DD` по порядку. Выведи количество полных дней между ними (может быть отрицательным, если вторая раньше).',
          'Одно целое.',
          'from datetime import date\n',
          "<?php\n$d1 = DateTimeImmutable::createFromFormat('Y-m-d', trim((string)fgets(STDIN)));\n$d2 = DateTimeImmutable::createFromFormat('Y-m-d', trim((string)fgets(STDIN)));\n$diff = $d1->diff($d2);\n$days = (int)$diff->format('%r%a');\necho $days . \"\\n\";\n",
          'from datetime import date\na = date.fromisoformat(input().strip())\nb = date.fromisoformat(input().strip())\nprint((b - a).days)',
          [tt('пример', '2', '2026-05-01\n2026-05-03')]
        )
      ]),
      moduleBlock('Комбинаторика мини', 'itertools.', [
        bi(
          'prod-py-stdlib-m2-t1',
          'Первые k пар',
          'Строка stdin: два целых `n k`. Выведи через пробел первые `k` пар `(i,j)` как `i:j` подряд: например при `n=2,k=3` → `0:0 0:1 1:0`. Генерация — лексикографический порядок как двойной цикл `for i in range(n) for j in range(n)`.',
          'Строки `i:j` через пробел, без хвостового пробела.',
          'import itertools\n',
          '<?php\n$parts = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$n = (int)$parts[0];\n$k = (int)$parts[1];\n$out = [];\n$c = 0;\nouter:\nfor ($i = 0; $i < $n; $i++) {\n    for ($j = 0; $j < $n; $j++) {\n        $out[] = "$i:$j";\n        $c++;\n        if ($c >= $k) {\n            break outer;\n        }\n    }\n}\necho implode(\' \', $out) . "\\n";\n',
          'import itertools\nn,k = map(int,input().split())\npairs = [(i,j) for i in range(n) for j in range(n)]\nprint(" ".join(f"{i}:{j}" for i,j in pairs[:k]))',
          [tt('2 3', '0:0 0:1 1:0', '2 3')]
        ),
        bi(
          'prod-py-stdlib-m2-t2',
          'Произведение reduce',
          'Строка stdin: целые через пробел (не пусто). Выведи произведение всех чисел через `functools.reduce` и `operator.mul`.',
          'Одно целое.',
          'import operator\nfrom functools import reduce\n',
          '<?php\n$parts = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$p = 1;\nforeach ($parts as $x) {\n    $p *= (int)$x;\n}\necho $p . "\\n";\n',
          'import operator\nfrom functools import reduce\nnums = list(map(int,input().split()))\nprint(reduce(operator.mul, nums, 1))',
          [tt('234', '24', '2 3 4')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  }
]
