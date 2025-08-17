// Warm Delights Frontend JavaScript - WITH SHOPPING CART
const API_BASE_URL = 'https://warm-delights-backend-production.up.railway.app/api';

// Global variables
let galleryImages = [];
let allMenuItems = [];
let currentCategory = 'all';
let cart = [];

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

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartUI();
    updateCartCount();
    
    // Show success message
    showNotification(`${item.name} added to cart! 🛒`);
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
    updateCartCount();
}

function updateQuantity(itemId, change) {
    const item = cart.find(cartItem => cartItem.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartUI();
            updateCartCount();
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
                    <p>₹${item.price}${item.priceUnit ? '/' + item.priceUnit : ''}</p>
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

// Enhanced load menu with better error handling
async function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    try {
        showLoading(menuGrid);
        
        console.log('🍰 Loading menu from:', `${API_BASE_URL}/menu`);
        
        const response = await fetch(`${API_BASE_URL}/menu`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        console.log('📡 Menu response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        allMenuItems = await response.json();
        console.log('✅ Menu loaded:', allMenuItems.length, 'items');
        
        displayMenuItems(allMenuItems);
        setupCategoryFilters();
        
    } catch (error) {
        console.error('❌ Menu loading error:', error);
        
        menuGrid.innerHTML = `
            <div class="menu-error" style="
                grid-column: 1 / -1; 
                text-align: center; 
                padding: 40px; 
                background: #ffe6e6; 
                border-radius: 10px; 
                border: 2px solid #ff9999;
            ">
                <h3 style="color: #cc0000; margin-bottom: 10px;">❌ Unable to load menu</h3>
                <p style="margin-bottom: 10px;"><strong>Error:</strong> ${error.message}</p>
                <p style="margin-bottom: 15px;">Our delicious creations will be showcased here.</p>
                <button onclick="loadMenu()" style="
                    padding: 10px 20px; 
                    background: #e8a5b7; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    font-size: 14px;
                ">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

// Display menu items with Add to Cart buttons
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="no-items">No items found in this category.</div>';
        return;
    }

    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item" data-category="${item.category.toLowerCase()}">
            <img src="${API_BASE_URL.replace('/api', '')}${item.image}" 
                 alt="${item.name}" 
                 class="menu-image" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'><rect width=\\'300\\' height=\\'200\\' fill=\\'%23f4c2c2\\'/><text x=\\'150\\' y=\\'100\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23d67b8a\\' font-family=\\'Arial\\' font-size=\\'20\\'>${item.name}</text></svg>'"
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px;">
            <h3>${item.name}</h3>
            <p class="description">${item.description}</p>
            <div class="menu-item-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                <span class="price">₹${item.price}${item.priceUnit ? '/' + item.priceUnit : ''}</span>
                ${item.eggless ? '<span class="eggless-badge" style="background: #4caf50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">🥚 Eggless</span>' : ''}
            </div>
            ${item.customizable ? '<p class="customizable" style="margin-top: 8px; color: #e8a5b7; font-weight: bold;">✨ Customizable</p>' : ''}
            <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                Add to Cart 🛒
            </button>
        </div>
    `).join('');
}

// Setup category filters
function setupCategoryFilters() {
    const menuSection = document.querySelector('.menu .container');
    const existingFilters = menuSection.querySelector('.category-filters');
    
    if (existingFilters) {
        existingFilters.remove();
    }

    const categories = ['all', ...new Set(allMenuItems.map(item => item.category.toLowerCase()))];
    
    const filtersHTML = `
        <div class="category-filters" style="text-align: center; margin: 30px 0;">
            ${categories.map(category => `
                <button class="filter-btn ${category === currentCategory ? 'active' : ''}" 
                        onclick="filterMenu('${category}')"
                        style="
                            margin: 5px; 
                            padding: 8px 16px; 
                            border: 2px solid #e8a5b7; 
                            background: ${category === currentCategory ? '#e8a5b7' : 'white'}; 
                            color: ${category === currentCategory ? 'white' : '#e8a5b7'}; 
                            border-radius: 20px; 
                            cursor: pointer; 
                            font-weight: 600;
                            transition: all 0.3s ease;
                        "
                        onmouseover="if (!this.classList.contains('active')) { this.style.background = '#f4c2c2'; }"
                        onmouseout="if (!this.classList.contains('active')) { this.style.background = 'white'; }">
                    ${category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            `).join('')}
        </div>
    `;
    
    const menuTitle = menuSection.querySelector('h2');
    menuTitle.insertAdjacentHTML('afterend', filtersHTML);
}

// Filter menu by category
function filterMenu(category) {
    currentCategory = category;
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
        btn.style.color = '#e8a5b7';
        
        if (btn.textContent.toLowerCase() === category || (category === 'all' && btn.textContent.toLowerCase() === 'all')) {
            btn.classList.add('active');
            btn.style.background = '#e8a5b7';
            btn.style.color = 'white';
        }
    });

    const filteredItems = category === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(item => item.category.toLowerCase() === category);
    
    displayMenuItems(filteredItems);
}

// Load gallery images
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    try {
        console.log('🖼️ Loading gallery from:', `${API_BASE_URL}/gallery`);
        
        const response = await fetch(`${API_BASE_URL}/gallery`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        console.log('📡 Gallery response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const images = await response.json();
        console.log('✅ Gallery loaded:', images.length, 'images');
        
        if (images.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-placeholder">
                    <h3>🎂 Our Delicious Creations</h3>
                    <p>Here you can see some of our beautiful baked creations!</p>
                </div>
            `;
            return;
        }

        // Display uploaded images
        galleryGrid.innerHTML = images.map(image => `
            <div class="gallery-item">
                <img src="${API_BASE_URL.replace('/api', '')}${image.url}" 
                     alt="${image.originalName}" 
                     onclick="openImageModal('${API_BASE_URL.replace('/api', '')}${image.url}')"
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
            </div>
        `).join('');

    } catch (error) {
        console.error('❌ Gallery loading error:', error);
        
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder" style="
                background: #ffe6e6; 
                border: 2px solid #ff9999; 
                padding: 40px; 
                text-align: center; 
                border-radius: 10px;
            ">
                <h3 style="color: #cc0000;">❌ Failed to Load Gallery</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <button onclick="loadGallery()" style="
                    margin-top: 15px; 
                    padding: 8px 16px; 
                    background: #e8a5b7; 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">
                    🔄 Try Again
                </button>
            </div>
        `;
    }
}

// Image modal function
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000; cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 10px;';
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = () => document.body.removeChild(modal);
}

// Enhanced contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Load initial data
    loadMenu();
    loadGallery();
    updateCartCount();
});

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

        console.log('📧 Sending contact form to:', `${API_BASE_URL}/contact`);

        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            mode: 'cors'
        });

        console.log('📡 Contact response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Message sent successfully! We\'ll get back to you soon.');
            event.target.reset();
        } else {
            throw new Error(result.message || 'Failed to send message');
        }

    } catch (error) {
        console.error('❌ Contact form error:', error);
        alert(`Failed to send message: ${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Utility function to show loading state
function showLoading(element) {
    element.innerHTML = `
        <div class="loading" style="
            text-align: center; 
            padding: 40px; 
            color: #e8a5b7;
            grid-column: 1 / -1;
        ">
            <div style="
                display: inline-block; 
                width: 40px; 
                height: 40px; 
                border: 4px solid #f3f3f3; 
                border-top: 4px solid #e8a5b7; 
                border-radius: 50%; 
                animation: spin 2s linear infinite;
                margin-bottom: 15px;
            "></div>
            <p>Loading...</p>
        </div>
    `;
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

// Connection check on page load
window.addEventListener('load', function() {
    console.log('🚀 Warm Delights website loaded');
    console.log('🔗 Backend URL:', API_BASE_URL);
    
    // Show connection status
    checkAPIConnection().then(isConnected => {
        if (isConnected) {
            console.log('✅ Backend connection successful');
        } else {
            console.log('❌ Backend connection failed - some features may not work');
        }
    });
});

// UPDATED CHATBOT FUNCTIONALITY WITH MENU CATEGORIES
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
            { name: 'Chocolate Cupcakes', price: '₹40/pc', desc: 'Moist chocolate cupcakes with creamy frosting' },
            { name: 'Banana Muffins', price: '₹35/pc', desc: 'Healthy whole wheat banana muffins' },
            { name: 'Cheesecake Cupcakes', price: '₹55/pc', desc: 'Creamy cheesecake cupcakes with graham base' }
        ],
        cookies: [
            { name: 'Peanut Butter Cookies', price: '₹50/pc', desc: 'Crunchy eggless peanut butter cookies' },
            { name: 'Chocolate Cookies', price: '₹40/pc', desc: 'Soft eggless chocolate cookies with chips' },
            { name: 'Almond Cookies', price: '₹45/pc', desc: 'Crunchy almond cookies with real pieces' },
            { name: 'Butter Cream Cookies', price: '₹30/pc', desc: 'Smooth butter cream cookies' }
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
        addMessage(response, 'bot');
    }, 1000);
}

function generateChatbotResponse(message) {
    if (message.includes('menu') || message.includes('what do you have')) {
        addMessage('Here are our menu categories:', 'bot');
        setTimeout(() => addMenuCategories(), 500);
        return '';
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('much')) {
        return "Our prices range from ₹30-₹550! Cookies start at ₹30/pc, Cupcakes at ₹35/pc, and Cakes from ₹450. What specific item are you interested in? 💰";
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
        return "We deliver across the Tricity! 🚚 Charges vary by location. Same-day delivery available. For best experience, order 2-3 days in advance. What's your location?";
    }
    
    if (message.includes('contact') || message.includes('phone') || message.includes('whatsapp')) {
        return "You can reach us at:\n📱 Mobile: +918847306427\n💬 WhatsApp: +918847306427\n📧 Email: dayitagoyal10@gmail.com\n📸 Instagram: @warmdelights";
    }
    
    if (message.includes('custom')) {
        return "Yes! We love custom orders! 🎨 We can personalize cakes with custom flavors, designs, and decorations. Contact us on WhatsApp +918847306427 to discuss your special requirements!";
    }
    
    if (message.includes('eggless')) {
        return "All our products are 100% eggless! 🥚❌ Perfect for vegetarians and those with egg allergies. No compromise on taste or texture!";
    }
    
    return "Thanks for your message! For specific questions, please contact us on WhatsApp +918847306427 or check our menu above. How else can I help you today? 😊";
}

function addMessage(text, sender) {
    if (text === '') return;
    
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    messageDiv.appendChild(messageText);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
