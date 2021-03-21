import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { darken } from 'polished'

import { useBlockNumber } from '../../state/application/hooks'
import { getEtherscanLink } from '../../utils'
import { useActiveWeb3React } from '../../hooks'
// import biconomy from '../../assets/images/biconomy.png'

const activeClassName = 'ACTIVE'

const StyledCenter = styled.div`
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1.2rem;
  width: fit-content;
  margin-bottom: 20px;
  font-weight: 600;

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

const StyledPolling2 = styled(ExternalLink).attrs({
  activeClassName
})<{ isActive?: boolean }>`
  position: fixed;
  display: flex;
  right: 0;
  bottom: 10px;
  padding: 1rem;
  color: white;
  transition: opacity 0.25s ease;
  color: ${({ theme }) => theme.text1};
  :hover {
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`

const StyledPolling = styled.div`
  position: fixed;
  display: flex;
  right: 0;
  bottom: 0;
  padding: 1rem;
  color: white;
  transition: opacity 0.25s ease;
  color: ${({ theme }) => theme.green1};
  :hover {
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  margin-left: 0.5rem;
  margin-top: 3px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.green1};
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);

  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.green1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;

  left: -3px;
  top: -3px;
`

export default function Polling() {
  const { chainId } = useActiveWeb3React()

  const blockNumber = useBlockNumber()

  const [isMounted, setIsMounted] = useState(true)

  useEffect(
    () => {
      const timer1 = setTimeout(() => setIsMounted(true), 1000)

      // this will clear Timeout when component unmount like in willComponentUnmount
      return () => {
        setIsMounted(false)
        clearTimeout(timer1)
      }
    },
    [blockNumber] //useEffect will run only one time
    //if you pass a value to array, like this [data] than clearTimeout will run every time this value changes (useEffect re-run)
  )

  return (
    <div>
      <StyledCenter>
        <div>
          <strong>Save your ETH by paying gas in Stablecoins!</strong>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ textAlign: 'center', marginBottom: '10px'}}>
              Powered by Biconomy{' '}
            </span>
            {/* <img src={biconomy} style={{ height: '25px' }}></img> */}
          </div>
        </div>
      </StyledCenter>
      <ExternalLink href={chainId && blockNumber ? getEtherscanLink(chainId, blockNumber.toString(), 'block') : ''}>
        <StyledPolling2 id={`stake-nav-link`} href={'https://docs.biconomy.io'}>
          Want such a smooth UX on your dApp?
          <br></br>
          Integrate Biconomy Forward now!
          <span style={{ fontSize: '11px' }}>↗</span>
        </StyledPolling2>
        <StyledPolling>
          <TYPE.small style={{ opacity: isMounted ? '0.2' : '0.6' }}>{blockNumber}</TYPE.small>
          <StyledPollingDot>{!isMounted && <Spinner />}</StyledPollingDot>
        </StyledPolling>
      </ExternalLink>
    </div>
  )
}
