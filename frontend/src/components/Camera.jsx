import React, { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
import { Camera as CameraIcon, CameraOff } from 'lucide-react';
import { Button } from './ui/button';

const Camera = ({ onCapture, isActive }) => {
  const { videoRef, isActive: cameraActive, error, startCamera, stopCamera, captureFrame } = useCamera();

  useEffect(() => {
    if (isActive && !cameraActive) {
      startCamera();
    } else if (!isActive && cameraActive) {
      stopCamera();
    }
  }, [isActive, cameraActive, startCamera, stopCamera]);

  useEffect(() => {
    if (!isActive || !cameraActive) return;

    const interval = setInterval(() => {
      const frame = captureFrame();
      if (frame && onCapture) {
        onCapture(frame);
      }
    }, 3000); // Capture every 3 seconds

    return () => clearInterval(interval);
  }, [isActive, cameraActive, captureFrame, onCapture]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-800/50 border border-cyan-500/20">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4">
          <CameraOff className="w-12 h-12 mb-2" />
          <p className="text-sm text-center">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            data-testid="camera-video"
          />
          {cameraActive && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Camera;
