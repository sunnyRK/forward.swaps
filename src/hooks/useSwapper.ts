import { useMemo } from 'react'
// import { SwapParameters } from '@uniswap/sdk'
// import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { getBiconomySwappperContract, getEthersProvider } from "../utils"
import { Web3Provider } from '@ethersproject/providers'
// import { useChill } from "../hooks/useContract";
import { useActiveWeb3React } from './index'
// import { useChill, useGovernanceContract } from "../hooks/useContract";
// import CHILL_ABI  from "../constants/abis/chill.json";
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
// import { BigNumber } from 'ethers';
import { Biconomy } from "@biconomy/mexa";

const biconomy = new Biconomy(window.ethereum,{apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093'});
let _ercForwarderClient : any;
let _permitClient : any;

// biconomy.onEvent(biconomy.READY, () => {
//   // Initialize your dapp here like getting user accounts etc
//   _ercForwarderClient = biconomy.erc20ForwarderClient;
//   _permitClient = biconomy.permitClient;
//   console.log('permitClientOnevent++++++', _permitClient, _ercForwarderClient)
// }).onEvent(biconomy.ERROR, () => {
//   // Handle error while initializing mexa
//   // console.log(error, message)
// });

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
  ercForwarderClient: any
  permitClient: any
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

  biconomy.onEvent(biconomy.READY, () => {
    // Initialize your dapp here like getting user accounts etc
    _ercForwarderClient = biconomy.erc20ForwarderClient;
    _permitClient = biconomy.permitClient;
    console.log('permitClientOnevent++++++', _permitClient, _ercForwarderClient)
  }).onEvent(biconomy.ERROR, () => {
    // Handle error while initializing mexa
    // console.log(error, message)
  });
  
  return useMemo(() => {
    if (!library || !account || !chainId  || !_permitClient || !_ercForwarderClient) return []
    console.log('HIIII++', _permitClient)
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

export function useSwapper() : {
  state: SwapCallbackState; callback : any; error: string | null
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
