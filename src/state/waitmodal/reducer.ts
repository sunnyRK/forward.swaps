import { createReducer } from '@reduxjs/toolkit'
import { setWait, setTransaction, setTransactionHash, setTimer, setFee } from './actions'

export interface WaitState {
  readonly wait: string | null
  readonly tx: string | null
  readonly txHash: string | null
  readonly timerBool: any | null
  readonly gasFees: string | null
}

const initialState: WaitState = {
  wait: 'false',
  tx: '',
  txHash: '',
  timerBool: true,
  gasFees: ''
}

export default createReducer<WaitState>(initialState, builder =>
  builder
    .addCase(setWait, (state, { payload: { wait } }) => {
      state.wait = wait
    })

    .addCase(setTransaction, (state, { payload: { tx } }) => {
      state.tx = tx
    })

    .addCase(setTransactionHash, (state, { payload: { txHash } }) => {
      state.txHash = txHash
    })

    .addCase(setTimer, (state, { payload: { timerBool } }) => {
      state.timerBool = timerBool
    })

    .addCase(setFee, (state, { payload: { gasFees } }) => {
      state.gasFees = gasFees
    })
)
