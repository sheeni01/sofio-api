import { CosmosClient } from "@azure/cosmos";
import { cosmosDb } from "../../config/config.js";

const client = new CosmosClient({
  endpoint: cosmosDb.endpoint,
  key: cosmosDb.key,
});

const container = client.database(cosmosDb.databaseId).container("uploads");

export async function saveUploadMetadata(uploadMetadata) {
  // Renamed function
  const { resource } = await container.items.create(uploadMetadata);
  return resource;
}
