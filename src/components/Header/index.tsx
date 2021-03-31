import {
  ChainId
  // TokenAmount
} from '@uniswap/sdk'
import React, { useState } from 'react'
import { Text } from 'rebass'
import { NavLink } from 'react-router-dom'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import Chip from '@material-ui/core/Chip'
import styled from 'styled-components'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import USDCIcon from '../../assets/images/usdc.png'
import USDTIcon from '../../assets/images/usdt.png'
import DAIIcon from '../../assets/images/dai.png'
import KETHIcon from '../../assets/images/keth.png'

// import Logo from '../../assets/svg/logo.svg'
// import LogoDark from '../../assets/svg/logo_white.svg'
import biconomyLogo from '../../assets/images/biconomyLogo.svg'
import { useActiveWeb3React } from '../../hooks'
import { useDarkModeManager } from '../../state/user/hooks'
import {
  useETHBalances
  //  useAggregateUniBalance
} from '../../state/wallet/hooks'
import { CardNoise } from '../earn/styled'
// import { CountUp } from 'use-count-up'
import { TYPE, ExternalLink } from '../../theme'

import { YellowCard } from '../Card'
import { 
  Moon,
  Sun 
} from 'react-feather'
// import Menu from '../Menu'

import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
import ClaimModal from '../claim/ClaimModal'
import { useToggleSelfClaimModal, useShowClaimPopup } from '../../state/application/hooks'
import { useUserHasAvailableClaim } from '../../state/claim/hooks'
import { useUserHasSubmittedClaim } from '../../state/transactions/hooks'
import { Dots } from '../swap/styleds'
import Modal from '../Modal'
import UniBalanceContent from './UniBalanceContent'
// import usePrevious from '../../hooks/usePrevious'
import useBiconomyContracts from '../../hooks/useBiconomyContracts'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 0 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `}
`

const ImageIcon = styled.img`
  height: 20px
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 960px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 12px 12px 0 0;
    background-color: ${({ theme }) => theme.bg1};
  `};
`

const ModalHeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const FaucetChipWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`

const ContentWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  padding: 2rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
    align-items: center;
  `};
`
const HoverText = styled.div`
  :hover {
    cursor: pointer;
  }
`

