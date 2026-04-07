const { performance } = require('perf_hooks');

const simulateSendNotification = async () => {
  return new Promise(resolve => setTimeout(resolve, 50));
};

const runBenchmark = async () => {
  const numItems = 20;
  const sessionIds = Array.from({ length: numItems }, (_, i) => `session_${i}`);

  console.log("=== Sequential (Current) ===");
  const startSeq = performance.now();
  for (const sessionId of sessionIds) {
    await simulateSendNotification();
  }
  const endSeq = performance.now();
  console.log(`Sequential took: ${(endSeq - startSeq).toFixed(2)} ms`);

  console.log("\n=== Parallel (Promise.all) ===");
  const startPar = performance.now();
  await Promise.all(
    sessionIds.map(sessionId => simulateSendNotification())
  );
  const endPar = performance.now();
  console.log(`Parallel took: ${(endPar - startPar).toFixed(2)} ms`);
};

runBenchmark();
