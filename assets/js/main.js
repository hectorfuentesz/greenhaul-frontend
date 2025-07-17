/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL
 * (Versión con todas las funcionalidades integradas, EXCEPTO la calculadora,
 * lista para su rediseño e integración)
 * =================================================================
 */

// --- 1. FUNCIÓN GLOBAL DE NOTIFICACIÓN ---
// Muestra mensajes temporales en la interfaz de usuario (ej. "Producto añadido").
function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('cartNotification');
    if (!notificationElement) return;

    const messageElement = notificationElement.querySelector('#notificationText');
    const iconElement = notificationElement.querySelector('.notification-icon');

    // ===== ÍCONOS SVG MEJORADOS Y MÁS VISIBLES =====
    const svgSuccess = '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"></path></svg>';
    const svgError = '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M18 6L6 18M6 6l12 12"></path></svg>';

    let iconSVGContent = svgSuccess;
    if (type === 'error') {
        iconSVGContent = svgError;
    }
    
    if (messageElement) messageElement.textContent = message;
    if (iconElement) iconElement.innerHTML = iconSVGContent;

    notificationElement.className = 'cart-notification'; // Resetea clases
    notificationElement.classList.add(type, 'visible'); // Añade tipo y hace visible
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notificationElement.classList.remove('visible');
    }, 1500);
}



