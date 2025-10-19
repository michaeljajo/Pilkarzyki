import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Fantasy Football
          </h1>
          <p className="text-gray-600">
            Create your account to get started
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
              card: 'shadow-lg',
            }
          }}
        />
      </div>
    </div>
  )
}