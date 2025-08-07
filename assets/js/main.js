/**
 * ================================================================
 * ARCHIVO JAVASCRIPT PRINCIPAL UNIFICADO - GREENHAUL
 * ================================================================
 */
const BACKEND_URL = 'https://greenhaul-backend-production.up.railway.app';

// --- FUNCIÓN GLOBAL DE NOTIFICACIÓN ---
function showNotification(message, type = 'success') {
    const notificationPopup = document.getElementById('notificationPopup');
    if (notificationPopup) {
        notificationPopup.textContent = message;
        notificationPopup.className = 'show' + (type === 'error' ? ' error' : '');
        setTimeout(() => { notificationPopup.className = ''; }, 2200);
        return;
    }
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
    setTimeout(() => { notificationElement.classList.remove('visible'); }, 3000);
}

// --- FUNCIÓN PARA FORMATEAR FECHAS QUE ESPERA EL BACKEND ---
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

// --- MODAL PARA DISPONIBILIDAD DE FECHA ---
function showDisponibilidadModal(message, type="info") {
    const modalBg = document.createElement('div');
    modalBg.style.position = 'fixed';
    modalBg.style.top = '0';
    modalBg.style.left = '0';
    modalBg.style.width = '100vw';
    modalBg.style.height = '100vh';
    modalBg.style.background = 'rgba(0,0,0,0.4)';
    modalBg.style.zIndex = '9999';
    modalBg.style.display = 'flex';
    modalBg.style.justifyContent = 'center';
    modalBg.style.alignItems = 'center';

    const modalBox = document.createElement('div');
    modalBox.style.background = '#fff';
    modalBox.style.padding = '2em';
    modalBox.style.borderRadius = '10px';
    modalBox.style.boxShadow = '0 2px 16px #0002';
    modalBox.style.maxWidth = '90vw';
    modalBox.style.textAlign = 'center';
    modalBox.innerHTML = `<h2 style="color:${type === "error" ? "#f66" : "#27ae60"}">${type === "error" ? "¡Sin disponibilidad!" : "¡Fecha disponible!"}</h2><p>${message}</p><button id="closeModalBtn" style="margin-top:1em;padding:.5em 2em;border:none;border-radius:5px;background:${type === "error" ? "#f66" : "#27ae60"};color:#fff;font-size:1em;cursor:pointer;">Cerrar</button>`;
    
    modalBg.appendChild(modalBox);
    document.body.appendChild(modalBg);

    document.getElementById('closeModalBtn').onclick = () => {
        document.body.removeChild(modalBg);
    };
}

// --- FUNCIONES GLOBALES PARA TODAS LAS PÁGINAS ---
document.addEventListener('DOMContentLoaded', () => {
    initGlobalElements();
    initActiveNav();
    initUserSession();
    initShoppingCart();
    initProductPageElements();
    initTimelineAnimations();
    initAccountSidebar();

    // Si estamos en la página de cuenta, inicializa toda la lógica de cuenta
    if (document.body.classList.contains('cuenta-page') || window.location.pathname.endsWith('cuenta.html')) {
        initAccountDashboard();
    }
});

// --- NAVBAR Y ELEMENTOS GLOBALES ---
function initGlobalElements() {
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
}

// --- MARCAR LINK ACTIVO EN NAV ---
function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- SESIÓN DE USUARIO ---
function initUserSession() {
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
            window.location.href = 'index.html';
        });
    }
}

// --- CARRITO DE COMPRAS ---
function initShoppingCart() {
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
}

