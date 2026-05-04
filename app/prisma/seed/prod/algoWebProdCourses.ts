import { moduleBlock, type CourseDef } from '../catalog/courseTypes'

import { bi, theoryRU, tt } from './helpers'

/** Алгоритмы (2) и веб-протоколы (2) — Python-first карточки. */
export const ALGO_WEB_PROD_COURSES: CourseDef[] = [
  {
    slug: 'prod-algo-tracks',
    categoryLeafSlug: 'seed-leaf-algo-sort',
    title: 'Алгоритмы: порядок роста и сортировки',
    summary: 'Подсчёт шагов, сравнение стратегий, sorted.',
    shortSummary: 'От интуиции O(n) до практики sorted.',
    description:
      'Оцениваем количество операций в простых конструкциях и используем стандартную сортировку Python там, где это уместно.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1600,
    tags: ['алгоритмы', 'сложность'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Интуиция сложности', 'Вложенные циклы.', [
        theoryRU(
          'prod-algo-tracks-th',
          'Зачем считать шаги',
          [
            '## Рост работы',
            '',
            'Если тройной цикл до `n` делает порядка `n³` итераций, программа быстро упирается в лимит времени.',
            '',
            'На практике сначала ищи очевидный лишний вложенный цикл, затем подумай про структуры данных.'
          ].join('\n')
        ),
        bi(
          'prod-algo-tr-m1-t1',
          'Тройной цикл',
          'Целое `n` со stdin (1≤n≤200). Три вложенных цикла `for i in range(n)` — посчитай и выведи число итераций **внутреннего** тела.',
          'Одно целое.',
          'n = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\necho ($n * $n * $n) . "\\n";\n',
          'print(int(input())**3)',
          [tt('2', '8', '2'), tt('3', '27', '3')]
        ),
        bi(
          'prod-algo-tr-m1-t2',
          'Сортировка строки чисел',
          'Строка stdin — целые через пробел. Выведи их **по возрастанию** через пробел.',
          'Числа через один пробел, без хвостового пробела.',
          'nums = list(map(int, input().split()))\n',
          "<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split('/\\s+/', $line);\n$nums = array_map('intval', $parts);\nsort($nums);\necho implode(' ', $nums) . \"\\n\";\n",
          'nums = list(map(int, input().split()))\nprint(" ".join(map(str, sorted(nums))))',
          [tt('rev', '1 2 9', '9 2 1')]
        )
      ]),
      moduleBlock('Устойчивость и ключи', 'Параметры сортировки.', [
        bi(
          'prod-algo-tr-m2-t1',
          'По абсолютному значению',
          'Строка stdin — целые (возможны отрицательные). Отсортируй по **неубыванию абсолютного значения**; при равенстве `|a|` меньшее число раньше.',
          'Числа через пробел.',
          'nums = list(map(int, input().split()))\n',
          "<?php\n$line = trim((string)fgets(STDIN));\n$nums = array_map('intval', preg_split('/\\s+/', $line));\nusort($nums, function ($a, $b) {\n    $ca = abs($a);\n    $cb = abs($b);\n    if ($ca === $cb) {\n        return $a <=> $b;\n    }\n    return $ca <=> $cb;\n});\necho implode(' ', $nums) . \"\\n\";\n",
          'nums = list(map(int, input().split()))\nnums.sort(key=lambda x: (abs(x), x))\nprint(" ".join(map(str, nums)))',
          [tt('mix', '-3 2 -2 4', '2 -2 -3 4')]
        ),
        bi(
          'prod-algo-tr-m2-t2',
          'Первые k после сортировки',
          'Строка stdin: `n k` затем `n` целых. Выведи **k наименьших** чисел после сортировки по возрастанию через пробел.',
          'Ровно `k` чисел.',
          'parts = list(map(int, input().split()))\n',
          "<?php\n$head = preg_split('/\\s+/', trim((string)fgets(STDIN)));\n$n = (int)$head[0];\n$k = (int)$head[1];\n$line = trim((string)fgets(STDIN));\n$nums = array_map('intval', preg_split('/\\s+/', $line));\nsort($nums);\necho implode(' ', array_slice($nums, 0, $k)) . \"\\n\";\n",
          'n,k = map(int,input().split())\nnums = list(map(int,input().split()))\nnums.sort()\nprint(" ".join(map(str, nums[:k])))',
          [tt('sample', '1 4 7', '5 3\n9 4 1 8 7')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-algo-recursion',
    categoryLeafSlug: 'seed-leaf-algo-rec',
    title: 'Алгоритмы: рекурсия и простые структуры',
    summary: 'factorial, gcd, стек вызовов.',
    shortSummary: 'База индукции и аккуратный рекурсивный шаг.',
    description:
      'Классические рекурсивные определения без лишней глубины: факториал и алгоритм Евклида.',
    difficulty: 'advanced',
    durationHours: 12,
    xpReward: 2100,
    tags: ['рекурсия'],
    author: 'algo',
    primaryLanguage: 'python',
    tierRequired: 2,
    modules: [
      moduleBlock('Числа', 'factorial / gcd.', [
        bi(
          'prod-algo-rec-m1-t1',
          'Факториал',
          'Целое `n` (0≤n≤12). Выведи `n!`.',
          'Одно целое.',
          'def fac(n):\n    pass\n\n',
          '<?php\nfunction fac(int $n): int {\n    return $n <= 1 ? 1 : $n * fac($n - 1);\n}\necho fac((int)trim((string)fgets(STDIN))) . "\\n";\n',
          'def fac(n: int) -> int:\n    return 1 if n <= 1 else n * fac(n - 1)\n\nprint(fac(int(input())))',
          [tt('5', '120', '5'), tt('0', '1', '0')]
        ),
        bi(
          'prod-algo-rec-m1-t2',
          'НОД',
          'Два положительных целых со stdin. Выведи их НОД (евклидов алгоритм).',
          'Одно целое.',
          'def gcd(a,b):\n    pass\n\n',
          '<?php\nfunction gcd(int $a, int $b): int {\n    return $b === 0 ? $a : gcd($b, $a % $b);\n}\n$x = (int)trim((string)fgets(STDIN));\n$y = (int)trim((string)fgets(STDIN));\necho gcd($x, $y) . "\\n";\n',
          'def gcd(a: int, b: int) -> int:\n    return a if b == 0 else gcd(b, a % b)\n\nprint(gcd(int(input()), int(input())))',
          [tt('54 24', '6', '54\n24')]
        )
      ]),
      moduleBlock('Структуры на минималках', 'Произведение дерева.', [
        theoryRU(
          'prod-algo-rec-th',
          'Стек вызовов',
          [
            '## Память рекурсии',
            '',
            'Каждый вызов занимает кадр стека. Если глубина пропорциональна `n`, при больших `n` будет переполнение.',
            '',
            'Итеративная версия часто безопаснее в продакшене.'
          ].join('\n')
        ),
        bi(
          'prod-algo-rec-m2-t2',
          'Глубина скобок',
          'Строка stdin состоит только из `(` и `)`. Выведи **максимальную глубину** правильной скобочной последовательности (гарантируется корректность).',
          'Одно целое.',
          's = input().strip()\n',
          '<?php\n$s = trim((string)fgets(STDIN));\n$d = 0;\n$best = 0;\nfor ($i = 0; $i < strlen($s); $i++) {\n    if ($s[$i] === \'(\') {\n        $d++;\n        $best = max($best, $d);\n    } else {\n        $d--;\n    }\n}\necho $best . "\\n";\n',
          's = input().strip()\nd = best = 0\nfor ch in s:\n    d += 1 if ch == "(" else -1\n    best = max(best, d)\nprint(best)\n',
          [tt('nest', '3', '((()))')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-web-http',
    categoryLeafSlug: 'seed-leaf-app-http',
    title: 'Веб: строка статуса HTTP',
    summary: 'Разбор статус-лайна и заголовков как текста.',
    shortSummary: 'HTTP без фреймворка — только текст.',
    description: 'Учимся читать статус ответа и извлекать числовой код из первой строки.',
    difficulty: 'intermediate',
    durationHours: 10,
    xpReward: 1300,
    tags: ['http', 'протоколы'],
    author: 'secondary',
    primaryLanguage: 'python',
    tierRequired: 1,
    modules: [
      moduleBlock('Статус-лайн', 'split по пробелам.', [
        bi(
          'prod-web-http-m1-t1',
          'Код ответа',
          'Строка stdin формата `HTTP/1.1 404 Not Found`. Выведи **только числовой код**.',
          'Три цифры без префиксов.',
          'line = input().strip()\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line);\necho $parts[1] . "\\n";\n',
          'parts = input().split()\nprint(parts[1])',
          [tt('404', '404', 'HTTP/1.1 404 Not Found')]
        ),
        bi(
          'prod-web-http-m1-t2',
          'Успех?',
          'Та же строка статуса. Если код начинается на `2`, выведи `ok`, иначе `fail`.',
          'Строка `ok` или `fail`.',
          'parts = input().split()\n',
          '<?php\n$parts = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$code = $parts[1];\necho (str_starts_with($code, \'2\') ? "ok" : "fail") . "\\n";\n',
          'parts = input().split()\ncode = parts[1]\nprint("ok" if code.startswith("2") else "fail")',
          [tt('200', 'ok', 'HTTP/1.1 200 OK'), tt('500', 'fail', 'HTTP/1.1 500 Boom')]
        )
      ]),
      moduleBlock('Заголовки как текст', 'Key: value.', [
        bi(
          'prod-web-http-m2-t1',
          'Длина контента',
          'Строка stdin — заголовок вида `Content-Length: 123` (без лишних пробелов вокруг двоеточия в тестах). Выведи число.',
          'Целое.',
          'line = input().strip()\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n[$k, $v] = explode(\':\', $line, 2);\necho trim($v) . "\\n";\n',
          'k,v = input().split(":")\nprint(int(v.strip()))',
          [tt('len', '42', 'Content-Length:42')]
        ),
        bi(
          'prod-web-http-m2-t2',
          'Кэширование',
          'Строка заголовка `Cache-Control: ...`. Если содержит подстроку `no-store` (регистр как в тестах ниже), выведи `skip`, иначе `use`.',
          '`skip` или `use`.',
          'line = input().strip()\n',
          '<?php\n$line = trim((string)fgets(STDIN));\necho (str_contains($line, \'no-store\') ? "skip" : "use") . "\\n";\n',
          'line = input().strip()\nprint("skip" if "no-store" in line else "use")',
          [
            tt('skip', 'skip', 'Cache-Control: private, no-store'),
            tt('use', 'use', 'Cache-Control: max-age=60')
          ],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-web-forms',
    categoryLeafSlug: 'seed-leaf-data-parse',
    title: 'Веб: формы и закодированные тела',
    summary: 'application/x-www-form-urlencoded без сервера.',
    shortSummary: 'Пары ключ=значение и экранирование.',
    description: 'Парсим типичное тело формы из одной строки stdin и извлекаем параметры.',
    difficulty: 'advanced',
    durationHours: 12,
    xpReward: 2200,
    tags: ['формы', 'urlencoded'],
    author: 'secondary',
    primaryLanguage: 'python',
    tierRequired: 2,
    modules: [
      moduleBlock('Пары ключ=значение', 'split по &.', [
        bi(
          'prod-web-form-m1-t1',
          'Значение email',
          'Строка stdin — URL-encoded тело `email=test%40mail.ru&token=abc`. Выведи декодированное значение `email` (символ `%40` → `@`).',
          'Строка email без JSON.',
          'from urllib.parse import parse_qs\n',
          '<?php\n$s = trim((string)fgets(STDIN));\nparse_str($s, $out);\necho $out[\'email\'] . "\\n";\n',
          'from urllib.parse import parse_qs\nbody = input().strip()\nprint(parse_qs(body)["email"][0])',
          [tt('mail', 'test@mail.ru', 'email=test%40mail.ru&token=abc')]
        ),
        bi(
          'prod-web-form-m1-t2',
          'Количество полей',
          'Строка stdin — несколько пар `a=1&b=2&c=3`. Выведи число полей.',
          'Целое.',
          'body = input().strip()\n',
          '<?php\n$s = trim((string)fgets(STDIN));\nparse_str($s, $out);\necho count($out) . "\\n";\n',
          'from urllib.parse import parse_qs\nprint(len(parse_qs(input().strip())))',
          [tt('3', '3', 'a=1&b=2&c=3')]
        )
      ]),
      moduleBlock('Экранирование плюсов', 'Форма с пробелами.', [
        bi(
          'prod-web-form-m2-t1',
          'Пробел как плюс',
          'Строка `msg=hello+world`. После декодирования выведи значение `msg` с пробелом между словами.',
          'Строка `hello world`.',
          'from urllib.parse import parse_qs\n',
          "<?php\n$s = trim((string)fgets(STDIN));\nparse_str($s, $out);\necho str_replace('+', ' ', $out['msg']) . \"\\n\";\n",
          'from urllib.parse import parse_qs\nprint(parse_qs(input().strip())["msg"][0])',
          [tt('hello', 'hello world', 'msg=hello+world')]
        ),
        bi(
          'prod-web-form-m2-t2',
          'Флаг remember',
          'Тело формы содержит ключи `user`, `remember`. Если `remember` равен строке `on`, выведи `persist`, иначе `session`.',
          'Одно слово.',
          'from urllib.parse import parse_qs\n',
          '<?php\n$s = trim((string)fgets(STDIN));\nparse_str($s, $out);\necho (($out[\'remember\'] ?? \'\') === \'on\' ? "persist" : "session") . "\\n";\n',
          'from urllib.parse import parse_qs\nq = parse_qs(input().strip())\nprint("persist" if q.get("remember", [""])[0] == "on" else "session")',
          [tt('on', 'persist', 'user=x&remember=on'), tt('off', 'session', 'user=x&remember=off')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  }
]
