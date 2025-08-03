import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
  })

  it('handles text input', async () => {
    const user = userEvent.setup()
    
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText(/enter text/i)
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('calls onChange handler', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input placeholder="Enter text" onChange={handleChange} />)
    
    const input = screen.getByPlaceholderText(/enter text/i)
    await user.type(input, 'a')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('supports different input types', () => {
    render(<Input type="email" placeholder="Enter email" />)
    
    const input = screen.getByPlaceholderText(/enter email/i)
    expect(input).toHaveAttribute('type', 'email')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText(/disabled input/i)
    expect(input).toBeDisabled()
  })

  it('supports custom className', () => {
    render(<Input className="custom-input" placeholder="Custom input" />)
    
    const input = screen.getByPlaceholderText(/custom input/i)
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    let inputRef: HTMLInputElement | null = null
    
    render(
      <Input 
        ref={(ref) => { inputRef = ref }}
        placeholder="Ref input"
      />
    )
    
    expect(inputRef).toBeInstanceOf(HTMLInputElement)
  })

  it('supports value prop', () => {
    render(<Input value="Initial value" onChange={() => {}} />)
    
    const input = screen.getByDisplayValue(/initial value/i)
    expect(input).toBeInTheDocument()
  })

  it('supports defaultValue prop', () => {
    render(<Input defaultValue="Default value" />)
    
    const input = screen.getByDisplayValue(/default value/i)
    expect(input).toBeInTheDocument()
  })

  it('supports required attribute', () => {
    render(<Input required placeholder="Required input" />)
    
    const input = screen.getByPlaceholderText(/required input/i)
    expect(input).toBeRequired()
  })
})