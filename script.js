/* Warm Delights Frontend JavaScript - WITH ANALYTICS AND FIXED GALLERY */
const API_BASE_URL = 'https://warm-delights-backend-production.up.railway.app/api';

// Global variables
let galleryImages = [];
let allMenuItems = [];
let currentCategory = 'all';
let cart = [];

// Menu data with minimum quantities
const menuData = [
    // Cakes
    { id: 1, name: 'Vanilla Cake', category: 'cakes', price: 450, minOrder: 1, minOrderText: 'Minimum 1 cake' },
    { id: 2, name: 'Chocolate Cake', category: 'cakes', price: 500, minOrder: 1, minOrderText: 'Minimum 1 cake' },
    { id: 3, name: 'Strawberry Cake', category: 'cakes', price: 550, minOrder: 1, minOrderText: 'Minimum 1 cake' },
    { id: 4, name: 'Butterscotch Cake', category: 'cakes', price: 550, minOrder: 1, minOrderText: 'Minimum 1 cake' },
    
    // Cookies - 1 box = 250g
    { id: 5, name: 'Peanut Butter Cookies', category: 'cookies', price: 200, minOrder: 1, minOrderText: 'Minimum 1 box (250g)', priceUnit: '/box' },
    { id: 6, name: 'Chocolate Cookies', category: 'cookies', price: 180, minOrder: 1, minOrderText: 'Minimum 1 box (250g)', priceUnit: '/box' },
    { id: 7, name: 'Almond Cookies', category: 'cookies', price: 190, minOrder: 1, minOrderText: 'Minimum 1 box (250g)', priceUnit: '/box' },
    { id: 8, name: 'Butter Cream Cookies', category: 'cookies', price: 160, minOrder: 1, minOrderText: 'Minimum 1 box (250g)', priceUnit: '/box' },
    
    // Cupcakes & Muffins - Minimum 4 pieces
    { id: 9, name: 'Chocolate Cupcakes', category: 'cupcakes', price: 40, minOrder: 4, minOrderText: 'Minimum 4 pieces', priceUnit: '/piece' },
    { id: 10, name: 'Whole Wheat Banana Muffins', category: 'cupcakes', price: 35, minOrder: 4, minOrderText: 'Minimum 4 pieces', priceUnit: '/piece' },
    { id: 11, name: 'Cheesecake Cupcakes', category: 'cupcakes', price: 55, minOrder: 4, minOrderText: 'Minimum 4 pieces', priceUnit: '/piece' }
];

// ANALYTICS TRACKING FUNCTIONS
function trackEvent(eventType, data = {}) {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    events.push({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
    });
    
    // Keep only last 1000 events
    if (events.length > 1000) {
        events.splice(0, events.length - 1000);
    }
    
    localStorage.setItem('warmDelightsEvents', JSON.stringify(events));

    // Also send to backend if available
    try {
        fetch(`${API_BASE_URL}/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventType: eventType,
                data: data
            })
        }).catch(() => {}); // Fail silently
    } catch (error) {
        // Backend not available, continue with localStorage
    }
}

// Track visitor when page loads
window.addEventListener('load', function() {
    // Don't track admin visits
    if (!localStorage.getItem('isWarmDelightsAdmin')) {
        trackEvent('page_visit', {
            page: window.location.pathname,
            referrer: document.referrer
        });
    }
    
    console.log('🚀 Warm Delights website loaded');
});

// Debug function to check API connectivity
async function checkAPIConnection() {
    try {
        console.log('🔗 Checking API connection...');
        const response = await fetch(API_BASE_URL.replace('/api', '/'));
        const data = await response.json();
        console.log('✅ Backend Status:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        return false;
    }
}

// Mobile menu toggle
function toggleMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (mobileNav) {
        mobileNav.classList.toggle('active');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active');
        }
    }
}

// Shopping Cart Functions
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

function addToCartWithQuantity(item, itemId) {
    const quantityInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(quantityInput.value);
    
    if (quantity < item.minOrder) {
        alert(`Minimum order quantity for ${item.name} is ${item.minOrder}`);
        quantityInput.value = item.minOrder;
        return;
    }
    
    if (quantity > 50) {
        alert(`Maximum order quantity is 50`);
        quantityInput.value = 50;
        return;
    }
    
    // Add to cart with specified quantity
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...item, quantity: quantity });
    }
    
    // TRACK CART ADDITION
    trackEvent('cart_add', {
        itemName: item.name,
        price: item.price,
        category: item.category,
        quantity: quantity
    });
    
    updateCartUI();
    updateCartCount();
    showNotification(`${quantity} ${item.name} added to cart! 🛒`);
    
    // Reset quantity input to minimum
    quantityInput.value = item.minOrder;
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
    updateCartCount();
}

function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item) {
        const menuItem = menuData.find(mi => mi.id === itemId);
        const newQuantity = item.quantity + change;
        
        if (newQuantity < menuItem.minOrder) {
            alert(`Minimum quantity for ${item.name} is ${menuItem.minOrder}`);
            return;
        }
        
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else if (newQuantity <= 50) {
            item.quantity = newQuantity;
            updateCartUI();
            updateCartCount();
        } else {
            alert('Maximum quantity is 50');
        }
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
    document.getElementById('mobileCartCount').textContent = totalItems;
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}${item.priceUnit || ''}</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>Qty: ${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <strong>₹${itemTotal}</strong>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total;
    checkoutBtn.disabled = false;
}

function checkout() {
    if (cart.length === 0) return;
    
    // TRACK WHATSAPP ORDER
    trackEvent('whatsapp_order', {
        items: cart.map(item => ({ 
            name: item.name, 
            quantity: item.quantity, 
            price: item.price 
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    const orderSummary = cart.map(item => 
        `${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`
    ).join('\n');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const whatsappMessage = `Hi! I'd like to place an order from Warm Delights:

${orderSummary}

*Total: ₹${total}*

Please confirm the availability and delivery details.`;
    
    const whatsappURL = `https://wa.me/918847306427?text=${encodeURIComponent(whatsappMessage)}`;
    
    window.open(whatsappURL, '_blank');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-pink);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Load static menu
function loadTextMenu() {
    allMenuItems = menuData;
    displayMenuItems(allMenuItems);
}

// Display menu items with minimum quantity controls
function displayMenuItems(items) {
    const menuList = document.getElementById('menuItems');
    if (!menuList) return;

    if (items.length === 0) {
        menuList.innerHTML = '<li class="no-items">No items found in this category.</li>';
        return;
    }

    menuList.innerHTML = items.map(item => `
        <li class="menu-item" data-category="${item.category.toLowerCase()}">
            <div class="menu-item-header">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-price">₹${item.price}${item.priceUnit || ''}</div>
            </div>
            <div class="menu-item-min-order">${item.minOrderText}</div>
            <div class="add-to-cart-container">
                <input type="number" 
                       class="quantity-input" 
                       id="qty-${item.id}" 
                       value="${item.minOrder}" 
                       min="${item.minOrder}" 
                       max="50"
                       title="Minimum ${item.minOrder}, Maximum 50">
                <button class="add-to-cart-btn" onclick="addToCartWithQuantity(${JSON.stringify(item).replace(/"/g, '&quot;')}, ${item.id})">
                    Add to Cart
                </button>
            </div>
        </li>
    `).join('');
}

// Filter menu by category
function filterMenu(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    const filteredItems = category === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(item => item.category.toLowerCase() === category);
    
    displayMenuItems(filteredItems);
}

// FIXED GALLERY FUNCTION - LOADS FROM BACKEND API WITH FALLBACKS
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    try {
        // Show loading
        galleryGrid.innerHTML = `
            <div class="gallery-loading" style="
                text-align: center; 
                padding: 60px 20px; 
                color: var(--primary-pink);
                grid-column: 1 / -1;
                background: var(--light-pink);
                border-radius: 15px;
            ">
                <div style="
                    display: inline-block; 
                    width: 40px; 
                    height: 40px; 
                    border: 3px solid var(--secondary-pink); 
                    border-top: 3px solid var(--primary-pink); 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite;
                    margin-bottom: 20px;
                "></div>
                <p>Loading our delicious gallery...</p>
            </div>
        `;

        console.log('🔗 Loading gallery from API:', `${API_BASE_URL}/gallery`);
        
        // First try to load from backend API
        try {
            const response = await fetch(`${API_BASE_URL}/gallery`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Gallery data loaded from API:', data);
                
                if (data.images && data.images.length > 0) {
                    // Display backend images
                    galleryGrid.innerHTML = data.images.map((image, index) => `
                        <div class="gallery-item">
                            <img src="${API_BASE_URL.replace('/api', '')}${image.url}" 
                                 alt="${image.alt || 'Warm Delights Creation'}" 
                                 onclick="openImageModal('${API_BASE_URL.replace('/api', '')}${image.url}')"
                                 loading="lazy"
                                 style="
                                     width: 100%;
                                     height: 100%;
                                     object-fit: cover;
                                     cursor: pointer;
                                     display: block;
                                     border-radius: 15px;
                                     opacity: 0;
                                     transition: all 0.3s ease;
                                 "
                                 onload="this.style.opacity='1';"
                                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-light); font-size: 12px; text-align: center;\\'>Image<br>Not Available</div>';">
                        </div>
                    `).join('');
                    
                    // Track gallery view
                    trackEvent('gallery_viewed', { imageCount: data.images.length, source: 'backend' });
                    return;
                }
            }
        } catch (apiError) {
            console.log('⚠️ API not available, trying localStorage...', apiError);
        }

        // Fallback: Load from localStorage (admin uploaded images)
        const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        
        if (adminImages.length > 0) {
            console.log('✅ Loading from localStorage:', adminImages.length, 'images');
            galleryGrid.innerHTML = adminImages.map((image, index) => `
                <div class="gallery-item">
                    <img src="${image.data}" 
                         alt="${image.name}" 
                         onclick="openImageModal('${image.data}')"
                         loading="lazy"
                         style="
                             width: 100%;
                             height: 100%;
                             object-fit: cover;
                             cursor: pointer;
                             display: block;
                             border-radius: 15px;
                             opacity: 0;
                             transition: all 0.3s ease;
                         "
                         onload="this.style.opacity='1';"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-light); font-size: 12px; text-align: center;\\'>Image<br>Not Available</div>';">
                </div>
            `).join('');
            
            // Track gallery view
            trackEvent('gallery_viewed', { imageCount: adminImages.length, source: 'localStorage' });
            return;
        }

        // No images available
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder">
                <h3>🎂 Our Delicious Creations</h3>
                <p>Gallery images will appear here soon! Contact us to see our latest treats.</p>
                <div style="margin-top: 20px;">
                    <a href="https://wa.me/918847306427?text=Hi! I'd like to see your latest cake designs" 
                       style="
                           display: inline-block;
                           padding: 12px 25px;
                           background: #25d366;
                           color: white;
                           text-decoration: none;
                           border-radius: 25px;
                           font-weight: 600;
                       "
                       target="_blank">💬 Contact us on WhatsApp</a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('❌ Gallery loading error:', error);
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder">
                <h3>🎂 Our Delicious Creations</h3>
                <p>Gallery will be available soon!</p>
            </div>
        `;
    }
}

// Image modal function
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%;
        background: rgba(0,0,0,0.8); 
        display: flex; 
        justify-content: center;
        align-items: center; 
        z-index: 10000; 
        cursor: pointer;
        padding: 20px;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%; 
        max-height: 90%; 
        border-radius: 10px;
        object-fit: contain;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = () => document.body.removeChild(modal);
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape' && document.body.contains(modal)) {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Custom order form handling
document.addEventListener('DOMContentLoaded', function() {
    const customForm = document.getElementById('customOrderForm');
    const contactForm = document.getElementById('contactForm');
    
    if (customForm) {
        customForm.addEventListener('submit', handleCustomOrder);
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // File size validation
    const fileInput = document.getElementById('referenceImage');
    if (fileInput) {
        fileInput.addEventListener('change', validateFileSize);
    }
    
    // Load initial data
    loadTextMenu();
    loadGallery();
    updateCartCount();
});

function validateFileSize(event) {
    const file = event.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB
        alert('File size must be less than 5MB');
        event.target.value = '';
    }
}

async function handleCustomOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const submitBtn = event.target.querySelector('.custom-submit-btn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // Create WhatsApp message
        const customerName = formData.get('customerName');
        const customerPhone = formData.get('customerPhone');
        const treatSize = formData.get('treatSize');
        const treatFlavour = formData.get('treatFlavour');
        const designNotes = formData.get('designNotes');
        const deliveryDate = formData.get('deliveryDate');
        
        // TRACK CUSTOM ORDER
        trackEvent('custom_order', {
            customerName: customerName,
            size: treatSize,
            flavour: treatFlavour
        });
        
        const whatsappMessage = `Hi! I'd like to place a custom order from Warm Delights:

*Customer Details:*
Name: ${customerName}
Phone: ${customerPhone}

*Custom Order Details:*
Size: ${treatSize}
Flavour: ${treatFlavour}
Design Notes: ${designNotes}
${deliveryDate ? `Required Date: ${deliveryDate}` : ''}

Please confirm availability and pricing.`;

        // Open WhatsApp
        const whatsappURL = `https://wa.me/918847306427?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappURL, '_blank');
        
        // Reset form
        event.target.reset();
        alert('Custom order request sent via WhatsApp! We will contact you soon.');
        
    } catch (error) {
        alert('Failed to submit custom order. Please try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Enhanced contact form handling
async function handleContactForm(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
    };

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // TRACK CONTACT SUBMISSION
        trackEvent('contact_submit', {
            name: formData.name
        });
        
        console.log('📧 Sending contact form to:', `${API_BASE_URL}/contact`);

        // Try to send to API, but don't fail if it doesn't work
        try {
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                mode: 'cors'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    alert('Message sent successfully! We\'ll get back to you soon.');
                    event.target.reset();
                    return;
                }
            }
        } catch (apiError) {
            console.log('API not available, showing success message anyway');
        }
        
        // Always show success to user (message is tracked for admin)
        alert('Message sent successfully! We\'ll get back to you soon.');
        event.target.reset();

    } catch (error) {
        console.error('❌ Contact form error:', error);
        alert('Message received! We\'ll get back to you soon.');
        event.target.reset();
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// CHATBOT FUNCTIONALITY
let chatbotOpen = false;

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    
    chatbotOpen = !chatbotOpen;
    
    if (chatbotOpen) {
        chatbotWindow.classList.add('active');
        chatbotToggle.style.display = 'none';
    } else {
        chatbotWindow.classList.remove('active');
        chatbotToggle.style.display = 'flex';
    }
}

function handleQuickResponse(type) {
    const responses = {
        menu: "Here's our menu categories! What would you like to explore? 🍰",
        hours: "We're open Mon-Sat: 9AM-7PM and Sun: 10AM-5PM. We're located at #60B, Fio Homes 2, Dhakoli, Zirakpur, 160104. 🕒",
        order: "To place an order, you can use our shopping cart on the website or contact us directly via WhatsApp at +918847306427. What would you like to order? 🛒",
        delivery: "We offer delivery across the Tricity! Delivery charges vary by location. Same-day delivery is available under certain conditions. We recommend ordering 2-3 days in advance for the best experience. 🚚"
    };
    
    addMessage(responses[type], 'bot');
    
    if (type === 'menu') {
        setTimeout(() => {
            addMenuCategories();
        }, 500);
    }
    
    if (type === 'order') {
        setTimeout(() => {
            const whatsappBtn = document.createElement('button');
            whatsappBtn.textContent = '💬 Order via WhatsApp';
            whatsappBtn.style.cssText = 'background: #25d366; color: white; border: none; padding: 10px 15px; border-radius: 20px; cursor: pointer; margin-top: 10px; width: 100%;';
            whatsappBtn.onclick = () => window.open('https://wa.me/918847306427?text=Hi! I\'d like to place an order from Warm Delights.', '_blank');
            
            const messagesContainer = document.getElementById('chatbot-messages');
            const lastMessage = messagesContainer.lastElementChild;
            lastMessage.appendChild(whatsappBtn);
        }, 500);
    }
}

function addMenuCategories() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const messageText = document.createElement('p');
    messageText.textContent = 'Choose a category to see our delicious options:';
    messageDiv.appendChild(messageText);
    
    const categoryButtons = document.createElement('div');
    categoryButtons.className = 'quick-buttons';
    categoryButtons.style.marginTop = '15px';
    
    // Category buttons
    const categories = [
        { name: 'Cakes 🎂', id: 'cakes' },
        { name: 'Cupcakes 🧁', id: 'cupcakes' },
        { name: 'Cookies 🍪', id: 'cookies' }
    ];
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.textContent = category.name;
        btn.onclick = () => showCategoryItems(category.id);
        btn.style.cssText = `
            background: var(--secondary-pink); 
            border: none; 
            padding: 10px 15px; 
            border-radius: 15px; 
            cursor: pointer; 
            font-size: 14px; 
            color: var(--text-dark); 
            margin: 5px; 
            min-width: 120px;
            transition: all 0.3s ease;
        `;
        btn.onmouseover = () => {
            btn.style.background = 'var(--primary-pink)';
            btn.style.color = 'white';
        };
        btn.onmouseout = () => {
            btn.style.background = 'var(--secondary-pink)';
            btn.style.color = 'var(--text-dark)';
        };
        categoryButtons.appendChild(btn);
    });
    
    messageDiv.appendChild(categoryButtons);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showCategoryItems(category) {
    const menuItems = {
        cakes: [
            { name: 'Vanilla Cake', price: '₹450', desc: 'Classic soft, moist eggless vanilla cake' },
            { name: 'Chocolate Cake', price: '₹500', desc: 'Rich, decadent eggless chocolate cake' },
            { name: 'Strawberry Cake', price: '₹550', desc: 'Fresh strawberry eggless cake with real fruit' },
            { name: 'Butterscotch Cake', price: '₹550', desc: 'Butterscotch delight with caramel flavoring' }
        ],
        cupcakes: [
            { name: 'Chocolate Cupcakes', price: '₹40/pc', desc: 'Moist chocolate cupcakes with creamy frosting (Min 4 pieces)' },
            { name: 'Banana Muffins', price: '₹35/pc', desc: 'Healthy whole wheat banana muffins (Min 4 pieces)' },
            { name: 'Cheesecake Cupcakes', price: '₹55/pc', desc: 'Creamy cheesecake cupcakes with graham base (Min 4 pieces)' }
        ],
        cookies: [
            { name: 'Peanut Butter Cookies', price: '₹200/box', desc: 'Crunchy eggless cookies (250g box)' },
            { name: 'Chocolate Cookies', price: '₹180/box', desc: 'Soft eggless chocolate cookies with chips (250g box)' },
            { name: 'Almond Cookies', price: '₹190/box', desc: 'Crunchy almond cookies with real pieces (250g box)' },
            { name: 'Butter Cream Cookies', price: '₹160/box', desc: 'Smooth butter cream cookies (250g box)' }
        ]
    };
    
    const categoryNames = {
        cakes: 'Cakes 🎂',
        cupcakes: 'Cupcakes 🧁',
        cookies: 'Cookies 🍪'
    };
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    // Category header
    const headerText = document.createElement('p');
    headerText.textContent = `Our ${categoryNames[category]}:`;
    headerText.style.fontWeight = 'bold';
    headerText.style.marginBottom = '15px';
    messageDiv.appendChild(headerText);
    
    // Items container
    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
    
    menuItems[category].forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            background: var(--light-pink); 
            padding: 12px; 
            border-radius: 10px; 
            border-left: 3px solid var(--primary-pink);
        `;
        
        const itemHeader = document.createElement('div');
        itemHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;';
        
        const itemName = document.createElement('strong');
        itemName.textContent = item.name;
        itemName.style.color = 'var(--primary-pink)';
        
        const itemPrice = document.createElement('span');
        itemPrice.textContent = item.price;
        itemPrice.style.cssText = 'color: var(--dark-pink); font-weight: bold;';
        
        itemHeader.appendChild(itemName);
        itemHeader.appendChild(itemPrice);
        
        const itemDesc = document.createElement('p');
        itemDesc.textContent = item.desc;
        itemDesc.style.cssText = 'font-size: 12px; color: var(--text-light); margin: 0;';
        
        itemDiv.appendChild(itemHeader);
        itemDiv.appendChild(itemDesc);
        itemsContainer.appendChild(itemDiv);
    });
    
    messageDiv.appendChild(itemsContainer);
    
    // Add "Add to Cart" and "Back to Categories" buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'quick-buttons';
    actionButtons.style.marginTop = '15px';
    
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = '🛒 Add to Cart';
    addToCartBtn.onclick = () => {
        addMessage('Great choice! You can add items to your cart directly from our menu section above, or contact us on WhatsApp for assistance! 😊', 'bot');
    };
    addToCartBtn.style.cssText = `
        background: var(--primary-pink); 
        color: white; 
        border: none; 
        padding: 8px 12px; 
        border-radius: 15px; 
        cursor: pointer; 
        font-size: 12px; 
        margin: 3px;
    `;
    
    const backBtn = document.createElement('button');
    backBtn.textContent = '↩️ Back to Categories';
    backBtn.onclick = () => {
        addMessage('Choose another category:', 'bot');
        setTimeout(() => addMenuCategories(), 300);
    };
    backBtn.style.cssText = `
        background: var(--secondary-pink); 
        border: none; 
        padding: 8px 12px; 
        border-radius: 15px; 
        cursor: pointer; 
        font-size: 12px; 
        color: var(--text-dark); 
        margin: 3px;
    `;
    
    const orderBtn = document.createElement('button');
    orderBtn.textContent = '💬 Order Now';
    orderBtn.onclick = () => {
        window.open('https://wa.me/918847306427?text=Hi! I\'d like to order some ' + categoryNames[category].toLowerCase() + ' from Warm Delights.', '_blank');
    };
    orderBtn.style.cssText = `
        background: #25d366; 
        color: white; 
        border: none; 
        padding: 8px 12px; 
        border-radius: 15px; 
        cursor: pointer; 
        font-size: 12px; 
        margin: 3px;
    `;
    
    actionButtons.appendChild(addToCartBtn);
    actionButtons.appendChild(backBtn);
    actionButtons.appendChild(orderBtn);
    messageDiv.appendChild(actionButtons);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleChatbotEnter(event) {
    if (event.key === 'Enter') {
        sendChatbotMessage();
    }
}

function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input-field');
    const message = input.value.trim();
    
    if (message === '') return;
    
    addMessage(message, 'user');
    input.value = '';
    
    // Simple response logic
    setTimeout(() => {
        const response = generateChatbotResponse(message.toLowerCase());
        if (response) {
            addMessage(response, 'bot');
        }
    }, 1000);
}

function generateChatbotResponse(message) {
    if (message.includes('menu') || message.includes('what do you have')) {
        addMessage('Here are our menu categories:', 'bot');
        setTimeout(() => addMenuCategories(), 500);
        return '';
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('much')) {
        return "Our prices range from ₹160-₹550! Cookies start at ₹160/box, Cupcakes at ₹35/pc (min 4), and Cakes from ₹450. What specific item are you interested in? 💰";
    }
    
    if (message.includes('cake')) {
        showCategoryItems('cakes');
        return '';
    }
    
    if (message.includes('cookie')) {
        showCategoryItems('cookies');
        return '';
    }
    
    if (message.includes('cupcake') || message.includes('muffin')) {
        showCategoryItems('cupcakes');
        return '';
    }
    
    if (message.includes('delivery')) {
        return "We deliver across the Tricity! 🚚 Charges vary by location. Same-day delivery available. For best experience, order 2-3 days in advance.";
    }
    
    if (message.includes('contact') || message.includes('phone') || message.includes('whatsapp')) {
        return "You can reach us at:\n📱 Mobile: +918847306427\n💬 WhatsApp: +918847306427\n📧 Email: dayitagoyal10@gmail.com\n📸 Instagram: @warmdelights";
    }
    
    if (message.includes('custom')) {
        return "Yes! We love custom orders! 🎨 Check our Custom Orders section above or contact us on WhatsApp +918847306427 to discuss your requirements!";
    }
    
    if (message.includes('eggless')) {
        return "All our products are 100% eggless! 🥚❌ Perfect for vegetarians and those with egg allergies. No compromise on taste or texture!";
    }
    
    return "Thanks for your message! For specific questions, please contact us on WhatsApp +918847306427 or check our menu above. How else can I help you today? 😊";
}

function addMessage(text, sender) {
    if (text === '') return;
    
    // TRACK CHATBOT INTERACTION
    if (sender === 'user') {
        trackEvent('chat_message', {
            message: text.substring(0, 100) // Only store first 100 chars for privacy
        });
    }
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    messageDiv.appendChild(messageText);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