// --- CALENDARIO FLATPICKR CON POPUP DISPONIBILIDAD ---
function initProductPageElements() {
    if (typeof flatpickr === 'undefined' || !document.getElementById('fecha-entrega') || !document.getElementById('fecha-recoleccion')) return;

    // Flatpickr FECHA DE ENTREGA
    flatpickr("#fecha-entrega", {
        locale: "es",
        minDate: "today",
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            fetch(`${BACKEND_URL}/api/calendar/disponibilidad?fecha=${dateStr}`)
                .then(res => res.json())
                .then(data => {
                    if (data.entregas_disponibles) {
                        showDisponibilidadModal("¡Sí hay disponibilidad para entrega! Realiza tu compra lo antes posible para asegurar la fecha.", "success");
                    } else {
                        showDisponibilidadModal("Gracias por tu interés, pero no hay disponibilidad de entrega para ese día. Por favor selecciona otro.", "error");
                    }
                })
                .catch(err => {
                    showDisponibilidadModal("Ocurrió un error al consultar disponibilidad. Intenta de nuevo.", "error");
                });
        }
    });

    // Flatpickr FECHA DE RECOLECCIÓN
    flatpickr("#fecha-recoleccion", {
        locale: "es",
        minDate: "today",
        altInput: true,
        altFormat: "F j, Y",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates, dateStr) {
            fetch(`${BACKEND_URL}/api/calendar/disponibilidad?fecha=${dateStr}`)
                .then(res => res.json())
                .then(data => {
                    if (data.recolecciones_disponibles) {
                        showDisponibilidadModal("¡Sí hay disponibilidad para recolección! Realiza tu compra lo antes posible para asegurar la fecha.", "success");
                    } else {
                        showDisponibilidadModal("Gracias por tu interés, pero no hay disponibilidad de recolección para ese día. Por favor selecciona otro.", "error");
                    }
                })
                .catch(err => {
                    showDisponibilidadModal("Ocurrió un error al consultar disponibilidad. Intenta de nuevo.", "error");
                });
        }
    });
}

// --- ANIMACIONES DE TIMELINE ---
function initTimelineAnimations() {
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
}

// --- SIDEBAR DE CUENTA ULTRA RESPONSIVO ---
function initAccountSidebar() {
    const links = document.querySelectorAll('.account-nav-link');
    const sections = document.querySelectorAll('.account-section');
    if (links.length === 0 || sections.length === 0) return;
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active', 'fade-in'));
            this.classList.add('active');
            const sectionKey = this.getAttribute('data-section');
            const targetSection = document.getElementById(`${sectionKey}-section`);
            if (targetSection) {
                targetSection.classList.add('active', 'fade-in');
                if (window.innerWidth <= 768) {
                    targetSection.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            }
        });
    });
    document.querySelectorAll('.quick-actions .btn, .recent-orders-summary + div .btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetSection = e.target.dataset.targetSection;
            if (targetSection) {
                const link = document.querySelector(`.account-nav-link[data-section="${targetSection}"]`);
                if (link) link.click();
            } else if (e.target.href) {
                window.location.href = e.target.href;
            }
        });
    });
}

