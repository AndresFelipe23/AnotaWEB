import { Link } from 'react-router-dom';

const styles = {
  wrap: 'max-w-[720px] mx-auto px-4 py-10 text-gray-900',
  h1: 'text-2xl font-semibold mb-1',
  updated: 'text-gray-500 text-sm mb-8',
  h2: 'text-lg font-semibold mt-8 mb-2',
  p: 'mb-3 leading-relaxed',
  ul: 'list-disc pl-6 mb-3 space-y-1',
  a: 'text-blue-600 hover:underline',
  back: 'inline-block mt-8 text-sm text-gray-600 hover:text-black',
};

export function CondicionesServicio() {
  return (
    <div className="min-h-screen bg-white">
      <div className={styles.wrap}>
        <Link to="/" className={styles.back}>← Volver a Anota</Link>
        <h1 className={styles.h1}>Condiciones del Servicio</h1>
        <p className={styles.updated}>Última actualización: febrero 2025</p>

        <p className={styles.p}>
          Al utilizar la aplicación <strong>Anota</strong> (incluidos los sitios anota.click y los servicios en anotaweb.work) («el Servicio»), aceptas estas Condiciones del Servicio («Condiciones»). Si no estás de acuerdo, no utilices el Servicio.
        </p>

        <h2 className={styles.h2}>1. Descripción del Servicio</h2>
        <p className={styles.p}>
          Anota es una aplicación que permite crear y organizar notas, notas rápidas, tareas, carpetas y etiquetas, así como usar funciones de transcripción y, opcionalmente, integrar con Google Tasks. El Servicio se ofrece «tal cual» y puede cambiar con el tiempo.
        </p>

        <h2 className={styles.h2}>2. Registro y cuenta</h2>
        <p className={styles.p}>
          Debes proporcionar información veraz al registrarte. Eres responsable de mantener la confidencialidad de tu contraseña y de toda la actividad en tu cuenta. Debes notificarnos de cualquier uso no autorizado.
        </p>

        <h2 className={styles.h2}>3. Uso aceptable</h2>
        <p className={styles.p}>Te comprometes a usar el Servicio solo de forma lícita y de acuerdo con estas Condiciones. No debes:</p>
        <ul className={styles.ul}>
          <li>Usar el Servicio para actividades ilegales o que infrinjan derechos de terceros.</li>
          <li>Intentar acceder a sistemas, cuentas o datos ajenos sin autorización.</li>
          <li>Descompilar, alterar o interferir con el funcionamiento del Servicio o de la infraestructura.</li>
          <li>Usar el Servicio para enviar spam, malware o contenido que dañe a otros usuarios o a terceros.</li>
        </ul>

        <h2 className={styles.h2}>4. Contenido y propiedad intelectual</h2>
        <p className={styles.p}>
          Tú conservas los derechos sobre el contenido que creas (notas, tareas, etc.). Al usar el Servicio nos concedes los derechos necesarios para almacenar, mostrar y sincronizar ese contenido (por ejemplo con Google Tasks si lo autorizas). La aplicación, el diseño y el software de Anota son propiedad del desarrollador o del titular que corresponda.
        </p>

        <h2 className={styles.h2}>5. Integración con Google</h2>
        <p className={styles.p}>
          Si utilizas la integración con Google Tasks, también aceptas las políticas y condiciones de Google aplicables a ese servicio. Nosotros solo actuamos como intermediario autorizado por ti para acceder a tus listas de tareas según los permisos que concedas.
        </p>

        <h2 className={styles.h2}>6. Exención de garantías</h2>
        <p className={styles.p}>
          El Servicio se ofrece «tal cual» y «según disponibilidad». No garantizamos que el Servicio sea ininterrumpido, libre de errores o que cumpla requisitos específicos. El uso del Servicio es bajo tu propia responsabilidad.
        </p>

        <h2 className={styles.h2}>7. Limitación de responsabilidad</h2>
        <p className={styles.p}>
          En la medida permitida por la ley aplicable, no seremos responsables por daños indirectos, incidentales, especiales o consecuentes (incluida la pérdida de datos o de beneficios) derivados del uso o la imposibilidad de usar el Servicio.
        </p>

        <h2 className={styles.h2}>8. Suspensión y terminación</h2>
        <p className={styles.p}>
          Podemos suspender o dar por terminado tu acceso al Servicio si incumples estas Condiciones o por motivos operativos o legales. Tú puedes dejar de usar el Servicio en cualquier momento y, cuando lo permita la aplicación, solicitar la eliminación de tu cuenta y datos.
        </p>

        <h2 className={styles.h2}>9. Modificaciones</h2>
        <p className={styles.p}>
          Podemos modificar estas Condiciones. Los cambios se publicarán en esta página con una nueva fecha de «Última actualización». El uso continuado del Servicio tras los cambios constituye la aceptación de las nuevas Condiciones.
        </p>

        <h2 className={styles.h2}>10. Ley aplicable y contacto</h2>
        <p className={styles.p}>
          Estas Condiciones se rigen por las leyes aplicables en Colombia (o el país que indiques según tu ubicación). Para consultas: <a href="mailto:afesdev2025@gmail.com" className={styles.a}>afesdev2025@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
