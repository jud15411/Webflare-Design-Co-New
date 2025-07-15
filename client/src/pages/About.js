import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container page-container">
      <div className="section-title">
        <h2>About Webflare Design Co.</h2>
        <div className="title-underline"></div>
      </div>
      <div className="about-content">
        <p className="about-story">
          Webflare Design Co is more than just a web development company; 
          we're your partner in growth. We're committed to helping small 
          businesses like yours navigate the digital landscape, building robust 
          and engaging websites that captivate your audience and drive success. 
          Our journey began with a simple idea between a father and son: to make 
          professional web solutions accessible and impactful for every ambitious 
          entrepreneur. We genuinely care about your success, and our core value 
          is to empower your business to not just survive, but truly shine online.
        </p>
      </div>

      <div className="section-title team-title">
        <h2>Meet the Team</h2>
        <div className="title-underline"></div>
      </div>
      <div className="team-grid">
        <div className="team-member-card">
          <img src="/Images/team-member-1.jpg" alt="Team Member 1" className="team-member-photo"/>
          <h3>Judson Wells</h3>
          <p>Founder & Head Developer</p>
        </div>
      </div>
    </div>
  );
}

export default About;