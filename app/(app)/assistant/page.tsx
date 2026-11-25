import type { Metadata } from 'next'
import { AssistantChat } from '@/components/assistant/assistant-chat'

export const metadata: Metadata = { title: 'AI Assistant · DonorRoute' }

export default function AssistantPage() {
  return <AssistantChat />
}
