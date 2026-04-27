import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt,
  faBookOpen,
  faCircleCheck,
  faCode,
  faFire,
  faFlask,
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
  code: faCode,
  fire: faFire,
  flask: faFlask,
  'graduation-cap': faGraduationCap,
  medal: faMedal,
  moon: faMoon,
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
