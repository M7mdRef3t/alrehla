export default function EditorLayout({ children }: { children: React.ReactNode }) {
  // A clean layout specifically for the visual builder, ignoring the site's main nav/footer.
  return (
    <div className="bg-background m-0 p-0 min-h-screen overflow-hidden text-on-background" dir="rtl">
      {children}
    </div>
  );
}
