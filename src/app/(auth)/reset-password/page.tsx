'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, CheckCircle } from "lucide-react"
import type { AuthChangeEvent } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure code runs only on the client where window is available
  useEffect(() => {
    setIsClient(true)
    // Supabase handles the session implicitly when the user lands on this page
    // via the password reset link. We listen for the PASSWORD_RECOVERY event
    // to confirm the user is in the correct state, although updateUser
    // should work regardless if the session is active.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
      if (event === "PASSWORD_RECOVERY") {
        // console.log("Password recovery state detected.");
        // You could potentially use the session here if needed,
        // but updateUser works based on the established session.
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth])


  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(`Failed to reset password: ${error.message}`)
    } else {
      setMessage('Password reset successfully! Redirecting to login...')
      // Clear fields
      setPassword('')
      setConfirmPassword('')
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
    setLoading(false)
  }

  // Avoid rendering the form server-side or before hydration
  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">设置新密码</CardTitle>
          <CardDescription>
            请输入您的新密码
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">新密码</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!message} // Disable if loading or success message shown
              />
               <p className="text-xs text-muted-foreground">密码至少需要6个字符。</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !!message}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>重置失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert variant="default">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>成功</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading || !!message}>
              {loading ? '重置中...' : '设置新密码'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex justify-center text-sm">
          {/* Optional: Add a link back to login if needed, though redirect happens on success */}
          {!message && (
             <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline dark:text-blue-400"
              disabled={loading}
            >
              返回登录
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
