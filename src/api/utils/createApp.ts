import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRequests } from "../requests/index.js";
import { registerPosts } from "../posts/index.js";
import { CustomClient } from "../../structure/index.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(client: CustomClient): Express {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.set("views", path.join(__dirname, "../views"));
    app.use(express.static(path.join(__dirname, "../public")));
    app.set("view engine", "ejs");

    registerRequests(app);
    registerPosts(app, client);
    return app;
}