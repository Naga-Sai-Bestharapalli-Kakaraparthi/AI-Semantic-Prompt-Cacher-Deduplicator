import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// In-memory mock vector store for semantic similarity caching
interface CacheItem {
  prompt: string;
  embedding: number[];
  response: string;
}

const semanticCacheStore: CacheItem[] = [];

// Simple Dot Product / Cosine Similarity for normalized vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct; // Assuming vectors are normalized
}

// Mock function to simulate generating a pseudo-embedding from text length/chars
function getMockEmbedding(text: string): number[] {
  const codeSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Return a dummy 4-dimensional normalized vector for demonstration
  const base = [codeSum % 10, (codeSum % 7) / 10, (codeSum % 5) / 10, 0.5];
  const magnitude = Math.sqrt(base.reduce((sum, val) => sum + val * val, 0));
  return base.map(val => val / magnitude);
}

app.post('/api/semantic-cache', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  const queryEmbedding = getMockEmbedding(prompt);
  const SIMILARITY_THRESHOLD = 0.95; // High threshold for semantic match

  // Search existing cache for semantic matches
  for (const item of semanticCacheStore) {
    const similarity = cosineSimilarity(queryEmbedding, item.embedding);
    if (similarity >= SIMILARITY_THRESHOLD) {
      return res.status(200).json({
        source: 'SEMANTIC_CACHE_HIT',
        similarityScore: similarity,
        cachedResponse: item.response
      });
    }
  }

  // Simulate LLM generation if no semantic match found
  const freshResponse = `Generated AI Travel Plan for: ${prompt}`;
  
  // Store in semantic cache
  semanticCacheStore.push({
    prompt,
    embedding: queryEmbedding,
    response: freshResponse
  });

  return res.status(200).json({
    source: 'LLM_EXECUTION_AND_CACHED',
    response: freshResponse
  });
});

if (require.main === module) {
  app.listen(3001, () => console.log('Semantic Cache Gateway running on port 3001'));
}
