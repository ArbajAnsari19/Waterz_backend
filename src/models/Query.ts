import mongoose from "mongoose";

export interface IQuery extends mongoose.Document {
    name: string;
    email: string;
    message: string;
}

const querySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
});

const Query = mongoose.model<IQuery>("Query", querySchema);
export default Query;