import { memo } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
}

const sizeClasses: Record<ButtonSize, string> = {
  md: styles.medium,
  sm: styles.small,
}

const buildClassName = (
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  className?: string,
): string => {
  return [styles.button, variantClasses[variant], sizeClasses[size], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ')
}

const ButtonComponent = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className,
  children,
  ...restProps
}: ButtonProps) => {
  return (
    <button type={type} className={buildClassName(variant, size, fullWidth, className)} {...restProps}>
      <span className={styles.blockSpan}>{children}</span>
    </button>
  )
}

export const Button = memo(ButtonComponent)
