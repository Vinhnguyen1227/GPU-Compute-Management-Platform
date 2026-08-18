import { request } from './apiClient';
import { TrainingJob } from '../types';

export const jobsApi = {
  getJobs: async (): Promise<TrainingJob[]> => {
    return request<TrainingJob[]>('/jobs');
  },

  getJobById: async (id: string): Promise<TrainingJob> => {
    return request<TrainingJob>(`/jobs/${id}`);
  },

  submitJob: async (jobData: {
    name: string;
    projectId: string;
    gpuType: string;
    gpuCount: number;
    durationHours: number;
    command: string;
    framework: string;
  }): Promise<TrainingJob> => {
    return request<TrainingJob>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  cancelJob: async (id: string): Promise<TrainingJob> => {
    return request<TrainingJob>(`/jobs/${id}/cancel`, {
      method: 'POST',
    });
  },

  forceKillJob: async (id: string): Promise<TrainingJob> => {
    return request<TrainingJob>(`/jobs/${id}/force-kill`, {
      method: 'POST',
    });
  },
};
