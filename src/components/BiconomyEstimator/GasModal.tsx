import React, { useEffect, useState } from 'react'
import 'react-responsive-modal/styles.css'
// import { BigNumber } from '@ethersproject/bignumber'
// import { BigNumber } from 'ethers'
import { Modal } from 'react-responsive-modal'
import CustomButton from './CustomButton'
import SmallButtons from './SmallButtons'
import useBiconomyContracts from '../../hooks/useBiconomyContracts'
// import ApproveButton from "./ApproveButton";
// import { useStoreState } from "../../store/globalStore";
// import Swal from "sweetalert2";

interface GasModalProps {
  handleDeposit: () => void
  path0: any
  path1: any
  inputAmount: any
}

const GasModal: React.FunctionComponent<GasModalProps> = ({ handleDeposit, path0, path1, inputAmount }) => {
  // const { connected } = useStoreState((state) => state);
  const { checkAllowance, checkBalance, approveToken, calculateFees } = useBiconomyContracts()

  const [open, setOpen] = useState(false)
  const [balanceError, setError] = useState(false)
  const [checkingAllowance, setCheckingAllowance] = useState(true)
  const [checkBal, setBalance] = useState('0')
  const [isApproved, setIsApproved] = useState(false)
  const [fees, setFees] = useState('0')
  const [selectedToken, setSelectedToken] = useState('')

  const onOpenModal = () => setOpen(true)
  const onCloseModal = () => setOpen(false)

  const onDeposit = async () => {
    try {
      const totalExchangeVolume: any = parseFloat(inputAmount) + parseFloat(fees) 
      console.log("feesfees+:", totalExchangeVolume, inputAmount, fees, checkBal)
      if(totalExchangeVolume > parseFloat(checkBal)) {
        setError(true)
      } else {
        return handleDeposit()
      }
      // if (fees > checkBal) {
      //   setError(true)
      // } else {
      //   return handleDeposit()
      // }
    } catch (error) {
      
    }
  }

  const onApprove = async (tokenSymbol: any) => {
    const approvedResp: any = await approveToken(tokenSymbol)
    if (approvedResp) {
      setIsApproved(true)
      const fee = await calculateFees(tokenSymbol, path0, path1, inputAmount)
      console.log('TxFeeOnApprove', fee)
      setFees(fee)
    }
  }

  const onTxFee = async (tokenSymbol: any) => {
    setSelectedToken(tokenSymbol)
  }

  useEffect(() => {
    const process = async () => {
      setCheckingAllowance(true)
      const isApproved = await checkAllowance(selectedToken)
      const balance = await checkBalance(selectedToken)
      const fee = await calculateFees(selectedToken, path0, path1, inputAmount)
      setBalance((balance / 1e18).toString())
      setIsApproved(isApproved)
      setCheckingAllowance(false)
      setFees(fee)
      console.log('TxFee: ', fee)
    }
    if (selectedToken != '' && path0 != '' && path1 != '') {
      console.log('pathpath1++', path0, path1)
      process()
    }
  }, [selectedToken])

  useEffect(() => {
    const process = async () => {
      if (open) {
        setFees('0')
        setSelectedToken('USDC')  
        setError(false)
        if (path0 != '' && path1 != '') {
          const fee = await calculateFees(selectedToken, path0, path1, inputAmount)
          setFees(fee)
        }
      }
    }
    // const feess : BigNumber =  BigNumber.from(inputAmount).add(4.75)
    // console.log('pathpath0++', selectedToken, path0, path1, inputAmount, 
    //   parseFloat(inputAmount), parseInt(inputAmount), feess)
      // (parseFloat(inputAmount)+parseFloat(feess)), (parseInt(inputAmount)+parseInt(feess)))
      // BigNumber.from(inputAmount), BigNumber.from(feess), BigNumber.from(inputAmount).add(BigNumber.from(feess))
    // )
    process()
  }, [open])

  return (
    <>
      <CustomButton
        color="green"
        title="Pay Gas"
        description="Checkout estimated gas prices and pay"
        icon="dollar-sign"
        onClick={onOpenModal}
        disabled={false}
      />
      <Modal
        open={open}
        onClose={onCloseModal}
        center
        classNames={{
          modal: 'modal'
        }}
      >
        <div className="header">
          <div className="title">select tokens to pay gas fees</div>
          <div className="tabs">
            <div className="tab active-tab">Stable Coins</div>
          </div>
        </div>

        <div className="body">
          <div className="token-container">
            <SmallButtons name="USDC" active={selectedToken === 'USDC'} onClick={() => onTxFee('USDC')} />
            <SmallButtons name="USDT" active={selectedToken === 'USDT'} onClick={() => onTxFee('USDT')} />
            <SmallButtons name="DAI" active={selectedToken === 'DAI'} onClick={() => onTxFee('DAI')} />
          </div>

          <div className="token-action">
            {checkingAllowance ? (
              <div className="checking-allowance">Checking Allowance Status</div>
            ) : isApproved ? (
              <div className="pay-tx">
                {balanceError && (
                  <div className="gas-amount">
                    <strong>You have not enough transaction fees!!</strong>
                  </div>
                )}
                <div className="gas-amount">
                  Your Balance :{' '}
                  <strong>
                    {checkBal} {selectedToken}
                  </strong>
                </div>
                <div className="gas-amount">
                  Estimated Tx fee :{' '}
                  <strong>
                    {fees} {selectedToken}
                  </strong>
                </div>
                <div className="buttons">
                  <div className="tx-button cancel" onClick={onCloseModal}>
                    Cancel
                  </div>
                  <div
                    className="tx-button proceed"
                    onClick={() => {
                      onDeposit()
                    }}
                  >
                    Swap
                  </div>
                </div>
              </div>
            ) : (
              <div className="approve-token">
                <div className="note">
                  Note: Give approval to Biconomy ERC-20 Forwarder Contract, so it can deduct fee in selected token.
                </div>
                {/* <ApproveButton tokenName={selectedToken} /> */}
                <div className="approve-token-button" onClick={() => onApprove(selectedToken)}>
                  Approve {selectedToken}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default GasModal
