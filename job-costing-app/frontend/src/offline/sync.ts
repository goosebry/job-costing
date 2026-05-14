import Dexie, { Table } from 'dexie';

export interface OfflineJob {
  id?: string;
  localId: string;
  jobNumber: number;
  name: string;
  description?: string;
  status: string;
  customerName?: string;
  startDate: string;
  endDate?: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface OfflineCostEntry {
  id?: string;
  localId: string;
  jobId: string;
  categoryId: string;
  costCodeId?: string;
  description?: string;
  amount: number;
  vendor?: string;
  invoiceNumber?: string;
  submittedById: string;
  organizationId: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface OfflineLaborEntry {
  id?: string;
  localId: string;
  jobId: string;
  userId: string;
  date: string;
  hoursWorked: number;
  hoursTravel: number;
  hourlyRate?: number;
  lumpSum?: number;
  notes?: string;
  approvalStatus: string;
  organizationId: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

class JobCostingDatabase extends Dexie {
  jobs!: Table<OfflineJob>;
  costEntries!: Table<OfflineCostEntry>;
  laborEntries!: Table<OfflineLaborEntry>;

  constructor() {
    super('JobCostingOffline');

    this.version(1).stores({
      jobs: '++localId, id, status, syncStatus, createdAt',
      costEntries: '++localId, id, jobId, syncStatus, createdAt',
      laborEntries: '++localId, id, jobId, syncStatus, date',
    });
  }
}

export const offlineDb = new JobCostingDatabase();

// Offline sync service
export class OfflineSyncService {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.syncPendingChanges();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  async syncPendingChanges() {
    if (!this.isOnline) return;

    try {
      // Sync pending jobs
      const pendingJobs = await offlineDb.jobs.where('syncStatus').equals('pending').toArray();
      for (const job of pendingJobs) {
        await this.syncJob(job);
      }

      // Sync pending cost entries
      const pendingCosts = await offlineDb.costEntries.where('syncStatus').equals('pending').toArray();
      for (const cost of pendingCosts) {
        await this.syncCostEntry(cost);
      }

      // Sync pending labor entries
      const pendingLabor = await offlineDb.laborEntries.where('syncStatus').equals('pending').toArray();
      for (const labor of pendingLabor) {
        await this.syncLaborEntry(labor);
      }
    } catch (error) {
      console.error('Offline sync failed:', error);
    }
  }

  private async syncJob(job: OfflineJob) {
    try {
      const { jobsApi } = await import('@/services/api');
      if (!job.id) {
        const response = await jobsApi.create({
          name: job.name,
          description: job.description,
          status: job.status,
          customerName: job.customerName,
          startDate: job.startDate,
          endDate: job.endDate,
        });
        await offlineDb.jobs.update(job.localId, {
          id: response.data.data.id,
          syncStatus: 'synced',
        });
      } else {
        await jobsApi.update(job.id, {
          name: job.name,
          description: job.description,
          status: job.status,
        });
        await offlineDb.jobs.update(job.localId, { syncStatus: 'synced' });
      }
    } catch (error) {
      await offlineDb.jobs.update(job.localId, { syncStatus: 'error' });
    }
  }

  private async syncCostEntry(entry: OfflineCostEntry) {
    try {
      const { costsApi } = await import('@/services/api');
      if (!entry.id) {
        const response = await costsApi.create({
          jobId: entry.jobId,
          categoryId: entry.categoryId,
          costCodeId: entry.costCodeId,
          description: entry.description,
          amount: entry.amount,
          vendor: entry.vendor,
          invoiceNumber: entry.invoiceNumber,
        });
        await offlineDb.costEntries.update(entry.localId, {
          id: response.data.data.id,
          syncStatus: 'synced',
        });
      }
    } catch (error) {
      await offlineDb.costEntries.update(entry.localId, { syncStatus: 'error' });
    }
  }

  private async syncLaborEntry(entry: OfflineLaborEntry) {
    try {
      const { laborApi } = await import('@/services/api');
      if (!entry.id) {
        const response = await laborApi.create({
          jobId: entry.jobId,
          date: entry.date,
          hoursWorked: entry.hoursWorked,
          hoursTravel: entry.hoursTravel,
          hourlyRate: entry.hourlyRate,
          lumpSum: entry.lumpSum,
          notes: entry.notes,
        });
        await offlineDb.laborEntries.update(entry.localId, {
          id: response.data.data.id,
          syncStatus: 'synced',
        });
      }
    } catch (error) {
      await offlineDb.laborEntries.update(entry.localId, { syncStatus: 'error' });
    }
  }

  async addPendingJob(job: Omit<OfflineJob, 'localId' | 'syncStatus' | 'createdAt' | 'updatedAt'>) {
    const localId = crypto.randomUUID();
    await offlineDb.jobs.add({
      ...job,
      localId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: this.isOnline ? 'pending' : 'pending',
    });
    if (this.isOnline) {
      this.syncPendingChanges();
    }
    return localId;
  }

  async addPendingCostEntry(entry: Omit<OfflineCostEntry, 'localId' | 'syncStatus' | 'createdAt'>) {
    const localId = crypto.randomUUID();
    await offlineDb.costEntries.add({
      ...entry,
      localId,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    });
    if (this.isOnline) {
      this.syncPendingChanges();
    }
    return localId;
  }

  async addPendingLaborEntry(entry: Omit<OfflineLaborEntry, 'localId' | 'syncStatus' | 'createdAt' | 'approvalStatus'>) {
    const localId = crypto.randomUUID();
    await offlineDb.laborEntries.add({
      ...entry,
      localId,
      createdAt: new Date().toISOString(),
      approvalStatus: 'PENDING',
      syncStatus: 'pending',
    });
    if (this.isOnline) {
      this.syncPendingChanges();
    }
    return localId;
  }
}

export const offlineSync = new OfflineSyncService();