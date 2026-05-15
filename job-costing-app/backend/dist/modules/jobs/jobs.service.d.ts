import { CreateJobInput } from './dto/create-job.schema';
import { UpdateJobInput } from './dto/update-job.schema';
import { JobStatus } from '@prisma/client';
export declare class JobsService {
    create(data: CreateJobInput, organizationId: string, userId: string): Promise<any>;
    findAll(organizationId: string, filters?: {
        status?: JobStatus;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        jobs: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, organizationId: string): Promise<any>;
    update(id: string, organizationId: string, data: UpdateJobInput): Promise<any>;
    delete(id: string, organizationId: string): Promise<void>;
    getTemplates(organizationId: string): Promise<any>;
    applyTemplate(jobId: string, templateId: string, organizationId: string): Promise<any>;
    private generateJobNumber;
}
export declare const jobsService: JobsService;
//# sourceMappingURL=jobs.service.d.ts.map