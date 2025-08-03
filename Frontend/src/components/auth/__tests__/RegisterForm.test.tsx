import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'
import { server } from '@/test/mocks/server'

// Start server before all tests
beforeEach(() => server.listen({ onUnhandledRequest: 'error' }))

// Clean up after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterEach(() => server.close())

describe('RegisterForm', () => {
  it('renders registration form fields', () => {
    render(<RegisterForm />)
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/affiliation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    // Test short password
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })
    
    // Clear and test weak password
    await user.clear(passwordInput)
    await user.type(passwordInput, 'password')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter, one lowercase letter, and one number/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'DifferentPassword123!')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const affiliationInput = screen.getByLabelText(/affiliation/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.type(affiliationInput, 'Test University')
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i })
    
    // Initially passwords should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // Click first toggle to show password
    await user.click(toggleButtons[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click second toggle to show confirm password
    await user.click(toggleButtons[1])
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
  })

  it('validates name length', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    const firstNameInput = screen.getByLabelText(/first name/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'A')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows terms and conditions checkbox', () => {
    render(<RegisterForm />)
    
    expect(screen.getByLabelText(/i agree to the terms and conditions/i)).toBeInTheDocument()
  })

  it('requires terms acceptance', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    // Fill all fields except terms
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const affiliationInput = screen.getByLabelText(/affiliation/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.type(affiliationInput, 'Test University')
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    
    render(<RegisterForm />)
    
    // Fill all required fields
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const affiliationInput = screen.getByLabelText(/affiliation/i)
    const termsCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    await user.type(firstNameInput, 'John')
    await user.type(lastNameInput, 'Doe')
    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.type(affiliationInput, 'Test University')
    await user.click(termsCheckbox)
    
    expect(submitButton).not.toBeDisabled()
    
    await user.click(submitButton)
    
    // Button should be disabled during submission
    expect(submitButton).toBeDisabled()
  })
})