const FaucetElement = styled.div`
  display: flex;
  align-items: center;
  margin-right: 10px;
  cursor: pointer;
  font-weight: 400;
  padding: 8px;
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const FaucetChip = styled(Chip)`
  color: ${({ theme }) => theme.text1}!important
  background: ${({ theme }) => theme.bg2}!important
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
`
const UpperSection = styled.div`
  position: relative;
  
  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`
const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 12px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const UNIAmount = styled(AccountElement)`
  color: white;
  padding: 4px 8px;
  height: 36px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.bg3};
  background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const UNIWrapper = styled.span`
  width: fit-content;
  position: relative;
  cursor: pointer;

  :hover {
    opacity: 0.8;
  }

  :active {
    opacity: 0.9;
  }
`

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  margin-left: 8px
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
`}
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.KOVAN]: 'Kovan'
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()

  const { faucetTransfer } = useBiconomyContracts()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  // const [isDark] = useDarkModeManager()
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  const toggleClaimModal = useToggleSelfClaimModal()

  const availableClaim: boolean = useUserHasAvailableClaim(account)

  const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  // const aggregateBalance: TokenAmount | undefined = useAggregateUniBalance()

  const [showUniBalanceModal, setShowUniBalanceModal] = useState(false)
  const [showFaucetModal, setShowFaucetModal] = useState(false)
  const showClaimPopup = useShowClaimPopup()

  // const countUpValue = aggregateBalance?.toFixed(0) ?? '0'
  // const countUpValuePrevious = usePrevious(countUpValue) ?? '0'

  const closeFaucetModal = () => {
    setShowFaucetModal(false)
  }

  const onFaucetClick = async (tokenSymbol: string) => {
    switch(tokenSymbol) {
      case "USDC":
        await faucetTransfer('USDC')
        break;
      case "USDT":
        await faucetTransfer('USDT')
        break;
      case "DAI":
        // Redirect here to DAI faucet page
        // might make it part of 
        await faucetTransfer('DAI')
        break;
      case "KETH":
        // Redirect to KETH faucet page
        await faucetTransfer('KETH')
        break;
      case "KETH":
        // Redirect to KETH faucet page
        await faucetTransfer('KETH')
        break;
      case "TUSDC":
        // Redirect to KETH faucet page
        await faucetTransfer('TUSDC')
        break;
      case "TUSDT":
        // Redirect to KETH faucet page
        await faucetTransfer('TUSDT')
        break;
      default:
        // Show error message that faucet token is not supported
    }
  }

  return (
    <HeaderFrame>
      <ClaimModal />
      <Modal isOpen={showUniBalanceModal} onDismiss={() => setShowUniBalanceModal(false)}>
        <UniBalanceContent setShowUniBalanceModal={setShowUniBalanceModal} />
      </Modal>
      <Modal isOpen={showFaucetModal} onDismiss={closeFaucetModal} minHeight={false} maxHeight={90}>
        <Wrapper>
          <UpperSection>
            <CloseIcon onClick={closeFaucetModal}>
              <CloseColor />
            </CloseIcon>
            <ModalHeaderRow>
              <HoverText>Get Tokens From Faucet</HoverText>
            </ModalHeaderRow>
            <ContentWrapper>

              <div style={{marginTop: "10px", marginBottom: "10px"}}>
                <HoverText>Fee Tokens</HoverText>
              </div>
              <FaucetChipWrapper>
                <FaucetChip label="Get USDC" icon={<ImageIcon src={USDCIcon} />} onClick={()=>{onFaucetClick("USDC")}}/>
                <FaucetChip label="Get USDT" icon={<ImageIcon src={USDTIcon} />} onClick={()=>{onFaucetClick("USDT")}}/>
                <FaucetChip label="Get DAI"  icon={<ImageIcon src={DAIIcon} />} onClick={()=>{onFaucetClick("DAI")}}/>  
              </FaucetChipWrapper>
              
              <div style={{marginTop: "20px", marginBottom: "10px"}}>
                <HoverText>Kovan ETH</HoverText>
              </div>
              <FaucetChipWrapper>
                <FaucetChip label="Get KETH" icon={<ImageIcon src={KETHIcon} />} onClick={()=>{onFaucetClick("KETH")}}/>  
              </FaucetChipWrapper>

              <div style={{marginTop: "20px", marginBottom: "10px"}}>
                <HoverText>Trade Tokens</HoverText>
              </div>
              <FaucetChipWrapper>
                <FaucetChip label="Get Trade USDC" icon={<ImageIcon src={USDCIcon} />} onClick={()=>{onFaucetClick("TUSDC")}}/>
                {/*<FaucetChip label="Get Trade USDT" icon={<ImageIcon src={USDTIcon} />} onClick={()=>{onFaucetClick("TUSDT")}}/>*/}
              </FaucetChipWrapper>

            </ContentWrapper>
          </UpperSection>
        </Wrapper>
      </Modal>
      <HeaderRow>
        <Title href=".">
          <UniIcon>
            <img width={'25px'} height={'30px'} src={biconomyLogo} alt="logo" />
          </UniIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            {t('Forward Swap')}
          </StyledNavLink>

          <StyledExternalLink id={`stake-nav-link`} href={'http://iwaste-eth.com'}>
            See how much ETH you can save <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>

          
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <FaucetElement onClick={() => setShowFaucetModal(true)}>
          Faucet
        </FaucetElement>

        <HeaderElement>
          <HideSmall>
            {chainId && NETWORK_LABELS[chainId] && (
              <NetworkCard title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</NetworkCard>
            )}
          </HideSmall>

          {availableClaim && !showClaimPopup && (
            <UNIWrapper onClick={toggleClaimModal}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                <TYPE.white padding="0 2px">
                  {claimTxn && !claimTxn?.receipt ? <Dots>Claiming UNI</Dots> : 'Claim UNI'}
                </TYPE.white>
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )}
          {/* {!availableClaim && aggregateBalance && (
            <UNIWrapper onClick={() => setShowUniBalanceModal(true)}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                {account && (
                  <HideSmall>
                    <TYPE.white
                      style={{
                        paddingRight: '.4rem'
                      }}
                    >
                      <CountUp
                        key={countUpValue}
                        isCounting
                        start={parseFloat(countUpValuePrevious)}
                        end={parseFloat(countUpValue)}
                        thousandsSeparator={','}
                        duration={1}
                      />
                    </TYPE.white>
                  </HideSmall>
                )}
                UNI
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )} */}
          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {userEthBalance?.toSignificant(4)} ETH
              </BalanceText>
            ) : null}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        
        
        <HeaderElementWrap>
          <StyledMenuButton 
            onClick={() => toggleDarkMode()}
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </StyledMenuButton>
          {/* <Menu /> */}
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
