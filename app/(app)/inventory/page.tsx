import type { Metadata } from 'next'
import { InventoryView } from '@/components/inventory/inventory-view'

export const metadata: Metadata = { title: 'Blood Inventory · DonorRoute' }

export default function InventoryPage() {
  return <InventoryView />
}
