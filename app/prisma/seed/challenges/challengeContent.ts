import { lesson, t } from '../catalog/lessonHelpers'
import type { SeedLesson } from '../catalog/taskFactory'

export const DAILY_DATES = [
  '2026-04-01',
  '2026-04-02',
  '2026-04-03',
  '2026-04-04',
  '2026-04-05',
  '2026-04-06',
  '2026-04-07',
  '2026-04-08',
  '2026-04-09',
  '2026-04-10'
]

export const WEEK_ISO_KEYS = [
  '2026-W14',
  '2026-W15',
  '2026-W16',
  '2026-W17',
  '2026-W18',
  '2026-W19'
]

function dailyTriple(date: string, idx: number): SeedLesson[] {
  return [
    lesson(
      `daily-${date}-a`,
      `День ${idx + 1}: арифметика 1..n`,
      '## Условие\n\nС stdin целое `n` (1≤n≤100). Выведи сумму чисел от 1 до `n` включительно.\n\n**Формат:** одно целое.',
      'n = int(input())\n',
      'n = int(input())\nprint(sum(range(1, n + 1)))',
      [t('малое', '6', '3'), t('больше', '55', '10')]
    ),
    lesson(
      `daily-${date}-b`,
      `День ${idx + 1}: квадрат и куб`,
      '## Условие\n\nЦелое `x` со stdin. Выведи два числа через пробел: `x*x` и `x*x*x`.\n\n**Формат:** два целых через пробел.',
      'x = int(input())\n',
      'x = int(input())\nprint(x * x, x * x * x)',
      [t('2', '2 8', '2'), t('-1', '1 -1', '-1')]
    ),
    lesson(
      `daily-${date}-c`,
      `День ${idx + 1}: повтор символа`,
      '## Условие\n\nСтрока `ch` одним символом и целое `k` на второй строке. Выведи символ `ch`, повторённый `k` раз **подряд**.\n\n**Формат:** одна строка из `k` одинаковых символов.',
      'ch = input().strip()\nk = int(input())\n',
      'ch = input().strip()\nk = int(input())\nprint(ch * k)',
      [t('a три раза', 'aaa', 'a\n3'), t('z ноль раз', '', 'z\n0')]
    )
  ]
}

function weeklyQuintuple(week: string, _weekIndex: number): SeedLesson[] {
  return [
    lesson(
      `weekly-${week}-1`,
      `Неделя ${week}: факториал`,
      '## Условие\n\n`0≤n≤10`. Выведи `n!`.\n\n**Формат:** целое.',
      'def fac(n):\n    pass\n\nprint(fac(int(input())))\n',
      'def fac(n):\n    return 1 if n <= 1 else n * fac(n - 1)\n\nprint(fac(int(input())))',
      [t('5', '120', '5'), t('0', '1', '0'), t('1', '1', '1')]
    ),
    lesson(
      `weekly-${week}-2`,
      `Неделя ${week}: число Фибоначчи`,
      '## Условие\n\n`0≤n≤30`. Последовательность: `F0=0`, `F1=1`, далее `Fn = F(n-1)+F(n-2)`. Выведи `Fn` **итеративно** (без рекурсии).\n\n**Формат:** целое.',
      'n = int(input())\n',
      'n = int(input())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)',
      [t('6', '8', '6'), t('2', '1', '2'), t('0', '0', '0')]
    ),
    lesson(
      `weekly-${week}-3`,
      `Неделя ${week}: XOR нуля`,
      '## Условие\n\nДва целых `a` и `b`. Выведи `a ^ b`.\n\n**Формат:** целое.',
      'a = int(input())\nb = int(input())\n',
      'a = int(input())\nb = int(input())\nprint(a ^ b)',
      [t('1^1', '0', '1\n1'), t('5^2', '7', '5\n2')]
    ),
    lesson(
      `weekly-${week}-4`,
      `Неделя ${week}: максимум трёх`,
      '## Условие\n\nТри целых в одной строке через пробел. Выведи максимум.\n\n**Формат:** целое.',
      '',
      'a, b, c = map(int, input().split())\nprint(max(a, b, c))',
      [t('1 9 2', '9', '1 9 2'), t('равны', '4', '4 4 4')]
    ),
    lesson(
      `weekly-${week}-5`,
      `Неделя ${week}: палиндром слово`,
      '## Условие\n\nСлово `s` без пробелов. Выведи `да` если `s==s[::-1]`, иначе `нет`.\n\n**Формат:** русские слова.',
      's = input().strip()\n',
      's = input().strip()\nprint("да" if s == s[::-1] else "нет")',
      [t('казак', 'да', 'казак'), t('код', 'нет', 'код')]
    )
  ]
}

export function allDailyLessonGroups(): SeedLesson[][] {
  return DAILY_DATES.map((date, i) => dailyTriple(date, i))
}

export function allWeeklyLessonGroups(): SeedLesson[][] {
  return WEEK_ISO_KEYS.map((week, w) => weeklyQuintuple(week, w))
}
