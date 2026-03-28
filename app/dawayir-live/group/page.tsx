import { GroupPulseRoom } from "../../../src/components/enterprise/GroupPulseRoom";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: "Dawayir Live Group Pulse",
  description: "واجهة النبض الجماعي والجلسات المباشرة المشتركة ضمن Dawayir Live",
};

export default function DawayirLiveGroupPage() {
  return <GroupPulseRoom />;
}
