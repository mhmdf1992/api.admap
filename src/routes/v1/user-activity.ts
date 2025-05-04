import express from 'express';
import { IFilter } from '../../dtos/filter';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { IUserActivityService } from '../../services/user-activity';
export const  userActivityRoutes = express.Router();

userActivityRoutes.get('/', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.body.page as string, 10) || 1,
        page_size: parseInt(req.body.page_size as string, 10) || 12,
        equal: req.body.equal,
        regex: req.body.regex,
        between: req.body.between,
        sort: req.body.sort ?? {
            "field": "created_on",
            "order": "descending"
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