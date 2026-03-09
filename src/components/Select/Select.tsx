import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.scss'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  id: string
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}

export const Select = <T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  ...restProps
}: SelectProps<T>) => {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <span className={styles.control}>
        <select
          id={id}
          className={styles.select}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          {...restProps}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ▼
        </span>
      </span>
    </label>
  )
}
