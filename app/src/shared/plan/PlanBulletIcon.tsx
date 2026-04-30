'use client'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faBolt,
  faCheck,
  faCode,
  faGift,
  faInfinity,
  faRankingStar,
  faRocket,
  faShieldHalved,
  faStar,
  faWandMagicSparkles
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { PlanMarketingBulletIconKey } from '~/shared/plan/planMarketing'

const ICONS: Record<PlanMarketingBulletIconKey, IconDefinition> = {
  check: faCheck,
  star: faStar,
  bolt: faBolt,
  sparkles: faRankingStar,
  wand: faWandMagicSparkles,
  code: faCode,
  shield: faShieldHalved,
  rocket: faRocket,
  gift: faGift,
  infinity: faInfinity
}

export interface PlanBulletIconProps {
  iconKey: PlanMarketingBulletIconKey
  className?: string
  size?: 'sm' | 'md'
}

export default function PlanBulletIcon({ iconKey, className, size = 'sm' }: PlanBulletIconProps) {
  const icon = ICONS[iconKey] ?? ICONS.check
  const px = size === 'md' ? 14 : 12
  return <FontAwesomeIcon icon={icon} className={className} style={{ width: px, height: px }} />
}
