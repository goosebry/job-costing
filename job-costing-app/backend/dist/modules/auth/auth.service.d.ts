import { RegisterInput, LoginInput } from './dto/register.schema';
export declare class AuthService {
    register(data: RegisterInput): Promise<any>;
    login(data: LoginInput): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
    logout(refreshToken: string): Promise<void>;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        role: any;
        lastLogin: any;
        organization: any;
    }>;
    private saveRefreshToken;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map