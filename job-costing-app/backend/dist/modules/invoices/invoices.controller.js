"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesController = exports.InvoicesController = void 0;
const invoices_service_1 = require("./invoices.service");
class InvoicesController {
    async create(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const invoice = await invoices_service_1.invoicesService.create(req.body, req.user.organizationId);
        res.status(201).json(invoice);
    }
    async findAll(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { status, jobId, page, limit } = req.query;
        const result = await invoices_service_1.invoicesService.findAll(req.user.organizationId, {
            status: status,
            jobId: jobId,
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
        const invoice = await invoices_service_1.invoicesService.findOne(id, req.user.organizationId);
        res.json(invoice);
    }
    async update(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { id } = req.params;
        const invoice = await invoices_service_1.invoicesService.update(id, req.user.organizationId, req.body);
        res.json(invoice);
    }
}
exports.InvoicesController = InvoicesController;
exports.invoicesController = new InvoicesController();
//# sourceMappingURL=invoices.controller.js.map