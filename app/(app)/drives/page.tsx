import type { Metadata } from 'next'
import { DrivesView } from '@/components/drives/drives-view'

export const metadata: Metadata = { title: 'Donation Drives · DonorRoute' }

export default function DrivesPage() {
  return <DrivesView />
}
