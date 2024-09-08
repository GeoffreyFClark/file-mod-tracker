import React from 'react';

const Investigate: React.FC = () => {
  return (
    <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 ">Suspicious Activity</h3>
        <div className="mt-2 sm:flex sm:items-start sm:justify-between">
            <div className="max-w-xl text-sm text-gray-500">
            <p>
                Unusual patterns of deletion and modification have been detected in monitored directories since you last used the application.
            </p>
            </div>
            <div className="mt-5 sm:ml-6 sm:mt-0 sm:flex sm:flex-shrink-0 sm:items-center">
            <button
                type="button"
                className="inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
                Investigate
            </button>
            </div>
        </div>
        </div>
  </div>
  )
};

export default Investigate;
