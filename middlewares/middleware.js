import jwt from "jsonwebtoken";
import User from "../schemas/User.js";
import { jsonStatus, status } from "../helper/api.responses.js";
import dotenv from 'dotenv';
dotenv.config();

export const userAuthentication = async (req, res, next) => {
    let token = req.header('Authorization');
    
    if (!token) {
        return res.status(status.Unauthorized).json({ status: jsonStatus.Unauthorized, success: false, message: "No Token. Authorization Denied" });
    }
    if (!token.startsWith("Bearer")) {
        return res.status(status.Unauthorized).json({ status: jsonStatus.Unauthorized, success: false, message: "Authorization Denied" });
    }
    token = token.replace("Bearer ", "");
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return res.status(status.Unauthorized).json({ status: jsonStatus.Unauthorized, success: false, message: "Authorization Denied" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(status.Unauthorized).json({ status: jsonStatus.Unauthorized, success: false, message: error.message });
    }
};