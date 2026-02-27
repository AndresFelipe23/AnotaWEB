import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PageHeaderProvider } from './contexts/PageHeaderContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Home } from './components/Home';
import { NotasRapidasPage } from './components/NotasRapidasPage';
import { NotasPage } from './components/NotasPage';
import { CarpetasPage } from './components/CarpetasPage';
import { TareasPage } from './components/TareasPage';
import { DashboardPage } from './components/DashboardPage';
import { MeetingTranscriberPage } from './components/MeetingTranscriberPage';
import { LandingPage } from './components/LandingPage';
import { PoliticaPrivacidad } from './components/PoliticaPrivacidad';
import { CondicionesServicio } from './components/CondicionesServicio';
import { PizarrasPage } from './components/PizarrasPage';
import { PizarraEditorPage } from './components/PizarraEditorPage';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/condiciones-servicio" element={<CondicionesServicio />} />
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login onToggleMode={() => {}} />} />
            <Route path="/register" element={<Register onToggleMode={() => {}} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route element={
            <PageHeaderProvider>
              <Outlet />
            </PageHeaderProvider>
          }>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/notas-rapidas" element={<NotasRapidasPage />} />
            <Route path="/notas" element={<NotasPage />} />
            <Route path="/pizarras" element={<PizarrasPage />} />
            <Route path="/pizarras/:id" element={<PizarraEditorPage />} />
            <Route path="/carpetas" element={<CarpetasPage />} />
            <Route path="/tareas" element={<TareasPage />} />
            <Route path="/transcripcion-reunion" element={<MeetingTranscriberPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
