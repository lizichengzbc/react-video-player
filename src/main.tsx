import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 确保DOM元素存在
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// 创建React根节点
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);