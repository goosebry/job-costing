import { CreateInvoiceInput } from './dto/create-invoice.schema';
import { UpdateInvoiceInput } from './dto/create-invoice.schema';
import { InvoiceStatus } from '@prisma/client';
export declare class InvoicesService {
    create(data: CreateInvoiceInput, organizationId: string): Promise<any>;
    findAll(organizationId: string, filters?: {
        status?: InvoiceStatus;
        jobId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        invoices: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, organizationId: string): Promise<any>;
    update(id: string, organizationId: string, data: UpdateInvoiceInput): Promise<any>;
    private validateJobOwnership;
}
export declare const invoicesService: InvoicesService;
//# sourceMappingURL=invoices.service.d.ts.map