import express from "express";
import { createTask, deleteTask, getTasks, updateTask, startTaskTimer, stopTaskTimer, getDashboard } from "../controllers/taskController.js";
import { userAuthentication } from "../middlewares/middleware.js";

const route = express.Router();

route.post("/task/create/v1", userAuthentication, createTask);
route.get("/task/list/v1", userAuthentication, getTasks);
route.put("/task/update/v1", userAuthentication, updateTask);
route.delete("/task/delete/:id/v1", userAuthentication, deleteTask);
route.post("/task/start/:id/v1", userAuthentication, startTaskTimer);
route.post("/task/stop/:id/v1", userAuthentication, stopTaskTimer);
route.get("/task/dashboard/v1", userAuthentication, getDashboard);

export default route;