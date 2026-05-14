import Dexie, { Table } from 'dexie';

export interface OfflineJob {
  id?: number;
  jobId: string;
  data: any;
  synced: string; // Stored as string 'true'/'false' for Dexie indexing
  syncedAt?: Date;
  createdAt: Date;
}

export interface OfflineCost {
  id?: number;
  costId: string;
  data: any;
  synced: string; // Stored as string 'true'/'false' for Dexie indexing
  syncedAt?: Date;
  createdAt: Date;
}

export interface OfflineLabor {
  id?: number;
  laborId: string;
  data: any;
  synced: string; // Stored as string 'true'/'false' for Dexie indexing
  syncedAt?: Date;
  createdAt: Date;
}

class JobCostingDB extends Dexie {
  jobs!: Table<OfflineJob>;
  costs!: Table<OfflineCost>;
  labor!: Table<OfflineLabor>;

  constructor() {
    super('JobCostingDB');
    this.version(1).stores({
      jobs: '++id, jobId, synced, createdAt',
      costs: '++id, costId, synced, createdAt',
      labor: '++id, laborId, synced, createdAt',
    });
  }
}

export const db = new JobCostingDB();

export const offlineService = {
  async saveJobOffline(jobId: string, data: any): Promise<void> {
    await db.jobs.add({ jobId, data, synced: 'false', createdAt: new Date() });
  },

  async saveCostOffline(costId: string, data: any): Promise<void> {
    await db.costs.add({ costId, data, synced: 'false', createdAt: new Date() });
  },

  async saveLaborOffline(laborId: string, data: any): Promise<void> {
    await db.labor.add({ laborId, data, synced: 'false', createdAt: new Date() });
  },

  async getUnsyncedJobs(): Promise<OfflineJob[]> {
    return db.jobs.where('synced').equals('false').toArray();
  },

  async getUnsyncedCosts(): Promise<OfflineCost[]> {
    return db.costs.where('synced').equals('false').toArray();
  },

  async getUnsyncedLabor(): Promise<OfflineLabor[]> {
    return db.labor.where('synced').equals('false').toArray();
  },

  async markJobSynced(jobId: string): Promise<void> {
    await db.jobs.where('jobId').equals(jobId).modify({ synced: 'true', syncedAt: new Date() });
  },

  async markCostSynced(costId: string): Promise<void> {
    await db.costs.where('costId').equals(costId).modify({ synced: 'true', syncedAt: new Date() });
  },

  async markLaborSynced(laborId: string): Promise<void> {
    await db.labor.where('laborId').equals(laborId).modify({ synced: 'true', syncedAt: new Date() });
  },

  async clearSyncedRecords(): Promise<void> {
    await Promise.all([
      db.jobs.where('synced').equals('true').delete(),
      db.costs.where('synced').equals('true').delete(),
      db.labor.where('synced').equals('true').delete(),
    ]);
  },
};