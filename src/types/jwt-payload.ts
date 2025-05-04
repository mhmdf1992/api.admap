import { UserRole } from "../data/models/user";

export interface JWTPayload{
    user_id: string;
    username: string;
    role: UserRole;
}