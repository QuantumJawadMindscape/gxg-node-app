import express from "express";
import cors from "cors";
import testRoutes from "./routes/test.js";

const app = express();
app.use(cors());
app.use(express.json());

// ONLY THIS
app.use("/api", testRoutes);

app.listen(4000, () => console.log("Server running on port 4000"));
