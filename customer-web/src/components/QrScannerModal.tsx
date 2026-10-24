import React, { useState, useEffect, useRef } from 'react';
import { useCustomer } from '../context/CustomerContext';
import {
  QrCode,
  X,
  Camera,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const QrScannerModal: React.FC = () => {
  const { showQrScannerModal, setShowQrScannerModal, setDiningTable, setActiveView } = useCustomer();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<'INITIALIZING' | 'STREAMING' | 'DENIED' | 'UNAVAILABLE'>('INITIALIZING');
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Start Camera Stream directly on modal open
  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!showQrScannerModal) return;
      setCameraState('INITIALIZING');
      setScanSuccess(false);
      setScanMessage('');

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) setCameraState('UNAVAILABLE');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          if (isMounted) setCameraState('STREAMING');
          startContinuousScanning();
        }
      } catch (err: any) {
        console.warn('[QrScanner] Camera access error:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraState('DENIED');
          } else {
            setCameraState('UNAVAILABLE');
          }
        }
      }
    };

    if (showQrScannerModal) {
      startCamera();
    }

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [showQrScannerModal]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Continuous Barcode / QR Detection loop (UPI-style instant detection)
  const startContinuousScanning = () => {
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

        const scanLoop = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(scanLoop);
            return;
          }

          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const qrValue = barcodes[0].rawValue;
              if (qrValue) {
                handleScannedCode(qrValue);
                return;
              }
            }
          } catch (e) {
            // Ignore frame decode errors
          }

          animationFrameRef.current = requestAnimationFrame(scanLoop);
        };

        animationFrameRef.current = requestAnimationFrame(scanLoop);
      } catch (e) {
        console.log('[QrScanner] Native barcode detector unavailable');
      }
    }
  };

  const handleScannedCode = (qrText: string) => {
    stopCamera();
    setScanSuccess(true);

    try {
      if (qrText.includes('?') || qrText.startsWith('http')) {
        const urlObj = new URL(qrText.startsWith('http') ? qrText : `https://dinedeck.io/${qrText}`);
        const restId = urlObj.searchParams.get('restaurantId') || urlObj.searchParams.get('r') || 'rest_punjab_heritage';
        const tbl = urlObj.searchParams.get('table') || urlObj.searchParams.get('t') || '1';
        const restName = urlObj.searchParams.get('name') || 'The Punjab Heritage Kitchen';

        setDiningTable(tbl, restId, restName);
        setScanMessage(`Table #${tbl} Detected`);
      } else if (qrText.trim().startsWith('{')) {
        const parsed = JSON.parse(qrText);
        const restId = parsed.restaurantId || 'rest_punjab_heritage';
        const tbl = parsed.tableNumber || parsed.table || '1';
        const restName = parsed.restaurantName || 'The Punjab Heritage Kitchen';

        setDiningTable(tbl, restId, restName);
        setScanMessage(`Table #${tbl} Detected`);
      } else {
        const cleanTable = qrText.replace(/\D/g, '') || '1';
        setDiningTable(cleanTable, 'rest_punjab_heritage', 'The Punjab Heritage Kitchen');
        setScanMessage(`Table #${cleanTable} Detected`);
      }
    } catch (e) {
      setDiningTable('1', 'rest_punjab_heritage', 'The Punjab Heritage Kitchen');
      setScanMessage('Table #1 Detected');
    }

    // Instantly transition to live Menu
    setTimeout(() => {
      setShowQrScannerModal(false);
      setActiveView('MENU');
    }, 500);
  };

  const handleDirectDemoScan = () => {
    stopCamera();
    setScanSuccess(true);
    setScanMessage('Table #1 Detected');
    setDiningTable('1', 'rest_punjab_heritage', 'The Punjab Heritage Kitchen');
    setTimeout(() => {
      setShowQrScannerModal(false);
      setActiveView('MENU');
    }, 400);
  };

  const handleClose = () => {
    stopCamera();
    setShowQrScannerModal(false);
  };

  if (!showQrScannerModal) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Scan QR to Browse Menu</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Point camera at your table's DineDeck QR code</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Camera Viewport Boundary */}
        <div className="relative h-72 w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
          {/* Live HTML5 Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraState === 'STREAMING' ? 'block' : 'hidden'}`}
          />

          {/* Camera Scanning Reticle Overlay (UPI Scanner Style) */}
          {cameraState === 'STREAMING' && !scanSuccess && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Reticle Box */}
              <div className="w-52 h-52 border-2 border-orange-500/80 rounded-2xl relative shadow-2xl">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-400 rounded-br-xl" />

                {/* Animated Laser Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_10px_#f97316] animate-[pulse_1.2s_ease-in-out_infinite] top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-300 font-bold mt-4 drop-shadow bg-black/60 px-3 py-1 rounded-full">
                Scanning table code...
              </p>
            </div>
          )}

          {/* Initializing Spinner */}
          {cameraState === 'INITIALIZING' && (
            <div className="text-center space-y-2 p-4">
              <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-300">Starting Camera...</div>
            </div>
          )}

          {/* Camera Denied / Unavailable Fallback */}
          {(cameraState === 'DENIED' || cameraState === 'UNAVAILABLE') && (
            <div className="text-center space-y-3 p-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Camera Access</div>
                <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                  Scan any table QR or tap below to open the live menu directly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDirectDemoScan}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-black text-xs rounded-xl transition shadow-lg cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Open Table #1 Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Instant Scan Success Feedback */}
          {scanSuccess && (
            <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 p-4 text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <div className="text-base font-black text-white">{scanMessage}</div>
              <p className="text-xs text-emerald-300">Opening live digital menu...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
