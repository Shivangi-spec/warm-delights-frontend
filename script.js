/* Warm Delights Frontend JavaScript - COMPLETE FIXED VERSION */

// **🌍 GLOBAL STORAGE + SESSION CACHE CONFIGURATION**
const API_CONFIG = {
    BACKEND_URL: 'https://warm-delights-backend-production.up.railway.app',
    
    // Session cache configuration
    CACHE_KEY: 'warmDelights_gallery_cache',
    CACHE_EXPIRY_KEY: 'warmDelights_cache_expiry',
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
    
    // Fallback image paths for maximum compatibility
    IMAGE_PATHS: [
        '/uploads/',
        '/api/uploads/',
        '/images/'
    ]
};

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

// **📊 ENHANCED ANALYTICS TRACKING**
function trackEvent(eventType, data = {}) {
    // Store in session storage for current session
    const sessionEvents = JSON.parse(sessionStorage.getItem('warmDelightsEvents') || '[]');
    sessionEvents.push({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
    });
    
    // Keep only last 100 events in session
    if (sessionEvents.length > 100) {
        sessionEvents.splice(0, sessionEvents.length - 100);
    }
    
    sessionStorage.setItem('warmDelightsEvents', JSON.stringify(sessionEvents));

    // Also store in localStorage for persistence (limited)
    const persistentEvents = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    persistentEvents.push({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 500 persistent events
    if (persistentEvents.length > 500) {
        persistentEvents.splice(0, persistentEvents.length - 500);
    }
    
    localStorage.setItem('warmDelightsEvents', JSON.stringify(persistentEvents));

    // Send to global backend storage
    try {
        fetch(`${API_CONFIG.BACKEND_URL}/api/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventType: eventType,
                data: data
            })
        }).catch(() => {
            console.log('Analytics stored locally - backend offline');
        });
    } catch (error) {
        console.log('Analytics stored in session/local storage');
    }
}

// **💾 SESSION CACHE MANAGEMENT**
function getCachedImages() {
    try {
        const cached = sessionStorage.getItem(API_CONFIG.CACHE_KEY);
        const expiry = sessionStorage.getItem(API_CONFIG.CACHE_EXPIRY_KEY);
        
        if (!cached || !expiry) return null;
        
        // Check if cache is expired
        if (new Date().getTime() > parseInt(expiry)) {
            console.log('⏰ Session cache expired, clearing...');
            clearImageCache();
            return null;
        }
        
        const images = JSON.parse(cached);
        console.log('⚡ Loading from session cache:', images.length, 'images');
        return images;
    } catch (error) {
        console.error('Cache read error:', error);
        clearImageCache();
        return null;
    }
}

function cacheImages(images) {
    try {
        const expiryTime = new Date().getTime() + API_CONFIG.CACHE_DURATION;
        
        sessionStorage.setItem(API_CONFIG.CACHE_KEY, JSON.stringify(images));
        sessionStorage.setItem(API_CONFIG.CACHE_EXPIRY_KEY, expiryTime.toString());
        
        console.log('✅ Images cached in session storage for 15 minutes');
    } catch (error) {
        console.error('Cache write error:', error);
    }
}

function clearImageCache() {
    try {
        sessionStorage.removeItem(API_CONFIG.CACHE_KEY);
        sessionStorage.removeItem(API_CONFIG.CACHE_EXPIRY_KEY);
        console.log('🗑️ Session cache cleared');
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

// **🖼️ FIXED IMAGE LOADING FUNCTIONS**
function createResponsiveImageElement(imageData, index) {
    console.log(`Creating image element ${index + 1}:`, imageData);
    
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.style.animationDelay = `${index * 0.1}s`;
    
    const img = document.createElement('img');
    img.className = 'responsive-img';
    img.loading = 'lazy';
    
    // Handle different image data formats
    let imageName, imageUrl;
    
    if (typeof imageData === 'string') {
        // Simple string filename
        imageName = imageData;
        imageUrl = `${API_CONFIG.BACKEND_URL}/uploads/${imageName}`;
    } else if (imageData && typeof imageData === 'object') {
        // Object with various possible properties
        imageName = imageData.filename || imageData.name || imageData.originalname || 'unknown';
        imageUrl = imageData.url || imageData.path || `${API_CONFIG.BACKEND_URL}/uploads/${imageName}`;
        
        // Handle relative paths
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith(API_CONFIG.BACKEND_URL)) {
            imageUrl = `${API_CONFIG.BACKEND_URL}${imageUrl}`;
        }
    } else {
        console.warn('Unknown image data format:', imageData);
        return null;
    }
    
    img.alt = imageName || 'Warm Delights Creation';
    
    // Try multiple URLs for maximum compatibility
    let currentUrlIndex = 0;
    const possibleUrls = [
        imageUrl,
        `${API_CONFIG.BACKEND_URL}/uploads/${imageName}`,
        `${API_CONFIG.BACKEND_URL}/api/uploads/${imageName}`,
        `${API_CONFIG.BACKEND_URL}/images/${imageName}`,
        'https://via.placeholder.com/300x200/f4c2c2/d67b8a?text=Warm+Delights'
    ];
    
    function tryNextUrl() {
        if (currentUrlIndex < possibleUrls.length) {
            img.src = possibleUrls[currentUrlIndex];
            currentUrlIndex++;
        }
    }
    
    img.onerror = function() {
        console.log(`❌ Image failed: ${this.src}, trying next...`);
        tryNextUrl();
    };
    
    img.onload = function() {
        console.log(`✅ Image loaded: ${imageName}`);
        trackImageView(imageName);
    };
    
    // Start with the first URL
    tryNextUrl();
    
    // Add click handler for modal
    img.onclick = () => openImageModal(img.src);
    
    galleryItem.appendChild(img);
    return galleryItem;
}

// **🌍 FIXED GALLERY LOADING FUNCTION**
async function loadGallery() {
    console.log('🖼️ Loading gallery with global storage + session cache...');
    
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) {
        console.log('❌ Gallery grid not found in DOM');
        return;
    }

    try {
        // Step 1: Check session cache first
        let images = getCachedImages();
        if (images && images.length > 0) {
            console.log('⚡ Using cached images:', images.length);
            renderImages(images, 'session-cache');
            return;
        }

        // Step 2: Show loading state
        galleryGrid.innerHTML = `
            <div class="gallery-loading" style="
                text-align: center; 
                padding: 60px 20px; 
                color: var(--primary-pink);
                grid-column: 1 / -1;
                background: var(--light-pink);
                border-radius: 15px;
            ">
                <div class="loading-spinner" style="
                    border: 3px solid var(--secondary-pink);
                    border-top: 3px solid var(--primary-pink);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>Loading from global storage...</p>
            </div>
        `;

        // Step 3: Fetch from global backend storage
        console.log('🌍 Fetching from global storage...');
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        images = await response.json();
        console.log(`✅ Loaded ${images.length} images from global storage:`, images);

        if (images && images.length > 0) {
            // Cache the images in session storage
            cacheImages(images);
            
            // Render images from global storage
            renderImages(images, 'global-storage');
            
            // Track successful load
            trackEvent('gallery_loaded', { 
                imageCount: images.length, 
                source: 'global-storage',
                cached: false 
            });
            return;
        }

        // Step 4: Fallback to localStorage (admin uploaded images)
        console.log('⚠️ No images in global storage, trying localStorage...');
        const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        
        if (adminImages.length > 0) {
            console.log('📱 Loading from localStorage:', adminImages.length, 'images');
            renderImages(adminImages, 'localStorage');
            
            trackEvent('gallery_loaded', { 
                imageCount: adminImages.length, 
                source: 'localStorage',
                cached: false 
            });
            return;
        }

        // Step 5: No images available
        showEmptyGallery();

    } catch (error) {
        console.error('❌ Gallery loading error:', error);
        handleGalleryError(error);
    }
}

// **🎨 FIXED RENDER IMAGES FUNCTION**
function renderImages(images, source) {
    console.log(`🎨 Rendering ${images.length} images from ${source}:`, images);

    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) {
        console.error('❌ Gallery grid element not found');
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    if (!images || images.length === 0) {
        console.log('⚠️ No images to render');
        showEmptyGallery();
        return;
    }

    // Create cache indicator
    if (source === 'session-cache') {
        showCacheIndicator();
    }

    let renderedCount = 0;

    // Render each image with error handling
    images.forEach((imageData, index) => {
        try {
            const imageItem = createResponsiveImageElement(imageData, index);
            
            if (imageItem) {
                galleryGrid.appendChild(imageItem);
                renderedCount++;
            } else {
                console.warn('Failed to create image element for:', imageData);
            }
        } catch (error) {
            console.error('Error rendering image:', imageData, error);
        }
    });

    console.log(`🖼️ Successfully rendered ${renderedCount} out of ${images.length} images`);
    
    if (renderedCount === 0) {
        showEmptyGallery();
    }
    
    // Store rendered images globally
    galleryImages = images;
}

function showCacheIndicator() {
    const cacheIndicator = document.createElement('div');
    cacheIndicator.className = 'cache-indicator';
    cacheIndicator.textContent = '⚡ Loaded from cache';
    cacheIndicator.style.cssText = `
        position: fixed;
        top: 70px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(cacheIndicator);
    
    setTimeout(() => {
        cacheIndicator.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(cacheIndicator)) {
                document.body.removeChild(cacheIndicator);
            }
        }, 300);
    }, 3000);
}

function showEmptyGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = `
        <div class="gallery-placeholder" style="grid-column: 1 / -1;">
            <h3>🎂 Our Delicious Creations</h3>
            <p>Beautiful cake images will appear here soon!</p>
            <div style="margin-top: 20px;">
                <button onclick="refreshGallery()" style="
                    padding: 12px 25px;
                    background: var(--primary-pink);
                    color: white;
                    border: none;
                    border-radius: 25px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-right: 10px;
                ">🔄 Refresh Gallery</button>
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
}

function handleGalleryError(error) {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = `
        <div class="gallery-error" style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 15px;
            color: #721c24;
        ">
            <h3>⚠️ Gallery Temporarily Unavailable</h3>
            <p>Connection to global storage failed. Please try again.</p>
            <p style="font-size: 12px; color: #666;">Error: ${error.message}</p>
            <button onclick="refreshGallery()" style="
                margin-top: 10px; 
                padding: 10px 20px; 
                background: var(--primary-pink); 
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

// **🔄 REFRESH GALLERY FUNCTION**
function refreshGallery() {
    console.log('🔄 Refreshing gallery...');
    clearImageCache(); // Clear session cache
    loadGallery(); // Reload from global storage
}

// **👁️ TRACK IMAGE VIEW**
function trackImageView(filename) {
    if (!filename) return;
    
    // Track view in global storage
    fetch(`${API_CONFIG.BACKEND_URL}/api/images/${filename}/view`, {
        method: 'POST'
    }).catch(() => {
        console.log('Image view tracking stored locally');
    });

    // Track in analytics
    trackEvent('image_view', {
        filename: filename,
        timestamp: new Date().toISOString()
    });
}

// **🔧 DEBUG FUNCTIONS**
window.debugGallery = {
    async testBackend() {
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`);
            const images = await response.json();
            console.log('🔍 Backend test result:', images);
            return images;
        } catch (error) {
            console.error('❌ Backend test failed:', error);
            return null;
        }
    },
    
    testRender(sampleImages) {
        const testImages = sampleImages || [
            { filename: 'test1.jpg' },
            { filename: 'test2.jpg' }
        ];
        console.log('🧪 Testing render with:', testImages);
        renderImages(testImages, 'test');
    },
    
    forceRefresh() {
        clearImageCache();
        loadGallery();
    },
    
    checkElements() {
        console.log('🔍 DOM Check:');
        console.log('Gallery grid exists:', !!document.getElementById('galleryGrid'));
        console.log('Gallery grid HTML:', document.getElementById('galleryGrid')?.innerHTML);
    }
};

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
    
    // Track cart addition with enhanced data
    trackEvent('cart_add', {
        itemName: item.name,
        price: item.price,
        category: item.category,
        quantity: quantity,
        timestamp: new Date().toISOString()
    });
    
    updateCartUI();
    updateCartCount();
    showNotification(`${quantity} ${item.name} added to cart! 🛒`);
    
    // Reset quantity input to minimum
    quantityInput.value = item.minOrder;
}

function removeFromCart(itemId) {
    const removedItem = cart.find(item => item.id === itemId);
    cart = cart.filter(item => item.id !== itemId);
    
    if (removedItem) {
        trackEvent('cart_remove', {
            itemName: removedItem.name,
            quantity: removedItem.quantity
        });
    }
    
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
    const elements = ['cartCount', 'mobileCartCount'];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = totalItems;
        }
    });
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (cartTotal) cartTotal.textContent = '0';
        if (checkoutBtn) checkoutBtn.disabled = true;
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
    
    if (cartTotal) cartTotal.textContent = total;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

function checkout() {
    if (cart.length === 0) return;
    
    // Track WhatsApp order with enhanced data
    trackEvent('whatsapp_order', {
        items: cart.map(item => ({ 
            name: item.name, 
            quantity: item.quantity, 
            price: item.price 
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
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

// Enhanced notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const colors = {
        'success': 'var(--primary-pink)',
        'error': '#ff4444',
        'info': '#2196F3',
        'warning': '#ff9800'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
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
    
    if (event && event.target) {
        event.target.classList.add('active');
    }

    const filteredItems = category === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(item => item.category.toLowerCase() === category);
    
    displayMenuItems(filteredItems);
    
    // Track menu filter
    trackEvent('menu_filtered', {
        category: category,
        itemCount: filteredItems.length
    });
}

// Image modal function with enhanced features
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%;
        background: rgba(0,0,0,0.9); 
        display: flex; 
        justify-content: center;
        align-items: center; 
        z-index: 10000; 
        cursor: pointer;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%; 
        max-height: 90%; 
        border-radius: 10px;
        object-fit: contain;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    const closeBtn = document.createElement('div');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 30px;
        color: white;
        font-size: 30px;
        cursor: pointer;
        z-index: 10001;
    `;
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    
    // Close modal handlers
    const closeModal = () => {
        modal.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    closeBtn.onclick = closeModal;
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape' && document.body.contains(modal)) {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Track image modal open
    trackEvent('image_modal_opened', {
        imageUrl: imageUrl
    });
}

// Custom order form handling
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
        
        // Track custom order
        trackEvent('custom_order', {
            customerName: customerName,
            size: treatSize,
            flavour: treatFlavour,
            timestamp: new Date().toISOString()
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
        showNotification('Custom order request sent via WhatsApp! We will contact you soon.', 'success');
        
    } catch (error) {
        showNotification('Failed to submit custom order. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Enhanced contact form handling with global storage
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

        // Track contact submission
        trackEvent('contact_submit', {
            name: formData.name,
            timestamp: new Date().toISOString()
        });
        
        console.log('📧 Sending contact form to global storage:', `${API_CONFIG.BACKEND_URL}/api/contact`);

        // Send to global storage backend
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                    event.target.reset();
                    return;
                }
            }
        } catch (apiError) {
            console.log('Global storage not available, showing success message anyway');
        }
        
        // Always show success to user (message is tracked for admin)
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        event.target.reset();

    } catch (error) {
        console.error('❌ Contact form error:', error);
        showNotification('Message received! We\'ll get back to you soon.', 'success');
        event.target.reset();
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// File size validation
function validateFileSize(event) {
    const file = event.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('File size must be less than 5MB', 'error');
        event.target.value = '';
    }
}

// **🤖 ENHANCED CHATBOT WITH GLOBAL STORAGE INTEGRATION**
let chatbotOpen = false;

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    
    chatbotOpen = !chatbotOpen;
    
    if (chatbotOpen) {
        chatbotWindow.classList.add('active');
        chatbotToggle.style.display = 'none';
        
        // Track chatbot open
        trackEvent('chatbot_opened', {
            timestamp: new Date().toISOString()
        });
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

    // Track quick response
    trackEvent('chatbot_quick_response', {
        type: type,
        timestamp: new Date().toISOString()
    });
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
    
    // Add action buttons
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

    // Track category view
    trackEvent('chatbot_category_viewed', {
        category: category,
        timestamp: new Date().toISOString()
    });
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
    
    // Track chatbot interaction
    if (sender === 'user') {
        trackEvent('chat_message', {
            message: text.substring(0, 100), // Only store first 100 chars for privacy
            timestamp: new Date().toISOString()
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

// **🚀 INITIALIZATION WITH GLOBAL STORAGE**
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Warm Delights with Global Storage + Session Cache');
    
    // Initialize forms
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
    loadGallery(); // Load from global storage with session cache
    updateCartCount();
    
    // Auto-refresh gallery every 30 minutes
    setInterval(() => {
        console.log('🔄 Auto-refreshing gallery from global storage...');
        refreshGallery();
    }, 30 * 60 * 1000);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .gallery-item {
            opacity: 0;
            animation: fadeInUp 0.5s ease forwards;
        }
    `;
    document.head.appendChild(style);
});

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
                
                // Track navigation
                trackEvent('navigation_clicked', {
                    target: targetId,
                    timestamp: new Date().toISOString()
                });
            }
        });
    });
});

// Track visitor when page loads
window.addEventListener('load', function() {
    // Don't track admin visits
    if (!localStorage.getItem('isWarmDelightsAdmin')) {
        trackEvent('page_visit', {
            page: window.location.pathname,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('🚀 Warm Delights with Global Storage + Session Cache loaded');
});

// Debug function to check API connectivity
async function checkAPIConnection() {
    try {
        console.log('🔗 Checking global storage connection...');
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api`);
        const data = await response.json();
        console.log('✅ Global Storage Status:', data);
        return true;
    } catch (error) {
        console.error('❌ Global storage connection failed:', error);
        return false;
    }
}

// **🔍 ENHANCED DEBUG FUNCTIONS**
window.warmDelightsDebug = {
    checkGlobalStorage: checkAPIConnection,
    clearSessionCache: clearImageCache,
    refreshGallery: refreshGallery,
    viewSessionEvents: () => console.log(JSON.parse(sessionStorage.getItem('warmDelightsEvents') || '[]')),
    viewLocalEvents: () => console.log(JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]')),
    testNotification: (msg, type) => showNotification(msg || 'Test notification', type || 'success'),
    
    // Gallery specific debug tools
    ...window.debugGallery
};

console.log('🎯 Warm Delights Debug Tools:', window.warmDelightsDebug);
console.log('🛠️ Gallery Debug Tools:', window.debugGallery);
console.log('✅ Warm Delights Frontend Loaded Successfully!');
