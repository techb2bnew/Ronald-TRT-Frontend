import AdminLayoutClient from './admin-layout-client';

export const metadata = {
  title: 'Prorevv',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
