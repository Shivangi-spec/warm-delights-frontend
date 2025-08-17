// Warm Delights Frontend JavaScript - WITH CORRECT RAILWAY URL

// YOUR ACTUAL RAILWAY BACKEND URL
const API_BASE_URL = 'https://warm-delights-backend-production.up.railway.app/api';

// Global variables
let galleryImages = [];
let currentImageIndex = 0;
let allMenuItems = [];
let currentCategory = 'all';

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

// Load menu items from backend with category filtering
async function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    
    if (!menuGrid) return;
    
    try {
        showLoading(menuGrid);
        
        const response = await fetch(`${API_BASE_URL}/menu`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allMenuItems = await response.json();
        
        displayMenuItems(allMenuItems);
        setupCategoryFilters();
        
    } catch (error) {
        console.error('Error loading menu:', error);
        menuGrid.innerHTML = `
            <div class="loading">
                <p>Unable to load menu. Please try again later.</p>
                <button onclick="loadMenu()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Display menu items based on category
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    
    if (items && items.length > 0) {
        menuGrid.innerHTML = items.map(item => `
            <div class="menu-item" data-category="${item.category}" data-aos="fade-up">
                <div class="menu-content">
                    <h3>${item.name}</h3>
                    <p class="category">${item.category}</p>
                    <p class="description">${item.description}</p>
                    <div class="menu-footer">
                        <p class="price">₹${item.price.toFixed(2)}${item.priceUnit ? '/' + item.priceUnit : ''}</p>
                        <div class="menu-badges">
                            ${item.eggless ? '<span class="badge eggless">🥚 Eggless</span>' : ''}
                            ${item.customizable ? '<span class="badge customizable">📝 Customizable</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        menuGrid.innerHTML = '<div class="loading">Menu items coming soon!</div>';
    }
}

// Setup category filter buttons
function setupCategoryFilters() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            if (category === 'all') {
                displayMenuItems(allMenuItems);
            } else {
                const filteredItems = allMenuItems.filter(item => item.category === category);
                displayMenuItems(filteredItems);
            }
            
            currentCategory = category;
        });
    });
}

// Load gallery
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;
    
    try {
        showLoading(galleryGrid);
        
        const response = await fetch(`${API_BASE_URL}/gallery`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        galleryImages = await response.json();
        
        if (galleryImages && galleryImages.length > 0) {
            galleryGrid.innerHTML = galleryImages.map((image, index) => `
                <div class="gallery-item" data-aos="zoom-in">
                    <img src="${image.url}" alt="${image.name || 'Gallery image'}" loading="lazy">
                </div>
            `).join('');
        } else {
            galleryGrid.innerHTML = `
                <div class="gallery-placeholder" data-aos="fade-up">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">🧁</div>
                        <h3>Gallery Coming Soon!</h3>
                        <p>Our delicious creations will be showcased here.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder">
                <div class="placeholder-content">
                    <div class="placeholder-icon">⚠️</div>
                    <h3>Unable to Load Gallery</h3>
                    <p>Please check your connection and try again.</p>
                    <button onclick="loadGallery()" class="retry-btn">Retry</button>
                </div>
            </div>
        `;
    }
}

// Contact form submission
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
        
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert('Message sent successfully! We will get back to you soon. 📧');
            event.target.reset();
        } else {
            throw new Error(result.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try calling us directly at 8847306427.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Utility functions
function showLoading(element) {
    element.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    `;
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                const mobileNav = document.getElementById('mobileNav');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    toggleMenu();
                }
            }
        });
    });
}

// Handle responsive images
function handleResponsiveImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
        });
    });
}

// Close mobile menu when clicking outside
function initMobileMenuHandling() {
    document.addEventListener('click', function(e) {
        const mobileNav = document.getElementById('mobileNav');
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        
        if (mobileNav && mobileNav.classList.contains('active') && 
            !mobileNav.contains(e.target) && !toggleBtn.contains(e.target)) {
            mobileNav.classList.remove('active');
        }
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Warm Delights website loaded! 🧁');
    
    loadMenu();
    loadGallery();
    initSmoothScrolling();
    handleResponsiveImages();
    initMobileMenuHandling();
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadGallery();
    }
});

// Error handling for network issues
window.addEventListener('online', function() {
    console.log('Connection restored');
    loadMenu();
    loadGallery();
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
});

// Export functions for global access
window.warmDelights = {
    toggleMenu,
    loadGallery,
    loadMenu
};
/ /   U p d a t e d   f o r   R a i l w a y   b a c k e n d   c o n n e c t i o n  
 