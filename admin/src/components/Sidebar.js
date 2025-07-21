import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import { FaTachometerAlt, FaProjectDiagram, FaTasks, FaUsers, FaUserTie, FaFileInvoice, FaFileSignature, FaConciergeBell, FaChartBar, FaCog, FaSignOutAlt } from 'react-icons/fa';

// Accept handleLogout as a prop from App.js
const Sidebar = ({ handleLogout }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // This function now calls the handleLogout prop from App.js
    const onLogout = () => {
        handleLogout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src="/images/Webflare_Design_Co.webp" alt="Webflare Logo" className="sidebar-logo" />
                <h3>Developer Gateway</h3>
            </div>
            {/* THE FIX: Wrap the links in a <ul> */}
            <nav className="sidebar-nav">
                <ul>
                    {/* And wrap each NavLink in an <li> */}
                    <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}><FaTachometerAlt /> Dashboard</NavLink></li>
                    <li><NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}><FaProjectDiagram /> Projects</NavLink></li>
                    <li><NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}><FaTasks /> Tasks</NavLink></li>
                    <li><NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}><FaUsers /> Users</NavLink></li>
                    <li><NavLink to="/clients" className={({ isActive }) => isActive ? 'active' : ''}><FaUserTie /> Clients</NavLink></li>
                    <li><NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}><FaFileInvoice /> Invoices</NavLink></li>
                    <li><NavLink to="/contracts" className={({ isActive }) => isActive ? 'active' : ''}><FaFileSignature /> Contracts</NavLink></li>
                    <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}><FaConciergeBell /> Services</NavLink></li>
                    <li><NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}><FaChartBar /> Reports</NavLink></li>
                    <li><NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}><FaCog /> Settings</NavLink></li>
                </ul>
            </nav>
            <div className="sidebar-footer">
                {user && (
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                    </div>
                )}
                <button onClick={onLogout} className="logout-button">
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;