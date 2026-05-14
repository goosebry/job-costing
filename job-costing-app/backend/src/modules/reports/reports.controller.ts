import { Response } from 'express';
import { reportsService } from './reports.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class ReportsController {
  async getExecutiveSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { startDate, endDate } = req.query;
    const report = await reportsService.getExecutiveSummary(req.user.organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(report);
  }

  async getJobCostReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { jobId } = req.params;
    const report = await reportsService.getJobCostSummary(jobId, req.user.organizationId);
    res.json(report);
  }

  async getProfitabilityReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { startDate, endDate, jobId } = req.query;
    const report = await reportsService.getProfitabilityReport(req.user.organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
      jobId: jobId as string,
    });
    res.json(report);
  }

  async getLaborUtilization(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { startDate, endDate } = req.query;
    const report = await reportsService.getLaborUtilization(req.user.organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(report);
  }

  async getCashFlowReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { startDate, endDate } = req.query;
    const report = await reportsService.getCashFlowReport(req.user.organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });
    res.json(report);
  }

  async exportReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { format } = req.query;
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const data = await reportsService.getExecutiveSummary(req.user.organizationId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      const json = JSON.stringify(data, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.json"`);
      res.send(json);
    } else {
      res.json(data);
    }
  }

  private convertToCSV(data: any): string {
    if (!data.jobs || data.jobs.length === 0) {
      return 'No data available';
    }

    const headers = Object.keys(data.jobs[0]);
    const rows = data.jobs.map((job: any) =>
      headers.map(header => {
        const value = job[header];
        if (typeof value === 'number') {
          return value.toFixed(2);
        }
        return JSON.stringify(value ?? '');
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

export const reportsController = new ReportsController();