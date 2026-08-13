import React, { useState } from 'react';
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
  mockUser, 
  mockProjects, 
  mockJobs, 
  mockNodes, 
  mockTransactions, 
  mockClusterMetrics 
} from './data/mockData';
import { User, Project, TrainingJob, GPUNode, Transaction } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUser);
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // State entities
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [jobs, setJobs] = useState<TrainingJob[]>(mockJobs);
  const [nodes, setNodes] = useState<GPUNode[]>(mockNodes);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [metrics, setMetrics] = useState(mockClusterMetrics);

  if (!currentUser) {
    return <Auth onLogin={(user) => { setCurrentUser(user); setCurrentPath('/dashboard'); }} />;
  }

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (!path.startsWith('/projects/')) {
      setSelectedProjectId(null);
    }
  };

  // Handlers
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
    const newJob: TrainingJob = {
      ...jobData,
      id: newId,
      status: 'QUEUED',
      progress: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setJobs([newJob, ...jobs]);
    setCurrentUser(prev => prev ? { ...prev, balance: prev.balance - jobData.totalCost } : prev);
    
    // Add usage transaction
    const newTx: Transaction = {
      id: `tx-${1000 + transactions.length + 1}`,
      userId: currentUser.id,
      type: 'GPU_USAGE',
      amount: -jobData.totalCost,
      currency: 'USD',
      status: 'SUCCESS',
      paymentMethod: 'System',
      referenceCode: `BILL-${newId}`,
      description: `GPU usage pre-authorization for ${jobData.name}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions([newTx, ...transactions]);

    // Update project job count
    setProjects(projects.map(p => p.id === jobData.projectId ? { ...p, jobCount: p.jobCount + 1 } : p));
  };

  const handleTopUp = (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo') => {
    setCurrentUser(prev => prev ? { ...prev, balance: prev.balance + amount } : prev);
    const newTx: Transaction = {
      id: `tx-${1000 + transactions.length + 1}`,
      userId: currentUser.id,
      type: 'DEPOSIT',
      amount: amount,
      currency: 'USD',
      status: 'SUCCESS',
      paymentMethod: method,
      referenceCode: `${method.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      description: `Deposit via ${method} Gateway`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions([newTx, ...transactions]);
  };

  const handleCancelJob = (jobId: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'FAILED', progress: j.progress } : j));
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
        return <JobsList jobs={jobs} onNavigate={handleNavigate} />;
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
        return <AdminConsole nodes={nodes} onToggleNodeStatus={handleToggleNodeStatus} />;
      default:
        return <Dashboard metrics={metrics} jobs={jobs} nodes={nodes} onNavigate={handleNavigate} />;
    }
  };

  return (
    <Shell currentPath={currentPath} onNavigate={handleNavigate} user={currentUser}>
      {renderContent()}
    </Shell>
  );
}
