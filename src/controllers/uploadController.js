import { CosmosClient } from "@azure/cosmos";
import { cosmosDb } from "../../config/config.js";

const client = new CosmosClient({
  endpoint: cosmosDb.endpoint,
  key: cosmosDb.key,
});

const container = client.database(cosmosDb.databaseId).container("uploads"); // Updated to "uploads"

//  Get all uploads with filtering, sorting, and search
export async function getUploads(req, res) {
  const { query, category, sortBy } = req.query; // Added sorting and category filtering
  let querySpec = {
    query: "SELECT * FROM c",
    parameters: [],
  };

  if (query || category) {
    let filters = [];
    if (query) {
      filters.push("CONTAINS(c.title, @query)");
      querySpec.parameters.push({ name: "@query", value: query });
    }
    if (category) {
      filters.push("c.category = @category");
      querySpec.parameters.push({ name: "@category", value: category });
    }
    querySpec.query = `SELECT * FROM c WHERE ${filters.join(" AND ")}`;
  }

  const { resources: uploads } = await container.items
    .query(querySpec)
    .fetchAll();

  // Sort by date if requested
  if (sortBy === "latest") {
    uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "oldest") {
    uploads.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  // Calculate the average rating for each upload
  const uploadsWithRatings = uploads.map((upload) => {
    const averageRating = upload.ratings?.length
      ? upload.ratings.reduce((sum, rating) => sum + rating.value, 0) /
        upload.ratings.length
      : 0;
    return { ...upload, averageRating };
  });

  res.status(200).json(uploadsWithRatings);
}

// Get details of a specific upload
export async function getUploadDetails(req, res) {
  const { id } = req.params;

  try {
    const { resource: upload } = await container.item(id).read();

    if (!upload || Object.keys(upload).length === 0) {
      return res.status(404).json({ message: "Upload not found" });
    }

    // Ensure `upload.ratings` is an array before calculating average rating
    const ratingsArray = Array.isArray(upload.ratings) ? upload.ratings : [];
    const averageRating = ratingsArray.length
      ? ratingsArray.reduce((sum, rating) => sum + rating.value, 0) /
        ratingsArray.length
      : 0;

    // Ensure comments array is properly structured
    const commentsArray = Array.isArray(upload.comments)
      ? upload.comments.map((comment) => ({
          username: comment.username,
          text: comment.text || "", // Ensure text is included
          timestamp: comment.timestamp || null, // Include timestamp if available
        }))
      : [];

    res.status(200).json({ ...upload, averageRating, comments: commentsArray });
  } catch (error) {
    console.error("Error fetching upload details:", error);
    res.status(500).json({
      message: "An error occurred while fetching upload details",
      error,
    });
  }
}



// Rate an upload
export async function rateUpload(req, res) {
  const { uploadId, rating } = req.body;
  const { username } = req.user;

  if (typeof uploadId !== "string") {
    return res.status(400).json({ message: "Invalid upload ID" });
  }

  const { resource: upload } = await container.item(uploadId).read();
  if (!upload) {
    return res.status(404).json({ message: "Upload not found" });
  }

  if (!upload.ratings) upload.ratings = [];
  upload.ratings.push({ username, value: rating });
  await container.item(uploadId).replace(upload);

  // Calculate new average rating
  const averageRating =
    upload.ratings.reduce((sum, rating) => sum + rating.value, 0) /
    upload.ratings.length;

  res.json({ ...upload, averageRating });
}

// Comment on an upload
export async function commentUpload(req, res) {
  const { uploadId, comment } = req.body;
  const { username } = req.user;

  // Check if uploadId is valid
  if (typeof uploadId !== "string") {
    return res.status(400).json({ message: "Invalid upload ID" });
  }

  // Log to check if comment is coming correctly
  console.log("Received comment:", comment);

  if (typeof comment !== "string" || comment.trim() === "") {
    return res.status(400).json({ message: "Invalid or empty comment" });
  }

  try {
    // Read the upload from the database
    const { resource: upload } = await container.item(uploadId).read();
    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    // Ensure comments array exists
    if (!upload.comments) upload.comments = [];

    // Push the comment with text and timestamp
    const newComment = {
      username,
      text: comment, // Ensure this is properly stored
      timestamp: new Date().toISOString(),
    };

    upload.comments.push(newComment);

    // Save updated upload with comment
    await container.item(uploadId).replace(upload);

    console.log("Updated comments:", upload.comments);

    res.json(upload);
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Error saving comment", error });
  }
}

