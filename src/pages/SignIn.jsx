import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errorMsg, setErrorMsg] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!isValidEmail(email)) return

    try {
      const response = await fetch('http://localhost:5000/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("userId", data.userId)
        navigate('/home')
      } else {
        setErrorMsg(data.error || 'Login failed')
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server')
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-brand-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-brand-text mb-8">Sign In</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
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
            {email && !isValidEmail(email) && (
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
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-brand-btn text-brand-btn-text border border-brand-btn font-medium rounded-lg hover:opacity-80 transition-opacity"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="w-full py-2 px-4 border border-brand-border text-brand-text font-medium rounded-lg hover:bg-brand-surface transition-colors"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignIn
