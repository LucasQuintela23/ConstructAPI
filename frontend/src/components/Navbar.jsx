import { Link, useLocation } from 'react-router-dom';
import { FiDatabase, FiHome, FiLayers } from 'react-icons/fi';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: <FiHome /> },
    { to: '/templates', label: 'Templates', icon: <FiLayers /> },
  ];

  return (
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <FiDatabase className="text-2xl" />
          ConstructAPI
        </Link>
        <div className="flex gap-4">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-indigo-900 text-white'
                  : 'hover:bg-indigo-600'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
