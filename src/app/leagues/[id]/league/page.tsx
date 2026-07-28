import { redirect } from 'next/navigation'

export default async function LeagueSectionIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/leagues/${id}/league/table`)
}
