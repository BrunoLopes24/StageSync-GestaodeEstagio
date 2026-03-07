export function resolveApiBase(): string {
  // Use same-origin by default so dev proxy/nginx can route /api correctly.
  const fallback = '/api/v1';
  const raw = (import.meta.env.VITE_API_URL || fallback).replace(/\/+$/, '');
  if (raw.endsWith('/api/v1')) return raw;
  if (raw.endsWith('/api')) return `${raw}/v1`;
  return `${raw}/api/v1`;
}
