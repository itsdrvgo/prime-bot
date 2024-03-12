import { Application } from "express";
import homeRoute from "./home/index.js";
import linksRoute from "./links/index.js";
import supportRoute from "./support/index.js";

export const registerRequests = (app: Application) => {
    app.get("/", homeRoute);
    app.get("/links", linksRoute);
    app.get("/support", supportRoute);
};
