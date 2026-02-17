import logoSvg from '../assets/logo.svg';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-900">
      {/* Navbar simple */}
      <header className="w-full border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
              <img src={logoSvg} alt="Anota logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Anota</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl"
            >
              Iniciar sesión
            </a>
            <a
              href="/register"
              className="px-4 py-2.5 text-sm font-semibold text-white bg-black rounded-xl hover:bg-gray-900 shadow-sm"
            >
              Crear cuenta
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <section className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-4">
              ORGANIZA TUS IDEAS, TAREAS Y NOTAS
            </p>
            <h1
              className="text-4xl lg:text-5xl font-semibold text-black mb-5"
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.04em' }}
            >
              Tu cerebro digital
              <br />
              en un solo lugar.
            </h1>
            <p className="text-gray-600 text-sm lg:text-base mb-6 max-w-xl">
              Anota combina notas tipo Notion, notas rápidas y un gestor de tareas ligero
              para que puedas capturar ideas, planear tu día y organizar proyectos sin fricción.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <a
                href="/register"
                className="px-6 py-3 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-900 shadow-md flex items-center gap-2"
              >
                Empezar gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/login"
                className="px-4 py-2.5 text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2"
              >
                Ya tengo una cuenta
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white tracking-wide">
                    AE
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-gray-600">
                    UX
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-gray-500">
                    PM
                  </span>
                </div>
              </div>
              <p>
                Ideal para profesionales, estudiantes y equipos pequeños que necesitan
                un espacio limpio para pensar y ejecutar.
              </p>
            </div>
          </div>

          {/* Mockup / Cards */}
          <div className="relative">
            <div className="absolute -top-6 -left-4 w-32 h-32 bg-purple-100 rounded-3xl blur-3xl opacity-60" />
            <div className="absolute -bottom-10 -right-8 w-40 h-40 bg-amber-100 rounded-3xl blur-3xl opacity-60" />

            <div className="relative space-y-4">
              {/* Card Notas rápidas */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">📝</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.16em]">
                        Notas rápidas
                      </p>
                      <p className="text-xs text-gray-500">Captura lo que tengas en la cabeza en segundos.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 p-3">
                    <p className="font-semibold text-gray-900 mb-1">Ideas sueltas</p>
                    <p className="text-gray-600 line-clamp-3">
                      Anota ideas de negocio, frases o aprendizajes sin preocuparte por la estructura.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-3">
                    <p className="font-semibold text-gray-900 mb-1">Reuniones</p>
                    <p className="text-gray-600 line-clamp-3">
                      Lleva el resumen de tus reuniones y comparte después como nota.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-3">
                    <p className="font-semibold text-gray-900 mb-1">Recordatorios</p>
                    <p className="text-gray-600 line-clamp-3">
                      Cosas que no quieres olvidar hoy, esta semana o este mes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Tareas */}
              <div className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.18em] mb-1">
                    Tareas ligeras
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Checklist simple, sin complicaciones</p>
                  <p className="text-xs text-gray-500">
                    Marca como completadas, prioriza y vincula tareas con notas más detalladas.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full border border-gray-300" />
                    <span className="text-gray-700">Preparar resumen semanal</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-80">
                    <span className="inline-flex w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-500 line-through">Responder correos críticos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 rounded-full border border-gray-300" />
                    <span className="text-gray-700">Plan de contenido para mañana</span>
                  </div>
                </div>
              </div>

              {/* Card Carpetas / organización */}
              <div className="bg-gray-900 text-white rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                    Estructura clara
                  </p>
                  <p className="text-sm font-semibold mb-1">Carpetas tipo árbol</p>
                  <p className="text-xs text-gray-300 max-w-xs">
                    Organiza tus notas por proyectos, clientes o áreas, sin perder la vista general.
                  </p>
                </div>
                <div className="text-[11px] bg-black/40 rounded-2xl px-3 py-2 border border-white/10">
                  <p className="text-gray-300 mb-1">Ejemplo</p>
                  <ul className="space-y-0.5">
                    <li>📁 Trabajo</li>
                    <li className="pl-4">📁 Clientes</li>
                    <li className="pl-8">📄 Reunión ACME</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de características rápidas */}
        <section className="grid md:grid-cols-3 gap-6 border-t border-gray-200 pt-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-1">Notas tipo Notion</h3>
            <p className="text-xs text-gray-600 mb-3">
              Editor por bloques para escribir documentos más largos, con títulos, listas y secciones.
            </p>
            <p className="text-[11px] text-gray-400">
              Ideal para documentación, brainstorming, briefs y escritura más profunda.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-1">Notas rápidas siempre a mano</h3>
            <p className="text-xs text-gray-600 mb-3">
              Abre Anota y escribe. Nada de configuración previa, solo un espacio para pensar.
            </p>
            <p className="text-[11px] text-gray-400">
              Lo que hoy es un boceto rápido, mañana puede convertirse en una nota formal.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-1">Tareas vinculadas a notas</h3>
            <p className="text-xs text-gray-600 mb-3">
              Crea tareas dentro de tus notas y dales seguimiento desde la vista de tareas.
            </p>
            <p className="text-[11px] text-gray-400">
              Mantén unidos contexto y acción: menos dispersión, más enfoque.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-4 text-xs text-gray-500 text-center">
        Anota · Tu espacio para pensar y ejecutar.
      </footer>
    </div>
  );
}

