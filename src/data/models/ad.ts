import { ObjectId } from "mongodb";

export interface IAd{
    _id: ObjectId;
    title: string;
    description: string;
    country: string;
    city: string;
    price: number;
    currency: string;
    category: string;
    subcategory: string;
    status: AdStatus;
    parent_ad?: string;
    created_on: Date;
    updated_on?: Date;
    disabled: boolean;
    user_id: string;
}
export enum AdStatus{
    Pending = 0,
    Approved = 1,
    Regected = 2
}