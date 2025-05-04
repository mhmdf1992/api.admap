import { Unauthorized } from "../errors/unauthorized";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/jwt-payload";

export const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        throw new Unauthorized("Token is not valid.")
    jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
        if(err)
            throw new Unauthorized("Token is not valid.");
        const payload = jwt.decode(token) as JWTPayload;
        req.jwtPayload = payload;
        next();
    });
}