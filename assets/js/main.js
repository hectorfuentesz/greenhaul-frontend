/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL (VERSIÓN FINAL COMPLETA)
 * =================================================================
 */

// --- 1. FUNCIÓN GLOBAL DE NOTIFICACIÓN ---
function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('cartNotification');
    if (!notificationElement) return; // Asegurarse de que el elemento existe
    
    const messageElement = notificationElement.querySelector('#notificationText');
    const iconElement = notificationElement.querySelector('.notification-icon');
    
    // Clases de FontAwesome para los íconos de notificación
    const iconClassSuccess = 'fas fa-check-circle';
    const iconClassError = 'fas fa-times-circle';

    if (messageElement) {
        messageElement.textContent = message;
    }

    if (iconElement) {
        // Reiniciar clases de ícono y añadir la correcta
        iconElement.className = 'notification-icon'; 
        if (type === 'success') {
            iconElement.classList.add(...iconClassSuccess.split(' '));
        } else if (type === 'error') {
            iconElement.classList.add(...iconClassError.split(' '));
        }
    }
    
    // Reiniciar clases del contenedor de notificación y añadir las de estado
    notificationElement.className = 'cart-notification'; 
    notificationElement.classList.add(type, 'visible');
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notificationElement.classList.remove('visible');
    }, 3000);
}

