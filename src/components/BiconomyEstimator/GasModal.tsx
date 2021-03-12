import React, { useEffect, useState, useContext } from 'react'
import 'react-responsive-modal/styles.css'
import { Modal } from 'react-responsive-modal'
import SmallButtons from './SmallButtons'
import useBiconomyContracts from '../../hooks/useBiconomyContracts'
// import { useStoreState } from "../../store/globalStore";
import Swal from "sweetalert2";
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
import { ThemeContext } from 'styled-components'
import DAI_kovan_contract from '../../contracts/DAI_kovan.json'
import USDT_kovan_contract from '../../contracts/USDT_kovan.json'
import USDC_kovan_contract from '../../contracts/USDC_kovan.json'
import { useWaitState } from '../../state/waitmodal/hooks'
import { useWaitActionHandlers } from '../../state/waitmodal/hooks'

interface GasModalProps {
  handleDeposit: () => void
  hadaleGasModalEnable: () => void
  setGasTokenAndSwapCallback: (gas: any) => void
  path0: any
  path1: any
  inputToken: any
  inputAmount: any
}

const GasModal: React.FunctionComponent<GasModalProps> = ({
  handleDeposit,
  hadaleGasModalEnable,
  setGasTokenAndSwapCallback,
  path0,
  path1,
  inputToken,
  inputAmount
}) => {
  const { wait, tx, isApproved } = useWaitState()
  const { onChangeWait, onChangeTransaction, onChangeTransactionHash, onChangeFee, onChangeApproved } = useWaitActionHandlers()

  // const { connected } = useStoreState((state) => state);
  const { checkAllowance, checkBalance, approveToken, calculateFees, approveTokenAndSwap, calculateGasFeesForApproveAndSwap } = useBiconomyContracts()

  const [open, setOpen] = useState(false)
  const [balanceError, setError] = useState(false)
  const [inputError, setInputError] = useState(false)
  // const [signTx, setSignTx] = useState(false)
  const [checkingAllowance, setCheckingAllowance] = useState(true)
  const [checkBal, setBalance] = useState('0')
  // const [isApproved, setIsApproved] = useState(false)
  const [fees, setFees] = useState('0')
  const [approveAndSwapFees, setApproveAndSwapFees] = useState('0')
  const [isApproveAndSwap, setApproveAndSwap] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')

  // const onOpenModal = () => setOpen(true)
  const onCloseModal = () => {
    hadaleGasModalEnable()
    setOpen(false)
    onChangeWait('false')
    onChangeTransaction('')
    onChangeTransactionHash('')
    onChangeFee('')
    // setSignTx(false)
  }

  const theme = useContext(ThemeContext)

  const onDeposit = async () => {
    try {
      if (inputAmount == '') {
        setInputError(true)
        return
      }
      // setSignTx(true)

      if (inputToken == selectedToken) {
        const totalExchangeVolume: any = parseFloat(inputAmount) + parseFloat(fees)
        if (totalExchangeVolume > parseFloat(checkBal)) {
          setError(true)
        } else {
          let gasToken: string
          if (selectedToken == 'USDC') {
            gasToken = USDC_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          } else if (selectedToken == 'USDT') {
            gasToken = USDT_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          } else if (selectedToken == 'DAI') {
            gasToken = DAI_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          }
        }
      } else {
        if (parseFloat(fees) > parseFloat(checkBal)) {
          setError(true)
        } else {
          let gasToken: string
          if (selectedToken == 'USDC') {
            gasToken = USDC_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          } else if (selectedToken == 'USDT') {
            gasToken = USDT_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          } else if (selectedToken == 'DAI') {
            gasToken = DAI_kovan_contract.address
            return setGasTokenAndSwapCallback(gasToken)
          }
        }
      }
    } catch (error) {}
  }

  const onApprove = async (tokenSymbol: any) => {
    const approvedResp: any = await approveToken(tokenSymbol)
    if (approvedResp) {
      // setIsApproved(true)
      const fee = await calculateFees(tokenSymbol, path0, path1, inputAmount)
      setFees(fee)
    }
  }

  const onApproveAndSwapAlert = async (tokenSymbol: any) => {
    Swal.fire({
      title: 'Approve and Swap Gas fees in '+ tokenSymbol,
      text: approveAndSwapFees + " " + tokenSymbol,
      // icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Approve And Swap'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setApproveAndSwap(true)
        // from here It will call use effect of isApproveAndSwap
      }
    })
  }

  const onApproveAndSwap = async (tokenSymbol: any) => {
    const approvedResp: any = await approveTokenAndSwap(tokenSymbol, path0, path1, inputAmount)
    if (approvedResp) {
      // setIsApproved(true)
      const fee = await calculateFees(tokenSymbol, path0, path1, inputAmount)
      setFees(fee)
    }
  }

  const onSelectGasToken = async (tokenSymbol: any) => {
    onChangeWait('false')
    onChangeTransaction('')
    onChangeTransactionHash('')
    onChangeFee('')
    setSelectedToken(tokenSymbol)
  }

  useEffect(() => {
    const process = async () => {
      setCheckingAllowance(true)
      // const isApproved = await checkAllowance(selectedToken)
      const isApproved = await checkAllowance(selectedToken, inputAmount)

      const balance = await checkBalance(selectedToken)
      const fee = await calculateFees(selectedToken, path0, path1, inputAmount)
      if (selectedToken == 'USDT') {
        setBalance((balance / 1e6).toString())
      } else {
        setBalance((balance / 1e18).toString())
        const approveAndSwapfee = await calculateGasFeesForApproveAndSwap(selectedToken, path0, path1, inputAmount)
        setApproveAndSwapFees(approveAndSwapfee)
      }
      onChangeApproved(isApproved)
      // setIsApproved(isApproved)
      setCheckingAllowance(false)
      setFees(fee)
    }
    if (selectedToken != '' && path0 != '' && path1 != '') {
      process()
    }
  }, [selectedToken])

  useEffect(() => {
    setSelectedToken('USDC')
  }, [])
  
  useEffect(() => {
    async function process() {
      await onApproveAndSwap(selectedToken)
      setApproveAndSwap(false)
      const fee = await calculateFees(selectedToken, path0, path1, inputAmount)
      setFees(fee)
      // setIsApproved(true)
    }
    if(isApproveAndSwap) {
      process()
    }
  }, [isApproveAndSwap])

  useEffect(() => {
    const process = async () => {
      if (open) {
        setFees('0')
        setSelectedToken('USDC')
        setError(false)
        setInputError(false)
        if (path0 != '' && path1 != '') {
          const fee = await calculateFees(selectedToken, path0, path1, inputAmount)
          const approveAndSwapfee = await calculateGasFeesForApproveAndSwap(selectedToken, path0, path1, inputAmount)
          setFees(fee)
          setApproveAndSwapFees(approveAndSwapfee)
        }
      }
    }
    process()
  }, [open])

  return (
    <>
      <Modal
        open={true}
        onClose={onCloseModal}
        center
        blockScroll={true}
      >
        <div className="header">
          <div className="title" style={{ textAlign: 'center', marginBottom: '20px' }}>
            Select tokens to pay gas fees
          </div>
          <div className="tabs">
            <div className="tab active-tab" style={{ textAlign: 'center', marginBottom: '20px' }}>
              Stable Coins
            </div>
          </div>
        </div>

        <div className="body">
          <div className="token-container">
            <SmallButtons
              marginPX={'0px'}
              name="USDC"
              active={selectedToken === 'USDC'}
              onClick={() => onSelectGasToken('USDC')}
            />
            <SmallButtons
              marginPX={'15px'}
              name="USDT"
              active={selectedToken === 'USDT'}
              onClick={() => onSelectGasToken('USDT')}
            />
            <SmallButtons
              marginPX={'15px'}
              name="DAI"
              active={selectedToken === 'DAI'}
              onClick={() => onSelectGasToken('DAI')}
            />
          </div>

          <div className="token-action">
            {wait == 'true' ? (
              <div className="alignCenter">
                <strong>Waiting for confirmation...</strong>
                <br></br>
                <strong>Biconomy performing transaction...</strong>
              </div>
            ) : tx != '' && tx != 'undefined' ? (
              <div className="alignCenter">
                <strong>Transaction Submitted</strong>
                <br></br>
                <a href={'https://kovan.etherscan.io/tx/' + tx}>Etherscan</a>
                {/* <span>You saved {gasFees} ETH, which could be worth x*5K when ETH reaches 5K!</span> */}
              </div>
            ) : tx == 'undefined' ? (
              <div className="alignCenter">
                <strong>Transaction Failed</strong>
              </div>
            ) : (
              ''
            )}
            {checkingAllowance ? (
              <div className="alignCenter">
                <strong>Checking Allowance Status...</strong>
              </div>
            ) : !isApproved ? (
              <div className="pay-tx">
                {balanceError && (
                  <div className="gas-amount">
                    <strong>You have not enough transaction fees!!</strong>
                  </div>
                )}

                {inputError && (
                  <div className="gas-amount">
                    <strong>You have not selected input amount or token!!</strong>
                  </div>
                )}

                <AutoColumn gap="0px">
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                        Your Balance :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Your metamask balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14}>{checkBal}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                        Estimated Tx fee :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Estimated tx fee is a fee will be deduct from stablecoin balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14}>{parseInt(fees) > 0 ? fees : '0'}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>

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
            ) : selectedToken == 'DAI' || selectedToken == 'USDC' ? (
              <div className="pay-tx">
                <div className="buttons">
                  <div className="tx-button proceed" onClick={() => onApprove(selectedToken)}>
                  Permit
                  </div>
                  <div
                    className="tx-button proceed"
                    onClick={() => {
                      onApproveAndSwapAlert(selectedToken)
                    }}
                  >
                    Permit and Swap
                  </div>
                </div>
              </div>
            ) : (
              <div className="approve-token">
                <div className="note">
                  Note: Give approval to Biconomy ERC-20 Forwarder Contract, so it can deduct fee in selected token.
                </div>
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
