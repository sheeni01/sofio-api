import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { cosmosDb, blobStorage } from "../../config/config.js";
import seedAdmin from "./seedAdmin.js";

async function setupCosmosDb() {
  const client = new CosmosClient({
    endpoint: cosmosDb.endpoint,
    key: cosmosDb.key,
  });

  console.log("CosmosDB Config:", cosmosDb);

  if (!cosmosDb.databaseId || typeof cosmosDb.databaseId !== "string") {
    throw new Error("Invalid databaseId in CosmosDB config");
  }

  const { database } = await client.databases.createIfNotExists({
    id: cosmosDb.databaseId,
  });
  console.log(`Database '${cosmosDb.databaseId}' created or already exists`);

  if (
    !cosmosDb.containers?.users ||
    typeof cosmosDb.containers.users !== "string"
  ) {
    throw new Error("Invalid users container in CosmosDB config");
  }

  const { container: usersContainer } =
    await database.containers.createIfNotExists({
      id: cosmosDb.containers.users,
    });
  console.log(
    `Container '${cosmosDb.containers.users}' created or already exists`
  );

  if (
    !cosmosDb.containers?.uploads ||
    typeof cosmosDb.containers.uploads !== "string"
  ) {
    throw new Error("Invalid uploads container in CosmosDB config");
  }

  const { container: uploadsContainer } =
    await database.containers.createIfNotExists({
      id: cosmosDb.containers.uploads,
    });
  console.log(
    `Container '${cosmosDb.containers.uploads}' created or already exists`
  );
}


async function setupBlobStorage() {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    blobStorage.connectionString
  );
  const containerClient = blobServiceClient.getContainerClient(
    blobStorage.containerName
  );

  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create();
    console.log(`Blob container '${blobStorage.containerName}' created`);
  } else {
    console.log(`Blob container '${blobStorage.containerName}' already exists`);
  }
}

export async function setup() {
  await setupCosmosDb();
  await setupBlobStorage();
  await seedAdmin(); // Seed the admin user
}
