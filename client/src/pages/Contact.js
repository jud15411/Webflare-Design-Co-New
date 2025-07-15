import React from 'react';
import './Contact.css';

function Contact() {
  return (
    <div className="contact-container page-container">
      <div className="section-title">
        <h2>Get In Touch</h2>
        <div className="title-underline"></div>
        <p className="contact-subtext">Have a project in mind? We'd love to hear about it.</p>
      </div>
      <div className="contact-form-container">
        <form className="contact-form">
          <div className="form-group">
            <input type="text" placeholder="Your Name" required />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Your Email" required />
          </div>
          <div className="form-group">
            <textarea placeholder="Tell us about your project..." rows="7" required></textarea>
          </div>
          <button type="submit" className="submit-button">Send Message</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;