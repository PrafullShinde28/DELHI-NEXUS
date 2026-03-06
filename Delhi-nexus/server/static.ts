import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Build folder not found: ${distPath}. Run frontend build first.`,
    );
  }

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback (for React / Vite routing)
  app.get("*", (req, res, next) => {
    // Do not interfere with API routes
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }

    res.sendFile(path.join(distPath, "index.html"));
  });
}