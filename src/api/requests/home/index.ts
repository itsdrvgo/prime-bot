import { Request, Response } from "express";

export default function home(req: Request, res: Response) {
    res.render("home");
}