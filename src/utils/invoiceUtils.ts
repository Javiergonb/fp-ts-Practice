import * as O from 'fp-ts/Option'
import * as S from 'fp-ts/string'
import * as N from 'fp-ts/number'
import * as Ord from 'fp-ts/Ord'
import {pipe} from 'fp-ts/function'
import { Invoice, CreditNote,Payment , Accumulator} from "../types/invoiceTypes"
import { convertAmount } from "./currencyUtils"

export const isCreditNote = (invoice: Invoice) :invoice is CreditNote => invoice.type === 'credit_note' && !!invoice.reference
export const referenceMatch = (credit_note: CreditNote, invoice: Invoice) : credit_note is CreditNote => credit_note.reference === invoice.id
export const isReceivedInvoice = (invoice: Invoice ) : invoice is Invoice=> invoice.type === 'received'

export const getAmount = (invoice: Invoice) : number =>  invoice.currency === invoice.preference?.currency? invoice.amount: convertAmount(invoice.amount,invoice.preference?.currency ?? "")
export const getPaymentAmount = (invoice: Invoice, payment: Payment) : number => invoice.currency === invoice.preference?.currency? payment.amount: convertAmount(payment.amount, invoice.preference?.currency ?? "")


export const paymentReducer = (acc: Accumulator, payment: Payment): Accumulator => 
    pipe(
      payment,
      O.fromPredicate((p: Payment) => p.status !== 'paid'),
      O.fold(
        () => acc,
        () => acc.creditNotesTotal >= payment.amount
          ? {
            creditNotesTotal: acc.creditNotesTotal - payment.amount,
            payments: acc.payments.concat({...payment, amount: 0})
          }
          : {
            creditNotesTotal: 0,
            payments: acc.payments.concat({...payment, amount: payment.amount - acc.creditNotesTotal})
          }
      )
    )

export const byId = pipe(
    S.Ord,
    Ord.contramap((p: Payment) => p.id),
    Ord.reverse
  )
  
export const byAmount = pipe(
    N.Ord,
    Ord.contramap((p:Payment) => p.amount),
  )