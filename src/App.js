import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';  // Import the CSS file

const App = () => {
    const [keyword, setKeyword] = useState('');
    const [categoryList, setCategoryList] = useState([]);
    const [filters, setFilters] = useState({
        category: '',
        yearRange: '',
        firstAuthor: '',
        results: 5,
        includeDOI: false,
        includeLicense: false,
    });
    const [papers, setPapers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Fetch categories on component mount
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

    // Handle search submission
    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const response = await axios.post('http://localhost:5000/api/search', {
                keyword,
                filters,
            });
            setPapers(response.data.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    // Handle CSV download
    const handleDownload = () => {
        const csvContent = papers
            .map((paper) => {
                const row = [
                    paper.title,
                    paper.author,
                    paper.summary,
                    filters.includeDOI ? paper.doi : '',
                    filters.includeLicense ? paper.license : '',
                ]
                    .join(',')
                    .replace(/\n/g, ' ');
                return row;
            })
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'papers.csv';
        link.click();
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="header">
                Research Paper Summarizer - prototype
            </div>

            <div className="main-wrapper">
                {/* Filters Section */}
                <div className="filters-section">
                    <h3>Filters</h3>
                    <div className="filter-item">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categoryList.map((cat, index) => (
                                <option key={index} value={cat}>
                                    {cat}
                                </option>
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
                            onChange={(e) => setFilters({ ...filters, results: e.target.value })}
                        />
                    </div>

                    <div className="filter-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.includeDOI}
                                onChange={(e) =>
                                    setFilters({ ...filters, includeDOI: e.target.checked })
                                }
                            />
                            Include DOI
                        </label>
                    </div>
                    <div className="filter-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={filters.includeLicense}
                                onChange={(e) =>
                                    setFilters({ ...filters, includeLicense: e.target.checked })
                                }
                            />
                            Include License
                        </label>
                    </div>
                </div>

                {/* Main Section */}
                <div className="main-section">
                    <div className="search-bar-wrapper">
                        <input
                            type="text"
                            placeholder="Enter keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <button onClick={handleSearch}>Search</button>
                        {papers.length > 0 && (
                            <button className="download-btn" onClick={handleDownload}>
                                CSV
                            </button>
                        )}
                    </div>

                    {/* Results Table */}
                    {papers.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>Paper Title</th>
                                    <th>Author Name</th>
                                    <th>Summary</th>
                                    {filters.includeDOI && <th>DOI</th>}
                                    {filters.includeLicense && <th>License</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {papers.map((paper, index) => (
                                    <tr key={index}>
                                        <td>
                                            <a href={paper.doi} target="_blank" rel="noopener noreferrer">
                                                {paper.title}
                                            </a>
                                        </td>
                                        <td>{paper.author}</td>
                                        <td>{paper.summary}</td>
                                        {filters.includeDOI && <td>{paper.doi}</td>}
                                        {filters.includeLicense && <td>{paper.license}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
