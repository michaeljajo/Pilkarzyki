import { SecondaryNav } from '@/components/nav/SecondaryNav'

export default async function LeagueSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = `/leagues/${id}/league`
  return (
    // Full-width wrapper so the sub-nav keeps the shell's left edge and lines up
    // with the primary tabs above it. The page content below is capped and
    // centred separately — left-aligned content under a full-width shell read as
    // wasted screen. No section heading: the active tab already says where you are.
    <div className="w-full">
      <SecondaryNav
        ariaLabel="Sekcje ligi"
        items={[
          { label: 'Tabela', href: `${base}/table` },
          { label: 'Wyniki', href: `${base}/results` },
          { label: 'Składy', href: `${base}/lineups` },
          { label: 'Strzelcy', href: `${base}/scorers` },
        ]}
      />
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  )
}
