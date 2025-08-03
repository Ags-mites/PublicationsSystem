import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'
import { server } from '@/test/mocks/server'

// Start server before all tests
beforeEach(() => server.listen({ onUnhandledRequest: 'error' }))

// Clean up after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterEach(() => server.close())

describe('LoginPage', () => {
  it('renders login page with all elements', () => {
    render(<LoginPage />)
    
    // Check page title/heading
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    
    // Check form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    
    // Check additional links
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
  })

  it('displays welcome message or branding', () => {
    render(<LoginPage />)
    
    // Check for welcome text or branding elements
    expect(screen.getByText(/welcome back/i) || 
           screen.getByText(/academic publications/i) ||
           screen.getByText(/sign in to continue/i)).toBeInTheDocument()
  })

  it('handles successful login flow', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Should show loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
    
    // Should handle successful login (redirect would happen in real app)
    // We can't test navigation easily in unit tests, but we can test
    // that no error message appears
    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
    })
  })

  it('handles login errors', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Use invalid credentials
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
    
    // Button should be enabled again after error
    expect(submitButton).not.toBeDisabled()
  })

  it('validates form before submission', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Try to submit empty form
    await user.click(submitButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('has proper accessibility features', () => {
    render(<LoginPage />)
    
    // Check for proper form labeling
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('id')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('id')
    
    // Check for form structure
    const form = screen.getByRole('form') || emailInput.closest('form')
    expect(form).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // Tab navigation should work
    await user.tab()
    expect(emailInput).toHaveFocus()
    
    await user.tab()
    expect(passwordInput).toHaveFocus()
    
    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    await user.click(submitButton)
    
    // Should show loading indicator
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/signing in|loading/i)
  })

  it('persists form data during loading', async () => {
    const user = userEvent.setup()
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    const testEmail = 'test@example.com'
    const testPassword = 'password123'
    
    await user.type(emailInput, testEmail)
    await user.type(passwordInput, testPassword)
    
    await user.click(submitButton)
    
    // Form values should still be there during loading
    expect(emailInput).toHaveValue(testEmail)
    expect(passwordInput).toHaveValue(testPassword)
  })
})