import * as A from 'fp-ts/Array'
import { Invoice } from "../types/invoiceTypes";
import { pipe } from 'fp-ts/function'
import { Currency, Payment } from "../types/invoiceTypes";
import { getAmount, getPaymentAmount } from "./invoiceUtils";

export const convertAmount = (amount:number,preference:string) : number => {
    switch(preference){
      case 'CLP':
        return amount * 800
      case 'USD':
        return amount / 800
      default:
        return amount
    }
  };

export const transformCurrency = (invoices: Invoice[]) : Invoice[]=> 
  pipe(
    invoices,
    A.map((invoice: Invoice) => 
      ({...invoice, amount: getAmount(invoice)})
    )
  )

const convertPayments = (invoice: Invoice, payments: Payment[]) : Payment[] => 
  pipe(
    payments,
    A.map((payment) =>
      ({...payment, amount: getPaymentAmount(invoice,payment)})
    )
  )

export const transformCurrencyWithPayments = (invoices: Invoice[]) : Invoice[] =>
  pipe(
    invoices,
    A.map((invoice: Invoice) =>
      ({...invoice, amount: getAmount(invoice),payments: convertPayments(invoice,invoice.payments?? [])})
    ) 
  )