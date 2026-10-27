import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import './SelectControl.css'

export const SelectControl = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectControl(
  { className = '', ...props },
  ref,
) {
  return (
    <span className={`select-control ${className}`.trim()}>
      <select ref={ref} {...props} />
      <HugeiconsIcon
        className="select-control__icon"
        icon={ArrowDown01Icon}
        size={18}
        strokeWidth={2}
        aria-hidden="true"
      />
    </span>
  )
})
