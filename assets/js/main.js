/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL (VERSIÓN FINAL COMPLETA)
 * =================================================================
 */

// --- 1. FUNCIÓN GLOBAL DE NOTIFICACIÓN ---
function showNotification(message, type = 'success') {
    const notificationElement = document.getElementById('cartNotification');
    if (!notificationElement) return;
    const messageElement = notificationElement.querySelector('#notificationText');
    const iconElement = notificationElement.querySelector('.notification-icon');
    // Usar clases de FontAwesome directamente para los íconos
    const iconClassSuccess = 'fas fa-check-circle';
    const iconClassError = 'fas fa-times-circle';

    if (messageElement) messageElement.textContent = message;

    // Limpiar clases de ícono existentes y añadir la correcta
    if (iconElement) {
        iconElement.className = 'notification-icon'; // Reset class list
        if (type === 'success') {
            iconElement.classList.add(...iconClassSuccess.split(' '));
        } else if (type === 'error') {
            iconElement.classList.add(...iconClassError.split(' '));
        }
    }
    
    notificationElement.className = 'cart-notification'; // Resetear todas las clases
    notificationElement.classList.add(type, 'visible');
    
    setTimeout(() => {
        notificationElement.classList.remove('visible');
    }, 3000);
}

// --- 2. LÓGICA PRINCIPAL DEL SITIO ---
document.addEventListener('DOMContentLoaded', () => {

    // Función para inicializar elementos globales (navbar, año del footer)
    const initGlobalElements = () => {
        const navbarToggler = document.getElementById('navbarToggler');
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('active');
                navbarToggler.classList.toggle('active'); // Para cambiar el ícono del toggler
            });
        }
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    };

    // Función para marcar el enlace de navegación activo
    const initActiveNav = () => {
        const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    };

    // Función para gestionar la sesión de usuario
    const initUserSession = () => {
        const userActionsContainer = document.getElementById('navbarUserActions');
        const loginBtn = document.getElementById('loginBtn');
        const accountLink = document.getElementById('accountLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameSpan = document.getElementById('userName');
        const savedUser = JSON.parse(localStorage.getItem('greenhaulUser'));

        if (savedUser && savedUser.name) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (accountLink) accountLink.style.display = 'flex'; // Usar flex para que "Hola, [nombre]" se vea bien
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = savedUser.name.split(' ')[0]; // Mostrar solo el primer nombre
        } else {
            if (loginBtn) loginBtn.style.display = 'flex'; // Asegurarse de que el botón de login esté visible por defecto
            if (accountLink) accountLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        // Asegúrate de que el contenedor de acciones de usuario sea visible si no lo está
        if (userActionsContainer) userActionsContainer.classList.add('visible');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('greenhaulUser');
                localStorage.removeItem('shoppingCart'); // También limpiar el carrito al cerrar sesión
                alert('Has cerrado sesión.');
                // Recargar para reflejar los cambios en la UI de inmediato
                window.location.href = 'index.html'; 
            });
        }
        // Listener para el botón de login (si es necesario un login simulado)
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Evitar la navegación predeterminada del enlace
                // Simulación: establecer un usuario logueado
                localStorage.setItem('greenhaulUser', JSON.stringify({ name: 'UsuarioEjemplo' }));
                updateAuthUI(); // Llama a la función que actualiza la UI
                window.location.href = 'login.html'; // Redirige a la página de login
            });
        }
    };
    
    // Función para gestionar el carrito de compras
    const initShoppingCart = () => {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || { items: [], rentalDates: null };
        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) return;

        const saveCart = () => localStorage.setItem('shoppingCart', JSON.stringify(cart));
        
        const updateCartCount = () => {
            const el = document.getElementById('cartCount');
            if (!el) return;
            const total = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            el.textContent = total;
            el.style.display = total > 0 ? 'flex' : 'none'; // Mostrar si hay ítems, ocultar si no
        };

        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = ''; // Limpiar contenido previo
            
            const startDateEl = document.getElementById('cartStartDate');
            const endDateEl = document.getElementById('cartEndDate');
            const datesContainer = document.querySelector('.cart-rental-dates');
            
            // Mostrar u ocultar fechas de alquiler
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end && startDateEl && endDateEl && datesContainer) {
                startDateEl.textContent = cart.rentalDates.start;
                endDateEl.textContent = cart.rentalDates.end;
                datesContainer.style.display = 'block';
            } else if (datesContainer) {
                datesContainer.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.add('disabled'); // Deshabilitar si el carrito está vacío
            } else {
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.remove('disabled'); // Habilitar si hay ítems
                cart.items.forEach(item => {
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    // Generar opciones de cantidad hasta 20
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
            updateCartModalTotals();
            addCartModalEventListeners();
        };
        
        const updateCartModalTotals = () => {
            const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxes = subtotal * 0.16;
            const total = subtotal + taxes;

            const subtotalEl = document.getElementById('cartSubtotal');
            const taxesEl = document.getElementById('cartTaxes');
            const totalEl = document.getElementById('cartTotal');
            
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (taxesEl) taxesEl.textContent = `$${taxes.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        };

        const removeCartItem = (id) => {
            cart.items = cart.items.filter(item => item.id !== id);
            if (cart.items.length === 0) {
                cart.rentalDates = null; // Si el carrito está vacío, quitamos las fechas
            }
            saveCart();
            renderCartModal();
            updateCartCount();
            showNotification('Ítem eliminado del carrito.', 'error'); // Usar tipo 'error' para eliminar
        };

        const updateCartItemQuantity = (id, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === id);
            if (itemInCart) {
                itemInCart.quantity = parseInt(newQuantity, 10);
                saveCart();
                renderCartModal(); // Re-render para actualizar totales y opciones
                updateCartCount();
            }
        };

        const addCartModalEventListeners = () => {
            // Remover listeners viejos para evitar duplicados si se re-renderiza el modal
            const oldRemoveBtns = document.querySelectorAll('.remove-item-btn');
            oldRemoveBtns.forEach(btn => btn.removeEventListener('click', handleRemoveClick));
            const oldQtySelects = document.querySelectorAll('.cart-item-quantity');
            oldQtySelects.forEach(select => select.removeEventListener('change', handleQuantityChange));

            // Añadir nuevos listeners
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', handleRemoveClick);
            });

            document.querySelectorAll('.cart-item-quantity').forEach(select => {
                select.addEventListener('change', handleQuantityChange);
            });
        };

        const handleRemoveClick = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            removeCartItem(productId);
        };

        const handleQuantityChange = (e) => {
            const productId = e.target.closest('.cart-item').dataset.productId;
            updateCartItemQuantity(productId, e.target.value);
        };
        // --- FIN: FUNCIONES DEL CARRITO CORREGIDAS ---

        // Función para añadir productos al carrito
        // Nota: Asegúrate de que los productos se añaden con id, name, price y quantity.
        // Y que se pasan las fechas de alquiler al añadir el primer producto.
        const addToCart = (productToAdd, rentalDates = null) => {
            if (cart.items.length === 0 && rentalDates) {
                cart.rentalDates = rentalDates; // Establece las fechas si es el primer ítem
            } else if (cart.items.length > 0 && rentalDates && 
                       (cart.rentalDates.start !== rentalDates.start || cart.rentalDates.end !== rentalDates.end)) {
                // Si ya hay ítems y las fechas cambian, pregunta al usuario
                if (!confirm('Has cambiado las fechas. ¿Deseas vaciar el carrito y empezar un nuevo pedido?')) {
                    return; // No añadir el producto si el usuario cancela
                }
                clearCart(); // Vaciar el carrito si el usuario acepta
                cart.rentalDates = rentalDates; // Establecer nuevas fechas
            } else if (cart.items.length === 0 && !rentalDates) {
                 showNotification('Por favor, selecciona las fechas de entrega y recolección para añadir productos.', 'error');
                 return; // No añadir si no hay fechas y es el primer producto
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

        const clearCart = () => {
            cart = { items: [], rentalDates: null };
            saveCart();
            renderCartModal();
            updateCartCount();
        };

        // Event Listeners para botones de añadir al carrito (en la página de productos, si aplica)
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                // Asegúrate de que este productCard se encuentre para evitar errores
                if (!productCard) {
                    console.warn("Botón de añadir al carrito sin product-card padre.");
                    return;
                }

                const productId = productCard.dataset.productId;
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = parseFloat(productCard.dataset.productPrice);
                const quantitySelect = productCard.querySelector('.product-qty');
                const quantity = parseInt(quantitySelect?.value || '1', 10); // Default a 1 si no hay select

                if (isNaN(productPrice) || quantity <= 0) {
                    showNotification('Error al obtener los detalles del producto.', 'error');
                    return;
                }
                
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');
                let rentalDates = null;

                // Solo si los campos de fecha existen en la página
                if (startDateInput && endDateInput) {
                    if (!startDateInput.value || !endDateInput.value) {
                        showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                        const rentalContainer = document.querySelector('.rental-dates-container');
                        if(rentalContainer) {
                            rentalContainer.classList.add('shake-animation'); // Si tienes esta animación
                            setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                        }
                        return;
                    }
                    rentalDates = { start: startDateInput.value, end: endDateInput.value };
                } else if (cart.items.length === 0) {
                     // Si no hay campos de fecha y el carrito está vacío, no se puede añadir
                     showNotification('No se pueden añadir productos sin fechas de alquiler. Si no estás en la página de productos, asegúrate de que el primer producto añadido defina las fechas.', 'error');
                     return;
                } else {
                    // Si no hay campos de fecha pero el carrito ya tiene elementos, usamos las fechas existentes
                    rentalDates = cart.rentalDates;
                }


                addToCart({ id: productId, name: productName, price: productPrice, quantity: quantity }, rentalDates);
                if(quantitySelect) quantitySelect.value = ""; // Limpiar la selección de cantidad
            });
        });

        // Event listeners para el modal del carrito
        cartIcon.addEventListener('click', e => { 
            e.preventDefault(); 
            renderCartModal(); // Renderiza el carrito cada vez que se abre
            cartModalOverlay.classList.add('active'); 
        });
        closeCartModalBtn.addEventListener('click', () => cartModalOverlay.classList.remove('active'));
        cartModalOverlay.addEventListener('click', e => { 
            if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('active'); 
        });
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => { 
                if(confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                    clearCart(); 
                    showNotification('Carrito vaciado.', 'success'); 
                }
            });
        }
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => { 
                if (cart.items.length === 0) { 
                    e.preventDefault(); 
                    showNotification('Tu carrito está vacío. Por favor, añade productos para continuar.', 'error'); 
                } else if (!cart.rentalDates || !cart.rentalDates.start || !cart.rentalDates.end) {
                    e.preventDefault();
                    showNotification('Faltan las fechas de entrega y recolección. Por favor, añádelas al menos para un producto.', 'error');
                }
                saveCart(); 
            });
        }
        
        updateCartCount(); // Inicializar el conteo del carrito al cargar
        // No renderizar el modal al inicio, solo cuando se abre
    };

    // Función para inicializar elementos específicos de la página de productos (flatpickr)
    const initProductPageElements = () => {
        // Solo inicializar flatpickr si los elementos existen en el DOM
        const fechaEntregaInput = document.getElementById('fecha-entrega');
        const fechaRecoleccionInput = document.getElementById('fecha-recoleccion');

        if (typeof flatpickr !== 'undefined' && fechaEntregaInput && fechaRecoleccionInput) {
            const fechaRecoleccionPicker = flatpickr(fechaRecoleccionInput, {
                locale: "es",
                minDate: "today",
                altInput: true,
                altFormat: "F j, Y",
                dateFormat: "Y-m-d",
            });

            flatpickr(fechaEntregaInput, {
                locale: "es",
                minDate: "today",
                altInput: true,
                altFormat: "F j, Y",
                dateFormat: "Y-m-d",
                onChange: function(selectedDates, dateStr) {
                    if (fechaRecoleccionPicker) {
                        fechaRecoleccionPicker.set('minDate', dateStr);
                        // Asegurarse de que la fecha de recolección sea válida después de cambiar la de entrega
                        if (fechaRecoleccionPicker.selectedDates[0] && selectedDates[0] > fechaRecoleccionPicker.selectedDates[0]) {
                            fechaRecoleccionPicker.setDate(selectedDates[0]);
                        }
                    }
                }
            });
        }
    };

    // --- NUEVA LÓGICA DE LA CALCULADORA ---
    const initCalculator = () => {
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

        // Solo inicializar si los elementos de la calculadora están presentes
        if (!steps[0] || !progressBar || !calculateBtn || !resultContainer) {
            return;
        }

        let currentStep = 0;

        function updateStepUI() {
            steps.forEach((step, index) => {
                step.classList.toggle("active", index === currentStep);
                stepIndicators[index].classList.toggle("active", index === currentStep);
            });
            // La barra de progreso debe reflejar el progreso hacia el final del proceso de selección
            // Si hay 3 pasos (0, 1, 2), el paso 0 es 0%, el paso 1 es 50%, el paso 2 (final antes de calcular) es 100%.
            progressBar.style.width = ((currentStep / (steps.length - 1)) * 100) + "%";
            resultContainer.innerHTML = ""; // Limpia el resultado al avanzar o retroceder
        }

        function validateStep(stepIndex) {
            if (stepIndex === 0) {
                const homeType = document.querySelector('input[name="homeType"]:checked');
                if (!homeType) {
                    showNotification("Por favor, selecciona cómo es tu hogar para continuar.", 'error');
                    return false;
                }
            } else if (stepIndex === 1) {
                const belongings = document.querySelector('input[name="belongings"]:checked');
                if (!belongings) {
                    showNotification("Por favor, selecciona cuántas cosas tienes para continuar.", 'error');
                    return false;
                }
            }
            // El paso 3 (extras) no requiere validación para avanzar porque el botón "Calcular" lo maneja
            return true;
        }

        function goToNextStep() {
            if (!validateStep(currentStep)) return; // Si la validación falla, no avanzar
            if (currentStep < steps.length - 1) {
                currentStep++;
                updateStepUI();
            }
        }

        // Event Listeners para avanzar automáticamente al siguiente paso al seleccionar una opción (radio)
        steps.forEach((step, index) => {
            // Solo los primeros dos pasos (índices 0 y 1) tienen radios que avanzan automáticamente
            if (index < steps.length - 1) { 
                const radios = step.querySelectorAll('input[type="radio"]');
                radios.forEach((radio) => {
                    radio.addEventListener("change", goToNextStep); // Llama a goToNextStep al cambiar
                });
            }
        });

        // Event Listener para el botón "Calcular mi Paquete" en el último paso
        calculateBtn.addEventListener("click", () => {
            if (!validateStep(currentStep)) return; // Validar el último paso antes de calcular

            const homeType = document.querySelector('input[name="homeType"]:checked')?.value || "";
            const belongings = document.querySelector('input[name="belongings"]:checked')?.value || "";
            const extras = Array.from(
                document.querySelectorAll('input[name="extras"]:checked')
            ).map((checkbox) => checkbox.value);

            let estimatedBoxes = 0;

            // Lógica de cálculo de cajas (ajusta estos valores según tus necesidades y la complejidad)
            // Valores base según tipo de hogar
            if (homeType === "studio") {
                estimatedBoxes = 10;
            } else if (homeType === "1br") {
                estimatedBoxes = 20;
            } else if (homeType === "2br") {
                estimatedBoxes = 35; // Ajustado para un rango de 2-3 habitaciones
            } else if (homeType === "4br") {
                estimatedBoxes = 50;
            }

            // Ajustar por cantidad de cosas
            if (belongings === "normal") {
                estimatedBoxes += 5;
            } else if (belongings === "many") {
                estimatedBoxes += 15;
            }

            // Añadir cajas por espacios adicionales
            if (extras.includes("office")) estimatedBoxes += 5;
            if (extras.includes("storage")) estimatedBoxes += 10;
            if (extras.includes("garage")) estimatedBoxes += 15;

            // Asegurarse de que el número de cajas no sea negativo o cero si los valores base son muy bajos
            estimatedBoxes = Math.max(estimatedBoxes, 5); // Mínimo de 5 cajas, por ejemplo

            let extrasText = "";
            if (extras.length > 0) {
                // Mapear los valores de los extras a un texto más amigable
                const translatedExtras = extras.map(e => {
                    if (e === 'office') return 'Oficina / Home Office';
                    if (e === 'storage') return 'Bodega / Trastero';
                    if (e === 'garage') return 'Garaje / Estacionamiento';
                    return e; // En caso de un valor no reconocido
                });
                extrasText = `<p><strong>Espacios adicionales:</strong> ${translatedExtras.join(", ")}</p>`;
            }

            resultContainer.innerHTML = `
                <h3>¡Estimación de Cajas!</h3>
                <p>Basado en tus selecciones:</p>
                <ul>
                    <li><strong>Tipo de hogar:</strong> ${homeType === 'studio' ? 'Estudio' : homeType === '1br' ? '1 Habitación' : homeType === '2br' ? '2-3 Habitaciones' : homeType === '4br' ? '4+ Habitaciones' : ''}</li>
                    <li><strong>Cantidad de cosas:</strong> ${belongings === 'minimal' ? 'Pocas (Minimalista)' : belongings === 'normal' ? 'Normal' : belongings === 'many' ? 'Muchas (Coleccionista)' : ''}</li>
                </ul>
                ${extrasText}
                <p class="result-number">Necesitarás aproximadamente: <strong>${estimatedBoxes} cajas</strong></p>
                <p>¡Contáctanos para un presupuesto más preciso o para elegir tu paquete!</p>
                <a href="contacto.html" class="btn btn-primary">Contactar</a>
            `;

            // Opcional: Para una mejor UX, podríamos llevar al usuario de vuelta al primer paso
            // o simplemente dejar el resultado visible hasta que seleccione algo de nuevo.
            // Para reiniciar la calculadora completamente:
            currentStep = 0;
            updateStepUI(); // Esto resetea la visualización para una nueva consulta
        });

        // Inicializa la UI de la calculadora al cargar la página
        updateStepUI(); 
    };
    // --- FIN: NUEVA LÓGICA DE LA CALCULADORA ---


    // --- Llamadas a las funciones de inicialización ---
    // Asegúrate de que estas llamadas se hagan después de definir todas las funciones.
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements(); // Solo se ejecutará si los elementos de fechas existen
    initCalculator(); // ¡Esta es la que faltaba y solucionará el problema de la calculadora!
});