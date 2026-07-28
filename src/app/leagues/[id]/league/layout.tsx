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
    <div>
      <SecondaryNav
        ariaLabel="Sekcje ligi"
        items={[
          { label: 'Tabela', href: `${base}/table` },
          { label: 'Wyniki', href: `${base}/results` },
          { label: 'Składy', href: `${base}/lineups` },
          { label: 'Strzelcy', href: `${base}/scorers` },
        ]}
      />
      {children}
    </div>
  )
}
