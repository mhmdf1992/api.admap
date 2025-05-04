import express from 'express';
import { body } from 'express-validator';
import { ILogin } from '../../dtos/auth/login';
import { container } from '../../ioc-container';
import { IUserService, UserService } from '../../services/user';
import { types } from '../../ioc-types';
import { ArgumentError } from '../../errors/argument';
import { validate } from './validate';
import { IRegister } from '../../dtos/auth/register';
import { UserRole } from '../../data/models/user';
export const  authRoutes = express.Router();

authRoutes.post(
 '/login', 
 validate([
    body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid"),
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid.")]), 
 async (req, res, next) => {
    const userService = container.get<IUserService>(types.UserService);
    const user = req.body as ILogin;
    try{
        const response = await userService.authenticate(user.username, user.password);
        res.body(response);
        res.activity({ 
            user_id: response.user_id,
            username: user.username,
            message: "logged in"
        });
    }catch(err){
        return next(err);
    }
});

authRoutes.post(
 '/register',
 validate([
    body('username').matches(/^[a-z][a-z0-9_.]{6,24}$/).withMessage("Username is not valid. Username must start with a letter minimum 6 and maximum 24 characters. Allowed characters are a-z (only lower case), 0-9, '_' (underscore) and '.' (dot)."),
    body('password').matches(/[a-zA-Z0-9_.@$]{6,24}$/).withMessage("Password is not valid. Password should be minimum 6 charecters and maximum 24. Allowed characters are a-z, A-Z, 0-9, '@', '$', '_' and '.'"),
    body('firstname').notEmpty(),
    body('lastname').notEmpty()
 ]), 
 async (req, res, next) => {
    const user = req.body as IRegister;
    try{
        const service = container.get<IUserService>(types.UserService);
        UserService.validateUsername(user.username);
        if(await service.usernameExists(user.username))
            throw new ArgumentError("username", "Username already exists.");
        UserService.validatePassword(user.password);
        await service.create({
            firstname: user.firstname,
            lastname: user.lastname,
            password: user.password,
            role: UserRole.USER,
            username: user.username,
            disabled: false
        });
        const response = await service.authenticate(user.username, user.password);
        res.body(response);
        res.activity({ 
            user_id: response.user_id,
            username: user.username,
            message: "registered"
        });
    }catch(err){
        return next(err);
    }
});