import 'server-only'

import { db } from '~/server/db'

const AI_CODE_IMPROVE_KEY = 'ai_code_improve'
const DEFAULT_MODEL = 'gpt-4o-mini'

export interface AiCodeImproveSettings {
  model: string
}

export class AdminAiCodeImproveRepository {
  async get(): Promise<AiCodeImproveSettings> {
    const row = await db.appSetting.findUnique({ where: { key: AI_CODE_IMPROVE_KEY } })
    const cfg = (row?.value ?? {}) as { model?: string }
    const model =
      typeof cfg.model === 'string' && cfg.model.trim().length > 0
        ? cfg.model.trim()
        : DEFAULT_MODEL
    return { model }
  }

  async update(input: { model: string }): Promise<AiCodeImproveSettings> {
    const model = input.model.trim()
    await db.appSetting.upsert({
      where: { key: AI_CODE_IMPROVE_KEY },
      update: { value: { model } },
      create: { key: AI_CODE_IMPROVE_KEY, value: { model } }
    })
    return { model }
  }
}
