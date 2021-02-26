import DAI_kovan_contract from '../contracts/DAI_kovan.json'
import USDT_kovan_contract from '../contracts/USDT_kovan.json'
import USDC_kovan_contract from '../contracts/USDC_kovan.json'

import { Contract } from '@ethersproject/contracts'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'
import { Web3Provider } from '@ethersproject/providers'
import Swal from 'sweetalert2'
import { Biconomy } from '@biconomy/mexa'
import { getEthersProvider, getBiconomySwappperContract } from '../utils'
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
// import { useTransactionAdder } from '../state/transactions/hooks'

const biconomy = new Biconomy(window.ethereum, { apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093' })
let ercForwarderClient: any
let permitClient: any

biconomy
  .onEvent(biconomy.READY, () => {
    // Initialize your dapp here like getting user accounts etc
    ercForwarderClient = biconomy.erc20ForwarderClient
    permitClient = biconomy.permitClient
  })
  .onEvent(biconomy.ERROR, () => {
  })

const useBiconomyContracts = () => {
  const { account, library } = useActiveWeb3React()
  // const addTransaction = useTransactionAdder()

  const BICONOMY_CONTRACT = '0xf7972686B57a861D079A1477cbFF7B7B6A469A43'
  const erc20ForwarderAddress = '0xbc4de0Fa9734af8DB0fA70A24908Ab48F7c8D75d'

  function getContractInstance(erc20token: string): any {
    if (erc20token === 'USDC') {
      return getContract(
        USDC_kovan_contract.address,
        USDC_kovan_contract.abi,
        library as Web3Provider,
        account as string
      )
    } else if (erc20token === 'USDT') {
      return getContract(
        USDT_kovan_contract.address,
        USDT_kovan_contract.abi,
        library as Web3Provider,
        account as string
      )
    } else if (erc20token === 'DAI') {
      return getContract(DAI_kovan_contract.address, DAI_kovan_contract.abi, library as Web3Provider, account as string)
    }
  }

  const calculateFees = async (tokenSymbol: string, path0: string, path1: string, inputAmount: any) => {
    try {
      const allowance = await checkAllowance(tokenSymbol)
      if (allowance) {
        let gasToken
        if (tokenSymbol === 'USDC') {
          gasToken = USDC_kovan_contract.address
        } else if (tokenSymbol === 'USDT') {
          gasToken = USDT_kovan_contract.address
        } else if (tokenSymbol === 'DAI') {
          gasToken = DAI_kovan_contract.address
        }
        // console.log('pathpath2++', path0, path1, gasToken, inputAmount.toString())
        const path = [path0, path1]
        const contract: Contract | null = getBiconomySwappperContract(
          BICONOMY_CONTRACT,
          BICONOMYSWAPPER_ABI,
          library as Web3Provider,
          account?.toString()
        )
        const ethersProvider: Web3Provider | null = getEthersProvider()

        const txResponse = await contract.populateTransaction.swapWithoutETH(
          account,
          path0,
          path,
          (inputAmount * 1e18).toString()
        )
        console.log('pathpath3++', txResponse)

        // const gasPrice = await ethersProvider.getGasPrice()
        const gasLimit = await ethersProvider.estimateGas({
          to: contract.address,
          from: account?.toString(),
          data: txResponse.data
        })
        // console.log('gasLimit++', gasLimit.toString())

        const builtTx = await ercForwarderClient.buildTx({
          to: contract.address,
          token: gasToken,
          txGas: Number(gasLimit),
          data: txResponse.data
        })
        // const tx = builtTx.request
        const TxFess: any = builtTx.cost
        console.log('Modal-builtTx-tx: ', TxFess)
        return TxFess
      } else {
        return 0
      }
    } catch (error) {
      console.log('error: ', error)
    }
  }

  const approveToken = async (erc20token: string) => {
    const maxValue = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

    const TokenContractInstance: Contract = getContractInstance(erc20token)
    let domainData
    let tokenPermitOptions1
    let permitTx

    if (erc20token === 'USDC') {
      domainData = {
        name: 'USDC Coin',
        version: '1',
        chainId: 42,
        verifyingContract: USDC_kovan_contract.address
      }

      tokenPermitOptions1 = {
        domainData: domainData,
        value: '100000000000000000000',
        deadline: Math.floor(Date.now() / 1000 + 3600)
      }
      permitTx = await permitClient.eip2612Permit(tokenPermitOptions1)
      await permitTx.wait(1)
      console.log('permitTx1++: ', permitTx)
    } else if (erc20token === 'USDT') {
      permitTx = await TokenContractInstance.approve(erc20ForwarderAddress, maxValue)
      await permitTx.wait(1)
      console.log('permitTx2++: ', permitTx)
    } else if (erc20token === 'DAI') {
      domainData = {
        name: 'Dai Stablecoin',
        version: '1',
        chainId: 42,
        verifyingContract: DAI_kovan_contract.address // kovan
      }

      tokenPermitOptions1 = {
        //forwarder
        domainData: domainData,
        value: '100000000000000000000',
        deadline: Math.floor(Date.now() / 1000 + 3600)
      }

      permitTx = await permitClient.daiPermit(tokenPermitOptions1)
      await permitTx.wait(1)
      console.log('permitTx3++: ', permitTx)
    }

    if (permitTx.hash) {
      // addTransaction(permitTx, {
      //   summary: 'Approve ' + erc20token,
      //   approval: { tokenAddress: erc20token, spender: erc20ForwarderAddress }
      // })
      Swal.fire('Success!', 'Allowance Tx Submitted', 'success')
      return true
    } else {
      Swal.fire('reverted', 'Tx has been cancelled or failed', 'error')
      return false
    }

    // console.log('TokenContractInstance: ', TokenContractInstance)
    // const txHash = await TokenContractInstance.approve(BICONOMY_CONTRACT, maxValue)
    // console.log('txHash++', txHash)

    // .on("error", function () {
    //   Swal.fire("reverted", "Tx has been cancelled by user", "error");
    // })
    // .on("transactionHash", function (hash: any) {
    //   Swal.fire("Success!", "Allowance Tx Submitted", "success");
    // })
    // .on("receipt", function (receipt: any) {
    //   // setShouldUpdate(true);
    // });
  }

  const checkAllowance = async (erc20token: string) => {
    const TokenContractInstance = getContractInstance(erc20token)
    console.log('TokenContractInstance', TokenContractInstance)
    const allowance = await TokenContractInstance.allowance(account, erc20ForwarderAddress)
    if (allowance > 0) {
      return true
    } else {
      return false
    }
  }

  const checkBalance = async (erc20token: string) => {
    const TokenContractInstance = getContractInstance(erc20token)
    const balance = await TokenContractInstance.balanceOf(account)
    console.log('balance:::', balance)
    return balance
  }

  return {
    approveToken,
    checkAllowance,
    checkBalance,
    calculateFees
  }
}

export default useBiconomyContracts
