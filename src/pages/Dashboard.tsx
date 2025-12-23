import React from 'react';
import TabbedPageLayout from '../components/Tabs';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import ActivityStatsCard from '../components/dashboard/ActivityStatsCard';
import MonitoredPathsCard from '../components/dashboard/MonitoredPathsCard';
import SystemStatusCard from '../components/dashboard/SystemStatusCard';

interface DashboardLayoutProps {
  mode: 'file' | 'registry';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ mode }) => {
  return (
    <div
      className="flex flex-col gap-6 pb-6 overflow-hidden"
      style={{ height: 'calc(100vh - 177px)' }}
    >
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <div className="flex-[3] h-full bg-app rounded-lg shadow p-6 overflow-hidden">
          <RecentActivityFeed mode={mode} />
        </div>
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-hidden">
          <ActivityStatsCard mode={mode} />
        </div>
      </div>
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-hidden">
          <MonitoredPathsCard mode={mode} />
        </div>
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-hidden">
          <SystemStatusCard />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <TabbedPageLayout
      title="Home"
      tabs={[
        {
          label: "File System",
          content: <DashboardLayout mode="file" />
        },
        {
          label: "Registry",
          content: <DashboardLayout mode="registry" />
        }
      ]}
    />
  );
};

export default Dashboard;
