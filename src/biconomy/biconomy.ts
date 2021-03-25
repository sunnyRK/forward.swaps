import { Biconomy } from '@biconomy/mexa'
import { BICONOMY_API_KEY } from '../constants/config'

let ercForwarderClient: any
let permitClient: any
let biconomy: any
if (window && window.ethereum) {
  biconomy = new Biconomy(window.ethereum, { apiKey: BICONOMY_API_KEY })
  console.log(window.ethereum)
  console.log('biconomy init')
  biconomy
    .onEvent(biconomy.READY, () => {
      ercForwarderClient = biconomy.erc20ForwarderClient
      permitClient = biconomy.permitClient
    })
    .onEvent(biconomy.ERROR, () => {})
}

export function getErcForwarderClient(): any {
  try {
    if (ercForwarderClient == '' || ercForwarderClient == 'undefined' || ercForwarderClient == null) {
      return null
    } else {
      return ercForwarderClient
    }
  } catch (error) {
    console.log('ERCForwarderClient-error', error)
    return null
  }
}

export function getPermitClient(): any {
  try {
    if (permitClient == '' || permitClient == 'undefined' || permitClient == null) {
      return null
    } else {
      return permitClient
    }
  } catch (error) {
    console.log('PermitClient-error', error)
    return null
  }
}

export function getBiconomy(): any {
  try {
    console.log('biconomy summoned')
    if (biconomy == '' || biconomy == 'undefined' || biconomy == null) {
      return null
    } else {
      return biconomy
    }
  } catch (error) {
    console.log('BiconomyProvider-error', error)
    return null
  }
}

export function setBiconomy(bico: any): any {
  try {
    console.log('biconomy being reset')
    if (bico) {
      biconomy = bico
      ercForwarderClient = bico.ercForwarderClient
      permitClient = bico.permitClient
    }
  } catch (error) {
    console.log('BiconomyProvider-error', error)
    return null
  }
}
