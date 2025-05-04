import { MongoClient, ObjectId } from "mongodb";
import { ILogItem, ILogRequest, LogType } from "../data/models/log-item";
import { injectable } from "inversify";
import { IFilter } from "../dtos/filter";
import { IPagedList } from "../dtos/paged-list";
import { ArgumentError } from "../errors/argument";
import { AggregateBuilder } from "../data/helpers/aggregate-builder";

export interface ILogService{
    get(id: string): Promise<ILogItem>;
    getMany(filter: IFilter): Promise<IPagedList<ILogItem>>;
    log({type, message, user_id, username, request}:{type: LogType, message: string, user_id?: string, username?: string, request?: ILogRequest}): Promise<ObjectId>;
}
@injectable()
export class LogService implements ILogService{
    _mongoClient: MongoClient;
    constructor(mongoClient: MongoClient){
        this._mongoClient = mongoClient;
    }
    
    public get = async (id: string): Promise<ILogItem> => {
        if(!ObjectId.isValid(id))
            throw new ArgumentError("id", "id is not valid");
        const user = 
            await this.
            _mongoClient
                .db()
                .collection<ILogItem>("logs")
                .findOne({ _id: ObjectId.createFromHexString(id) });
        return user;
    }

    public getMany = async (filter: IFilter): Promise<IPagedList<ILogItem>> =>{
        const aggregate = AggregateBuilder.build(filter);
        const result = 
            await this.
            _mongoClient
                .db()
                .collection<ILogItem>("logs")
                .aggregate(aggregate)
                .toArray();
        const pagedList: IPagedList<ILogItem> = {
            items: result[0].data,
            page: filter.page,
            page_size: filter.page_size,
            total_items: result[0].data.length == 0 ? 0 : result[0].metadata[0].total,
            total_pages: result[0].data.length == 0 ? 0 : Math.ceil(result[0].metadata[0].total / filter.page_size) | 0
        }
        return pagedList;
    }

    public log = async ({type, message, user_id, username, request}:{type: LogType, message: string, user_id: string, username: string, request?: ILogRequest}): Promise<ObjectId> =>{
        const logItem: ILogItem = {
            _id: null,
            type: type,
            user_id: user_id,
            username: username,
            message: message,
            request: request,
            created_on: new Date()
        };
        await this._mongoClient
            .db()
            .collection("logs")
            .insertOne(logItem);
        return logItem._id;
    }
};