// src/data/dashboardData.ts
import { Stat } from '../components/DashboardStats';

export const DashboardData: Stat[] = [
  { name: 'Monitored Directories', stat: '15', change: 5.4, buttonText: 'View', destination: 'Directories' },
  { name: 'Changes (Last 24h)', stat: '1234', change: -3.2, buttonText: 'Inspect', destination: 'Logs' },
  { name: 'Detections (Last 24h)', stat: '20', change: 12.5, buttonText: 'Investigate', destination: 'Detections' },
];