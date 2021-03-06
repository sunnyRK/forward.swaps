import DAI_kovan_contract from '../contracts/DAI_kovan.json'
import USDT_kovan_contract from '../contracts/USDT_kovan.json'
import USDC_kovan_contract from '../contracts/USDC_kovan.json'
// import { BigNumber } from '@ethersproject/bignumber'
// import { BigNumber } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'
import { Web3Provider } from '@ethersproject/providers'
import Swal from 'sweetalert2'
import { Biconomy } from '@biconomy/mexa'
import { getEthersProvider, getBiconomySwappperContract } from '../utils'
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
import { parseEther } from '@ethersproject/units'
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
  .onEvent(biconomy.ERROR, () => {})

const daiDomainType = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
]

const eip2612PermitType = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }
]

const daiPermitType = [
  { name: 'holder', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
  { name: 'allowed', type: 'bool' }
]

// interface PermitOptions {
//   holder: string
//   spender: string
//   value: string
//   nonce: string
//   expiry: string
//   allowed: boolean
//   v: string
//   r: string
//   s: string
// }

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
        // console.log('pathpath3++', txResponse)

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

  const approveTokenAndSwap = async (erc20token: string, token0: string, token1: string, inputAmount: string) => {
    const ethersProvider: Web3Provider | null = getEthersProvider()
    const TokenContractInstance: Contract = getContractInstance(erc20token)

    const contract: Contract | null = getBiconomySwappperContract(
      '0xf7972686B57a861D079A1477cbFF7B7B6A469A43',
      BICONOMYSWAPPER_ABI,
      library as Web3Provider
    )

    let domainData
    let tokenPermitOptions1
    let permitTx

    if (erc20token === 'USDC') {
      debugger
      domainData = {
        name: 'USDC Coin',
        version: '1',
        chainId: 42,
        verifyingContract: USDC_kovan_contract.address
      }

      // let { data } = await contract.populateTransaction.setQuote(newQuote);
      const path = [token0, token1]

      console.log("Params: +++", account, token0, path, parseEther(inputAmount))
      const {data} = await contract.populateTransaction.swapWithoutETH(
        account,
        token0,
        path,
        parseEther(inputAmount)
      )

        let gasPrice = await ethersProvider.getGasPrice();
        let gasLimit = await ethersProvider.estimateGas({
          to: contract.address,
          from: account?.toString(),
          data: data,
        });
        console.log(gasLimit.toString());
        console.log(gasPrice.toString());
        console.log(data);

        const builtTx = await ercForwarderClient.buildTx({
          to: contract.address,
          token: USDC_kovan_contract.address,
          txGas:Number(gasLimit),
          data,
          permitType : "EIP2612_Permit"
        });
        const tx = builtTx.request;
        const fee = builtTx.cost;
        console.log(tx);
        console.log(fee);

        
      tokenPermitOptions1 = {
        spender: erc20ForwarderAddress,
        domainData: domainData,
        value: '100000000000000000000', // To do 1
        deadline: Math.floor(Date.now() / 1000 + 3600)
      }

        const nonce = await TokenContractInstance.nonces(USDC_kovan_contract.address);
        console.log(`nonce is : ${nonce}`);

        const permitDataToSign = {
          types: {
            EIP712Domain: daiDomainType,
            Permit: eip2612PermitType,
          },
          domain: tokenPermitOptions1,
          primaryType: "Permit",
          message: {
            owner: account,
            spender: erc20ForwarderAddress,
            nonce: parseInt(nonce),
            value: tokenPermitOptions1.value,
            deadline: parseInt(tokenPermitOptions1.deadline.toString()),
          },
        };

        let result = await ethersProvider.send("eth_signTypedData_v3", [
          account,
          JSON.stringify(permitDataToSign),
        ]);

        console.log(result);
          
        let metaInfo: any = {};
        let permitOptions: any = {};

        const signature = result.substring(2);
        const r = "0x" + signature.substring(0, 64);
        const s = "0x" + signature.substring(64, 128);
        const v = parseInt(signature.substring(128, 130), 16);

        permitOptions.holder = account;
        permitOptions.spender = erc20ForwarderAddress;
        permitOptions.value = tokenPermitOptions1.value; 
        permitOptions.nonce = parseInt(nonce.toString());
        permitOptions.expiry = parseInt(tokenPermitOptions1.deadline.toString());
        permitOptions.allowed = true;
        permitOptions.v = v;
        permitOptions.r = r;
        permitOptions.s = s;

        // validations of permit Type is needed for meta info and within buildTx

        metaInfo.permitType = "EIP2612_Permit";
        metaInfo.permitData = permitOptions;


        //signature of this method is permitAndSendTxEIP712({req, signature = null, userAddress, metaInfo})
        //signature param is optional. check network agnostics section for more details about this
        //userAddress is must when your provider does not have a signer with accounts 
        let transaction = await ercForwarderClient.permitAndSendTxEIP712({req:tx, metaInfo: metaInfo});
        //returns an object containing code, log, message, txHash 
        console.log(transaction);
      
        if(transaction && transaction.code == 200 && transaction.txHash) {
          //event emitter methods
          ethersProvider.once(transaction.txHash, (result: any) => {
            // Emitted when the transaction has been mined
            console.log('result++:', result);
          });
        } else {
        }
      }

      const result = await ethersProvider.send('eth_signTypedData_v3', [account, JSON.stringify(permitDataToSign)])

      console.log(result)

      const metaInfo: any = {}
      const permitOptions: any = {}

      const signature = result.substring(2)
      const r = '0x' + signature.substring(0, 64)
      const s = '0x' + signature.substring(64, 128)
      const v = parseInt(signature.substring(128, 130), 16)

      permitOptions.holder = account
      permitOptions.spender = erc20ForwarderAddress
      permitOptions.value = tokenPermitOptions1.value
      permitOptions.nonce = parseInt(nonce.toString())
      permitOptions.expiry = parseInt(tokenPermitOptions1.deadline.toString())
      permitOptions.allowed = true
      permitOptions.v = v
      permitOptions.r = r
      permitOptions.s = s

      // validations of permit Type is needed for meta info and within buildTx

      metaInfo.permitType = 'EIP2612_Permit'
      metaInfo.permitData = permitOptions

      //signature of this method is permitAndSendTxEIP712({req, signature = null, userAddress, metaInfo})
      //signature param is optional. check network agnostics section for more details about this
      //userAddress is must when your provider does not have a signer with accounts
      const transaction = await ercForwarderClient.permitAndSendTxEIP712({ req: tx, metaInfo: metaInfo })
      //returns an object containing code, log, message, txHash
      console.log(transaction)

      if (transaction && transaction.code == 200 && transaction.txHash) {
        //event emitter methods
        ethersProvider.once(transaction.txHash, result => {
          // Emitted when the transaction has been mined
          console.log(result)
        })
      } else {
      }
      console.log('permitTx1++: ', permitTx)
    } else if (erc20token === 'DAI') {
      domainData = {
        name: 'Dai Stablecoin',
        version: '1',
        chainId: 42,
        verifyingContract: DAI_kovan_contract.address // kovan
      }

      const daiPermitOptions = {
        spender: erc20ForwarderAddress,
        expiry: Math.floor(Date.now() / 1000 + 3600),
        allowed: true
      }

      const userAddress = account
      // let functionSignature = contract.methods.setQuote(newQuote).encodeABI();
      // console.log(functionSignature);
      const path = [token0, token1]
      const {data} = await contract.populateTransaction.swapWithoutETH(
        account,
        token0,
        path,
        inputAmount
      )

      console.log('Sending meta transaction')
      // showInfoMessage("Building transaction to forward");
      // txGas should be calculated and passed here or calculate within the method
      // let gasLimit = await contract.methods
      // .setQuote(newQuote)
      // .estimateGas({ from: userAddress });

      // let gasPrice = await ethersProvider.getGasPrice();
      const gasLimit = await ethersProvider.estimateGas({
        to: contract.address,
        from: account?.toString(),
        data: data,
      });

      const builtTx = await ercForwarderClient.buildTx({
        to: contract.address,
        token: DAI_kovan_contract.address,
        txGas: Number(gasLimit),
        data: data,
        permitType : "DAI_Permit"
      });

      debugger

      const tx = builtTx.request
      const fee = builtTx.cost // only gets the cost of target method call
      console.log(tx)
      console.log(fee)
      alert(`You will be charged ${fee} amount of DAI ${biconomy.daiTokenAddress} for this transaction`)

      const nonce = await TokenContractInstance.nonces(account).call()
      console.log(`nonce is : ${nonce}`)

      const permitDataToSign = {
        types: {
          EIP712Domain: daiDomainType,
          Permit: daiPermitType
        },
        domain: domainData,
        primaryType: 'Permit',
        message: {
          holder: userAddress,
          spender: daiPermitOptions.spender,
          nonce: parseInt(nonce),
          expiry: parseInt(daiPermitOptions.expiry.toString()),
          allowed: daiPermitOptions.allowed
        }
      }

      const result = await ethersProvider.send('eth_signTypedData_v3', [userAddress, JSON.stringify(permitDataToSign)])

      console.log(result)

      const metaInfo: any = {}
      const permitOptions: any = {}

      console.log('success:' + result)
      const signature = result.substring(2)
      const r = '0x' + signature.substring(0, 64)
      const s = '0x' + signature.substring(64, 128)
      const v = parseInt(signature.substring(128, 130), 16)

      permitOptions.holder = account
      permitOptions.spender = daiPermitOptions.spender
      permitOptions.value = 0 //in case of DAI passing dummy value for the sake of struct (similar to token address in EIP2771)
      permitOptions.nonce = parseInt(nonce.toString())
      permitOptions.expiry = parseInt(daiPermitOptions.expiry.toString())
      permitOptions.allowed = daiPermitOptions.allowed
      permitOptions.v = v
      permitOptions.r = r
      permitOptions.s = s

      metaInfo.permitType = 'DAI_Permit'
      metaInfo.permitData = permitOptions

      //signature of this method is sendTxEIP712({req, signature = null, userAddress, metaInfo})
      const transaction = await ercForwarderClient.permitAndSendTxEIP712({ req: tx, metaInfo: metaInfo })

      //returns an object containing code, log, message, txHash
      console.log(transaction)
      if (transaction && transaction.txHash) {
        if (transaction && transaction.code == 200 && transaction.txHash) {
          //event emitter methods
          ethersProvider.once(transaction.txHash, (result: any) => {
            // Emitted when the transaction has been mined
            console.log('result++:', result);
          });
        } else {
        }
        // const receipt = await fetchMinedTransactionReceipt(transaction.txHash);
        // if(receipt)
        // {
        //   console.log(receipt);
        // }
        console.log('permitTx1++: ', permitTx)
      }
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
        // value: BigNumber.from('100000000000000000000'),
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
        // value: BigNumber.from('100000000000000000000'),
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
    approveTokenAndSwap,
    checkAllowance,
    checkBalance,
    calculateFees
  }
}

export default useBiconomyContracts
