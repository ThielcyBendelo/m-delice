function getApiOrigin() {
  if (import.meta.env.VITE_API_URL) {
    return new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
  }

  const apiUrl = new URL(window.location.origin);
  if (apiUrl.port === '5173') apiUrl.port = '5000';
  return apiUrl.origin;
}

export function resolveAvatarUrl(value) {
  if (!value || !String(value).startsWith('/uploads/')) return value || '';
  return `${getApiOrigin()}${value}`;
}