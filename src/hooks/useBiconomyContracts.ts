import DAI_kovan_contract from '../contracts/DAI_kovan.json'
import USDT_kovan_contract from '../contracts/USDT_kovan.json'
import USDC_kovan_contract from '../contracts/USDC_kovan.json'
import Tradeable_USDC_kovan_contract from '../contracts/Tradeable_USDC_kovan.json'
import Tradeable_USDT_kovan_contract from '../contracts/Tradeable_USDT_kovan.json'
import { Contract } from '@ethersproject/contracts'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'
import { Web3Provider } from '@ethersproject/providers'
import Swal from 'sweetalert2'
import { ethers } from "ethers";
import { getEthersProvider, getBiconomySwappperContract, getFaucetContract, getFaucet2Contract } from '../utils'
import BICONOMYSWAPPER_ABI from '../constants/abis/biconomyswapper.json'
import { BICONOMY_CONTRACT, ERC20_FORWARDER_ADDRESS } from "../constants/config";
import { getPermitClient, getErcForwarderClient } from "../biconomy/biconomy";
import { useWaitActionHandlers } from '../state/waitmodal/hooks'
import { getEtherscanLink } from '../utils'

const domainType = [
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

const useBiconomyContracts = () => {
  const { account, library, chainId } = useActiveWeb3React()
  const { onChangeApproved, onChangeOpen, onChangeGasModal } = useWaitActionHandlers()

  function getContractInstance(erc20token: string): any {
    try {
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
    } catch (error) {
      console.log('Error-getContractInstance: ', error)
    }
  }

  const calculateFees = async (tokenSymbol: string, paths: any[], inputAmount: any, decimals:any) => {
    try {
      if(getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
        Swal.fire('Something went wrong!')
        onChangeOpen(false)
        return
      } else {
        console.log(decimals)
        console.log(inputAmount)
        let effectiveInput = (parseFloat(inputAmount) * parseFloat((ethers.BigNumber.from(10).pow(ethers.BigNumber.from(decimals))).toString())) - parseFloat("100")
        console.log(effectiveInput)
        let gasToken
        if (tokenSymbol === 'USDC') {
          gasToken = USDC_kovan_contract.address
        } else if (tokenSymbol === 'USDT') {
          gasToken = USDT_kovan_contract.address
        } else if (tokenSymbol === 'DAI') {
          gasToken = DAI_kovan_contract.address
        }

        // const path = [path0, path1]
        const contract: Contract | null = getBiconomySwappperContract(
          BICONOMY_CONTRACT,
          BICONOMYSWAPPER_ABI,
          library as Web3Provider,
          account?.toString()
        )
        const ethersProvider: Web3Provider | null = getEthersProvider()
        
        const txResponse = await contract.populateTransaction.swapWithoutETH(
          account,
          paths[0],
          paths,
          effectiveInput.toString()
        )

        const gasLimit = await ethersProvider.estimateGas({
          to: contract.address,
          from: account?.toString(),
          data: txResponse.data
        })
      
        const builtTx = await getErcForwarderClient().buildTx({
          to: contract.address,
          token: gasToken,
          txGas: Number(gasLimit),
          data: txResponse.data
        })

        const TxFess: any = builtTx.cost
        console.log('Modal-builtTx-tx: ', TxFess)
        return TxFess
      }
    } catch (error) {
      console.log('error-calculateFees: ', error)
      if(error.code == -32603) {
        console.log('Failed to Fetch RPC in calculateFees')
      }
      if(error.code == -32016) {
        Swal.fire("Something went wrong with from token")
        return ""
      }
      return undefined
    }
  }

  const approveTokenAndSwap = async (erc20token: string, inputAmount: any, paths: any[], decimals: any) => {
    try {
      if(getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
        Swal.fire('Something went wrong!')
        onChangeOpen(false)
        return
      } else {
        const ethersProvider: Web3Provider | null = getEthersProvider()
        const TokenContractInstance: Contract = getContractInstance(erc20token)
        let effectiveInput = (parseFloat(inputAmount) * parseFloat((ethers.BigNumber.from(10).pow(ethers.BigNumber.from(decimals))).toString())) - parseFloat("10")
        console.log(effectiveInput)

        const contract: Contract | null = getBiconomySwappperContract(
          BICONOMY_CONTRACT,
          BICONOMYSWAPPER_ABI,
          library as Web3Provider
        )

        // const path = [token0, token1]
        const txResponse = await contract.populateTransaction.swapWithoutETH(
          account,
          paths[0],
          paths,
          effectiveInput.toString()
        )

        let domainData
        let tokenPermitOptions
        onChangeOpen(false)
        onChangeGasModal(false)
        
        Swal.fire({
          title: 'Please sign the permit message.',
          html: '',
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading()
          }
        }).then((result: any) => {
          if (result.dismiss === Swal.DismissReason.timer) {
            
          }
        })

        if (erc20token === 'USDC') {
          domainData = {
            name: 'USDC Coin',
            version: '1',
            chainId: 42,
            verifyingContract: USDC_kovan_contract.address
          }

          let gasLimit = await ethersProvider.estimateGas({
            to: contract.address,
            from: account?.toString(),
            data: txResponse.data,
          });
          console.log(gasLimit.toString());

          const builtTx = await getErcForwarderClient().buildTx({
            to: contract.address,
            token: USDC_kovan_contract.address,
            txGas:Number(gasLimit),
            data: txResponse.data,
            permitType : "EIP2612_Permit"
          });
          const tx = builtTx.request;
            
          tokenPermitOptions = {
            spender: ERC20_FORWARDER_ADDRESS,
            domainData: domainData,
            value: '100000000000000000000', 
            deadline: Math.floor(Date.now() / 1000 + 3600)
          }

          const nonce = await TokenContractInstance.nonces(account);
          console.log(`nonce is : ${nonce}`);

          const permitDataToSign = {
            types: {
              EIP712Domain: domainType,
              Permit: eip2612PermitType,
            },
            domain: domainData,
            primaryType: "Permit",
            message: {
              owner: account,
              spender: ERC20_FORWARDER_ADDRESS,
              nonce: parseInt(nonce),
              value: tokenPermitOptions.value,
              deadline: parseInt(tokenPermitOptions.deadline.toString()),
            },
          };

          let result = await ethersProvider.send("eth_signTypedData_v3", [
            account,
            JSON.stringify(permitDataToSign),
          ]);
          console.log('ApproveResult: ', result);

          Swal.fire({
            title: 'Please sign the swap message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          // result.wait(1)
            
          let metaInfo: any = {};
          let permitOptions: any = {};

          const signature = result.substring(2);
          const r = "0x" + signature.substring(0, 64);
          const s = "0x" + signature.substring(64, 128);
          const v = parseInt(signature.substring(128, 130), 16);

          permitOptions.holder = account;
          permitOptions.spender = ERC20_FORWARDER_ADDRESS;
          permitOptions.value = tokenPermitOptions.value; 
          permitOptions.nonce = parseInt(nonce.toString());
          permitOptions.expiry = tokenPermitOptions.deadline;
          permitOptions.allowed = true;
          permitOptions.v = v;
          permitOptions.r = r;
          permitOptions.s = s;

          metaInfo.permitType = "EIP2612_Permit";
          metaInfo.permitData = permitOptions;

          let transaction = await getErcForwarderClient().permitAndSendTxEIP712({req:tx, metaInfo: metaInfo});
          console.log(transaction);

          Swal.fire({
            title: 'Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
        
          if(transaction && transaction.code == 200 && transaction.txHash) {
            ethersProvider.once(transaction.txHash, (result: any) => {
              // const hashLink = "https://kovan.etherscan.io/tx/"+transaction.txHash
              const chainIdForEtherscan: any = chainId
              console.log('result++:', result);
              Swal.fire({
                title: 'Transaction Successfull',
                text: 'Transaction Successfull',
                html:
                  `<a href=${getEtherscanLink(chainIdForEtherscan, transaction.txHash, 'transaction')} target="_blank">Etherscan</a>`,
                icon: 'success',
                confirmButtonText: 'continue'
              })
                .then((result: any) => {
                  onChangeApproved(true)
                  onChangeOpen(false)
                })
                .catch((error: any) => {
                  Swal.fire('reverted', 'Transaction Failed', 'error')
                })
            });
          }
        } else if (erc20token === 'DAI') {
          domainData = {
            name: 'Dai Stablecoin',
            version: '1',
            chainId: 42,
            verifyingContract: DAI_kovan_contract.address // kovan
          }

          const daiPermitOptions = {
            spender: ERC20_FORWARDER_ADDRESS,
            expiry: Math.floor(Date.now() / 1000 + 3600),
            allowed: true
          }

          const userAddress = account
          const gasLimit = await ethersProvider.estimateGas({
            to: contract.address,
            from: account?.toString(),
            data: txResponse.data,
          });

          const builtTx = await getErcForwarderClient().buildTx({
            to: contract.address,
            token: DAI_kovan_contract.address,
            txGas: Number(gasLimit),
            data: txResponse.data,
            permitType : "DAI_Permit"
          });

          const tx = builtTx.request
          const nonce = await TokenContractInstance.nonces(account)

          const permitDataToSign = {
            types: {
              EIP712Domain: domainType,
              Permit: daiPermitType,
            },
            domain: domainData,
            primaryType: "Permit",
            message: {
              holder: account,
              spender: daiPermitOptions.spender,
              nonce: parseInt(nonce),
              expiry: parseInt(daiPermitOptions.expiry.toString()),
              allowed: daiPermitOptions.allowed,
            },
          };

          const result = await ethersProvider.send('eth_signTypedData_v3', 
            [userAddress, JSON.stringify(permitDataToSign)])
          console.log(result)

          Swal.fire({
            title: 'Please sign the swap message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          // result.wait(1)

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
          
          const transaction = await getErcForwarderClient().permitAndSendTxEIP712({ req: tx, metaInfo: metaInfo })
          console.log('transaction++', transaction)

          Swal.fire({
            title: 'Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })

          if (transaction && transaction.txHash) {
            if (transaction && transaction.code == 200 && transaction.txHash) {
              //event emitter methods
              ethersProvider.once(transaction.txHash, (result: any) => {
                // Emitted when the transaction has been mined
                console.log('result++:', result);
                // const hashLink = "https://kovan.etherscan.io/tx/"+transaction.txHash
                const chainIdForEtherscan: any = chainId
                Swal.fire({
                  title: 'Transaction Successfull',
                  text: 'Transaction Successfull',
                  icon: 'success',
                  html:
                  `<a href=${getEtherscanLink(chainIdForEtherscan, transaction.txHash, 'transaction')} target="_blank">Etherscan</a>`,
                  confirmButtonText: 'continue'
                })
                  .then((result: any) => {
                    onChangeApproved(true)
                    onChangeOpen(false)
                  })
                  .catch((error: any) => {
                    Swal.fire('reverted', 'Transaction Failed', 'error')
                  })
              });
            }
          }
        }
      }
    } catch (error) {
      console.log("error-approveTokenAndSwap: ", error)
      if(error.code == 4001) {
        Swal.fire('reverted', 'User denied message signature!', 'error')
      } else {
        Swal.fire('reverted', 'Transaction Failed!', 'error')
      }
    }
  }

  const calculateGasFeesForApproveAndSwap = async (erc20token: string, paths: any[], inputAmount: any, decimals: any) => {
    try {
      if(getErcForwarderClient() == '' || getErcForwarderClient() ==  'undefined' || getErcForwarderClient() == null) {
        Swal.fire('Something went wrong!')
        onChangeOpen(false)
        return
      } else {
        const ethersProvider: Web3Provider | null = getEthersProvider()

        const contract: Contract | null = getBiconomySwappperContract(
          BICONOMY_CONTRACT,
          BICONOMYSWAPPER_ABI,
          library as Web3Provider
        )

        let effectiveInput = (parseFloat(inputAmount) * parseFloat((ethers.BigNumber.from(10).pow(ethers.BigNumber.from(decimals))).toString())) - parseFloat("10")
        console.log(effectiveInput)

        let fee
        if (erc20token === 'USDC') {
          // const path = [token0, token1]
          console.log("Params:", account, paths, effectiveInput.toString())
          const data = await contract.populateTransaction.swapWithoutETH(
            account,
            paths[0],
            paths,
            effectiveInput.toString()
          )

          let gasLimit = await ethersProvider.estimateGas({
            to: contract.address,
            from: account?.toString(),
            data: data.data,
          });
          console.log(gasLimit.toString());
          console.log(data.data);

          const builtTx = await getErcForwarderClient().buildTx({
            to: contract.address,
            token: USDC_kovan_contract.address,
            txGas:Number(gasLimit),
            data: data.data,
            permitType : "EIP2612_Permit"
          });
          const tx = builtTx.request;
          fee = builtTx.cost;
          console.log(tx);
          console.log(fee);
        
        } else if (erc20token === 'DAI') {
          // const path = [token0, token1]
          const data = await contract.populateTransaction.swapWithoutETH(
            account,
            paths[0],
            paths,
            effectiveInput.toString()
          )

          const gasLimit = await ethersProvider.estimateGas({
            to: contract.address,
            from: account?.toString(),
            data: data.data,
          });

          const builtTx = await getErcForwarderClient().buildTx({
            to: contract.address,
            token: DAI_kovan_contract.address,
            txGas: Number(gasLimit),
            data: data.data,
            permitType : "DAI_Permit"
          });
          const tx = builtTx.request
          fee = builtTx.cost // only gets the cost of target method call
          console.log(tx)
          // console.log(fee)
        }
        console.log('calculateGasFeesForApproveAndSwap: ', fee)
        return fee.toString()
      } 
    } catch (error) {
      console.log('error-calculateGasFeesForApproveAndSwap: ', error)
      if(error.code == -32603) {
        console.log('Failed to Fetch RPC in calculateGasFeesForApproveAndSwap')
      }
      if(error.code == -32016) {
        Swal.fire("Something went wrong with from token")
        return ""
      }
      return undefined
    }
  }

  const approveToken = async (erc20token: string) => {
    try {
      if(getPermitClient() == '' || getPermitClient() ==  'undefined' || getPermitClient() == null) {
        Swal.fire('Something went wrong!')
        onChangeOpen(false)
        return
      } else {
        const maxValue = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        const TokenContractInstance: Contract = getContractInstance(erc20token)
        let domainData
        let tokenPermitOptions
        let permitTx

        if (erc20token === 'USDC') {
          Swal.fire({
            title: 'Please sign the permit message',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })

          domainData = {
            name: 'USDC Coin',
            version: '1',
            chainId: 42,
            verifyingContract: USDC_kovan_contract.address
          }
          tokenPermitOptions = {
            domainData: domainData,
            value: '10000000000000000000000',
            deadline: Math.floor(Date.now() / 1000 + 3600)
          }
          permitTx = await getPermitClient().eip2612Permit(tokenPermitOptions)
          console.log("permitTx", permitTx)

          Swal.fire({
            title: 'Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })

          await permitTx.wait(1)
          console.log('permitTxConfirm: ', permitTx)
        } else if (erc20token === 'USDT') {
          Swal.fire({
            title: 'Please approve to spend USDT',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })

          permitTx = await TokenContractInstance.approve(ERC20_FORWARDER_ADDRESS, maxValue)
          await permitTx.wait(1)
          console.log('permitTx: ', permitTx)
        } else if (erc20token === 'DAI') {
            Swal.fire({
              title: 'Please sign the permit message',
              html: '',
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading()
              }
            }).then((result: any) => {
              if (result.dismiss === Swal.DismissReason.timer) {
              }
            })

            domainData = {
              name: 'Dai Stablecoin',
              version: '1',
              chainId: 42,
              verifyingContract: DAI_kovan_contract.address // kovan
            }

            tokenPermitOptions = {
              domainData: domainData,
              value: '100000000000000000000',
              deadline: Math.floor(Date.now() / 1000 + 3600)
            }
            permitTx = await getPermitClient().daiPermit(tokenPermitOptions)
            console.log("permitTx+", permitTx)
            Swal.fire({
              title: 'Transaction Sent',
              html: 'Waiting for Confirmation...',
              timerProgressBar: true,
              didOpen: () => {
                Swal.showLoading()
              }
            }).then((result: any) => {
              if (result.dismiss === Swal.DismissReason.timer) {
              }
            })
            await permitTx.wait(1)
            console.log('permitTxConfirm: ', permitTx) 
        }

        if (permitTx.hash) {
          // const hashLink = "https://kovan.etherscan.io/tx/"+permitTx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Transaction Successfull',
            text: 'Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, permitTx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
            .then((result: any) => {
              onChangeApproved(true)
            })
            .catch((error: any) => {
              Swal.fire('reverted', 'Transaction Failed', 'error')
            })
          onChangeApproved(true)
          return true
        } else {
          Swal.fire('reverted', 'Tx has been cancelled or failed', 'error')
          return false
        }
      }
    } catch (error) {
      console.log("error-approveToken: ", error)
      if(error.code == 4001) {
        Swal.fire('reverted', 'User denied message signature!', 'error')
      } else {
        Swal.fire('reverted', 'Transaction Failed!', 'error')
      }
      return false
    }
  }

  const checkAllowance = async (erc20token: string, inputAmount: any, decimals: any) => {
    let isApproved: any
    try {
      const TokenContractInstance = getContractInstance(erc20token)
      const allowance = await TokenContractInstance.allowance(account, ERC20_FORWARDER_ADDRESS)
      console.log('Allowance', erc20token, allowance.toString())
      // TO do for USDT 1e6 into inputAmount line 669
      if(erc20token == 'USDT') {
        if (parseInt(allowance) > 0) {
          isApproved = true
          return isApproved
        } else {
          isApproved = false
          return isApproved
        }
      } else {
        if (parseInt(allowance) > 0) {
          isApproved = true
          return isApproved
        } else {
          isApproved = false
          return isApproved
        }
      }
    } catch (error) {
      console.log('Error-checkAllowance: ', error)
      if(error.code == -32603) {
        console.log('Failed to Fetch RPC in checkAllowance')
      }
      if(error.code == -32016) {
        console.log('Revert due to some reason. Allowance check failed. Marking False')
        isApproved = false;
        return isApproved
      }
      return isApproved
    }
  }

  const checkBalance = async (erc20token: string) => {
    try {
      const TokenContractInstance = getContractInstance(erc20token)
      const balance = await TokenContractInstance.balanceOf(account)
      return balance 
    } catch (error) {
      console.log('Error-checkBalance: ', error) 
      if(error.code == -32603) {
        console.log('Failed to Fetch RPC in checkBalance')
      }
      return undefined
    }
  }

  const checkBalanceOfFaucet = async (erc20token: string, faucetAddress: string) => {
    try {
      const TokenContractInstance = getContractInstance(erc20token)
      const faucetBalance = await TokenContractInstance.balanceOf(faucetAddress)
      return faucetBalance 
    } catch (error) {
      console.log('Error-checkBalanceOfFaucet: ', error)
      if(error.code == -32603) {
        console.log('Failed to Fetch RPC in checkBalanceOfFaucet')
      }
      return undefined
    }
  }

  const faucetTransfer = async (tokenSymbol: string) => {
    try {
      if(chainId == 42) {
        const contract: Contract = await getFaucetContract()
        const contract2: Contract = await getFaucet2Contract()
        // console.log('FaucetContract:', contract)
        let erc20TokenAddress
        if (tokenSymbol === 'USDC') {
          erc20TokenAddress = USDC_kovan_contract.address
          Swal.fire({
            title: 'Please sign the faucet transaction message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          let tx = await contract.getTokens(erc20TokenAddress);
          console.log('FaucetTx:', tx)  
          // const hashLink = "https://kovan.etherscan.io/tx/"+tx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Faucet Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          await tx.wait(1)
          Swal.fire({
            title: 'Faucet Transaction Successfull',
            text: 'Faucet Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, tx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
          console.log('FaucetTx:', tx)  
        } else if (tokenSymbol === 'USDT') {
          erc20TokenAddress = USDT_kovan_contract.address
          Swal.fire({
            title: 'Please sign the faucet transaction message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          let tx = await contract.getTokens(erc20TokenAddress);
          console.log('FaucetTx:', tx)  
          // const hashLink = "https://kovan.etherscan.io/tx/"+tx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Faucet Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          await tx.wait(1)
          Swal.fire({
            title: 'Faucet Transaction Successfull',
            text: 'Faucet Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, tx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
          console.log('FaucetTx:', tx)  
        } else if (tokenSymbol === 'DAI') {
          const newWindow = window.open('https://app.uniswap.org/#/swap?exactField=input&exactAmount=0.1&outputCurrency=0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', '_blank', 'noopener,noreferrer')
          if (newWindow) {
              newWindow.opener = null
              return
          }
          /*erc20TokenAddress = DAI_kovan_contract.address
          Swal.fire({
            title: 'Please sign the faucet transaction message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          let tx = await contract2.getTokens(erc20TokenAddress);
          console.log('FaucetTx:', tx)  
          // const hashLink = "https://kovan.etherscan.io/tx/"+tx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Faucet Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          await tx.wait(1)
          Swal.fire({
            title: 'Faucet Transaction Successfull',
            text: 'Faucet Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, tx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
          console.log('FaucetTx:', tx) */ 
        } else if (tokenSymbol === 'TUSDC') {
          erc20TokenAddress = Tradeable_USDC_kovan_contract.address
          Swal.fire({
            title: 'Please sign the faucet transaction message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          let tx = await contract.getTokens(erc20TokenAddress);
          console.log('FaucetTx:', tx)  
          // const hashLink = "https://kovan.etherscan.io/tx/"+tx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Faucet Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          await tx.wait(1)
          Swal.fire({
            title: 'Faucet Transaction Successfull',
            text: 'Faucet Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, tx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
          console.log('FaucetTx:', tx) 
        }
        else if (tokenSymbol === 'TUSDT') {
          /*const newWindow = window.open('https://app.uniswap.org/#/swap?exactField=input&exactAmount=0.1&outputCurrency=0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', '_blank', 'noopener,noreferrer')
          if (newWindow) {
              newWindow.opener = null
              return
          }*/
          erc20TokenAddress = Tradeable_USDT_kovan_contract.address
          Swal.fire({
            title: 'Please sign the faucet transaction message.',
            html: '',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              
            }
          })
          let tx = await contract2.getTokens(erc20TokenAddress);
          console.log('FaucetTx:', tx)  
          // const hashLink = "https://kovan.etherscan.io/tx/"+tx.hash
          const chainIdForEtherscan: any = chainId
          Swal.fire({
            title: 'Faucet Transaction Sent',
            html: 'Waiting for Confirmation...',
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
            }
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
            }
          })
          await tx.wait(1)
          Swal.fire({
            title: 'Faucet Transaction Successfull',
            text: 'Faucet Transaction Successfull',
            icon: 'success',
            html:
            `<a href=${getEtherscanLink(chainIdForEtherscan, tx.hash, 'transaction')} target="_blank">Etherscan</a>`,
            confirmButtonText: 'continue'
          })
          console.log('FaucetTx:', tx)  
        }
        else if (tokenSymbol === 'KETH') {
          const newWindow = window.open('https://gitter.im/kovan-testnet/faucet', '_blank', 'noopener,noreferrer')
          if (newWindow) {
              newWindow.opener = null
              return
          }
        }
      } 
       else {
        alert("Network is wrong. Please switch to Kovan.")
      }
    } catch (error) {
      console.log('Error-faucetTransfer: ', error)
      if(error.code == -32016) {
        Swal.fire('reverted', 'You have requested too early. Please try after some time', 'error')
      } else if(error.code == 4001) {
        Swal.fire('reverted', 'Faucet Transaction Failed by user', 'error')
      } else {
        Swal.fire('reverted', 'Faucet Transaction Failed', 'error')
      }
    }
  }



  return {
    approveToken,
    approveTokenAndSwap,
    checkAllowance,
    checkBalanceOfFaucet,
    checkBalance,
    calculateFees,
    calculateGasFeesForApproveAndSwap,
    faucetTransfer
    }
}

export default useBiconomyContracts
