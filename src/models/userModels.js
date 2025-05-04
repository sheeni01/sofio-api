import { CosmosClient } from "@azure/cosmos";
import { cosmosDb } from "../../config/config.js";

const client = new CosmosClient({
  endpoint: cosmosDb.endpoint,
  key: cosmosDb.key,
});
const container = client
  .database(cosmosDb.databaseId)
  .container(cosmosDb.containers.users);

export async function createUser(user) {
  const { resource } = await container.items.create(user);
  return resource;
}

export async function getUserByUsername(username) {
  if (!username || typeof username !== "string") {
    throw new Error("Invalid username input");
  }

  const { resources } = await container.items
    .query({
      query: "SELECT * FROM c WHERE c.username = @username",
      parameters: [{ name: "@username", value: username }],
    })
    .fetchAll();
  return resources[0];
}

export async function getUserById(id) {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid user ID");
  }

  const { resource } = await container.item(id).read();
  return resource;
}
