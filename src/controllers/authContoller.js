import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, getUserByUsername } from "../models/userModels.js";
import { jwtSecret } from "../../config/config.js";

export async function signUp(req, res) {
  const { username, password } = req.body;

  // Add logging to debug the issue
  console.log("Received sign-up request:", { username, password });

  // Validate the input data
  if (!username || !password) {
    console.error("Username and password are required");
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Check if the username already exists in the database
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.error("Username already exists");
      return res.status(409).json({ message: "Username already exists" });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database with the hashed password and default role of "user"
    const user = await createUser({
      username,
      password: hashedPassword,
      role: "user",
    });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).json({ message: "An error occurred during sign-up" });
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  // Add logging to debug the issue
  // console.log("Received login request:", { username, password });

  // Validate the input data
  if (!username || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Check if the user exists in the database and the password is correct
  const user = await getUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate a JWT token for the authenticated user
  if (user) {
    const token = jwt.sign(
      { username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: "1h" }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
}
