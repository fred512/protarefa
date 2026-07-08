import { defineConfig } from '#q-app/wrappers'

export default defineConfig(() => {
  return {
    boot: ['auth'],

    css: ['app.css'],

    extras: [
      'roboto-font',
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },
      vueRouterMode: 'history'
    },

    devServer: {
      open: false,
      port: 3002
    },

    framework: {
      config: {
        dark: true,
        brand: {
          primary: '#7C6FFF',
          secondary: '#A3E635',
          accent: '#F472B6',
          dark: '#141824',
          'dark-page': '#0D0F14',
          positive: '#A3E635',
          negative: '#FF5C7A',
          info: '#5EC8F8',
          warning: '#FFB454'
        }
      },
      plugins: ['Notify', 'Dialog', 'Loading', 'LocalStorage']
    },

    animations: ['fadeIn', 'fadeOut'],

    sourceFiles: {
      pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
      pwaManifestFile: 'src-pwa/manifest.json'
    },

    pwa: {
      workboxMode: 'GenerateSW',
      manifestFilename: 'manifest.json'
    }
  }
})
