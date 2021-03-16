import { Biconomy } from '@biconomy/mexa'
import { BICONOMY_API_KEY } from "../constants/config";

let ercForwarderClient: any
let permitClient: any
let biconomy: any
if(window && window.ethereum) {
  biconomy = new Biconomy(window.ethereum, { apiKey: BICONOMY_API_KEY })
  
  biconomy
    .onEvent(biconomy.READY, () => {
      ercForwarderClient = biconomy.erc20ForwarderClient
      permitClient = biconomy.permitClient
    })
    .onEvent(biconomy.ERROR, () => {})
}

export function getErcForwarderClient(): any {
  try {
    return ercForwarderClient
  } catch (error) {
    console.log('ERCForwarderClient-error', error)
  }
}

export function getPermitClient(): any {
  try {
    return permitClient
  } catch (error) {
    console.log('PermitClient-error', error)
  }
}

export function getBiconomy(): any {
  try {
    return biconomy
  } catch (error) {
    console.log('BiconomyProvider-error', error)
  }
}