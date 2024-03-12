import { Application } from "express";
import { CustomClient, PayPalPaidInvoice } from "../../structure/index.js";

export const registerPosts = (app: Application, client: CustomClient) => {
    app.post("/webhooks/paypal", (req, res) => {
        const payload: PayPalPaidInvoice = req.body;
        switch (payload.event_type) {
            case "INVOICING.INVOICE.PAID":
                res.status(200).send("OK");
                client.paypal.handlePaidInvoice({ payload });
                break;
        }
    });
};