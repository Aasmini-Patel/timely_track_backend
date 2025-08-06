import mongoose from "mongoose";

export const databaseConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongodb connected successfully");
    } catch (error) {
        console.error("database connection error: ", error);
        process.exit(1);
    }
};