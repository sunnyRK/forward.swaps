import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { ROUTER_ADDRESS } from '../constants'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER } from '@uniswap/sdk'
import { TokenAddressMap } from '../state/lists/hooks'
// import CHILL_ABI  from "../constants/abis/chill.json";
import { Biconomy } from '@biconomy/mexa'
// import { useActiveWeb3React } from "../hooks/";
// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

const ETHERSCAN_PREFIXES: { [chainId in ChainId]: string } = {
  1: '',
  3: 'ropsten.',
  4: 'rinkeby.',
  5: 'goerli.',
  42: 'kovan.'
}

const biconomy = new Biconomy(window.ethereum, { apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093' })
let ercForwarderClient: any
let permitClient: any

biconomy
  .onEvent(biconomy.READY, () => {
    // Initialize your dapp here like getting user accounts etc
    ercForwarderClient = biconomy.erc20ForwarderClient
    permitClient = biconomy.permitClient
    // console.log('permitClientOnevent++', permitClient, ercForwarderClient)
  })
  .onEvent(biconomy.ERROR, () => {
    // Handle error while initializing mexa
    // console.log(error, message)
  })

export function getEtherscanLink(
  chainId: ChainId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000))
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// Biconomy Methods till 137 lines
export function getBiconomySwappperContract(
  address: string,
  ABI: any,
  library: Web3Provider,
  account?: string
): Contract {
  const biconomy = new Biconomy(window.ethereum, { apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093' })
  const ethersProvider = new ethers.providers.Web3Provider(biconomy)
  const signer = ethersProvider.getSigner()
  console.log('ethersProvider+++++', window.ethereum, biconomy, ethersProvider, signer)
  const contract = new ethers.Contract(address, ABI, signer.connectUnchecked())
  console.log('getBiconomySwappperContract+++++', contract)
  return contract
}

export function getEthersProvider(): Web3Provider {
  const biconomy = new Biconomy(window.ethereum, { apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093' })
  const ethersProvider = new ethers.providers.Web3Provider(biconomy)
  console.log('ethersProvider+++++', ethersProvider)
  return ethersProvider
}

export function getErcForwarderClient(): any {
  // const biconomy = new Biconomy(window.ethereum,{apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093'})
  // let ercForwarderClient = biconomy.erc20ForwarderClient
  console.log('ercForwarderClient++', ercForwarderClient)
  return ercForwarderClient
}

export function getPermitClient(): any {
  // const biconomy = new Biconomy(window.ethereum,{apiKey: 'bUQKf_h8-.52c2bd85-4147-41b0-bd8e-1a36ed039093'})
  // let permitClient = biconomy.permitClient
  console.log('permitClient++', permitClient)
  return permitClient
}
/////////////////////////////////////////

// account is optional
export function getRouterContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
