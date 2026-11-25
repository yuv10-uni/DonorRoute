import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DonorDirectory } from '@/components/donors/donor-directory'

export const metadata: Metadata = { title: 'Donor Directory · DonorRoute' }

export default function DonorsPage() {
  return (
    <Suspense>
      <DonorDirectory />
    </Suspense>
  )
}
