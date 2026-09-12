import type { User, Project, Evaluation, Room, SystemSettings, AuditLog } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL 
  ? `${(import.meta as any).env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

/**
 * Helper to execute JSON fetch requests
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // System Health
  async health(): Promise<{ status: string; database: { type: string; connected: boolean; message: string } }> {
    return request('/health');
  },

  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(fullName: string, email: string, password: string): Promise<{ success: boolean; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password })
    });
  },

  async getMe(email: string): Promise<User> {
    return request(`/auth/me?email=${encodeURIComponent(email)}`);
  },

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword })
    });
  },

  // Projects
  async getProjects(params?: { applicationType?: string; headCategory?: string; status?: string }): Promise<Project[]> {
    const query = new URLSearchParams();
    if (params?.applicationType) query.append('applicationType', params.applicationType);
    if (params?.headCategory) query.append('headCategory', params.headCategory);
    if (params?.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/projects${queryString}`);
  },

  async getProjectById(id: string): Promise<Project> {
    return request(`/projects/${id}`);
  },

  async createProject(project: Partial<Project>, actor?: { email: string; name: string }): Promise<Project> {
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify({ ...project, _actor: actor })
    });
  },

  async bulkCreateProjects(projects: Partial<Project>[], actor?: { email: string; name: string }): Promise<{ success: boolean; count: number; message?: string }> {
    return request('/projects/bulk', {
      method: 'POST',
      body: JSON.stringify({ projects, actor })
    });
  },

  async updateProject(project: Project, actor?: { email: string; name: string }): Promise<Project> {
    return request(`/projects/${project.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...project, _actor: actor })
    });
  },

  async deleteProject(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean }> {
    return request(`/projects/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actor })
    });
  },

  async toggleProjectStatus(id: string, actor?: { email: string; name: string }): Promise<Project> {
    return request(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ actor })
    });
  },

  async assignProjectRoom(id: string, roomNumber: string, actor?: { email: string; name: string }): Promise<Project> {
    return request(`/projects/${id}/room`, {
      method: 'PATCH',
      body: JSON.stringify({ roomNumber, actor })
    });
  },

  async bulkImportProjects(projects: Project[], actor?: { email: string; name: string }): Promise<{ count: number }> {
    return request('/projects/bulk', {
      method: 'POST',
      body: JSON.stringify({ projects, actor })
    });
  },

  // Evaluations
  async getEvaluations(): Promise<Evaluation[]> {
    return request('/evaluations');
  },

  async getEvaluationsByJudge(email: string): Promise<Evaluation[]> {
    return request(`/evaluations/judge/${encodeURIComponent(email)}`);
  },

  async getEvaluationForProject(projectId: string, judgeEmail?: string): Promise<Evaluation | Evaluation[]> {
    const query = judgeEmail ? `?judgeEmail=${encodeURIComponent(judgeEmail)}` : '';
    return request(`/evaluations/project/${projectId}${query}`);
  },

  async saveEvaluation(evaluation: Evaluation, actor?: { email: string; name: string }): Promise<Evaluation> {
    return request('/evaluations', {
      method: 'POST',
      body: JSON.stringify({ ...evaluation, _actor: actor })
    });
  },

  async deleteEvaluation(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean }> {
    return request(`/evaluations/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actor })
    });
  },

  // Judges
  async getJudges(): Promise<User[]> {
    return request('/judges');
  },

  async approveJudge(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean; judge: User }> {
    return request(`/judges/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ actor })
    });
  },

  async rejectJudge(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean; judge: User }> {
    return request(`/judges/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ actor })
    });
  },

  async assignJudgeRoom(id: string, roomNumber: string, actor?: { email: string; name: string }): Promise<{ success: boolean; judge: User }> {
    return request(`/judges/${id}/room`, {
      method: 'PATCH',
      body: JSON.stringify({ roomNumber, actor })
    });
  },

  async deleteJudge(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean }> {
    return request(`/judges/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actor })
    });
  },

  // Rooms
  async getRooms(): Promise<Room[]> {
    return request('/rooms');
  },

  async createRoom(room: Room, actor?: { email: string; name: string }): Promise<Room> {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify({ ...room, actor })
    });
  },

  async updateRoom(room: Room, actor?: { email: string; name: string }): Promise<Room> {
    return request(`/rooms/${room.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...room, actor })
    });
  },

  async deleteRoom(id: string, actor?: { email: string; name: string }): Promise<{ success: boolean }> {
    return request(`/rooms/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ actor })
    });
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    return request('/settings');
  },

  async updateSettings(settings: SystemSettings, actor?: { email: string; name: string }): Promise<SystemSettings> {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ ...settings, actor })
    });
  },

  async toggleEvaluationLock(locked: boolean, actor?: { email: string; name: string }): Promise<SystemSettings> {
    return request('/settings/toggle-evaluation-lock', {
      method: 'POST',
      body: JSON.stringify({ locked, actor })
    });
  },

  async toggleFinalResultLock(locked: boolean, actor?: { email: string; name: string }): Promise<SystemSettings> {
    return request('/settings/toggle-final-result-lock', {
      method: 'POST',
      body: JSON.stringify({ locked, actor })
    });
  },

  async toggleProjectLock(projectId: string, actor?: { email: string; name: string }): Promise<{ success: boolean; isLocked: boolean; settings: SystemSettings }> {
    return request('/settings/toggle-project-lock', {
      method: 'POST',
      body: JSON.stringify({ projectId, actor })
    });
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return request('/audit');
  },

  async logAudit(
    actorEmail: string,
    actorName: string,
    action: string,
    targetType: string,
    details: string
  ): Promise<AuditLog> {
    return request('/audit', {
      method: 'POST',
      body: JSON.stringify({ actorEmail, actorName, action, targetType, details })
    });
  }
};
