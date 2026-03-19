export const dynamic = "force-dynamic";
import dynamic_import from "next/dynamic";

const ClientAppEntry = dynamic_import(() => import("./client-app-entry"), {
  ssr: false,
});

export default function Page() {
  return <ClientAppEntry />;
}
