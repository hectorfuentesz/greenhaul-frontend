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
    const svgSuccess = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M5 13l4 4L19 7"/></svg>';
    const svgError = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    const svgWarning = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 15.5h3v-3h-3v3zm0-4.5h3V7h-3v6z"/></svg>';

    let iconSVGContent = svgSuccess;
    if (type === 'error') iconSVGContent = svgError;
    if (type === 'warning') iconSVGContent = svgWarning;
    
    if (messageElement) messageElement.textContent = message;
    if (iconElement) iconElement.innerHTML = iconSVGContent;

    notificationElement.className = 'cart-notification';
    notificationElement.classList.add(type, 'visible');

    setTimeout(() => {
        notificationElement.classList.remove('visible');
    }, 3000);
}


// --- 2. LÓGICA PRINCIPAL DEL SITIO ---
document.addEventListener('DOMContentLoaded', () => {

    /**
     * ===============================================
     * MÓDULO DE NAVBAR Y ELEMENTOS GLOBALES
     * ===============================================
     */
    const initGlobalElements = () => {
        const navbarToggler = document.getElementById('navbarToggler');
        const navbarCollapse = document.getElementById('navbarCollapse');
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('active');
                navbarToggler.classList.toggle('active');
                document.body.classList.toggle('no-scroll');
            });
        }

        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    };

    /**
     * ===============================================
     * MÓDULO DE NAVEGACIÓN ACTIVA (MENÚ)
     * ===============================================
     */
    const initActiveNav = () => {
        const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
        const currentPath = window.location.pathname;

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            link.classList.remove('active');
            if (linkPath === currentPath || (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
                link.classList.add('active');
            }
        });
    };

    /**
     * ===============================================
     * MÓDULO DE SESIÓN DE USUARIO
     * ===============================================
     */
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
            if (userNameSpan) userNameSpan.textContent = savedUser.name;
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (accountLink) accountLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
        
        if (userActionsContainer) {
            userActionsContainer.classList.add('visible');
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('ecoboxUser');
                showNotification('Has cerrado sesión.', 'warning');
                setTimeout(() => window.location.href = 'index.html', 1500);
            });
        }
    };
    
    /**
     * ===============================================
     * MÓDULO DEL CARRITO DE COMPRAS (COMPLETO Y CORREGIDO)
     * ===============================================
     */
     const initShoppingCart = () => {
        let cart = [];

        // Selectores de elementos del DOM
        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        // --- FUNCIONES INTERNAS DEL CARRITO ---

        const saveCart = () => {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
        };
        
        const updateCartCount = () => {
            const cartCountEl = document.getElementById('cartCount');
            if (!cartCountEl) return;
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
        };

        const updateCartModalTotals = () => {
            const subtotalEl = document.getElementById('cartSubtotal');
            const taxesEl = document.getElementById('cartTaxes');
            const totalEl = document.getElementById('cartTotal');
            if (!subtotalEl || !taxesEl || !totalEl) return;

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxes = subtotal * 0.16;
            const total = subtotal + taxes;

            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            taxesEl.textContent = `$${taxes.toFixed(2)}`;
            totalEl.textContent = `$${total.toFixed(2)}`;
        };

        const removeCartItem = (productId) => {
            cart = cart.filter(item => item.id !== productId);
            saveCart();
            renderCartModal();
            updateCartCount();
        };

        const updateCartItemQuantity = (productId, newQuantity) => {
            const itemInCart = cart.find(item => item.id === productId);
            if (itemInCart) {
                itemInCart.quantity = newQuantity;
                saveCart();
                renderCartModal();
                updateCartCount();
            }
        };

        const addCartModalEventListeners = () => {
            if (!cartItemsContainer) return;

            const removeButtons = cartItemsContainer.querySelectorAll('.remove-item-btn');
            removeButtons.forEach(button => {
                button.onclick = (e) => {
                    const productId = e.target.closest('.cart-item').dataset.productId;
                    removeCartItem(productId);
                };
            });

            const quantitySelects = cartItemsContainer.querySelectorAll('.cart-item-quantity');
            quantitySelects.forEach(select => {
                select.onchange = (e) => {
                    const productId = e.target.closest('.cart-item').dataset.productId;
                    const newQuantity = parseInt(e.target.value, 10);
                    updateCartItemQuantity(productId, newQuantity);
                };
            });
        };
        
        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = '';

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
            } else {
                cart.forEach(item => {
                    let quantityOptions = '';
                    for (let i = 1; i <= 20; i++) { // Límite de 20 por producto
                        quantityOptions += `<option value="${i}" ${item.quantity === i ? 'selected' : ''}>${i}</option>`;
                    }
                    const itemHTML = `
                        <div class="cart-item" data-product-id="${item.id}">
                            <div class="cart-item-details">
                                <h4>${item.name}</h4>
                                <p class="price">$${item.price.toFixed(2)} c/u</p>
                            </div>
                            <div class="cart-item-controls">
                                <label>Cant:</label>
                                <select class="cart-item-quantity">${quantityOptions}</select>
                                <button class="remove-item-btn" title="Eliminar">&times;</button>
                            </div>
                        </div>`;
                    cartItemsContainer.innerHTML += itemHTML;
                });
            }
            updateCartModalTotals();
            addCartModalEventListeners();
        };

        const addToCart = (product) => {
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity = product.quantity;
                showNotification(`Cantidad de ${product.name} actualizada.`, 'success');
            } else {
                cart.push(product);
                showNotification(`${product.name} añadido al carrito.`, 'success');
            }
            saveCart();
            updateCartCount();
        };

        // --- ASIGNACIÓN DE EVENTOS ---

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                if (!productCard) return;

                const quantitySelect = productCard.querySelector('.product-qty');
                if (!quantitySelect || !quantitySelect.value) {
                    showNotification('Por favor, selecciona una cantidad.', 'error');
                    return;
                }
                const product = {
                    id: productCard.dataset.productId,
                    name: productCard.querySelector('h3').textContent,
                    price: parseFloat(productCard.dataset.productPrice),
                    quantity: parseInt(quantitySelect.value, 10),
                    emoji: productCard.querySelector('.product-image')?.textContent.trim() || '📦'
                };
                addToCart(product);
            });
        });

        if (cartIcon) {
            cartIcon.addEventListener('click', e => {
                e.preventDefault();
                renderCartModal();
                if (cartModalOverlay) cartModalOverlay.classList.add('active');
            });
        }
        if (closeCartModalBtn) {
            closeCartModalBtn.addEventListener('click', () => {
                if (cartModalOverlay) cartModalOverlay.classList.remove('active');
            });
        }
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => {
                cart = [];
                saveCart();
                renderCartModal();
                updateCartCount();
            });
        }
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', (e) => {
                if (cart.length === 0) {
                    e.preventDefault();
                    showNotification('Tu carrito está vacío.', 'error');
                }
            });
        }
        
        // Carga inicial del carrito
        const storedCart = localStorage.getItem('shoppingCart');
        cart = JSON.parse(storedCart) || [];
        updateCartCount();
    };

    /**
     * ===============================================
     * MÓDULO PARA LA CALCULADORA INTERACTIVA
     * ===============================================
     */
    const initCalculator = () => {
        const calcSteps = document.querySelectorAll('.calculator-step');
        if (calcSteps.length === 0) return; // No ejecuta si no hay calculadora

        const progressBar = document.getElementById('progressBar');
        const stepIndicators = document.querySelectorAll('.progress-steps .step');
        const calculateBtn = document.getElementById('calculateBtn');
        const calculatorResult = document.getElementById('calculatorResult');
        let currentStep = 1;

        const showStep = (stepNumber) => {
            calcSteps.forEach(step => step.classList.remove('active'));
            const nextStepEl = document.getElementById(`calc-step-${stepNumber}`);
            if (nextStepEl) nextStepEl.classList.add('active');
            
            const progressPercentage = ((stepNumber - 1) / (stepIndicators.length - 1)) * 100;
            if (progressBar) progressBar.style.width = `${progressPercentage}%`;

            stepIndicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index < stepNumber);
            });
        };

        document.querySelectorAll('input[name="homeType"], input[name="belongings"]').forEach(radio => {
            radio.addEventListener('click', () => {
                if (currentStep < 3) {
                    setTimeout(() => {
                        currentStep++;
                        showStep(currentStep);
                    }, 200);
                }
            });
        });

        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                const homeType = document.querySelector('input[name="homeType"]:checked')?.value;
                const belongings = document.querySelector('input[name="belongings"]:checked')?.value;
                const extras = [...document.querySelectorAll('input[name="extras"]:checked')].map(cb => cb.value);

                if (!homeType || !belongings) {
                    showNotification('Por favor completa los pasos 1 y 2.', 'error');
                    return;
                }

                let mediumBoxes = 0, largeBoxes = 0;
                switch (homeType) {
                    case 'studio': mediumBoxes = 8; largeBoxes = 4; break;
                    case '1br': mediumBoxes = 12; largeBoxes = 6; break;
                    case '2br': mediumBoxes = 18; largeBoxes = 9; break;
                    case '4br': mediumBoxes = 35; largeBoxes = 18; break;
                }
                const mult = { 'minimal': 0.7, 'normal': 1.0, 'many': 1.4 };
                mediumBoxes = Math.round(mediumBoxes * mult[belongings]);
                largeBoxes = Math.round(largeBoxes * mult[belongings]);
                if (extras.includes('office')) { mediumBoxes += 5; largeBoxes += 2; }
                if (extras.includes('storage')) { mediumBoxes += 8; largeBoxes += 4; }
                if (extras.includes('garage')) { mediumBoxes += 6; largeBoxes += 3; }
                
                if (calculatorResult) {
                    calculatorResult.innerHTML = `
                        <p>Basado en tus respuestas, te recomendamos:</p>
                        <strong>${mediumBoxes} Cajas Medianas y ${largeBoxes} Cajas Grandes</strong>
                        <a href="productos.html" class="btn btn-primary" style="margin-top:15px;">Ver Paquetes</a>
                    `;
                    calculatorResult.classList.add('visible');
                    calculatorResult.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        showStep(currentStep);
    };

    /**
     * ===============================================
     * INICIALIZACIÓN DE TODOS LOS MÓDULOS
     * ===============================================
     */
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initCalculator();
});