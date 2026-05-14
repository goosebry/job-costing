'use client';

import { useAuthStore } from '@/stores/auth.store';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your organization settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Organization</h2></div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input type="text" defaultValue={user?.organizationId ? 'Your Organization' : ''} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Cost Categories</h2></div>
            <div className="card-body">
              <p className="text-sm text-gray-500 mb-4">Default categories: Direct Labor, Materials, Subcontract, Equipment, Overhead</p>
              <button className="btn btn-secondary">Manage Categories</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Users & Roles</h2></div>
            <div className="card-body">
              <p className="text-sm text-gray-500 mb-4">Manage team members and their permissions</p>
              <button className="btn btn-secondary">Manage Users</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Your Profile</h2></div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user?.role?.name}</p>
              </div>
              <button className="btn btn-secondary w-full">Edit Profile</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="font-semibold">Integrations</h2></div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-xs text-gray-500">Payment processing</p>
                </div>
                <span className="badge badge-neutral">Not Connected</span>
              </div>
              <button className="btn btn-secondary w-full">Connect Stripe</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}