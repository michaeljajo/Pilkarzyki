import { SecondaryNav } from '@/components/nav/SecondaryNav'

export default async function CupSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const base = `/leagues/${id}/cup`
  return (
    // Same treatment as the Liga section: full-width nav, centred content.
    <div className="w-full">
      <SecondaryNav
        ariaLabel="Sekcje pucharu"
        items={[
          { label: 'Drabinka', href: `${base}/bracket` },
          { label: 'Wyniki', href: `${base}/results` },
        ]}
      />
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  )
}
