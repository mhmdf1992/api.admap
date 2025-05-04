import { container } from "../ioc-container";
import { types } from "../ioc-types";
import { IUserService } from "../services/user";
import { UserRole } from "./models/user";

export const seed = async () => {
    const userService = container.get<IUserService>(types.UserService);
    if(!await userService.adminRoleExists()){
        await userService.create({
            firstname: "admin",
            lastname: "admin",
            username: process.env.ADMIN_USER,
            password: process.env.ADMIN_USER_PASSWORD,
            role: UserRole.ADMIN,
            disabled: false
        });
    }
}