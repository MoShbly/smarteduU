'use client';

import { useEffect, useState } from 'react';

export function useApiQuery(queryFn, dependencies = [], options = {}) {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await queryFn();

        if (isMounted) {
          setData(result);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || 'Something went wrong');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [enabled, reloadKey, ...dependencies]);

  return {
    data,
    loading,
    error,
    setData,
    reload: () => setReloadKey((current) => current + 1)
  };
}
