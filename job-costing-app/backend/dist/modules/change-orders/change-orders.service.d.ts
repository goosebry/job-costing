import { CreateChangeOrderInput } from './dto/create-change-order.schema';
import { ApproveChangeOrderInput } from './dto/approve-change-order.schema';
export declare class ChangeOrdersService {
    create(data: CreateChangeOrderInput, organizationId: string, userId: string): Promise<any>;
    findAllByJob(jobId: string, organizationId: string): Promise<any>;
    approve(id: string, organizationId: string, userId: string, data: ApproveChangeOrderInput): Promise<any>;
    private validateJobOwnership;
}
export declare const changeOrdersService: ChangeOrdersService;
//# sourceMappingURL=change-orders.service.d.ts.map