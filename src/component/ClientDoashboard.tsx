'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

const BACKEND_WS_URL = 'ws://localhost:8000/ws/video_stream';

interface FrameData {
  type: 'frame';
  image: string;
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

  const [streamUrl, setStreamUrl] = useState<string>('');
  const [processedFrameSrc, setProcessedFrameSrc] =
    useState<string>('/placeholder.jpg');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Connecting to backend...'
  );
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams(window.location.search);
      const url = query.get('url');
      if (!url) {
        setStatusMessage('Error: Stream URL missing. Redirecting...');
        router.push('/');
      } else {
        setStreamUrl(url);
      }
    }
  }, [router]);

  useEffect(() => {
    if (!streamUrl || wsRef.current) return;

    wsRef.current = new WebSocket(BACKEND_WS_URL);
    const ws = wsRef.current; 

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      setStatusMessage('Connected. Requesting stream...');
      ws.send(JSON.stringify({ type: 'start_stream', url: streamUrl }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const data: WebSocketData = JSON.parse(event.data);

      if (data.type === 'frame' && 'image' in data) {
        setProcessedFrameSrc(`data:image/jpeg;base64,${data.image}`);
        if (!isStreaming) {
          setIsStreaming(true);
        }
        setStatusMessage('Streaming live...');
      } else if (data.type === 'status') {
        setStatusMessage(data.message);
        if (data.message === 'Stream stopped.') {
          setIsStreaming(false);
          setProcessedFrameSrc('/placeholder.jpg');
        }
      } else if (data.type === 'error') {
        console.error('Stream Error:', data.message);
        setStatusMessage(`Error: ${data.message}`);
        setIsStreaming(false);
        setProcessedFrameSrc('/placeholder.jpg');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setStatusMessage('WebSocket Error: Check console for details.');
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      setIsStreaming(false);
      setStatusMessage('Disconnected');
      setProcessedFrameSrc('/placeholder.jpg');
      wsRef.current = null;
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Cleanup: Sending stop_stream and closing WebSocket.');
        ws.send(JSON.stringify({ type: 'stop_stream' }));
        ws.close();
      }
    };
  }, [streamUrl]);

  const handleStopStream = (e: MouseEvent<HTMLButtonElement>) => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      isStreaming
    ) {
      wsRef.current.send(JSON.stringify({ type: 'stop_stream' }));
      setStatusMessage('Stopping stream...');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-5 box-border font-sans">
      <h1 className="text-4xl text-gray-800 mb-5">Drone Live Dashboard</h1>
      <p className="text-lg text-gray-700 mb-4 text-center break-words">
        Streaming from:{' '}
        <code className="bg-gray-200 px-2 py-1 rounded-md font-mono">
          {decodeURIComponent(streamUrl || 'N/A')}
        </code>
      </p>
      <p className="text-xl font-bold mb-5 text-blue-600">
        Status: {statusMessage}
      </p>

      <div className="flex gap-4 mb-5">
        <button
          onClick={handleStopStream}
          disabled={!isConnected || !isStreaming}
          className="py-3 px-6 bg-red-600 text-white rounded-md text-lg cursor-pointer transition-colors duration-300 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Stop Stream
        </button>
        <button
          onClick={() => router.push('/')}
          className="py-3 px-6 bg-blue-600 text-white rounded-md text-lg cursor-pointer transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Change Stream URL
        </button>
      </div>

      <div className="border border-gray-300 max-w-4xl w-full mx-auto overflow-hidden bg-black flex justify-center items-center min-h-[450px] rounded-lg shadow-md">
        <img
          src={processedFrameSrc}
          alt="Live Drone Stream"
          className="w-full h-auto block"
        />
      </div>

      <p className="mt-8 text-gray-600 text-base">
        <small>Processing by FastAPI, Display by Next.js</small>
      </p>
    </div>
  );
}