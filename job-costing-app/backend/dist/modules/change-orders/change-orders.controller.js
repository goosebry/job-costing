"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeOrdersController = exports.ChangeOrdersController = void 0;
const change_orders_service_1 = require("./change-orders.service");
class ChangeOrdersController {
    async create(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const changeOrder = await change_orders_service_1.changeOrdersService.create(req.body, req.user.organizationId, req.user.userId);
        res.status(201).json(changeOrder);
    }
    async findAllByJob(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const changeOrders = await change_orders_service_1.changeOrdersService.findAllByJob(jobId, req.user.organizationId);
        res.json(changeOrders);
    }
    async approve(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const changeOrder = await change_orders_service_1.changeOrdersService.approve(id, req.user.organizationId, req.user.userId, req.body);
        res.json(changeOrder);
    }
}
exports.ChangeOrdersController = ChangeOrdersController;
exports.changeOrdersController = new ChangeOrdersController();
//# sourceMappingURL=change-orders.controller.js.map