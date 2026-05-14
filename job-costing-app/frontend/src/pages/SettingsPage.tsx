import { Routes, Route } from 'react-router-dom';
import { SettingsLayout } from '../components/SettingsLayout';
import { OrganizationSettings } from './settings/OrganizationSettings';
import { CostCategoriesSettings } from './settings/CostCategoriesSettings';
import { UsersSettings } from './settings/UsersSettings';
import { JobStatusesSettings } from './settings/JobStatusesSettings';
import { JobTemplatesSettings } from './settings/JobTemplatesSettings';
import { WorkspaceSettings } from './settings/WorkspaceSettings';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsLayout>
        <Routes>
          <Route index element={<OrganizationSettings />} />
          <Route path="organization" element={<OrganizationSettings />} />
          <Route path="categories" element={<CostCategoriesSettings />} />
          <Route path="job-statuses" element={<JobStatusesSettings />} />
          <Route path="job-templates" element={<JobTemplatesSettings />} />
          <Route path="users" element={<UsersSettings />} />
          <Route path="workspace" element={<WorkspaceSettings />} />
        </Routes>
      </SettingsLayout>
    </div>
  );
}