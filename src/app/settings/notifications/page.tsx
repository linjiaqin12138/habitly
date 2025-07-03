'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ExternalLink, TestTube, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NotificationSettings {
  id: string
  pushplusToken: string | null
  pushplusEnabled: boolean
  tokenStatus: 'valid' | 'invalid' | 'expired'
  createdAt: string
  updatedAt: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [formData, setFormData] = useState({
    pushplusToken: '',
    pushplusEnabled: false
  })
  const [tokenError, setTokenError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setFormData({
          pushplusToken: data.settings.pushplusToken || '',
          pushplusEnabled: data.settings.pushplusEnabled
        })
      }
    } catch (error) {
      console.error('加载通知设置失败:', error)
      toast.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setTokenError(null)

      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushplusToken: formData.pushplusToken || null,
          pushplusEnabled: formData.pushplusEnabled
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        toast.success('通知设置保存成功')
      } else {
        const error = await response.json()
        if (error.message?.includes('Token无效')) {
          setTokenError('PushPlus Token无效，请检查Token是否正确')
        } else {
          toast.error(error.message || '保存失败')
        }
      }
    } catch (error) {
      console.error('保存通知设置失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!user || !formData.pushplusToken) {
      toast.error('请先输入PushPlus Token')
      return
    }

    try {
      setTesting(true)
      
      // 发送测试通知
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushplusToken: formData.pushplusToken
        })
      })

      if (response.ok) {
        toast.success('测试通知已发送，请检查您的PushPlus')
      } else {
        const error = await response.json()
        toast.error(error.message || '测试发送失败')
      }
    } catch (error) {
      console.error('发送测试通知失败:', error)
      toast.error('测试发送失败')
    } finally {
      setTesting(false)
    }
  }

  const getTokenStatusBadge = () => {
    if (!settings?.pushplusToken) {
      return <Badge variant="secondary">未设置</Badge>
    }
    
    switch (settings.tokenStatus) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500">有效</Badge>
      case 'invalid':
        return <Badge variant="destructive">无效</Badge>
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const maskToken = (token: string) => {
    if (!token || token.length < 4) return token
    return token.substring(0, 4) + '****'
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">通知设置</h1>
          <p className="text-muted-foreground mt-2">
            配置您希望接收的通知方式和相关参数
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              PushPlus 通知
              {getTokenStatusBadge()}
            </CardTitle>
            <CardDescription>
              通过PushPlus平台接收微信推送通知
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="pushplus-enabled"
                checked={formData.pushplusEnabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, pushplusEnabled: checked }))
                }
              />
              <Label htmlFor="pushplus-enabled">启用PushPlus通知</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pushplus-token">PushPlus Token</Label>
              <div className="flex space-x-2">
                <Input
                  id="pushplus-token"
                  type="text"
                  placeholder="请输入您的PushPlus Token"
                  value={formData.pushplusToken}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, pushplusToken: e.target.value }))
                    setTokenError(null)
                  }}
                  className={tokenError ? 'border-red-500' : ''}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTest}
                  disabled={testing || !formData.pushplusToken}
                  title="发送测试通知"
                >
                  <TestTube className="h-4 w-4" />
                </Button>
              </div>
              {tokenError && (
                <p className="text-sm text-red-500">{tokenError}</p>
              )}
              {settings?.pushplusToken && (
                <p className="text-sm text-muted-foreground">
                  当前Token: {maskToken(settings.pushplusToken)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <a
                href="https://www.pushplus.plus/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                申请PushPlus Token
              </a>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-muted-foreground">其他通知方式</CardTitle>
            <CardDescription>
              以下通知方式正在开发中，敬请期待
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center space-x-2">
                <Switch disabled />
                <Label className="text-muted-foreground">邮件通知（即将上线）</Label>
              </div>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center space-x-2">
                <Switch disabled />
                <Label className="text-muted-foreground">短信通知（即将上线）</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong> 当前版本仅支持PushPlus推送，其他通知方式正在开发中。
            启用通知后，您将在打卡获得奖励时收到推送消息。
          </p>
        </div>
      </div>
    </div>
  )
}