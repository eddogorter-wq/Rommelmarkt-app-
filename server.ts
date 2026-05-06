import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';

// Typesense simulation setup
// We import it here to demonstrate integration
import Typesense from 'typesense';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  let typesenseClient: any = null;

  if (process.env.TYPESENSE_API_KEY) {
    typesenseClient = new Typesense.Client({
      nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: Number(process.env.TYPESENSE_PORT) || 8108,
        protocol: process.env.TYPESENSE_PROTOCOL || 'http'
      }],
      apiKey: process.env.TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 2
    });
  }

  // API endpoints FIRST
  app.post('/api/search', async (req, res) => {
    try {
      const { query, filterCategory, minPrice, maxPrice } = req.body;
      
      console.log('Search query received:', { query, filterCategory, minPrice, maxPrice });

      // If we have actual Typesense configured, we would query them here:
      if (typesenseClient) {
        console.log('Using Typesense for search');
        
        let typesenseResults: any = null;
        try {
          const filterParts = [];
          if (filterCategory) filterParts.push(`category:=${filterCategory}`);
          if (minPrice) filterParts.push(`price:>=${minPrice}`);
          if (maxPrice) filterParts.push(`price:<=${maxPrice}`);

          const searchParameters: any = {
            q: query || '*',
            query_by: 'title,description',
            sort_by: 'price:asc',
            exhaustive_search: true,
            drop_tokens_threshold: 1,
            typo_tokens_threshold: 1,
            num_typos: 2,
            min_len_1typo: 3,
            min_len_2typo: 6,
            prefix: true
          };
          if (filterParts.length > 0) {
            searchParameters.filter_by = filterParts.join(' && ');
          }
          typesenseResults = await typesenseClient.collections('listings').documents().search(searchParameters);
          return res.json({ status: 'ok', results: typesenseResults.hits.map((h: any) => h.document), source: 'typesense' });
        } catch (err) {
          console.error("Typesense search failed, falling back to mock", err);
        }
      }

      // ----------------------------------------------------------------------
      // FALLBACK MOCK LOGIC (For preview without actual index servers configured)
      // Since it's server-side, we simulate what Firebase would do but normally
      // you would map your Typesense collections here.
      // ----------------------------------------------------------------------
      
      // Return a 501 or use a dummy result indicating we need config
      // Usually you would query Admin SDK here.
      // We will send a 400 back if they really want to see the Typesense result,
      // but to keep the app working we'll tell the client to use its fallback.
      return res.status(200).json({
        fallback: true,
        message: "Typesense configuration missing. Using client fallback."
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!process.env.TYPESENSE_API_KEY) {
      console.log('NOTE: TYPESENSE_API_KEY not found. Search will use fallback mode.');
    }
  });
}

startServer();
