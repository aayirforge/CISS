import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, AlertTriangle } from 'lucide-react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(false);
  const [image, setImage] = useState('');
  const [isPhotoSimulated, setIsPhotoSimulated] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Webcam not accessible:', err);
      setError('Webcam not found or permission denied. Fallback: Simulation Mode.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg');
      setImage(base64);
      setCaptured(true);
      setIsPhotoSimulated(false);
      stopCamera();
    }
  };

  // Simulation fallback: draw a simulated badge/face onto canvas
  const captureSimulation = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 300);
      grad.addColorStop(0, '#4f46e5');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);

      // Draw Face circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 120, 60, 0, Math.PI * 2);
      ctx.fill();

      // Draw shoulders
      ctx.beginPath();
      ctx.ellipse(200, 230, 90, 60, 0, 0, Math.PI, true);
      ctx.fill();

      // Text overlays
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CISS VERIFIED CAPTURE', 200, 230);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(new Date().toLocaleString(), 200, 255);

      const base64 = canvas.toDataURL('image/jpeg');
      setImage(base64);
      setCaptured(true);
      setIsPhotoSimulated(true);
    }
  };

  const handleDone = () => {
    onCapture(image, isPhotoSimulated);
  };

  const handleRetake = () => {
    setCaptured(false);
    setImage('');
    setIsPhotoSimulated(false);
    if (!error) {
      startCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-zinc-800 transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera className="text-brand-600 dark:text-brand-500" size={20} />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Face Verification</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video stream or canvas preview */}
        <div className="relative bg-zinc-950 flex items-center justify-center aspect-[4/3] w-full">
          {!captured && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {captured && (
            <img src={image} alt="Captured preview" className="w-full h-full object-cover" />
          )}

          {/* Hidden Canvas for captures */}
          <canvas ref={canvasRef} className="hidden" />

          {error && !captured && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-400 bg-zinc-900">
              <AlertTriangle className="text-amber-500 mb-3" size={40} />
              <p className="text-sm font-medium text-zinc-200">{error}</p>
              <p className="text-xs text-zinc-500 mt-2">Camera access is strictly mandatory for facial verification. Please connect a working camera and grant permissions to check in or out.</p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-center gap-4 border-t border-slate-100 dark:border-zinc-800">
          {!captured && !error && (
            <button
              onClick={capturePhoto}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-lg shadow-brand-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Camera size={18} />
              Capture Verification
            </button>
          )}

          {captured && (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-xl font-semibold active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <RefreshCw size={16} />
                Retake
              </button>
              <button
                onClick={handleDone}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Use Photo
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
