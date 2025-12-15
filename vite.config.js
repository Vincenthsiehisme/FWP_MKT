
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 讓前端程式碼中的 process.env.API_KEY 可以讀取到 Vercel 的環境變數
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // 避免其他 process.env 報錯
      'process.env': {}
    }
  }
})
