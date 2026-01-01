'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SaveShopButtonProps {
    shopId: string
    className?: string
    variant?: 'default' | 'icon'
}

export default function SaveShopButton({ shopId, className, variant = 'default' }: SaveShopButtonProps) {
    const router = useRouter()
    const [isSaved, setIsSaved] = useState(false)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        checkSaveStatus()
    }, [shopId])

    async function checkSaveStatus() {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            setUserId(user.id)

            const { data } = await supabase
                .from('saved_shops')
                .select('id')
                .eq('user_id', user.id)
                .eq('shop_id', shopId)
                .single()

            setIsSaved(!!data)
        } catch (err) {
            console.error('Error checking save status:', err)
        } finally {
            setLoading(false)
        }
    }

    async function toggleSave() {
        if (!userId) {
            // Redirect to login
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()

            if (isSaved) {
                // Remove from saved
                await supabase
                    .from('saved_shops')
                    .delete()
                    .eq('user_id', userId)
                    .eq('shop_id', shopId)

                setIsSaved(false)
            } else {
                // Add to saved
                await supabase
                    .from('saved_shops')
                    .insert({
                        user_id: userId,
                        shop_id: shopId
                    })

                setIsSaved(true)
            }
        } catch (err) {
            console.error('Error toggling save:', err)
        } finally {
            setLoading(false)
        }
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleSave}
                disabled={loading}
                className={`p-2 rounded-full transition-colors ${
                    isSaved
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                } disabled:opacity-50 ${className}`}
                title={isSaved ? 'ยกเลิกบันทึก' : 'บันทึกร้านนี้'}
            >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
        )
    }

    return (
        <Button
            onClick={toggleSave}
            disabled={loading}
            variant={isSaved ? 'default' : 'outline'}
            className={`${isSaved ? 'bg-blue-600 hover:bg-blue-700' : ''} ${className}`}
        >
            <Bookmark className={`w-4 h-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'บันทึกแล้ว' : 'บันทึกร้าน'}
        </Button>
    )
}
