import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { setWait, setTransaction } from './actions'

export function useWaitState(): AppState['waitmodal'] {
  return useSelector<AppState, AppState['waitmodal']>(state => state.waitmodal)
}

export function useWaitActionHandlers(): {
  onChangeWait: (wait: string | null) => void
  onChangeTransaction: (tx: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onChangeWait = useCallback(
    (wait: string | null) => {
      dispatch(setWait({ wait }))
    },
    [dispatch]
  )

  const onChangeTransaction = useCallback(
    (tx: string | null) => {
      dispatch(setTransaction({ tx }))
    },
    [dispatch]
  )

  return {
    onChangeWait,
    onChangeTransaction
  }
}
