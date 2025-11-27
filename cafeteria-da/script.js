// Base de datos simulada en memoria
let products = [
    { id: 1, name: 'Café Americano', description: 'Café suave y aromático', price: 5000, stock: 50 },
    { id: 2, name: 'Capuchino', description: 'Espresso con leche espumada', price: 7000, stock: 40 },
    { id: 3, name: 'Latte', description: 'Café con leche cremosa', price: 7500, stock: 35 },
    { id: 4, name: 'Mocachino', description: 'Café con chocolate', price: 8000, stock: 30 },
    { id: 5, name: 'Croissant', description: 'Croissant de mantequilla', price: 4000, stock: 25 },
    { id: 6, name: 'Tostada Francesa', description: 'Pan con canela', price: 6000, stock: 20 }
];

let cart = [];
let orders = [];
let selectedPayment = '';

// Renderizar productos
function renderProducts() {
    const container = document.getElementById('products-list');
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <div class="product-price">$${p.price.toLocaleString()}</div>
            <div class="product-stock ${p.stock < 10 ? 'low' : ''}">
                Stock: ${p.stock} unidades
            </div>
            <button class="btn btn-primary" onclick="addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
                ${p.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
            </button>
        </div>
    `).join('');
}

// Agregar al carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartDisplay();
}

// Actualizar visualización del carrito
function updateCartDisplay() {
    const container = document.getElementById('cart-items');
    const countEl = document.getElementById('cart-count');
    
    countEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Tu carrito está vacío</p></div>';
        document.getElementById('cart-summary').style.display = 'none';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h3>${item.name}</h3>
                <p>$${item.price.toLocaleString()} x ${item.quantity}</p>
            </div>
            <div class="quantity-control">
                <button class="btn btn-primary" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="btn btn-primary" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-danger" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = subtotal.toLocaleString();
    document.getElementById('tax').textContent = tax.toLocaleString();
    document.getElementById('total').textContent = total.toLocaleString();
    document.getElementById('checkout-total').textContent = total.toLocaleString();
    document.getElementById('cart-summary').style.display = 'block';
}

// Actualizar cantidad
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else if (item.quantity > product.stock) {
            item.quantity = product.stock;
            alert('No hay suficiente stock disponible');
        }
        updateCartDisplay();
    }
}

// Remover del carrito
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// Mostrar checkout
function showCheckout() {
    if (cart.length === 0) return;
    document.getElementById('checkout-modal').style.display = 'block';
}

// Cerrar checkout
function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// Seleccionar método de pago
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    event.target.closest('.payment-method').classList.add('selected');
}

// Confirmar pedido
function confirmOrder() {
    const name = document.getElementById('customer-name').value;
    const address = document.getElementById('customer-address').value;
    const phone = document.getElementById('customer-phone').value;

    if (!name || !address || !phone) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (!selectedPayment) {
        alert('Por favor selecciona un método de pago');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;

    const order = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        customer: { name, address, phone },
        items: [...cart],
        payment: selectedPayment,
        subtotal,
        tax,
        total,
        status: 'En preparación'
    };

    // Actualizar inventario
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });

    orders.push(order);
    cart = [];
    selectedPayment = '';
    
    // Limpiar formulario
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-phone').value = '';
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    updateCartDisplay();
    renderProducts();
    closeCheckout();
    
    alert('¡Pedido confirmado! Número de orden: ' + order.id);
    showSection('pedidos');
}

// Renderizar pedidos
function renderOrders() {
    const container = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tienes pedidos aún</p></div>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div>
                    <h3>Pedido #${order.id}</h3>
                    <p>${order.date}</p>
                </div>
                <span class="badge badge-warning">${order.status}</span>
            </div>
            <p><strong>Cliente:</strong> ${order.customer.name}</p>
            <p><strong>Dirección:</strong> ${order.customer.address}</p>
            <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
            <p><strong>Método de pago:</strong> ${order.payment}</p>
            <hr>
            <h4>Productos:</h4>
            ${order.items.map(item => `
                <p>${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}</p>
            `).join('')}
            <hr>
            <h3>Total: $${order.total.toLocaleString()}</h3>
        </div>
    `).reverse().join('');
}

// Renderizar inventario
function renderInventory() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = products.map(p => `
        <tr>
            <td><strong>${p.name}</strong><br><small>${p.description}</small></td>
            <td>$${p.price.toLocaleString()}</td>
            <td><span class="${p.stock < 10 ? 'product-stock low' : 'product-stock'}">${p.stock}</span></td>
            <td>
                <button class="btn btn-primary" onclick="addStock(${p.id}, 10)">+10</button>
                <button class="btn btn-danger" onclick="removeProduct(${p.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Agregar stock
function addStock(productId, amount) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.stock += amount;
        renderInventory();
        renderProducts();
    }
}

// Eliminar producto
function removeProduct(productId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        products = products.filter(p => p.id !== productId);
        renderInventory();
        renderProducts();
    }
}

// Mostrar formulario de agregar producto
function showAddProductForm() {
    document.getElementById('add-product-form').style.display = 'block';
}

function hideAddProductForm() {
    document.getElementById('add-product-form').style.display = 'none';
}

// Agregar nuevo producto
function addNewProduct() {
    const name = document.getElementById('new-product-name').value;
    const desc = document.getElementById('new-product-desc').value;
    const price = parseInt(document.getElementById('new-product-price').value);
    const stock = parseInt(document.getElementById('new-product-stock').value);

    if (!name || !desc || !price || !stock) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (price <= 0 || stock < 0) {
        alert('El precio debe ser mayor a 0 y el stock no puede ser negativo');
        return;
    }

    const newProduct = {
        id: Date.now(),
        name,
        description: desc,
        price,
        stock
    };

    products.push(newProduct);
    renderProducts();
    renderInventory();
    hideAddProductForm();
    
    // Limpiar formulario
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-desc').value = '';
    document.getElementById('new-product-price').value = '';
    document.getElementById('new-product-stock').value = '';
    
    alert('Producto agregado exitosamente');
}

// Cambiar de sección
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    event.target.classList.add('active');

    if (sectionName === 'pedidos') renderOrders();
    if (sectionName === 'inventario') renderInventory();
}

// Inicializar aplicación
window.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    updateCartDisplay();
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('checkout-modal');
    if (event.target === modal) {
        closeCheckout();
    }
}