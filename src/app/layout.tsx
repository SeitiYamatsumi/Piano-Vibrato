import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50">
        {children}
      </body>
    </html>
  );
}
