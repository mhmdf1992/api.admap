import { MongoClient, ObjectId } from "mongodb";
import { ICreateAd } from "../dtos/ad/create-ad";
import { injectable } from "inversify";
import { AdStatus, IAd } from "../data/models/ad";
import { ArgumentError } from "../errors/argument";
import { IFilter } from "../dtos/filter";
import { IPagedList } from "../dtos/paged-list";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";
import { IUpdateStatus } from "../dtos/ad/update-status";
import { NotFound } from "../errors/not-found";

export interface IAdService{
    create(ad: ICreateAd, userId: string): Promise<ObjectId>;
    exists(id: string): Promise<boolean>;
    get(id: string): Promise<IAd>;
    getMany(filter: IFilter): Promise<IPagedList<IAd>>;
    delete(id: string): Promise<IAd>;
    updateStatus(id: string, statusUpdate: IUpdateStatus): Promise<IAd>;
    replace(id: string, updatedAd: ICreateAd): Promise<void>;
}

@injectable()
export class AdService implements IAdService{
    protected _mongoClient: MongoClient;    
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    public async updateStatus(id: string, statusUpdate: IUpdateStatus): Promise<IAd> {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const set = { 
            status: statusUpdate.status,
            updated_on: new Date()
        };
        const result = await this.
            _mongoClient
            .db()
            .collection<IAd>("ads")
            .findOneAndUpdate({ _id: ObjectId.createFromHexString(id) }, {$set: set});
        return result;
    }
    
    public create = async (ad: ICreateAd, userId: string): Promise<ObjectId> => {
        const newAd: IAd = {
            _id: null,
            title: ad.title,
            description: ad.description,
            price: ad.price,
            currency: ad.currency,
            country: ad.country,
            city: ad.city,
            category: ad.category,
            subcategory: ad.subcategory,
            status: AdStatus.Pending,
            created_on: new Date(),
            disabled: false,
            user_id: userId,
            parent_ad: ad.parent_ad
        }
        await this.
         _mongoClient
            .db()
            .collection("ads")
            .insertOne(newAd);
        return newAd._id;
    }

    public exists = async (id: string): Promise<boolean> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const ad = 
            await this.
            _mongoClient
                .db()
                .collection("ads")
                .findOne({ _id: ObjectId.createFromHexString(id) }, { projection: {"_id": 1} });
        return !ad ? false : true;
    }

    public get = async (id: string): Promise<IAd> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const ad = 
            await this.
            _mongoClient
                .db()
                .collection<IAd>("ads")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        return ad;
    }

    public getMany = async (filter: IFilter): Promise<IPagedList<IAd>> =>{
        const aggregate = AggregateBuilder.build(filter);
        const result = 
            await this.
            _mongoClient
                .db()
                .collection<IAd>("ads")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<IAd> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public delete = async (id: string): Promise<IAd> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid"); 
        const ad = await this.
            _mongoClient
                .db()
                .collection<IAd>("ads")
                .findOneAndDelete({ _id: ObjectId.createFromHexString(id) });
        return ad;
    }

    public replace = async (id: string, updatedAd: ICreateAd): Promise<void> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const oldAd =
            await this.
            _mongoClient
                .db()
                .collection("ads")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        if(!oldAd)
            throw new NotFound("Ad does not exists");
        const newAd: IAd = {
            _id: ObjectId.createFromHexString(id),
            title: updatedAd.title,
            category: updatedAd.category,
            subcategory: updatedAd.subcategory,
            city: updatedAd.city,
            country: updatedAd.country,
            currency: updatedAd.currency,
            description: updatedAd.description,
            price: updatedAd.price,
            status: updatedAd.status,
            updated_on: new Date(),
            created_on: oldAd.created_on,
            disabled: oldAd.disabled,
            user_id: oldAd.user_id,
            parent_ad: oldAd.parent_id
        };
        const result = await this.
            _mongoClient
            .db()
            .collection<IAd>("ads")
            .findOneAndReplace({ _id: ObjectId.createFromHexString(id) }, newAd);
    }
}