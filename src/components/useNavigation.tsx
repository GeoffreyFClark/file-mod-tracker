import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const ExampleComponent: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div>
      <h1>Example Component</h1>
      <button 
        onClick={() => navigateTo('Logs')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go to Logs
      </button>
      <button 
        onClick={() => navigateTo('Settings')}
        className="ml-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Go to Settings
      </button>
    </div>
  );
};

export default ExampleComponent;