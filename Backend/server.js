const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const { execFile } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

// Category Name Mapping
const categoryNames = {
    'astro-ph': 'Astrophysics',
    'cond-mat': 'Condensed Matter',
    'cs.AI': 'Computer Science - Artificial Intelligence',
    'cs.CV': 'Computer Science - Computer Vision',
    'cs.CL': 'Computer Science - Computational Linguistics',
    'cs.CR': 'Computer Science - Cryptography and Security',
    'cs.DS': 'Computer Science - Data Structures and Algorithms',
    'cs.DB': 'Computer Science - Databases',
    'cs.LG': 'Computer Science - Machine Learning',
    'cs.NI': 'Computer Science - Networking and Internet Architecture',
    'cs.OH': 'Computer Science - Other',
    'cs.PF': 'Computer Science - Performance',
    'cs.SE': 'Computer Science - Software Engineering',
    'cs.SI': 'Computer Science - Social and Information Networks',
    'cs.IT': 'Computer Science - Information Theory',
    'math.AG': 'Mathematics - Algebraic Geometry',
    'math.CO': 'Mathematics - Combinatorics',
    'math.GM': 'Mathematics - General Mathematics',
    'math.GR': 'Mathematics - Group Theory',
    'math.HO': 'Mathematics - History and Overview',
    'math.KT': 'Mathematics - K-Theory and Homotopy Theory',
    'math.NT': 'Mathematics - Number Theory',
    'math.PR': 'Mathematics - Probability',
    'math.RA': 'Mathematics - Rings and Algebras',
    'math.ST': 'Mathematics - Statistics Theory',
    'nlin.CD': 'Nonlinear Sciences - Chaotic Dynamics',
    'nlin.PS': 'Nonlinear Sciences - Pattern Formation and Solitons',
    'nucl-th': 'Nuclear Theory',
    'physics.acc-ph': 'Physics - Accelerator Physics',
    'physics.ao-ph': 'Physics - Atmospheric and Oceanic Physics',
    'physics.app-ph': 'Physics - Applied Physics',
    'physics.atm-clus': 'Physics - Atomic and Molecular Clusters',
    'physics.gen-ph': 'Physics - General Physics',
    'physics.optics': 'Physics - Optics',
    'q-bio': 'Quantitative Biology',
    'q-fin': 'Quantitative Finance',
    'stat': 'Statistics'
};

app.post('/api/search', async (req, res) => {
    const { keyword, filters } = req.body;

    console.log('Received request with keyword:', keyword);
    console.log('Received filters:', filters); // Debugging filter input

    try {
        const maxResults = filters?.results || 5;
        const category = filters?.category || '';
        const firstAuthor = filters?.firstAuthor || '';
        const summarize = filters?.summarization ?? true;
        const applyMMR = filters?.mmr ?? true;

        let query = `search_query=all:${keyword}`;
        if (category) query += `+AND+cat:${category}`;
        if (firstAuthor) query += `+AND+au:${firstAuthor}`;

        console.log('Constructed arXiv query:', query); // Debugging query construction

        const url = `http://export.arxiv.org/api/query?${query}&max_results=${maxResults}`;
        const response = await axios.get(url);

        const parser = new xml2js.Parser();
        parser.parseString(response.data, (err, result) => {
            if (err) {
                console.error('XML Parsing Error:', err);
                return res.status(500).json({ error: 'XML parsing error' });
            }

            let papers = (result.feed.entry || []).map(entry => {
                const categoryTag = entry.category?.[0]?.$.term || 'N/A';
                return {
                    title: entry.title[0].trim(),
                    author: entry.author[0].name[0],
                    summary: entry.summary[0].trim(),
                    doi: entry.id[0],
                    category: categoryNames[categoryTag] || categoryTag, // Convert tag to readable name
                    published: entry.published[0],
                };
            });

            console.log('Fetched papers:', papers.length); // Debugging paper count

            if (!summarize) {
                console.log('Returning raw results'); // Debugging non-summarized response
                return res.json({ data: papers });
            }
            
            execFile('python', ['SummarizerPegasus.py', JSON.stringify(papers.map(p => p.summary))], (error, stdout) => {
                if (error) {
                    console.error(`Summarization Error: ${error.message}`);
                    return res.json({ data: papers });
                }

                try {
                    const summarizedAbstracts = JSON.parse(stdout);
                    papers.forEach((paper, i) => {
                        paper.summary = summarizedAbstracts[i] || paper.summary;
                    });

                    console.log('Summarization complete'); // Debugging summarization step

                    if (!applyMMR) {
                        console.log('Returning summarized results'); // Debugging MMR step bypass
                        return res.json({ data: papers });
                    }

                    execFile('python', ['MMR.py', keyword, JSON.stringify(papers.map(p => p.summary))], (mmrError, mmrStdout) => {
                        if (mmrError) {
                            console.error(`MMR Error: ${mmrError.message}`);
                            return res.json({ data: papers });
                        }

                        try {
                            const rankedIndices = JSON.parse(mmrStdout);
                            const rankedResults = rankedIndices.map(index => papers[index]);

                            console.log('MMR ranking applied'); // Debugging MMR step
                            res.json({ data: rankedResults });
                        } catch (parseError) {
                            console.error('MMR Parsing Error:', parseError);
                            res.json({ data: papers });
                        }
                    });
                } catch (parseError) {
                    console.error('Summarization Parsing Error:', parseError);
                    res.json({ data: papers });
                }
            });
        });
    } catch (error) {
        console.error('arXiv Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch arXiv data' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

