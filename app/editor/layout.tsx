export default function EditorLayout({ children }: { children: React.ReactNode }) {
  // A clean layout specifically for the visual builder, ignoring the site's main nav/footer.
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-background m-0 p-0 overflow-hidden text-on-background">
        {children}
      </body>
    </html>
  );
}
