import { createAction } from '@reduxjs/toolkit'

export const setWait = createAction<{ wait: string | null }>('swap/setWait')
export const setTransaction = createAction<{ tx: string | null }>('swap/setTransaction')
