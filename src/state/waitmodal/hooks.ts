import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import {
  setWait,
  setTransaction,
  setTransactionHash,
  setTimer,
  setFee,
  setApproved,
  setOpen,
  setGasModal
} from './actions'

export function useWaitState(): AppState['waitmodal'] {
  return useSelector<AppState, AppState['waitmodal']>(state => state.waitmodal)
}

export function useWaitActionHandlers(): {
  onChangeWait: (wait: string | null) => void
  onChangeTransaction: (tx: string | null) => void
  onChangeTransactionHash: (txHash: string | null) => void
  onChangeSetTimerBool: (timerBool: any | null) => void
  onChangeFee: (gasFees: string | null) => void
  onChangeApproved: (isApproved: boolean | null) => void
  onChangeOpen: (isOpen: boolean) => void
  onChangeGasModal: (isGasModal: boolean) => void
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

  const onChangeTransactionHash = useCallback(
    (txHash: string | null) => {
      dispatch(setTransactionHash({ txHash }))
    },
    [dispatch]
  )

  const onChangeSetTimerBool = useCallback(
    (timerBool: any | null) => {
      dispatch(setTimer({ timerBool }))
    },
    [dispatch]
  )

  const onChangeFee = useCallback(
    (gasFees: string | null) => {
      dispatch(setFee({ gasFees }))
    },
    [dispatch]
  )

  const onChangeApproved = useCallback(
    (isApproved: boolean | null) => {
      dispatch(setApproved({ isApproved }))
    },
    [dispatch]
  )

  const onChangeOpen = useCallback(
    (isOpen: boolean | null) => {
      dispatch(setOpen({ isOpen }))
    },
    [dispatch]
  )

  const onChangeGasModal = useCallback(
    (isGasModal: boolean | null) => {
      dispatch(setGasModal({ isGasModal }))
    },
    [dispatch]
  )

  return {
    onChangeWait,
    onChangeTransaction,
    onChangeTransactionHash,
    onChangeSetTimerBool,
    onChangeFee,
    onChangeApproved,
    onChangeOpen,
    onChangeGasModal
  }
}
