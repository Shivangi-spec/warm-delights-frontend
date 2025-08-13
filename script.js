// Global variables
let menuItems = [];
let cart = [];
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    updateCartDisplay();
    setMinDeliveryDate();
    
    // Form submissions
    document.getElementById('contact-form').addEventListener('submit', handleContactForm);
    document.getElementById('order-form').addEventListener('submit', handleOrderForm);
});

// Load menu items from backend
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        menuItems = await response.json();
        displayMenuItems(menuItems);
    } catch (error) {
        console.error('Error loading menu items:', error);
        document.getElementById('menu-grid').innerHTML = '<div class="loading">Error loading menu items. Please try again later.</div>';
    }
}

// Display menu items
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menu-grid');
    
    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="loading">No items found.</div>';
        return;
    }
    
    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item" data-category="${item.category}">
            <img src="${API_BASE_URL}${item.image}" alt="${item.name}" onerror="this.src='${API_BASE_URL}/placeholder/300/200'">
            <h3>${item.name}</h3>
            <div class="price">$${item.price}</div>
            <p>${item.description}</p>
            <div class="menu-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span id="quantity-${item.id}">1</span>
                    <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Filter menu items
function filterMenu(category) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    displayMenuItems(filteredItems);
}

// Change quantity
function changeQuantity(itemId, change) {
    const quantityElement = document.getElementById(`quantity-${itemId}`);
    let quantity = parseInt(quantityElement.textContent) + change;
    quantity = Math.max(1, quantity);
    quantityElement.textContent = quantity;
}

// Add item to cart
function addToCart(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
    
    const existingCartItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingCartItem) {
        existingCartItem.quantity += quantity;
    } else {
        cart.push({
            ...item,
            quantity: quantity
        });
    }
    
    updateCartDisplay();
    
    // Reset quantity to 1
    document.getElementById(`quantity-${itemId}`).textContent = '1';
    
    // Show feedback
    showNotification('Item added to cart!');
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    displayCartItems();
}

// Update cart display
function updateCartDisplay() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = cartCount;
    
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = cart.length === 0;
}

// Toggle cart modal
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
        displayCartItems();
    }
}

// Display cart items
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                <button onclick="removeFromCart(${item.id})" style="background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; cursor: pointer; margin-top: 0.5rem;">Remove</button>
            </div>
        </div>
    `).join('');
    
    cartTotal.textContent = total.toFixed(2);
}

// Show order form
function showOrderForm() {
    document.getElementById('cart-modal').style.display = 'none';
    document.getElementById('order-modal').style.display = 'block';
    displayOrderSummary();
}

// Hide order form
function hideOrderForm() {
    document.getElementById('order-modal').style.display = 'none';
}

// Display order summary
function displayOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    const orderTotal = document.getElementById('order-total');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    orderSummary.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    orderTotal.textContent = total.toFixed(2);
}

// Set minimum delivery date (24 hours from now)
function setMinDeliveryDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    document.getElementById('delivery-date').min = minDate;
}

// Handle contact form submission
async function handleContactForm(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Message sent successfully!');
            document.getElementById('contact-form').reset();
        } else {
            showNotification('Failed to send message. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

// Handle order form submission
async function handleOrderForm(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('customerName', document.getElementById('customer-name').value);
    formData.append('email', document.getElementById('customer-email').value);
    formData.append('phone', document.getElementById('customer-phone').value);
    formData.append('deliveryDate', document.getElementById('delivery-date').value);
    formData.append('deliveryAddress', document.getElementById('delivery-address').value);
    formData.append('specialInstructions', document.getElementById('special-instructions').value);
    formData.append('items', JSON.stringify(cart));
    
    const referenceImage = document.getElementById('reference-image').files[0];
    if (referenceImage) {
        formData.append('referenceImage', referenceImage);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear cart
            cart = [];
            updateCartDisplay();
            
            // Show confirmation
            document.getElementById('order-id').textContent = result.orderId;
            hideOrderForm();
            showConfirmation();
        } else {
            showNotification('Failed to place order. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order. Please try again.', 'error');
    }
}

// Show confirmation modal
function showConfirmation() {
    document.getElementById('confirmation-modal').style.display = 'block';
}

// Hide confirmation modal
function hideConfirmation() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
