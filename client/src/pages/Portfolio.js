import React from 'react';
import './Portfolio.css';

function Portfolio() {
  const portfolioItems = [
    { id: 1, title: "E-Commerce Platform", img: "/Images/ecommerce-shop.png" },
    { id: 2, title: "Corporate Landing Page", img: "/Images/FGO.png" },
  ];

  return (
    <div className="portfolio-page-container page-container">
      <div className="section-title">
        <h2>Our Work</h2>
        <div className="title-underline"></div>
      </div>
      <div className="portfolio-page-grid">
        {portfolioItems.map(item => (
          <div className="portfolio-item" key={item.id}>
            <img src={item.img} alt={item.title}/>
            <div className="portfolio-overlay"><h3>{item.title}</h3></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Portfolio;