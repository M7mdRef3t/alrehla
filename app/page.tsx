import dynamic from "next/dynamic";

const ClientAppEntry = dynamic(() => import("./client-app-entry"), {
  ssr: false,
});

export default function Page() {
  return <ClientAppEntry />;
}
