import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function JourneyCrash(): JSX.Element {
  throw new Error("journey-fatal-error");
}

function DawayirSafePane() {
  return <div data-testid="dawayir-safe-pane">Dawayir session alive</div>;
}

describe("Error boundary isolation", () => {
  it("keeps Dawayir boundary alive when Journey subtree crashes", () => {
    render(
      <div>
        <ErrorBoundary fallback={<div data-testid="journey-fallback">Journey fallback</div>}>
          <JourneyCrash />
        </ErrorBoundary>

        <ErrorBoundary fallback={<div data-testid="dawayir-fallback">Dawayir fallback</div>}>
          <DawayirSafePane />
        </ErrorBoundary>
      </div>
    );

    expect(screen.getByTestId("journey-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("dawayir-safe-pane")).toBeInTheDocument();
  });
});
