import {
  Report,
  ReportFilterOptions,
  DashboardStats,
  User,
  Activity,
  ReportStatus,
} from '@offline-tracker/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok) {
      const errorMsg = json.error || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      (err as any).status = res.status;
      (err as any).details = json;
      throw err;
    }

    return (json.data !== undefined ? json.data : json) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network request timed out');
    }
    throw err;
  }
}

export const api = {
  async checkHealth(): Promise<{ status: string }> {
    return request<{ status: string }>('/health');
  },

  async fetchUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async fetchStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/reports/stats');
  },

  async fetchReports(filters?: ReportFilterOptions): Promise<{ reports: Report[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
      if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${BASE_URL}/reports${query}`);
    const json = await response.json();
    return {
      reports: json.data || [],
      pagination: json.pagination,
    };
  },

  async fetchReportById(id: string): Promise<Report> {
    return request<Report>(`/reports/${id}`);
  },

  async createReport(report: Partial<Report>): Promise<Report> {
    return request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  async updateReport(id: string, report: Partial<Report> & { actorId?: string }): Promise<Report> {
    return request<Report>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  },

  async deleteReport(id: string, actorId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/reports/${id}`, {
      method: 'DELETE',
      headers: { 'x-actor-id': actorId },
    });
  },

  async transitionStatus(
    id: string,
    payload: {
      targetStatus: ReportStatus;
      actorId: string;
      rejectionReason?: string;
      resolutionNotes?: string;
      reopenReason?: string;
    }
  ): Promise<Report> {
    return request<Report>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async assignReport(id: string, assignedTo: string, actorId: string): Promise<Report> {
    return request<Report>(`/reports/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo, actorId }),
    });
  },

  async syncBatchReports(reports: Partial<Report>[]): Promise<{
    processed: number;
    results: Array<{ id: string; status: string; message?: string; report?: Report }>;
  }> {
    return request<{
      processed: number;
      results: Array<{ id: string; status: string; message?: string; report?: Report }>;
    }>('/sync/reports', {
      method: 'POST',
      body: JSON.stringify({ reports }),
    });
  },

  async fetchReportActivities(reportId: string): Promise<Activity[]> {
    return request<Activity[]>(`/activities/reports/${reportId}`);
  },

  async fetchRecentActivities(): Promise<Activity[]> {
    return request<Activity[]>('/activities/recent');
  },
};

