import React, { useEffect, useState
  // , useContext
 } from 'react'
import 'react-responsive-modal/styles.css'
import { Modal } from 'react-responsive-modal'
import SmallButtons from './SmallButtons'
import useBiconomyContracts from '../../hooks/useBiconomyContracts'
import Swal from "sweetalert2";
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import QuestionHelper from '../QuestionHelper'
import { TYPE } from '../../theme'
// import { ThemeContext } from 'styled-components'
import DAI_kovan_contract from '../../contracts/DAI_kovan.json'
import USDT_kovan_contract from '../../contracts/USDT_kovan.json'
import USDC_kovan_contract from '../../contracts/USDC_kovan.json'
import { useWaitState } from '../../state/waitmodal/hooks'
import { useWaitActionHandlers } from '../../state/waitmodal/hooks'
// import { useStoreState } from "../../store/globalStore";

interface GasModalProps {
  handleDeposit: () => void
  hadaleGasModalEnable: () => void
  setGasTokenAndSwapCallback: (gas: any) => void
  wipeInput: () => void
  path0: any
  path1: any
  paths: any[]
  inputToken: any
  decimals: any
  inputAmount: any
}

const GasModal: React.FunctionComponent<GasModalProps> = ({
  handleDeposit,
  hadaleGasModalEnable,
  setGasTokenAndSwapCallback,
  wipeInput,
  path0,
  path1,
  paths,
  inputToken,
  inputAmount,
  decimals
}) => {
  const { 
    // wait, 
    isOpen,
    tx, isApproved } = useWaitState()
  const { onChangeWait, onChangeTransaction, onChangeTransactionHash, onChangeApproved, onChangeOpen, onChangeGasModal } = useWaitActionHandlers()

  // const { connected } = useStoreState((state) => state);
  const { checkAllowance, checkBalance, approveToken, calculateFees, approveTokenAndSwap, calculateGasFeesForApproveAndSwap } = useBiconomyContracts()

  const [open, setOpen] = useState(false)
  const [balanceError, setError] = useState(false)
  const [inputError, setInputError] = useState(false)
  const [checkingAllowance, setCheckingAllowance] = useState(true)
  const [checkBal, setBalance] = useState('undefined')
  // const [isApproved, setIsApproved] = useState(false)
  const [fees, setFees] = useState('undefined')
  const [approveAndSwapFees, setApproveAndSwapFees] = useState('undefined')
  const [isApproveAndSwap, setApproveAndSwap] = useState(false)
  // const [isApproveState, setApprove] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')

  // const onOpenModal = () => setOpen(true)
  const onCloseModal = () => {
    // hadaleGasModalEnable()
    setOpen(false)
    onChangeWait('false')
    onChangeTransaction('')
    onChangeTransactionHash('')
    onChangeOpen(false)
    onChangeGasModal(false)
  }

  useEffect(() => {
    if(tx != '' && tx != 'undefined') {
      onCloseModal()
    }
  }, [tx])

  // const theme = useContext(ThemeContext)

  const onDeposit = async () => {
    try {
      if (inputAmount == '') {
        setInputError(true)
        return
      }

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
    let approvedResp: any
    if(tokenSymbol == 'USDT') {
      const isApproved = await checkAllowance(selectedToken, inputAmount, decimals)
      if (isApproved) {
        Swal.fire('You have already given allowance')
        return
      } else if (!isApproved) {
        approvedResp = await approveToken(tokenSymbol)
      } else {
        Swal.fire('Something went wrong!')
        onChangeOpen(false)
        return
      }
    } else {
      approvedResp = await approveToken(tokenSymbol)
    }
    if (approvedResp) {
      const fee = await calculateFees(tokenSymbol, paths, inputAmount, decimals)
      setFees(fee)
    }
  }

  const onApproveAndSwapAlert = async (tokenSymbol: any) => {
    const totalExchangeVolume: any = parseFloat(inputAmount) + parseFloat(approveAndSwapFees)
    if (parseFloat(totalExchangeVolume) > parseFloat(checkBal)) {
      setError(true)
    } else {
      Swal.fire({
        title: 'Total Estimated gas fees of permit and Swap '+ tokenSymbol,
        text: approveAndSwapFees + " " + tokenSymbol,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Permit And Swap'
      }).then(async (result) => {
        if (result.isConfirmed) {
          setApproveAndSwap(true)
          // from here It will call use effect of isApproveAndSwap
        }
      })
    }
  }

  const onApproveAndSwap = async (tokenSymbol: any) => {
    const approvedResp: any = await approveTokenAndSwap(tokenSymbol, inputAmount, paths, decimals)
    if (approvedResp) {
      // setIsApproved(true)
      const fee = await calculateFees(tokenSymbol, paths, inputAmount, decimals)
      setFees(fee)
    }
  }

  const onSelectGasToken = async (tokenSymbol: any) => {
    onChangeWait('false')
    onChangeTransaction('')
    onChangeTransactionHash('')
    setSelectedToken(tokenSymbol)
    setError(false)
    setInputError(false)
  }

  const resetSelectedToken = async () => {
    setSelectedToken('')
    setSelectedToken(selectedToken)
  }

  useEffect(() => {
    const process = async () => {
      try {
        // debugger
        setCheckingAllowance(true)
        const isApproved = await checkAllowance(selectedToken, inputAmount, decimals)
        const balance = await checkBalance(selectedToken)

        if (balance == undefined || isApproved == undefined) {
          resetSelectedToken()
        }

        if(isApproved) {
          let fee = await calculateFees(selectedToken, paths, inputAmount, decimals)
          if (fee != ""){
          if (fee == undefined) {
            resetSelectedToken()
          } else {
            if (selectedToken == 'USDT') {
              setBalance((balance / 1e6).toString())
            } else {
              setBalance((balance / 1e18).toString())
            }
            onChangeApproved(isApproved)
            setCheckingAllowance(false)
            setFees(fee)
          }     
        } 
        } else {
          if(selectedToken != 'USDT') {
            const approveAndSwapfee = await calculateGasFeesForApproveAndSwap(selectedToken, paths, inputAmount, decimals)
            if (approveAndSwapfee != ""){
            if (approveAndSwapfee == undefined) {
              resetSelectedToken()
            } else {
              setBalance((balance / 1e18).toString())
              onChangeApproved(isApproved)
              setCheckingAllowance(false)
              setApproveAndSwapFees(approveAndSwapfee)
            } 
          }
         } else {
            // For USDT
            setBalance((balance / 1e6).toString())
            onChangeApproved(isApproved)
            setCheckingAllowance(false)
            setApproveAndSwapFees('0')
          }
        }
      } catch (error) {
        console.log('Getting-Details-Error: ', error)
        if(error.code = -32603) {
          resetSelectedToken()
        } else {
          resetSelectedToken()
        }
      }
    }
    if (selectedToken != '' && path0 != '' && path1 != '') {
      process()
    }
  }, [selectedToken])

  useEffect(() => {
    console.log('pathsuseEffect: ', paths)
    onChangeOpen(true)
    setSelectedToken('USDC')
  }, [])
  
  useEffect(() => {
    async function process() {
      await onApproveAndSwap(selectedToken)
      setApproveAndSwap(false)
      // hadaleGasModalEnable()
      const fee = await calculateFees(selectedToken, paths, inputAmount, decimals)
      if(parseInt(fee) > 0) {
        setFees(fee)
      }
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
          const fee = await calculateFees(selectedToken, paths, inputAmount, decimals)
          const approveAndSwapfee = await calculateGasFeesForApproveAndSwap(selectedToken, paths, inputAmount, decimals)
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
        open={isOpen != null ? (isOpen) : (false)}
        onClose={onCloseModal}
        center
        blockScroll={true}
      >
        <div className="header" style={{color: "#000000"}}>
          <div className="title" style={{ textAlign: 'center', marginBottom: '20px', color: "#000000" }}>
            Select tokens to pay gas fees
          </div>
          <div className="tabs">
            <div className="tab active-tab" style={{ textAlign: 'center', marginBottom: '20px' }}>
              Stable Coins
            </div>
          </div>
        </div>

        <div className="body" style={{color: "#000000"}}>
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
          
            {checkingAllowance ? (
              <div className="alignCenter">
                <strong>Checking allowance to ERC20 Forwarder for selected fee token...</strong>
              </div>
            ) : isApproved ? (
              <div className="pay-tx">
                {balanceError && (
                  <div className="gas-amount">
                    <strong>Not enough balance to perform the swap and pay the fees!</strong>
                  </div>
                )}

                {inputError && (
                  <div className="gas-amount">
                    <strong>You have not selected input amount or token!</strong>
                  </div>
                )}

                <AutoColumn gap="0px">
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={"#000000"}>
                        Your Balance :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Your metamask balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14} style={{color: "#000000"}}>{checkBal}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'} style={{color: "#000000"}}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={"#000000"}>
                        Estimated Tx fee :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Estimated tx fee is a fee will be deduct from stablecoin balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14} style={{color: "#000000"}}>{parseInt(fees) > 0 ? fees : '0'}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'} style={{color: "#000000"}}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>
                
                {fees != 'undefined' && checkBal != 'undefined' ? (
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
                </div>):(
                  <div className="gas-amount">
                    <strong>Fees and Balances are getting calculated...</strong>
                  </div>
                )}
              </div>
            ) : isApproved == false ? ( selectedToken == 'DAI' || selectedToken == 'USDC' ? (
              <div className="pay-tx">

                {balanceError && (
                  <div className="gas-amount">
                    <strong>Not enough balance to perform the swap and pay the fees!</strong>
                  </div>
                )}

                {inputError && (
                  <div className="gas-amount">
                    <strong>You have not selected input amount or token!</strong>
                  </div>
                )}
                
                <AutoColumn gap="0px">
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={"#000000"}>
                        Your Balance :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Your metamask balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14} style={{color: "#000000"}}>{checkBal}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'} style={{color: "#000000"}}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <TYPE.black fontSize={14} fontWeight={400} color={"#000000"}>
                        Estimated Tx fee :{' '}
                      </TYPE.black>
                      <QuestionHelper text="Estimated tx fee is a fee will be deduct from stablecoin balance." />
                    </RowFixed>
                    <RowFixed>
                      <TYPE.black fontSize={14} style={{color: "#000000"}}>{parseInt(approveAndSwapFees) > 0 ? approveAndSwapFees : '0'}</TYPE.black>
                      <TYPE.black fontSize={14} marginLeft={'4px'} style={{color: "#000000"}}>
                        {selectedToken}
                      </TYPE.black>
                    </RowFixed>
                  </RowBetween>
                </AutoColumn>
                  
                {approveAndSwapFees != 'undefined' && checkBal != 'undefined' ? (
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
                  </div> ) : (
                    <div className="gas-amount">
                      <strong>Fees and Balances getting calculating...</strong>
                  </div>
                )}

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
            )) : (
              <div className="alignCenter">
                <strong>Checking allowance to ERC20 Forwarder for selected fee token...</strong>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default GasModal
