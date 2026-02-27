import ClientRootLayout from "./ClientRootLayout";

type LayoutProps = Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function RootLayout({
  children,
  params,
  searchParams,
}: LayoutProps) {
  if (params) await params;
  if (searchParams) await searchParams;
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
