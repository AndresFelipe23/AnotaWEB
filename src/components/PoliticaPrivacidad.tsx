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

export function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={styles.wrap}>
        <Link to="/" className={styles.back}>← Volver a Anota</Link>
        <h1 className={styles.h1}>Política de Privacidad</h1>
        <p className={styles.updated}>Última actualización: febrero 2025</p>

        <p className={styles.p}>
          Anota es un servicio que te permite organizar notas, tareas, carpetas y transcripciones. Esta política describe qué información recopilamos, cómo la usamos y tus derechos al utilizar <strong>anota.click</strong> y los servicios asociados (incluida la API en anotaweb.work).
        </p>

        <h2 className={styles.h2}>1. Información que recopilamos</h2>
        <ul className={styles.ul}>
          <li><strong>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (almacenada de forma segura) al registrarte.</li>
          <li><strong>Contenido que creas:</strong> notas, notas rápidas, tareas, carpetas y etiquetas que guardas en la aplicación.</li>
          <li><strong>Integración con Google Tasks:</strong> si conectas tu cuenta de Google, almacenamos tokens de acceso necesarios para leer y actualizar tus listas de tareas en Google Tasks; no almacenamos tu contraseña de Google.</li>
          <li><strong>Uso del servicio:</strong> podemos registrar direcciones IP, tipo de navegador y acciones generales para el funcionamiento y la seguridad del servicio.</li>
        </ul>

        <h2 className={styles.h2}>2. Uso de la información</h2>
        <p className={styles.p}>
          Utilizamos la información para: proporcionar y mejorar el servicio, autenticarte, sincronizar con Google Tasks si lo autorizas, responder soporte y cumplir obligaciones legales cuando sea necesario.
        </p>

        <h2 className={styles.h2}>3. Almacenamiento y seguridad</h2>
        <p className={styles.p}>
          Los datos se almacenan en servidores seguros. Las contraseñas se protegen con técnicas de cifrado adecuadas. Los tokens de Google se guardan de forma segura y se usan solo para las funciones que autorizas.
        </p>

        <h2 className={styles.h2}>4. Compartir datos</h2>
        <p className={styles.p}>
          No vendemos tu información personal. Podemos compartir datos solo: (a) con proveedores que nos ayudan a operar el servicio (hosting, bases de datos), (b) con Google cuando usas la integración de Google Tasks, bajo sus propias políticas, y (c) cuando la ley lo exija.
        </p>

        <h2 className={styles.h2}>5. Tus derechos</h2>
        <p className={styles.p}>
          Puedes acceder, corregir o solicitar la eliminación de tus datos de cuenta y contenido desde la aplicación o contactándonos. Puedes desconectar la integración de Google en cualquier momento desde la sección de Tareas.
        </p>

        <h2 className={styles.h2}>6. Cookies y tecnologías similares</h2>
        <p className={styles.p}>
          Utilizamos cookies o almacenamiento local necesarios para la sesión, el inicio de sesión y las preferencias. No usamos cookies de terceros para publicidad.
        </p>

        <h2 className={styles.h2}>7. Cambios</h2>
        <p className={styles.p}>
          Podemos actualizar esta política ocasionalmente. La versión vigente se publicará en esta página con la fecha de última actualización.
        </p>

        <h2 className={styles.h2}>8. Contacto</h2>
        <p className={styles.p}>
          Para preguntas sobre privacidad o ejercer tus derechos: <a href="mailto:afesdev2025@gmail.com" className={styles.a}>afesdev2025@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
