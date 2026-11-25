import React, { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Clé de test officielle Cloudflare (passe toujours en environnement local)
const DEV_TEST_SITE_KEY = '1x00000000000000000000AA';

export default function TurnstileField({ onToken, theme = 'light' }) {
  const containerRef = useRef(null);
  const envSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Utilise la clé de test en local si aucune clé n'est définie ou si vous testez sur 127.0.0.1
  const siteKey = envSiteKey || (import.meta.env.DEV || isLocalhost ? DEV_TEST_SITE_KEY : '');

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;
    let cancelled = false;
    let widgetId = null;

    const render = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => {
          onToken('');
        },
      });
    };

    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.turnstile) {
        render();
      } else {
        existing.addEventListener('load', render);
      }
    } else {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId !== null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [onToken, siteKey, theme]);

  return siteKey ? <div ref={containerRef} className="min-h-[65px] flex justify-center" /> : null;
}
