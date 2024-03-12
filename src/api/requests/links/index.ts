import { Request, Response } from "express";

export default function links(req: Request, res: Response) {
    res.render("links");
}