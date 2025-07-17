import React, { useState, useEffect } from 'react';
import { 
  ActualLoadTester,
  type LoadTestResult,
  type EnhancedLoadTestResult,
  type EnhancedLoadTestOptions
} from '../src';

interface TestCase {
  name: string;
  url: string;
  description: string;
  expectedIssues: string[];
}

const LoadTestingIssuesDemo: React.FC = () => {
  const [results, setResults] = useState<Map<string, {
    basic: LoadTestResult | null;
    enhanced: EnhancedLoadTestResult | null;
    error?: string;
  }>>(new Map());
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testStats, setTestStats] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // 测试用例 - 展示各种可能出现的问题
  const testCases: TestCase[] = [
    {
      name: '正常视频',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: '标准MP4视频，应该正常加载',
      expectedIssues: []
    },
    {
      name: '大文件视频',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_30mb.mp4',
      description: '大文件可能触发文件大小限制',
      expectedIssues: ['文件过大', '加载时间长']
    },
    {
      name: '不存在的视频',
      url: 'https://example.com/nonexistent-video.mp4',
      description: '404错误测试',
      expectedIssues: ['网络错误', '文件不存在']
    },
    {
      name: '跨域限制视频',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      description: '可能存在CORS问题',
      expectedIssues: ['跨域限制']
    },
    {
      name: '慢速服务器',
      url: 'https://httpbin.org/delay/10',
      description: '模拟慢速服务器，测试超时处理',
      expectedIssues: ['超时', '网络慢']
    },
    {
      name: '无效URL',
      url: 'invalid-url-format',
      description: '测试URL格式验证',
      expectedIssues: ['URL格式错误']
    }
  ];

  useEffect(() => {
    // 获取网络信息
    const connection = (navigator as any).connection;
    if (connection) {
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        saveData: connection.saveData,
        downlink: connection.downlink
      });
    }

    // 定期更新测试统计
    const interval = setInterval(() => {
      setTestStats(ActualLoadTester.getTestStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const runBasicTest = async (testCase: TestCase) => {
    try {
      const result = await ActualLoadTester.testLoad(testCase.url, {
        timeout: 5000
      });
      
      setResults(prev => {
        const newResults = new Map(prev);
        const existing = newResults.get(testCase.name) || { basic: null, enhanced: null };
        newResults.set(testCase.name, { ...existing, basic: result });
        return newResults;
      });
    } catch (error) {
      setResults(prev => {
        const newResults = new Map(prev);
        const existing = newResults.get(testCase.name) || { basic: null, enhanced: null };
        newResults.set(testCase.name, { 
          ...existing, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return newResults;
      });
    }
  };

  const runEnhancedTest = async (testCase: TestCase) => {
    try {
      const options: EnhancedLoadTestOptions = {
        timeout: 5000,
        maxRetries: 2,
        retryDelay: 1000,
        maxFileSize: 10 * 1024 * 1024, // 10MB限制
        enableSecurityCheck: true,
        trustedDomains: ['commondatastorage.googleapis.com', 'sample-videos.com']
      };
      
      const result = await ActualLoadTester.enhancedTestLoad(testCase.url, options);
      
      setResults(prev => {
        const newResults = new Map(prev);
        const existing = newResults.get(testCase.name) || { basic: null, enhanced: null };
        newResults.set(testCase.name, { ...existing, enhanced: result });
        return newResults;
      });
    } catch (error) {
      setResults(prev => {
        const newResults = new Map(prev);
        const existing = newResults.get(testCase.name) || { basic: null, enhanced: null };
        newResults.set(testCase.name, { 
          ...existing, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return newResults;
      });
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults(new Map());
    
    try {
      // 并发运行所有测试
      const promises = testCases.map(async (testCase) => {
        await Promise.all([
          runBasicTest(testCase),
          runEnhancedTest(testCase)
        ]);
      });
      
      await Promise.all(promises);
    } finally {
      setIsLoading(false);
    }
  };

  const runBatchTest = async () => {
    setIsLoading(true);
    
    try {
      const urls = testCases.map(tc => tc.url);
      
      // 基础批量测试
      const basicResults = await ActualLoadTester.testMultipleSources(urls);
      
      // 增强批量测试
      const enhancedResults = await ActualLoadTester.testMultipleSources(urls, {
        timeout: 3000,
        maxRetries: 1,
        enableSecurityCheck: true
      });
      
      // 更新结果
      testCases.forEach((testCase) => {
        const basicResult = basicResults.get(testCase.url);
        const enhancedResult = enhancedResults.get(testCase.url);
        
        setResults(prev => {
          const newResults = new Map(prev);
          newResults.set(testCase.name, {
            basic: basicResult || null,
            enhanced: enhancedResult || null
          });
          return newResults;
        });
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearQueue = () => {
    ActualLoadTester.clearQueue();
  };

  const formatResult = (result: LoadTestResult | EnhancedLoadTestResult | null) => {
    if (!result) return 'N/A';
    
    return {
      canLoad: result.canLoad ? '✅' : '❌',
      loadTime: `${result.loadTime.toFixed(0)}ms`,
      error: result.error || 'None',
      retryCount: 'retryCount' in result ? result.retryCount : 0,
      networkInfo: 'networkInfo' in result ? result.networkInfo : null,
      securityCheck: 'securityCheck' in result ? result.securityCheck : null
    };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>视频加载测试问题演示</h1>
      
      {/* 网络信息 */}
      {networkInfo && (
        <div style={{ 
          background: '#f0f8ff', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h3>当前网络状态</h3>
          <p>连接类型: {networkInfo.effectiveType || 'Unknown'}</p>
          <p>数据节省模式: {networkInfo.saveData ? '开启' : '关闭'}</p>
          <p>下行速度: {networkInfo.downlink || 'Unknown'} Mbps</p>
        </div>
      )}
      
      {/* 测试统计 */}
      {testStats && (
        <div style={{ 
          background: '#fff5ee', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h3>测试统计</h3>
          <p>活跃测试: {testStats.activeTests}</p>
          <p>队列中测试: {testStats.queuedTests}</p>
          <p>最大并发: {testStats.maxConcurrentTests}</p>
        </div>
      )}
      
      {/* 控制按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={isLoading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '测试中...' : '运行所有测试'}
        </button>
        
        <button 
          onClick={runBatchTest} 
          disabled={isLoading}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          批量测试
        </button>
        
        <button 
          onClick={clearQueue}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          清空队列
        </button>
      </div>
      
      {/* 测试用例列表 */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {testCases.map((testCase) => {
          const result = results.get(testCase.name);
          const basicFormatted = formatResult(result?.basic || null);
          const enhancedFormatted = formatResult(result?.enhanced || null);
          
          return (
            <div 
              key={testCase.name}
              style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: selectedTest === testCase.name ? '#f8f9fa' : 'white'
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {testCase.name}
              </h3>
              
              <p style={{ color: '#666', fontSize: '14px' }}>
                {testCase.description}
              </p>
              
              <p style={{ fontSize: '12px', color: '#888' }}>
                URL: {testCase.url}
              </p>
              
              {testCase.expectedIssues.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>预期问题:</strong>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {testCase.expectedIssues.map((issue, index) => (
                      <li key={index} style={{ fontSize: '12px', color: '#e74c3c' }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* 基础测试结果 */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>基础测试</h4>
                  {result?.basic ? (
                    <div style={{ fontSize: '12px' }}>
                      <p>结果: {basicFormatted.canLoad}</p>
                      <p>加载时间: {basicFormatted.loadTime}</p>
                      <p>错误: {basicFormatted.error}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#999' }}>未测试</p>
                  )}
                </div>
                
                {/* 增强测试结果 */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>增强测试</h4>
                  {result?.enhanced ? (
                    <div style={{ fontSize: '12px' }}>
                      <p>结果: {enhancedFormatted.canLoad}</p>
                      <p>加载时间: {enhancedFormatted.loadTime}</p>
                      <p>重试次数: {enhancedFormatted.retryCount}</p>
                      <p>错误: {enhancedFormatted.error}</p>
                      
                      {enhancedFormatted.securityCheck && (
                        <div style={{ marginTop: '5px' }}>
                          <p>安全检查: {enhancedFormatted.securityCheck.passed ? '✅' : '❌'}</p>
                          {enhancedFormatted.securityCheck.issues && 
                           enhancedFormatted.securityCheck.issues.length > 0 && (
                            <p style={{ color: '#e74c3c' }}>
                              问题: {enhancedFormatted.securityCheck.issues.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {enhancedFormatted.networkInfo && (
                        <div style={{ marginTop: '5px' }}>
                          <p>网络类型: {enhancedFormatted.networkInfo.effectiveType || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#999' }}>未测试</p>
                  )}
                </div>
              </div>
              
              {result?.error && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  错误: {result.error}
                </div>
              )}
              
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => runBasicTest(testCase)}
                  disabled={isLoading}
                  style={{ 
                    marginRight: '10px',
                    padding: '5px 10px',
                    fontSize: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  基础测试
                </button>
                
                <button 
                  onClick={() => runEnhancedTest(testCase)}
                  disabled={isLoading}
                  style={{ 
                    padding: '5px 10px',
                    fontSize: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  增强测试
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 使用说明 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>使用说明</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>基础测试</strong>: 使用原始的ActualLoadTester，可能遇到各种问题</li>
          <li><strong>增强测试</strong>: 使用ActualLoadTester的增强功能，包含重试、安全检查、队列管理等功能</li>
          <li><strong>批量测试</strong>: 同时测试多个视频源，展示并发控制</li>
          <li><strong>网络状态</strong>: 显示当前网络条件，影响测试策略</li>
          <li><strong>安全检查</strong>: 验证URL格式、文件大小、域名白名单等</li>
          <li><strong>重试机制</strong>: 网络不稳定时自动重试</li>
          <li><strong>队列管理</strong>: 限制并发测试数量，避免资源耗尽</li>
        </ul>
      </div>
    </div>
  );
};

export default LoadTestingIssuesDemo;