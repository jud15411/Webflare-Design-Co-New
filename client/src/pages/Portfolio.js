import React, { useState, useEffect } from 'react';
import './Portfolio.css';

function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch all projects from your backend API
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (isLoading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="portfolio-page-container page-container">
      <div className="section-title">
        <h2>Our Work</h2>
        <div className="title-underline"></div>
      </div>
      <div className="portfolio-page-grid">
        {projects.map(item => (
          <div className="portfolio-item" key={item._id}>
            <img 
              src={item.imageUrl ? `${process.env.REACT_APP_API_URL}/${item.imageUrl}` : "/images/portfolio-placeholder.jpg"} 
              alt={item.title}
            />
            <div className="portfolio-overlay"><h3>{item.title}</h3></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Portfolio;