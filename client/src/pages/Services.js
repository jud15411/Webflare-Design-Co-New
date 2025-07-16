import React, { useState, useEffect, useCallback } from 'react';
import './Services.css';

function Services() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      // This is a public route, so no token is needed
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services`);
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  if (isLoading) {
    return <div className="page-container">Loading...</div>;
  }

  return (
    <div className="services-page-container page-container">
      <div className="section-title">
        <h2>What We Offer</h2>
        <div className="title-underline"></div>
      </div>
      <div className="services-page-grid">
        {services.map(service => (
          <div className="service-page-card" key={service._id}>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;