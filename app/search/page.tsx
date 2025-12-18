export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { SearchBar } from '@/components/search/SearchBar'
import { ReportCard } from '@/components/reports/ReportCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type { ScamReport } from '@/types'
import { FileWarning, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

async function searchReports(
  query: string,
  status: string,
  page: number
): Promise<{ reports: ScamReport[]; count: number }> {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('scam_reports')
    .select('*', { count: 'exact' })

  // Status filter
  if (status === 'verified') {
    queryBuilder = queryBuilder.eq('status', 'verified')
  } else if (status === 'pending') {
    queryBuilder = queryBuilder.eq('status', 'pending')
  } else {
    queryBuilder = queryBuilder.in('status', ['pending', 'verified'])
  }

  // Search query
  if (query) {
    queryBuilder = queryBuilder.or(
      `shop_name.ilike.%${query}%,phone.ilike.%${query}%,facebook_page_name.ilike.%${query}%,line_id.ilike.%${query}%,bank_account_number.ilike.%${query}%,bank_account_name.ilike.%${query}%,province.ilike.%${query}%`
    )
  }

  // Pagination
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  queryBuilder = queryBuilder
    .order('verified_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, count } = await queryBuilder

  return { reports: data || [], count: count || 0 }
}

async function SearchResults({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string }
}) {
  const query = searchParams.q || ''
  const status = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1')

  const { reports, count } = await searchReports(query, status, page)
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)

  const statusFilters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'verified', label: 'ยืนยันแล้ว' },
    { value: 'pending', label: 'รอตรวจสอบ' },
  ]

  return (
    <>
      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/search?q=${query}&status=${filter.value}`}
          >
            <Badge
              variant={status === filter.value ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {filter.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-6">
        พบ {count} รายการ
        {query && ` สำหรับ "${query}"`}
      </p>

      {/* Results Grid */}
      {reports.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link
                    href={`/search?q=${query}&status=${status}&page=${page - 1}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <span className="text-sm">
                หน้า {page} จาก {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link
                    href={`/search?q=${query}&status=${status}&page=${page + 1}`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileWarning className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">ไม่พบรายงาน</p>
          <p className="text-sm">ลองค้นหาด้วยคำอื่นหรือตรวจสอบตัวสะกด</p>
        </div>
      )}
    </>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="container py-8">
          {/* Search Header */}
          <div className="max-w-2xl mx-auto mb-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              ค้นหารายงานร้านโกง
            </h1>
            <SearchBar defaultValue={params.q} />
          </div>

          {/* Results */}
          <Suspense
            fallback={
              <div className="text-center py-12">
                <div className="animate-pulse">กำลังโหลด...</div>
              </div>
            }
          >
            <SearchResults searchParams={params} />
          </Suspense>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
