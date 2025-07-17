/**
 * 发布前的 package.json 检查脚本
 * 确保所有必要的字段都已正确配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkPackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json 文件不存在');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const errors = [];
  const warnings = [];

  // 必需字段检查
  const requiredFields = [
    'name',
    'version', 
    'description',
    'main',
    'module',
    'types',
    'author',
    'license',
    'repository',
    'keywords'
  ];

  requiredFields.forEach(field => {
    if (!packageJson[field]) {
      errors.push(`缺少必需字段: ${field}`);
    }
  });

  // 版本格式检查
  if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
    errors.push('版本号格式不正确，应该遵循语义化版本规范 (x.y.z)');
  }

  // 入口文件检查
  const entryFiles = [
    packageJson.main,
    packageJson.module,
    packageJson.types
  ];

  entryFiles.forEach((file, index) => {
    const fieldNames = ['main', 'module', 'types'];
    if (file && !fs.existsSync(path.join(__dirname, '..', file))) {
      errors.push(`${fieldNames[index]} 字段指向的文件不存在: ${file}`);
    }
  });

  // exports 字段检查
  if (packageJson.exports) {
    const exports = packageJson.exports['.'];
    if (exports) {
      if (exports.import && !fs.existsSync(path.join(__dirname, '..', exports.import))) {
        errors.push(`exports.import 指向的文件不存在: ${exports.import}`);
      }
      if (exports.require && !fs.existsSync(path.join(__dirname, '..', exports.require))) {
        errors.push(`exports.require 指向的文件不存在: ${exports.require}`);
      }
      if (exports.types && !fs.existsSync(path.join(__dirname, '..', exports.types))) {
        errors.push(`exports.types 指向的文件不存在: ${exports.types}`);
      }
    }
  }

  // files 字段检查
  if (packageJson.files) {
    packageJson.files.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        warnings.push(`files 字段中的路径不存在: ${file}`);
      }
    });
  }

  // 脚本检查
  const recommendedScripts = [
    'build',
    'test',
    'lint',
    'prepublishOnly'
  ];

  recommendedScripts.forEach(script => {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      warnings.push(`建议添加 ${script} 脚本`);
    }
  });

  // 依赖检查
  if (packageJson.dependencies) {
    const peerDeps = packageJson.peerDependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    // 检查是否有应该作为 peerDependencies 的包
    const shouldBePeer = ['react', 'react-dom'];
    shouldBePeer.forEach(dep => {
      if (packageJson.dependencies[dep] && !peerDeps[dep]) {
        warnings.push(`${dep} 应该移到 peerDependencies 中`);
      }
    });
  }

  // 关键词检查
  if (packageJson.keywords && packageJson.keywords.length < 3) {
    warnings.push('建议添加更多关键词以提高包的可发现性');
  }

  // 输出结果
  console.log('\n📦 Package.json 检查结果\n');
  
  if (errors.length === 0) {
    console.log('✅ 所有必需字段检查通过');
  } else {
    console.log('❌ 发现错误:');
    errors.forEach(error => console.log(`   • ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  警告:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  console.log('\n📋 包信息摘要:');
  console.log(`   名称: ${packageJson.name}`);
  console.log(`   版本: ${packageJson.version}`);
  console.log(`   描述: ${packageJson.description}`);
  console.log(`   作者: ${packageJson.author}`);
  console.log(`   许可证: ${packageJson.license}`);
  
  if (packageJson.keywords) {
    console.log(`   关键词: ${packageJson.keywords.join(', ')}`);
  }

  console.log('\n🔗 入口文件:');
  console.log(`   主入口 (main): ${packageJson.main}`);
  console.log(`   ES模块 (module): ${packageJson.module}`);
  console.log(`   类型定义 (types): ${packageJson.types}`);

  if (errors.length > 0) {
    console.log('\n❌ 请修复上述错误后再发布');
    process.exit(1);
  } else {
    console.log('\n✅ 包配置检查完成，可以发布');
  }
}

// 直接运行检查函数
checkPackageJson();

export default checkPackageJson;