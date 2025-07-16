# PostCSS配置说明

本项目已配置PostCSS自动将px单位转换为rem单位，以实现更好的响应式设计。

## 📋 配置文件

### postcss.config.ts

项目使用TypeScript配置文件 `postcss.config.ts`，包含以下插件：

1. **autoprefixer**: 自动添加浏览器前缀
2. **postcss-pxtorem**: 将px转换为rem单位

## ⚙️ 转换规则

### 基本配置

```typescript
'postcss-pxtorem': {
  rootValue: 16,        // 根元素字体大小，1rem = 16px
  unitPrecision: 5,     // 保留5位小数
  propList: ['*'],      // 转换所有属性
  minPixelValue: 2,     // 小于2px的值不转换
  replace: true,        // 替换原始值
  mediaQuery: false,    // 不在媒体查询中转换
  exclude: /node_modules/i // 排除node_modules
}
```

### 转换示例

| 原始值 | 转换后 | 说明 |
|--------|--------|------|
| `16px` | `1rem` | 基准值 |
| `24px` | `1.5rem` | 24 ÷ 16 = 1.5 |
| `32px` | `2rem` | 32 ÷ 16 = 2 |
| `8px` | `0.5rem` | 8 ÷ 16 = 0.5 |
| `1px` | `1px` | 小于minPixelValue，不转换 |

## 🚫 排除转换

### 1. 使用类名排除

```css
/* 不会转换px */
.no-rem {
  font-size: 16px; /* 保持16px */
  padding: 10px;   /* 保持10px */
}
```

### 2. 排除Ant Design组件

配置中已排除以`.ant-`开头的选择器，确保Ant Design组件样式不受影响。

### 3. 排除主题相关样式

配置中已排除`[data-theme]`选择器，保护主题切换功能。

## 📱 响应式设计优势

使用rem单位的优势：

1. **可缩放性**: 用户调整浏览器字体大小时，整个页面会按比例缩放
2. **一致性**: 所有元素基于根元素字体大小，保持视觉比例
3. **可访问性**: 更好地支持视觉障碍用户的需求
4. **响应式**: 配合媒体查询实现更灵活的响应式设计

## 🎯 最佳实践

### 1. 设计稿转换

如果设计稿基于不同的基准值（如750px宽度），可以调整`rootValue`：

```typescript
// 750px设计稿，根元素为75px
rootValue: 75
```

### 2. 混合使用

某些场景下可以混合使用不同单位：

```css
.component {
  width: 100%;        /* 百分比：流式布局 */
  max-width: 1200px;  /* px -> rem：最大宽度限制 */
  padding: 16px;      /* px -> rem：内边距 */
  border: 1px solid;  /* 1px保持不变：细边框 */
}
```

### 3. 媒体查询

```css
/* 建议在媒体查询中使用em单位 */
@media (max-width: 48em) { /* 768px ÷ 16 = 48em */
  .component {
    padding: 12px; /* 转换为rem */
  }
}
```

## 🔧 调试技巧

### 1. 查看转换结果

在浏览器开发者工具中查看计算后的样式，确认转换是否正确。

### 2. 临时禁用转换

在样式中添加`/* no */`注释可以临时禁用转换：

```css
.temp-fix {
  font-size: 16px; /* no */
}
```

### 3. 验证配置

运行构建命令查看生成的CSS文件，确认转换效果：

```bash
npm run build
```

## 📚 相关资源

- [PostCSS官方文档](https://postcss.org/)
- [postcss-pxtorem插件](https://github.com/cuth/postcss-pxtorem)
- [CSS rem单位详解](https://developer.mozilla.org/zh-CN/docs/Web/CSS/length#rem)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)

## ⚠️ 注意事项

1. **第三方组件**: 确保第三方组件库的样式不被意外转换
2. **像素完美**: 对于需要像素级精确的场景，考虑使用排除规则
3. **性能影响**: PostCSS处理会增加构建时间，但对运行时性能无影响
4. **浏览器兼容**: rem单位在IE9+支持良好
5. **根字体大小**: 确保HTML根元素字体大小设置正确

```css
/* 确保根元素字体大小 */
html {
  font-size: 16px; /* 与rootValue保持一致 */
}
```