export default function BalanceLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="container flex flex-col items-center py-8">
        <h1 className="text-2xl font-semibold mb-6">余额管理</h1>
        {children}
      </div>
    );
  }