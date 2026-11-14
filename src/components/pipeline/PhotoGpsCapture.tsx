import React, { useRef, useState } from 'react';
import { Camera, MapPin, X, Loader2 } from 'lucide-react';
import { ActivityPhoto } from '../../types';

// Mandatory photo+GPS capture for meetings/site visits (FR-F6/FR-F7) and service
// assessments. Reads the file as a data URL (no external object storage in this
// build) and stamps it with the browser's current geolocation + timestamp.
export const PhotoGpsCapture: React.FC<{ photos: ActivityPhoto[]; onChange: (photos: ActivityPhoto[]) => void; minPhotos?: number }> = ({ photos, onChange, minPhotos = 1 }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setCapturing(true);
    setError(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const position = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          pos => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      if (!position) {
        setError('Could not get GPS location. Enable location access and try again — photos require GPS verification.');
        setCapturing(false);
        return;
      }

      const photo: ActivityPhoto = {
        url: dataUrl,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        takenAt: new Date().toISOString()
      };
      onChange([...photos, photo]);
    } catch (err) {
      setError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        {photos.map((p, idx) => (
          <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={p.url} alt="site" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(photos.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] px-1 py-0.5 flex items-center space-x-0.5">
              <MapPin className="w-2 h-2" /><span>GPS ✓</span>
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={capturing}
          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#00288e] flex flex-col items-center justify-center text-gray-400 hover:text-[#00288e] transition-colors disabled:opacity-50"
        >
          {capturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          <span className="text-[9px] mt-1 font-semibold">{capturing ? 'Locating...' : 'Add Photo'}</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
      <p className="text-[10px] text-gray-400">{photos.length}/{minPhotos} photo(s) with GPS captured{photos.length < minPhotos ? ' — required before this can be marked done' : ''}.</p>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
};
