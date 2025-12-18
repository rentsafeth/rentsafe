'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  onSearch?: (query: string) => void
}

export function SearchBar({
  defaultValue = '',
  placeholder = 'ค้นหาชื่อร้าน, เบอร์โทร, Facebook, LINE...',
  size = 'md',
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleClear = () => {
    setQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  const sizeClasses = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14 text-lg',
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${
            size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          }`}
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`${sizeClasses[size]} pl-12 pr-24 rounded-full border-2 focus:border-primary`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <Button
          type="submit"
          size={size === 'lg' ? 'lg' : 'default'}
          className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full ${
            size === 'lg' ? 'px-6' : 'px-4'
          }`}
        >
          ค้นหา
        </Button>
      </div>
    </form>
  )
}
