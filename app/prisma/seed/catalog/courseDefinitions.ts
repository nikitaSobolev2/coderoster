import type { CourseDef } from './courseTypes'
import { DEFS_BATCH_1 } from './defsBatch1'
import { DEFS_BATCH_2 } from './defsBatch2'
import { DEFS_BATCH_3 } from './defsBatch3'

export const COURSE_DEFS: CourseDef[] = [...DEFS_BATCH_1, ...DEFS_BATCH_2, ...DEFS_BATCH_3]

export type { CourseDef } from './courseTypes'