// --- LÓGICA ESPECÍFICA DE LA PÁGINA DE CUENTA ---
function initAccountDashboard() {
    const loggedInUser = JSON.parse(localStorage.getItem('greenhaulUser'));
    if (!loggedInUser || !loggedInUser.id) {
        window.location.href = 'login.html';
        return;
    }

    const userCardName = document.getElementById('userCardName');
    const userCardEmail = document.getElementById('userCardEmail');
    const userNameSpan = document.getElementById('userName');
    const accountTitle = document.getElementById('account-title');
    const dashboardUserName = document.getElementById('dashboardUserName');
    const widgetPedidos = document.getElementById('widgetPedidos');
    const widgetCompletados = document.getElementById('widgetCompletados');
    const widgetDirecciones = document.getElementById('widgetDirecciones');
    const widgetAhorro = document.getElementById('widgetAhorro');
    const widgetAhorroEquivalente = document.getElementById('widgetAhorroEquivalente');
    const navLinks = document.querySelectorAll('.account-nav-link');
    const sections = document.querySelectorAll('.account-section');
    const orderHistoryContainer = document.getElementById('order-history-container');
    const recentOrdersSummaryContainer = document.getElementById('recent-orders-summary-container');
    const profileForm = document.getElementById('profileForm');
    const profileNameInput = document.getElementById('profile-name');
    const profileLastNameInput = document.getElementById('profile-lastname');
    const profileEmailInput = document.getElementById('profile-email');
    const profileWhatsappInput = document.getElementById('profile-whatsapp');
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addressModal = document.getElementById('addressModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const addressForm = document.getElementById('addressForm');
    const addressListContainer = document.getElementById('address-list-container');
    const modalTitle = document.getElementById('modalTitle');
    const addressIdInput = document.getElementById('addressId');
    const addressNameInput = document.getElementById('address-name');
    const streetInput = document.getElementById('address-street');
    const neighborhoodInput = document.getElementById('address-neighborhood');
    const cityInput = document.getElementById('address-city');
    const stateInput = document.getElementById('address-state');
    const postalCodeInput = document.getElementById('address-postal-code');
    const referencesInput = document.getElementById('address-references');
    const notificationPopup = document.getElementById('notificationPopup');
    const logoutBtn = document.getElementById('logoutBtn');
    let userData = {};
    let map, marker;

    document.querySelectorAll('.widget-card').forEach((el, i) => { el.style.animationDelay = (i * 0.15) + 's'; });
    document.querySelectorAll('.action-card').forEach((el, i) => { el.style.animationDelay = (i * 0.1) + 's'; });

    function showNotification(message, isError = false) {
        if (!notificationPopup) return;
        notificationPopup.textContent = message;
        notificationPopup.className = 'show' + (isError ? ' error' : '');
        setTimeout(() => {
            notificationPopup.className = '';
        }, 2200);
    }
    function updateSidebar(user) {
        userCardName.textContent = user.name ?? 'Usuario';
        userCardEmail.textContent = user.email ?? '';
        userNameSpan.textContent = user.name ? user.name.split(' ')[0] : 'Usuario';
        accountTitle.textContent = `Panel de Control de ${user.name || 'Usuario'}`;
        dashboardUserName.textContent = user.name ? user.name.split(' ')[0] : 'Usuario';
    }
    async function updateDashboardWidgetsFromBackend() {
        try {
            const res = await fetch(`${BACKEND_URL}/api/users/${loggedInUser.id}/dashboard`);
            if (!res.ok) throw new Error('Error al cargar estadísticas del dashboard.');
            const stats = await res.json();
            widgetPedidos.textContent = stats.pedidos_activos ?? 0;
            widgetCompletados.textContent = stats.pedidos_completados ?? 0;
            widgetDirecciones.textContent = stats.direcciones ?? 0;
            widgetAhorro.textContent = stats.ahorro_kg_co2 + ' kg';
            widgetAhorroEquivalente.textContent = `Equivale a ${stats.arboles_equivalentes} árboles 🌳 o ${stats.km_equivalentes} km en auto 🚗`;
            displayRecentOrders(stats.recent_orders || []);
        } catch (e) {
            showNotification('No se pudieron cargar las estadísticas del dashboard.', true);
            widgetAhorro.textContent = '0 kg';
            widgetAhorroEquivalente.textContent = '';
            recentOrdersSummaryContainer.innerHTML = '<p>No se pudieron cargar los pedidos recientes.</p>';
        }
    }
    function displayRecentOrders(orders) {
        recentOrdersSummaryContainer.innerHTML = '';
        if (!orders || orders.length === 0) {
            recentOrdersSummaryContainer.innerHTML = '<p>No hay pedidos recientes para mostrar.</p>';
            return;
        }
        orders.slice(0, 3).forEach(order => {
            const estado = order.status === 'completado' ? 'Completado' : 'Activo';
            orderHistoryContainer.innerHTML += `
            <div class="order-item slide-up">
            <div><strong>ID:</strong> ${order.id}</div>
            <div><strong>Fecha:</strong> ${order.date}</div>
            <div><strong>Total:</strong> $${parseFloat(order.total).toFixed(2)} MXN</div>
            <div><strong>Estado:</strong> <span class="order-item-status status-${estado.toLowerCase()}">${estado}</span></div>
            </div>`;
        });
    }
    function activateSection(sectionId) {
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active', 'fade-in'));
        const targetLink = document.querySelector(`.account-nav-link[data-section="${sectionId}"]`);
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetLink) targetLink.classList.add('active');
        if (targetSection) targetSection.classList.add('active', 'fade-in');
        switch (sectionId) {
            case 'dashboard': updateDashboardWidgetsFromBackend(); break;
            case 'pedidos': loadOrders(); break;
            case 'perfil': populateProfileForm(); break;
            case 'direcciones': loadAddresses(); break;
        }
    }
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            activateSection(sectionId);
        });
    });
    document.querySelectorAll('.quick-actions .btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetSection = e.target.dataset.targetSection;
            if (targetSection) {
                activateSection(targetSection);
            } else if (e.target.href) {
                window.location.href = e.target.href;
            }
        });
    });
    document.querySelector('.recent-orders-summary + div .btn').addEventListener('click', () => {
        activateSection('pedidos');
    });
    async function loadOrders() {
        orderHistoryContainer.innerHTML = '<div class="order-item"><span>Cargando pedidos...</span></div>';
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${loggedInUser.id}/orders`);
            if (!response.ok) throw new Error('Error al cargar pedidos.');
            const orders = await response.json();
            orderHistoryContainer.innerHTML = '';
            if (!orders || orders.length === 0) {
                orderHistoryContainer.innerHTML = '<p>No tienes pedidos aún. ¡Anímate a programar tu primera mudanza sostenible!</p>';
                return;
            }
            orders.sort((a, b) => new Date(b.date) - new Date(a.date));
            orders.forEach(order => {
                const estado = order.estado === 'completado' ? 'Completado' : 'Activo';
                orderHistoryContainer.innerHTML += `
                <table class="order-table">
                <tr>
                <td><strong>Folio:</strong></td>
                <td>${order.id}</td>
                </tr>
                <tr>
                <td><strong>Fecha Pedido:</strong></td>
                <td>${order.fecha}</td>
                </tr>
                <tr>
                <td><strong>Entrega:</strong></td>
                <td>${order.entrega}</td>
                </tr>
                <tr>
                <td><strong>Recolección:</strong></td>
                <td>${order.recoleccion}</td>
                </tr>
                <tr>
                <td><strong>Total:</strong></td>
                <td>$${order.total} MXN</td>
                </tr>
                <tr>
                <td><strong>Estado:</strong></td>
                <td><span class="order-item-status status-${estado.toLowerCase()}">${estado}</span></td>
                </tr>
                </table>
                <br>
                `;
            });
        } catch (error) {
            showNotification(`Error al cargar pedidos: ${error.message}`, true);
            orderHistoryContainer.innerHTML = '<p>Error al cargar pedidos. Por favor, inténtalo de nuevo más tarde.</p>';
        }
    }
    function populateProfileForm() {
        if (!userData) return;
        profileNameInput.value = userData.name || '';
        profileLastNameInput.value = userData.surname || '';
        profileEmailInput.value = userData.email || '';
        profileWhatsappInput.value = userData.whatsapp || '';
    }
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = profileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        const updatedData = {
            email: profileEmailInput.value,
            whatsapp: profileWhatsappInput.value,
        };
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${loggedInUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al actualizar el perfil.');
            userData = { ...loggedInUser, ...result.user };
            localStorage.setItem('greenhaulUser', JSON.stringify(userData));
            showNotification('Perfil actualizado con éxito.');
            updateSidebar(userData);
        } catch (error) {
            showNotification(error.message, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
    function initMap(lat = 19.4326, lng = -99.1332) {
        if (map) {
            map.remove();
            map = null;
        }
        map = L.map('address-map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', function(event) {
            const pos = marker.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
        });
        setTimeout(() => { if (map) map.invalidateSize(); }, 200);
    }
    async function reverseGeocode(lat, lng) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                let street = addr.road || '';
                let houseNumber = addr.house_number || '';
                let neighborhood = addr.suburb || addr.neighbourhood || '';
                let fullStreet = street.trim();
                if (houseNumber) {
                    fullStreet += ` ${houseNumber}`;
                } else if (data.display_name) {
                    const streetRegex = new RegExp(`^${escapeRegExp(street)}\\s*(\\d+[A-Za-z]?)?\\b`, 'i');
                    const match = data.display_name.match(streetRegex);
                    if (match && match[1]) {
                        fullStreet = `${street} ${match[1]}`;
                    } else {
                        const genericNumberMatch = data.display_name.match(/\b(\d+[A-Za-z]?)\b/);
                        if (genericNumberMatch && street && !street.includes(genericNumberMatch[1])) {
                            fullStreet = `${street} ${genericNumberMatch[1]}`;
                        }
                    }
                }
                streetInput.value = fullStreet.trim();
                neighborhoodInput.value = neighborhood;
                cityInput.value = addr.city || addr.town || addr.village || '';
                stateInput.value = addr.state || '';
                postalCodeInput.value = addr.postcode || '';
            } else {
                streetInput.value = '';
                neighborhoodInput.value = '';
                cityInput.value = '';
                stateInput.value = '';
                postalCodeInput.value = '';
                showNotification('No se pudo obtener la dirección desde el mapa.', true);
            }
        } catch (error) {
            showNotification('Error de conexión al servicio de geocodificación inversa.', true);
        }
    }
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    async function geocodeAddress() {
        const address = `${streetInput.value}, ${neighborhoodInput.value}, ${cityInput.value}, ${stateInput.value}, ${postalCodeInput.value}`;
        if (address.trim().length < 10) return;
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            const response = await fetch(url);
            const results = await response.json();
            if (results && results.length > 0) {
                const { lat, lon } = results[0];
                const newPosition = L.latLng(lat, lon);
                marker.setLatLng(newPosition);
                map.setView(newPosition, 16);
            } else {
                showNotification('No se pudo ubicar la dirección en el mapa con los datos proporcionados.', true);
            }
        } catch (error) {
            showNotification('Error de conexión al servicio de geocodificación.', true);
        }
    }
    [streetInput, neighborhoodInput, cityInput, stateInput, postalCodeInput].forEach(input => {
        input.addEventListener('blur', () => { geocodeAddress(); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                geocodeAddress();
            }
        });
    });
    function openModal(lat = 19.4326, lng = -99.1332) {
        addressModal.classList.add('show');
        setTimeout(() => { initMap(lat, lng); }, 50);
    }
    function closeModal() {
        addressModal.classList.remove('show');
        addressForm.reset();
        addressIdInput.value = '';
        if (map) {
            map.remove();
            map = null;
        }
    }
    if (addAddressBtn) addAddressBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Agregar Nueva Dirección';
        openModal();
    });
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
    if (addressForm) addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addressId = addressIdInput.value;
        const isUpdating = !!addressId;
        const submitBtn = addressForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        const addressData = {
            name: addressNameInput.value,
            street: streetInput.value,
            neighborhood: neighborhoodInput.value,
            city: cityInput.value,
            state: stateInput.value,
            postal_code: postalCodeInput.value,
            references: referencesInput.value,
        };
        const url = isUpdating ? `${BACKEND_URL}/api/addresses/${addressId}` : `${BACKEND_URL}/api/users/${loggedInUser.id}/addresses`;
        const method = isUpdating ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addressData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al guardar la dirección.');
            showNotification(result.message || 'Dirección guardada correctamente.');
            closeModal();
            await loadAddresses();
        } catch (error) {
            showNotification(error.message, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
    async function loadAddresses() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${loggedInUser.id}/addresses`);
            if (!response.ok) throw new Error('No se pudieron cargar las direcciones.');
            const addresses = await response.json();
            addressListContainer.innerHTML = '';
            if (addresses.length === 0) {
                addressListContainer.innerHTML = '<p>Aún no tienes direcciones guardadas. ¡Agrega una para agilizar tus futuros servicios!</p>';
                return;
            }
            addresses.forEach(addr => {
                const card = document.createElement('div');
                card.className = 'address-card slide-up';
                card.innerHTML = `
                <div class="address-card-header">
                <h4><i class="fas fa-map-marker-alt"></i> ${addr.name || 'Dirección sin nombre'}</h4>
                </div>
                <div class="address-card-body">
                <p>${addr.street}, ${addr.neighborhood || ''}</p>
                <p>${addr.city}, ${addr.state || ''} ${addr.postal_code || ''}</p>
                ${addr.references ? `<p class="address-references-text">Ref: ${addr.references}</p>` : ''}
                </div>
                <div class="address-card-actions">
                <button class="btn btn-outline edit-btn" data-id="${addr.id}">Editar</button>
                <button class="btn-tertiary delete-btn" data-id="${addr.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>`;
                addressListContainer.appendChild(card);
            });
        } catch (error) {
            showNotification(error.message, true);
            addressListContainer.innerHTML = '<p>Error al cargar direcciones. Por favor, inténtalo de nuevo.</p>';
        }
    }
    if (addressListContainer) addressListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const id = editBtn.dataset.id;
            try {
                const response = await fetch(`${BACKEND_URL}/api/addresses/${id}`);
                if (!response.ok) throw new Error('No se pudo cargar la dirección para editar.');
                const addressToEdit = await response.json();
                modalTitle.textContent = 'Editar Dirección';
                addressIdInput.value = addressToEdit.id;
                addressNameInput.value = addressToEdit.name || '';
                streetInput.value = addressToEdit.street || '';
                neighborhoodInput.value = addressToEdit.neighborhood || '';
                cityInput.value = addressToEdit.city || '';
                stateInput.value = addressToEdit.state || '';
                postalCodeInput.value = addressToEdit.postal_code || '';
                referencesInput.value = addressToEdit.references || '';
                openModal(addressToEdit.latitude, addressToEdit.longitude);
            } catch (error) {
                showNotification(error.message, true);
            }
        }
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar esta dirección? Esta acción no se puede deshacer.')) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/addresses/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Error al eliminar la dirección.');
                    showNotification(result.message || 'Dirección eliminada con éxito.');
                    await loadAddresses();
                } catch (error) {
                    showNotification(error.message, true);
                }
            }
        }
    });
    const securityForm = document.getElementById('securityForm');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = securityForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Actualizando...';
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;
            if (newPassword !== confirmNewPassword) {
                showNotification('Las nuevas contraseñas no coinciden.', true);
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
            if (newPassword.length < 6) {
                showNotification('La nueva contraseña debe tener al menos 6 caracteres.', true);
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
                return;
            }
            try {
                const response = await fetch(`${BACKEND_URL}/api/users/${loggedInUser.id}/change-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Error al cambiar la contraseña.');
                showNotification(result.message);
                securityForm.reset();
            } catch (error) {
                showNotification(error.message, true);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
    const notificationsForm = document.getElementById('notificationsForm');
    const toggle2FABtn = document.getElementById('toggle2FABtn');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('La funcionalidad de guardar preferencias de notificación aún no está implementada.', false);
        });
    }
    if (toggle2FABtn) {
        toggle2FABtn.addEventListener('click', () => {
            showNotification('La autenticación de dos factores aún no está implementada.', false);
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('greenhaulUser');
            window.location.href = 'index.html';
        });
    }
    async function fetchUserData(userId) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${userId}`);
            if (!response.ok) throw new Error('Usuario no encontrado en el servidor.');
            const result = await response.json();
            userData = result.user;
            localStorage.setItem('greenhaulUser', JSON.stringify(userData));
            updateSidebar(userData);
            activateSection('dashboard');
        } catch (error) {
            showNotification(`Error al cargar el perfil: ${error.message}. Por favor, intenta de nuevo.`, true);
        }
    }
    fetchUserData(loggedInUser.id);
}

// --- EJEMPLO DE USO DEL FIX EN TU PAGO/ORDEN ---
function enviarPagoOMiOrden() {
    const rentalDates = getRentalDatesForBackend();
    fetch(`${BACKEND_URL}/api/mercadopago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalDates })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) showNotification(data.message, 'success');
    })
    .catch(err => {
        showNotification('Error al procesar el pago.', 'error');
    });
}