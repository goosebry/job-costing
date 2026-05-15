"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetController = exports.BudgetController = void 0;
const budget_service_1 = require("./budget.service");
class BudgetController {
    async getBudgetSummary(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const summary = await budget_service_1.budgetService.getBudgetSummary(jobId, req.user.organizationId);
        res.json(summary);
    }
    async getCostSummary(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { jobId } = req.params;
        const summary = await budget_service_1.budgetService.getJobCostSummary(jobId, req.user.organizationId);
        res.json(summary);
    }
}
exports.BudgetController = BudgetController;
exports.budgetController = new BudgetController();
//# sourceMappingURL=budget.controller.js.map