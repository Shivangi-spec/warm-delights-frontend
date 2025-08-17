// Warm Delights Frontend JavaScript - Updated with Gallery Functionality

// API Base URL - Update this with your deployed backend URL
const API_BASE_URL = 'https://your-app.up.railway.app/api'; // Replace with your actual Railway URL

// Global variables
let galleryImages = [];
let currentImageIndex = 0;

// Mobile menu toggle
function toggleMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (mobileNav) {
        mobileNav.classList.toggle('active');
        
        // Animate hamburger menu
        if (toggleBtn) {
            toggleBtn.classList.toggle('active');
        }
    }
}

// Load menu items from backend
async function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    
    if (!menuGrid) return;
    
    try {
        showLoading(menuGrid);
        
        const response = await fetch(`${API_BASE_URL}/menu`);
        const menuItems = await response.json();
        
        if (menuItems && menuItems.length > 0) {
            menuGrid.innerHTML = menuItems.map(item => `
                <div class="menu-item" data-aos="fade-up">
                    <div class="menu-image">
                        <img src="${API_BASE_URL}${item.image}" alt="${item.name}" loading="lazy">
                    </div>
                    <div class="menu-content">
                        <h3>${item.name}</h3>
                        <p class="category">${item.category}</p>
                        <p class="description">${item.description}</p>
                        <div class="menu-footer">
                            <p class="price">₹${item.price}</p>
                            ${item.customizable ? '<span class="customizable">📝 Customizable</span>' : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            menuGrid.innerHTML = '<div class="loading">Menu items coming soon!</div>';
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        menuGrid.innerHTML = '<div class="loading">Unable to load menu. Please try again later.</div>';
    }
}

// Updated gallery functionality with backend integration
async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;
    
    try {
        showLoading(galleryGrid);
        
        const response = await fetch(`${API_BASE_URL}/gallery`);
        galleryImages = await response.json();
        
        if (galleryImages && galleryImages.length > 0) {
            galleryGrid.innerHTML = galleryImages.map((image, index) => `
                <div class="gallery-item" data-aos="zoom-in">
                    <img src="${API_BASE_URL}${image.url}" 
                         alt="${image.originalName || 'Gallery image'}" 
                         onclick="openImageModal(${index})"
                         loading="lazy">
                    <div class="image-overlay">
                        <button onclick="deleteImage(${image.id})" class="delete-btn" title="Delete image">
                            <span>×</span>
                        </button>
                        <button onclick="openImageModal(${index})" class="view-btn" title="View full size">
                            <span>👁</span>
                        </button>
                    </div>
                </div>
            `).join('') + `
                <div class="gallery-upload-card" data-aos="fade-up">
                    <div class="upload-content">
                        <div class="upload-icon">📷</div>
                        <h3>Add New Image</h3>
                        <p>Share your delicious creations!</p>
                        <button onclick="uploadImage()" class="upload-btn">Upload Image</button>
                    </div>
                </div>
            `;
        } else {
            galleryGrid.innerHTML = `
                <div class="gallery-placeholder" data-aos="fade-up">
                    <div class="placeholder-content">
                        <div class="placeholder-icon">🧁</div>
                        <h3>Gallery Coming Soon!</h3>
                        <p>Our delicious creations will be showcased here.</p>
                        <button onclick="uploadImage()" class="upload-btn">Upload First Image</button>
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
                    <button onclick="loadGallery()" class="upload-btn">Retry</button>
                </div>
            </div>
        `;
    }
}

// Upload image functionality with backend integration
function uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        
        if (file && file.type.startsWith('image/')) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB. Please choose a smaller image.');
                return;
            }
            
            const formData = new FormData();
            formData.append('image', file);
            
            // Show upload progress
            const galleryGrid = document.getElementById('galleryGrid');
            const uploadIndicator = document.createElement('div');
            uploadIndicator.className = 'upload-indicator';
            uploadIndicator.innerHTML = `
                <div class="upload-progress">
                    <div class="spinner"></div>
                    <p>Uploading ${file.name}...</p>
                </div>
            `;
            galleryGrid.appendChild(uploadIndicator);
            
            try {
                const response = await fetch(`${API_BASE_URL}/gallery/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert('Image uploaded successfully! 🎉');
                    loadGallery(); // Reload gallery to show new image
                } else {
                    const error = await response.json();
                    alert('Upload failed: ' + (error.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Upload failed. Please check your connection and try again.');
            } finally {
                // Remove upload indicator
                if (uploadIndicator.parentNode) {
                    uploadIndicator.parentNode.removeChild(uploadIndicator);
                }
            }
        } else {
            alert('Please select a valid image file (JPG, PNG, GIF, etc.).');
        }
    };
    
    input.click();
}

// Delete image functionality
async function deleteImage(imageId) {
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/gallery/${imageId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Image deleted successfully! 🗑️');
                loadGallery(); // Reload gallery
            } else {
                const error = await response.json();
                alert('Failed to delete image: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        }
    }
}

// Enhanced image modal with navigation
function openImageModal(index) {
    if (!galleryImages || galleryImages.length === 0) return;
    
    currentImageIndex = index;
    const image = galleryImages[index];
    
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeImageModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${image.originalName || 'Gallery Image'}</h3>
                <button class="close-btn" onclick="closeImageModal()">&times;</button>
            </div>
            <div class="modal-body">
                <button class="nav-btn prev-btn" onclick="navigateImage(-1)" ${galleryImages.length <= 1 ? 'style="display:none"' : ''}>‹</button>
                <img src="${API_BASE_URL}${image.url}" alt="${image.originalName || 'Gallery image'}" class="modal-image">
                <button class="nav-btn next-btn" onclick="navigateImage(1)" ${galleryImages.length <= 1 ? 'style="display:none"' : ''}>›</button>
            </div>
            <div class="modal-footer">
                <p>Uploaded on ${new Date(image.uploadedAt).toLocaleDateString()}</p>
                <button onclick="deleteImage(${image.id})" class="delete-modal-btn">Delete Image</button>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleModalKeyboard);
}

// Navigate between images in modal
function navigateImage(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    }
    
    const modalImage = document.querySelector('.modal-image');
    const modalTitle = document.querySelector('.modal-header h3');
    const modalFooter = document.querySelector('.modal-footer p');
    const deleteBtn = document.querySelector('.delete-modal-btn');
    
    if (modalImage && galleryImages[currentImageIndex]) {
        const image = galleryImages[currentImageIndex];
        modalImage.src = `${API_BASE_URL}${image.url}`;
        modalImage.alt = image.originalName || 'Gallery image';
        modalTitle.textContent = image.originalName || 'Gallery Image';
        modalFooter.textContent = `Uploaded on ${new Date(image.uploadedAt).toLocaleDateString()}`;
        deleteBtn.onclick = () => deleteImage(image.id);
    }
}

// Close image modal
function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = ''; // Restore scrolling
        document.removeEventListener('keydown', handleModalKeyboard);
    }
}

// Handle keyboard navigation in modal
function handleModalKeyboard(e) {
    switch(e.key) {
        case 'Escape':
            closeImageModal();
            break;
        case 'ArrowLeft':
            if (galleryImages.length > 1) navigateImage(-1);
            break;
        case 'ArrowRight':
            if (galleryImages.length > 1) navigateImage(1);
            break;
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
                
                // Close mobile menu if open
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
        
        // Add loading placeholder
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
    
    // Initialize components
    loadMenu();
    loadGallery();
    initSmoothScrolling();
    handleResponsiveImages();
    initMobileMenuHandling();
    
    // Setup contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Add touch support for mobile devices
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
    
    // Add intersection observer for animations (if needed)
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements with animation classes
        document.querySelectorAll('[data-aos]').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Refresh gallery when page becomes visible (in case images were added from another device)
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

// Export functions for global access (if needed)
window.warmDelights = {
    toggleMenu,
    uploadImage,
    deleteImage,
    openImageModal,
    closeImageModal,
    loadGallery,
    loadMenu
};
