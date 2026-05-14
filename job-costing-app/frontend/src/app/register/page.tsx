'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organizationName: '',
    role: 'FIELD_WORKER' as const,
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName,
        role: formData.role as any,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Get started with Job Costing</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First name</label>
              <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last name</label>
              <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} className="form-input" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organizationName" className="form-label">Organization name</label>
            <input id="organizationName" name="organizationName" type="text" value={formData.organizationName} onChange={handleChange} className="form-input" placeholder="Your company name" required />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">Role</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="form-input">
              <option value="ADMIN">Administrator</option>
              <option value="PM">Project Manager</option>
              <option value="COST_ACCOUNTANT">Cost Accountant</option>
              <option value="FIELD_WORKER">Field Worker</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="form-input" required />
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? <span className="flex items-center justify-center"><span className="spinner mr-2" />Creating account...</span> : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Already have an account? <a href="/login" className="text-primary-600 hover:text-primary-500">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}