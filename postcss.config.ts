import type { Config } from 'postcss-load-config';

const config: Config = {
  plugins: {
    // 自动添加浏览器前缀
    autoprefixer: {
      overrideBrowserslist: [
        'Android 4.1',
        'iOS 7.1',
        'Chrome > 31',
        'ff > 31',
        'ie >= 8',
        'last 10 versions'
      ],
      grid: true
    },
    // px转rem插件配置
    'postcss-pxtorem': {
      rootValue: 16, // 根元素字体大小，通常为16px
      unitPrecision: 5, // 保留小数位数
      propList: ['*'], // 需要转换的属性，*表示所有属性
      selectorBlackList: [
        '.no-rem', // 忽略转换的选择器
        '.ant-', // 忽略Ant Design组件的样式
        '[data-theme]' // 忽略主题相关的样式
      ],
      replace: true, // 是否替换原来的值
      mediaQuery: false, // 是否在媒体查询中转换px
      minPixelValue: 2, // 最小转换像素值，小于此值不转换
      exclude: /node_modules/i // 排除node_modules文件夹
    }
  }
};

export default config;