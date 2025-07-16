import React from 'react';
import { Link } from 'react-router-dom'; // Make sure Link is imported
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} Webflare Design Co. All Rights Reserved.</p>
        <div className="footer-links">
          {/* Use Link component for client-side routing */}
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
          <Link to="/copyright">Copyright</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;