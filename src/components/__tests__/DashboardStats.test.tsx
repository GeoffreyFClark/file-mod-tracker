import { render, screen, fireEvent } from '@testing-library/react';
import DashboardStats, { Stat } from '../DashboardStats';
import { useNavigation } from '../../contexts/NavigationContext';

// Mock useNavigation hook
jest.mock('../../contexts/NavigationContext', () => ({
  useNavigation: jest.fn(),
}));

describe('DashboardStats', () => {
  const mockNavigateTo = jest.fn();

  const mockStats: Stat[] = [
    { name: 'Stat 1', stat: '100', change: 5.4, buttonText: 'View', destination: 'Page1' },
    { name: 'Stat 2', stat: '200', change: -3.2, buttonText: 'Inspect', destination: 'Page2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigateTo: mockNavigateTo });
  });

  it('renders the correct number of stat items', () => {
    render(<DashboardStats stats={mockStats} />);
    const statItems = screen.getAllByRole('button');
    expect(statItems).toHaveLength(mockStats.length);
  });

  it('displays the correct stat names and values', () => {
    render(<DashboardStats stats={mockStats} />);
    mockStats.forEach(stat => {
      expect(screen.getByText(stat.name)).toBeInTheDocument();
      expect(screen.getByText(stat.stat)).toBeInTheDocument();
    });
  });

  it('applies correct styling for positive and negative changes', () => {
    render(<DashboardStats stats={mockStats} />);
    
    const positiveChange = screen.getByText('5.4%');
    expect(positiveChange).toHaveClass('bg-green-100');
    expect(positiveChange).toHaveClass('text-green-800');

    const negativeChange = screen.getByText('3.2%');
    expect(negativeChange).toHaveClass('bg-red-100');
    expect(negativeChange).toHaveClass('text-red-800');
  });

  it('calls navigateTo with correct destination when button is clicked', () => {
    render(<DashboardStats stats={mockStats} />);
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);
    expect(mockNavigateTo).toHaveBeenCalledWith('Page1');

    const inspectButton = screen.getByText('Inspect');
    fireEvent.click(inspectButton);
    expect(mockNavigateTo).toHaveBeenCalledWith('Page2');
  });
});
