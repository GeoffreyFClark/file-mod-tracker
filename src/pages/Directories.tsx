// Dashboard.tsx
import React from 'react';

const Directories: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Row with three equally sized boxes */}
      <div className="flex justify-between gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 1
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 2
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 3
        </div>
      </div>
      <div className="flex justify-between gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 4
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 5
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 6
        </div>
      </div>
      <div className="flex justify-between gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 7
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 8
        </div>
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Content 9
        </div>
      </div>

    </div>
  );
};

export default Directories;
