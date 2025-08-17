// Warm Delights Frontend JavaScript - WITH ENHANCED ERROR HANDLING
// YOUR ACTUAL RAILWAY BACKEND URL
const API_BASE_URL = 'https://warm-delights-backend-production.up.railway.app/api';

// Global variables
let galleryImages = [];
let currentImageIndex = 0;
let allMenuItems = [];
let currentCategory = 'all';

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

// Gallery upload functionality
document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('galleryImageUpload');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', handleImageUpload);
    }
    
    // Load initial data
    setTimeout(() => {
        loadMenu();
        loadGallery();
    }, 1000); // Delay to ensure DOM is ready
});

// **FIXED HANDLE IMAGE UPLOAD FUNCTION**
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ No file selected');
        return;
    }

    console.log('📸 Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
    });

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
    }

    // **CORRECTED FORM DATA CREATION**
    const formData = new FormData();
    formData.append('image', file); // MUST match multer field name
    
    // Debug form data
    console.log('📋 FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    try {
        // Show loading state
        const uploadBtn = document.querySelector('.upload-btn');
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = '⏳ Uploading...';
        uploadBtn.disabled = true;

        console.log('📤 Uploading to:', `${API_BASE_URL}/gallery/upload`);

        // **FIXED FETCH REQUEST**
        const response = await fetch(`${API_BASE_URL}/gallery/upload`, {
            method: 'POST',
            body: formData, // Don't set Content-Type header - let browser set it
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('📡 Upload response status:', response.status);
        console.log('📡 Upload response headers:', response.headers);

        // Read response
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = { error: 'Upload failed', message: responseText };
            }
            throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
        }

        // Parse successful response
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error('Invalid response format');
        }

        console.log('✅ Upload successful:', result);

        // Reset form
        event.target.value = '';
        
        // Refresh gallery
        await loadGallery();
        
        // Show success message
        alert('Image uploaded successfully! 🎉');

    } catch (error) {
        console.error('❌ Upload error:', error);
        alert(`Failed to upload image: ${error.message}`);
    } finally {
        // Reset button state
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.textContent = '📸 Upload New Image';
            uploadBtn.disabled = false;
        }
    }
}

// Enhanced load gallery with better error handling
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
                     onclick="openImageModal('${API_BASE_URL.replace('/api', '')}${image.url}')"
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                <button class="delete-btn" 
                        onclick="deleteImage(${image.id})" 
                        title="Delete Image"
                        style="
                            position: absolute; 
                            top: 5px; 
                            right: 5px; 
                            background: rgba(255,0,0,0.8); 
                            border: none; 
                            border-radius: 50%; 
                            width: 30px; 
                            height: 30px; 
                            color: white; 
                            cursor: pointer; 
                            display: none;
                        ">
                    🗑️
                </button>
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

// Delete image function
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }

    try {
        console.log('🗑️ Deleting image:', imageId);
        
        const response = await fetch(`${API_BASE_URL}/gallery/${imageId}`, {
            method: 'DELETE',
            mode: 'cors'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Delete failed: ${response.status} - ${errorText}`);
        }

        console.log('✅ Image deleted successfully');
        
        // Refresh gallery
        await loadGallery();
        alert('Image deleted successfully!');

    } catch (error) {
        console.error('❌ Delete error:', error);
        alert(`Failed to delete image: ${error.message}`);
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
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
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
