import express, { json } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { setup } from "./scripts/setup.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1", uploadRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).send({ message: 'Server is running' });
});


const PORT = process.env.PORT || 3333;

setup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to set up the environment:", error);
    process.exit(1);
  });
