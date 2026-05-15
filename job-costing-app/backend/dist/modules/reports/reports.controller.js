"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
class ReportsController {
    async getExecutiveSummary(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { startDate, endDate } = req.query;
        const report = await reports_service_1.reportsService.getExecutiveSummary(req.user.organizationId, {
            startDate: startDate,
            endDate: endDate,
        });
        res.json(report);
    }
    async getJobCostReport(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const report = await reports_service_1.reportsService.getJobCostSummary(jobId, req.user.organizationId);
        res.json(report);
    }
    async getProfitabilityReport(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { startDate, endDate, jobId } = req.query;
        const report = await reports_service_1.reportsService.getProfitabilityReport(req.user.organizationId, {
            startDate: startDate,
            endDate: endDate,
            jobId: jobId,
        });
        res.json(report);
    }
    async getLaborUtilization(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { startDate, endDate } = req.query;
        const report = await reports_service_1.reportsService.getLaborUtilization(req.user.organizationId, {
            startDate: startDate,
            endDate: endDate,
        });
        res.json(report);
    }
    async getCashFlowReport(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { startDate, endDate } = req.query;
        const report = await reports_service_1.reportsService.getCashFlowReport(req.user.organizationId, {
            startDate: startDate,
            endDate: endDate,
        });
        res.json(report);
    }
    async exportReport(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { format } = req.query;
        const { type } = req.params;
        const { startDate, endDate } = req.query;
        const data = await reports_service_1.reportsService.getExecutiveSummary(req.user.organizationId, {
            startDate: startDate,
            endDate: endDate,
        });
        if (format === 'csv') {
            const csv = this.convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
            res.send(csv);
        }
        else if (format === 'pdf') {
            const json = JSON.stringify(data, null, 2);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report.json"`);
            res.send(json);
        }
        else {
            res.json(data);
        }
    }
    convertToCSV(data) {
        if (!data.jobs || data.jobs.length === 0) {
            return 'No data available';
        }
        const headers = Object.keys(data.jobs[0]);
        const rows = data.jobs.map((job) => headers.map(header => {
            const value = job[header];
            if (typeof value === 'number') {
                return value.toFixed(2);
            }
            return JSON.stringify(value ?? '');
        }).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
//# sourceMappingURL=reports.controller.js.map