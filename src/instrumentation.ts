export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 只在 Node.js 运行时执行，避免在 Edge Runtime 中运行
    const { initializeServices } = await import('./lib/services/serviceInitializer')
    initializeServices()
  }
}