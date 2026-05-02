'use client'

import Link from 'next/link'

import HomeTooltip from '~/shared/components/ui/HomeTooltip'
import type { Url } from 'next/dist/shared/lib/router/router'
import { scrollToSectionById } from '~/features/home/components/common/SectionScroller/section-scroll-api'
import styles from './styles.module.scss'

export interface Props extends React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  disabled?: boolean
  label?: string
  href?: Url
  onClick?: (event?: React.MouseEvent) => void
  preserveOnClick?: boolean
  ref?: React.Ref<HTMLButtonElement | HTMLAnchorElement>
}

export default function PureButton({
  className = '',
  disabled = false,
  label = '',
  preserveOnClick = true,
  onClick,
  ref,
  ...defaultProps
}: Props) {
  function onClickHandler(event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (
      preserveOnClick &&
      typeof defaultProps.href === 'string' &&
      defaultProps.href.startsWith('#')
    ) {
      event.preventDefault()
      const id = defaultProps.href.slice(1)
      if (id) {
        scrollToSectionById(id)
      }
    }

    onClick?.(event)
  }

  const loginPath =
    typeof defaultProps.href === 'string' && defaultProps.href.split(/[?#]/, 1)[0] === '/login'

  const content =
    defaultProps.href !== undefined ? (
      <Link
        href={defaultProps.href}
        className={`${styles.pure_button} ${className}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 1}
        aria-label={label}
        {...defaultProps}
        prefetch={loginPath ? false : undefined}
        onClick={e => onClickHandler(e)}
        ref={ref as React.Ref<HTMLAnchorElement>}
      />
    ) : (
      <button
        className={`${styles.pure_button} ${className}`}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 1}
        {...defaultProps}
        onClick={e => onClickHandler(e)}
        ref={ref as React.Ref<HTMLButtonElement>}
      />
    )

  return label ? <HomeTooltip label={label}>{content}</HomeTooltip> : content
}
