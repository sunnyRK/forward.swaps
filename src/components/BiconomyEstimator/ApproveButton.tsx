import React from 'react'
import useBiconomyContracts from '../../hooks/useBiconomyContracts'

// hooks and services

// components, styles and UI

// interfaces
export interface ApproveButtonProps {
  tokenName: 'DAI' | 'USDT' | 'USDC'
}

const ApproveButton: React.FunctionComponent<ApproveButtonProps> = ({ tokenName }) => {
  const { approveToken } = useBiconomyContracts()

  return (
    <div className="approve-token-button" onClick={() => approveToken(tokenName)}>
      Approve {tokenName}
    </div>
  )
}

export default ApproveButton
