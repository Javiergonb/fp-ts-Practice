import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { fetchInvoicesTaskEither, assignCreditNotes,applyCreditNotes, reduceCreditNotesAmount} from './services/invoiceService';
import { payInvoices } from './services/paymentService';
import { setInvoiceCurrencyPreference } from './services/preferenceService';
import { transformCurrency } from './utils/currencyUtils';




export const part1 = 
    pipe(
      fetchInvoicesTaskEither,
      TE.flatMap(setInvoiceCurrencyPreference),
      TE.map(transformCurrency),
      TE.map(assignCreditNotes),
      TE.map(reduceCreditNotesAmount),
      TE.map(applyCreditNotes),
      TE.flatMap(payInvoices),
      TE.match(
        (e) => console.error('Error',e),
        (i) => console.log('Success',i)
      )
    )