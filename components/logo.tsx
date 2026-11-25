import Link from 'next/link'
import { Droplet } from 'lucide-react'

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Droplet className="size-4 fill-current" aria-hidden="true" />
      </span>
      <span className="text-lg">
        Donor<span className="text-primary">Route</span>
      </span>
    </Link>
  )
}
