import Icon from '@atlantum/feather-react-ts'
import React from 'react'

// hooks and services

// components, styles and UI

// interfaces
export interface CustomButtonProps {
  disabled?: boolean
  title: string
  description?: string
  icon: any
  color: 'blue' | 'teal' | 'green'
  onClick?: ((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void) | undefined
}

const CustomButton: React.FunctionComponent<CustomButtonProps> = ({
  disabled,
  title,
  description,
  icon,
  color,
  onClick
}) => {
  return (
    <div
      style={{ height: '100px' }}
      onClick={onClick}
      className={'custom-button bg-' + color + ' ' + `${disabled ? 'disabled' : ''}`}
    >
      <div className={'icon bg-dark-' + color}>
        <Icon name={icon} strokeWidth={1.5} size={20} color="white" />
      </div>
      <div className="text">
        <div className="title">{title}</div>
        <div className="description">{description}</div>
      </div>
    </div>
  )
}

export default CustomButton
