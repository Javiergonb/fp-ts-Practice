import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import { pipe } from 'fp-ts/function'
import axios from 'axios'
import { API_URLS } from '../config'
import { Preference, preferenceFetchError,Invoice } from '../types/invoiceTypes'



export const fetchPreferenceTaskEither = (organization_id: string): TE.TaskEither<preferenceFetchError, Preference> =>
    pipe(
        TE.tryCatch(
            () => axios.get(API_URLS.organizationPreference(organization_id)),
            (e) => ({ type: new Error(String(e)), message: `Error in fetching preference from ${organization_id}` })
        ),
        TE.map(response => ({ currency: response.data.currency }))
    );
    
export const setInvoiceCurrencyPreference = (invoices: Invoice[]) : TE.TaskEither<preferenceFetchError,Invoice[]>=>
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