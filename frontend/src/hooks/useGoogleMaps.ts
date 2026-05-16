/**
 * useGoogleMaps — singleton hook for the Maps JS API.
 *
 * The @googlemaps/js-api-loader package is used instead of a raw <script>
 * injection because it:
 *   1. Guarantees the script is only added to the DOM once, ever.
 *   2. Exposes a Promise-based API that handles the global callback internally.
 *   3. Supports dynamic library loading (e.g. "visualization" for heatmaps).
 *
 * Multiple components can call this hook concurrently — they all share the
 * same Loader instance and receive the same resolved `google` object.
 */

/// <reference types="@types/google.maps" />
import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export type MapsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseGoogleMapsReturn {
  status: MapsStatus;
  error: string | null;
}

// Module-level singleton so the Loader is shared across all hook instances.
let loaderSingleton: Loader | null = null;

function getLoader(apiKey: string): Loader {
  if (!loaderSingleton) {
    loaderSingleton = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['visualization'],
    });
  }
  return loaderSingleton;
}

// Module-level promise cache.
let loadPromise: Promise<void> | null = null;

export function useGoogleMaps(): UseGoogleMapsReturn {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const [status, setStatus] = useState<MapsStatus>(apiKey ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      // Not an error — just unconfigured. Consumers show a helpful fallback.
      setStatus('idle');
      return;
    }

    if (typeof window.google !== 'undefined' && window.google.maps) {
      setStatus('ready');
      return;
    }

    const loader = getLoader(apiKey);

    if (!loadPromise) {
      // The v2 type definitions lag the runtime; the load() method exists
      // at runtime but isn't reflected in the published .d.ts yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loadPromise = (loader as any).load().then(() => undefined) as Promise<void>;
    }

    const p = loadPromise!;
    p
      .then(() => setStatus('ready'))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load Google Maps';
        console.error('[useGoogleMaps]', msg);
        setError(msg);
        setStatus('error');
        if (loadPromise === p) loadPromise = null;
      });
  }, [apiKey]);

  return { status, error };
}
