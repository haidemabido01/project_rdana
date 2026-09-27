import { useEffect, useState } from 'react';
import { getLocations } from '../lib/locations';

export function useLocations() {
  const [regions, setRegions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getLocations()
      .then((d) => mounted && setRegions(d.regions))
      .catch((e) => mounted && setError(e.message || 'Failed to load locations'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { regions, loading, error };
}