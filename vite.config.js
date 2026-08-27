import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const kmaAuthKey = env.VITE_KMA_AUTH_KEY || env.VITE_KMA_API_KEY || env.KMA_API_KEY || ''

  return {
    base: "/skala-vue-weather/",
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      proxy: {
        '/api/kma': {
          target: 'https://apihub.kma.go.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/kma/, '/api'),
        },
      },
    },
    // 기존 .env의 KMA_API_KEY도 개발 중에는 기상청 인증키로 인식한다.
    // 브라우저 요청에 포함되는 키이므로 실제 서비스에서는 서버 프록시를 권장한다.
    define: {
      'import.meta.env.VITE_KMA_AUTH_KEY': JSON.stringify(kmaAuthKey),
    },
    
  }
})
