export type Invoice = {
    id: string;
    amount: number;
    currency: string
    organization_id: string;
    type: string;
    preference?: Preference;
    creditNotes?: CreditNote[];
    reference?: string;
    payments?: Payment[];
    pendingCreditNotesAmount?: number
}

export type Payment = {
    id: string;
    amount: number;
    status: string;
}

export type CreditNote = Invoice & {
    reference: string
}

export type Currency = 'CLP' | 'USD'

export type Preference = {
    currency: Currency
}

export type invoiceFetchError = {
    type: Error,
    message: string,
}

export type preferenceFetchError = {
    type: Error,
    message: string,
}

export type invoicePaymentError = {
    type: Error,
    message: string
}

export type Accumulator = {
    creditNotesTotal: number,
    payments: Payment[]
}