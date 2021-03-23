import { useMemo } from 'react'
import {
  JSBI,
  Percent,
  Router,
  // SwapParameters,
  Trade,
  TradeType
} from '@uniswap/sdk'
import { BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { Contract } from '@ethersproject/contracts'
import { getBiconomySwappperContract, getEthersProvider, getEtherscanLink } from '../utils'
import { Web3Provider } from '@ethersproject/providers'
import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { Version } from './useToggledVersion'
import { useActiveWeb3React } from './index'
import { useV1ExchangeContract } from './useContract'
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
import v1SwapArguments from '../utils/v1SwapArguments'
import Swal from 'sweetalert2'
import { useTransactionAdderBiconomy } from '../state/transactions/hooks'
import { useWaitActionHandlers } from '../state/waitmodal/hooks'
import { BICONOMY_CONTRACT } from "../constants/config";
import { getErcForwarderClient, getPermitClient } from "../biconomy/biconomy";

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface depositParameters {
  pid: string
  amount: string
}

interface SwapCall {
  account: string
  contract: Contract
  ethersProvider: Web3Provider
  parameters: depositParameters
}

interface SwapCallBiconomy {
  account: string
  contract: Contract
  ethersProvider: Web3Provider
  swapMethod: any
}

let TxFess: any

// interface SuccessfulCall {
//   call: SwapCall
//   gasEstimate: BigNumber
// }

// interface FailedCall {
//   call: SwapCall
//   error: Error
// }

// type EstimatedSwapCall = SuccessfulCall | FailedCall

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName
 */
function useSwapCallArgumentsForBiconomy(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCallBiconomy[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()

  const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  return useMemo(() => {
    const tradeVersion = getTradeVersion(trade)
    if (
      !trade ||
      !recipient ||
      !library ||
      !account ||
      !tradeVersion ||
      !chainId ||
      !deadline
    )
      return []

    const contract: Contract | null = getBiconomySwappperContract(
      BICONOMY_CONTRACT,
      BICONOMYSWAPPER_ABI,
      library,
      account
    )
    const _ethersProvider: Web3Provider | null = getEthersProvider()
    // if (!contract && !_permitClient) {
    if (!contract) {
      return []
    }
    const swapMethods = []
    const swapper = []
    switch (tradeVersion) {
      case Version.v2:
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          swapMethods.push(
            Router.swapCallParameters(trade, {
              feeOnTransfer: true,
              allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
              recipient,
              deadline: deadline.toNumber()
            })
          )
        }
        break

      case Version.v1:
        swapMethods.push(
          v1SwapArguments(trade, {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )
        break
    }

    const pass = {
      account: account,
      contract: contract,
      ethersProvider: _ethersProvider,
      swapMethod: swapMethods[0]
    }
    swapper.push(pass)
    return swapper
    // return swapMethods.map(parameters => ({ parameters, contract }))
  }, [
    account,
    allowedSlippage,
    chainId,
    deadline,
    library,
    recipient,
    trade,
    v1Exchange
  ])
}

export function useBiconomySwapper(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): {
  state: SwapCallbackState
  callback: any
  error: string | null
} {
  const { account, chainId } = useActiveWeb3React()
  const swapCalls = useSwapCallArgumentsForBiconomy(trade, allowedSlippage, recipientAddressOrName)
  const addBiconomyTransaction = useTransactionAdderBiconomy()
  const { onChangeWait, onChangeTransaction, onChangeTransactionHash, onChangeOpen, onChangeGasModal} = useWaitActionHandlers()
  // const tradeVersion = getTradeVersion(trade)

  let paths: any = []
  let len: any | undefined = trade?.route?.path?.length
  if(len>0) {
    for(let i=0; i<parseInt(len); i++) {
      paths[i] = trade?.route.path[i].address
    }
  }
  console.log('paths', paths)

  return useMemo(() => {
    // try {

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(gasToken: string) {
        // : Promise<string> {
        //   const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
        try {
          onChangeOpen(false)
          onChangeGasModal(false)
          swapCalls.map(async call => {
            if(getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
              Swal.fire('Something went wrong!')
              onChangeOpen(false)
              return
            } else {
              Swal.fire({
                title: 'Please sign the message.',
                html: '',
                timerProgressBar: true,
                didOpen: () => {
                  Swal.showLoading()
                }
              }).then(result => {
                if (result.dismiss === Swal.DismissReason.timer) {
                }
              })

              onChangeWait('true')
              const { account, contract, ethersProvider, swapMethod } = call
              // const token0 = swapMethod.args[2][0]
              // const path = [swapMethod.args[2][0], swapMethod.args[2][1]] // [token0, token1]

              const txResponse = await contract.populateTransaction.swapWithoutETH(
                account,
                paths[0],
                paths,
                swapMethod.args[0]
              )

              const gasLimit = await ethersProvider.estimateGas({
                to: contract.address,
                from: account,
                data: txResponse.data
              })

              const builtTx = await getErcForwarderClient().buildTx({
                to: contract.address,
                token: gasToken,
                txGas: Number(gasLimit),
                data: txResponse.data
              })
              const tx = builtTx.request

              let transaction: any
              try {
                transaction = await getErcForwarderClient().sendTxEIP712({ req: tx })
                console.log('transaction: ', transaction) 
              } catch (error) {
                onChangeWait('false')
                onChangeTransaction('undefined')
                Swal.fire({
                  icon: 'error',
                  title: 'Transaction Failed.!',
                  didOpen: () => {
                    Swal.hideLoading()
                  }
                })
              }

              Swal.fire({
                title: 'Transaction Sent',
                html: 'Waiting for Confirmation...',
                timerProgressBar: true,
                didOpen: () => {
                  Swal.showLoading()
                }
              }).then(result => {
                if (result.dismiss === Swal.DismissReason.timer) {
                  console.log('I was closed by the timer')
                }
              })
              onChangeWait('false')
              onChangeTransactionHash(transaction && transaction.txHash)
              // const withVersion = tradeVersion === Version.v2 ? account : `${account} on ${(tradeVersion as any).toUpperCase()}`
              // addBiconomyTransaction(transaction, {
              //   summary: withVersion
              // })

              if (transaction && transaction.code == 200 && transaction.txHash) {
                ethersProvider.once(transaction.txHash, result => {
                  // const hashLink = "https://kovan.etherscan.io/tx/"+transaction.txHash
                  const chainIdForEtherscan: any = chainId
                  onChangeTransactionHash('')
                  onChangeTransaction(transaction.txHash)
                  console.log('result: ', result)

                  Swal.fire({
                    title: 'Transaction Successfull',
                    text: 'Transaction Successfull',
                    icon: 'success',
                    html:
                    `<a href=${getEtherscanLink(chainIdForEtherscan, transaction.txHash, 'transaction')} target="_blank">Etherscan</a>`,
                    confirmButtonText: 'continue'
                  })
                    .then(result => {
                      onChangeOpen(false)
                    })
                    .catch(error => {
                      Swal.fire('reverted', 'Transaction Failed!', 'error')
                    })
                })
              } else {
                // onChangeWait("false")
                onChangeTransaction('undefined')
                onChangeGasModal(false)
                Swal.fire({
                  icon: 'error',
                  title: 'User denied message signature!',
                  text: 'Transaction Failed.',
                  didOpen: () => {
                    Swal.hideLoading()
                  }
                })
              }

              // const txReciept = await txResponse.wait()
              // console.log('txReciept: ', txReciept)
              //  .then(gasEstimate => {
              //   return {
              //     call,
              //     gasEstimate
              //   }
              // })
              // .catch(gasError => {
              //   console.debug('Gas estimate failed, trying eth_call to extract error', call)

              //   return contract.callStatic[methodName](...args, options)
              //     .then(result => {
              //       console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
              //       return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
              //     })
              //     .catch(callError => {
              //       console.debug('Call threw error', call, callError)
              //       let errorMessage: string
              //       switch (callError.reason) {
              //         case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
              //         case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
              //           errorMessage =
              //             'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
              //           break
              //         default:
              //           errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`
              //       }
              //       return { call, error: new Error(errorMessage) }
              //     })
              // })
            }
          })
          // )
        } catch (error) {
          onChangeWait('false')
          onChangeTransaction('undefined')
          console.log('error:', error)
          Swal.fire({
            icon: 'error',
            title: 'Used Denied Transaction!',
            text: 'Transaction Failed!',
            didOpen: () => {
              Swal.hideLoading()
            }
          })
        }
      },
      error: null
    }

    // } catch (error) {
    //  console.log(error)
    // }
  }, [swapCalls, account, addBiconomyTransaction])
}

export function useSwapperForGas(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): {
  fee: string | null
} {
  const { account } = useActiveWeb3React()
  const swapCalls = useSwapCallArgumentsForBiconomy(trade, allowedSlippage, recipientAddressOrName)
  return useMemo(() => {
    try {
      swapCalls.map(async call => {
        
        if(getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
          Swal.fire('Something went wrong!')
          return
        } else {
          const { account, contract, ethersProvider, swapMethod } = call

          const addr1 = account
          const dai = swapMethod.args[2][0]
          const path = [swapMethod.args[2][0], swapMethod.args[2][1]]

          const txResponse = await contract.populateTransaction.swapWithoutETH(addr1, dai, path, swapMethod.args[0])

          const gasLimit = await ethersProvider.estimateGas({
            to: contract.address,
            from: account,
            data: txResponse.data
          })

          const builtTx = await getErcForwarderClient().buildTx({
            to: contract.address,
            token: swapMethod.args[2][0],
            txGas: Number(gasLimit),
            data: txResponse.data
          })
          TxFess = builtTx.cost
          return TxFess
        }
      })
    } catch (error) {
      console.log('error:', error)
    }
    return {
      fee: TxFess
    }
  }, [swapCalls, account])
}

// For demo
function useSwapCallArguments(): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  return useMemo(() => {
    if (!library || !account || !chainId) return []
    const _contract: Contract | null = getBiconomySwappperContract(
      BICONOMY_CONTRACT,
      BICONOMYSWAPPER_ABI,
      library,
      account
    )
    const _ethersProvider: Web3Provider | null = getEthersProvider()

    if (!_contract) {
      return []
    }

    const swapMethods = []
    const _parameters = { pid: '0', amount: '0' }
    const pass = {
      account: account,
      contract: _contract,
      ethersProvider: _ethersProvider,
      // permitClient: _permitClient,
      // ercForwarderClient: _ercForwarderClient,
      parameters: _parameters
    }
    swapMethods.push(pass)
    return swapMethods

    // return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, chainId, library])
}

// For demo
export function useSwapper(): {
  state: SwapCallbackState
  callback: any
  error: string | null
} {
  const { account } = useActiveWeb3React()
  const swapCalls = useSwapCallArguments()

  return useMemo(() => {
    // try {

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap() {
        // : Promise<string> {
        //   const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
        try {
          if(getPermitClient() == '' || getPermitClient() ==  'undefined' || getPermitClient() == null || 
          getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
            Swal.fire('Something went wrong!')
            return
          } else {
          swapCalls.map(async call => {
            const { account, contract, ethersProvider } = call

            const domainData = {
              name: 'Dai Stablecoin',
              version: '1',
              chainId: 42,
              verifyingContract: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa' // kovan
            }

            const tokenPermitOptions1 = {
              //contract
              spender: BICONOMY_CONTRACT,
              domainData: domainData,
              value: '100000000000000000000',
              deadline: Math.floor(Date.now() / 1000 + 3600)
            }

            const tokenPermitOptions2 = {
              //forwarder
              domainData: domainData,
              value: '100000000000000000000',
              deadline: Math.floor(Date.now() / 1000 + 3600)
            }

            const permitTx1 = await getPermitClient().daiPermit(tokenPermitOptions1)
            await permitTx1.wait(1)

            const permitTx2 = await getPermitClient().daiPermit(tokenPermitOptions2)
            await permitTx2.wait(1)

            // // // const options = !value || isZero(value) ? {} : { value }
            // // // console.log('methodName1:', methodName)
            const addr1 = '0x48845392F5a7c6b360A733e0ABE2EdcC74f1F4d6'
            const dai = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
            const path = ['0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', '0xd0A1E359811322d97991E03f863a0C30C2cF029C']

            const txResponse = await contract.populateTransaction.swapWithoutETH(addr1, dai, path, '100000000')

            // const gasPrice = await ethersProvider.getGasPrice()
            const gasLimit = await ethersProvider.estimateGas({
              to: BICONOMY_CONTRACT,
              from: account,
              data: txResponse.data
            })
            // console.log('gasLimit++', gasLimit.toString())
            // console.log('gasPrice++', gasPrice.toString())
            // console.log('txResponse++', txResponse)

            const builtTx = await getErcForwarderClient().buildTx({
              to: BICONOMY_CONTRACT,
              token: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
              txGas: Number(gasLimit),
              data: txResponse.data
            })
            const tx = builtTx.request

            const transaction = await getErcForwarderClient().sendTxEIP712({ req: tx })
            //returns an object containing code, log, message, txHash

            if (transaction && transaction.code == 200 && transaction.txHash) {
              //event emitter methods
              ethersProvider.once(transaction.txHash, result => {
                // Emitted when the transaction has been mined
                console.log('result: ', result)
              })
            }

            // const txReciept = await txResponse.wait()
            // console.log('txReciept: ', txReciept)
            //  .then(gasEstimate => {
            //   return {
            //     call,
            //     gasEstimate
            //   }
            // })
            // .catch(gasError => {
            //   console.debug('Gas estimate failed, trying eth_call to extract error', call)

            //   return contract.callStatic[methodName](...args, options)
            //     .then(result => {
            //       console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
            //       return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
            //     })
            //     .catch(callError => {
            //       console.debug('Call threw error', call, callError)
            //       let errorMessage: string
            //       switch (callError.reason) {
            //         case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
            //         case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
            //           errorMessage =
            //             'This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.'
            //           break
            //         default:
            //           errorMessage = `The transaction cannot succeed due to error: ${callError.reason}. This is probably an issue with one of the tokens you are swapping.`
            //       }
            //       return { call, error: new Error(errorMessage) }
            //     })
            // })
          })
          // )
          }
        } catch (error) {
          console.log('error:', error)
        }
      },
      error: null
    }

    // } catch (error) {
    //  console.log(error)
    // }
  }, [swapCalls, account])
}
