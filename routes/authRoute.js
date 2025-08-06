import express from "express";
import { 
    registerUser, 
    loginUser, 
 } from "../controllers/authController.js";
 
const route = express.Router();

route.post("/auth/register/v1", registerUser);
route.post("/auth/login/v1", loginUser);

export default route;