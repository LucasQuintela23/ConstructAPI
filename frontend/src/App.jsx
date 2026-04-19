import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import TemplateBuilder from './pages/TemplateBuilder';
import DataView from './pages/DataView';
import FormView from './pages/FormView';
import UploadView from './pages/UploadView';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/new" element={<TemplateBuilder />} />
            <Route path="/templates/:id/edit" element={<TemplateBuilder />} />
            <Route path="/templates/:id/data" element={<DataView />} />
            <Route path="/templates/:id/form" element={<FormView />} />
            <Route path="/templates/:id/upload" element={<UploadView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
