import { refPythonBlock, type SeedLesson, type SeedTest } from './taskFactory'

export function lesson(
  slug: string,
  title: string,
  body: string,
  starter: string,
  pythonAnswer: string,
  tests: SeedTest[]
): SeedLesson {
  return {
    slug,
    title,
    body,
    starter,
    summary: refPythonBlock(pythonAnswer),
    tests
  }
}

export const t = (name: string, expected: string, input?: string | null): SeedTest => ({
  name,
  expected,
  input: input ?? null
})
