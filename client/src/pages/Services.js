import React from 'react';
import './Services.css';

function Services() {
  return (
    <div className="services-page-container page-container">
      <div className="section-title">
        <h2>What We Offer</h2>
        <div className="title-underline"></div>
      </div>
      <div className="services-page-grid">
        <div className="service-page-card">
          <h3>Custom Web Development</h3>
          <p>From sleek landing pages to complex web applications, we build solutions from scratch tailored to your exact needs. We focus on clean code, scalability, and performance.</p>
        </div>
        <div className="service-page-card">
          <h3>UI/UX Design</h3>
          <p>Our design process is human-centered. We create intuitive, engaging, and aesthetically pleasing interfaces that your users will love to interact with.</p>
        </div>
        <div className="service-page-card">
          <h3>E-Commerce Solutions</h3>
          <p>We build robust and secure online stores. From product catalogs to payment gateways, we provide end-to-end e-commerce development.</p>
        </div>
        <div className="service-page-card">
          <h3>SEO & Digital Marketing</h3>
          <p>A great website needs to be seen. We implement foundational SEO best practices and strategies to improve your search engine ranking and drive organic traffic.</p>
        </div>
        <div className="service-page-card">
          <h3>Website Maintenance</h3>
          <p>Keep your digital presence secure and up-to-date. We offer maintenance packages that include updates, security monitoring, and performance checks.</p>
        </div>
        <div className="service-page-card">
          <h3>API Integration</h3>
          <p>We connect your website to third-party services, payment processors, and other external systems to extend its functionality and automate processes.</p>
        </div>
      </div>
    </div>
  );
}

export default Services;