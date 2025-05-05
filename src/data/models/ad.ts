import { ObjectId } from "mongodb";

export interface IAd{
    _id: ObjectId;
    title: string;
    description: string;
    location: string;
    price: number;
    category: string;
    subcategory: string;
    status: AdStatus;
    parent_ad?: string;
    created_on: Date;
    updated_on?: Date;
    disabled: boolean;
}
export enum AdStatus{
    Pending = 0,
    Approved = 1,
    Regected = 2
}