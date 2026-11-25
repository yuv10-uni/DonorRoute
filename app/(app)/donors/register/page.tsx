import type { Metadata } from 'next'
import { RegisterForm } from '@/components/donors/register-form'

export const metadata: Metadata = { title: 'Register Donor · DonorRoute' }

export default function RegisterPage() {
  return <RegisterForm />
}
