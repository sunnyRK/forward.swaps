import { Biconomy } from '@biconomy/mexa'
import { BICONOMY_API_KEY } from "../constants/config";

const biconomy = new Biconomy(window.ethereum, { apiKey: BICONOMY_API_KEY })
let ercForwarderClient: any
let permitClient: any

biconomy
  .onEvent(biconomy.READY, () => {
    ercForwarderClient = biconomy.erc20ForwarderClient
    permitClient = biconomy.permitClient
  })
  .onEvent(biconomy.ERROR, () => {})

export function getErcForwarderClient(): any {
    return ercForwarderClient
}

export function getPermitClient(): any {
    return permitClient
}

export function getBiconomy(): any {
    return biconomy
}