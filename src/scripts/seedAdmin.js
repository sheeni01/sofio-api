import bcrypt from "bcrypt";
import { createUser, getUserByUsername } from "../models/userModels.js";

async function seedAdmin() {
  const username = "admin";
  const password = "admin123";

  // Check if the admin user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    console.log("Admin user already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await createUser({ username, password: hashedPassword, role: "admin" });
  console.log("Admin user created");
}

export default seedAdmin;
