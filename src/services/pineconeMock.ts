/**
 * Mock Pinecone Client
 * Simulates vector storage and similarity search for relationship insights.
 */

export interface VectorNode {
  id: string;
  values: number[]; // Simulated embedding
  metadata: {
    label: string;
    insights: string;
    timestamp: number;
  };
}

class MockPinecone {
  private storage: Map<string, VectorNode> = new Map();

  async upsert(nodes: VectorNode[]) {
    console.log("[Mock Pinecone] Upserting vectors:", nodes.length);
    nodes.forEach(node => this.storage.set(node.id, node));
    return { upsertedCount: nodes.length };
  }

  async query(vector: number[], topK: number = 3) {
    console.log("[Mock Pinecone] Querying similarity...");
    // Just return some random stored nodes for now to simulate a search
    const results = Array.from(this.storage.values())
      .slice(0, topK)
      .map(node => ({
        id: node.id,
        score: Math.random(), // Simulated similarity score
        metadata: node.metadata
      }));
    
    return { matches: results };
  }

  async delete(id: string) {
    console.log("[Mock Pinecone] Deleting vector:", id);
    this.storage.delete(id);
  }
}

export const pineconeMock = new MockPinecone();
