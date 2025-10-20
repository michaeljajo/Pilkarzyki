import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Trophy, Target, BarChart3, Zap, Users, Calendar, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default async function Home() {
  const user = await currentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center" style={{ gap: '12px' }}>
              <Image
                src="/pilkarzyki-logo.png"
                alt="Pilkarzyki"
                width={200}
                height={50}
                priority
              />
            </div>
            <div className="flex items-center" style={{ gap: '12px' }}>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Zaloguj się
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                  Rozpocznij
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)]" style={{ padding: '16px' }}>
        <div className="max-w-5xl mx-auto text-center animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Hero Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 className="font-extrabold" style={{ fontSize: '64px', lineHeight: '1.3' }}>
              <span className="gradient-text-teal">Piłkarzyki</span>
              <br />
              <span className="text-gray-900">na nowo</span>
            </h1>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 max-w-4xl mx-auto stagger-children" style={{ gap: '24px' }}>
            <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl transition-shadow duration-200" style={{ padding: '24px' }}>
              <div className="w-12 h-12 rounded-lg bg-[#29544D]/10 flex items-center justify-center" style={{ marginBottom: '16px' }}>
                <Trophy size={24} className="text-[#29544D]" />
              </div>
              <h3 className="font-semibold text-gray-900" style={{ marginBottom: '8px', fontSize: '19px' }}>Zarządzanie Ligą</h3>
              <p className="text-sm text-gray-600" style={{ lineHeight: '1.6' }}>Twórz i zarządzaj ligami z zaawansowanym systemem harmonogramów i analityki</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl transition-shadow duration-200" style={{ padding: '24px' }}>
              <div className="w-12 h-12 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center" style={{ marginBottom: '16px' }}>
                <Target size={24} className="text-[#3B82F6]" />
              </div>
              <h3 className="font-semibold text-gray-900" style={{ marginBottom: '8px', fontSize: '19px' }}>Wybór Składu</h3>
              <p className="text-sm text-gray-600" style={{ lineHeight: '1.6' }}>Interaktywny widok boiska z zarządzaniem drużyną metodą przeciągnij i upuść</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 hover-lift hover:shadow-xl transition-shadow duration-200" style={{ padding: '24px' }}>
              <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center" style={{ marginBottom: '16px' }}>
                <BarChart3 size={24} className="text-[#10B981]" />
              </div>
              <h3 className="font-semibold text-gray-900" style={{ marginBottom: '8px', fontSize: '19px' }}>Tabela Na Żywo</h3>
              <p className="text-sm text-gray-600" style={{ lineHeight: '1.6' }}>Tabela ligowa w czasie rzeczywistym z kompleksowymi statystykami</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center" style={{ gap: '16px', paddingTop: '16px' }}>
            <Link href="/sign-up">
              <Button
                size="lg"
                icon={<Zap size={20} />}
              >
                Rozpocznij Swoją Ligę
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                size="lg"
              >
                Zaloguj się
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto" style={{ padding: '32px 16px' }}>
          <div className="flex justify-center items-center">
            <div className="flex items-center" style={{ gap: '8px' }}>
              <Trophy size={20} className="text-[#29544D]" />
              <span className="text-sm text-gray-600">
                © 2025 Piłkarzyki. Zagraj w draft z kolegami i znajomymi.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
