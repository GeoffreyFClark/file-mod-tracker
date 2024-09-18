import React from 'react';

import DashboardStats from '../components/DashboardStats';
import { DashboardData } from '../data/dashboardData';

import ChangesChart from '../components/ChangesChart';
// import ChangesData from '../data/ChangesData';
import DetectionsChart from '../components/DetectionsChart';
// import DetectionsData from '../data/DetectionsData';

import Investigate from '../components/Investigate';

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="flex flex-col gap-4 p-4">

        <DashboardStats stats={DashboardData} />

        <div className="flex flex-col gap-4">

          <div className="w-full">
            <ChangesChart />
          </div>

          <div className="w-full">
            <DetectionsChart />
          </div>

        </div>

        <Investigate />
      </div>
    </>
  );
};

export default Dashboard;
