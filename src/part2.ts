import { pipe } from "fp-ts/lib/function.js";
import { applyCreditNotesV2, assignCreditNotes, fetchInvoicesTaskEitherWithPayments, reduceCreditNotesAmount} from "./services/invoiceService";
import * as A from 'fp-ts/Array'
import * as TE from 'fp-ts/TaskEither'
import { transformCurrency, transformCurrencyWithPayments } from "./utils/currencyUtils";
import { setInvoiceCurrencyPreference } from "./services/preferenceService";
import { payInvoicesWithPayments } from "./services/paymentService";


//I think the process is similar. 
// First we get the invoices. DONE
// then we transfor the currency if needed, but this time we need to transform the payments as well DONE!
// Then we need to assign the credit notes to invoices. DONE
// we sum the amount of the credit notes DONE SAVED IN A VARIABLE
// We need to apply the credit note final amount to each non paid payment DONE
//          if the payment is less than the credit note amount then we need to set the payment amount to zero and update the credit note amount
//After applying the credit note to all unpaid payments then we need to send the amount to the endpoint. If its zero its fine

export const part2 = 
    pipe(
        fetchInvoicesTaskEitherWithPayments,
        TE.tapIO(i => () => console.log(JSON.stringify(i,null,2))),
        TE.flatMap(setInvoiceCurrencyPreference),
        TE.map(transformCurrencyWithPayments),
        TE.map(assignCreditNotes),
        TE.map(reduceCreditNotesAmount),
        TE.map(applyCreditNotesV2),
        TE.flatMap(payInvoicesWithPayments),
        TE.tapIO(i => () => console.log(JSON.stringify(i,null,2)))
    )

