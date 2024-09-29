import React from 'react';

interface Tab {
  name: string;
  current: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface TabsProps {
  tabs: Tab[];
  onTabChange: (tabName: string) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Tabs: React.FC<TabsProps> = ({ tabs, onTabChange }) => {
  return (
    <div>
      {/* Mobile View */}
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          defaultValue={tabs.find((tab) => tab.current)?.name}
          onChange={(e) => onTabChange(e.target.value)}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      
      {/* Desktop View */}
      <div className="hidden sm:block">
        <nav className="isolate flex divide-x divide-gray-200 rounded-lg shadow" aria-label="Tabs">
          {tabs.map((tab, tabIdx) => (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              className={classNames(
                tab.current ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                tabIdx === 0 ? 'rounded-l-lg' : '',
                tabIdx === tabs.length - 1 ? 'rounded-r-lg' : '',
                'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 flex items-center justify-center'
              )}
              aria-current={tab.current ? 'page' : undefined}
            >
              <tab.icon
                className={classNames(
                  tab.current ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-700',
                  'h-5 w-5 mr-2.5'
                )}
                aria-hidden="true"
              />
              <span>{tab.name}</span>
              <span
                aria-hidden="true"
                className={classNames(
                  tab.current ? 'bg-indigo-500' : 'bg-transparent',
                  'absolute inset-x-0 bottom-0 h-0.5'
                )}
              />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Tabs;
