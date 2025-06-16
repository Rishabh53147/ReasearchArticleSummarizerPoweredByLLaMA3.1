import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import './App.css';

const App = () => {
    const [keyword, setKeyword] = useState('');
    const [categoryList, setCategoryList] = useState([]);
    const [filters, setFilters] = useState({
        category: '',
        yearRange: '',
        firstAuthor: '',
        results: 5,
    });
    const [papers, setPapers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/categories');
                setCategoryList(response.data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const response = await axios.post('http://localhost:5000/api/search', {
                keyword,
                filters
            });
            setPapers(response.data.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="container">
            <div className="header">Research Paper Summarizer - Prototype</div>
            <div className="main-wrapper">
                <div className="filters-section" style={{ display: 'block' }}>
                    <h3>Filters</h3>
                    <div className="filter-item">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categoryList.map((cat, index) => (
                                <option key={index} value={cat.tag}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Year Range</label>
                        <input
                            type="text"
                            placeholder="e.g., 2020-2024"
                            value={filters.yearRange}
                            onChange={(e) => setFilters({ ...filters, yearRange: e.target.value })}
                        />
                    </div>
                    <div className="filter-item">
                        <label>First Author</label>
                        <input
                            type="text"
                            placeholder="Author Name"
                            value={filters.firstAuthor}
                            onChange={(e) => setFilters({ ...filters, firstAuthor: e.target.value })}
                        />
                    </div>
                    <div className="filter-item">
                        <label>Number of Results</label>
                        <input
                            type="number"
                            placeholder="Default 5"
                            value={filters.results}
                            onChange={(e) => setFilters({ ...filters, results: parseInt(e.target.value) || 5 })}
                        />
                    </div>
                </div>
                <div className="main-section">
                    <div className="search-bar-wrapper">
                        <input
                            type="text"
                            placeholder="Enter keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <button onClick={handleSearch} disabled={isSearching}>{isSearching ? 'Searching...' : 'Search'}</button>
                    </div>
                    {papers.length > 0 && (
                        <>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Paper Title</th>
                                        <th>Author Name</th>
                                        <th>Summary</th>
                                        <th>Category</th>
                                        <th>Published Date</th>
                                        <th>DOI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {papers.map((paper, index) => (
                                        <tr key={index}>
                                            <td>
                                                <a href={paper.link} target="_blank" rel="noopener noreferrer">{paper.title}</a>
                                            </td>
                                            <td>{paper.author}</td>
                                            <td>{paper.summary.split(' ').slice(0, 20).join(' ')}...</td>
                                            <td>{paper.categoryName || paper.category}</td>
                                            <td>{paper.published}</td>
                                            <td>
                                                {paper.doi ? (
                                                    <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                                                        {paper.doi}
                                                    </a>
                                                ) : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <CSVLink
                                data={papers.map(({ title, author, summary, category, published, doi, link }) => ({
                                    Title: title,
                                    Author: author,
                                    Summary: summary,
                                    Category: category,
                                    Published: published,
                                    DOI: doi || "N/A",
                                    Link: link
                                }))}
                                filename="research_papers.csv"
                                className="download-btn"
                            >
                                Download CSV
                            </CSVLink>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;

