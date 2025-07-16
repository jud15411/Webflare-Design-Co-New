import React from 'react';
import './LegalPages.css';

function Copyright() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="legal-container">
      <h2>Copyright Notice</h2>
      <p className="last-updated">Last Updated: July 16, 2025</p>

      <p>Copyright &copy; {currentYear} Webflare Design Co. All Rights Reserved.</p>

      <h3>1. Ownership of Copyright</h3>
      <p>The copyright in this website and the material on this website (including without limitation the text, computer code, artwork, photographs, images, music, audio material, video material and audio-visual material on this website) is owned by Webflare Design Co.</p>
      
      <h3>2. Copyright License</h3>
      <p>Webflare Design Co. grants to you a worldwide non-exclusive royalty-free revocable license to:</p>
      <ul>
        <li>View this website and the material on this website on a computer or mobile device via a web browser;</li>
        <li>Copy and store this website and the material on this website in your web browser cache memory; and</li>
        <li>Print pages from this website for your own personal and non-commercial use.</li>
      </ul>
      <p>Webflare Design Co. does not grant you any other rights in relation to this website or the material on this website. In other words, all other rights are reserved.</p>

      <h3>3. Data Mining</h3>
      <p>The automated and/or systematic collection of data from this website is prohibited.</p>

      <h3>4. Enforcement of Copyright</h3>
      <p>If Webflare Design Co. discovers that you have used its copyright materials in contravention of the license above, we may bring legal proceedings against you seeking monetary damages and an injunction to stop you using those materials.</p>
    </div>
  );
}

export default Copyright;