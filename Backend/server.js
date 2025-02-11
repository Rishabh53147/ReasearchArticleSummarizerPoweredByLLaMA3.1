const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const { exec } = require('child_process');  // Import exec for running shell commands

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Category List (Custom Strings Provided)
const categories = [
    'astro-ph', 'cond-mat', 'cs', 'cs.AI', 'cs.CV', 'cs.CL', 'cs.CR', 'cs.DS',
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

            // Attempt to run MMR (Maximal Marginal Relevance)
            try {
                const queryText = keyword;
                const summaries = JSON.stringify(papers.map(paper => paper.summary));  // Send summaries as JSON string

                exec(`python MMR.py "${queryText}" "${summaries}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error running MMR: ${error.message}`);
                        // If MMR fails, just send the unmodified papers list
                        return res.json({ data: papers });
                    }

                    // If MMR runs successfully, handle the ranked papers
                    const rankedPapers = JSON.parse(stdout); // Assuming MMR outputs JSON of ranked indices
                    const rankedResults = rankedPapers.map(index => papers[index]);

                    // Send ranked papers back to frontend
                    res.json({ data: rankedResults });
                });
            } catch (mmrError) {
                console.error('MMR execution failed:', mmrError);
                // If MMR execution fails, send the normal papers
                res.json({ data: papers });
            }
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
