import 'server-only'
import type { User } from '@prisma/client'
import { db } from '~/server/db'

/**
 * Case-insensitive username resolver. URL paths like `/u/CodeNikita` should
 * land on the same profile as `/u/codenikita`. Falls back to a broader query
 * when no exact match is found so legacy mixed-case rows still resolve.
 */
export async function findUserByUsernameLoose(username: string): Promise<User | null> {
  const trimmed = username.trim()
  if (!trimmed) return null

  const exact = await db.user.findUnique({ where: { username: trimmed } })
  if (exact) return exact

  return db.user.findFirst({
    where: { username: { equals: trimmed, mode: 'insensitive' } }
  })
}
