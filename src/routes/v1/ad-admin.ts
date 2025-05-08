import express from 'express';
import { IFilter } from '../../dtos/filter';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { IAdService } from '../../services/ad';
import { NotFound } from '../../errors/not-found';
import { IUpdateStatus } from '../../dtos/ad/update-status';
import { AdStatus } from '../../data/models/ad';
export const  adAdminRoutes = express.Router();

adAdminRoutes.get('/', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.headers['page'] ?? null as string, 10) || 1,
        page_size: parseInt(req.headers['page_size'] ?? null as string, 10) || 12,
        equal: [
            {
                field: 'status',
                value: AdStatus.Pending
            }
        ],
        regex: JSON.parse(req.headers['regex'] ?? null) ?? [],
        between: JSON.parse(req.headers['between'] ?? null) ?? [],
        sort: JSON.parse(req.headers['sort'] ?? null) ?? {
            field: "created_on",
            order: "descending"
        }
    }
    const service = container.get<IAdService>(types.AdService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

adAdminRoutes.patch(
 '/:id',
 async (req, res, next) => {
    const statusUpdate = req.body as IUpdateStatus;
    const service = container.get<IAdService>(types.AdService);
    try{
        const updatedAd = await service.get(req.params.id);
        if(!updatedAd)
            throw new NotFound("Ad does not exists.");
        if(updatedAd.parent_ad && statusUpdate.status === AdStatus.Approved)
            await service.delete(updatedAd.parent_ad);
        await service.updateStatus(req.params.id, statusUpdate);
        res.body();
        res.activity({ 
            message: `updated ad`,
            reference: req.params.id
        });
    }catch(err){
        return next(err);
    }
});