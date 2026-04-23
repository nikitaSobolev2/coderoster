import UserProfile from '~/shared/components/layouts/UserProfile'
import HeaderAuthButton from '../HeaderAuthButton'

export interface Props {
  className?: string
}

export default function HeaderAuth({ className = '' }: Props) {
  const user = null

  return <div className={className}>{user ? <UserProfile /> : <HeaderAuthButton />}</div>
}
