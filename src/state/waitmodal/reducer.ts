import { createReducer } from '@reduxjs/toolkit'
import { setWait, setTransaction } from './actions'

export interface WaitState {
  readonly wait: string | null
  readonly tx: string | null
}

const initialState: WaitState = {
  wait: 'false',
  tx: ''
}

export default createReducer<WaitState>(initialState, builder =>
  builder
    .addCase(setWait, (state, { payload: { wait } }) => {
      state.wait = wait
    })

    .addCase(setTransaction, (state, { payload: { tx } }) => {
      state.tx = tx
    })
)
