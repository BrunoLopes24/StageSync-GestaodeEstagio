export function resolveApiBase(): string {
  const fallback = import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '/api/v1';
  const raw = (import.meta.env.VITE_API_URL || fallback).replace(/\/+$/, '');
  if (raw.endsWith('/api/v1')) return raw;
  if (raw.endsWith('/api')) return `${raw}/v1`;
  return `${raw}/api/v1`;
}
