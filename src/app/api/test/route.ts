import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Test API endpoint hit!')
  return NextResponse.json({ message: 'Test endpoint working!' })
}