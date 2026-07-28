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
    <div>
      <SecondaryNav
        ariaLabel="Sekcje pucharu"
        items={[
          { label: 'Drabinka', href: `${base}/bracket` },
          { label: 'Wyniki', href: `${base}/results` },
        ]}
      />
      {children}
    </div>
  )
}
