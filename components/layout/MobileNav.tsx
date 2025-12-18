'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FileWarning, Bell, User } from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', icon: Home, label: 'หน้าแรก' },
    { href: '/search', icon: Search, label: 'ค้นหา' },
    { href: '/report/new', icon: FileWarning, label: 'รายงาน', isMain: true },
    { href: '#', icon: Bell, label: 'แจ้งเตือน' },
    { href: '/login', icon: User, label: 'บัญชี' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs mt-1 text-primary font-medium">
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
