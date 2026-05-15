"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.laborController = exports.LaborController = void 0;
const labor_service_1 = require("./labor.service");
class LaborController {
    async create(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const labor = await labor_service_1.laborService.create(req.body, req.user.organizationId, req.user.userId);
        res.status(201).json(labor);
    }
    async findAllByJob(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const labor = await labor_service_1.laborService.findAllByJob(jobId, req.user.organizationId);
        res.json(labor);
    }
    async update(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const labor = await labor_service_1.laborService.update(id, req.user.organizationId, req.body);
        res.json(labor);
    }
    async delete(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        await labor_service_1.laborService.delete(id, req.user.organizationId);
        res.json({ message: 'Labor entry deleted successfully' });
    }
}
exports.LaborController = LaborController;
exports.laborController = new LaborController();
//# sourceMappingURL=labor.controller.js.map