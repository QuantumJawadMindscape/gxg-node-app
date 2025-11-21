import express from "express";
import cors from "cors";
import testRoutes from "./routes/test.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ROUTES
app.use("/api", testRoutes);

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    msg: "Internal Server Error",
    error: err.toString(),
  });
});

app.listen(4000, () => console.log("Server running on port 4000"));
