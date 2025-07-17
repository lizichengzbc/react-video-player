import React, { useState, useRef, useEffect } from 'react';
import { EngineFactory, EngineSelectionOptions, EngineSelectionResult } from '../src/engines/EngineFactory';
import { BaseEngine, EnhancedDetectionResult } from '../src/engines/base/BaseEngine';
import { engineDetectionCache } from '../src/utils/EngineDetectionCache';
import { MimeTypeDetector } from '../src/utils/MimeTypeDetector';
import { ActualLoadTester } from '../src/utils/ActualLoadTester';

/**
 * 增强检测功能示例组件
 * 展示如何使用新的视频引擎检测功能
 */
const EnhancedDetectionExample: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [engine, setEngine] = useState<BaseEngine | null>(null);
  const [detectionResult, setDetectionResult] = useState<EnhancedDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // 示例视频源
  const exampleSources = [
    {
      name: 'MP4 视频',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      name: 'HLS 流',
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8'
    },
    {
      name: 'DASH 流',
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.mpd'
    },
    {
      name: 'YouTube 视频',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      name: 'Vimeo 视频',
      url: 'https://vimeo.com/148751763'
    }
  ];

  // 更新缓存统计
  const updateCacheStats = () => {
    setCacheStats(engineDetectionCache.getStats());
  };

  // 基础检测
  const performBasicDetection = async () => {
    if (!videoRef.current || !videoSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      // 使用传统方法
      const basicEngine = EngineFactory.createEngine(videoSrc, videoRef.current);
      
      // MIME类型检测
      const mimeTypeInfo = await MimeTypeDetector.detect(videoSrc);
      
      setTestResults(prev => [...prev, {
        type: '基础检测',
        engineType: basicEngine.getEngineType(),
        canPlay: basicEngine.canPlayType(videoSrc),
        mimeType: mimeTypeInfo?.mimeType || 'Unknown',
        confidence: 'medium',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '基础检测失败');
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // 增强检测（不含加载测试）
  const performEnhancedDetection = async () => {
    if (!videoRef.current || !videoSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      const options: EngineSelectionOptions = {
        useCache: true,
        performLoadTest: false
      };
      
      const result: EngineSelectionResult = await EngineFactory.selectEngine(
        videoSrc, 
        videoRef.current, 
        options
      );
      
      setEngine(result.engine);
      setDetectionResult(result.detectionResult);
      
      setTestResults(prev => [...prev, {
        type: '增强检测',
        engineType: result.engineType,
        canPlay: result.detectionResult.canPlay,
        confidence: result.detectionResult.confidence,
        reason: result.detectionResult.reason,
        mimeType: result.detectionResult.mimeTypeInfo?.mimeType || 'Unknown',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '增强检测失败');
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // 完整检测（含加载测试）
  const performFullDetection = async () => {
    if (!videoRef.current || !videoSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      const options: EngineSelectionOptions = {
        useCache: true,
        performLoadTest: true,
        loadTestOptions: {
          timeout: 5000,
          preload: 'metadata'
        }
      };
      
      const result: EngineSelectionResult = await EngineFactory.selectEngine(
        videoSrc, 
        videoRef.current, 
        options
      );
      
      setEngine(result.engine);
      setDetectionResult(result.detectionResult);
      
      setTestResults(prev => [...prev, {
        type: '完整检测',
        engineType: result.engineType,
        canPlay: result.detectionResult.canPlay,
        confidence: result.detectionResult.confidence,
        reason: result.detectionResult.reason,
        mimeType: result.detectionResult.mimeTypeInfo?.mimeType || 'Unknown',
        loadTime: result.detectionResult.loadTestResult?.loadTime,
        loadError: result.detectionResult.loadTestResult?.error,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '完整检测失败');
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // 快速检测
  const performQuickDetection = async () => {
    if (!videoRef.current || !videoSrc) return;

    setLoading(true);
    setError(null);
    
    try {
      const quickEngine = await EngineFactory.quickSelectEngine(videoSrc, videoRef.current);
      
      setTestResults(prev => [...prev, {
        type: '快速检测',
        engineType: quickEngine.getEngineType(),
        canPlay: true,
        confidence: 'medium',
        reason: 'Quick detection',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '快速检测失败');
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // 批量测试
  const performBatchTest = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);
    
    try {
      for (const source of exampleSources) {
        if (!videoRef.current) continue;
        
        const result = await EngineFactory.selectEngine(
          source.url, 
          videoRef.current, 
          { useCache: true, performLoadTest: false }
        );
        
        setTestResults(prev => [...prev, {
          type: '批量测试',
          sourceName: source.name,
          url: source.url,
          engineType: result.engineType,
          canPlay: result.detectionResult.canPlay,
          confidence: result.detectionResult.confidence,
          reason: result.detectionResult.reason,
          mimeType: result.detectionResult.mimeTypeInfo?.mimeType || 'Unknown',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量测试失败');
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  // 清理缓存
  const clearCache = () => {
    engineDetectionCache.clear();
    updateCacheStats();
    setTestResults([]);
  };

  // 加载视频
  const loadVideo = async () => {
    if (!engine || !videoSrc) return;
    
    try {
      await engine.load(videoSrc);
    } catch (err) {
      setError(err instanceof Error ? err.message : '视频加载失败');
    }
  };

  useEffect(() => {
    updateCacheStats();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>增强检测功能示例</h1>
      
      {/* 视频源输入 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>视频源设置</h3>
        <input
          type="text"
          value={videoSrc}
          onChange={(e) => setVideoSrc(e.target.value)}
          placeholder="输入视频URL"
          style={{ width: '400px', padding: '8px', marginRight: '10px' }}
        />
        <select 
          onChange={(e) => setVideoSrc(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">选择示例视频</option>
          {exampleSources.map((source, index) => (
            <option key={index} value={source.url}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      {/* 检测按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>检测方法</h3>
        <button 
          onClick={performBasicDetection} 
          disabled={loading || !videoSrc}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          基础检测
        </button>
        <button 
          onClick={performEnhancedDetection} 
          disabled={loading || !videoSrc}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          增强检测
        </button>
        <button 
          onClick={performFullDetection} 
          disabled={loading || !videoSrc}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          完整检测（含加载测试）
        </button>
        <button 
          onClick={performQuickDetection} 
          disabled={loading || !videoSrc}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          快速检测
        </button>
        <button 
          onClick={performBatchTest} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          批量测试
        </button>
      </div>

      {/* 缓存管理 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>缓存管理</h3>
        <button 
          onClick={clearCache}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          清理缓存
        </button>
        {cacheStats && (
          <span>
            缓存条目: {cacheStats.size}/{cacheStats.maxSize}, 
            TTL: {Math.round(cacheStats.ttl / 1000)}秒
          </span>
        )}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
          检测中...
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', marginBottom: '20px' }}>
          错误: {error}
        </div>
      )}

      {/* 当前检测结果 */}
      {detectionResult && (
        <div style={{ marginBottom: '20px' }}>
          <h3>当前检测结果</h3>
          <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p><strong>引擎类型:</strong> {detectionResult.engineType}</p>
            <p><strong>可播放:</strong> {detectionResult.canPlay ? '是' : '否'}</p>
            <p><strong>置信度:</strong> {detectionResult.confidence}</p>
            <p><strong>原因:</strong> {detectionResult.reason}</p>
            {detectionResult.mimeTypeInfo && (
              <p><strong>MIME类型:</strong> {detectionResult.mimeTypeInfo.mimeType}</p>
            )}
            {detectionResult.loadTestResult && (
              <div>
                <p><strong>加载测试:</strong></p>
                <ul>
                  <li>加载时间: {Math.round(detectionResult.loadTestResult.loadTime)}ms</li>
                  <li>网络状态: {detectionResult.loadTestResult.networkState}</li>
                  <li>就绪状态: {detectionResult.loadTestResult.readyState}</li>
                  {detectionResult.loadTestResult.error && (
                    <li>错误: {detectionResult.loadTestResult.error}</li>
                  )}
                </ul>
              </div>
            )}
            {engine && (
              <button 
                onClick={loadVideo}
                style={{ marginTop: '10px', padding: '8px 16px' }}
              >
                加载视频
              </button>
            )}
          </div>
        </div>
      )}

      {/* 测试结果历史 */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>测试结果历史</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>时间</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>类型</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>源名称</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>引擎</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>可播放</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>置信度</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>MIME类型</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>加载时间</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>原因</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.timestamp}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.type}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.sourceName || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.engineType}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <span style={{ color: result.canPlay ? 'green' : 'red' }}>
                        {result.canPlay ? '是' : '否'}
                      </span>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <span style={{ 
                        color: result.confidence === 'high' ? 'green' : 
                               result.confidence === 'medium' ? 'orange' : 'red' 
                      }}>
                        {result.confidence}
                      </span>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.mimeType}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {result.loadTime ? `${Math.round(result.loadTime)}ms` : '-'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 隐藏的视频元素 */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }}
        controls
      />
    </div>
  );
};

export default EnhancedDetectionExample;