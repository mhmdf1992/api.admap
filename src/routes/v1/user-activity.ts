import express from 'express';
import { IFilter } from '../../dtos/filter';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { IUserActivityService } from '../../services/user-activity';
export const  userActivityRoutes = express.Router();

userActivityRoutes.get('/', async (req, res, next) => {
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
    const service = container.get<IUserActivityService>(types.UserActivityService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});