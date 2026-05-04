import { moduleBlock, type CourseDef } from '../catalog/courseTypes'

import { bi, theoryRU, tt } from './helpers'

/** Пять PHP-курсов CLI: основной язык карточки PHP, задачи билингвальные. */
export const PHP_PROD_COURSES: CourseDef[] = [
  {
    slug: 'prod-php-cli',
    categoryLeafSlug: 'seed-leaf-env-io',
    title: 'PHP в консоли: первые скрипты',
    summary: 'Тег <?php, echo, чтение stdin.',
    shortSummary: 'От Hello World до разбора строки.',
    description:
      'PHP как язык коротких CLI-утилит: потоки ввода-вывода, конкатенация и простые преобразования.',
    difficulty: 'beginner',
    durationHours: 10,
    xpReward: 1000,
    tags: ['php', 'cli'],
    author: 'secondary',
    primaryLanguage: 'php',
    tierRequired: 0,
    modules: [
      moduleBlock('Старт', 'Синтаксис и вывод.', [
        theoryRU(
          'prod-php-cli-th',
          'PHP как CLI',
          [
            '## Зачем консольный PHP',
            '',
            'Тот же движок, что и у веба, но без сервера: удобно для утилит и учебных задач.',
            '',
            'Всегда открывай файл тегом `<?php` и помни про перевод строки в `echo`, если формат важен.'
          ].join('\n')
        ),
        bi(
          'prod-php-cli-m1-t1',
          'Эхо-строка',
          'Выведи ровно строку `PHP готов`.',
          'Одна строка UTF-8.',
          '# Выведи строку UTF-8: PHP готов\n',
          '<?php\n// echo строку «PHP готов» с переводом строки\n',
          'print("PHP готов")',
          [tt('проверка', 'PHP готов')]
        ),
        bi(
          'prod-php-cli-m1-t2',
          'Имя пользователя',
          'Строка stdin — имя без пробелов. Выведи `Привет, <имя>!`.',
          'Одна строка.',
          'name = input().strip()\n',
          '<?php\n$name = trim((string)fgets(STDIN));\necho "Привет, {$name}!\\n";\n',
          'name = input().strip()\nprint(f"Привет, {name}!")',
          [tt('лектор', 'Привет, Лена!', 'Лена')]
        )
      ]),
      moduleBlock('Числа из строки', 'int и арифметика.', [
        bi(
          'prod-php-cli-m2-t1',
          'Удвоить число',
          'Целое со stdin. Выведи `double:<2*n>`.',
          'Строка вида `double:14` для входа `7`.',
          'n = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\necho "double:" . ($n * 2) . "\\n";\n',
          'n = int(input())\nprint(f"double:{2*n}")',
          [tt('7', 'double:14', '7')]
        ),
        bi(
          'prod-php-cli-m2-t2',
          'Тип тарифа',
          'Строка stdin: `free`, `pro` или `pro-plus`. Выведи числовой код: `free→0`, `pro→1`, `pro-plus→2`. Иначе выведи `-1`.',
          'Одно целое.',
          'code = input().strip()\n',
          "<?php\n$s = trim((string)fgets(STDIN));\n$map = ['free' => 0, 'pro' => 1, 'pro-plus' => 2];\necho ($map[$s] ?? -1) . \"\\n\";\n",
          'code = input().strip()\nm = {"free":0,"pro":1,"pro-plus":2}\nprint(m.get(code, -1))',
          [tt('pro', '1', 'pro'), tt('unknown', '-1', 'enterprise')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-php-collections',
    categoryLeafSlug: 'seed-leaf-syn-lists',
    title: 'PHP: массивы и строковые операции',
    summary: 'array_* функции, explode/implode.',
    shortSummary: 'Коллекции без объектной обвязки.',
    description:
      'Индексные и ассоциативные массивы в PHP: разбор строк, подсчёты и минимальные алгоритмы.',
    difficulty: 'beginner',
    durationHours: 14,
    xpReward: 1350,
    tags: ['php', 'массивы'],
    author: 'secondary',
    primaryLanguage: 'php',
    tierRequired: 0,
    modules: [
      moduleBlock('Списки чисел', 'explode и суммы.', [
        bi(
          'prod-php-col-m1-t1',
          'Сумма через explode',
          'Строка stdin — целые через запятую. Выведи сумму.',
          'Одно целое.',
          'raw = input().strip()\n',
          "<?php\n$raw = trim((string)fgets(STDIN));\n$parts = explode(',', $raw);\n$sum = array_sum(array_map('intval', $parts));\necho $sum . \"\\n\";\n",
          'raw = input().strip()\nprint(sum(int(x) for x in raw.split(",")))',
          [tt('1,2,3', '6', '1,2,3')]
        ),
        bi(
          'prod-php-col-m1-t2',
          'Последний элемент',
          'Строка stdin — числа через пробел (минимум одно). Выведи последнее.',
          'Одно целое.',
          'nums = list(map(int, input().split()))\n',
          '<?php\n$line = trim((string)fgets(STDIN));\n$parts = preg_split(\'/\\s+/\', $line);\n$last = (int)$parts[count($parts) - 1];\necho $last . "\\n";\n',
          'nums = list(map(int, input().split()))\nprint(nums[-1])',
          [tt('9', '9', '3 9')]
        )
      ]),
      moduleBlock('Ассоциативные сценарии', 'map ключ → значение.', [
        bi(
          'prod-php-col-m2-t1',
          'Подсчёт слов',
          'Строка stdin — слова через пробел (нижний регистр). Выведи количество **уникальных** слов.',
          'Одно целое.',
          'words = input().split()\n',
          '<?php\n$words = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$uniq = array_unique($words);\necho count($uniq) . "\\n";\n',
          'words = input().split()\nprint(len(set(words)))',
          [tt('dup', '2', 'run run walk')]
        ),
        bi(
          'prod-php-col-m2-t2',
          'Топ балла',
          'Первая строка `n`, далее `n` строк `имя:балл`. Выведи имя с максимальным баллом (если несколько — лексикографически минимальное имя).',
          'Одна строка имени.',
          'n = int(input())\n',
          '<?php\n$n = (int)trim((string)fgets(STDIN));\n$bestName = null;\n$bestScore = null;\nfor ($i = 0; $i < $n; $i++) {\n    $line = trim((string)fgets(STDIN));\n    [$name, $score] = explode(\':\', $line, 2);\n    $score = (int)$score;\n    if ($bestScore === null || $score > $bestScore || ($score === $bestScore && strcmp($name, $bestName) < 0)) {\n        $bestScore = $score;\n        $bestName = $name;\n    }\n}\necho $bestName . "\\n";\n',
          'n = int(input())\nbest = None\nfor _ in range(n):\n    name, score = input().split(":")\n    score = int(score)\n    if best is None or score > best[1] or (score == best[1] and name < best[0]):\n        best = (name, score)\nprint(best[0])\n',
          [tt('выбор', 'amy', '2\namy:10\nbob:9')],
          { isPremium: true, minPlanTier: 1 }
        )
      ])
    ]
  },
  {
    slug: 'prod-php-functions',
    categoryLeafSlug: 'seed-leaf-syn-funcs',
    title: 'PHP: функции и область видимости',
    summary: 'function, type hints, возврат значений.',
    shortSummary: 'Создаём маленькие API из функций.',
    description: 'Именованные функции, строгие сигнатуры PHP 8 и композиция простых шагов.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1500,
    tags: ['php', 'функции'],
    author: 'secondary',
    primaryLanguage: 'php',
    tierRequired: 1,
    modules: [
      moduleBlock('Чистые функции', 'Без побочных эффектов.', [
        bi(
          'prod-php-fn-m1-t1',
          'Куб',
          'Функция `cube(int $x): int` возвращает `x*x*x`. stdin одно целое.',
          'Одно целое.',
          'def cube(x):\n    pass\n\n',
          '<?php\nfunction cube(int $x): int {\n    return $x * $x * $x;\n}\necho cube((int)trim((string)fgets(STDIN))) . "\\n";\n',
          'def cube(x: int) -> int:\n    return x * x * x\n\nprint(cube(int(input())))',
          [tt('3', '27', '3')]
        ),
        bi(
          'prod-php-fn-m1-t2',
          'Нормализация slug',
          'Функция `slugify(string $s): string` переводит строку в нижний регистр, заменяет пробелы на `-`, удаляет символы не `[a-z0-9-]`. stdin одна строка.',
          'Строка slug.',
          'import re\n\ndef slugify(s):\n    pass\n\n',
          "<?php\nfunction slugify(string $s): string {\n    $s = strtolower($s);\n    $s = str_replace(' ', '-', $s);\n    return preg_replace('/[^a-z0-9\\-]+/', '', $s);\n}\necho slugify(trim((string)fgets(STDIN))) . \"\\n\";\n",
          'import re\n\ndef slugify(s: str) -> str:\n    s = s.lower().replace(" ", "-")\n    return re.sub(r"[^a-z0-9\\-]+", "", s)\n\nprint(slugify(input().strip()))',
          [tt('Hello World', 'hello-world', 'Hello World')]
        )
      ]),
      moduleBlock('Композиция', 'Функции вызывают функции.', [
        bi(
          'prod-php-fn-m2-t1',
          'Цена со скидкой',
          'Функции `roundMoney(float $x): float` округляет к двум знакам; `discount(float $price, int $percent)` возвращает цену после скидки (процент целый). stdin два числа: цена и процент через перевод строки.',
          'Число с двумя знаками после запятой через точку.',
          'def round_money(x):\n    pass\n\n',
          '<?php\nfunction roundMoney(float $x): float {\n    return round($x, 2);\n}\nfunction discount(float $price, int $percent): float {\n    return roundMoney($price * (100 - $percent) / 100);\n}\n$p = (float)trim((string)fgets(STDIN));\n$perc = (int)trim((string)fgets(STDIN));\necho discount($p, $perc) . "\\n";\n',
          'def round_money(x: float) -> float:\n    return round(x, 2)\n\ndef discount(price: float, percent: int) -> float:\n    return round_money(price * (100 - percent) / 100)\n\nprint(discount(float(input()), int(input())))',
          [tt('скидка', '80.0', '100\n20')]
        ),
        bi(
          'prod-php-fn-m2-t2',
          'Цепочка хешей',
          'Функция `repeatHash(string $s, int $k): string` применяет `sha256` к строке `k` раз подряд (каждый раз ко входу подставляется шестнадцатеричный результат предыдущего шага). `k>=1`. Выведи финальную hex-строку нижним регистром.',
          'Строка hex длины 64.',
          'import hashlib\n\ndef repeat_hash(s, k):\n    pass\n\n',
          '<?php\nfunction repeatHash(string $s, int $k): string {\n    $cur = $s;\n    for ($i = 0; $i < $k; $i++) {\n        $cur = hash(\'sha256\', $cur);\n    }\n    return $cur;\n}\n$s = trim((string)fgets(STDIN));\n$k = (int)trim((string)fgets(STDIN));\necho repeatHash($s, $k) . "\\n";\n',
          'import hashlib\n\ndef repeat_hash(s: str, k: int) -> str:\n    cur = s\n    for _ in range(k):\n        cur = hashlib.sha256(cur.encode()).hexdigest()\n    return cur\n\nprint(repeat_hash(input().strip(), int(input())))',
          [tt('k1', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', 'a\n1')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-php-data',
    categoryLeafSlug: 'seed-leaf-data-json',
    title: 'PHP: файловые потоки и JSON',
    summary: 'stream_get_contents, json_encode/decode.',
    shortSummary: 'Текст → данные → текст.',
    description: 'Читаем stdin целиком, парсим JSON и формируем ответ согласно контракту.',
    difficulty: 'intermediate',
    durationHours: 14,
    xpReward: 1500,
    tags: ['php', 'json'],
    author: 'secondary',
    primaryLanguage: 'php',
    tierRequired: 1,
    modules: [
      moduleBlock('JSON decode', 'assoc массивы.', [
        bi(
          'prod-php-data-m1-t1',
          'Поле meta.version',
          'Строка stdin — JSON объект с ключом `meta` (объект) и полем `version` внутри. Выведи версию строкой.',
          'Строка без JSON-кавычек.',
          'import json\n',
          "<?php\n$raw = trim((string)fgets(STDIN));\n$data = json_decode($raw, true);\necho $data['meta']['version'] . \"\\n\";\n",
          'import json\nobj = json.loads(input().strip())\nprint(obj["meta"]["version"])',
          [tt('версия', '2', '{"meta":{"version":"2"}}')]
        ),
        bi(
          'prod-php-data-m1-t2',
          'Список → CSV',
          'JSON массив строк со stdin. Выведи их через запятую без пробелов.',
          'Одна строка CSV.',
          'import json\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\n$arr = json_decode($raw, true);\necho implode(\',\', $arr) . "\\n";\n',
          'import json\nprint(",".join(json.loads(input().strip())))',
          [tt('abc', 'a,b,c', '["a","b","c"]')]
        )
      ]),
      moduleBlock('Поток целиком', 'Многострочный stdin.', [
        bi(
          'prod-php-data-m2-t1',
          'Строки до пустой',
          'Читай строки stdin пока не встретишь пустую строку (как ввод закончен). Выведи число строк без учёта терминатора.',
          'Одно целое.',
          'n = 0\nwhile True:\n    line = input()\n    if line == "":\n        break\n    n += 1\n',
          '<?php\n$n = 0;\nwhile (($line = fgets(STDIN)) !== false) {\n    $line = rtrim($line, "\\r\\n");\n    if ($line === "") {\n        break;\n    }\n    $n++;\n}\necho $n . "\\n";\n',
          'n = 0\nwhile True:\n    line = input()\n    if line == "":\n        break\n    n += 1\nprint(n)',
          [tt('2', '2', 'a\nb\n\n')]
        ),
        bi(
          'prod-php-data-m2-t2',
          'Pretty keys sort',
          'Строка stdin — JSON объект с числовыми значениями. Выведи ключи **отсортированные лексикографически** через запятую без пробелов.',
          'CSV ключей.',
          'import json\n',
          '<?php\n$raw = trim((string)fgets(STDIN));\n$data = json_decode($raw, true);\n$keys = array_keys($data);\nsort($keys);\necho implode(\',\', $keys) . "\\n";\n',
          'import json\nobj = json.loads(input().strip())\nprint(",".join(sorted(obj.keys())))',
          [tt('keys', 'a,z', '{"z":1,"a":2}')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  },
  {
    slug: 'prod-php-oop',
    categoryLeafSlug: 'seed-leaf-app-oop',
    title: 'PHP: классы и простые объекты',
    summary: 'readonly свойства, методы, финальные классы.',
    shortSummary: 'ООП без фреймворка.',
    description: 'Небольшие классы с типами PHP 8 для моделирования сущностей предметной области.',
    difficulty: 'intermediate',
    durationHours: 16,
    xpReward: 1700,
    tags: ['php', 'ООП'],
    author: 'secondary',
    primaryLanguage: 'php',
    tierRequired: 1,
    modules: [
      moduleBlock('Инкапсуляция', 'Методы и состояние.', [
        bi(
          'prod-php-oop-m1-t1',
          'Банковский счёт',
          'Класс `Account` с полем `balance` (float, только чтение снаружи через геттер). Конструктор принимает стартовый баланс. Методы `deposit(float $x)`, `withdraw(float $x)` (не даём уйти ниже нуля — просто игнорируем). stdin три числа: старт, затем два действия `d10` или `w5` в формате буква+число без пробела на строку.',
          'Итоговый баланс с двумя знаками после запятой.',
          'class Account:\n    pass\n\n',
          "<?php\nfinal class Account {\n    public function __construct(private float $balance) {}\n    public function balance(): float {\n        return $this->balance;\n    }\n    public function deposit(float $x): void {\n        $this->balance += $x;\n    }\n    public function withdraw(float $x): void {\n        $this->balance = max(0.0, $this->balance - $x);\n    }\n}\n$start = (float)trim((string)fgets(STDIN));\n$acc = new Account($start);\nfor ($i = 0; $i < 2; $i++) {\n    $line = trim((string)fgets(STDIN));\n    $op = $line[0];\n    $amt = (float)substr($line, 1);\n    if ($op === 'd') {\n        $acc->deposit($amt);\n    } else {\n        $acc->withdraw($amt);\n    }\n}\necho number_format($acc->balance(), 2, '.', '') . \"\\n\";\n",
          'class Account:\n    def __init__(self, balance: float):\n        self._balance = balance\n    def deposit(self, x: float):\n        self._balance += x\n    def withdraw(self, x: float):\n        self._balance = max(0.0, self._balance - x)\n\nacc = Account(float(input()))\nfor _ in range(2):\n    line = input().strip()\n    op, amt = line[0], float(line[1:])\n    if op == "d":\n        acc.deposit(amt)\n    else:\n        acc.withdraw(amt)\nprint(f"{acc._balance:.2f}")\n',
          [tt('цепочка', '15.00', '10\nd5\nw0')]
        ),
        bi(
          'prod-php-oop-m1-t2',
          'Прямоугольник',
          'Класс `Rect` с целыми `w,h > 0`, метод `area(): int`. stdin `w h`, выведи площадь.',
          'Целое.',
          'class Rect:\n    pass\n\n',
          '<?php\nfinal class Rect {\n    public function __construct(private int $w, private int $h) {}\n    public function area(): int {\n        return $this->w * $this->h;\n    }\n}\n$parts = preg_split(\'/\\s+/\', trim((string)fgets(STDIN)));\n$r = new Rect((int)$parts[0], (int)$parts[1]);\necho $r->area() . "\\n";\n',
          'class Rect:\n    def __init__(self, w: int, h: int):\n        self.w, self.h = w, h\n    def area(self) -> int:\n        return self.w * self.h\n\nw,h = map(int,input().split())\nprint(Rect(w,h).area())',
          [tt('4 5', '20', '4 5')]
        )
      ]),
      moduleBlock('Композиция', 'Объект содержит объект.', [
        theoryRU(
          'prod-php-oop-th',
          'Объекты в PHP',
          [
            '## Когда нужен класс',
            '',
            'Если данные и правила живут вместе (инварианты, методы) — заворачивай в тип.',
            '',
            'Используй `readonly` свойства PHP 8.2+ там, где мутабельность не нужна после конструктора.'
          ].join('\n')
        ),
        bi(
          'prod-php-oop-m2-t2',
          'Команда и игроки',
          'Класс `Team` содержит массив имён игроков (строки). Метод `rosterLine(): string` возвращает строку `Игрок1|Игрок2|...` в порядке добавления. Конструктор пустой, метод `add(string $name)`. stdin число `n`, затем `n` имён — добавь и выведи `rosterLine()`.',
          'Строка с разделителем `|`.',
          'class Team:\n    pass\n\n',
          '<?php\nfinal class Team {\n    /** @var string[] */\n    private array $players = [];\n    public function add(string $name): void {\n        $this->players[] = $name;\n    }\n    public function rosterLine(): string {\n        return implode(\'|\', $this->players);\n    }\n}\n$n = (int)trim((string)fgets(STDIN));\n$t = new Team();\nfor ($i = 0; $i < $n; $i++) {\n    $t->add(trim((string)fgets(STDIN)));\n}\necho $t->rosterLine() . "\\n";\n',
          'class Team:\n    def __init__(self):\n        self.players = []\n    def add(self, name: str):\n        self.players.append(name)\n    def roster_line(self) -> str:\n        return "|".join(self.players)\n\nt = Team()\nfor _ in range(int(input())):\n    t.add(input().strip())\nprint(t.roster_line())\n',
          [tt('два', 'a|b', '2\na\nb')],
          { isPremium: true, minPlanTier: 2 }
        )
      ])
    ]
  }
]
