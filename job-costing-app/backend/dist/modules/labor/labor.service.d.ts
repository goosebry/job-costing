import { CreateLaborInput } from './dto/create-labor.schema';
import { UpdateLaborInput } from './dto/update-labor.schema';
export declare class LaborService {
    create(data: CreateLaborInput, organizationId: string, userId: string): Promise<any>;
    findAllByJob(jobId: string, organizationId: string): Promise<any>;
    update(id: string, organizationId: string, data: UpdateLaborInput): Promise<any>;
    delete(id: string, organizationId: string): Promise<void>;
    private findLaborWithJob;
    private validateJobOwnership;
}
export declare const laborService: LaborService;
//# sourceMappingURL=labor.service.d.ts.map