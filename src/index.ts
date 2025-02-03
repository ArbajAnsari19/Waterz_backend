import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose";
import helmet from "helmet";
import bodyParser from 'body-parser';
import {customerRoutes,ownerRoutes, authRoutes, bookingRoutes,queryRoutes,paymentRoutes, adminRoutes, superAgentRoutes, agentRoutes }  from "./routes";


dotenv.config()
const app = express();
app.use(express.json());
app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:5173", // Your frontend URL 
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
};

// Apply CORS with options
app.use(cors(corsOptions));
app.use(helmet());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiting
app.use(express.urlencoded({ extended: true }));


app.get("/test", (req, res) => {
  res.send("Hello World from backend");
})

app.use("/auth", authRoutes);
app.use("/customer", customerRoutes);
app.use("/owner", ownerRoutes);
app.use("agent",agentRoutes);
app.use("/superagent",superAgentRoutes);
app.use("/admin",adminRoutes);
app.use("/booking",bookingRoutes);
app.use("/query",queryRoutes)
app.use("/payment",paymentRoutes) 

const connectDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "";
    await mongoose.connect(MONGO_URI);
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};


connectDatabase();


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on ==> http://localhost:${PORT}`);
});

