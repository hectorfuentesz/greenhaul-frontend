/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL (VERSIÓN FINAL CORREGIDA)
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
     * MÓDULO DE SESIÓN DE USUARIO (CORREGIDO)
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
        
        // CORRECCIÓN: Esta línea es crucial para mostrar el contenedor de acciones
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
     * MÓDULO DEL CARRITO DE COMPRAS (COMPLETO Y CORREGIDO)
     * ===============================================
     */
     const initShoppingCart = () => {
        let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
        
        const cartIcon = document.getElementById('cartIcon');
        const cartModalOverlay = document.getElementById('cartModalOverlay');
        const closeCartModalBtn = document.getElementById('closeCartModalBtn');
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartBtn = document.getElementById('emptyCartBtn');
        const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

        if (!cartIcon || !cartModalOverlay || !closeCartModalBtn) {
            return;
        }

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

            const subtotal = cart.reduce((sum, item) => {
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
            cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(b => {
                b.addEventListener('click', (e) => removeCartItem(e.target.closest('.cart-item').dataset.productId));
            });
            cartItemsContainer.querySelectorAll('.cart-item-quantity').forEach(s => {
                s.addEventListener('change', (e) => updateCartItemQuantity(e.target.closest('.cart-item').dataset.productId, parseInt(e.target.value, 10)));
            });
        };
        
        const renderCartModal = () => {
            if (!cartItemsContainer) return;
            cartItemsContainer.innerHTML = '';
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
            } else {
                cart.forEach(item => {
                    const price = (typeof item.price === 'number') ? item.price : 0;
                    // CORRECCIÓN: Asegura que la cantidad sea un número válido.
                    const quantity = (typeof item.quantity === 'number') ? item.quantity : 1;
                    
                    let opts = '';
                    for (let i = 1; i <= 20; i++) {
                        opts += `<option value="${i}" ${quantity === i ? 'selected' : ''}>${i}</option>`;
                    }
                    
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
                        </div>`;
                });
            }
            updateCartModalTotals();
            addCartModalEventListeners();
        };

        const addToCart = (product) => {
            const itemInCart = cart.find(item => item.id === product.id);
            if (itemInCart) {
                itemInCart.quantity += product.quantity;
            } else {
                cart.push(product);
            }
            showNotification(`${product.name} añadido al carrito.`, 'success');
            saveCart();
            updateCartCount();
        };

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', e => {
                const productCard = e.target.closest('.product-card');
                const quantitySelect = productCard?.querySelector('.product-qty');
                if (!quantitySelect || !quantitySelect.value) {
                    showNotification('Por favor, selecciona una cantidad.', 'error');
                    return;
                }
                addToCart({
                    id: productCard.dataset.productId,
                    name: productCard.querySelector('h3').textContent,
                    price: parseFloat(productCard.dataset.productPrice),
                    quantity: parseInt(quantitySelect.value, 10),
                });
                quantitySelect.value = "";
            });
        });

        cartIcon.addEventListener('click', e => {
            e.preventDefault();
            renderCartModal();
            cartModalOverlay.classList.add('active');
        });

        closeCartModalBtn.addEventListener('click', () => {
            cartModalOverlay.classList.remove('active');
        });
        
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                cartModalOverlay.classList.remove('active');
            }
        });
        
        // CORRECCIÓN: El listener para el botón de vaciar carrito estaba faltando.
        if (emptyCartBtn) {
            emptyCartBtn.addEventListener('click', () => {
                cart = [];
                saveCart();
                renderCartModal();
                updateCartCount();
                showNotification('El carrito ha sido vaciado.', 'success');
            });
        }

        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => {
                if (cart.length === 0) {
                    e.preventDefault();
                    showNotification('Tu carrito está vacío.', 'error');
                }
            });
        }
        
        updateCartCount();
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
    
    // ... Tu función initCalculator() aquí ...


    /**
     * ===============================================
     * INICIALIZACIÓN DE TODOS LOS MÓDULOS
     * ===============================================
     */
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    // initCalculator(); // Descomenta si tienes esa función
    initProductPageElements();
});