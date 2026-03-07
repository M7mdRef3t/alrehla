import type { Meta, StoryObj } from "@storybook/react";
import { ResultScreen } from "./ResultScreen";

const meta: Meta<typeof ResultScreen> = {
  title: "Modals/ResultScreen",
  component: ResultScreen,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ResultScreen>;

export const DangerRing: Story = {
  args: {
    personLabel: "زوج",
    personName: "أحمد",
    personGender: "male",
    score: 85,
    onClose: () => {},
  },
};

export const SafeRing: Story = {
  args: {
    personLabel: "صديق",
    personName: "عمر",
    personGender: "male",
    score: 20,
    onClose: () => {},
  },
};

export const CautionRing: Story = {
  args: {
    personLabel: "زميل",
    personName: "سارة",
    personGender: "female",
    score: 50,
    onClose: () => {},
  },
};
