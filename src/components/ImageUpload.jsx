import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { uploadNomineeImage } from '../utils/storage';

const ImageUpload = ({ value, onChange, compact = false }) => {
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // ─── Handle file select (from picker) ─────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  // ─── Process and upload a file ─────────────────────────────
  const processFile = async (file) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const publicUrl = await uploadNomineeImage(file);
      setPreview(publicUrl);
      onChange(publicUrl);
    } catch (err) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
      setPreview(value || '');
    } finally {
      setUploading(false);
    }
  };

  // ─── Camera: start stream ─────────────────────────────────
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);

      // Wait for DOM to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera: ' + err.message);
      }
    }
  }, []);

  // ─── Camera: capture frame ────────────────────────────────
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await processFile(file);
    }, 'image/jpeg', 0.85);
  }, []);

  // ─── Camera: stop stream ─────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  // ─── URL input ────────────────────────────────────────────
  const handleUrlSubmit = () => {
    if (urlDraft.trim()) {
      setPreview(urlDraft.trim());
      onChange(urlDraft.trim());
    }
    setShowUrlInput(false);
    setUrlDraft('');
  };

  // ─── Clear image ──────────────────────────────────────────
  const clearImage = () => {
    setPreview('');
    onChange('');
    setError('');
  };

  // ─── Camera modal ─────────────────────────────────────────
  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            <span className="text-sm font-medium text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-primary-400" />
              <span>Take Photo</span>
            </span>
            <button onClick={stopCamera} className="text-slate-500 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 transition-colors flex items-center justify-center shadow-lg ring-4 ring-dark-700"
              title="Capture"
            >
              <div className="w-12 h-12 rounded-full border-4 border-dark-800"></div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }

  // ─── URL input overlay ────────────────────────────────────
  if (showUrlInput) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://example.com/image.jpg"
            className="input-field text-sm py-2"
            autoFocus
          />
          <button onClick={handleUrlSubmit} className="text-emerald-400 hover:text-emerald-300 p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={() => setShowUrlInput(false)} className="text-slate-500 hover:text-slate-300 p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Compact mode (for inline editing of existing nominees) ─
  if (compact && preview) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0 relative group">
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button
            onClick={clearImage}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {uploading && <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />}
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview && (
        <div className="relative w-full max-w-[200px] aspect-square rounded-xl overflow-hidden bg-dark-900 ring-1 ring-dark-700 group">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!preview && !uploading && (
        <div className="flex flex-wrap gap-2">
          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-700/60 hover:bg-dark-700 border border-dark-600/50 text-slate-300 hover:text-white text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-700/60 hover:bg-dark-700 border border-dark-600/50 text-slate-300 hover:text-white text-sm transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>

          {/* URL input */}
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-700/60 hover:bg-dark-700 border border-dark-600/50 text-slate-300 hover:text-white text-sm transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            <span>URL</span>
          </button>
        </div>
      )}

      {uploading && !preview && (
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
          <span>Uploading...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 flex items-center space-x-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
