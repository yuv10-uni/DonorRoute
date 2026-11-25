import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { Hero } from '@/components/landing/hero'
import { CallToAction, Features, InventoryStrip, PlatformStats } from '@/components/landing/sections'

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link href="/inventory" className="hover:text-foreground">Inventory</Link>
            <Link href="/drives" className="hover:text-foreground">Drives</Link>
            <Link href="/assistant" className="hover:text-foreground">AI Assistant</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/requests" className={buttonVariants({ variant: 'ghost' })}>
              Request blood
            </Link>
            <Link href="/dashboard" className={buttonVariants()}>
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Hero />
        <PlatformStats />
        <Features />
        <InventoryStrip />
        <CallToAction />
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p>DonorRoute demo platform. In an emergency, call your local emergency number.</p>
        </div>
      </footer>
    </div>
  )
}
