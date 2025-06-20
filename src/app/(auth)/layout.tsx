'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                // console.log(user)
                if (user) {
                    // 用户已登录，重定向到 dashboard
                    router.push('/dashboard')
                    return
                }
            } catch (error) {
                console.error('Auth check error:', error)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [router, supabase.auth])

    // 如果正在检查认证状态，显示加载状态
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">检查登录状态...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}