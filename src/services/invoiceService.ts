import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {pipe} from 'fp-ts/function'
import axios from 'axios'
import { API_URLS } from '../config'
import {Invoice, invoiceFetchError,CreditNote} from '../types/invoiceTypes'
import {isCreditNote, referenceMatch, isReceivedInvoice, paymentReducer, byAmount, byId} from '../utils/invoiceUtils'



export const fetchInvoicesTaskEither: TE.TaskEither<invoiceFetchError,Invoice[]>=
  pipe(
    TE.tryCatch( 
      () => axios.get<Invoice[]>(API_URLS.invoices),
      (e) => ({type: new Error(String(e)), message: 'Error in fetching invoices'})
    ),
    TE.map((invoices) => invoices.data),
  );

export const assignCreditNotes = (invoices: Invoice[]): Invoice[] => 
  pipe(
    invoices,
    A.map((invoice: Invoice) => ({
      ...invoice,
      creditNotes: invoices.filter(cn => isCreditNote(cn) && referenceMatch(cn, invoice)) 
    })),
    A.filter(isReceivedInvoice)
  )

export const applyCreditNotes = (invoices: Invoice[]) : Invoice[] => 
  pipe(
    invoices,
    A.map((invoice:Invoice) => 
      ({
        ...invoice,
        amount: invoice.amount - (invoice.pendingCreditNotesAmount ?? 0)
      }))
  )

export const applyCreditNotesV2 = (invoices: Invoice[]) =>
  pipe(
    invoices,
    A.map(invoice => 
      pipe(
        invoice.payments ?? [],
        A.sortBy([byAmount,byId]),
        A.reduce({creditNotesTotal: invoice.pendingCreditNotesAmount?? 0, payments:[] }, paymentReducer),
        acc => ({ ...invoice, payments: acc.payments })
    )
  )
)

export const fetchInvoicesTaskEitherWithPayments: TE.TaskEither<invoiceFetchError,Invoice[]>=
pipe(
  TE.tryCatch( 
    () => axios.get<Invoice[]>(API_URLS.invoicesWithPayments),
    (e) => ({type: new Error(String(e)), message: 'Error in fetching invoices'})
  ),
  TE.map((invoices) => invoices.data),
);

const sumCreditNotes = (creditNotes: CreditNote[]) : number =>
  pipe(
    creditNotes,
    A.reduce(0,(sum : number, cn: CreditNote) =>  sum + cn.amount)
  )

export const reduceCreditNotesAmount = (invoices: Invoice[]) : Invoice[]=> 
  pipe(
    invoices,
    A.map((invoice) =>({
      ...invoice,
      pendingCreditNotesAmount: sumCreditNotes(invoice.creditNotes ?? [])
    }))
  )