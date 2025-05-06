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

adRoutes.get('/', async (req, res, next) => {
    const filter: IFilter = {
        page: parseInt(req.headers['page'] as string, 10) || 1,
        page_size: parseInt(req.headers['page_size'] as string, 10) || 12,
        equal: req.headers['equal'],
        regex: req.headers['regex'],
        between: req.headers['between'],
        sort:{
            "field": req.headers['sort.field'] ?? "created_on",
            "order": req.headers['sort.order'] ?? "descending"
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