import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Replace the text logo with an image tag */}
        <Link to="/" className="navbar-logo">
          <img src="/images/Webflare_Design_Co.webp" alt="Webflare Design Co. Logo" />
        </Link>
        <ul className="nav-menu">
          <li className="nav-item"><Link to="/" className="nav-links">Home</Link></li>
          <li className="nav-item"><Link to="/about" className="nav-links">About</Link></li>
          <li className="nav-item"><Link to="/services" className="nav-links">Services</Link></li>
          <li className="nav-item"><Link to="/portfolio" className="nav-links">Portfolio</Link></li>
          <li className="nav-item"><Link to="/contact" className="nav-links">Contact Us</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;