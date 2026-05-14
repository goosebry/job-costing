import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Costing - Track Your Project Costs',
  description: 'Multi-tenant SaaS platform for contractors tracking job costs, labor, budgets, and invoicing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}