import '@mantine/core/styles.layer.css'
import '@mantine/spotlight/styles.layer.css'
import '@mantine/notifications/styles.layer.css'
import '@mantine/dropzone/styles.layer.css'

import '~/shared/assets/styles/normalize.scss'
import '~/shared/assets/styles/fonts.scss'
import '~/shared/assets/styles/variables.scss'
import '~/shared/assets/styles/globals.scss'

import { type Metadata } from 'next'

import { SITE_NAME } from '~/shared/constants/site'
import { TRPCReactProvider } from '~/trpc/react'
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components'

export const metadata: Metadata = {
  title: `${SITE_NAME} — учись писать код через практику`,
  description:
    'Курсы по программированию с интерактивными задачами, проверкой кода и геймификацией прогресса.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }]
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <TRPCReactProvider>
          <AuthKitProvider>
            <MantineProvider defaultColorScheme="dark">
              <Notifications position="top-right" autoClose={3500} zIndex={9999} />
              {children}
            </MantineProvider>
          </AuthKitProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
