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
            <div class="menu-error">
                <h3>❌ Unable to load menu. Please try again later.</h3>
                <p>Our delicious creations will be showcased here.</p>
                <p>Please check your connection and try again.</p>
            </div>
        `;
    }
}

// Display menu items
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="no-items">No items found in this category.</div>';
        return;
    }

    menuGrid.innerHTML = items.map(item => `
        <div class="menu-item" data-category="${item.category.toLowerCase()}">
            <img src="${API_BASE_URL.replace('/api', '')}${item.image}" alt="${item.name}" class="menu-image" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'><rect width=\\'300\\' height=\\'200\\' fill=\\'%23f4c2c2\\'/><text x=\\'150\\' y=\\'100\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23d67b8a\\' font-family=\\'Arial\\' font-size=\\'20\\'>${item.name}</text></svg>'">
            <h3>${item.name}</h3>
            <p class="description">${item.description}</p>
            <div class="menu-item-footer">
                <span class="price">₹${item.price}${item.priceUnit ? '/' + item.priceUnit : ''}</span>
                ${item.eggless ? '<span class="eggless-badge">🥚 Eggless</span>' : ''}
            </div>
            ${item.customizable ? '<p class="customizable">✨ Customizable</p>' : ''}
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
        <div class="category-filters">
            ${categories.map(category => `
                <button class="filter-btn ${category === currentCategory ? 'active' : ''}" 
                        onclick="filterMenu('${category}')">
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
        if (btn.textContent.toLowerCase() === category || (category === 'all' && btn.textContent.toLowerCase() === 'all')) {
            btn.classList.add('active');
        }
    });

    const filteredItems = category === 'all' 
        ? allMenuItems 
        : allMenuItems.filter(item => item.category.toLowerCase() === category);
    
    displayMenuItems(filteredItems);
}

// Gallery upload functionality
document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('galleryImageUpload');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', handleImageUpload);
    }
    
    // Load initial data
    loadMenu();
    loadGallery();
});

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        // Show loading state
        const uploadBtn = document.querySelector('.upload-btn');
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = '⏳ Uploading...';
        uploadBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/gallery/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);

        // Reset form
        event.target.value = '';
        
        // Refresh gallery
        await loadGallery();
        
        // Show success message
        alert('Image uploaded successfully!');

    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image. Please try again.');
    } finally {
        // Reset button state
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.textContent = '📸 Upload New Image';
        uploadBtn.disabled = false;
    }
}

// Load gallery images
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/gallery`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const images = await response.json();
        
        if (images.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-placeholder">
                    <h3>🎂 Our Delicious Creations</h3>
                    <p>No images uploaded yet. Upload your first image!</p>
                </div>
            `;
            return;
        }

        // Display uploaded images
        galleryGrid.innerHTML = images.map(image => `
            <div class="gallery-item">
                <img src="${API_BASE_URL.replace('/api', '')}${image.url}" 
                     alt="${image.originalName}" 
                     onclick="openImageModal('${API_BASE_URL.replace('/api', '')}${image.url}')">
                <button class="delete-btn" onclick="deleteImage(${image.id})" title="Delete Image">
                    🗑️
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder">
                <h3>❌ Failed to Load Gallery</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

// Delete image function
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/gallery/${imageId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        // Refresh gallery
        await loadGallery();
        alert('Image deleted successfully!');

    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete image. Please try again.');
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

// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
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

        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            alert('Message sent successfully! We\'ll get back to you soon.');
            event.target.reset();
        } else {
            throw new Error(result.message || 'Failed to send message');
        }

    } catch (error) {
        console.error('Contact form error:', error);
        alert('Failed to send message. Please try again or contact us directly.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Utility function to show loading state
function showLoading(element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
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
