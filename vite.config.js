import { defineConfig } from 'vite';

export default defineConfig({
  // Aseguramos que la raíz es la carpeta principal
  root: '.', 
  build: {
    // La carpeta de salida al compilar será 'dist'
    outDir: 'dist', 
    rollupOptions: {
      // Definimos cada una de tus páginas HTML
      input: {
        main: './index.html',
        productos: './productos.html',
        servicios: './servicios.html',
        nosotros: './nosotros.html',
        contacto: './contacto.html',
        login: './login.html',
        pago: './pago.html',
        confirmacion: './confirmacion-entrega-recoleccion.html',
        cuenta: './cuenta.html',
        faq: './faq.html',
        register: './register.html'
      }
    }
  }
});