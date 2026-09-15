import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        // Fallback default coordinates (Mumbai South)
        setLocation({ latitude: 18.9067, longitude: 72.8258 });
        setError(err.message);
      }
    );
  }, []);

  return { location, error };
}
