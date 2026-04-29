import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt,
  faBookOpen,
  faCircleCheck,
  faCode,
  faDatabase,
  faDiagramProject,
  faFileCode,
  faFileLines,
  faFire,
  faFlask,
  faGears,
  faGlobe,
  faGraduationCap,
  faMedal,
  faMoon,
  faRocket,
  faShoePrints,
  faStar,
  faTerminal,
  faTrophy
} from '@fortawesome/free-solid-svg-icons'

/**
 * Single source of truth for FA icon keys used by `iconKey` columns
 * (categories, achievements). Keys stay short and lowercase so admin-entered
 * strings collide cleanly across renderers.
 */
export const ICON_BY_KEY: Record<string, IconDefinition> = {
  bolt: faBolt,
  'book-open': faBookOpen,
  'circle-check': faCircleCheck,
  algorithm: faDiagramProject,
  code: faCode,
  database: faDatabase,
  'diagram-project': faDiagramProject,
  'file-lines': faFileLines,
  fire: faFire,
  flask: faFlask,
  gears: faGears,
  globe: faGlobe,
  'graduation-cap': faGraduationCap,
  medal: faMedal,
  moon: faMoon,
  php: faFileCode,
  python: faCode,
  rocket: faRocket,
  'shoe-prints': faShoePrints,
  star: faStar,
  terminal: faTerminal,
  trophy: faTrophy
}

export const FALLBACK_ICON: IconDefinition = faTrophy

export function resolveIcon(key: string | null | undefined): IconDefinition {
  if (!key) return FALLBACK_ICON
  return ICON_BY_KEY[key] ?? FALLBACK_ICON
}

export const ICON_KEY_OPTIONS = Object.keys(ICON_BY_KEY).sort()
