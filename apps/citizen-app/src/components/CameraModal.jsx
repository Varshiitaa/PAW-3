import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button } from '@streetpaw/ui';
import { Camera, RefreshCw, CheckCircle2, X } from 'lucide-react';

export function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedPhoto]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera Access Error:', err);
      setCameraError('Unable to access device camera. Please check camera permissions in your browser settings.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = URL.createObjectURL(file);
          setCapturedPhoto({ file, url });
          stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto.file, capturedPhoto.url);
      setCapturedPhoto(null);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Capture Stray Dog Photo" maxWidth="640px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        {cameraError ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#f87171' }}>
            <Camera size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>{cameraError}</p>
          </div>
        ) : capturedPhoto ? (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <img
              src={capturedPhoto.url}
              alt="Captured Snap"
              style={{ width: '100%', maxHeight: '360px', borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              <Button variant="secondary" icon={RefreshCw} onClick={handleRetake}>
                Retake Photo
              </Button>
              <Button variant="emerald" icon={CheckCircle2} onClick={handleConfirm}>
                Use This Photo
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', background: '#000' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxHeight: '380px', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              <Button variant="primary" size="lg" icon={Camera} onClick={takeSnapshot}>
                Snap Photo
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
