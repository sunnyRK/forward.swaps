import { createAction } from '@reduxjs/toolkit'

export const setWait = createAction<{ wait: string | null }>('swap/setWait')
export const setTransaction = createAction<{ tx: string | null }>('swap/setTransaction')
export const setTransactionHash = createAction<{ txHash: string | null }>('swap/setTransactionHash')
export const setTimer = createAction<{ timerBool: any | null }>('swap/setTimer')
export const setFee = createAction<{ gasFees: string | null }>('swap/setFee')
export const setApproved = createAction<{ isApproved: boolean | null }>('swap/setApproved')
export const setOpen = createAction<{ isOpen: boolean | null }>('swap/setOpen')
export const setGasModal = createAction<{ isGasModal: boolean | null }>('swap/setGasModal')
