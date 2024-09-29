import { useState, useEffect } from 'react';
import { log } from '../utils/types';

export const useSearch = (logs: log[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredlogs] = useState<log[]>(logs);

  useEffect(() => {
    const results = logs.filter(log =>
      log.Path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredlogs(results);
  }, [searchTerm, logs]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return { searchTerm, filteredLogs, handleSearch };
};