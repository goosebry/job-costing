"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costsController = exports.CostsController = void 0;
const costs_service_1 = require("./costs.service");
class CostsController {
    async create(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const cost = await costs_service_1.costsService.create(req.body, req.user.organizationId, req.user.userId);
        res.status(201).json(cost);
    }
    async findAllByJob(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const { categoryId, startDate, endDate } = req.query;
        const costs = await costs_service_1.costsService.findAllByJob(jobId, req.user.organizationId, {
            categoryId: categoryId,
            startDate: startDate,
            endDate: endDate,
        });
        res.json(costs);
    }
    async update(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const cost = await costs_service_1.costsService.update(id, req.user.organizationId, req.body);
        res.json(cost);
    }
    async delete(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        await costs_service_1.costsService.delete(id, req.user.organizationId);
        res.json({ message: 'Cost entry deleted successfully' });
    }
    async getCategories(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const categories = await costs_service_1.costsService.getCategories(req.user.organizationId);
        res.json(categories);
    }
    async createCategory(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const category = await costs_service_1.costsService.createCategory(req.user.organizationId, req.body);
        res.status(201).json(category);
    }
}
exports.CostsController = CostsController;
exports.costsController = new CostsController();
//# sourceMappingURL=costs.controller.js.map