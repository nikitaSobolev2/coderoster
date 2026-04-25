import UserProfile from '~/shared/components/layouts/UserProfile'
import HeaderAuthButton from '../HeaderAuthButton'

export interface Props {
  className?: string
  /** Passed to not-logged-in `HeaderAuthButton` for layout variants (e.g. mobile drawer) */
  authButtonClassName?: string
}

export default function HeaderAuth({ className = '', authButtonClassName = '' }: Props) {
  const user = null

  return (
    <div className={className}>
      {user ? <UserProfile /> : <HeaderAuthButton className={authButtonClassName} />}
    </div>
  )
}
