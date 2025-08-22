/* Warm Delights Frontend JavaScript - WITH GLOBAL STORAGE + SESSION CACHE - FIXED */

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

// Menu data with minimum quantities (unchanged)
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

// **📊 ENHANCED ANALYTICS TRACKING WITH SESSION STORAGE** (unchanged)
function trackEvent(eventType, data = {}) {
    // Session storage tracking code remains the same
    const sessionEvents = JSON.parse(sessionStorage.getItem('warmDelightsEvents') || '[]');
    sessionEvents.push({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
    });
    
    if (sessionEvents.length > 100) {
        sessionEvents.splice(0, sessionEvents.length - 100);
    }
    
    sessionStorage.setItem('warmDelightsEvents', JSON.stringify(sessionEvents));

    const persistentEvents = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    persistentEvents.push({
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
    });
    
    if (persistentEvents.length > 500) {
        persistentEvents.splice(0, persistentEvents.length - 500);
    }
    
    localStorage.setItem('warmDelightsEvents', JSON.stringify(persistentEvents));

    try {
        fetch(`${API_CONFIG.BACKEND_URL}/api/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType: eventType, data: data })
        }).catch(() => console.log('Analytics stored locally - backend offline'));
    } catch (error) {
        console.log('Analytics stored in session/local storage');
    }
}

// **💾 SESSION CACHE MANAGEMENT** (unchanged)
function getCachedImages() {
    try {
        const cached = sessionStorage.getItem(API_CONFIG.CACHE_KEY);
        const expiry = sessionStorage.getItem(API_CONFIG.CACHE_EXPIRY_KEY);
        
        if (!cached || !expiry) return null;
        
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
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.style.animationDelay = `${index * 0.1}s`;
    
    const img = document.createElement('img');
    img.alt = imageData.name || imageData.filename || 'Warm Delights Creation';
    img.className = 'responsive-img';
    img.loading = 'lazy';
    
    // Get image source - handle different data formats
    let imageSrc;
    if (imageData.url) {
        imageSrc = imageData.url;
    } else if (imageData.path) {
        imageSrc = imageData.path.startsWith('http') ? imageData.path : `${API_CONFIG.BACKEND_URL}${imageData.path}`;
    } else if (imageData.filename || imageData.name) {
        imageSrc = `${API_CONFIG.BACKEND_URL}/uploads/${imageData.filename || imageData.name}`;
    } else if (typeof imageData === 'string') {
        imageSrc = `${API_CONFIG.BACKEND_URL}/uploads/${imageData}`;
    } else {
        console.error('Unknown image data format:', imageData);
        return null;
    }
    
    img.src = imageSrc;
    
    img.onerror = function() {
        console.log(`❌ Image failed to load: ${this.src}`);
        // Try alternative paths
        if (this.src.includes('/uploads/')) {
            this.src = this.src.replace('/uploads/', '/api/uploads/');
        } else if (this.src.includes('/api/uploads/')) {
            this.src = this.src.replace('/api/uploads/', '/images/');
        } else {
            // Use placeholder
            this.src = 'https://via.placeholder.com/300x200/f4c2c2/d67b8a?text=Warm+Delights';
            this.alt = 'Image not available';
        }
    };
    
    img.onload = function() {
        console.log(`✅ Image loaded: ${imageData.name || imageData.filename || 'image'}`);
        trackImageView(imageData.filename || imageData.name || 'unknown');
    };
    
    // Add click handler for modal
    img.onclick = () => openImageModal(img.src);
    
    galleryItem.appendChild(img);
    return galleryItem;
}

// **🌍 FIXED GALLERY LOADING FUNCTION**
// **🌍 FIXED GALLERY LOADING FUNCTION**
async function loadGallery() {
    console.log('🖼️ Loading gallery with global storage + session cache...');
    
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) {
        console.log('❌ Gallery grid not found in DOM');
        return;
    }

    try {
        // Step 1: Show loading state
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

        // Step 2: Fetch from backend
        console.log('🌍 Fetching from global storage...');
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const images = await response.json();
        console.log('✅ Backend response:', images);
        console.log('✅ Images type:', typeof images, 'Length:', images ? images.length : 'N/A');

        if (images && images.length > 0) {
            // Cache the images
            cacheImages(images);
            
            // Render images
            renderImages(images, 'global-storage');
            
            trackEvent('gallery_loaded', { 
                imageCount: images.length, 
                source: 'global-storage'
            });
            return;
        }

        // Step 3: Fallback to localStorage
        console.log('⚠️ No images in global storage, trying localStorage...');
        const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        
        if (adminImages.length > 0) {
            console.log('📱 Loading from localStorage:', adminImages.length, 'images');
            renderImages(adminImages, 'localStorage');
            return;
        }

        // Step 4: No images available
        showEmptyGallery();

    } catch (error) {
        console.error('❌ Gallery loading error:', error);
        handleGalleryError(error);
    }
}

// **🎨 FIXED RENDER IMAGES FUNCTION**
function renderImages(images, source) {
    console.log('🎨 renderImages called with:', {
        images: images,
        imageCount: images ? images.length : 0,
        source: source,
        firstImage: images && images[0] ? images[0] : 'none'
    });

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

    // Show cache indicator
    if (source === 'session-cache') {
        showCacheIndicator();
    }

    let renderedCount = 0;

    // Process each image
    images.forEach((imageData, index) => {
        try {
            console.log(`Processing image ${index + 1}:`, imageData);
            
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
                if (imageUrl.startsWith('/')) {
                    imageUrl = `${API_CONFIG.BACKEND_URL}${imageUrl}`;
                }
            } else {
                console.warn('Unknown image data format:', imageData);
                return;
            }

            // Create gallery item
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.style.animationDelay = `${index * 0.1}s`;
            
            const img = document.createElement('img');
            img.alt = imageName || 'Warm Delights Creation';
            img.className = 'responsive-img';
            img.loading = 'lazy';
            img.src = imageUrl;
            
            // Error handling for images
            img.onerror = function() {
                console.log(`❌ Image failed to load: ${this.src}`);
                // Try alternative paths
                const alternatives = [
                    `${API_CONFIG.BACKEND_URL}/api/uploads/${imageName}`,
                    `${API_CONFIG.BACKEND_URL}/images/${imageName}`,
                    'https://via.placeholder.com/300x200/f4c2c2/d67b8a?text=Warm+Delights'
                ];
                
                const currentSrc = this.src;
                const nextAltIndex = alternatives.findIndex(alt => alt === currentSrc) + 1;
                
                if (nextAltIndex < alternatives.length) {
                    this.src = alternatives[nextAltIndex];
                } else {
                    this.alt = 'Image not available';
                }
            };
            
            img.onload = function() {
                console.log(`✅ Image loaded: ${imageName}`);
                trackImageView(imageName);
            };
            
            // Add click handler for modal
            img.onclick = () => openImageModal(img.src);
            
            galleryItem.appendChild(img);
            galleryGrid.appendChild(galleryItem);
            
            renderedCount++;
            
        } catch (error) {
            console.error('Error processing image:', imageData, error);
        }
    });

    console.log(`🖼️ Successfully rendered ${renderedCount} out of ${images.length} images from ${source}`);
    
    if (renderedCount === 0) {
        showEmptyGallery();
    }
}

// **📱 ENHANCED SHOW CACHE INDICATOR**
function showCacheIndicator() {
    const cacheIndicator = document.createElement('div');
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

// **🔧 DEBUG FUNCTION TO TEST RENDERING**
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
        console.log('Gallery grid HTML:', document.getElementById('galleryGrid')?.outerHTML);
    }
};

console.log('🛠️ Debug tools available: window.debugGallery');


function showCacheIndicator() {
    const cacheIndicator = document.createElement('div');
    cacheIndicator.className = 'cache-indicator';
    cacheIndicator.textContent = '⚡ Loaded from cache';
    cacheIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(cacheIndicator);
    
    setTimeout(() => {
        if (document.body.contains(cacheIndicator)) {
            cacheIndicator.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(cacheIndicator)) {
                    document.body.removeChild(cacheIndicator);
                }
            }, 300);
        }
    }, 2000);
}

function showEmptyGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
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
    
    fetch(`${API_CONFIG.BACKEND_URL}/api/images/${filename}/view`, {
        method: 'POST'
    }).catch(() => console.log('Image view tracking stored locally'));

    trackEvent('image_view', {
        filename: filename,
        timestamp: new Date().toISOString()
    });
}

// **🔧 DEBUG FUNCTIONS**
window.debugGallery = {
    async testBackendImages() {
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`);
            const images = await response.json();
            console.log('Backend images:', images);
            return images;
        } catch (error) {
            console.error('Backend test failed:', error);
            return null;
        }
    },
    
    forceRefresh() {
        clearImageCache();
        loadGallery();
    },
    
    checkCache() {
        const cached = sessionStorage.getItem(API_CONFIG.CACHE_KEY);
        console.log('Cached images:', cached ? JSON.parse(cached) : 'none');
    },
    
    renderTestImages() {
        const testImages = [
            { filename: 'test1.jpg', name: 'Test Image 1' },
            { filename: 'test2.jpg', name: 'Test Image 2' }
        ];
        renderImages(testImages, 'test');
    }
};

// Rest of your code remains the same (cart functions, chatbot, etc.)
// ... (keeping all other functions unchanged)

// **🚀 INITIALIZATION**
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Warm Delights with Fixed Gallery');
    
    // Initialize forms (unchanged)
    const customForm = document.getElementById('customOrderForm');
    const contactForm = document.getElementById('contactForm');
    
    if (customForm) {
        customForm.addEventListener('submit', handleCustomOrder);
    }
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
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
    
    console.log('🛠️ Debug tools available: window.debugGallery');
});

console.log('🎯 Warm Delights Fixed Gallery loaded successfully!');
