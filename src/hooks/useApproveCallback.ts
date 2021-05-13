import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Trade, TokenAmount, CurrencyAmount, ETHER } from '@uniswap/sdk'
import { useCallback, useMemo } from 'react'
// import { ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
// import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { Field } from '../state/swap/actions'
import { useTransactionAdder, useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract } from './useContract'
import { useActiveWeb3React } from './index'
// import { Version } from './useToggledVersion'

import DAI_kovan_contract from '../contracts/DAI_kovan.json'
import USDC_kovan_contract from '../contracts/USDC_kovan.json'
//import Tradeable_USDC_kovan_contract from '../contracts/Tradeable_USDC_kovan.json'
import { BICONOMY_CONTRACT } from '../constants/config'
import { getPermitClient } from '../biconomy/biconomy'
import Swal from 'sweetalert2'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { account } = useActiveWeb3React()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === ETHER) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    try {
      if (approvalState !== ApprovalState.NOT_APPROVED) {
        console.error('approve was called unnecessarily')
        return
      }
      if (!token) {
        console.error('no token')
        return
      }

      if (!tokenContract) {
        console.error('tokenContract is null')
        return
      }

      if (!amountToApprove) {
        console.error('missing amount to approve')
        return
      }

      if (!spender) {
        console.error('no spender')
        return
      }

      let useExact = false
      const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
        // general fallback for tokens who restrict approval amounts
        useExact = true
        return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString())
      })

      let domainData
      let tokenPermitOptions1
      let permitTx

      if (tokenContract.address == DAI_kovan_contract.address) {
        if (getPermitClient() == '' || getPermitClient() == 'undefined' || getPermitClient() == null) {
          Swal.fire('Something went wrong!')
          return
        } else {
          domainData = {
            name: 'Dai Stablecoin',
            version: '1',
            chainId: 42,
            verifyingContract: DAI_kovan_contract.address // kovan
          }

          tokenPermitOptions1 = {
            spender: BICONOMY_CONTRACT,
            domainData: domainData,
            value: '100000000000000000000',
            deadline: Math.floor(Date.now() / 1000 + 3600)
          }

          permitTx = await getPermitClient().daiPermit(tokenPermitOptions1)
          // console.log('permitTx: ', permitTx, amountToApprove.currency.symbol, token.address, spender)
          // addTransaction(permitTx, {
          //   summary: 'Approve ' + amountToApprove.currency.symbol,
          //   approval: { tokenAddress: token.address, spender: spender }
          // })
          await permitTx.wait(1)
          console.log('permitTx: ', permitTx)
          if (permitTx.hash) {
            addTransaction(permitTx, {
              summary: 'Approve ' + amountToApprove.currency.symbol,
              approval: { tokenAddress: token.address, spender: spender }
            })
          }
          return permitTx
        }
      } else if (tokenContract.address == USDC_kovan_contract.address) {
        if (getPermitClient() == '' || getPermitClient() == 'undefined' || getPermitClient() == null) {
          Swal.fire('Something went wrong!')
          return
        } else {
          domainData = {
            name: 'USDC Coin',
            version: '1',
            chainId: 42,
            verifyingContract: USDC_kovan_contract.address
          }

          tokenPermitOptions1 = {
            spender: BICONOMY_CONTRACT,
            domainData: domainData,
            value: '100000000000000000000',
            deadline: Math.floor(Date.now() / 1000 + 3600)
          }
          permitTx = await getPermitClient().eip2612Permit(tokenPermitOptions1)
          await permitTx.wait(1)
          console.log('permitTx: ', permitTx)
          if (permitTx.hash) {
            addTransaction(permitTx, {
              summary: 'Approve ' + amountToApprove.currency.symbol,
              approval: { tokenAddress: token.address, spender: spender }
            })
          }
          return permitTx
        }
      } else {
        return tokenContract
          .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
            gasLimit: calculateGasMargin(estimatedGas)
          })
          .then((response: TransactionResponse) => {
            console.log('permitTx', response)
            addTransaction(response, {
              summary: 'Approve ' + amountToApprove.currency.symbol,
              approval: { tokenAddress: token.address, spender: spender }
            })
          })
          .catch((error: Error) => {
            console.debug('Failed to approve token', error)
            throw error
          })
      }
    } catch (error) {
      console.log('Error: ', error)
    }
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction])
  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage]
  )
  // const tradeIsV1 = getTradeVersion(trade) === Version.v1
  // const v1ExchangeAddress = useV1TradeExchangeAddress(trade)
  // return useApproveCallback(amountToApprove, tradeIsV1 ? v1ExchangeAddress : ROUTER_ADDRESS)
  return useApproveCallback(amountToApprove, BICONOMY_CONTRACT)
}
