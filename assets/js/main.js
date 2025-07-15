/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL
 * (Versión con todas las funcionalidades integradas, depuradas y calculadora con pop-up de resultados)
 * =================================================================
 */

// --- 1. FUNCIÓN GLOBAL DE NOTIFICACIÓN ---
// Muestra mensajes temporales en la interfaz de usuario (ej. "Producto añadido").
function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('cartNotification');
    if (!notificationElement) return; // Salir si el elemento de notificación no existe
    
    const messageElement = notificationElement.querySelector('#notificationText');
    const iconElement = notificationElement.querySelector('.notification-icon');
    
    const iconClassSuccess = 'fas fa-check-circle'; // Icono para éxito (FontAwesome)
    const iconClassError = 'fas fa-times-circle';   // Icono para error (FontAwesome)

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (iconElement) {
        iconElement.className = 'notification-icon'; // Resetear clases del icono
        if (type === 'success') {
            iconElement.classList.add(...iconClassSuccess.split(' '));
        } else if (type === 'error') {
            iconElement.classList.add(...iconClassError.split(' '));
        }
    }
    
    notificationElement.className = 'cart-notification'; // Resetear clases del contenedor
    notificationElement.classList.add(type, 'visible'); // Añadir tipo y hacer visible
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notificationElement.classList.remove('visible');
    }, 3000);
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
        // Asegura que 'cart' sea un objeto y 'cart.items' siempre sea un array, incluso si localStorage está vacío o corrupto.
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || {};
        cart.items = Array.isArray(cart.items) ? cart.items : [];
        cart.rentalDates = cart.rentalDates || null; // Asegura que las fechas sean null si no están definidas

        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) return; // Salir si los elementos DOM clave no existen

        // Guarda el estado actual del carrito en localStorage
        const saveCart = () => localStorage.setItem('shoppingCart', JSON.stringify(cart));
        
        // Actualiza el número de ítems en el ícono del carrito en el header
        const updateCartCount = () => {
            const el = document.getElementById('cartCount');
            if (!el) return;
            // Suma la cantidad de todos los ítems en el carrito. Si cart.items es null/undefined, usa un array vacío.
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
            
            // Muestra u oculta las fechas de alquiler en el modal del carrito
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end && startDateEl && endDateEl && datesContainer) {
                startDateEl.textContent = cart.rentalDates.start;
                endDateEl.textContent = cart.rentalDates.end;
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
                    // Genera las opciones para el selector de cantidad (1 a 20)
                    let opts = Array.from({length: 20}, (_, i) => 
                        `<option value="${i + 1}" ${quantity === i + 1 ? 'selected' : ''}>${i + 1}</option>`
                    ).join('');
                    
                    cartItemsContainer.innerHTML += `
                        <div class="cart-item" data-product-id="${item.id}">
                            <div class="cart-item-details">
                                <h4>${item.name}</h4>
                                <p class="price">$${price.toFixed(2)} c/u</p>
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
            const subtotal = (cart.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
                cart.rentalDates = null; // Si el carrito se vacía, también se limpian las fechas de alquiler
            }
            saveCart();
            renderCartModal();
            updateCartCount();
            showNotification('Ítem eliminado del carrito.', 'error'); // Notificación de éxito para la eliminación
        };

        // Actualiza la cantidad de un ítem específico en el carrito.
        const updateCartItemQuantity = (id, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === id);
            if (itemInCart) {
                itemInCart.quantity = parseInt(newQuantity, 10); // Asegura que la cantidad es un número entero
                saveCart();
                renderCartModal(); // Re-render para reflejar el cambio en la cantidad y los totales
                updateCartCount();
            }
        };

        // Adjunta/Re-adjunta los event listeners a los botones de eliminar y selects de cantidad dentro del modal.
        const addCartModalEventListeners = () => {
            // Es crucial remover los listeners antiguos para evitar duplicados al re-renderizar el modal
            document.querySelectorAll('.remove-item-btn').forEach(btn => btn.removeEventListener('click', handleRemoveClick));
            document.querySelectorAll('.cart-item-quantity').forEach(select => select.removeEventListener('change', handleQuantityChange));

            // Adjuntar nuevos listeners a los elementos actuales en el DOM
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', handleRemoveClick);
            });

            document.querySelectorAll('.cart-item-quantity').forEach(select => {
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
            // Si el carrito está vacío y se proporcionan fechas, establecerlas como las fechas de alquiler del carrito
            if (cart.items.length === 0 && rentalDates) {
                cart.rentalDates = rentalDates;
            } 
            // Si ya hay ítems y las nuevas fechas son diferentes, pide confirmación para vaciar el carrito
            else if (cart.items.length > 0 && rentalDates && 
                       (cart.rentalDates.start !== rentalDates.start || cart.rentalDates.end !== rentalDates.end)) {
                if (!confirm('Has cambiado las fechas. ¿Deseas vaciar el carrito y empezar un nuevo pedido con estas nuevas fechas?')) {
                    return; // Sale si el usuario cancela
                }
                clearCart(); // Vacía el carrito
                cart.rentalDates = rentalDates; // Establece las nuevas fechas
            } 
            // Si el carrito está vacío y no hay fechas, y existen los inputs de fecha en la página, notificar
            else if (cart.items.length === 0 && !rentalDates && document.getElementById('fecha-entrega')) {
                 showNotification('Por favor, selecciona las fechas de entrega y recolección para añadir productos.', 'error');
                 return;
            } 
            // Si hay ítems y no se proporcionan fechas, asume las fechas ya establecidas en el carrito
            else if (cart.items.length > 0 && !rentalDates) {
                rentalDates = cart.rentalDates;
            }

            // Busca si el producto ya existe en el carrito
            const itemInCart = cart.items.find(item => item.id === productToAdd.id);
            if (itemInCart) {
                itemInCart.quantity += productToAdd.quantity; // Si existe, solo actualiza la cantidad
            } else {
                cart.items.push(productToAdd); // Si no, añade el nuevo producto al carrito
            }
            showNotification(`${productToAdd.name} añadido al carrito.`, 'success');
            saveCart(); // Guarda el carrito actualizado
            updateCartCount(); // Actualiza el contador visual
        };

        // Vacía completamente el carrito y resetea las fechas de alquiler.
        const clearCart = () => {
            cart = { items: [], rentalDates: null }; // Resetea el objeto carrito
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
                const quantity = parseInt(quantitySelect?.value || '1', 10); // Obtiene la cantidad o 1 por defecto

                if (isNaN(productPrice) || quantity <= 0) {
                    showNotification('Error: El precio o la cantidad del producto son inválidos.', 'error');
                    return;
                }
                
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');
                let rentalDates = null;

                if (startDateInput && endDateInput) { // Si los campos de fecha están en esta página
                    if (!startDateInput.value || !endDateInput.value) {
                        showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                        const rentalContainer = document.querySelector('.rental-dates-container');
                        if(rentalContainer) {
                            rentalContainer.classList.add('shake-animation'); // Aplica animación si existe
                            setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                        }
                        return;
                    }
                    rentalDates = { start: startDateInput.value, end: endDateInput.value };
                } 
                else if (cart.items.length === 0) { // Si no hay campos de fecha y el carrito está vacío, no se puede añadir sin fechas
                     showNotification('No se pueden añadir productos sin fechas de alquiler. Las fechas deben definirse al menos con el primer producto.', 'error');
                     return;
                } else { // Si no hay campos de fecha pero el carrito ya tiene ítems, usar las fechas existentes del carrito
                    rentalDates = cart.rentalDates;
                }

                addToCart({ id: productId, name: productName, price: productPrice, quantity: quantity }, rentalDates);
                if(quantitySelect) quantitySelect.value = ""; // Limpia la selección de cantidad después de añadir
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
                if (cart.items.length === 0) { 
                    e.preventDefault(); // Prevenir la navegación si el carrito está vacío
                    showNotification('Tu carrito está vacío. Por favor, añade productos para continuar.', 'error'); 
                } 
                // Validar que las fechas de alquiler estén presentes antes de proceder a la compra
                else if (!cart.rentalDates || !cart.rentalDates.start || !cart.rentalDates.end) {
                    e.preventDefault();
                    showNotification('Faltan las fechas de entrega y recolección. Por favor, asegúrate de haberlas seleccionado para al menos un producto.', 'error');
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

    // --- Lógica de la CALCULADORA (integrada, corregida para navegación de pasos y cálculo de resultados en pop-up) ---
    const initCalculator = () => {
        // Obtener referencias a los elementos HTML clave de la calculadora
        const steps = [
            document.getElementById("calc-step-1"),
            document.getElementById("calc-step-2"),
            document.getElementById("calc-step-3"),
        ];
        const stepIndicators = [
            document.getElementById("step-indicator-1"),
            document.getElementById("step-indicator-2"),
            document.getElementById("step-indicator-3"),
        ];
        const progressBar = document.getElementById("progressBar");
        const calculateBtn = document.getElementById("calculateBtn");
        const body = document.body; // Referencia al body para añadir el pop-up

        // *** INICIO DE LA CORRECCIÓN: Depuración más explícita para la inicialización de la calculadora ***
        // Verificamos individualmente la existencia de cada elemento clave
        if (!steps[0]) {
            console.error("Error: Elemento 'calc-step-1' no encontrado. La calculadora no se inicializará.");
            return; // Salir si el elemento es nulo
        }
        if (!progressBar) {
            console.error("Error: Elemento 'progressBar' no encontrado. La calculadora no se inicializará.");
            return; // Salir si el elemento es nulo
        }
        if (!calculateBtn) {
            console.error("Error: Elemento 'calculateBtn' no encontrado. La calculadora no se inicializará.");
            return; // Salir si el elemento es nulo
        }
        // *** FIN DE LA CORRECCIÓN ***

        let currentStep = 0; // Controla el paso actual de la calculadora (0, 1, 2)

        // Actualiza la interfaz de usuario de la calculadora: 
        // - Muestra el paso actual.
        // - Resalta el indicador de paso.
        // - Actualiza la barra de progreso.
        function updateStepUI() {
            steps.forEach((step, index) => {
                step.classList.toggle("active", index === currentStep); // Controla la visibilidad de los pasos
                stepIndicators[index].classList.toggle("active", index === currentStep); // Resalta el número de paso
            });
            // Calcula el porcentaje de avance de la barra de progreso
            progressBar.style.width = ((currentStep / (steps.length - 1)) * 100) + "%";
            
            // Ocultar cualquier modal de resultado existente cuando se avanza de paso
            const existingModal = document.getElementById('calculatorResultModalOverlay');
            if (existingModal) {
                existingModal.remove(); // Elimina el modal si ya existe y cambiamos de paso
            }
        }

        // Valida que el usuario haya hecho una selección requerida en el paso actual.
        function validateStep(stepIndex) {
            if (stepIndex === 0) { // Validación para el Paso 1 (Tipo de hogar)
                const homeType = document.querySelector('input[name="homeType"]:checked');
                if (!homeType) {
                    showNotification("Por favor, selecciona cómo es tu hogar para continuar.", 'error');
                    return false;
                }
            } else if (stepIndex === 1) { // Validación para el Paso 2 (Cantidad de cosas)
                const belongings = document.querySelector('input[name="belongings"]:checked');
                if (!belongings) {
                    showNotification("Por favor, selecciona cuántas cosas tienes para continuar.", 'error');
                    return false;
                }
            }
            return true; // Si la validación pasa, o si es el Paso 3 (no obligatorio para avanzar)
        }

        // Mueve la calculadora al siguiente paso, si el paso actual es válido.
        function goToNextStep() {
            if (!validateStep(currentStep)) return; // No avanzar si la validación falla
            if (currentStep < steps.length - 1) { // Asegura que no se exceda el último paso
                currentStep++;
                updateStepUI(); // Actualiza la interfaz al siguiente paso
            }
        }

        // Adjunta Event Listeners a los radio buttons para el avance automático de pasos.
        // Esto solo aplica a los pasos 0 y 1, que son los que tienen radios y deben avanzar al siguiente paso.
        steps.forEach((step, index) => {
            if (index === 0 || index === 1) { // Aplica listeners solo al Paso 1 y Paso 2
                const radios = step.querySelectorAll('input[type="radio"]');
                radios.forEach((radio) => {
                    radio.addEventListener("change", goToNextStep); // Llama a goToNextStep cuando se selecciona un radio
                });
            }
        });

        // Event Listener para el botón "Calcular mi Paquete" en el último paso.
        calculateBtn.addEventListener("click", () => {
            // Realiza una validación final para asegurarse de que los pasos obligatorios estén completos.
            if (!validateStep(0) || !validateStep(1)) {
                return; // Las notificaciones de error ya se mostrarán desde la función validateStep()
            }

            // Recopila los valores seleccionados por el usuario
            const homeType = document.querySelector('input[name="homeType"]:checked')?.value || "";
            const belongings = document.querySelector('input[name="belongings"]:checked')?.value || "";
            // Recopila todos los valores de los checkboxes seleccionados en el Paso 3
            const extras = Array.from(
                document.querySelectorAll('input[name="extras"]:checked')
            ).map((checkbox) => checkbox.value);

            let totalEstimatedBoxes = 0; // Variable para el total de cajas estimado
            let smallBoxes = 0;
            let mediumBoxes = 0;
            let largeBoxes = 0;
            let extraLargeBoxes = 0; 

            // --- Lógica de cálculo y desglose de cajas ---
            // Definir paquetes base según el tipo de hogar con un desglose inicial
            const packages = {
                "studio": { total: 15, small: 5, medium: 7, large: 3, extraLarge: 0 },
                "1br":    { total: 25, small: 8, medium: 12, large: 5, extraLarge: 0 },
                "2br":    { total: 40, small: 10, medium: 20, large: 10, extraLarge: 0 },
                "4br":    { total: 60, small: 15, medium: 30, large: 15, extraLarge: 0 }
            };

            let selectedPackage = packages[homeType] || { total: 0, small: 0, medium: 0, large: 0, extraLarge: 0 };
            
            smallBoxes = selectedPackage.small;
            mediumBoxes = selectedPackage.medium;
            largeBoxes = selectedPackage.large;
            extraLargeBoxes = selectedPackage.extraLarge;

            // Ajustar el desglose y el total según la cantidad de pertenencias
            if (belongings === "normal") {
                mediumBoxes += 3; 
                largeBoxes += 2;
            } else if (belongings === "many") {
                mediumBoxes += 5;
                largeBoxes += 7;
                extraLargeBoxes += 3; 
            }

            // Añadir cajas adicionales por cada espacio extra seleccionado
            if (extras.includes("office")) {
                mediumBoxes += 3;
                largeBoxes += 2;
            }
            if (extras.includes("storage")) {
                mediumBoxes += 4;
                largeBoxes += 4;
                extraLargeBoxes += 2;
            }
            if (extras.includes("garage")) {
                mediumBoxes += 5;
                largeBoxes += 7;
                extraLargeBoxes += 3;
            }

            // Asegurarse de que ninguna cantidad de cajas sea negativa
            smallBoxes = Math.max(0, smallBoxes);
            mediumBoxes = Math.max(0, mediumBoxes);
            largeBoxes = Math.max(0, largeBoxes);
            extraLargeBoxes = Math.max(0, extraLargeBoxes);
            
            // Recalcular el total exacto sumando las cajas desglosadas
            totalEstimatedBoxes = smallBoxes + mediumBoxes + largeBoxes + extraLargeBoxes; 

            // --- Fin de lógica de cálculo y desglose ---

            // Prepara el texto para los espacios adicionales seleccionados (con traducción a español)
            let extrasText = "";
            if (extras.length > 0) {
                const translatedExtras = extras.map(e => {
                    if (e === 'office') return 'Oficina / Home Office';
                    if (e === 'storage') return 'Bodega / Trastero';
                    if (e === 'garage') return 'Garaje / Estacionamiento';
                    return e; 
                });
                extrasText = `<p><strong>Espacios adicionales:</strong> ${translatedExtras.join(", ")}</p>`;
            }

            // Construir el HTML del desglose de cajas para el pop-up
            let boxesBreakdownHtml = `
                <h4>Desglose de cajas:</h4>
                <ul>
            `;
            if (smallBoxes > 0) {
                boxesBreakdownHtml += `<li>Cajas Pequeñas: <strong>${smallBoxes}</strong></li>`;
            }
            if (mediumBoxes > 0) {
                boxesBreakdownHtml += `<li>Cajas Medianas: <strong>${mediumBoxes}</strong></li>`;
            }
            if (largeBoxes > 0) {
                boxesBreakdownHtml += `<li>Cajas Grandes: <strong>${largeBoxes}</strong></li>`;
            }
            if (extraLargeBoxes > 0) {
                boxesBreakdownHtml += `<li>Cajas Extra Grandes: <strong>${extraLargeBoxes}</strong></li>`;
            }
            boxesBreakdownHtml += `</ul>`;


            // --- Creación y visualización del pop-up de resultados ---

            // Eliminar cualquier modal anterior si existe
            const existingModal = document.getElementById('calculatorResultModalOverlay');
            if (existingModal) {
                existingModal.remove();
            }

            const modalOverlay = document.createElement('div');
            modalOverlay.id = 'calculatorResultModalOverlay';
            modalOverlay.classList.add('cart-modal-overlay', 'active'); // Reutilizamos las clases CSS del carrito

            modalOverlay.innerHTML = `
                <div class="cart-modal">
                    <div class="cart-modal-header">
                        <h2>¡Tu Paquete Recomendado!</h2>
                        <button class="close-modal-btn" id="closeCalcModalBtn" title="Cerrar">&times;</button>
                    </div>
                    <div class="cart-modal-body">
                        <p>Basado en tus selecciones:</p>
                        <ul>
                            <li><strong>Tipo de hogar:</strong> ${homeType === 'studio' ? 'Estudio' : homeType === '1br' ? '1 Habitación' : homeType === '2br' ? '2-3 Habitaciones' : homeType === '4br' ? '4+ Habitaciones' : 'No especificado'}</li>
                            <li><strong>Cantidad de cosas:</strong> ${belongings === 'minimal' ? 'Pocas (Minimalista)' : belongings === 'normal' ? 'Normal' : belongings === 'many' ? 'Muchas (Coleccionista)' : 'No especificado'}</li>
                        </ul>
                        ${extrasText}
                        <p class="result-number">Total de cajas estimado: <strong>${totalEstimatedBoxes}</strong></p>
                        ${boxesBreakdownHtml}
                        <p class="modal-call-to-action">¡Contáctanos para un presupuesto más preciso o para elegir tu paquete!</p>
                    </div>
                    <div class="cart-modal-footer">
                        <a href="contacto.html" class="btn btn-primary">Contactar</a>
                    </div>
                </div>
            `;
            body.appendChild(modalOverlay); // Añadir el pop-up al body

            // Añadir event listeners para cerrar el modal
            const closeCalcModalBtn = document.getElementById('closeCalcModalBtn');
            if (closeCalcModalBtn) {
                closeCalcModalBtn.addEventListener('click', () => {
                    modalOverlay.classList.remove('active');
                    modalOverlay.remove(); // Eliminar el elemento del DOM al cerrar
                });
            }
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove('active');
                    modalOverlay.remove(); // Eliminar el elemento del DOM al hacer clic fuera
                }
            });

            // Después de calcular y mostrar el pop-up, reiniciar la calculadora visualmente al paso 1
            currentStep = 0;
            updateStepUI(); 
        });

        // Inicializa la interfaz de usuario de la calculadora al cargar la página (muestra el primer paso activo).
        updateStepUI(); 
    };

    // --- Llamadas a las funciones de inicialización (Se ejecutan cuando el DOM está listo) ---
    initGlobalElements();        // Inicializa el navbar y el año del footer
    initActiveNav();             // Marca el enlace de navegación activo
    initUserSession();           // Gestiona la sesión de usuario
    initShoppingCart();          // Inicializa toda la lógica del carrito de compras
    initProductPageElements();   // Inicializa elementos específicos de la página de productos (ej. Flatpickr)
    initCalculator();            // Inicializa la calculadora (solo si los elementos están presentes en la página)
});