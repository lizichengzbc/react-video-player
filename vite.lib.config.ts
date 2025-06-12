import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*', 'src/main.tsx', 'src/App.tsx']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactVideoPlayer',
      formats: ['es', 'umd'],
      fileName: (format) => `react-video-player.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [
        'react',
        'react-dom',
        'antd',
        '@ant-design/icons',
        'hls.js',
        'dashjs',
        '@vimeo/player'
      ],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'antd': 'antd',
          '@ant-design/icons': 'AntdIcons',
          'hls.js': 'Hls',
          'dashjs': 'dashjs',
          '@vimeo/player': 'VimeoPlayer'
        }
      }
    },
    sourcemap: true,
    // 清空输出目录
    emptyOutDir: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    exclude: ['react', 'react-dom']
  }
});