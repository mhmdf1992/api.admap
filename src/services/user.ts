import { MongoClient, ObjectId } from "mongodb";
import { IUser, UserRole } from "../data/models/user";
import { ArgumentError } from "../errors/argument";
import { IPagedList } from "../dtos/paged-list";
import { IFilter } from "../dtos/filter";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";
import { IUpdateUser } from "../dtos/user/update-user";
import { NotFound } from "../errors/not-found";
import { Unauthorized } from "../errors/unauthorized";
import { ILoginResponse } from "../dtos/auth/login-response";
import jwt from 'jsonwebtoken';
import { injectable } from "inversify";
import { JWTPayload } from "../types/jwt-payload";

export interface IUserService{
    authenticate(username: string, password: string): Promise<ILoginResponse>;
    usernameExists(username: string): Promise<boolean>;
    adminRoleExists(): Promise<boolean>;
    exists(id: string): Promise<boolean>;
    get(id: string): Promise<IUser>;
    getMany(filter: IFilter): Promise<IPagedList<IUser>>;
    delete(id: string): Promise<void>;
    update(id: string, user: IUpdateUser): Promise<void>;
    replace(id: string, user: IUpdateUser): Promise<void>;
    create(user: {username: string, password: string, firstname: string, lastname: string, role: UserRole, disabled?: boolean}): Promise<ObjectId>;
}

@injectable()
export class UserService implements IUserService{
    protected _mongoClient: MongoClient;
    
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    async adminRoleExists(): Promise<boolean> {
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ role: UserRole.ADMIN }, { projection: {"_id": 1} });
        return !user ? false : true;
    }

    public authenticate = async (username: string, password: string): Promise<ILoginResponse> => {
        UserService.validateUsername(username);
        UserService.validatePassword(password);
        const user =
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ username: username, disabled: false }, { projection: { "_id": 1, "password": 1, "role": 1 } });
        if(!user || password !== user.password)
            throw new Unauthorized("Username or password is incorrect.");
        const payload: JWTPayload ={
            user_id: user._id.toHexString(),
            username: username,
            role: user.role
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
              expiresIn: "360d",
            }
        );
        const res: ILoginResponse = {
            token: token,
            user_id: user._id.toHexString()
        }
        return res;
    }

    public usernameExists = async (username: string): Promise<boolean> => {
        UserService.validateUsername(username);
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ username: username }, { projection: {"_id": 1} });
        return !user || !user._id ? false : true;
    }

    public exists = async (id: string): Promise<boolean> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"_id": 1} });
        return !user ? false : true;
    }

    public get = async (id: string): Promise<IUser> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection<IUser>("users")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        return user;
    }

    public getMany = async (filter: IFilter): Promise<IPagedList<IUser>> =>{
        const aggregate = AggregateBuilder.build(filter);
        const result = 
         await this.
            _mongoClient
                .db()
                .collection<IUser>("users")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<IUser> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public delete = async (id: string): Promise<void> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
         await this.
            _mongoClient
                .db()
                .collection<IUser>("users")
                .findOneAndDelete({ _id: ObjectId.createFromHexString(id) }, { projection: { "username": 1 } });
    }

    public update = async (id: string, user: IUpdateUser): Promise<void> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const set: any = {};
        if(user.firstname)
            set.firstname = user.firstname;
        if(user.lastname)
            set.lastname = user.lastname;
        if(user.password){
            UserService.validatePassword(user.password);
            set.password = user.password;
        }
        if(user.disabled === false || user.disabled === true)
            set.disabled = user.disabled;
        set.updated_on = new Date();
        await this.
         _mongoClient
            .db()
            .collection("users")
            .updateOne({ _id: ObjectId.createFromHexString(id) }, {$set: set});
    }

    public replace = async (id: string, user: IUpdateUser): Promise<void> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const oldUser =
         await this.
            _mongoClient
                .db()
                .collection("users")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"username": 1, "created_on": 1} });
        if(!oldUser)
            throw new NotFound("User does not exists");
        UserService.validatePassword(user.password);
        const newUser: IUser = {
            _id: ObjectId.createFromHexString(id),
            username: oldUser.username,
            created_on: oldUser.created_on,
            firstname: user.firstname,
            lastname: user.lastname,
            password: user.password,
            role: oldUser.role,
            disabled: user.disabled,
            updated_on: new Date()
        };
        await this.
         _mongoClient
            .db()
            .collection<IUser>("users")
            .replaceOne({ _id: ObjectId.createFromHexString(id) }, newUser);
    }

    public create = async (user: {username: string, password: string, firstname: string, lastname: string, role: UserRole, disabled?: boolean}): Promise<ObjectId> => {
        UserService.validateUsername(user.username);
        UserService.validatePassword(user.password);
        const newUser: IUser = {
            _id: null,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            password: user.password,
            created_on: new Date(),
            role: user.role,
            disabled: user.disabled ?? false
        };
        await this.
         _mongoClient
            .db()
            .collection("users")
            .insertOne(newUser);
        return newUser._id;
    }
    
    public static isValidUsername = (username: string): boolean => 
        /^[a-z][a-z0-9_.]{6,24}$/.test(username);

    public static isValidPassword = (password: string): boolean => 
        /[a-zA-Z0-9_.@$]{6,24}$/.test(password);

    public static validateUsername = (username: string) =>{
        if(!UserService.isValidUsername(username))
            throw new ArgumentError("username", "Username is not valid. Username must start with a letter minimum 6 and maximum 24 characters. Allowed characters are a-z (only lower case), 0-9, '_' (underscore) and '.' (dot).");
    }
    
    public static validatePassword = (password: string) =>{
        if(!UserService.isValidPassword(password))
            throw new ArgumentError("password", "Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'");
    }
}