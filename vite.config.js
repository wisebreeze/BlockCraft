import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to copy assets directory to dist on build
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    writeBundle() {
      const srcDir = path.resolve(__dirname, 'assets')
      const destDir = path.resolve(__dirname, 'dist', 'assets')

      if (!fs.existsSync(srcDir)) return

      // Create dest directory if not exists
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }

      // Copy all files and subdirectories
      function copyDir(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true })
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true })
            }
            copyDir(srcPath, destPath)
          } else {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }

      copyDir(srcDir, destDir)
    }
  }
}

export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173,
    open: false
  }
})
