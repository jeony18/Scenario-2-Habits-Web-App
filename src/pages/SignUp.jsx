import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const PASSWORD_RULES = [
  { label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { label: 'At least 1 uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'At least 1 lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'At least 1 number',            test: (p) => /[0-9]/.test(p) },
  { label: 'At least 1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')

  const emailValid = isValidEmail(email)
  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password))
  const passwordsMatch = password === confirmPassword

  const handleRegister = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setErrorMsg('')
    if (!emailValid || !passwordValid || !passwordsMatch) return

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Successfully registered, navigate to login
        navigate('/signin')
      } else {
        setErrorMsg(data.error || 'Registration failed')
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server')
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-brand-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-brand-text mb-8">Sign Up</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-text"
            />
            {email && !emailValid && (
              <p className="text-xs text-brand-error mt-1">Please enter a valid email address</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-text"
            />
            {password && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => (
                  <li
                    key={rule.label}
                    className={`text-xs flex items-center gap-1.5 ${
                      rule.test(password) ? 'text-brand-success' : 'text-brand-muted'
                    }`}
                  >
                    <span>{rule.test(password) ? '✓' : '○'}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-text"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-brand-error mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-brand-btn text-brand-btn-text border border-brand-btn font-medium rounded-lg hover:opacity-80 transition-opacity"
          >
            Register
          </button>

          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full py-2 px-4 border border-brand-border text-brand-text font-medium rounded-lg hover:bg-brand-surface transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignUp
