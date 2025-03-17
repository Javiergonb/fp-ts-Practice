import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import {pipe,flow} from 'fp-ts/function'
import axios, { Axios, AxiosResponse } from 'axios'

//1. Obtener las facturas pendientes DONE
//2. Obtener la forma de pago de cada factura
//3. Procesar las facturas
//4. Pagarlas

type Invoice = {
  id: string;
  amount: number;
  currency: string
  organization_id : string;
  type: string;
  preference?: Preference;
  creditNotes?: CreditNote[];
  reference? : string;
}

type CreditNote = Invoice& {
  reference: string
}

type Currency = 'CLP' | 'USD'

type Preference = {
  currency: Currency
}

type invoiceFetchError = {
  type: Error,
  message: string,
}

type preferenceFetchError = {
  type: Error,
  message: string,
}

type invoicePaymentError = {
  type: Error,
  message: string
}


const invoiceURL = 'https://recruiting.api.bemmbo.com/invoices/pending'

const getInvoiceURL = (organization_id : string) => `https://recruiting.api.bemmbo.com/organization/${organization_id}/settings`

const getPayInvoiceURL = (invoice_id:string) => `https://recruiting.api.bemmbo.com/invoices/${invoice_id}/pay`

const fetchInvoicesTaskEither: TE.TaskEither<invoiceFetchError,Invoice[]>=
  pipe(
    TE.tryCatch( 
      () => axios.get<Invoice[]>(invoiceURL),
      (e) => ({type: new Error(String(e)), message: 'Error in fetching invoices'})
    ),
    TE.map((invoices) => invoices.data),
  )

const fetchPreferenceTaskEither = (organization_id: string): TE.TaskEither<preferenceFetchError,Preference> =>
  pipe(
    TE.tryCatch(
      () => axios.get(getInvoiceURL(organization_id)),
      (e) => ({type: new Error(String(e)), message: `Error in fetching preference from ${organization_id}`})
    ),
    TE.map(response => ({ currency: response.data.currency }))
  )

const setInvoiceCurrencyPreference = (invoices: Invoice[]) : TE.TaskEither<preferenceFetchError,Invoice[]>=>
  pipe(
    invoices,
    A.map((invoice: Invoice) => 
      pipe(
        invoice.organization_id,
        fetchPreferenceTaskEither,
        TE.map(preference => ({ ...invoice, preference}))
      )
    ),
    A.sequence(TE.ApplicativePar),
  )


const getAmount = (invoice: Invoice) : number =>  invoice.currency === invoice.preference?.currency? invoice.amount: convertAmount(invoice.amount,invoice.preference?.currency ?? "")
  

const convertAmount = (amount:number,preference:string) : number => {
  switch(preference){
    case 'CLP':
      return amount * 800
    case 'USD':
      return amount / 800
    default:
      return amount
  }
}

const isCreditNote = (invoice: Invoice) :invoice is CreditNote => invoice.type === 'credit_note' && !!invoice.reference

const referenceMatch = (credit_note: CreditNote, invoice: Invoice) : credit_note is CreditNote => credit_note.reference === invoice.id

// now we want to transform the currecncy if necessary
const transformCurrency = (invoices: Invoice[]) : Invoice[]=> 
  pipe(
    invoices,
    A.map((invoice: Invoice) => 
      ({...invoice, amount: getAmount(invoice)})
    )
  )

const isReceivedInvoice = (invoice: Invoice ) : invoice is Invoice=> invoice.type === 'received'

const assignCreditNotes = (invoices: Invoice[]): Invoice[] => 
  pipe(
    invoices,
    A.map((invoice: Invoice) => ({
      ...invoice,
      creditNotes: invoices.filter(cn => isCreditNote(cn) && referenceMatch(cn, invoice)) 
    })),
    A.filter(isReceivedInvoice)
  )

const creditNoteSum = (creditNotes: Invoice[]) : number => A.reduce(0, (sum: number, current: Invoice) => sum + current.amount)(creditNotes)

const applyCreditNotes = (invoices: Invoice[]) : Invoice[] => 
  pipe(
    invoices,
    A.map((invoice:Invoice) => 
      ({
        ...invoice,
        amount: invoice.amount - creditNoteSum(invoice.creditNotes ?? [])
      })
  )
  )

const sendInvoiceAmount = (invoice:Invoice) : TE.TaskEither<invoicePaymentError,AxiosResponse>=> 
  pipe(
    TE.tryCatch(
      () => axios.post(getPayInvoiceURL(invoice.id), { amount: invoice.amount }),
      (e) => ({type: new Error(String(e)), message: 'Error when paying invoices'})
    ),
    TE.map(response => response.data)
  )

const payInvoices = (invoices: Invoice[]): TE.TaskEither<invoicePaymentError,AxiosResponse[]> => 
  pipe(
    invoices,
    A.map((invoice:Invoice) => 
      sendInvoiceAmount(invoice)
    ),
    A.sequence(TE.ApplicativePar),
    x=>x
  )

const main = () => {
  pipe(
    fetchInvoicesTaskEither,
    TE.flatMap(setInvoiceCurrencyPreference),
    TE.map(transformCurrency),
    TE.map(assignCreditNotes),
    TE.map(applyCreditNotes),
    TE.flatMap(payInvoices),
    TE.match(
      (e) => console.error('Error',e),
      (i) => console.log('Success',i)
    )
  )()
}

main()



 

