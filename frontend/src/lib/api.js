const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:5000/api/v1';

const buildUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export class ApiClientError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

const request = async (path, options = {}) => {
  const { token, headers, body, ...restOptions } = options;
  const requestHeaders = new Headers(headers || {});
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const payload =
    body && !isFormData && typeof body !== 'string' ? JSON.stringify(body) : body;

  if (payload && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...restOptions,
    headers: requestHeaders,
    body: payload,
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiClientError(data.message || 'Request failed', {
      status: response.status,
      details: data
    });
  }

  return data;
};

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
};
