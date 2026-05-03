'use client'

import { Anchor, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import Logo from '~/shared/components/common/Logo'

import styles from './authChrome.module.scss'

export interface AuthChromeProps {
  title: string
  subtitle?: string
  backHref?: string
  children: React.ReactNode
}

export default function AuthChrome({ title, subtitle, backHref, children }: AuthChromeProps) {
  return (
    <div className={styles.root}>
      <Container fluid className={styles.chromeShell} py={{ base: 'lg', sm: 'xl' }} px="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="nowrap">
            {backHref ? (
              <Anchor
                component={Link}
                href={backHref}
                size="sm"
                c="dimmed"
                underline="never"
                display="inline-flex"
                style={{ alignItems: 'center', gap: 6, minHeight: 44 }}
              >
                <ArrowLeft size={18} aria-hidden />
                Назад
              </Anchor>
            ) : (
              <span />
            )}
            <Link href="/" className={styles.logoWrap} prefetch={false}>
              <Logo />
            </Link>
          </Group>

          <Stack gap={4}>
            <Title order={2} size="h3" fw={600}>
              {title}
            </Title>
            {subtitle ? (
              <Text size="sm" c="dimmed">
                {subtitle}
              </Text>
            ) : null}
          </Stack>

          <Paper className={styles.paper} p={{ base: 'md', sm: 'xl' }} radius="md">
            {children}
          </Paper>
        </Stack>
      </Container>
    </div>
  )
}
