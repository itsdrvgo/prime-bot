export interface PayPalToken {
    scope: string;
    access_token: string;
    token_type: string;
    app_id: string;
    expires_in: number;
    nonce: string;
}

export interface PayPalInvoiceNumber {
    invoice_number: string;
}

export interface PayPalInvoiceResponse {
    rel: string;
    href: string;
    method: string;
}

export interface PayPalItem {
    name: string;
    description: string;
    quantity: string;
    unit_amount: {
        currency_code: string;
        value: string;
    };
}

export interface PayPalPaidInvoice {
    id: string;
    create_time: string;
    resource_type: string;
    event_type: string;
    resource: {
        invoice: {
            id: string;
            status: string;
        }
    }
}

export interface InvoiceOptions {
    payload?: PayPalPaidInvoice;
    paidInvoiceId?: string;
}