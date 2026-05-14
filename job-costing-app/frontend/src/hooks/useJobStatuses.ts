import { useQuery } from '@tanstack/react-query';
import { jobStatusesService, JobStatus } from '../services/job-statuses.service';

const FALLBACK_STATUSES: JobStatus[] = [
  { id: '1', value: 'DRAFT',     label: 'Draft',       color: '#6b7280', order: 0 },
  { id: '2', value: 'ACTIVE',    label: 'Active',      color: '#3b82f6', order: 1 },
  { id: '3', value: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b', order: 2 },
  { id: '4', value: 'ON_HOLD',   label: 'On Hold',     color: '#f59e0b', order: 3 },
  { id: '5', value: 'COMPLETED', label: 'Completed',   color: '#10b981', order: 4 },
  { id: '6', value: 'CANCELLED', label: 'Cancelled',   color: '#ef4444', order: 5 },
];

export function useJobStatuses() {
  const { data, isLoading } = useQuery({
    queryKey: ['job-statuses'],
    queryFn: jobStatusesService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const statuses = data ?? FALLBACK_STATUSES;

  /** Find the display label for a raw value like "DRAFT" */
  const getLabel = (value: string) =>
    statuses.find(s => s.value === value)?.label ?? value;

  /** Get badge style for a status value — returns inline style object */
  const getBadgeStyle = (value: string) => {
    const status = statuses.find(s => s.value === value);
    const color = status?.color ?? '#6b7280';
    return {
      backgroundColor: `${color}22`,  // 13% opacity background
      color,
      borderColor: `${color}44`,
    };
  };

  return { statuses, isLoading, getLabel, getBadgeStyle };
}
