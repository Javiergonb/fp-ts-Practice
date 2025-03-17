import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import { pipe } from 'fp-ts/function'
import axios, { AxiosResponse } from 'axios'
import { API_URLS } from '../config'
import { Invoice, invoicePaymentError, Payment } from '../types/invoiceTypes'


const sendInvoiceAmount = (
    invoice: Invoice): TE.TaskEither<invoicePaymentError, AxiosResponse> =>
    pipe(
        TE.tryCatch(
            () => axios.post(API_URLS.payInvoice(invoice.id), { amount: invoice.amount }),
            (e) => ({ type: new Error(String(e)), message: 'Error when paying invoices' })
        ),
        TE.map(response => response.data)
    )

export const payInvoices = (invoices: Invoice[]): TE.TaskEither<invoicePaymentError,AxiosResponse[]> => 
    pipe(
      invoices,
      A.map((invoice:Invoice) => 
        sendInvoiceAmount(invoice)
      ),
      A.sequence(TE.ApplicativePar),
    )


const sendPayments = (payments: Payment[]) : TE.TaskEither<invoicePaymentError, AxiosResponse>[] =>
  pipe(
    payments,
    A.map(payment =>
      pipe(
        TE.tryCatch(
          () => axios.post(API_URLS.payInvoiceWithPayment(payment.id), {amount: payment.amount}),
          (e) => ({ type: new Error(String(e)), message: 'Error when sending payment' })
        ),
        TE.map(response => response.data),
      )
    )
  )

export const payInvoicesWithPayments = (invoices: Invoice[]) : TE.TaskEither<invoicePaymentError, AxiosResponse[]> =>
  pipe(
    invoices,
    A.map((invoice: Invoice) => 
      sendPayments(invoice.payments ?? [])
    ),
    A.flatten,
    A.sequence(TE.ApplicativePar)
  )