'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Menu, LogOut, Home, Vault } from 'lucide-react'

export function Navbar() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClient()

  // 不显示导航栏的页面
  const hideNavbarRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  if (hideNavbarRoutes.some(route => pathname.startsWith(route))) {
    return null
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const closeMenu = () => setIsMenuOpen(false)

  if (loading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-4">
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-14 items-center px-6">
        {/* 桌面端 logo */}
        <div className="mr-6 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Habitly
            </span>
          </Link>
        </div>

        {/* 移动端 logo */}
        <div className="flex-1 md:hidden">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Habitly
            </span>
          </Link>
        </div>

        {/* 桌面端导航菜单 */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/vault" 
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  小金库
                </Link>
                <Button variant="ghost" onClick={handleLogout}>
                  退出登录
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  登录
                </Link>
                <Button asChild>
                  <Link href="/register">注册</Link>
                </Button>
              </>
            )}
          </nav>

          {/* 移动端汉堡菜单 */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      onClick={closeMenu}
                      className="flex items-center space-x-2 text-lg hover:text-primary transition-colors"
                    >
                      <Home className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      href="/vault" 
                      onClick={closeMenu}
                      className="flex items-center space-x-2 text-lg hover:text-primary transition-colors"
                    >
                      <Vault className="h-5 w-5" />
                      <span>小金库</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-lg hover:text-primary transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>退出登录</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      onClick={closeMenu}
                      className="text-lg hover:text-primary transition-colors"
                    >
                      登录
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={closeMenu}
                      className="text-lg hover:text-primary transition-colors"
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}