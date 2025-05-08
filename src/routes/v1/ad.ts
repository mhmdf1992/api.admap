import express from 'express';
import { IFilter } from '../../dtos/filter';
import { NotFound } from '../../errors/not-found';
import { container } from '../../ioc-container';
import { types } from '../../ioc-types';
import { validate } from './validate';
import { body } from 'express-validator';
import { ICreateAd } from '../../dtos/ad/create-ad';
import { IAdService } from '../../services/ad';
import { ICreateAdResponse } from '../../dtos/ad/create-ad-response';
import { AdStatus } from '../../data/models/ad';
export const  adRoutes = express.Router();

adRoutes.post(
 '/',
 validate([
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('country').notEmpty(),
    body('city').notEmpty(),
    body('price').isFloat({min: 1}),
    body('currency').notEmpty(),
    body('category').notEmpty(),
    body('subcategory').notEmpty()
 ]), 
 async (req, res, next) => {
    const ad = req.body as ICreateAd;
    try{
        const service = container.get<IAdService>(types.AdService);
        const id = await service.create(ad, req.jwtPayload.user_id);
        const response: ICreateAdResponse = {
            _id: id.toHexString()
        }
        res.body(response)
        res.activity({
            message: `created ad ${ad.title}`,
            reference: id
        });
    }catch(err){
        return next(err);
    }
});

adRoutes.put(
'/:id',
validate([
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('country').notEmpty(),
    body('city').notEmpty(),
    body('price').isFloat({min: 1}),
    body('currency').notEmpty(),
    body('category').notEmpty(),
    body('subcategory').notEmpty()
]), 
async (req, res, next) => {
    const updatedAd = req.body as ICreateAd;
    try {
        const service = container.get<IAdService>(types.AdService);
        const ad = await service.get(req.params.id);
        if (!ad)
            throw new NotFound("Ad does not exists.");
        if (ad.status === AdStatus.Approved) {
            updatedAd.parent_ad = req.params.id;
            await service.create(updatedAd, req.jwtPayload.user_id);
        }
        else {
            updatedAd.status = AdStatus.Pending;
            await service.replace(req.params.id, updatedAd);
        }
        res.body({})
        res.activity({
            message: `updated ad ${ad.title}`,
            reference: req.params.id
        });
    } catch (err) {
        return next(err);
    }
});

adRoutes.get('/', async (req, res, next) => {
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
    filter.equal.push({
        field: 'status',
        value: AdStatus.Approved
    });
    const service = container.get<IAdService>(types.AdService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

adRoutes.get('/my', async (req, res, next) => {
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
    filter.equal.push({
        field: 'user_id',
        value: req.jwtPayload.user_id
    });
    const service = container.get<IAdService>(types.AdService);
    try{
        const result = await service.getMany(filter);
        res.body(result);
    }catch(err){
        return next(err);
    }
});

adRoutes.get('/:id', async (req, res, next) => {
    try{
        const service = container.get<IAdService>(types.AdService);
        const id = req.params.id;
        const ad = await service.get(id);
        if(!ad)
            throw new NotFound("Ad does not exists.");
        res.body(ad)
    }catch(err){
        return next(err);
    }
})

adRoutes.delete('/:id', async (req, res, next) => {
    try{
        const service = container.get<IAdService>(types.AdService);
        if(!await service.exists(req.params.id))
            throw new NotFound("Ad does not exists.");
        const ad = await service.delete(req.params.id);
        res.body();
        res.activity({ 
            message: `deleted ad ${ad.title}`
        });
    }catch(err){
        return next(err);
    }
})