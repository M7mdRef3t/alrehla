import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function JourneyCrash(): React.JSX.Element {
  throw new Error("journey-fatal-error");
}

function DawayirSafePane() {
  return <div data-testid="dawayir-safe-pane">Dawayir session alive</div>;
}

describe("Error boundary isolation", () => {
  it("keeps Dawayir boundary alive when Journey subtree crashes", () => {
    const { container } = render(
      <div>
        <ErrorBoundary fallback={<div data-testid="journey-fallback">Journey fallback</div>}>
          <JourneyCrash />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div data-testid="dawayir-fallback">Dawayir fallback</div>}>
          <DawayirSafePane />
        </ErrorBoundary>
      </div>
    );

    expect(container.querySelector('[data-testid="journey-fallback"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="dawayir-safe-pane"]')).toBeTruthy();
  });
});
