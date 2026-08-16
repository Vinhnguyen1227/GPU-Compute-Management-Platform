import React, { useState, useEffect } from 'react';
import './i18n';
import { Shell } from './components/layout/Shell';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { SubmitJob } from './pages/SubmitJob';
import { JobsList } from './pages/JobsList';
import { JobMonitor } from './pages/JobMonitor';
import { ResourceCluster } from './pages/ResourceCluster';
import { BillingWallet } from './pages/BillingWallet';
import { AdminConsole } from './pages/AdminConsole';

import { 
  mockUsersList,
  mockProjects, 
  mockJobs, 
  mockNodes, 
  mockTransactions, 
  mockClusterMetrics,
  initialGpuPricing
} from './data/mockData';
import { User, Project, TrainingJob, GPUNode, Transaction, GPUType, Role } from './types';

export function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dgx_users');
    return saved ? JSON.parse(saved) : mockUsersList;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dgx_current_user');
    return saved ? JSON.parse(saved) : mockUsersList[0]; // Defaults to Admin
  });

  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Entities state
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [jobs, setJobs] = useState<TrainingJob[]>(mockJobs);
  const [nodes, setNodes] = useState<GPUNode[]>(mockNodes);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [metrics, setMetrics] = useState(mockClusterMetrics);
  const [gpuPricing, setGpuPricing] = useState<Record<GPUType, number>>(initialGpuPricing);

  // Save users state to localStorage
  useEffect(() => {
    localStorage.setItem('dgx_users', JSON.stringify(users));
  }, [users]);

  // Save current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dgx_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dgx_current_user');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <Auth
        usersList={users}
        onLogin={(user) => {
          setCurrentUser(user);
          setCurrentPath('/dashboard');
        }}
        onRegister={(newUserData) => {
          const newUser: User = {
            ...newUserData,
            id: `usr_${Date.now().toString().slice(-4)}`,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            totalJobsRun: 0,
          };
          setUsers([newUser, ...users]);
          return newUser;
        }}
      />
    );
  }

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleNavigate = (path: string) => {
    // Route guard: Non-admin users cannot access /admin
    if (path === '/admin' && currentUser.role !== 'ADMIN' && currentUser.role !== 'ENGINEER') {
      setCurrentPath('/dashboard');
      return;
    }
    setCurrentPath(path);
    if (!path.startsWith('/projects/')) {
      setSelectedProjectId(null);
    }
  };

  // ADMIN HANDLERS
  const handleUpdateUserRole = (userId: string, newRole: Role) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser.id === userId) {
      setCurrentUser({ ...currentUser, role: newRole });
    }
  };

  const handleAdjustUserBalance = (userId: string, amount: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, balance: Math.max(0, u.balance + amount) } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, balance: Math.max(0, prev.balance + amount) } : prev);
    }

    const targetUser = users.find(u => u.id === userId);
    const newTx: Transaction = {
      id: `tx-adj-${Date.now().toString().slice(-4)}`,
      userId: userId,
      type: 'ADMIN_ADJUSTMENT',
      amount: amount,
      currency: 'VND',
      status: 'SUCCESS',
      paymentMethod: 'Admin',
      referenceCode: `ADM-${Date.now().toString().slice(-6)}`,
      description: `Điều chỉnh số dư ví từ Quản trị viên (${amount >= 0 ? '+' : ''}${amount.toLocaleString('vi-VN')}₫)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleUpdateGpuPricing = (gpuType: GPUType, newRate: number) => {
    setGpuPricing(prev => ({ ...prev, [gpuType]: newRate }));
  };

  const handleForceKillJob = (jobId: string) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'FAILED', progress: j.progress } : j));
    if (targetJob.assignedNodeId) {
      setNodes(nodes.map(n => n.id === targetJob.assignedNodeId ? {
        ...n,
        status: 'AVAILABLE',
        currentJobId: undefined,
        currentJobName: undefined,
        gpuUtilPercent: 0,
      } : n));
    }
  };

  // STANDARD WORKFLOW HANDLERS
  const handleCreateProject = (newProjData: Omit<Project, 'id' | 'createdAt' | 'jobCount' | 'ownerId'>) => {
    const newId = `proj-0${projects.length + 1}`;
    const newProj: Project = {
      ...newProjData,
      id: newId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      jobCount: 0,
      ownerId: currentUser.id,
    };
    setProjects([newProj, ...projects]);
  };

  const handleSubmitJob = (jobData: Omit<TrainingJob, 'id' | 'createdAt' | 'status' | 'progress'>) => {
    const newId = `job-${900 + jobs.length + 1}`;
    const targetNode = nodes.find(n => n.status === 'AVAILABLE') || nodes[0];

    const newJob: TrainingJob = {
      ...jobData,
      id: newId,
      status: 'RUNNING',
      progress: 5,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assignedNodeId: targetNode.id,
      totalCost: 0,
      userId: currentUser.id,
    };

    setJobs([newJob, ...jobs]);

    setNodes(nodes.map(n => n.id === targetNode.id ? {
      ...n,
      status: 'BUSY',
      currentJobId: newId,
      currentJobName: jobData.name,
      gpuUtilPercent: 92,
    } : n));

    setProjects(projects.map(p => p.id === jobData.projectId ? { ...p, jobCount: p.jobCount + 1 } : p));
  };

  const handleCancelJob = (jobId: string) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const actualElapsedHours = 1.0;
    const actualUsageFee = Math.round(actualElapsedHours * targetJob.costPerHour * targetJob.gpuCount);

    setCurrentUser(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - actualUsageFee) } : prev);
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, balance: Math.max(0, u.balance - actualUsageFee) } : u));

    const newTx: Transaction = {
      id: `tx-${1000 + transactions.length + 1}`,
      userId: currentUser.id,
      type: 'GPU_USAGE',
      amount: -actualUsageFee,
      currency: 'VND',
      status: 'SUCCESS',
      paymentMethod: 'System',
      referenceCode: `BILL-${targetJob.id}`,
      description: `Phí thuê GPU thực tế cho ${targetJob.name} (${actualElapsedHours}h)`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions([newTx, ...transactions]);

    setJobs(jobs.map(j => j.id === jobId ? {
      ...j,
      status: 'COMPLETED',
      totalCost: actualUsageFee,
      progress: 100,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    } : j));

    if (targetJob.assignedNodeId) {
      setNodes(nodes.map(n => n.id === targetJob.assignedNodeId ? {
        ...n,
        status: 'AVAILABLE',
        currentJobId: undefined,
        currentJobName: undefined,
        gpuUtilPercent: 0,
      } : n));
    }
  };

  const handleTopUp = (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo') => {
    setCurrentUser(prev => prev ? { ...prev, balance: prev.balance + amount } : prev);
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, balance: u.balance + amount } : u));

    const newTx: Transaction = {
      id: `tx-${1000 + transactions.length + 1}`,
      userId: currentUser.id,
      type: 'DEPOSIT',
      amount: amount,
      currency: 'VND',
      status: 'SUCCESS',
      paymentMethod: method,
      referenceCode: `${method.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      description: `Nạp tiền qua ${method}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleToggleNodeStatus = (nodeId: string) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: n.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE',
        };
      }
      return n;
    }));
  };

  // Router logic
  const renderContent = () => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        return (
          <ProjectDetail
            project={proj}
            jobs={jobs}
            onBack={() => setSelectedProjectId(null)}
            onNavigate={handleNavigate}
          />
        );
      }
    }

    if (currentPath.startsWith('/jobs/')) {
      const jobId = currentPath.split('/jobs/')[1];
      if (jobId && jobId !== 'new') {
        const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
        return (
          <JobMonitor
            job={targetJob}
            onBack={() => handleNavigate('/jobs')}
            onCancelJob={handleCancelJob}
          />
        );
      }
    }

    switch (currentPath) {
      case '/dashboard':
        return <Dashboard metrics={metrics} jobs={jobs} nodes={nodes} onNavigate={handleNavigate} />;
      case '/projects':
        return (
          <Projects
            projects={projects}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onCreateProject={handleCreateProject}
          />
        );
      case '/jobs/new':
        return (
          <SubmitJob
            projects={projects}
            onSubmitJob={handleSubmitJob}
            onNavigate={handleNavigate}
            userBalance={currentUser.balance}
          />
        );
      case '/jobs':
        return <JobsList jobs={jobs} onNavigate={handleNavigate} onCancelJob={handleCancelJob} />;
      case '/resources':
        return <ResourceCluster nodes={nodes} />;
      case '/billing':
        return (
          <BillingWallet
            balance={currentUser.balance}
            transactions={transactions}
            onTopUp={handleTopUp}
          />
        );
      case '/admin':
        return (
          <AdminConsole
            nodes={nodes}
            users={users}
            jobs={jobs}
            transactions={transactions}
            gpuPricing={gpuPricing}
            onToggleNodeStatus={handleToggleNodeStatus}
            onUpdateUserRole={handleUpdateUserRole}
            onAdjustUserBalance={handleAdjustUserBalance}
            onToggleUserStatus={handleToggleUserStatus}
            onUpdateGpuPricing={handleUpdateGpuPricing}
            onForceKillJob={handleForceKillJob}
          />
        );
      default:
        return <Dashboard metrics={metrics} jobs={jobs} nodes={nodes} onNavigate={handleNavigate} />;
    }
  };

  return (
    <Shell currentPath={currentPath} onNavigate={handleNavigate} onLogout={handleLogout} user={currentUser}>
      {renderContent()}
    </Shell>
  );
}
