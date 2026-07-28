import { redirect } from 'next/navigation'

export default async function CupSectionIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/leagues/${id}/cup/bracket`)
}
