const API_BASE = import.meta.env.VITE_API_URL || '/api';
class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || response.statusText);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<T>(response);
  },

  // Connection helpers used by ConnectionDialog
  async testConnection(data: any): Promise<{ success: boolean; error?: string; namespace?: string }> {
    return this.post('/connections/test', data);
  },

  async createConnection(data: any): Promise<any> {
    return this.post('/connections', data);
  },
};

// Connection API
export const connectionsApi = {
  list: () => api.get<any[]>('/connections'),
  get: (id: string) => api.get<any>(`/connections/${id}`),
  create: (data: any) => api.post<any>('/connections', data),
  update: (id: string, data: any) => api.put<any>(`/connections/${id}`, data),
  delete: (id: string) => api.delete(`/connections/${id}`),
  test: (id: string) => api.post<any>(`/connections/${id}/test`),
  activate: (id: string) => api.post<any>(`/connections/${id}/activate`),
  getActive: () => api.get<any>('/connections/active'),
};

// Queues API
export const queuesApi = {
  list: () => api.get<any[]>('/service-bus/queues'),
  get: (name: string) => api.get<any>(`/service-bus/queues/${encodeURIComponent(name)}`),
  create: (data: any) => api.post<any>('/service-bus/queues', data),
  update: (name: string, data: any) => api.put<any>(`/service-bus/queues/${encodeURIComponent(name)}`, data),
  delete: (name: string) => api.delete(`/service-bus/queues/${encodeURIComponent(name)}`),
  peekMessages: (name: string, count = 10) =>
    api.get<any[]>(`/service-bus/queues/${encodeURIComponent(name)}/messages?count=${count}`),
  sendMessage: (name: string, message: any) =>
    api.post(`/service-bus/queues/${encodeURIComponent(name)}/messages`, { message }),
  receiveMessages: (name: string, options: any) =>
    api.post<any[]>(`/service-bus/queues/${encodeURIComponent(name)}/messages/receive`, options),
  peekDLQ: (name: string, count = 10) =>
    api.get<any[]>(`/service-bus/queues/${encodeURIComponent(name)}/dlq?count=${count}`),
  purge: (name: string, includeDeadLetter = false) =>
    api.post<any>(`/service-bus/queues/${encodeURIComponent(name)}/purge`, { includeDeadLetter }),
};

// Topics API
export const topicsApi = {
  list: () => api.get<any[]>('/service-bus/topics'),
  get: (name: string) => api.get<any>(`/service-bus/topics/${encodeURIComponent(name)}`),
  create: (data: any) => api.post<any>('/service-bus/topics', data),
  update: (name: string, data: any) => api.put<any>(`/service-bus/topics/${encodeURIComponent(name)}`, data),
  delete: (name: string) => api.delete(`/service-bus/topics/${encodeURIComponent(name)}`),
  sendMessage: (name: string, message: any) =>
    api.post(`/service-bus/topics/${encodeURIComponent(name)}/messages`, { message }),
};

// Subscriptions API
export const subscriptionsApi = {
  list: (topicName: string) =>
    api.get<any[]>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions`),
  get: (topicName: string, name: string) =>
    api.get<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}`),
  create: (topicName: string, data: any) =>
    api.post<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions`, data),
  update: (topicName: string, name: string, data: any) =>
    api.put<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}`, data),
  delete: (topicName: string, name: string) =>
    api.delete(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}`),
  peekMessages: (topicName: string, name: string, count = 10) =>
    api.get<any[]>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}/messages?count=${count}`),
  receiveMessages: (topicName: string, name: string, options: any) =>
    api.post<any[]>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}/messages/receive`, options),
  peekDLQ: (topicName: string, name: string, count = 10) =>
    api.get<any[]>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}/dlq?count=${count}`),
  purge: (topicName: string, name: string, includeDeadLetter = false) =>
    api.post<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(name)}/purge`, { includeDeadLetter }),
};

// Rules API
export const rulesApi = {
  list: (topicName: string, subscriptionName: string) =>
    api.get<any[]>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(subscriptionName)}/rules`),
  get: (topicName: string, subscriptionName: string, name: string) =>
    api.get<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(subscriptionName)}/rules/${encodeURIComponent(name)}`),
  create: (topicName: string, subscriptionName: string, data: any) =>
    api.post<any>(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(subscriptionName)}/rules`, data),
  delete: (topicName: string, subscriptionName: string, name: string) =>
    api.delete(`/service-bus/topics/${encodeURIComponent(topicName)}/subscriptions/${encodeURIComponent(subscriptionName)}/rules/${encodeURIComponent(name)}`),
};
