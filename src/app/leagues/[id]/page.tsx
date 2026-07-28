import { redirect } from 'next/navigation'

interface LeagueIndexPageProps {
  params: Promise<{ id: string }>
}

// The league landing route is Skład. The tile grid this used to render is gone;
// AppShell provides navigation. Redirect to the default landing tab.
export default async function LeagueIndexPage({ params }: LeagueIndexPageProps) {
  const { id } = await params
  redirect(`/leagues/${id}/squad`)
}
