import jwt from "jsonwebtoken";
import { jwtSecret } from "../../config/config.js";

export function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).send("Access denied");

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).send("Invalid token");
    req.user = user;
    next();
  });
}

export function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).send("Access denied");
    next();
  };
}
