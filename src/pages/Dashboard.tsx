import React from 'react';
import TabbedPageLayout from '../components/Tabs';

const Layout = () => {
  return (
    <div
      className="flex flex-col gap-6 pb-6 overflow-hidden"
      style={{ height: 'calc(100vh - 177px)' }}
    >
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <div className="flex-[3] h-full bg-app rounded-lg shadow p-6 overflow-none">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">Coming Soon</span>
          </div>
        </div>
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-none">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">Coming Soon</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-none">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">Coming Soon</span>
          </div>
        </div>
        <div className="flex-1 h-full bg-app rounded-lg shadow p-6 overflow-none">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-500">Coming Soon</span>
          </div>
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
          content: <Layout/>
        },
        {
          label: "Registry",
          content: <Layout/>
        }
      ]}
    />
  );
};

export default Dashboard;