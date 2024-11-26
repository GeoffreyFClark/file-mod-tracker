import React from 'react';
import TabbedPageLayout from '../components/Tabs';

const Detections: React.FC = () => {
  return (
    <TabbedPageLayout
      title="Detections"
      tabs={[
        {
          label: "File System",
          content: <></>
        },
        {
          label: "Registry",
          content: <></>
        }
      ]}
    />
  );
};

export default Detections;