import React, { useRef, useEffect, useState } from "react";
import { EngineFactory } from "../src/engines/EngineFactory";
import { BaseEngine } from "../src/engines/base/BaseEngine";
import VideoPlayer from "@/index";

/**
 * 简化的引擎选择示例
 * 用于快速检测视频播放功能是否正常
 */
const ImprovedEngineSelection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [engine, setEngine] = useState<BaseEngine | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("请输入视频URL或选择测试视频");
  const [isLoading, setIsLoading] = useState(false);

  // 测试视频列表 - 包含不同格式和检测场景
  const testVideos = [
    {
      name: "MP4测试视频",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "MP4",
      description: "标准MP4格式，有明确扩展名",
    },
    {
      name: "HLS流媒体",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      type: "HLS",
      description: "HLS流媒体，有.m3u8扩展名",
    },
    {
      name: "YouTube视频",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "YouTube",
      description: "特殊平台，通过URL模式识别",
    },
    {
      name: "无扩展名视频1",
      url: "https://playertest.longtailvideo.com/adaptive/bipbop/gear4/prog_index",
      type: "未知格式",
      description: "无文件扩展名，需HTTP头检测",
    },
    {
      name: "无扩展名视频2",
      url: "https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master",
      type: "流媒体",
      description: "复杂URL结构，无明确扩展名",
    },
    {
      name: "带参数的视频",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4?t=30&autoplay=1",
      type: "MP4",
      description: "MP4格式但带查询参数",
    },
  ];

  /**
   * 加载视频 - 自动选择最佳引擎
   */
  const loadVideo = async (url: string) => {
    if (!videoRef.current || !url.trim()) {
      setStatus("请输入有效的视频URL");
      return;
    }

    setIsLoading(true);
    setStatus("正在检测视频格式并加载引擎...");
    setCurrentUrl(url);

    try {
      // 清理之前的引擎
      if (engine) {
        engine.destroy();
        setEngine(null);
      }

      // 尝试异步检测（更准确）
      let selectedEngine: BaseEngine;
      try {
        selectedEngine = await EngineFactory.createEngineAsync(
          url,
          videoRef.current,
          {
            useCache: true,
            enableHeaderDetection: true,
            timeout: 3000,
          }
        );
        setStatus(`✅ 成功加载 - 引擎类型: ${selectedEngine.getEngineType()}`);
      } catch (asyncError) {
        // 异步失败时回退到同步检测
        console.warn("异步检测失败，回退到同步检测:", asyncError);
        selectedEngine = EngineFactory.createEngine(url, videoRef.current);
        setStatus(
          `✅ 成功加载 - 引擎类型: ${selectedEngine.getEngineType()} (同步检测)`
        );
      }

      setEngine(selectedEngine);

      // 尝试播放视频以验证功能
      try {
        await videoRef.current.load();
        setStatus((prev) => prev + " - 视频已准备就绪");
      } catch (playError) {
        console.warn("视频加载警告:", playError);
        setStatus(
          (prev) => prev + " - 引擎已加载，但视频可能需要用户交互才能播放"
        );
      }
    } catch (error) {
      console.error("视频加载失败:", error);
      setStatus(
        `❌ 加载失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理URL输入变化
   */
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(event.target.value);
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadVideo(currentUrl);
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, [engine]);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>
        视频播放功能检测
      </h2>

      {/* 视频播放器 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <VideoPlayer
          src={testVideos[5].url}
          controls
          width={500}
          height={500}
        />
      </div>

      {/* URL输入区域 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#333" }}>输入视频URL</h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <input
            type="url"
            value={currentUrl}
            onChange={handleUrlChange}
            placeholder="请输入视频URL（支持MP4、HLS、YouTube等）"
            style={{
              flex: "1",
              minWidth: "300px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !currentUrl.trim()}
            style={{
              padding: "10px 20px",
              backgroundColor: isLoading ? "#ccc" : "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {isLoading ? "加载中..." : "加载视频"}
          </button>
        </form>
      </div>

      {/* 快速测试按钮 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#333" }}>快速测试</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "15px",
          }}
        >
          {testVideos.map((video, index) => (
            <div
              key={index}
              style={{
                padding: "15px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "#333",
                  marginBottom: "5px",
                }}
              >
                {video.name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "8px",
                  lineHeight: "1.4",
                }}
              >
                {video.description}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#999",
                  marginBottom: "10px",
                  wordBreak: "break-all",
                  backgroundColor: "#f0f0f0",
                  padding: "4px 6px",
                  borderRadius: "3px",
                }}
              >
                {video.url.length > 60
                  ? video.url.substring(0, 60) + "..."
                  : video.url}
              </div>
              <button
                onClick={() => loadVideo(video.url)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: isLoading ? "#ccc" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                测试 ({video.type})
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 状态显示 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#333" }}>状态信息</h3>
        <div
          style={{
            padding: "15px",
            backgroundColor: status.includes("✅")
              ? "#e8f5e8"
              : status.includes("❌")
                ? "#ffebee"
                : "#f5f5f5",
            border: `1px solid ${status.includes("✅") ? "#4caf50" : status.includes("❌") ? "#f44336" : "#ddd"}`,
            borderRadius: "4px",
            fontSize: "14px",
            lineHeight: "1.5",
            position: "relative",
          }}
        >
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                width: "16px",
                height: "16px",
                border: "2px solid #2196f3",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {status}
        </div>

        {/* CSS动画 */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* 引擎信息 */}
      {engine && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#333" }}>当前引擎信息</h3>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <strong>引擎类型：</strong> {engine.getEngineType()}
            <br />
            <strong>视频URL：</strong>{" "}
            <span style={{ wordBreak: "break-all" }}>{currentUrl}</span>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#333" }}>使用说明</h3>
        <ul style={{ fontSize: "14px", lineHeight: "1.6", color: "#666" }}>
          <li>在输入框中粘贴视频URL，点击"加载视频"按钮</li>
          <li>或者使用"快速测试"按钮测试不同类型的视频</li>
          <li>系统会自动检测视频格式并选择最佳播放引擎</li>
          <li>支持MP4、WebM、HLS、DASH、YouTube、Vimeo等格式</li>
          <li>
            <strong>特别测试</strong>：无扩展名视频可验证HTTP头检测功能
          </li>
          <li>如果视频加载成功，可以点击播放按钮测试播放功能</li>
        </ul>
      </div>
    </div>
  );
};

export default ImprovedEngineSelection;
