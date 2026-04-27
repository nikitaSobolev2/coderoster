import 'server-only'
import { db } from '~/server/db'

const ALLOWED_LANGUAGES_KEY = 'allowed_languages'
const DEFAULT_LANGUAGES = ['python', 'php']

export class AdminLanguagesRepository {
  async list(): Promise<string[]> {
    const row = await db.appSetting.findUnique({ where: { key: ALLOWED_LANGUAGES_KEY } })
    if (!row) return [...DEFAULT_LANGUAGES]
    if (Array.isArray(row.value)) return row.value as string[]
    return [...DEFAULT_LANGUAGES]
  }

  async update(languages: string[]): Promise<string[]> {
    const cleaned = Array.from(
      new Set(
        languages
          .map(language => language.trim().toLowerCase())
          .filter(language => language.length > 0)
      )
    )
    await db.appSetting.upsert({
      where: { key: ALLOWED_LANGUAGES_KEY },
      update: { value: cleaned },
      create: { key: ALLOWED_LANGUAGES_KEY, value: cleaned }
    })
    return cleaned
  }
}
