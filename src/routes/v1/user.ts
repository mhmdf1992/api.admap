import express from 'express';
import { IUserService, UserService } from '../../services/user';
import { ArgumentError } from '../../errors/argument';
import { IFilter } from '../../dtos/filter';
import { NotFound } from '../../errors/not-found';
import { IUpdateUser } from '../../dtos/user/update-user';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { validate } from './validate';
import { body } from 'express-validator';
import { UserRole } from '../../data/models/user';
import { ICreateUser } from '../../dtos/user/create-user';
import { ICreateUserResponse } from '../../dtos/user/create-user-response';
export const  userRoutes = express.Router();

userRoutes.post(
 '/',
 validate([
    body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid. Username must start with a letter minimum 6 and maximum 24 characters. Allowed characters are a-z (only lower case), 0-9, '_' (underscore) and '.' (dot)."),
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'"),
    body('role').isInt({min: 1, max: Object.keys(UserRole).length / 2}),
    body('firstname').notEmpty(),
    body('lastname').notEmpty(),
    body('disabled').isBoolean().optional()
 ]), 
 async (req, res, next) => {
    const user = req.body as ICreateUser;
    try{
        const service = container.get<IUserService>(types.UserService);
        UserService.validateUsername(user.username);
        if(await service.usernameExists(user.username))
            throw new ArgumentError("username", "Username already exists.");
        UserService.validatePassword(user.password);
        const id = await service.create(user);
        const response: ICreateUserResponse = {
            _id: id.toHexString()
        }
        res.body(response)
        res.activity({
            message: `created user ${user.username}`,
            reference: id
        });
    }catch(err){
        return next(err);
    }
});

userRoutes.get('/', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.headers['page'] as string, 10) || 1,
        page_size: parseInt(req.headers['page_size'] as string, 10) || 12,
        equal: JSON.parse(req.headers['equal'] ?? null) ?? [],
        regex: JSON.parse(req.headers['regex'] ?? null) ?? [],
        between: JSON.parse(req.headers['between'] ?? null) ?? [],
        sort: JSON.parse(req.headers['sort'] ?? null) ?? {
            field: "created_on",
            order: "descending"
        }
    }
    const service = container.get<IUserService>(types.UserService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

userRoutes.get('/:id', async (req, res, next) => {
    try{
        const service = container.get<IUserService>(types.UserService);
        const id = req.params.id === "me" ? req.jwtPayload.user_id : req.params.id;
        const user = await service.get(id);
        if(!user)
            throw new NotFound("User does not exists.");
        res.body(user)
    }catch(err){
        return next(err);
    }
})

userRoutes.delete('/:id', async (req, res, next) => {
    try{
        const service = container.get<IUserService>(types.UserService);
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        const user = await service.delete(req.params.id);
        res.body();
        res.activity({ 
            message: `deleted user ${user.username}`
        });
    }catch(err){
        return next(err);
    }
})

userRoutes.put(
 '/:id',
 validate([
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'"),
    body('role').isInt({min: 1, max: Object.keys(UserRole).length / 2 }),
    body('firstname').notEmpty(),
    body('lastname').notEmpty(),
    body('disabled').isBoolean().optional()
 ]), 
 async (req, res, next) => {
    const user = req.body as IUpdateUser;
    const service = container.get<IUserService>(types.UserService);
    try{
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        const updatedUser = await service.replace(req.params.id, user);
        res.body();
        res.activity({ 
            message: `updated user ${updatedUser.username}`,
            reference: req.params.id
        });
    }catch(err){
        return next(err);
    }
});

userRoutes.patch(
 '/:id',
 validate([
    body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid. Username must start with a letter minimum 6 and maximum 24 characters. Allowed characters are a-z (only lower case), 0-9, '_' (underscore) and '.' (dot).").optional(),
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'").optional(),
    body('role').isInt({min: 1, max: Object.keys(UserRole).length / 2 }).optional(),
    body('firstname').notEmpty().optional(),
    body('lastname').notEmpty().optional(),
    body('disabled').isBoolean().optional()
 ]), 
 async (req, res, next) => {
    const user = req.body as IUpdateUser;
    const service = container.get<IUserService>(types.UserService);
    try{
        if(!await service.exists(req.params.id))
            throw new NotFound("User does not exists.");
        const updatedUser = await service.update(req.params.id, user);
        res.body();
        res.activity({ 
            message: `updated user ${updatedUser.username}`,
            reference: req.params.id
        });
    }catch(err){
        return next(err);
    }
});