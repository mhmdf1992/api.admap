import express from 'express';
import { NotFound } from '../../errors/not-found';
import { IFilter } from '../../dtos/filter';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { ILogService } from '../../services/log';
export const  logRoutes = express.Router();

logRoutes.get('/', async (req, res, next) => {
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
    const service = container.get<ILogService>(types.LogService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

logRoutes.get('/:id', async (req, res, next) => {
    try{
        const service = container.get<ILogService>(types.LogService);
        const log = await service.get(req.params.id);
        if(!log)
            throw new NotFound("Log does not exists.");
        res.body(log)
    }catch(err){
        return next(err);
    }
});