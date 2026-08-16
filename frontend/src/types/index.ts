export type Role = 'USER' | 'ADMIN' | 'ENGINEER';

export type JobStatus = 'CREATED' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type GPUType = 'NVIDIA A100 (80GB)' | 'NVIDIA H100 (80GB)' | 'NVIDIA RTX 4090 (24GB)' | 'NVIDIA L40S (48GB)';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  balance: number; // in VND
  currency: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  datasetName: string;
  datasetSize: string;
  createdAt: string;
  jobCount: number;
  ownerId: string;
}

export interface TrainingJob {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  gpuType: GPUType;
  gpuCount: number;
  status: JobStatus;
  progress: number; // 0 - 100
  durationHours: number;
  costPerHour: number; // VND per hour
  totalCost: number; // VND
  assignedNodeId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  command: string;
  framework: string;
}

export interface GPUNode {
  id: string;
  name: string;
  gpuModel: GPUType;
  totalMemoryGB: number;
  usedMemoryGB: number;
  gpuUtilPercent: number;
  cpuUtilPercent: number;
  temperatureC: number;
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE';
  currentJobId?: string;
  currentJobName?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'GPU_USAGE' | 'REFUND';
  amount: number; // VND
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentMethod?: 'VietQR' | 'VNPay' | 'MoMo' | 'System';
  referenceCode: string;
  description: string;
  timestamp: string;
}

export interface ClusterMetrics {
  activeJobs: number;
  queuedJobs: number;
  totalGpus: number;
  availableGpus: number;
  avgGpuUtilization: number;
  totalComputeHours: number;
  systemKafkaLag: number;
}
