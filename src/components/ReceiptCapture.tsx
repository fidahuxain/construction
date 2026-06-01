/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface ReceiptCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function ReceiptCapture({ onCapture, onClose }: ReceiptCaptureProps) {
  const [useLiveCam, setUseLiveCam] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Default to back camera for construction invoice
        audio: false
      });
      setStream(camStream);
      setUseLiveCam(true);
      if (videoRef.current) {
        videoRef.current.srcObject = camStream;
      }
    } catch (err) {
      console.warn('Could not launch live webcam, using file fallback', err);
      alert('Camera access denied or unavailable. Please use file picker or upload an invoice image.');
      setUseLiveCam(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Match aspect ratios
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compress image to fit well inside offline storage database (localStorage)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5); // 50% jpeg quality
        onCapture(compressedBase64);
        
        // Stop stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  // Handle manual file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Resize loaded image via canvas to save localStorage space if it is too big
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600; // max width/height to make sure it loads quickly
          let w = img.width;
          let h = img.height;
          
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            onCapture(resizedBase64);
          } else {
            onCapture(result);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col justify-between shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-800">
          <h4 className="font-extrabold text-sm tracking-wide uppercase flex items-center gap-2 font-display">
            <Camera className="w-4.5 h-4.5 text-orange-550 animate-pulse" />
            Invoice Receipt Scanner
          </h4>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Window */}
        <div className="p-6 flex flex-col items-center justify-center min-h-64 bg-slate-950">
          {useLiveCam ? (
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
              >
                Snap Photo Price
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <p className="text-sm text-slate-300">Scan physical challans, receipts, or bills immediately</p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                {/* File picker */}
                <label className="cursor-pointer px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all border border-slate-705 select-none hover:text-white">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span>Choose from Gallery</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                </label>

                {/* Live Feed Cam button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-3.5 bg-orange-600 hover:bg-orange-705 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Launch Live Camera</span>
                </button>
              </div>

              {/* Direct camera capture device support */}
              <div className="text-[10px] text-slate-500 pt-4 leading-relaxed">
                Tip: On mobile phones, Gallery button will prompt <br/>
                to "Take a Photo" or "Choose from camera documents" automatically.
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas used for compression */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Files stay securely stored on your local browser database offline.
        </div>
      </div>
    </div>
  );
}
