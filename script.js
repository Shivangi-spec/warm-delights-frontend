// API Base URL - Update this with your deployed backend URL
const API_BASE_URL = 'https://your-app.up.railway.app/api'; // Replace with your actual backend URL

// Mobile menu toggle
function toggleMenu() {
    const mobileNav = document.getElementById('mobileNav');
    mobileNav.classList.toggle('active');
}

// Load menu items
async function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        const menuItems = await response.json();
        
        if (menuItems && menuItems.length > 0) {
            menuGrid.innerHTML = menuItems.map(item => `
                <div class="menu-item">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <p class="price">₹${item.price}</p>
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

// Gallery functionality
let galleryImages = [
    // You can add default images here
];

function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (galleryImages.length > 0) {
        galleryGrid.innerHTML = galleryImages.map((image, index) => `
            <div class="gallery-item">
                <img src="${image.url}" alt="${image.alt || 'Gallery image'}" onclick="openImageModal(${index})">
            </div>
        `).join('');
    } else {
        galleryGrid.innerHTML = `
            <div class="gallery-placeholder">
                <p>Gallery coming soon! Our delicious creations will be showcased here.</p>
                <button onclick="uploadImage()">Upload Images</button>
            </div>
        `;
    }
}

// Upload image functionality (placeholder)
function uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = function(event) {
        const files = event.target.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    galleryImages.push({
                        url: e.target.result,
                        alt: file.name
                    });
                    loadGallery();
                };
                reader.readAsDataURL(file);
            }
        }
    };
    
    input.click();
}

// Image modal functionality
function openImageModal(index) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${galleryImages[index].url}" alt="${galleryImages[index].alt}">
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
    `;
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 30px;
        cursor: pointer;
    `;
    
    const img = modal.querySelector('img');
    img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Contact form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    alert('Message sent successfully! We will get back to you soon.');
                    contactForm.reset();
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try calling us directly.');
            }
        });
    }
    
    // Load content
    loadMenu();
    loadGallery();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const mobileNav = document.getElementById('mobileNav');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (mobileNav && mobileNav.classList.contains('active') && 
        !mobileNav.contains(e.target) && !toggleBtn.contains(e.target)) {
        mobileNav.classList.remove('active');
    }
});

// Add loading states
function showLoading(element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
}

// Responsive image handling
function handleResponsiveImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
    });
}

// Initialize responsive features
document.addEventListener('DOMContentLoaded', function() {
    handleResponsiveImages();
    
    // Add touch support for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});
