import Link from 'next/link'
import { Shield } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">RentSafe</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              {SITE_CONFIG.description}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">ลิงก์</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  หน้าแรก
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="hover:text-primary transition-colors"
                >
                  ค้นหาร้าน
                </Link>
              </li>
              <li>
                <Link
                  href="/report/new"
                  className="hover:text-primary transition-colors"
                >
                  รายงานร้านโกง
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">ติดต่อ</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>LINE: {SITE_CONFIG.adminLineId}</li>
              <li>Email: {SITE_CONFIG.adminEmail}</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