// --- 2. LÓGICA PRINCIPAL DEL SITIO (Se ejecuta cuando el DOM está completamente cargado) ---
document.addEventListener('DOMContentLoaded', () => {

    // Inicializa elementos globales como el menú de navegación adaptable y el año actual del footer.
    const initGlobalElements = () => {
        const navbarToggler = document.getElementById('navbarToggler');
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('active');
                navbarToggler.classList.toggle('active'); // Anima el icono de la hamburguesa
            });
        }
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    };

    // Resalta el enlace de navegación que corresponde a la página actual.
    const initActiveNav = () => {
        const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
        // Obtiene el nombre del archivo HTML actual (ej. 'index.html', 'productos.html')
        const currentPage = window.location.pathname.split('/').pop() || 'index.html'; 
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active'); // Marca el enlace como activo
            } else {
                link.classList.remove('active'); // Desactiva otros enlaces
            }
        });
    };

    // Gestiona el estado de la sesión de usuario (mostrar/ocultar botones de login/logout, nombre de usuario).
    const initUserSession = () => {
        const userActionsContainer = document.getElementById('navbarUserActions');
        const loginBtn = document.getElementById('loginBtn');
        const accountLink = document.getElementById('accountLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameSpan = document.getElementById('userName');
        
        // Recuperar información de usuario del almacenamiento local para persistencia de sesión
        const savedUser = JSON.parse(localStorage.getItem('greenhaulUser'));

        if (savedUser && savedUser.name) {
            // Si hay un usuario logueado, ocultar login y mostrar opciones de cuenta
            if (loginBtn) loginBtn.style.display = 'none';
            if (accountLink) accountLink.style.display = 'flex'; 
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = savedUser.name.split(' ')[0]; // Muestra solo el primer nombre
        } else {
            // Si no hay usuario logueado, mostrar el botón de login y ocultar el resto
            if (loginBtn) loginBtn.style.display = 'flex'; // Asegura que el botón de login sea visible
            if (accountLink) accountLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        // Asegura que el contenedor de acciones de usuario sea visible para que los elementos se muestren
        if (userActionsContainer) userActionsContainer.classList.add('visible');

        // Listener para el botón de cerrar sesión
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('greenhaulUser');    // Eliminar usuario de localStorage
                localStorage.removeItem('shoppingCart'); // Limpiar carrito al cerrar sesión
                alert('Has cerrado sesión correctamente.');
                window.location.href = 'index.html'; // Redirigir a la página de inicio
            });
        }
        
        // Listener para el botón de iniciar sesión (simulado)
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Simulación de inicio de sesión: guarda un usuario de ejemplo. En un entorno real, esto vendría de un backend.
                localStorage.setItem('greenhaulUser', JSON.stringify({ name: 'UsuarioEjemplo' }));
                window.location.href = 'login.html'; // Rediriger a la página de login
            });
        }
    };
    
    // Gestiona toda la lógica del carrito de compras: añadir, eliminar, actualizar cantidades, abrir/cerrar modal, totales.
    const initShoppingCart = () => {
        // Inicialización robusta del carrito:
        // Asegura que 'cart' sea un objeto y 'cart.items' siempre sea un array.
        // Asegura que cart.rentalDates y cart.totalDays estén bien inicializados.
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || {};
        cart.items = Array.isArray(cart.items) ? cart.items : [];
        cart.rentalDates = cart.rentalDates || { start: null, end: null }; // Fechas de alquiler para todo el carrito
        cart.totalDays = cart.totalDays || 0; // Total de días de alquiler para todo el carrito

        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) return; // Salir si los elementos DOM clave no existen

        // Guarda el estado actual del carrito en localStorage
        const saveCart = () => localStorage.setItem('shoppingCart', JSON.stringify(cart));
        
        // Calcula la diferencia en días entre dos fechas (ignorando la hora)
        const calculateDays = (startDate, endDate) => {
            // Asegúrate de que las fechas sean válidas
            if (!startDate || !endDate) return 0;
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Si la fecha de inicio es posterior a la de fin, devuelve 0 o maneja como error
            if (start > end) {
                console.warn("Fecha de inicio es posterior a la fecha de fin.");
                return 0;
            }
            const diffTime = Math.abs(end.getTime() - start.getTime()); // Usar .getTime() para milisegundos
            // Calcular días, y sumar 1 para incluir ambos días (inicio y fin)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            return diffDays;
        };

        // Actualiza el número de ítems en el ícono del carrito en el header
        const updateCartCount = () => {
            const el = document.getElementById('cartCount');
            if (!el) return;
            const total = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            el.textContent = total;
            el.style.display = total > 0 ? 'flex' : 'none'; // Muestra/oculta el contador
        };

        // Renderiza (dibuja) el contenido del modal del carrito con los ítems actuales.
        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = ''; // Limpiar contenido previo para re-dibujar
            
            const startDateEl = document.getElementById('cartStartDate');
            const endDateEl = document.getElementById('cartEndDate');
            const datesContainer = document.querySelector('.cart-rental-dates');
            const cartTotalDaysEl = document.getElementById('cartTotalDays'); 

            // Muestra u oculta las fechas de alquiler en el modal del carrito
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end && datesContainer) {
                if(startDateEl) startDateEl.textContent = cart.rentalDates.start;
                if(endDateEl) endDateEl.textContent = cart.rentalDates.end;
                if(cartTotalDaysEl) cartTotalDaysEl.textContent = cart.totalDays; // Mostrar total de días
                datesContainer.style.display = 'block';
            } else if (datesContainer) {
                datesContainer.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.add('disabled'); // Deshabilita el botón de proceder
            } else {
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.remove('disabled'); // Habilita el botón de proceder
                cart.items.forEach(item => {
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    // Usa item.rentalDays si está definido, de lo contrario, usa cart.totalDays (para compatibilidad)
                    const itemTotalDays = typeof item.rentalDays === 'number' && item.rentalDays > 0 ? item.rentalDays : cart.totalDays; 

                    // Genera las opciones para el selector de cantidad (1 a 20)
                    let opts = Array.from({length: 20}, (_, i) => 
                        `<option value="${i + 1}" ${quantity === i + 1 ? 'selected' : ''}>${i + 1}</option>`
                    ).join('');
                    
                    cartItemsContainer.innerHTML += `
                        <div class="cart-item" data-product-id="${item.id}">
                            <div class="cart-item-details">
                                <h4>${item.name}</h4>
                                <p class="price">$${price.toFixed(2)} c/u x ${itemTotalDays} días</p>
                                <p class="item-subtotal">Subtotal Ítem: $${(price * quantity * itemTotalDays).toFixed(2)}</p>
                            </div>
                            <div class="cart-item-controls">
                                <label for="cart-qty-${item.id}">Cant:</label>
                                <select id="cart-qty-${item.id}" class="cart-item-quantity">${opts}</select>
                                <button class="remove-item-btn" title="Eliminar">&times;</button>
                            </div>
                        </div>
                    `;
                });
            }
            updateCartModalTotals();      // Actualiza los totales después de renderizar los ítems
            addCartModalEventListeners(); // Re-adjunta listeners a los nuevos elementos del carrito
        };
        
        // Calcula y actualiza los subtotales, impuestos y total en el modal del carrito.
        const updateCartModalTotals = () => {
            // Calcula el subtotal multiplicando precio * cantidad * días de alquiler por cada ítem
            const subtotal = (cart.items || []).reduce((sum, item) => {
                // Asegurarse de usar los días de renta del ítem, si no, los del carrito, si no, 1 día
                const effectiveDays = typeof item.rentalDays === 'number' && item.rentalDays > 0 ? item.rentalDays : cart.totalDays;
                return sum + (item.price * item.quantity * (effectiveDays || 1)); // Default a 1 si no hay días
            }, 0);
            
            const taxes = subtotal * 0.16; // 16% de impuestos
            const total = subtotal + taxes;

            const subtotalEl = document.getElementById('cartSubtotal');
            const taxesEl = document.getElementById('cartTaxes');
            const totalEl = document.getElementById('cartTotal');
            
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (taxesEl) taxesEl.textContent = `$${taxes.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        };

        // Elimina un ítem específico del carrito por su ID.
        const removeCartItem = (id) => {
            cart.items = cart.items.filter(item => item.id !== id);
            if (cart.items.length === 0) {
                cart.rentalDates = { start: null, end: null }; // Si el carrito se vacía, también se limpian las fechas de alquiler
                cart.totalDays = 0;
            }
            saveCart();
            renderCartModal();
            updateCartCount();
            showNotification('Ítem eliminado del carrito.', 'error');
        };

        // Actualiza la cantidad de un ítem específico en el carrito.
        const updateCartItemQuantity = (id, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === id);
            if (itemInCart) {
                itemInCart.quantity = parseInt(newQuantity, 10);
                saveCart();
                renderCartModal(); // Re-render para reflejar el cambio en la cantidad y los totales
                updateCartCount();
            }
        };

        // Adjunta/Re-adjunta los event listeners a los botones de eliminar y selects de cantidad dentro del modal.
        const addCartModalEventListeners = () => {
            // Es crucial remover los listeners antiguos para evitar duplicados al re-renderizar el modal
            // Usamos un selector más específico para garantizar que solo seleccionamos los elementos dentro del cartItemsContainer.
            cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => btn.removeEventListener('click', handleRemoveClick));
            cartItemsContainer.querySelectorAll('.cart-item-quantity').forEach(select => select.removeEventListener('change', handleQuantityChange));

            // Adjuntar nuevos listeners a los elementos actuales en el DOM
            cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', handleRemoveClick);
            });

            cartItemsContainer.querySelectorAll('.cart-item-quantity').forEach(select => {
                select.addEventListener('change', handleQuantityChange);
            });
        };

        // Handler para el evento de clic en el botón de eliminar ítem del carrito.
        const handleRemoveClick = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            removeCartItem(productId);
        };

        // Handler para el evento de cambio en la cantidad seleccionada para un ítem del carrito.
        const handleQuantityChange = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            updateCartItemQuantity(productId, e.target.value);
        };

        // Añade un producto al carrito. Maneja la lógica de fechas de alquiler y confirmación.
        const addToCart = (productToAdd, rentalDates = null) => {
            let currentRentalDays = 0;
            if (rentalDates && rentalDates.start && rentalDates.end) {
                currentRentalDays = calculateDays(rentalDates.start, rentalDates.end);
            }

            // Lógica para manejar cuándo se establecen o cambian las fechas de alquiler para todo el carrito
            if (cart.items.length === 0) {
                // Si el carrito está vacío, las fechas deben venir del selector en la página de productos.
                if (rentalDates && currentRentalDays > 0) {
                    cart.rentalDates = rentalDates;
                    cart.totalDays = currentRentalDays;
                } else {
                    showNotification('Por favor, selecciona las fechas de entrega y recolección para añadir el primer producto.', 'error');
                    const rentalContainer = document.querySelector('.rental-dates-container');
                    if(rentalContainer) { // Agrega un pequeño feedback visual si no hay fechas
                        rentalContainer.classList.add('shake-animation');
                        setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                    }
                    return; // No añadir el producto si el primer producto no tiene fechas
                }
            } else {
                // Si el carrito tiene ítems, y se proporcionan fechas (desde el UI de productos, por ejemplo)
                if (rentalDates && currentRentalDays > 0) {
                    // Si las nuevas fechas son diferentes a las del carrito actual, pedir confirmación para vaciar.
                    if (cart.rentalDates.start !== rentalDates.start || cart.rentalDates.end !== rentalDates.end) {
                        const confirmMsg = `Las fechas de alquiler seleccionadas (${rentalDates.start} a ${rentalDates.end}, ${currentRentalDays} días) son diferentes a las de tu carrito actual (${cart.rentalDates.start} a ${cart.rentalDates.end}, ${cart.totalDays} días). ¿Deseas vaciar el carrito y empezar un nuevo pedido con estas nuevas fechas?`;
                        if (!confirm(confirmMsg)) {
                            return; // Sale si el usuario cancela
                        }
                        clearCart(); // Vacía el carrito
                        cart.rentalDates = rentalDates; // Establece las nuevas fechas
                        cart.totalDays = currentRentalDays;
                    }
                    // Si las fechas son las mismas, no hacer nada, se usa las fechas ya establecidas en el carrito.
                } else { 
                    // Si hay ítems en el carrito pero no se proporcionaron fechas (ej. añadiendo desde una página sin selector de fechas),
                    // Y el carrito NO tiene fechas válidas (lo cual no debería pasar si el primer producto las tuvo), notificar.
                    if (!cart.rentalDates || cart.totalDays === 0) {
                        showNotification('No se pueden añadir productos. Las fechas de alquiler no están definidas para el carrito.', 'error');
                        return;
                    }
                    // Si el carrito ya tiene fechas, y no se proporcionaron nuevas fechas, usa las fechas existentes del carrito.
                    // No se necesita lógica explícita aquí, ya están en `cart.totalDays`.
                }
            }
            
            // Asegúrate de que el producto a añadir incluya los días de renta, que serán los `cart.totalDays` del carrito.
            // Esto asegura que cada ítem en el carrito tenga la propiedad `rentalDays` para el cálculo individual.
            const itemInCart = cart.items.find(item => item.id === productToAdd.id);
            if (itemInCart) {
                itemInCart.quantity += productToAdd.quantity; // Si existe, solo actualiza la cantidad
            } else {
                cart.items.push({ 
                    ...productToAdd, 
                    rentalDays: cart.totalDays // Cada ítem ahora guarda los días de renta del pedido.
                });
            }
            showNotification(`${productToAdd.name} añadido al carrito por ${cart.totalDays} días.`, 'success');
            saveCart(); // Guarda el carrito actualizado
            updateCartCount(); // Actualiza el contador visual
        };

        // Vacía completamente el carrito y resetea las fechas de alquiler.
        const clearCart = () => {
            cart = { items: [], rentalDates: { start: null, end: null }, totalDays: 0 }; // Resetea el objeto carrito
            saveCart();
            renderCartModal();
            updateCartCount();
        };

        // Event Listeners para los botones "Añadir al carrito" (ej. en la página de productos).
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                if (!productCard) {
                    console.warn("Botón de añadir al carrito sin un elemento padre con clase 'product-card'. Verifica tu HTML.");
                    return;
                }

                const productId = productCard.dataset.productId;
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = parseFloat(productCard.dataset.productPrice);
                const quantitySelect = productCard.querySelector('.product-qty');
                const quantity = parseInt(quantitySelect?.value || '1', 10);

                if (isNaN(productPrice) || quantity <= 0) {
                    showNotification('Error: El precio o la cantidad del producto son inválidos.', 'error');
                    return;
                }
                
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');
                let rentalDates = null;

                // Obtiene las fechas de los inputs si existen en esta página.
                if (startDateInput && endDateInput) {
                    if (!startDateInput.value || !endDateInput.value) {
                        showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                        const rentalContainer = document.querySelector('.rental-dates-container');
                        if(rentalContainer) { // Aplica animación si existe
                            rentalContainer.classList.add('shake-animation');
                            setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                        }
                        return;
                    }
                    rentalDates = { start: startDateInput.value, end: endDateInput.value };
                } 
                // addToCart ahora maneja la lógica de cuándo no hay fechas en el input pero sí en el carrito.

                addToCart({ id: productId, name: productName, price: productPrice, quantity: quantity }, rentalDates);
                if(quantitySelect) quantitySelect.value = "1"; // Limpia la selección de cantidad a 1 después de añadir
            });
        });

        // Listeners para abrir/cerrar el modal del carrito
        cartIcon.addEventListener('click', e => { 
            e.preventDefault(); 
            renderCartModal(); // Asegura que el carrito esté actualizado al abrirlo
            cartModalOverlay.classList.add('active'); // Muestra el modal
        });
        closeCartModalBtn.addEventListener('click', () => cartModalOverlay.classList.remove('active')); // Cierra el modal con la X
        cartModalOverlay.addEventListener('click', e => { 
            if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('active'); // Cierra el modal al hacer clic fuera
        });

        // Listener para el botón "Vaciar Carrito" en el modal
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => { 
                if(confirm('¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.')) {
                    clearCart(); 
                    showNotification('El carrito ha sido vaciado.', 'success'); 
                }
            });
        }
        
        // Listener para el botón "Finalizar Compra"
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => { 
                // Valida que el carrito no esté vacío y que las fechas de alquiler estén presentes y sean válidas.
                if (cart.items.length === 0) { 
                    e.preventDefault(); // Prevenir la navegación si el carrito está vacío
                    showNotification('Tu carrito está vacío. Por favor, añade productos para continuar.', 'error'); 
                } 
                else if (!cart.rentalDates || !cart.rentalDates.start || !cart.rentalDates.end || cart.totalDays === 0) {
                    e.preventDefault();
                    showNotification('Faltan las fechas de entrega y recolección. Por favor, asegúrate de haberlas seleccionado.', 'error');
                }
                saveCart(); // Asegurar que el carrito esté guardado antes de cualquier navegación
            });
        }
        
        updateCartCount(); // Inicializa el contador del carrito al cargar la página
    };

    // Inicializa elementos específicos de la página de productos, como los selectores de fecha (Flatpickr).
    const initProductPageElements = () => {
        const fechaEntregaInput = document.getElementById('fecha-entrega');
        const fechaRecoleccionInput = document.getElementById('fecha-recoleccion');

        // Solo inicializar Flatpickr si los elementos de input existen y la librería 'flatpickr' está cargada
        // Asume que Flatpickr.js está importado en la página que lo necesite (ej. productos.html).
        if (typeof flatpickr !== 'undefined' && fechaEntregaInput && fechaRecoleccionInput) {
            const fechaRecoleccionPicker = flatpickr(fechaRecoleccionInput, {
                locale: "es",           // Idioma español
                minDate: "today",       // Fecha mínima seleccionable es hoy
                altInput: true,         // Habilita un input alternativo para un formato de fecha más amigable
                altFormat: "F j, Y",    // Formato amigable (ej. "Julio 15, 2025")
                dateFormat: "Y-m-d",    // Formato real para el valor del input (ej. "2025-07-15")
            });

            flatpickr(fechaEntregaInput, {
                locale: "es",
                minDate: "today",
                altInput: true,
                altFormat: "F j, Y",
                dateFormat: "Y-m-d",
                onChange: function(selectedDates, dateStr) {
                    // Cuando la fecha de entrega cambia, ajustar la fecha mínima de recolección
                    if (fechaRecoleccionPicker) {
                        fechaRecoleccionPicker.set('minDate', dateStr);
                        // Asegurarse de que la fecha de recolección sea posterior a la de entrega si ya estaba seleccionada
                        if (fechaRecoleccionPicker.selectedDates[0] && selectedDates[0] > fechaRecoleccionPicker.selectedDates[0]) {
                            fechaRecoleccionPicker.setDate(selectedDates[0]);
                        }
                    }
                }
            });
        }
    };

    // --- La función initCalculator ha sido eliminada para su rediseño posterior ---

    // --- Llamadas a las funciones de inicialización (Se ejecutan cuando el DOM está listo) ---
    initGlobalElements();        // Inicializa el navbar y el año del footer
    initActiveNav();             // Marca el enlace de navegación activo
    initUserSession();           // Gestiona la sesión de usuario
    initShoppingCart();          // Inicializa toda la lógica del carrito de compras
    initProductPageElements();   // Inicializa elementos específicos de la página de productos (ej. Flatpickr)
    // initCalculator();            // Esta llamada ha sido eliminada
});