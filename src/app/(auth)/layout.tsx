'use client'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const [isloading, setLoading] = useState<boolean>(true)

    useEffect(
        () => {
            const checkAuth = async () => {
                // Check if the user is authenticated
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    redirect('/dashboard')
                }
                setLoading(false)
            }
            checkAuth()
        },
        []
    )

    if (isloading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">Loading...</div>
    }

    return <>{children}</>
}