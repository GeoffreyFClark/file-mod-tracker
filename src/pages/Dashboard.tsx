import React from 'react';
import DashboardStats from '../components/DashboardStats';
import Investigate from '../components/Investigate';
import ChangesChart from '../components/ChangesChart';
import DetectionsChart from '../components/DetectionsChart';
import NewStatsCards from '../components/NewStatsCards';

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {/* Stats and other content */}
        <DashboardStats />

        {/* Full-width charts with gap */}
        <div className="flex flex-col gap-4">
          {/* Ensure ChangesChart takes full width */}
          <div className="w-full">
            <ChangesChart />
          </div>

          {/* Ensure DetectionsChart also takes full width */}
          <div className="w-full">
            <DetectionsChart />
          </div>
        </div>

        {/* Additional content */}
        <Investigate />
      </div>
    </>
  );
};

export default Dashboard;
