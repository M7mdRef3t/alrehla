import { SessionOSConsole } from '@/components/admin/sessions/SessionOSConsole';

export default function AdminSessionOSPage() {
  return (
    <main className="h-screen bg-[#0A0A0A] overflow-hidden">
      {/* If there's an admin shell/layout, it usually wraps the child pages. 
          Assuming it provides the top bar, we let it manage the remaining height. */}
      <SessionOSConsole />
    </main>
  );
}
