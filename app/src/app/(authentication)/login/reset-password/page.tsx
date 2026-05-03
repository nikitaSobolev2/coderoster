import ResetPasswordClient from '~/features/authentication/pages/ResetPasswordClient'

export default async function ResetPasswordPage({
  searchParams
}: Readonly<{
  searchParams: Promise<{ token?: string }>
}>) {
  const sp = await searchParams
  return <ResetPasswordClient initialToken={typeof sp.token === 'string' ? sp.token : ''} />
}
