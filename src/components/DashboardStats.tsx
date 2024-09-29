import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

export type Stat = {
  name: string;
  stat: string;
  change: number;
  buttonText: string;
  destination: string;
};

interface DashboardStatsProps {
  stats: Stat[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { navigateTo } = useNavigation();

  const handleNavigation = (destination: string) => {
    navigateTo(destination);
  };

  return (
    <div>
      <h3 className="text-base font-semibold leading-6 text-gray-900">Last 24 hours</h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
              <dd className="mt-1 flex items-baseline justify-between">
                <div className="text-3xl font-semibold tracking-tight text-gray-900">{item.stat}</div>
                <div className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${
                  item.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.change >= 0 ? (
                    <svg className="h-5 w-5 flex-shrink-0 self-center text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 flex-shrink-0 self-center text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="sr-only">{item.change >= 0 ? 'Increased' : 'Decreased'} by</span>
                  {Math.abs(item.change).toFixed(1)}%
                </div>
              </dd>
            </div>
            <div className="border-t border-gray-200">
              <button 
                onClick={() => handleNavigation(item.destination)}
                className="dashboardAction block w-full px-4 py-4 sm:px-6 text-sm text-gray-600 hover:bg-gray-50 text-left"
              >
                <div className="flex justify-between items-center">
                  {item.buttonText}
                  <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default DashboardStats;