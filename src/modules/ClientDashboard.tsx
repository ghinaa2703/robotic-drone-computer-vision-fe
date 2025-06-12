'use client';

import type React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react'; 
import { useRouter } from 'next/navigation';
import type { MouseEvent, ChangeEvent } from 'react'; 

const BACKEND_WS_URL = 'ws://localhost:8000/ws/video_stream'; 

interface CVMetadata {
  person_count: number;
  density_zones: number[][]; 
  is_crowd: boolean;
  is_high_density: boolean;
  recognized_faces: { name: string; confidence: number }[];
}

interface FrameData {
  type: 'frame';
  image: string;
  width?: number;
  height?: number; 
  fps_target?: number; 
  metadata?: CVMetadata;
}
interface StatusData {
  type: 'status';
  message: string;
}
interface ErrorData {
  type: 'error';
  message: string;
}
type WebSocketData = FrameData | StatusData | ErrorData;

export default function ClientDashboard() {
  const router = useRouter();
  const [selectedFps, setSelectedFps] = useState<number>(20);
  const [selectedQuality, setSelectedQuality] = useState<number>(50);
  const [selectedOutputResizeFactor, setSelectedOutputResizeFactor] = useState<number>(0.5); 
  const [selectedCvProcessingResize, setSelectedCvProcessingResize] = useState<number>(0.5); 

  const [streamUrl, setStreamUrl] = useState<string>('');
  const [processedFrameSrc, setProcessedFrameSrc] = useState<string>('/placeholder.svg');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to backend...'); 
  const [connectionStrength, setConnectionStrength] = useState<number>(0); 
  const [sessionStartTime] = useState<Date>(new Date()); 
  
  const [actualFrameWidth, setActualFrameWidth] = useState<number | null>(null);
  const [actualFrameHeight, setActualFrameHeight] = useState<number | null>(null);
  const [backendTargetFps, setBackendTargetFps] = useState<number | null>(null);
  
  const [cvMetadata, setCvMetadata] = useState<CVMetadata | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const url = query.get('url');
    if (!url) {
      setStatusMessage('Error: Stream URL missing. Redirecting...');
      const timer = setTimeout(() => router.push('/'), 2000);
      return () => clearTimeout(timer); 
    } else {
      setStreamUrl(url);
    }
  }, [router]); 

  const startOrRestartStream = useCallback(() => {
    if (!streamUrl) {
      console.log('startOrRestartStream: streamUrl not available, cannot start.');
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('startOrRestartStream: WebSocket already connected or connecting, closing existing to restart.');
      if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'stop_stream' }));
      }
      wsRef.current.close();
      wsRef.current = null;
      
      setIsConnected(false);
      setIsStreaming(false);
      setProcessedFrameSrc('/placeholder.svg');
      setStatusMessage('Restarting stream with new settings...');
    }

    console.log(`startOrRestartStream: Initializing new WebSocket for URL: ${decodeURIComponent(streamUrl)}`);
    const ws = new WebSocket(BACKEND_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected!');
      setIsConnected(true);
      setConnectionStrength(100);
      setStatusMessage('Connected. Requesting stream...');
      ws.send(JSON.stringify({ 
        type: 'start_stream', 
        url: streamUrl, 
        fps: selectedFps,
        quality: selectedQuality,
        resize_factor: selectedOutputResizeFactor, 
        cv_processing_resize: selectedCvProcessingResize
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketData = JSON.parse(event.data as string);

        if (data.type === 'frame' && 'image' in data) {
          setProcessedFrameSrc(`data:image/jpeg;base64,${data.image}`);
          if (data.width && data.height) {
            setActualFrameWidth(data.width);
            setActualFrameHeight(data.height);
          }
          if (data.fps_target) { 
            setBackendTargetFps(data.fps_target);
          }
          if (data.metadata) {
            setCvMetadata(data.metadata);
          }

          setIsStreaming(prevIsStreaming => {
            if (!prevIsStreaming) {
              setStatusMessage('Streaming live...');
              console.log('Streaming started!');
            }
            return true;
          });
        } else if (data.type === 'status' && 'message' in data) {
          setStatusMessage(data.message);
          if (data.message === 'Stream stopped.') {
            setIsStreaming(false);
            setProcessedFrameSrc('/placeholder.svg');
            setCvMetadata(null);
            console.log('Streaming stopped.');
          }
        } else if (data.type === 'error' && 'message' in data) {
          console.error('Stream Error (received from backend):', data.message);
          setStatusMessage(`Error: ${data.message}`);
          setIsStreaming(false);
          setConnectionStrength(0);
          setProcessedFrameSrc('/placeholder.svg');
          setCvMetadata(null); 
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        setStatusMessage('Error: Corrupted stream data.');
        setIsStreaming(false);
        setProcessedFrameSrc('/placeholder.svg');
        setCvMetadata(null);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket native error:', error);
      setStatusMessage('WebSocket Error: Check console for details. Attempting reconnect...');
      setIsConnected(false);
      setIsStreaming(false);
      setConnectionStrength(0);
      setProcessedFrameSrc('/placeholder.svg');
      setCvMetadata(null);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected!');
      setIsConnected(false);
      setIsStreaming(false);
      setConnectionStrength(0);
      setStatusMessage('Disconnected');
      setProcessedFrameSrc('/placeholder.svg');
      setCvMetadata(null);
      wsRef.current = null;
    };

    return () => {
      console.log('WebSocket Cleanup triggered.');
      if (ws.readyState === WebSocket.OPEN) {
        console.log('Cleanup: Sending stop_stream and closing WebSocket.');
        ws.send(JSON.stringify({ type: 'stop_stream' }));
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        console.log('Cleanup: WebSocket was still connecting, aborting.');
        ws.close(); 
      } else {
        console.log(`Cleanup: WebSocket was already ${ws.readyState === WebSocket.CLOSED ? 'closed' : 'in another state'}, no action needed.`);
      }
      wsRef.current = null;
    };
  }, [streamUrl, selectedFps, selectedQuality, selectedOutputResizeFactor, selectedCvProcessingResize]);

  useEffect(() => {
    if (streamUrl) {
      startOrRestartStream();
    }
  }, [streamUrl, startOrRestartStream]);

  const handleStopStream = (e: MouseEvent<HTMLButtonElement>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isStreaming) {
      wsRef.current.send(JSON.stringify({ type: 'stop_stream' }));
      setStatusMessage('Stopping stream...');
    } else {
      console.log('Cannot stop stream: WebSocket not open or not streaming.');
    }
  };

  const handleChangeStreamUrl = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_stream' }));
      wsRef.current.close(); 
      wsRef.current = null; 
    }
    router.push('/'); 
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', marginBottom: '24px',
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px',
  };
  const titleStyle: React.CSSProperties = {
    fontSize: '32px', fontWeight: 'bold', color: '#22d3ee', margin: 0,
  };
  const buttonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
  };
  const stopButtonStyle: React.CSSProperties = {
    ...buttonStyle, backgroundColor: isConnected && isStreaming ? '#dc2626' : '#6b7280', color: 'white', opacity: isConnected && isStreaming ? 1 : 0.5, cursor: isConnected && isStreaming ? 'pointer' : 'not-allowed',
  };
  const backButtonStyle: React.CSSProperties = {
    ...buttonStyle, backgroundColor: '#475569', color: 'white', marginLeft: '12px',
  };
  const statsGridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px',
  };
  const mainGridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px',
  };
  const videoContainerStyle: React.CSSProperties = {
    backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '400px',
  };
  const statusColor = isStreaming ? '#22c55e' : isConnected ? '#eab308' : '#ef4444';
  const selectInputStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '14px', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '1.5em 1.5em',
  };

  const FlyingDroneLoader = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '60px',
            height: '40px',
            backgroundColor: '#22d3ee',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'droneFloat 3s ease-in-out infinite',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#0f172a',
              borderRadius: '50%',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '20px',
            height: '20px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            animation: 'propellerSpin 0.1s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '20px',
            height: '20px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            animation: 'propellerSpin 0.1s linear infinite reverse',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '20px',
            height: '20px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            animation: 'propellerSpin 0.1s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '20px',
            height: '20px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            animation: 'propellerSpin 0.1s linear infinite reverse',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '2px',
            backgroundColor: '#22d3ee',
            top: '20px',
            animation: 'droneFloat 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '2px',
            backgroundColor: '#22d3ee',
            bottom: '20px',
            animation: 'droneFloat 3s ease-in-out infinite',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '80px',
            height: '80px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            opacity: 0.3,
            animation: 'signalPulse 2s ease-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            opacity: 0.2,
            animation: 'signalPulse 2s ease-out infinite 0.5s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            border: '2px solid #22d3ee',
            borderRadius: '50%',
            opacity: 0.1,
            animation: 'signalPulse 2s ease-out infinite 1s',
          }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: '#22d3ee',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            animation: 'textPulse 2s ease-in-out infinite',
          }}
        >
          Establishing Connection
        </p>
        <p
          style={{
            color: '#94a3b8',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          Connecting to drone camera feed...
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#22d3ee',
              borderRadius: '50%',
              animation: `dotPulse 1.5s ease-in-out infinite ${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🚁 Drone Control Center</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleStopStream}
            disabled={!isConnected || !isStreaming}
            style={stopButtonStyle}
          >
            ⏹️ {isStreaming ? 'Stop' : 'Offline'}
          </button>
          <button onClick={handleChangeStreamUrl} style={backButtonStyle}>
            ← Back
          </button>
        </div>
      </div>

      <div style={statsGridStyle}>
        <div style={cardStyle}>
          <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>Connection Status</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: statusColor, margin: '0 0 4px 0' }}>
            {isConnected ? (isStreaming ? 'LIVE' : 'CONNECTED') : 'OFFLINE'}
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {isConnected ? 'Stream active' : 'Disconnected'}
          </p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>Stream Quality</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: '0 0 4px 0' }}>
            {selectedQuality}% (Set)
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>JPEG quality</p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>Target FPS</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: '0 0 4px 0' }}>
            {backendTargetFps || selectedFps} FPS
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>{backendTargetFps ? 'Backend target' : 'Selected'}</p>
        </div>
      </div>

      <div style={mainGridStyle}>
        <div>
          <div style={cardStyle}>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>📹 Camera Feed</h2>
              {isStreaming && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#22c55e',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                    }}
                  ></div>
                  LIVE
                </div>
              )}
            </div>

            <div style={videoContainerStyle}>
              {!isStreaming && !isConnected && <FlyingDroneLoader />}

              {isStreaming && processedFrameSrc && processedFrameSrc !== '/placeholder.svg' && (
                <img
                  src={processedFrameSrc}
                  alt="Live Drone Stream"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              )}

              {isConnected && !isStreaming && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '16px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
                  <p>Camera feed ready</p>
                  <p style={{ fontSize: '14px', opacity: 0.7 }}>Waiting for stream data...</p>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>{actualFrameWidth ? `${actualFrameWidth}x${actualFrameHeight}` : '---x---'}</span> 
                <span>{backendTargetFps || selectedFps} FPS</span>
                <span>Quality: {selectedQuality}%</span>
              </div>
              <span>{isStreaming ? 'Recording Active' : 'Stream Inactive'}</span>
            </div>
          </div>
        </div>

        <div>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>👁️‍🗨️ CV Analytics</h3>
            {cvMetadata ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Total Persons:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#22d3ee' }}>{cvMetadata.person_count}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Crowd Status:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: cvMetadata.is_high_density ? '#dc2626' : (cvMetadata.is_crowd ? '#eab308' : '#22c55e') }}>
                    {cvMetadata.is_high_density ? 'HIGH DENSITY' : (cvMetadata.is_crowd ? 'CROWDED' : 'NORMAL')}
                  </span>
                </div>
                {cvMetadata.recognized_faces.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Recognized:</span>
                    {cvMetadata.recognized_faces.map((face, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#e2e8f0' }}>
                        <span>• {face.name}</span>
                        <span>{face.confidence}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {cvMetadata.density_zones && cvMetadata.density_zones.length > 0 && cvMetadata.density_zones[0] && cvMetadata.density_zones[0].length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Zone Density (Grid):</span>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cvMetadata.density_zones[0].length}, 1fr)`, gap: '4px' }}>
                      {cvMetadata.density_zones.map((row, rIdx) => (
                        row.map((count, cIdx) => (
                          <div 
                            key={`${rIdx}-${cIdx}`} 
                            style={{ 
                              backgroundColor: count > (cvMetadata.is_high_density ? 8 : (cvMetadata.is_crowd ? 3 : 0)) ? '#f00' : (count > 0 ? '#ff0' : '#000'), 
                              color: 'white', 
                              padding: '4px', 
                              borderRadius: '4px', 
                              textAlign: 'center', 
                              fontSize: '12px',
                              opacity: count > 0 ? 0.8 : 0.4
                            }}
                          >
                            {count}
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: '14px' }}>Waiting for CV data...</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              ⚙️ Stream Configuration
            </h3>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                    JPEG Quality (Output)
                </label>
                <select 
                    value={selectedQuality} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedQuality(parseInt(e.target.value))}
                    style={selectInputStyle}
                    disabled={!isConnected || !streamUrl} 
                >
                    <option value={30}>Low (30%)</option>
                    <option value={50}>Medium (50%)</option>
                    <option value={70}>High (70%)</option>
                    <option value={90}>Very High (90%)</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                    Target FPS
                </label>
                <select 
                    value={selectedFps} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedFps(parseInt(e.target.value))}
                    style={selectInputStyle}
                    disabled={!isConnected || !streamUrl} 
                >
                    <option value={10}>10 FPS</option>
                    <option value={15}>15 FPS</option>
                    <option value={20}>20 FPS</option>
                    <option value={25}>25 FPS</option>
                    <option value={30}>30 FPS</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                    Display Resolution (Output)
                </label>
                <select 
                    value={selectedOutputResizeFactor} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedOutputResizeFactor(parseFloat(e.target.value))}
                    style={selectInputStyle}
                    disabled={!isConnected || !streamUrl} 
                >
                    <option value={1.0}>Original (100%)</option>
                    <option value={0.75}>High (75%)</option>
                    <option value={0.5}>Medium (50%)</option>
                    <option value={0.25}>Low (25%)</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                    CV Processing Resolution
                </label>
                <select 
                    value={selectedCvProcessingResize} 
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCvProcessingResize(parseFloat(e.target.value))}
                    style={selectInputStyle}
                    disabled={!isConnected || !streamUrl} 
                >
                    <option value={1.0}>Original (100%)</option>
                    <option value={0.75}>High (75%)</option>
                    <option value={0.5}>Medium (50%)</option>
                    <option value={0.25}>Low (25%)</option>
                </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Stream URL
              </label>
              <div
                style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                }}
              >
                <code style={{ fontSize: '12px', color: '#e2e8f0', wordBreak: 'break-all' }}>
                  {decodeURIComponent(streamUrl || 'N/A')}
                </code>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                Status
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: statusColor,
                    borderRadius: '50%',
                  }}
                ></div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: statusColor }}>
                  {statusMessage}
                </span>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🕒 Session Info</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Current Time</span>
                <span style={{ fontFamily: 'monospace' }}>{formatTime(new Date())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Session Started</span>
                <span style={{ fontFamily: 'monospace' }}>{formatTime(sessionStartTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Stream Source</span>
                <span style={{ color: '#22d3ee', fontWeight: '500' }}>Drone Camera</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Connection</span>
                <span style={{ color: statusColor, fontWeight: '500' }}>
                  {isConnected ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🎮 Controls</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleStopStream}
                disabled={!isConnected || !isStreaming}
                style={{
                  ...buttonStyle,
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: isConnected && isStreaming ? '#dc2626' : '#6b7280',
                  color: 'white',
                  opacity: isConnected && isStreaming ? 1 : 0.5,
                  cursor: isConnected && isStreaming ? 'pointer' : 'not-allowed',
                }}
              >
                ⏹️ Stop Stream
              </button>

              <button
                onClick={handleChangeStreamUrl} 
                style={{
                  ...buttonStyle,
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                }}
              >
                ⚙️ Change Stream URL
              </button>
            </div>
          </div>
        </div>
      </div> 

      <div
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #334155',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          <span>🚁 Processing by FastAPI</span>
          <span>•</span>
          <span>📱 Display by Next.js</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes droneFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(-4px) rotate(0deg); }
          75% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes propellerSpin {
          0% { transform: rotate(0deg); border-color: #22d3ee transparent #22d3ee transparent; }
          25% { border-color: transparent #22d3ee transparent #22d3ee; }
          50% { transform: rotate(180deg); border-color: #22d3ee transparent #22d3ee transparent; }
          75% { border-color: transparent #22d3ee transparent #22d3ee; }
          100% { transform: rotate(360deg); border-color: #22d3ee transparent #22d3ee transparent; }
        }
        @keyframes signalPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes textPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}