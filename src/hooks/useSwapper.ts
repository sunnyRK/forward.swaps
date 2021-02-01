import { useMemo } from 'react'
// import { SwapParameters } from '@uniswap/sdk'
// import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { getContract } from "../utils"
// import { Web3Provider } from '@ethersproject/providers'
// import { useChill } from "../hooks/useContract";
import { useActiveWeb3React } from './index'
// import { useChill, useGovernanceContract } from "../hooks/useContract";
import CHILL_ABI  from "../constants/abis/chill.json";
// import { BigNumber } from 'ethers';

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
  contract: Contract
  parameters: depositParameters
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

function useSwapCallArguments(
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  return useMemo(() => {
    if (!library || !account || !chainId ) return []

    const contract2: Contract | null = getContract('0x4ad97fd79F8a2aE0e5415821BC06781bF5a164e1', CHILL_ABI, library, account)
    
    if (!contract2) {
      return []
    }
    
    const swapMethods = []

    const paramss = { pid : '0', amount: '0'}
    const pass1 = {contract: contract2, parameters: paramss} 
    swapMethods.push(pass1)
    return swapMethods
    
    // return swapMethods.map(parameters => ({ parameters, contract }))
  }, [account, chainId, library])
}

export function useSwapper() : {
  state: SwapCallbackState; callback : any; error: string | null
} {
    const { account } = useActiveWeb3React()
  
    // const chillContract = getContract('0x4ad97fd79F8a2aE0e5415821BC06781bF5a164e1', CHILL_ABI, library, account)
    // console.log(chillContract)

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
              parameters,
              contract
            } = call
            console.log('contract:+', contract, parameters)
            // const options = !value || isZero(value) ? {} : { value }
            // console.log('methodName1:', methodName)
            const txResponse = await contract.deposit('0', '0')
            const txReciept = await txResponse.wait()
            console.log('txReciept: ', txReciept)
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
