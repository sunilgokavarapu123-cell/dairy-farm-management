import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forgotPassword, resetPassword } = useAuth();
  const [currentStep, setCurrentStep] = useState(searchParams.get('token') ? 'reset' : 'request');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(searchParams.get('token') || '');
  
  
  const [requestData, setRequestData] = useState({
    email: ''
  });
  const [requestErrors, setRequestErrors] = useState({});

  const [resetData, setResetData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetErrors, setResetErrors] = useState({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
    if (requestErrors[name]) {
      setRequestErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData(prev => ({
      ...prev,
      [name]: value
    }));
    if (resetErrors[name]) {
      setResetErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateRequestForm = () => {
    const newErrors = {};

    if (!requestData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(requestData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setRequestErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = () => {
    const newErrors = {};

    if (!resetData.token.trim()) {
      newErrors.token = 'Reset token is required';
    }

    if (!resetData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (resetData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!resetData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetData.newPassword !== resetData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setResetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRequestForm()) {
      return;
    }

    setLoading(true);
    setRequestErrors({});

    const result = await forgotPassword(requestData.email.trim().toLowerCase());

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
    } else {
      setRequestErrors({ general: result.error });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateResetForm()) {
      return;
    }

    setLoading(true);
    setResetErrors({});

    const result = await resetPassword(resetData.token.trim(), resetData.newPassword);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setResetErrors({ general: result.error });
    }
  };

  if (success && currentStep === 'request') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <CheckCircle size={40} className="auth-icon success" />
              <h1>Check Your Email</h1>
            </div>
            <p className="auth-subtitle">We've sent password reset instructions to your email</p>
          </div>

          <div className="success-content">
            <p>If an account with that email exists, you'll receive a password reset link shortly.</p>
            <p>Check your inbox and follow the instructions to reset your password.</p>
            
            {resetToken && (
              <div className="demo-token">
                <h4>Demo Reset Token (for testing):</h4>
                <code className="reset-token">{resetToken}</code>
                <button
                  className="use-token-btn"
                  onClick={() => {
                    setResetData(prev => ({ ...prev, token: resetToken }));
                    setCurrentStep('reset');
                  }}
                >
                  Use This Token
                </button>
              </div>
            )}
          </div>

          <div className="auth-footer">
            <p>Remember your password? 
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success && currentStep === 'reset') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <CheckCircle size={40} className="auth-icon success" />
              <h1>Password Reset Successful</h1>
            </div>
            <p className="auth-subtitle">Your password has been updated successfully</p>
          </div>

          <div className="success-content">
            <p>You can now sign in with your new password.</p>
            
            <Link to="/login" className="auth-button">
              <span>Go to Sign In</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'reset') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Lock size={40} className="auth-icon" />
              <h1>Reset Password</h1>
            </div>
            <p className="auth-subtitle">Enter your reset token and new password</p>
          </div>

          <form onSubmit={handleResetSubmit} className="auth-form">
            {resetErrors.general && (
              <div className="error-message">
                {resetErrors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="token">Reset Token</label>
              <div className="input-group">
                <RotateCcw className="input-icon" size={18} />
                <input
                  type="text"
                  id="token"
                  name="token"
                  value={resetData.token}
                  onChange={handleResetChange}
                  className={`form-input ${resetErrors.token ? 'error' : ''}`}
                  placeholder="Enter reset token from email"
                  disabled={loading}
                />
              </div>
              {resetErrors.token && (
                <div className="field-error">{resetErrors.token}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={resetData.newPassword}
                  onChange={handleResetChange}
                  className={`form-input ${resetErrors.newPassword ? 'error' : ''}`}
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetErrors.newPassword && (
                <div className="field-error">{resetErrors.newPassword}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={resetData.confirmPassword}
                  onChange={handleResetChange}
                  className={`form-input ${resetErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {resetErrors.confirmPassword && (
                <div className="field-error">{resetErrors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span>Resetting Password...</span>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Remember your password? 
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <RotateCcw size={40} className="auth-icon" />
            <h1>Forgot Password</h1>
          </div>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleRequestSubmit} className="auth-form">
          {requestErrors.general && (
            <div className="error-message">
              {requestErrors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                value={requestData.email}
                onChange={handleRequestChange}
                className={`form-input ${requestErrors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {requestErrors.email && (
              <div className="field-error">{requestErrors.email}</div>
            )}
          </div>

          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span>Sending...</span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Remember your password? 
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
          <p>Don't have an account? 
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>

        <div className="form-help">
          <p><strong>Have a reset token?</strong></p>
          <button
            type="button"
            className="text-button"
            onClick={() => setCurrentStep('reset')}
          >
            Enter reset token manually
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;