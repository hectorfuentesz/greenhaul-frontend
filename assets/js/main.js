/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL (VERSIÓN FINAL COMPLETA CON FECHAS DE RENTA)
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
    
    let iconSVGContent = svgSuccess;
    if (type === 'error') iconSVGContent = svgError;
    
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
        const currentPage = window.location.pathname.split('/').pop();

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            link.classList.remove('active');
            if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
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
            if (userNameSpan) userNameSpan.textContent = savedUser.name.split(' ')[0];
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
                localStorage.removeItem('greenhaulUser');
                alert('Has cerrado sesión.');
                window.location.href = 'index.html';
            });
        }
    };
    
    /**
     * ===============================================
     * MÓDULO DEL CARRITO DE COMPRAS (CON FECHAS DE RENTA)
     * ===============================================
     */
     const initShoppingCart = () => {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || { items: [], rentalDates: null };
        
        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) return;

        const saveCart = () => {
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
        };
        
        const updateCartCount = () => {
            const cartCountEl = document.getElementById('cartCount');
            if (!cartCountEl) return;
            const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
        };

        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = '';

            const cartStartDateEl = document.getElementById('cartStartDate');
            const cartEndDateEl = document.getElementById('cartEndDate');
            const rentalDatesContainerEl = document.querySelector('.cart-rental-dates');

            if (cart.rentalDates && cartStartDateEl && cartEndDateEl) {
                cartStartDateEl.textContent = cart.rentalDates.start;
                cartEndDateEl.textContent = cart.rentalDates.end;
                if (rentalDatesContainerEl) rentalDatesContainerEl.style.display = 'block';
            } else {
                if (rentalDatesContainerEl) rentalDatesContainerEl.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
            } else {
                cart.items.forEach(item => {
                    const price = (typeof item.price === 'number') ? item.price : 0;
                    const quantity = (typeof item.quantity === 'number') ? item.quantity : 1;
                    let opts = Array.from({length: 20}, (_, i) => `<option value="${i + 1}" ${quantity === i ? 'selected' : ''}>${i + 1}</option>`).join('');
                    cartItemsContainer.innerHTML += `<div class="cart-item" data-product-id="${item.id}"><div class="cart-item-details"><h4>${item.name}</h4><p class="price">$${price.toFixed(2)} c/u</p></div><div class="cart-item-controls"><label for="cart-qty-${item.id}">Cant:</label><select id="cart-qty-${item.id}" class="cart-item-quantity">${opts}</select><button class="remove-item-btn" title="Eliminar">&times;</button></div></div>`;
                });
            }
            updateCartModalTotals();
            addCartModalEventListeners();
        };
        
        const updateCartModalTotals = () => {
            const subtotalEl = document.getElementById('cartSubtotal');
            const taxesEl = document.getElementById('cartTaxes');
            const totalEl = document.getElementById('cartTotal');
            if (!subtotalEl || !taxesEl || !totalEl) return;

            const subtotal = cart.items.reduce((sum, item) => {
                const price = (typeof item.price === 'number') ? item.price : 0;
                const quantity = (typeof item.quantity === 'number') ? item.quantity : 0;
                return sum + (price * quantity);
            }, 0);

            const taxes = subtotal * 0.16;
            const total = subtotal + taxes;
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            taxesEl.textContent = `$${taxes.toFixed(2)}`;
            totalEl.textContent = `$${total.toFixed(2)}`;
        };

        const removeCartItem = (productId) => {
            cart.items = cart.items.filter(item => item.id !== productId);
            if (cart.items.length === 0) {
                cart.rentalDates = null;
            }
            saveCart();
            renderCartModal();
            updateCartCount();
        };
        
        const updateCartItemQuantity = (productId, newQuantity) => {
            const itemInCart = cart.items.find(item => item.id === productId);
            if (itemInCart) {
                itemInCart.quantity = newQuantity;
                saveCart();
                renderCartModal();
            }
        };

        const addCartModalEventListeners = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(b => {
                b.addEventListener('click', (e) => removeCartItem(e.target.closest('.cart-item').dataset.productId));
            });
            cartItemsContainer.querySelectorAll('.cart-item-quantity').forEach(s => {
                s.addEventListener('change', (e) => updateCartItemQuantity(e.target.closest('.cart-item').dataset.productId, parseInt(e.target.value, 10)));
            });
        };

        const addToCart = (product, rentalDates) => {
            if (cart.items.length === 0) {
                cart.rentalDates = rentalDates;
            }
            const itemInCart = cart.items.find(item => item.id === product.id);
            if (itemInCart) {
                itemInCart.quantity += product.quantity;
            } else {
                cart.items.push(product);
            }
            showNotification(`${product.name} añadido al carrito.`, 'success');
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
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');

                if (!startDateInput.value || !endDateInput.value) {
                    showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                    startDateInput.parentElement.parentElement.parentElement.classList.add('shake-animation');
                    setTimeout(() => startDateInput.parentElement.parentElement.parentElement.classList.remove('shake-animation'), 500);
                    return;
                }

                const newRentalDates = { start: startDateInput.value, end: endDateInput.value };

                if (cart.rentalDates && (cart.rentalDates.start !== newRentalDates.start || cart.rentalDates.end !== newRentalDates.end)) {
                    if (!confirm('Has cambiado las fechas de renta. ¿Deseas vaciar el carrito actual y empezar un nuevo pedido?')) {
                        return;
                    }
                    clearCart();
                }

                const productCard = e.target.closest('.product-card');
                const quantitySelect = productCard?.querySelector('.product-qty');
                if (!quantitySelect || !quantitySelect.value) {
                    showNotification('Por favor, selecciona una cantidad.', 'error'); return;
                }
                addToCart({
                    id: productCard.dataset.productId,
                    name: productCard.querySelector('h3').textContent,
                    price: parseFloat(productCard.dataset.productPrice),
                    quantity: parseInt(quantitySelect.value, 10),
                }, newRentalDates);
                quantitySelect.value = "";
            });
        });

        cartIcon.addEventListener('click', e => {
            e.preventDefault();
            renderCartModal();
            cartModalOverlay.classList.add('active');
        });

        closeCartModalBtn.addEventListener('click', () => cartModalOverlay.classList.remove('active'));
        cartModalOverlay.addEventListener('click', e => { if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('active'); });
        
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => {
                clearCart();
                showNotification('El carrito ha sido vaciado.', 'success');
            });
        }

        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => {
                if (cart.items.length === 0) {
                    e.preventDefault();
                    showNotification('Tu carrito está vacío.', 'error');
                }
                // Guardamos el carrito una última vez para asegurar que las fechas van en la orden
                saveCart();
            });
        }
        
        updateCartCount();
        renderCartModal(); // Para que las fechas se muestren al cargar la página si ya existen
    };

    /**
     * ===============================================
     * MÓDULO PARA LA PÁGINA DE PRODUCTOS
     * ===============================================
     */
    const initProductPageElements = () => {
        if (typeof flatpickr === 'undefined' || !document.getElementById('fecha-entrega')) return;
        
        const fechaRecoleccionPicker = flatpickr("#fecha-recoleccion", { locale: "es", minDate: "today" });
        flatpickr("#fecha-entrega", {
            locale: "es",
            minDate: "today",
            onChange: function(selectedDates, dateStr) {
                if (fechaRecoleccionPicker) {
                    fechaRecoleccionPicker.set('minDate', dateStr);
                }
            }
        });
    };
    
    // Aquí puedes añadir tu función initCalculator si la tienes

    /**
     * ===============================================
     * INICIALIZACIÓN DE TODOS LOS MÓDULOS
     * ===============================================
     */
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements();
});