// --- 2. LÓGICA PRINCIPAL DEL SITIO (se ejecuta cuando el DOM está completamente cargado) ---
document.addEventListener('DOMContentLoaded', () => {

    // Inicializa elementos globales como el menú de navegación y el año del footer
    const initGlobalElements = () => {
        const navbarToggler = document.getElementById('navbarToggler');
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('active');
                navbarToggler.classList.toggle('active'); // Para animar el ícono del toggler
            });
        }
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    };

    // Marca el enlace de navegación activo basado en la URL actual
    const initActiveNav = () => {
        const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Obtiene el nombre del archivo actual
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active'); // Añadir clase 'active' al enlace actual
            } else {
                link.classList.remove('active'); // Remover clase 'active' de otros enlaces
            }
        });
    };

    // Gestiona el estado de la sesión de usuario (botón de login/logout/nombre de usuario)
    const initUserSession = () => {
        const userActionsContainer = document.getElementById('navbarUserActions');
        const loginBtn = document.getElementById('loginBtn');
        const accountLink = document.getElementById('accountLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameSpan = document.getElementById('userName');
        // Recuperar información de usuario del almacenamiento local
        const savedUser = JSON.parse(localStorage.getItem('greenhaulUser'));

        if (savedUser && savedUser.name) {
            // Si hay un usuario logueado, ocultar login y mostrar información de cuenta
            if (loginBtn) loginBtn.style.display = 'none';
            if (accountLink) accountLink.style.display = 'flex'; // Usar flex para alineación
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = savedUser.name.split(' ')[0]; // Mostrar solo el primer nombre
        } else {
            // Si no hay usuario logueado, mostrar el botón de login y ocultar el resto
            if (loginBtn) loginBtn.style.display = 'flex'; // Asegurar que sea visible
            if (accountLink) accountLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        // Asegurar que el contenedor de acciones de usuario sea visible
        if (userActionsContainer) userActionsContainer.classList.add('visible');

        // Listener para el botón de cerrar sesión
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('greenhaulUser'); // Eliminar usuario
                localStorage.removeItem('shoppingCart'); // Limpiar carrito al cerrar sesión
                alert('Has cerrado sesión.');
                window.location.href = 'index.html'; // Redirigir a la página de inicio
            });
        }
        
        // Listener para el botón de iniciar sesión
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Simulación de inicio de sesión: guardar un usuario de ejemplo
                localStorage.setItem('greenhaulUser', JSON.stringify({ name: 'UsuarioEjemplo' }));
                window.location.href = 'login.html'; // Redirigir a la página de login
            });
        }
    };
    
    // Gestiona toda la lógica del carrito de compras (añadir, eliminar, actualizar, modal)
    const initShoppingCart = () => {
        // Inicialización robusta del carrito para evitar 'undefined' en 'items'
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || {};
        cart.items = Array.isArray(cart.items) ? cart.items : [];
        cart.rentalDates = cart.rentalDates || null;

        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) return; // Salir si elementos clave no existen

        const saveCart = () => localStorage.setItem('shoppingCart', JSON.stringify(cart));
        
        // Actualiza el contador de ítems en el ícono del carrito
        const updateCartCount = () => {
            const el = document.getElementById('cartCount');
            if (!el) return;
            // Usar (cart.items || []) para asegurar que reduce siempre se llama en un array
            const total = (cart.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
            el.textContent = total;
            el.style.display = total > 0 ? 'flex' : 'none'; // Mostrar si hay ítems
        };

        // Renderiza el contenido del modal del carrito
        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = ''; // Limpiar contenido previo
            
            const startDateEl = document.getElementById('cartStartDate');
            const endDateEl = document.getElementById('cartEndDate');
            const datesContainer = document.querySelector('.cart-rental-dates');
            
            // Mostrar u ocultar las fechas de alquiler en el modal
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end && startDateEl && endDateEl && datesContainer) {
                startDateEl.textContent = cart.rentalDates.start;
                endDateEl.textContent = cart.rentalDates.end;
                datesContainer.style.display = 'block';
            } else if (datesContainer) {
                datesContainer.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.add('disabled'); // Deshabilitar si está vacío
            } else {
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.remove('disabled'); // Habilitar si hay ítems
                cart.items.forEach(item => {
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    // Genera opciones para el selector de cantidad (1 a 20)
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
            updateCartModalTotals(); // Actualizar totales después de renderizar ítems
            addCartModalEventListeners(); // Re-adjuntar listeners a los nuevos elementos del carrito
        };
        
        // Actualiza los subtotales, impuestos y total en el modal del carrito
        const updateCartModalTotals = () => {
            // Usar (cart.items || []) para asegurar que reduce siempre se llama en un array
            const subtotal = (cart.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxes = subtotal * 0.16;
            const total = subtotal + taxes;

            const subtotalEl = document.getElementById('cartSubtotal');
            const taxesEl = document.getElementById('cartTaxes');
            const totalEl = document.getElementById('cartTotal');
            
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (taxesEl) taxesEl.textContent = `$${taxes.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        };

        // Elimina un ítem del carrito
        const removeCartItem = (id) => {
            cart.items = cart.items.filter(item => item.id !== id);
            if (cart.items.length === 0) {
                cart.rentalDates = null; // Si el carrito está vacío, se limpian las fechas
            }
            saveCart();
            renderCartModal();
            updateCartCount();
            showNotification('Ítem eliminado del carrito.', 'error');
        };

        // Actualiza la cantidad de un ítem en el carrito
        const updateCartItemQuantity = (id, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === id);
            if (itemInCart) {
                itemInCart.quantity = parseInt(newQuantity, 10);
                saveCart();
                renderCartModal(); // Re-render para actualizar totales y opciones
                updateCartCount();
            }
        };

        // Adjunta/Re-adjunta listeners a los botones y selects dentro del modal del carrito
        const addCartModalEventListeners = () => {
            // Remover listeners existentes para evitar duplicados al re-renderizar el modal
            document.querySelectorAll('.remove-item-btn').forEach(btn => btn.removeEventListener('click', handleRemoveClick));
            document.querySelectorAll('.cart-item-quantity').forEach(select => select.removeEventListener('change', handleQuantityChange));

            // Adjuntar nuevos listeners
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', handleRemoveClick);
            });

            document.querySelectorAll('.cart-item-quantity').forEach(select => {
                select.addEventListener('change', handleQuantityChange);
            });
        };

        // Handler para el evento de clic en el botón de eliminar
        const handleRemoveClick = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            removeCartItem(productId);
        };

        // Handler para el evento de cambio en la cantidad de un ítem
        const handleQuantityChange = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            updateCartItemQuantity(productId, e.target.value);
        };

        // Añade un producto al carrito
        const addToCart = (productToAdd, rentalDates = null) => {
            // Si el carrito está vacío y se proporcionan fechas, establecerlas
            if (cart.items.length === 0 && rentalDates) {
                cart.rentalDates = rentalDates;
            } 
            // Si ya hay ítems y las fechas cambian, preguntar al usuario
            else if (cart.items.length > 0 && rentalDates && 
                       (cart.rentalDates.start !== rentalDates.start || cart.rentalDates.end !== rentalDates.end)) {
                if (!confirm('Has cambiado las fechas. ¿Deseas vaciar el carrito y empezar un nuevo pedido?')) {
                    return; // No añadir el producto si el usuario cancela
                }
                clearCart(); // Vaciar el carrito si el usuario acepta
                cart.rentalDates = rentalDates; // Establecer nuevas fechas
            } 
            // Si el carrito está vacío y no hay fechas (y los inputs de fecha existen), notificar
            else if (cart.items.length === 0 && !rentalDates && document.getElementById('fecha-entrega')) {
                 showNotification('Por favor, selecciona las fechas de entrega y recolección para añadir productos.', 'error');
                 return;
            } else if (cart.items.length > 0 && !rentalDates) {
                // Si ya hay ítems en el carrito pero el addToCart se llama sin fechas, usar las fechas existentes del carrito
                rentalDates = cart.rentalDates;
            }


            const itemInCart = cart.items.find(item => item.id === productToAdd.id);
            if (itemInCart) {
                itemInCart.quantity += productToAdd.quantity;
            } else {
                cart.items.push(productToAdd);
            }
            showNotification(`${productToAdd.name} añadido al carrito.`, 'success');
            saveCart();
            updateCartCount();
        };

        // Vacía completamente el carrito
        const clearCart = () => {
            cart = { items: [], rentalDates: null };
            saveCart();
            renderCartModal();
            updateCartCount();
        };

        // Event Listeners para los botones de añadir al carrito (ej. en la página de productos)
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                if (!productCard) {
                    console.warn("Botón de añadir al carrito sin 'product-card' padre. Verifica la estructura HTML.");
                    return;
                }

                const productId = productCard.dataset.productId;
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = parseFloat(productCard.dataset.productPrice);
                const quantitySelect = productCard.querySelector('.product-qty');
                const quantity = parseInt(quantitySelect?.value || '1', 10); // Valor por defecto 1

                if (isNaN(productPrice) || quantity <= 0) {
                    showNotification('Error: precio o cantidad de producto inválido.', 'error');
                    return;
                }
                
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');
                let rentalDates = null;

                // Capturar fechas solo si los inputs existen en la página
                if (startDateInput && endDateInput) {
                    if (!startDateInput.value || !endDateInput.value) {
                        showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                        const rentalContainer = document.querySelector('.rental-dates-container');
                        if(rentalContainer) {
                            // Si tienes una animación de "sacudir", actívala
                            rentalContainer.classList.add('shake-animation');
                            setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                        }
                        return;
                    }
                    rentalDates = { start: startDateInput.value, end: endDateInput.value };
                } 
                // Si no hay inputs de fecha y el carrito está vacío, no se puede añadir sin fechas
                else if (cart.items.length === 0) {
                     showNotification('No se pueden añadir productos sin fechas de alquiler. Las fechas deben definirse al menos con el primer producto añadido.', 'error');
                     return;
                } else {
                    // Si no hay inputs de fecha pero el carrito ya tiene elementos, usar las fechas existentes del carrito
                    rentalDates = cart.rentalDates;
                }

                addToCart({ id: productId, name: productName, price: productPrice, quantity: quantity }, rentalDates);
                if(quantitySelect) quantitySelect.value = ""; // Limpiar la selección de cantidad
            });
        });

        // Event listeners para abrir/cerrar el modal del carrito
        cartIcon.addEventListener('click', e => { 
            e.preventDefault(); 
            renderCartModal(); // Renderiza el carrito cada vez que se abre para asegurar la frescura de los datos
            cartModalOverlay.classList.add('active'); 
        });
        closeCartModalBtn.addEventListener('click', () => cartModalOverlay.classList.remove('active'));
        cartModalOverlay.addEventListener('click', e => { 
            if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('active'); 
        });

        // Event listener para vaciar el carrito
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => { 
                if(confirm('¿Estás seguro de que quieres vaciar el carrito? Esta acción no se puede deshacer.')) {
                    clearCart(); 
                    showNotification('Carrito vaciado.', 'success'); 
                }
            });
        }
        
        // Event listener para proceder a la compra
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => { 
                if (cart.items.length === 0) { 
                    e.preventDefault(); // Prevenir la navegación si el carrito está vacío
                    showNotification('Tu carrito está vacío. Por favor, añade productos para continuar.', 'error'); 
                } 
                // Validar que las fechas de alquiler estén presentes antes de proceder
                else if (!cart.rentalDates || !cart.rentalDates.start || !cart.rentalDates.end) {
                    e.preventDefault();
                    showNotification('Faltan las fechas de entrega y recolección. Por favor, asegúrate de haberlas seleccionado.', 'error');
                }
                saveCart(); // Asegurarse de que el carrito esté guardado antes de la navegación
            });
        }
        
        updateCartCount(); // Inicializa el conteo del carrito al cargar la página
    };

    // Inicializa elementos específicos para la página de productos (ej. date pickers con Flatpickr)
    const initProductPageElements = () => {
        const fechaEntregaInput = document.getElementById('fecha-entrega');
        const fechaRecoleccionInput = document.getElementById('fecha-recoleccion');

        // Solo inicializar Flatpickr si los elementos de input existen y la librería está cargada
        if (typeof flatpickr !== 'undefined' && fechaEntregaInput && fechaRecoleccionInput) {
            const fechaRecoleccionPicker = flatpickr(fechaRecoleccionInput, {
                locale: "es", // Establecer idioma español
                minDate: "today", // Fecha mínima es hoy
                altInput: true, // Habilitar un input alternativo para formato de fecha amigable
                altFormat: "F j, Y", // Formato de fecha alternativa (ej. Julio 15, 2025)
                dateFormat: "Y-m-d", // Formato de fecha real para el valor del input
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

    // --- Lógica de la CALCULADORA (integrada y corregida para la navegación de pasos y cálculo) ---
    const initCalculator = () => {
        // Obtener referencias a los elementos HTML de la calculadora
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
        const resultContainer = document.getElementById("calculatorResult");

        // Salir si no se encuentran todos los elementos esenciales de la calculadora en la página actual
        if (!steps[0] || !progressBar || !calculateBtn || !resultContainer) {
            console.log("Elementos de la calculadora no encontrados. 'initCalculator' no se inicializará.");
            return; 
        }

        let currentStep = 0; // Variable para controlar el paso actual de la calculadora

        // Actualiza la interfaz de usuario de la calculadora (pasos visibles, indicadores, barra de progreso)
        function updateStepUI() {
            steps.forEach((step, index) => {
                step.classList.toggle("active", index === currentStep); // Activa/desactiva la visibilidad del paso
                stepIndicators[index].classList.toggle("active", index === currentStep); // Activa/desactiva el indicador de paso
            });
            // Calcula y actualiza el ancho de la barra de progreso
            progressBar.style.width = ((currentStep / (steps.length - 1)) * 100) + "%";
            // Limpia el contenedor de resultados si se cambia de paso y ya había un resultado visible
            if (resultContainer.innerHTML !== "" && currentStep !== steps.length - 1) { 
                 resultContainer.innerHTML = ""; 
            }
        }

        // Valida que se haya seleccionado una opción en el paso actual antes de avanzar o calcular
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

        // Avanza la calculadora al siguiente paso si la validación del paso actual es exitosa
        function goToNextStep() {
            if (!validateStep(currentStep)) return; // No avanzar si la validación falla
            if (currentStep < steps.length - 1) { // Asegurarse de no exceder el número de pasos
                currentStep++;
                updateStepUI(); // Actualizar la UI para mostrar el siguiente paso
            }
        }

        // Adjuntar Event Listeners para el avance automático de pasos (solo para radio buttons)
        steps.forEach((step, index) => {
            // Solo los pasos 0 y 1 tienen radio buttons que deben avanzar automáticamente
            if (index === 0 || index === 1) { 
                const radios = step.querySelectorAll('input[type="radio"]');
                radios.forEach((radio) => {
                    radio.addEventListener("change", goToNextStep); // Al cambiar la selección, ir al siguiente paso
                });
            }
        });

        // Event Listener para el botón "Calcular mi Paquete" en el último paso
        calculateBtn.addEventListener("click", () => {
            // Validar que los pasos 0 y 1 (obligatorios) estén completos antes de calcular
            if (!validateStep(0) || !validateStep(1)) {
                return; // Las notificaciones de error se mostrarán desde validateStep()
            }

            // Recopilar las selecciones del usuario
            const homeType = document.querySelector('input[name="homeType"]:checked')?.value || "";
            const belongings = document.querySelector('input[name="belongings"]:checked')?.value || "";
            // Obtener todos los valores de checkboxes seleccionados
            const extras = Array.from(
                document.querySelectorAll('input[name="extras"]:checked')
            ).map((checkbox) => checkbox.value);

            let estimatedBoxes = 0;

            // --- Lógica de cálculo de cajas (AJUSTA ESTOS VALORES según tus paquetes y lógica de negocio) ---
            // Valores base según el tipo de hogar
            if (homeType === "studio") {
                estimatedBoxes = 8; // Ejemplo: 8 cajas base para un estudio
            } else if (homeType === "1br") {
                estimatedBoxes = 15; // Ejemplo: 15 cajas base para 1 habitación
            } else if (homeType === "2br") {
                estimatedBoxes = 25; // Ejemplo: 25 cajas base para 2-3 habitaciones
            } else if (homeType === "4br") {
                estimatedBoxes = 40; // Ejemplo: 40 cajas base para 4+ habitaciones
            }

            // Ajustar la estimación según la cantidad de pertenencias
            if (belongings === "normal") {
                estimatedBoxes += 5; // Añadir 5 cajas si la cantidad de cosas es "normal"
            } else if (belongings === "many") {
                estimatedBoxes += 15; // Añadir 15 cajas si la cantidad de cosas es "muchas"
            }

            // Añadir cajas adicionales si se seleccionan espacios extra
            if (extras.includes("office")) estimatedBoxes += 5; // +5 cajas por una oficina
            if (extras.includes("storage")) estimatedBoxes += 10; // +10 cajas por una bodega/trastero
            if (extras.includes("garage")) estimatedBoxes += 15; // +15 cajas por un garaje

            // Asegurarse de que el número estimado de cajas sea al menos un valor mínimo (ej. 5)
            estimatedBoxes = Math.max(estimatedBoxes, 5); 

            // Construir el texto para los espacios adicionales
            let extrasText = "";
            if (extras.length > 0) {
                // Traducir los valores internos de 'extras' a un texto más legible en español
                const translatedExtras = extras.map(e => {
                    if (e === 'office') return 'Oficina / Home Office';
                    if (e === 'storage') return 'Bodega / Trastero';
                    if (e === 'garage') return 'Garaje / Estacionamiento';
                    return e; // Fallback por si hay un valor no reconocido
                });
                extrasText = `<p><strong>Espacios adicionales:</strong> ${translatedExtras.join(", ")}</p>`;
            }

            // --- Muestra el resultado final en el contenedor de resultados ---
            resultContainer.innerHTML = `
                <h3>¡Estimación de Cajas!</h3>
                <p>Basado en tus selecciones:</p>
                <ul>
                    <li><strong>Tipo de hogar:</strong> ${homeType === 'studio' ? 'Estudio' : homeType === '1br' ? '1 Habitación' : homeType === '2br' ? '2-3 Habitaciones' : homeType === '4br' ? '4+ Habitaciones' : 'No especificado'}</li>
                    <li><strong>Cantidad de cosas:</strong> ${belongings === 'minimal' ? 'Pocas (Minimalista)' : belongings === 'normal' ? 'Normal' : belongings === 'many' ? 'Muchas (Coleccionista)' : 'No especificado'}</li>
                </ul>
                ${extrasText}
                <p class="result-number">Necesitarás aproximadamente: <strong>${estimatedBoxes} cajas</strong></p>
                <p>¡Contáctanos para un presupuesto más preciso o para elegir tu paquete!</p>
                <a href="contacto.html" class="btn btn-primary">Contactar</a>
            `;

            // Reiniciar la calculadora a la visualización del primer paso después de mostrar el resultado
            // Esto la prepara para una nueva consulta.
            currentStep = 0;
            updateStepUI(); 
        });

        // Inicializa la UI de la calculadora al cargar la página (asegura que el primer paso esté activo visualmente)
        updateStepUI(); 
    };
    // --- FIN: Lógica de la CALCULADORA ---


    // --- Llamadas a las funciones de inicialización (se ejecutan una vez que el DOM está listo) ---
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements(); // Se inicializa solo si los elementos de fecha están presentes
    initCalculator(); // Se inicializa solo si los elementos de la calculadora están presentes
});