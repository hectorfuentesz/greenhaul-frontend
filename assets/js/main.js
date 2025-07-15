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
    const iconClassSuccess = 'fas fa-check-circle';
    const iconClassError = 'fas fa-times-circle';

    if (messageElement) messageElement.textContent = message;

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

    const initGlobalElements = () => {
        const navbarToggler = document.getElementById('navbarToggler');
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('active');
                navbarToggler.classList.toggle('active');
            });
        }
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    };

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

    const initUserSession = () => {
        const userActionsContainer = document.getElementById('navbarUserActions');
        const loginBtn = document.getElementById('loginBtn');
        const accountLink = document.getElementById('accountLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameSpan = document.getElementById('userName');
        const savedUser = JSON.parse(localStorage.getItem('greenhaulUser'));

        if (savedUser && savedUser.name) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (accountLink) accountLink.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = savedUser.name.split(' ')[0];
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (accountLink) accountLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        if (userActionsContainer) userActionsContainer.classList.add('visible');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('greenhaulUser');
                localStorage.removeItem('shoppingCart');
                alert('Has cerrado sesión.');
                window.location.href = 'index.html';
            });
        }
        
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('greenhaulUser', JSON.stringify({ name: 'UsuarioEjemplo' }));
                window.location.href = 'login.html'; 
            });
        }
    };
    
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
            el.style.display = total > 0 ? 'flex' : 'none';
        };

        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = '';
            
            const startDateEl = document.getElementById('cartStartDate');
            const endDateEl = document.getElementById('cartEndDate');
            const datesContainer = document.querySelector('.cart-rental-dates');
            
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end && startDateEl && endDateEl && datesContainer) {
                startDateEl.textContent = cart.rentalDates.start;
                endDateEl.textContent = cart.rentalDates.end;
                datesContainer.style.display = 'block';
            } else if (datesContainer) {
                datesContainer.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.add('disabled');
            } else {
                if (proceedToCheckoutBtn) proceedToCheckoutBtn.classList.remove('disabled');
                cart.items.forEach(item => {
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    let opts = Array.from({length: 20}, (_, i) => `<option value="${i + 1}" ${quantity === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('');
                    
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
                cart.rentalDates = null;
            }
            saveCart();
            renderCartModal();
            updateCartCount();
            showNotification('Ítem eliminado del carrito.', 'error');
        };

        const updateCartItemQuantity = (id, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === id);
            if (itemInCart) {
                itemInCart.quantity = parseInt(newQuantity, 10);
                saveCart();
                renderCartModal();
                updateCartCount();
            }
        };

        const addCartModalEventListeners = () => {
            const oldRemoveBtns = document.querySelectorAll('.remove-item-btn');
            oldRemoveBtns.forEach(btn => btn.removeEventListener('click', handleRemoveClick));
            const oldQtySelects = document.querySelectorAll('.cart-item-quantity');
            oldQtySelects.forEach(select => select.removeEventListener('change', handleQuantityChange));

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

        const addToCart = (productToAdd, rentalDates = null) => {
            if (cart.items.length === 0 && rentalDates) {
                cart.rentalDates = rentalDates;
            } else if (cart.items.length > 0 && rentalDates && 
                       (cart.rentalDates.start !== rentalDates.start || cart.rentalDates.end !== rentalDates.end)) {
                if (!confirm('Has cambiado las fechas. ¿Deseas vaciar el carrito y empezar un nuevo pedido?')) {
                    return;
                }
                clearCart();
                cart.rentalDates = rentalDates;
            } else if (cart.items.length === 0 && !rentalDates) {
                 showNotification('Por favor, selecciona las fechas de entrega y recolección para añadir productos.', 'error');
                 return;
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

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                if (!productCard) {
                    console.warn("Botón de añadir al carrito sin product-card padre.");
                    return;
                }

                const productId = productCard.dataset.productId;
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = parseFloat(productCard.dataset.productPrice);
                const quantitySelect = productCard.querySelector('.product-qty');
                const quantity = parseInt(quantitySelect?.value || '1', 10);

                if (isNaN(productPrice) || quantity <= 0) {
                    showNotification('Error al obtener los detalles del producto.', 'error');
                    return;
                }
                
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');
                let rentalDates = null;

                if (startDateInput && endDateInput) {
                    if (!startDateInput.value || !endDateInput.value) {
                        showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                        const rentalContainer = document.querySelector('.rental-dates-container');
                        if(rentalContainer) {
                            rentalContainer.classList.add('shake-animation');
                            setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                        }
                        return;
                    }
                    rentalDates = { start: startDateInput.value, end: endDateInput.value };
                } else if (cart.items.length === 0) {
                     showNotification('No se pueden añadir productos sin fechas de alquiler. Si no estás en la página de productos, asegúrate de que el primer producto añadido defina las fechas.', 'error');
                     return;
                } else {
                    rentalDates = cart.rentalDates;
                }

                addToCart({ id: productId, name: productName, price: productPrice, quantity: quantity }, rentalDates);
                if(quantitySelect) quantitySelect.value = "";
            });
        });

        cartIcon.addEventListener('click', e => { 
            e.preventDefault(); 
            renderCartModal();
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
        
        updateCartCount();
    };

    const initProductPageElements = () => {
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
                        if (fechaRecoleccionPicker.selectedDates[0] && selectedDates[0] > fechaRecoleccionPicker.selectedDates[0]) {
                            fechaRecoleccionPicker.setDate(selectedDates[0]);
                        }
                    }
                }
            });
        }
    };

    // --- Lógica de la CALCULADORA (integrada y corregida) ---
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

        if (!steps[0] || !progressBar || !calculateBtn || !resultContainer) {
            console.log("Elementos de la calculadora no encontrados. No se inicializará.");
            return; 
        }

        let currentStep = 0;

        function updateStepUI() {
            steps.forEach((step, index) => {
                step.classList.toggle("active", index === currentStep);
                stepIndicators[index].classList.toggle("active", index === currentStep);
            });
            progressBar.style.width = ((currentStep / (steps.length - 1)) * 100) + "%";
            // Si el resultado está visible y cambiamos de paso (no estamos en el último paso), lo limpiamos.
            if (resultContainer.innerHTML !== "" && currentStep !== steps.length - 1) { 
                 resultContainer.innerHTML = ""; 
            }
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
            return true;
        }

        function goToNextStep() {
            if (!validateStep(currentStep)) return; 
            if (currentStep < steps.length - 1) {
                currentStep++;
                updateStepUI();
            }
        }

        // Event Listeners para avanzar automáticamente al siguiente paso al seleccionar una opción (radio)
        steps.forEach((step, index) => {
            if (index === 0 || index === 1) { 
                const radios = step.querySelectorAll('input[type="radio"]');
                radios.forEach((radio) => {
                    radio.addEventListener("change", goToNextStep); 
                });
            }
        });

        // Event Listener para el botón "Calcular mi Paquete" en el último paso
        calculateBtn.addEventListener("click", () => {
            if (!validateStep(0) || !validateStep(1)) {
                return; 
            }

            const homeType = document.querySelector('input[name="homeType"]:checked')?.value || "";
            const belongings = document.querySelector('input[name="belongings"]:checked')?.value || "";
            const extras = Array.from(
                document.querySelectorAll('input[name="extras"]:checked')
            ).map((checkbox) => checkbox.value);

            let estimatedBoxes = 0;

            // --- Lógica de cálculo de cajas (¡Ajusta estos valores a tus necesidades reales!) ---
            if (homeType === "studio") {
                estimatedBoxes = 8;
            } else if (homeType === "1br") {
                estimatedBoxes = 15;
            } else if (homeType === "2br") {
                estimatedBoxes = 25;
            } else if (homeType === "4br") {
                estimatedBoxes = 40;
            }

            if (belongings === "normal") {
                estimatedBoxes += 5;
            } else if (belongings === "many") {
                estimatedBoxes += 15;
            }

            if (extras.includes("office")) estimatedBoxes += 5;
            if (extras.includes("storage")) estimatedBoxes += 10;
            if (extras.includes("garage")) estimatedBoxes += 15;

            estimatedBoxes = Math.max(estimatedBoxes, 5); 

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

            currentStep = 0;
            updateStepUI(); 
        });

        updateStepUI(); 
    };

    // --- Llamadas a las funciones de inicialización ---
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements();
    initCalculator();
});