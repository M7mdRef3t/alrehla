export const dynamic = "force-dynamic";

import OnboardingRouteClient from "./OnboardingRouteClient";

export const metadata = {
  title: "ابدأ رحلتك — الرحلة",
  description:
    "اكتشف خريطة وعيك في 3 خطوات بسيطة. أول خطوة نحو وضوح حقيقي.",
};

export default function OnboardingPage() {
  return <OnboardingRouteClient />;
}
