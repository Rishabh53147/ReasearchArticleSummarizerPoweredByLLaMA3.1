const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Category List (Custom Strings Provided)
const categories = [    'astro-ph', 'cond-mat', 'cs', 'cs.AI', 'cs.CV', 'cs.CL', 'cs.CR', 'cs.DS', 
    'cs.DB', 'cs.LG', 'cs.NI', 'cs.OH', 'cs.PF', 'cs.SE', 'cs.SI', 'cs.IT', 
    'math', 'math.AG', 'math.CO', 'math.GM', 'math.GR', 'math.HO', 'math.KT', 
    'math.NT', 'math.PR', 'math.RA', 'math.ST', 'nlin', 'nlin.CD', 'nlin.PS', 
    'nucl-th', 'physics', 'physics.acc-ph', 'physics.ao-ph', 'physics.app-ph', 
    'physics.atm-clus', 'physics.gen-ph', 'physics.optics', 'q-bio', 'q-fin', 'stat'
];

// Endpoint to get the category list
app.get('/api/categories', (req, res) => {
    res.json({ categories });
});

// Endpoint to search arXiv papers
app.post('/api/search', async (req, res) => {
    const { keyword, filters } = req.body;

    try {
        // Query parameters for arXiv API
        const maxResults = filters.results || 5; // Default to 5 results
        const yearRange = filters.yearRange || ''; // Optional
        const category = filters.category || ''; // Optional
        const firstAuthor = filters.firstAuthor || ''; // Optional

        // Build the arXiv API query
        let query = `search_query=all:${keyword}`;
        if (category) query += `+AND+cat:${category}`;
        if (firstAuthor) query += `+AND+au:${firstAuthor}`;

        // Full arXiv API URL
        const url = `http://export.arxiv.org/api/query?${query}&max_results=${maxResults}`;

        // Fetch data from arXiv API
        const response = await axios.get(url);
        const xmlData = response.data;

        // Parse XML to JSON
        const parser = new xml2js.Parser();
        parser.parseString(xmlData, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML data' });
            }

            // Extract papers
            const entries = result.feed.entry || [];
            const papers = entries.map((entry) => ({
                title: entry.title[0].trim(),
                author: entry.author[0].name[0],
                summary: entry.summary[0].trim(),
                doi: entry.id[0], // The link to the paper
                category: entry.category?.[0]?.$.term || 'N/A',
                published: entry.published[0],
            }));

            // Send parsed papers back to frontend
            res.json({ data: papers });
        });
    } catch (error) {
        console.error('Error fetching data from arXiv API:', error);
        res.status(500).json({ error: 'Error fetching data from arXiv API' });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
