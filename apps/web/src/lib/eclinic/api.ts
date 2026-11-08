// Thin client for the NestJS API.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) { super(message); }
}

export class NetworkError extends Error {}

const TOKEN_KEY = 'eclinic_token';
export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Every success body is { success: true, message?, data } — we unwrap `data`. */
export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
  } catch {
    // Mạng/CORS: trình duyệt không cho biết chi tiết, nên nêu rõ địa chỉ đang gọi để dễ kiểm tra.
    throw new NetworkError(`Không kết nối được tới API (${BASE}). Hãy kiểm tra API đang chạy, NEXT_PUBLIC_API_URL và CORS_ORIGIN.`);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    throw new ApiError(res.status, body.message ?? 'Có lỗi xảy ra', body.errors);
  }
  return body.data as T;
}

// Example: login → store token
// const { token, user } = await api<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) });
// tokenStore.set(token);

const send = <T = unknown>(method: string, path: string, body?: unknown) =>
  api<T>(path, { method, body: JSON.stringify(body ?? {}) });
export const post = <T = unknown>(path: string, body?: unknown) => send<T>('POST', path, body);
export const put = <T = unknown>(path: string, body?: unknown) => send<T>('PUT', path, body);
export const patch = <T = unknown>(path: string, body?: unknown) => send<T>('PATCH', path, body);
export const del = <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' });

/** Message to show the user for any thrown value (first validation message wins). */
export function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const all = e.errors ? Object.values(e.errors).flat() : [];
    return all.length ? all.join(' ') : e.message;
  }
  if (e instanceof NetworkError) return e.message;
  return 'Có lỗi không xác định, vui lòng thử lại.';
}

/** Paginated list shape returned by the admin list endpoints. */
export interface Paged<T> { data: T[]; current_page: number; last_page: number; per_page: number; total: number }

/** Upload a JPG/PNG (≤ 2 MB) and get back its public URL (stored in icon_url / avatar_url). */
export async function uploadImage(file: File, oldUrl?: string): Promise<string> {
  const token = tokenStore.get();
  const form = new FormData();
  
  form.append('file', file);
  
  // Nếu có truyền ảnh cũ, thêm vào form data để backend tự động xóa
  if (oldUrl) {
    form.append('old_url', oldUrl);
  }

  const res = await fetch(`${BASE}/uploads`, {
    method: 'POST',
    body: form, // no Content-Type: the browser sets the multipart boundary
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.message ?? 'Tải ảnh lên thất bại', body.errors);
  
  return (body.data as { url: string }).url;
}
