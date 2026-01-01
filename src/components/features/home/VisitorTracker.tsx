'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VisitorTracker() {
    useEffect(() => {
        const trackVisitor = async () => {
            try {
                // Get today's date string (YYYY-MM-DD)
                // Use local time to ensure correct daily reset for the user
                const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
                const lastVisit = localStorage.getItem('rentsafe_last_visit')

                // If never visited or visited on a different day
                if (lastVisit !== today) {
                    const supabase = createClient()

                    // Call the increment function
                    const { error } = await supabase.rpc('increment_site_visitor')

                    if (!error) {
                        // Save today as the last visited date
                        localStorage.setItem('rentsafe_last_visit', today)
                    }
                }
            } catch (error) {
                console.error('Error tracking visitor:', error)
            }
        }

        trackVisitor()
    }, [])

    return null // This component doesn't render anything
}
