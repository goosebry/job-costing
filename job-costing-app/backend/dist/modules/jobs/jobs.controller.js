"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsController = exports.JobsController = void 0;
const jobs_service_1 = require("./jobs.service");
class JobsController {
    async create(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const job = await jobs_service_1.jobsService.create(req.body, req.user.organizationId, req.user.userId);
        res.status(201).json(job);
    }
    async findAll(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { status, search, page, limit } = req.query;
        const result = await jobs_service_1.jobsService.findAll(req.user.organizationId, {
            status: status,
            search: search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json(result);
    }
    async findOne(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const job = await jobs_service_1.jobsService.findOne(id, req.user.organizationId);
        res.json(job);
    }
    async update(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const job = await jobs_service_1.jobsService.update(id, req.user.organizationId, req.body);
        res.json(job);
    }
    async delete(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        await jobs_service_1.jobsService.delete(id, req.user.organizationId);
        res.json({ message: 'Job deleted successfully' });
    }
    async getTemplates(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const templates = await jobs_service_1.jobsService.getTemplates(req.user.organizationId);
        res.json(templates);
    }
    async applyTemplate(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const { templateId } = req.body;
        const job = await jobs_service_1.jobsService.applyTemplate(id, templateId, req.user.organizationId);
        res.json(job);
    }
}
exports.JobsController = JobsController;
exports.jobsController = new JobsController();
//# sourceMappingURL=jobs.controller.js.map