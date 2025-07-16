import React from 'react';
import './LegalPages.css';

function CookiePolicy() {
  return (
    <div className="legal-container">
      <h2>Cookie Policy</h2>
      <p className="last-updated">Last Updated: July 16, 2025</p>
      
      <h3>What Are Cookies?</h3>
      <p>As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer to improve your experience. This page describes what information they gather, how we use it, and why we sometimes need to store these cookies.</p>

      <h3>How We Use Cookies</h3>
      <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.</p>
      
      <h3>Types of Cookies We Use</h3>
      <ul>
        <li>
          <strong>Performance and Analytics Cookies:</strong> This site uses Google Analytics, which is one of the most widespread and trusted analytics solutions on the web, for helping us to understand how you use the site and ways that we can improve your experience. These cookies may track things such as how long you spend on the site and the pages that you visit so we can continue to produce engaging content.
        </li>
        <li>
          <strong>Essential Cookies:</strong> These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences.
        </li>
      </ul>

      <h3>Disabling Cookies</h3>
      <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit.</p>
    </div>
  );
}

export default CookiePolicy;