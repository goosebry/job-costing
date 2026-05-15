import { CreateCostInput } from './dto/create-cost.schema';
import { UpdateCostInput } from './dto/update-cost.schema';
export declare class CostsService {
    create(data: CreateCostInput, organizationId: string, userId: string): Promise<any>;
    findAllByJob(jobId: string, organizationId: string, filters?: {
        categoryId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    update(id: string, organizationId: string, data: UpdateCostInput): Promise<any>;
    delete(id: string, organizationId: string): Promise<void>;
    getCategories(organizationId: string): Promise<any>;
    createCategory(organizationId: string, data: {
        name: string;
        description?: string;
        unitType: string;
    }): Promise<any>;
    private findCostWithJob;
    private validateJobOwnership;
}
export declare const costsService: CostsService;
//# sourceMappingURL=costs.service.d.ts.map