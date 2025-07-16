import React, { useState, useEffect } from 'react';
import './Home.css';
import { TypeAnimation } from 'react-type-animation';

function Home() {
  const [featuredProjects, setFeaturedProjects] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/featured-projects`);
        const data = await response.json();
        setFeaturedProjects(data);
      } catch (err) {
        console.error("Failed to fetch featured projects:", err);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">
            We Build Exceptional
            <br />
            <TypeAnimation
              sequence={[
                'Websites.',
                2000,
                'Applications.',
                2000,
                'Digital Experiences.',
                2000,
              ]}
              wrapper="span"
              speed={50}
              className="hero-animated-text"
              repeat={Infinity}
            />
          </h1>
          <p className="hero-subheadline">
            Stunning, high-performance websites and applications tailored for your success.
          </p>
          <a href="/contact" className="hero-button">Get Started</a>
        </div>
      </header>

      {/* Portfolio Section */}
      <section className="portfolio-section">
        <div className="section-title">
            <h2>Our Featured Work</h2>
            <div className="title-underline"></div>
        </div>
        <div className="portfolio-grid">
          {featuredProjects.map(project => (
            <div className="portfolio-item" key={project._id}>
              {/* This now correctly points to your server's image URL */}
              <img 
                src={project.imageUrl ? `${process.env.REACT_APP_API_URL}/${project.imageUrl}` : "/images/portfolio-placeholder.jpg"} 
                alt={project.title}
              />
              <div className="portfolio-overlay"><h3>{project.title}</h3></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;