'use client'

import { ScheduleGenerator } from '@/components/admin/ScheduleGenerator'

export default function ScheduleGeneratorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate a head-to-head double round-robin schedule for your league managers
        </p>
      </div>

      <ScheduleGenerator />
    </div>
  )
}