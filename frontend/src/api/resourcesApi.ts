import { request } from './apiClient';
import { GPUNode, ClusterMetrics, GPUType } from '../types';

export const resourcesApi = {
  getGpuNodes: async (): Promise<GPUNode[]> => {
    return request<GPUNode[]>('/gpu-nodes');
  },

  getClusterMetrics: async (): Promise<ClusterMetrics> => {
    return request<ClusterMetrics>('/cluster/metrics');
  },

  updateGpuPricing: async (gpuType: GPUType, pricePerHour: number): Promise<void> => {
    return request<void>('/gpu-nodes/pricing', {
      method: 'PUT',
      body: JSON.stringify({ gpuType, pricePerHour }),
    });
  },

  toggleNodeMaintenance: async (id: string): Promise<GPUNode> => {
    return request<GPUNode>(`/gpu-nodes/${id}/toggle-maintenance`, {
      method: 'POST',
    });
  },
};
