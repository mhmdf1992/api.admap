export interface IUserActivity{
    user_id: string;
    username: string;
    action: string;
    path: string;
    reference?: string;
    message?: string;
    created_on: Date;
}