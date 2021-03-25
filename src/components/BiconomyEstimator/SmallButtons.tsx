import React from 'react'
import styled from 'styled-components'
import dai from '../../assets/images/dai.png'
import usdc from '../../assets/images/usdc.png'
import usdt from '../../assets/images/usdt.png'

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

export interface SmallButtonsProps {
  name: string
  active?: boolean
  onClick?: ((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void) | undefined
  marginPX?: string
}

const SmallButtons: React.FunctionComponent<SmallButtonsProps> = ({ name, active, onClick, marginPX }) => {
  return (
    <div
      onClick={onClick}
      className={'small-button' + ' ' + `${active === true ? 'active-token' : ''}`}
      style={{ marginLeft: marginPX }}
    >
      {/* <div
        className="icon"
        style={{
          backgroundImage: `url(/assets/${name}.png)`,
          backgroundSize: 'cover'
        }}
      ></div> */}
      {/* <img src={dai} alt={'wallet connect logo'} /> */}
      {name == 'USDC' ? (
        <IconWrapper size={25}>
          <img src={usdc} alt={'token logo'} />
        </IconWrapper>
      ) : name === 'DAI' ? (
        <IconWrapper size={25}>
          <img src={dai} alt={'token logo'} />
        </IconWrapper>
      ) : name == 'USDT' ? (
        <IconWrapper size={25}>
          <img src={usdt} alt={'token logo'} />
        </IconWrapper>
      ) : (
        ''
      )}
      <div className="name">{name}</div>
    </div>
  )
}

export default SmallButtons
