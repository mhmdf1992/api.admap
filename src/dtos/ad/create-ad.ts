import { AdStatus } from "../../data/models/ad";

export interface ICreateAd{
    title: string;
    description: string;
    country: string;
    city: string;
    price: number;
    currency: string;
    category: string;
    subcategory: string;
    parent_ad?: string;
    status: AdStatus;
}