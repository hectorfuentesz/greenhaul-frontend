/**
 * =================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL PARA GREENHAUL (VERSIÓN FINAL COMPLETA Y CORREGIDA)
 * =================================================================
 */

// --- URL ABSOLUTA DEL BACKEND ---
const BACKEND_URL = 'https://greenhaul-backend-production.up.railway.app';

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

// --- FIX: FUNCIÓN PARA FORMATEAR FECHAS AL FORMATO QUE ESPERA EL BACKEND ---
function getRentalDatesForBackend() {
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || {};
    if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end) {
        return {
            fecha_inicio: cart.rentalDates.start,
            fecha_fin: cart.rentalDates.end
        };
    }
    if (cart.rentalDates && cart.rentalDates.fecha_inicio && cart.rentalDates.fecha_fin) {
        return cart.rentalDates;
    }
    return null;
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
            if (cart.rentalDates && startDateEl && endDateEl && datesContainer) {
                startDateEl.textContent = cart.rentalDates.start;
                endDateEl.textContent = cart.rentalDates.end;
                datesContainer.style.display = 'block';
            } else if (datesContainer) {
                datesContainer.style.display = 'none';
            }

            if (cart.items.length === 0) {
                cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío.</p>';
            } else {
                cart.items.forEach(item => {
                    const price = typeof item.price === 'number' ? item.price : 0;
                    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
                    let opts = Array.from({length: 20}, (_, i) => `<option value="${i + 1}" ${quantity === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('');
                    cartItemsContainer.innerHTML += `<div class="cart-item" data-product-id="${item.id}"><div class="cart-item-details"><h4>${item.name}</h4><p class="price">$${price.toFixed(2)} c/u</p></div><div class="cart-item-controls"><label for="cart-qty-${item.id}">Cant:</label><select id="cart-qty-${item.id}" class="cart-item-quantity">${opts}</select><button class="remove-item-btn" title="Eliminar">&times;</button></div></div>`;
                });
            }
            updateCartModalTotals();
            addCartModalEventListeners();
        };
        
        const updateCartModalTotals = () => {
            let totalDays = 1;
            if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end) {
                const startDate = new Date(cart.rentalDates.start);
                const endDate = new Date(cart.rentalDates.end);
                totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            }

            const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity * totalDays), 0);
            const taxes = subtotal * 0.16;
            const total = subtotal;

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
            showNotification('Ítem eliminado del carrito.', 'success');
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
            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', e => {
                    const productId = parseInt(e.target.closest('.cart-item').dataset.productId, 10);
                    removeCartItem(productId);
                });
            });

            document.querySelectorAll('.cart-item-quantity').forEach(select => {
                select.addEventListener('change', e => {
                    const productId = parseInt(e.target.closest('.cart-item').dataset.productId, 10);
                    updateCartItemQuantity(productId, e.target.value);
                });
            });
        };

        const addToCart = async (product, rentalDates) => {
            cart.rentalDates = rentalDates;
            product.id = parseInt(product.id, 10);
            if (isNaN(product.id)) {
                showNotification('Error: El producto no tiene un ID válido.', 'error');
                return;
            }

            // --- Validación inventario por fechas antes de agregar ---
            const fechaInicio = rentalDates.start;
            const fechaFin = rentalDates.end;
            try {
                const resp = await fetch(`${BACKEND_URL}/api/products/${product.id}/availability?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&cantidad=${product.quantity}`);
                const data = await resp.json();
                if (!data.disponible) {
                    showNotification(`No hay suficiente inventario para este producto en las fechas seleccionadas. Inventario máximo: ${data.cantidad_maxima}`, 'error');
                    return;
                }
            } catch (err) {
                showNotification('Error al verificar inventario. Intenta de nuevo.', 'error');
                return;
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
            button.addEventListener('click', async e => {
                const startDateInput = document.getElementById('fecha-entrega');
                const endDateInput = document.getElementById('fecha-recoleccion');

                if (!startDateInput.value || !endDateInput.value) {
                    showNotification('Por favor, selecciona las fechas de entrega y recolección.', 'error');
                    const rentalContainer = document.querySelector('.rental-dates-container');
                    if (rentalContainer) {
                        rentalContainer.classList.add('shake-animation');
                        setTimeout(() => rentalContainer.classList.remove('shake-animation'), 500);
                    }
                    return;
                }

                const newRentalDates = { start: startDateInput.value, end: endDateInput.value };
                if (cart.rentalDates && (cart.rentalDates.start !== newRentalDates.start || cart.rentalDates.end !== newRentalDates.end)) {
                    if (!confirm('Has cambiado las fechas. ¿Deseas vaciar el carrito y empezar un nuevo pedido?')) return;
                    clearCart();
                }

                const productCard = e.target.closest('.product-card');
                const quantitySelect = productCard?.querySelector('.product-qty');
                if (!quantitySelect || !quantitySelect.value) {
                    showNotification('Por favor, selecciona una cantidad.', 'error');
                    return;
                }
                const productPrice = parseFloat(productCard.dataset.productPrice);
                if (isNaN(productPrice)) {
                    showNotification('Error: El precio del producto no es válido.', 'error');
                    return;
                }

                const productId = parseInt(productCard.dataset.productId, 10);
                if (isNaN(productId)) {
                    showNotification('Error: El producto no tiene un ID válido.', 'error');
                    return;
                }

                await addToCart({
                    id: productId,
                    name: productCard.querySelector('h3').textContent,
                    price: productPrice,
                    quantity: parseInt(quantitySelect.value, 10)
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
        cartModalOverlay.addEventListener('click', e => {
            if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('active');
        });
        if (emptyCartBtn) emptyCartBtn.addEventListener('click', () => {
            clearCart();
            showNotification('Carrito vaciado.', 'success');
        });
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', e => {
                const user = JSON.parse(localStorage.getItem('greenhaulUser'));
                if (!user) {
                    e.preventDefault();
                    showNotification('Debes iniciar sesión para continuar con la compra.', 'error');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                    return;
                }

                if (cart.items.length === 0) {
                    e.preventDefault();
                    showNotification('Tu carrito está vacío.', 'error');
                    return;
                }
                if (cart.rentalDates && cart.rentalDates.start && cart.rentalDates.end) {
                    localStorage.setItem('greenhaulEntrega', cart.rentalDates.start);
                    localStorage.setItem('greenhaulRecoleccion', cart.rentalDates.end);
                }
                saveCart();
            });
        }

        updateCartCount();
        if (cartModalOverlay) renderCartModal();
    };

    const initProductPageElements = async () => {
        if (typeof flatpickr === 'undefined' || !document.getElementById('fecha-entrega')) return;

        // --- NUEVO: Colores en el calendario según disponibilidad del backend ---
        async function fetchCalendarDaysStatus() {
            try {
                const resp = await fetch(`${BACKEND_URL}/api/calendar/days-status`);
                const data = await resp.json();
                const daysMap = {};
                if (data.days) {
                    data.days.forEach(day => {
                        daysMap[day.fecha] = day;
                    });
                }
                return daysMap;
            } catch (err) {
                console.error('Error al obtener estado de días:', err);
                return {};
            }
        }

        const daysMap = await fetchCalendarDaysStatus();

        const fechaRecoleccionPicker = flatpickr("#fecha-recoleccion", {
            locale: "es",
            minDate: "today",
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
            onDayCreate: function(dObj, dDay, date) {
                const fecha = date.toISOString().slice(0, 10);
                const dayData = daysMap[fecha];
                if (!dayData) return;
                if (!dayData.recolecciones_disponibles && !dayData.entregas_disponibles) {
                    dDay.classList.add('flatpickr-day-red');
                } else if (dayData.entregas_disponibles && dayData.recolecciones_disponibles) {
                    dDay.classList.add('flatpickr-day-green');
                } else {
                    dDay.classList.add('flatpickr-day-yellow');
                }
            }
        });

        flatpickr("#fecha-entrega", {
            locale: "es",
            minDate: "today",
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates, dateStr) {
                if (fechaRecoleccionPicker) {
                    fechaRecoleccionPicker.set('minDate', dateStr);
                }
            },
            onDayCreate: function(dObj, dDay, date) {
                const fecha = date.toISOString().slice(0, 10);
                const dayData = daysMap[fecha];
                if (!dayData) return;
                if (!dayData.entregas_disponibles && !dayData.recolecciones_disponibles) {
                    dDay.classList.add('flatpickr-day-red');
                } else if (dayData.entregas_disponibles && dayData.recolecciones_disponibles) {
                    dDay.classList.add('flatpickr-day-green');
                } else {
                    dDay.classList.add('flatpickr-day-yellow');
                }
            }
        });
    };

    const initTimelineAnimations = () => {
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems.length > 0) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.4
            });

            timelineItems.forEach(item => observer.observe(item));
        }
    };

    // Llamadas a las funciones de inicialización
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements();
    initTimelineAnimations();
});

// --- EJEMPLO DE USO DEL FIX EN TU PAGO/ORDEN ---
// Cuando vayas a hacer fetch a /api/mercadopago o /api/orders, usa SIEMPRE el formato correcto:
function enviarPagoOMiOrden() {
    // ... otros datos que prepares ...
    const rentalDates = getRentalDatesForBackend();
    // Ejemplo fetch:
    fetch(`${BACKEND_URL}/api/mercadopago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // ... otros campos como user_id, email, nombre, productos, direcciones, etc.
            rentalDates,
            // ... otros campos
        })
    })
    .then(res => res.json())
    .then(data => {
        // Maneja la respuesta aquí
        if (data.message) showNotification(data.message, 'success');
    })
    .catch(err => {
        showNotification('Error al procesar el pago.', 'error');
    });
}
// Puedes quitar esta función ejemplo, es solo para mostrar el uso correcto del fix.