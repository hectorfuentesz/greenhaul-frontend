import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', 
  build: {
    outDir: 'dist', 
    rollupOptions: {
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
        register: './register.html',
        passwordReset: './password-reset.html' // <-- AGREGA ESTA LÍNEA
      }
    }
  }
});