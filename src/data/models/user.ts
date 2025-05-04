import { ObjectId } from "mongodb";

export interface IUser{
    _id: ObjectId;
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    created_on: Date;
    updated_on?: Date;
    role: UserRole;
    disabled: boolean;
}
export enum UserRole{
    ADMIN = 1,
    USER = 2
}