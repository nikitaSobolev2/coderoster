import { NextResponse } from 'next/server'

import { resolveCurrentUser } from '~/server/api/trpc'
import { getStorageService, type UploadKind } from '~/server/services/StorageService'
import { validateImageUpload } from '~/server/uploads/imageUploadValidation'

export const runtime = 'nodejs'

const KIND_VALUES = new Set<UploadKind>([
  'AVATAR',
  'COURSE_COVER',
  'ACHIEVEMENT_COVER',
  'CONTENT_PAGE_INLINE'
])

/**
 * Multipart image upload: browser → Next.js → S3/MinIO (`S3_ENDPOINT`).
 * Avoids presigned PUT quirks on some S3-compatible servers.
 */
export async function POST(req: Request) {
  const user = await resolveCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Требуется вход.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ожидался multipart/form-data.' }, { status: 400 })
  }

  const kindRaw = formData.get('kind')
  const fileEntry = formData.get('file')

  if (typeof kindRaw !== 'string' || !KIND_VALUES.has(kindRaw as UploadKind)) {
    return NextResponse.json({ error: 'Некорректный параметр kind.' }, { status: 400 })
  }
  const kind = kindRaw as UploadKind

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'Файл не передан.' }, { status: 400 })
  }

  const fail = validateImageUpload({
    kind,
    contentType: fileEntry.type,
    byteLength: fileEntry.size,
    role: user.role
  })
  if (fail) {
    return NextResponse.json({ error: fail.message }, { status: fail.httpStatus })
  }

  try {
    const body = new Uint8Array(await fileEntry.arrayBuffer())
    const { publicUrl } = await getStorageService().putImageBody({
      kind,
      ownerId: user.id,
      contentType: fileEntry.type,
      body
    })
    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error('[api/uploads/image]', error)
    return NextResponse.json({ error: 'Не удалось сохранить файл.' }, { status: 500 })
  }
}
