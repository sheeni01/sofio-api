import bcrypt from "bcrypt";
import { CosmosClient } from "@azure/cosmos";
import { createUser } from "../models/userModels.js";
import { saveUploadMetadata } from "../models/uploadModels.js"; // Updated model function
import { BlobServiceClient } from "@azure/storage-blob";
import { blobStorage, cosmosDb } from "../../config/config.js";

const client = new CosmosClient({
  endpoint: cosmosDb.endpoint,
  key: cosmosDb.key,
});
const container = client.database(cosmosDb.databaseId).container("uploads");
const blobServiceClient = BlobServiceClient.fromConnectionString(
  blobStorage.connectionString
);
const containerClient = blobServiceClient.getContainerClient(
  blobStorage.containerName
);

export async function createAdmin(req, res) {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await createUser({
    username,
    password: hashedPassword,
    role: "admin",
  });
  res.status(201).json(admin);
}

export async function uploadMedia(req, res) {
  console.log("Request Body:", req.body); // Debugging
  console.log("Uploaded File:", req.file);
  console.log("Headers:", req.headers);
  const { title, category } = req.body;
  const { file } = req;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  // Allowed categories and file types
  const allowedCategories = {
    images: /\.(jpg|jpeg|png|gif)$/i,
    videos: /\.(mp4|avi|mov)$/i,
    movies: /\.(mp4|mkv|avi)$/i,
  };

  // Validate category
  if (!allowedCategories[category]) {
    return res
      .status(400)
      .send("Invalid category. Allowed categories: images, videos, movies.");
  }

  // Validate file type
  if (!file.originalname.match(allowedCategories[category])) {
    return res
      .status(400)
      .send(`Invalid file type for category '${category}'.`);
  }

  // Upload file to Azure Blob Storage
  const blockBlobClient = containerClient.getBlockBlobClient(file.originalname);
  await blockBlobClient.uploadData(file.buffer);

  // Save upload metadata to the database
  const uploadMetadata = {
    title,
    category,
    filename: file.originalname,
    url: blockBlobClient.url,
    uploadedAt: new Date().toISOString(),
  };

  const savedMetadata = await saveUploadMetadata(uploadMetadata);
  res.status(201).json({
    message: "File uploaded successfully",
    upload: savedMetadata,
  });
}

export async function getAllUploads(req, res) {
  try {
    const { resources: uploads } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();
    res.status(200).json(uploads);
  } catch (error) {
    console.error("Error fetching uploads:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching the uploads" });
  }
}
