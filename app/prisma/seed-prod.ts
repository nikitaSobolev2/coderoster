import { disconnectProdPrisma, runProdSeed } from './seed/prod/runProdSeed'

if (process.env.ALLOW_PROD_SEED !== '1') {
  console.error('[seed-prod] refused: set environment variable ALLOW_PROD_SEED=1')
  process.exit(1)
}
if (process.env.NODE_ENV !== 'production') {
  console.error('[seed-prod] refused: set NODE_ENV=production')
  process.exit(1)
}

void runProdSeed()
  .catch((error: unknown) => {
    console.error('[seed-prod] failed', error)
    process.exit(1)
  })
  .finally(async () => {
    await disconnectProdPrisma()
  })
