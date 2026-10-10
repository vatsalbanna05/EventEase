import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({ onScanSuccess, isActive }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-viewport';
  const lastScannedTimeRef = useRef<number>(0);

  // Discover cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const deviceList = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Camera ${index + 1}`
          }));
          setCameras(deviceList);
          // Prefer environment (back) camera if found
          const backCam = deviceList.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          setSelectedCamera(backCam ? backCam.id : deviceList[0].id);
        } else {
          setCameraError('No camera devices detected on this device.');
        }
      })
      .catch((err) => {
        console.warn('Camera discovery error:', err);
        setCameraError('Camera access unavailable or permission was not granted.');
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId?: string) => {
    const camId = cameraId || selectedCamera;
    if (!camId) {
      setCameraError('No camera selected');
      return;
    }

    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      setCameraError(null);
      setIsScanning(true);

      await html5QrCode.start(
        camId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Debounce rapid continuous scans (cooldown 1.5s)
          const now = Date.now();
          if (now - lastScannedTimeRef.current > 1500) {
            lastScannedTimeRef.current = now;
            onScanSuccess(decodedText);
          }
        },
        (_errorMessage) => {
          // Frame parse failure is normal while camera searches for QR code
        }
      );
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setCameraError(err?.message || 'Unable to access camera. Please grant camera permissions in your browser.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    if (isActive && selectedCamera && !isScanning) {
      startScanner(selectedCamera);
    } else if (!isActive && isScanning) {
      stopScanner();
    }
  }, [isActive, selectedCamera]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Viewport Box */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center">
        {/* HTML5 QR container */}
        <div id={readerElementId} className="w-full h-full object-cover" />

        {/* Laser Scanner Visual Overlay */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Target Frame */}
            <div className="w-60 h-60 border-2 border-emerald-500/80 rounded-2xl relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Scanning Red/Emerald Laser Line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-laser" />
            </div>
          </div>
        )}

        {/* Fallback Error / Idle view */}
        {(!isScanning || cameraError) && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            {cameraError ? (
              <div className="space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs text-rose-300">{cameraError}</p>
                <button
                  onClick={() => startScanner()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Camera is currently paused or inactive.</p>
                <button
                  onClick={() => startScanner()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-colors"
                >
                  Start Camera Scanner
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="mt-4 w-full max-w-sm flex items-center justify-between gap-3 text-xs">
        {cameras.length > 1 && (
          <select
            value={selectedCamera}
            onChange={(e) => {
              setSelectedCamera(e.target.value);
              if (isScanning) startScanner(e.target.value);
            }}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isScanning ? (
            <button
              onClick={stopScanner}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold border border-rose-200 transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => startScanner()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
