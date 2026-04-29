import { prisma } from './seed/lib/client'
import { runSeed } from './seed/index'

void runSeed()
  .catch((error: unknown) => {
    console.error('[seed] failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
