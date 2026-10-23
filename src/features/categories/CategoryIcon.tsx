import { Anvil, Apple, Beef, BrickWall, Cable, FlaskConical, Milk, Mountain, Package, Sprout, Tractor, TreePine, type LucideIcon } from 'lucide-react'

/** Icon names referenced by CategoryConfig.icon. Register a new icon here when adding a category. */
const ICONS: Record<string, LucideIcon> = { Apple, Milk, Beef, Anvil, Cable, BrickWall, Mountain, TreePine, FlaskConical, Tractor, Sprout }

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package
  return <Icon className={className} aria-hidden />
}
