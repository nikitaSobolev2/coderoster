import PlatformShell from '~/shared/components/layouts/PlatformShell'

/**
 * Focused platform layout used by the in-course experience: header on top,
 * but no footer and no internal padding so the page can occupy the whole
 * viewport (editor + execution panel).
 */
export default function PlatformFocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformShell fluid hideFooter>
      {children}
    </PlatformShell>
  )
}
