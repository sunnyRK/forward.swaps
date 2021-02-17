import { useMemo } from 'react'
import { JSBI, Percent, Router, 
  // SwapParameters, 
  Trade, TradeType } from '@uniswap/sdk'
import { BIPS_BASE, INITIAL_ALLOWED_SLIPPAGE } from '../constants'
// import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { getBiconomySwappperContract, getEthersProvider } from "../utils"
import { Web3Provider } from '@ethersproject/providers'
import { getTradeVersion, useV1TradeExchangeAddress } from '../data/V1'
import { useActiveWeb3React } from './index'
import { useV1ExchangeContract } from './useContract'
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
import useTransactionDeadline from './useTransactionDeadline'
import useENS from './useENS'
// import { BigNumber } from 'ethers';
import { Biconomy } from "@biconomy/mexa";
import { Version } from './useToggledVersion'
import v1SwapArguments from '../utils/v1SwapArguments'

const biconomy = new Biconomy(window.ethereum,{apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093'});
let _ercForwarderClient : any;
let _permitClient : any;

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID
}

interface depositParameters {
  pid: string
  amount: string
}

// interface SwapCall2 {
//   contract: Contract
//   parameters: SwapParameters
// }

interface SwapCall {
  account: string
  contract: Contract
  ethersProvider: Web3Provider
  ercForwarderClient: any
  permitClient: any
  parameters: depositParameters
}

interface SwapCall21 {
  account: string
  contract: Contract
  ethersProvider: Web3Provider
  ercForwarderClient: any
  permitClient: any
  swapMethod: any
}

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
function useSwapCallArguments2(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall21[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()

  const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  biconomy.onEvent(biconomy.READY, () => {
    // Initialize your dapp here like getting user accounts etc
      _ercForwarderClient = biconomy.erc20ForwarderClient;
      _permitClient = biconomy.permitClient;
      // console.log('permitClientOnevent++++++', _permitClient, _ercForwarderClient)
    }).onEvent(biconomy.ERROR, () => {
  });

  return useMemo(() => {
    const tradeVersion = getTradeVersion(trade)
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId || !deadline || !_permitClient || !_ercForwarderClient) return []
    // if (!library || !account || !chainId  || !_permitClient || !_ercForwarderClient) return []
    console.log('HIIII++', _permitClient)
  
    const contract: Contract | null = getBiconomySwappperContract('0xf7972686B57a861D079A1477cbFF7B7B6A469A43', BICONOMYSWAPPER_ABI, library, account)
    const _ethersProvider: Web3Provider | null = getEthersProvider()

    console.log('contract3+++++', contract, _ethersProvider)

    if (!contract && !_permitClient) {
      return []
    }
    const swapMethods = []
    const swapper = []

    // const _parameters = { pid : '0', amount: '0'}
    

    switch (tradeVersion) {
      case Version.v2:
        console.log("1111:", "HII1", trade.inputAmount.toString())
        swapMethods.push(
          Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          console.log("1111:", "HII2", trade)
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
        console.log("1111:", "HII3", trade)
        swapMethods.push(
          v1SwapArguments(trade, {
            allowedSlippage: new Percent(JSBI.BigInt(allowedSlippage), BIPS_BASE),
            recipient,
            deadline: deadline.toNumber()
          })
        )
        break
    }

    // swapMethods.map(parameters => { 
    //   console.log('parameters11111', parameters) 
    // })

    const pass = {
      account: account,
      contract: contract, 
      ethersProvider: _ethersProvider, 
      permitClient: _permitClient,
      ercForwarderClient: _ercForwarderClient, 
      // parameters: _parameters,
      swapMethod: swapMethods[0]
    } 
    console.log('passpass++++', pass)

    swapper.push(pass)
    return swapper
    // return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, allowedSlippage, chainId, deadline, library, recipient, trade, v1Exchange, _permitClient, _ercForwarderClient])
}

export function useSwapper2(
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
) : {
  state: SwapCallbackState; callback : any; error: string | null
} {
    const { account } = useActiveWeb3React()
    const swapCalls = useSwapCallArguments2(trade, allowedSlippage, recipientAddressOrName)

    console.log('swapCallsNew++++', swapCalls)

    return useMemo(() => {
      // try {
       
     return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap() {
      // : Promise<string> {
      //   const estimatedCalls: EstimatedSwapCall[] = await Promise.all(
        try {
          swapCalls.map(async (call) => {
            const {
              account,
              // parameters,
              contract,
              ethersProvider,
              ercForwarderClient,
              permitClient,
              swapMethod
            } = call
            console.log('AllSwapCalls:++', account, contract, ethersProvider, permitClient, ercForwarderClient, parseInt(swapMethod.args[0],10), swapMethod.args[2][0], swapMethod.args[2][1])

            // const domainData = {
            //   name: "Dai Stablecoin",
            //   version: "1",
            //   chainId: 42,
            //   verifyingContract: swapMethod.args[2][0] // kovan
            // };

            // const tokenPermitOptions1 = { // contract
            //   spender: contract.address,
            //   domainData: domainData,
            //   value: "100000000000000000000", 
            //   deadline: Math.floor(Date.now() / 1000 + 3600),
            // }

            // const tokenPermitOptions2 = { //forwarder
            //   domainData: domainData,
            //   value: "100000000000000000000", 
            //   deadline: Math.floor(Date.now() / 1000 + 3600),
            // }
            
            // let permitTx1 = await permitClient.daiPermit(tokenPermitOptions1);
            // await permitTx1.wait(1)
            // console.log('permitTx1++: ', permitTx1)
            
            // let permitTx2 = await permitClient.daiPermit(tokenPermitOptions2);
            // await permitTx2.wait(1)
            // console.log('permitTx2++: ', permitTx2)

            // // // const options = !value || isZero(value) ? {} : { value }
            // // // console.log('methodName1:', methodName)
            const addr1 = account
            const dai = swapMethod.args[2][0]
            const path = [swapMethod.args[2][0],swapMethod.args[2][1]]

            const txResponse = await contract.populateTransaction.swapWithoutETH(addr1, dai, path, swapMethod.args[0])

            let gasPrice = await ethersProvider.getGasPrice();
            let gasLimit = await ethersProvider.estimateGas({
              to: contract.address,
              from: account,
              data: txResponse.data,
            });
            console.log('gasLimit++', gasLimit.toString());
            console.log('gasPrice++', gasPrice.toString());
            console.log('txResponse++', txResponse);

            const builtTx = await ercForwarderClient.buildTx({
              to: contract.address,
              token: swapMethod.args[2][0],
              txGas:Number(gasLimit),
              data: txResponse.data
            });
            const tx = builtTx.request;
            const fee = builtTx.cost;
            console.log('builtTx-tx++', tx);
            console.log('builtTx-fee++', fee);

            let transaction = await ercForwarderClient.sendTxEIP712({req:tx});
            //returns an object containing code, log, message, txHash 
            console.log(transaction);
          
            if(transaction && transaction.code == 200 && transaction.txHash) {
              //event emitter methods
              ethersProvider.once(transaction.txHash, (result) => {
                // Emitted when the transaction has been mined
                console.log("result++: ",result);
              });
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


function useSwapCallArguments(
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  biconomy.onEvent(biconomy.READY, () => {
    // Initialize your dapp here like getting user accounts etc
    _ercForwarderClient = biconomy.erc20ForwarderClient;
    _permitClient = biconomy.permitClient;
    // console.log('permitClientOnevent++++++', _permitClient, _ercForwarderClient)
  }).onEvent(biconomy.ERROR, () => {
    // Handle error while initializing mexa
    // console.log(error, message)
  });
  
  return useMemo(() => {
    if (!library || !account || !chainId  || !_permitClient || !_ercForwarderClient) return []
    // console.log('HIIII++', _permitClient)
    // const contract3: Contract | null = getContract('0xa15E697806711003E635bEe08CA049130C4917fd', CHILL_ABI, library, account)
    // const contract3: Contract | null = getContract('0xD6689f303fA491f1fBba919C1AFa619Bd8E595e3', BICONOMYSWAPPER_ABI, library, account)
    
    const _contract: Contract | null = getBiconomySwappperContract('0xf7972686B57a861D079A1477cbFF7B7B6A469A43', BICONOMYSWAPPER_ABI, library, account)
    const _ethersProvider: Web3Provider | null = getEthersProvider()
    // const _ercForwarderClient: any | null = getErcForwarderClient()
    // const _permitClient: any | null = getPermitClient()

    // console.log('contract3+++++', _contract, _ethersProvider)

    if (!_contract && !_permitClient) {
      return []
    }

    const swapMethods = []
    const _parameters = { pid : '0', amount: '0'}
    const pass = {
      account: account,
      contract: _contract, 
      ethersProvider: _ethersProvider, 
      permitClient: _permitClient,
      ercForwarderClient: _ercForwarderClient, 
      parameters: _parameters
    } 
    swapMethods.push(pass)
    return swapMethods

    // return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, chainId, library, _permitClient, _ercForwarderClient])
}

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
          
          swapCalls.map(async (call) => {
            const {
              account,
              parameters,
              contract,
              ethersProvider,
              ercForwarderClient,
              permitClient
            } = call
            console.log('AllSwapCalls:++', account, contract, ethersProvider, permitClient, ercForwarderClient, parameters)

            const domainData = {
              name: "Dai Stablecoin",
              version: "1",
              chainId: 42,
              verifyingContract: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa" // kovan
            };

            const tokenPermitOptions1 = { //contract
              spender: '0xf7972686B57a861D079A1477cbFF7B7B6A469A43',
              domainData: domainData,
              value: "100000000000000000000", 
              deadline: Math.floor(Date.now() / 1000 + 3600),
            }

            const tokenPermitOptions2 = { //forwarder
              domainData: domainData,
              value: "100000000000000000000", 
              deadline: Math.floor(Date.now() / 1000 + 3600),
            }
            
            let permitTx1 = await permitClient.daiPermit(tokenPermitOptions1);
            await permitTx1.wait(1)
            console.log('permitTx1++: ', permitTx1)
            
            let permitTx2 = await permitClient.daiPermit(tokenPermitOptions2);
            await permitTx2.wait(1)
            console.log('permitTx2++: ', permitTx2)

            // // // const options = !value || isZero(value) ? {} : { value }
            // // // console.log('methodName1:', methodName)
            const addr1 = "0x48845392F5a7c6b360A733e0ABE2EdcC74f1F4d6"
            const dai = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"
            const path = ["0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa","0xd0A1E359811322d97991E03f863a0C30C2cF029C"]

            const txResponse = await contract.populateTransaction.swapWithoutETH(addr1, dai, path, '100000000')

            let gasPrice = await ethersProvider.getGasPrice();
            let gasLimit = await ethersProvider.estimateGas({
              to: '0xf7972686B57a861D079A1477cbFF7B7B6A469A43',
              from: account,
              data: txResponse.data,
            });
            console.log('gasLimit++', gasLimit.toString());
            console.log('gasPrice++', gasPrice.toString());
            console.log('txResponse++', txResponse);

            const builtTx = await ercForwarderClient.buildTx({
              to: '0xf7972686B57a861D079A1477cbFF7B7B6A469A43',
              token:'0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
              txGas:Number(gasLimit),
              data: txResponse.data
            });
            const tx = builtTx.request;
            const fee = builtTx.cost;
            console.log('builtTx-tx++', tx);
            console.log('builtTx-fee++', fee);

            let transaction = await ercForwarderClient.sendTxEIP712({req:tx});
            //returns an object containing code, log, message, txHash 
            console.log(transaction);
          
            if(transaction && transaction.code == 200 && transaction.txHash) {
              //event emitter methods
              ethersProvider.once(transaction.txHash, (result) => {
                // Emitted when the transaction has been mined
                console.log("result++: ",result);
              });
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

// const useSwapper = () => {
//   // const chillContract = await useChill()
//   const handleSwapper = useCallback(
//     async () => {
//         // const contract = await getContract2()
//         console.log('contract:')
//         // await chillContract.deposit(
//         //     '0', '0'
//         // ).send({from : '0xb50685c25485CA8C520F5286Bbbf1d3F216D6989'})
//         // await contract.methods.swapWithoutETH(
//         //     '0x48845392F5a7c6b360A733e0ABE2EdcC74f1F4d6',
//         //     '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd',
//         //     ["0xff795577d9ac8bd7d90ee22b6c1703490b6512fd","0xd0A1E359811322d97991E03f863a0C30C2cF029C"],
//         //     "10000000000"
//         // ).send({from : '0x48845392F5a7c6b360A733e0ABE2EdcC74f1F4d6'})
//         // console.log(txHash)
//     },
//     [],
//   )
//   return { onSwap: handleSwapper }
// }

// export default useSwapper
