import { Link } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              <img src={logoSvg} alt="Anota" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-base font-semibold tracking-tight sm:text-lg">Anota</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-black sm:min-h-0 sm:min-w-0"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 sm:min-h-0 sm:min-w-0"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <section className="mb-14 grid gap-10 lg:mb-20 lg:grid-cols-2 lg:gap-14 lg:items-center">
          <div className="order-2 lg:order-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mb-4 sm:tracking-[0.25em]">
              Organiza ideas, tareas y notas
            </p>
            <h1
              className="mb-4 text-3xl font-semibold leading-tight tracking-tight text-black sm:mb-5 sm:text-4xl lg:text-5xl lg:leading-tight"
              style={{ letterSpacing: '-0.04em' }}
            >
              Tu cerebro digital
              <br />
              en un solo lugar.
            </h1>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-gray-600 sm:mb-8">
              Anota combina notas tipo Notion, notas rápidas y un gestor de tareas ligero
              para capturar ideas, planear tu día y organizar proyectos sin fricción.
            </p>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-gray-800 active:bg-gray-900 sm:min-h-0"
              >
                Empezar gratis
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:min-h-0"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex -space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-800 text-[11px] font-semibold text-white">
                  AE
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[11px] font-semibold text-gray-600">
                  UX
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[11px] font-semibold text-gray-500">
                  PM
                </div>
              </div>
              <p className="text-sm text-gray-500 sm:max-w-xs">
                Ideal para profesionales, estudiantes y equipos que necesitan un espacio limpio para pensar y ejecutar.
              </p>
            </div>
          </div>

          {/* Mockup cards */}
          <div className="relative order-1 lg:order-2">
            <div className="absolute -left-2 -top-4 h-24 w-24 rounded-3xl bg-purple-100 opacity-50 blur-2xl sm:h-32 sm:w-32 sm:opacity-60 lg:blur-3xl" />
            <div className="absolute -bottom-4 -right-2 h-28 w-28 rounded-3xl bg-amber-100 opacity-50 blur-2xl sm:h-40 sm:w-40 sm:opacity-60 lg:blur-3xl" />

            <div className="relative space-y-4 sm:space-y-5">
              {/* Card Notas rápidas */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-5 sm:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-100 text-base">📝</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Notas rápidas</p>
                    <p className="text-xs text-gray-500">Captura lo que tengas en la cabeza en segundos.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  <div className="rounded-xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-900 sm:text-[11px]">Ideas sueltas</p>
                    <p className="line-clamp-3 text-xs text-gray-600 sm:text-[11px]">
                      Anota ideas, frases o aprendizajes sin preocuparte por la estructura.
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-900 sm:text-[11px]">Reuniones</p>
                    <p className="line-clamp-3 text-xs text-gray-600 sm:text-[11px]">
                      Resumen de reuniones y comparte después como nota.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3">
                    <p className="mb-1 text-xs font-semibold text-gray-900 sm:text-[11px]">Recordatorios</p>
                    <p className="line-clamp-3 text-xs text-gray-600 sm:text-[11px]">
                      Cosas que no quieres olvidar hoy o esta semana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Tareas */}
              <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Tareas ligeras</p>
                  <p className="mb-1 text-sm font-semibold text-gray-900">Checklist simple</p>
                  <p className="text-xs text-gray-500">
                    Marca completadas, prioriza y vincula tareas con notas.
                  </p>
                </div>
                <div className="shrink-0 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 shrink-0 rounded-full border border-gray-300" />
                    <span className="text-gray-700">Preparar resumen semanal</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-80">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-500 line-through">Responder correos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 shrink-0 rounded-full border border-gray-300" />
                    <span className="text-gray-700">Plan de contenido</span>
                  </div>
                </div>
              </div>

              {/* Card Carpetas */}
              <div className="flex flex-col gap-4 rounded-2xl bg-gray-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Estructura clara</p>
                  <p className="mb-1 text-sm font-semibold">Carpetas tipo árbol</p>
                  <p className="max-w-xs text-xs text-gray-300">
                    Organiza notas por proyectos, clientes o áreas.
                  </p>
                </div>
                <div className="shrink-0 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px]">
                  <p className="mb-1 text-gray-300">Ejemplo</p>
                  <ul className="space-y-0.5">
                    <li>📁 Trabajo</li>
                    <li className="pl-3 sm:pl-4">📁 Clientes</li>
                    <li className="pl-6 sm:pl-8">📄 Reunión ACME</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 pt-10 sm:pt-12">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Notas tipo Notion</h3>
              <p className="mb-3 text-sm text-gray-600">
                Editor por bloques para documentos largos: títulos, listas y secciones.
              </p>
              <p className="text-xs text-gray-400">
                Ideal para documentación, briefs y escritura más profunda.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Notas rápidas a mano</h3>
              <p className="mb-3 text-sm text-gray-600">
                Abre Anota y escribe. Sin configuración, solo un espacio para pensar.
              </p>
              <p className="text-xs text-gray-400">
                Un boceto rápido puede convertirse en una nota formal.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Tareas vinculadas a notas</h3>
              <p className="mb-3 text-sm text-gray-600">
                Crea tareas dentro de notas y dales seguimiento desde la vista de tareas.
              </p>
              <p className="text-xs text-gray-400">
                Contexto y acción juntos: menos dispersión, más enfoque.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-3 text-sm text-gray-500">Anota · Tu espacio para pensar y ejecutar.</p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <Link to="/politica-privacidad" className="underline transition-colors hover:text-black">
              Política de Privacidad
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link to="/condiciones-servicio" className="underline transition-colors hover:text-black">
              Condiciones del Servicio
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};
