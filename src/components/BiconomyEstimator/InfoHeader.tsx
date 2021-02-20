import React from 'react'
// import { useStoreState } from "../../store/globalStore";
// import { useActiveWeb3React } from '../../index'

const InfoHeader: React.FunctionComponent = () => {
  // const { account, network } = useStoreState((state) => state);
  // const { account } = useActiveWeb3React()

  return (
    <div className="header">
      <div className="title">Biconomy Gas Estimator</div>
      <div className="wallet-address">{/* {account ? `(${account}) ${account}` : "connect wallet to continue"} */}</div>
    </div>
  )
}

export default InfoHeader
