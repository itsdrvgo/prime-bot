import { Request, Response } from "express";

export default function support(req: Request, res: Response) {
    res.redirect("https://ko-fi.com/dragoluca");
}