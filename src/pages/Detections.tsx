// Detections.tsx
import React from 'react';

const Detections: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Row 1 */}
      <div className="flex gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Detection
        </div>

        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Explanation
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Detection
        </div>

        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Explanation
        </div>
      </div>

      {/* Row 3 */}
      <div className="flex gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Detection
        </div>

        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Explanation
        </div>
      </div>

      {/* Row 4 */}
      <div className="flex gap-4">
        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Detection
        </div>

        <div className="flex-1 border-dashed border-2 border-gray-300 h-40 flex items-center justify-center">
          Explanation
        </div>
      </div>
    </div>
  );
};

export default Detections;
