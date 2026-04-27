import PlatformShell from '~/shared/components/layouts/PlatformShell'

/**
 * Default platform layout: header, padded main content area and full footer.
 * Used by every page that does not need to take over the entire viewport.
 */
export default function PlatformStandardLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
