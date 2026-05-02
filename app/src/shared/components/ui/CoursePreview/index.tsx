import Image from 'next/image'
import clsx from 'clsx'
import styles from './styles.module.scss'

export interface Props {
  slug: string
  title: string
  coverImage: string | null
  size?: 'card' | 'hero'
  /** Optional aria-hidden override when the title is rendered nearby. */
  decorative?: boolean
}

/**
 * Course thumbnail with a deterministic gradient fallback when no image is
 * uploaded. Title acts as the visual anchor in the empty state, so the card
 * stays informative even before an admin sets a cover image.
 */
export default function CoursePreview({
  slug,
  title,
  coverImage,
  size = 'card',
  decorative = false
}: Props) {
  const className = clsx(styles.preview, size === 'hero' && styles.preview_hero)

  if (coverImage) {
    return (
      <div className={className}>
        <Image
          className={styles.preview__image}
          src={coverImage}
          alt={decorative ? '' : title}
          fill
          sizes={
            size === 'hero'
              ? '(max-width: 1024px) 100vw, min(1200px, 100vw)'
              : '(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 400px'
          }
          aria-hidden={decorative || undefined}
        />
      </div>
    )
  }

  const gradient = computeGradient(slug)
  return (
    <div className={className}>
      <div
        className={styles.placeholder}
        style={{ ['--course-preview-gradient' as string]: gradient }}
      >
        <h3
          className={clsx(
            styles.placeholder__title,
            size === 'hero' && styles.placeholder__title_hero
          )}
        >
          {title}
        </h3>
      </div>
    </div>
  )
}

/**
 * Deterministic two-stop gradient derived from the slug. Uses two well-spaced
 * hues (≈60° apart) so each course gets a distinct, branded background while
 * staying within the dark editorial palette.
 */
function computeGradient(slug: string): string {
  const hash = hashString(slug)
  const hueA = hash % 360
  const hueB = (hueA + 56) % 360
  return `linear-gradient(135deg, hsl(${hueA} 78% 52%) 0%, hsl(${hueB} 72% 38%) 100%)`
}

function hashString(value: string): number {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash | 0)
}
