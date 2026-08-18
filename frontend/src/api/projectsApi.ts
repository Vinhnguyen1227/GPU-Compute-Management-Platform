import { request } from './apiClient';
import { Project } from '../types';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    return request<Project[]>('/projects');
  },

  getProjectById: async (id: string): Promise<Project> => {
    return request<Project>(`/projects/${id}`);
  },

  createProject: async (projectData: { name: string; description: string; datasetName: string; datasetSize: string }): Promise<Project> => {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  deleteProject: async (id: string): Promise<void> => {
    return request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};
