// Enhanced Admin Dashboard JavaScript with Global Storage Integration
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAdminAuth()) {
        return; // Stop if not authenticated
    }
    
    // Initialize dashboard functions
    initializeAdmin();
    loadAnalytics();
    loadAdminGallery();
    loadVisitorLog();
    loadActivityLog();
    
    // Start session timer
    updateSessionTimer();
});

// Global Storage Configuration
const API_CONFIG = {
    BACKEND_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : 'https://warm-delights-backend-production.up.railway.app',
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
};

// Enhanced Admin Authentication
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isWarmDelightsAdmin');
    const sessionToken = localStorage.getItem('adminSession');
    const loginTime = localStorage.getItem('adminLoginTime');

    if (!isAdmin || !sessionToken) {
        alert('🔒 Unauthorized access. Please login to continue.');
        window.location.href = 'admin-login.html';
        return false;
    }

    // Check session expiration (2 hours)
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const diffMinutes = (now - loginDate) / (60 * 1000);

        if (diffMinutes > 120) {
            alert('⏰ Session expired. Please login again.');
            logout(true);
            return false;
        }
    }

    return true;
}

// Enhanced logout function
function logout(force = false) {
    if (!force && !confirm('Are you sure you want to logout?')) {
        return;
    }

    // Clear all admin-related data
    localStorage.removeItem('isWarmDelightsAdmin');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    
    if (!force) {
        alert('👋 Logged out successfully');
    }
    window.location.href = 'admin-login.html';
}

// Session timer function
function updateSessionTimer() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (!loginTime) return;
    
    const loginDate = new Date(loginTime);
    const now = new Date();
    const elapsedMinutes = (now - loginDate) / (60 * 1000);
    const remainingMinutes = 120 - elapsedMinutes;
    
    const timerElement = document.getElementById('sessionTimer');
    const sessionInfoElement = document.getElementById('sessionInfo');
    
    if (remainingMinutes > 0) {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = Math.floor(remainingMinutes % 60);
        
        if (timerElement) {
            timerElement.textContent = `⏱️ ${hours}h ${minutes}m left`;
            timerElement.style.color = remainingMinutes < 15 ? '#ff4444' : 'white';
        }
    } else {
        logout(true);
    }
}

// Initialize admin dashboard
function initializeAdmin() {
    // Set up drag and drop for image upload
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('imageUpload');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#d67b8a';
            uploadArea.style.background = '#fdf2f8';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#e8a5b7';
            uploadArea.style.background = 'white';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e8a5b7';
            uploadArea.style.background = 'white';
            
            const files = Array.from(e.dataTransfer.files);
            handleImageFiles(files);
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleImageFiles(files);
        });
    }
}

// Handle selected image files
function handleImageFiles(files) {
    const validFiles = files.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!validTypes.includes(file.type)) {
            showStatus(`❌ ${file.name}: Invalid file type`, 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            showStatus(`❌ ${file.name}: File too large (max 10MB)`, 'error');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length > 0) {
        showStatus(`✅ ${validFiles.length} file(s) selected for upload`, 'success');
        window.selectedFiles = validFiles;
    }
}

// Enhanced upload to global storage
async function uploadImages() {
    const files = window.selectedFiles;
    if (!files || files.length === 0) {
        showStatus('❌ Please select images first', 'error');
        return;
    }
    
    showStatus('📤 Uploading to global storage...', 'info');
    
    try {
        const token = localStorage.getItem('adminSession');
        const formData = new FormData();
        
        for (const file of files) {
            formData.append('images', file);
        }
        
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/gallery/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.status === 401) {
            alert('❌ Session expired. Please login again.');
            window.location.href = 'admin-login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        showStatus(`✅ ${result.message}`, 'success');
        
        // Reload gallery
        loadAdminGallery();
        
        // Clear selection
        document.getElementById('imageUpload').value = '';
        window.selectedFiles = null;
        
    } catch (error) {
        console.error('Upload error:', error);
        showStatus('❌ Upload failed: ' + error.message, 'error');
    }
}

// Enhanced admin gallery loading
async function loadAdminGallery() {
    const galleryContainer = document.getElementById('adminGallery');
    if (!galleryContainer) return;

    try {
        // Show loading state
        galleryContainer.innerHTML = `
            <div class="admin-loading" style="text-align: center; padding: 40px; color: var(--primary-pink);">
                <div class="loading-spinner"></div>
                <p>Loading from global storage...</p>
            </div>
        `;

        // Try to load from global storage
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`);
        
        if (response.ok) {
            const globalImages = await response.json();
            displayAdminImages(globalImages, 'global-storage');
            return;
        }

        throw new Error('Global storage not available');

    } catch (error) {
        console.error('Gallery load error:', error);
        galleryContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b4e57;">
                <h3>Unable to load gallery</h3>
                <p>Global storage is currently unavailable</p>
            </div>
        `;
    }
}

// Display admin images
function displayAdminImages(images, source) {
    const galleryContainer = document.getElementById('adminGallery');
    
    if (!images || images.length === 0) {
        galleryContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b4e57;">
                <h3>No images uploaded yet</h3>
                <p>Upload your first image to get started!</p>
            </div>
        `;
        return;
    }

    const sourceIndicator = {
        'global-storage': { icon: '🌍', text: 'Global Storage', color: '#2196F3' }
    };

    const indicator = sourceIndicator[source] || { icon: '❓', text: 'Unknown', color: '#666' };

    galleryContainer.innerHTML = `
        <div class="gallery-source-indicator" style="
            text-align: center; 
            margin-bottom: 20px; 
            padding: 10px; 
            background: ${indicator.color}; 
            color: white; 
            border-radius: 10px; 
            font-size: 14px;
        ">
            ${indicator.icon} ${indicator.text} • ${images.length} images
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
            ${images.map((image, index) => `
                <div class="admin-gallery-item" style="
                    background: white; 
                    border-radius: 15px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                ">
                    <img src="${API_CONFIG.BACKEND_URL}${image.url}" 
                         alt="${image.name}"
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                    <button class="delete-btn" onclick="deleteImage('${image.id}')" 
                            style="position: absolute; top: 8px; right: 8px; background: #f44336; color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer;">
                        ✕
                    </button>
                    <div style="padding: 15px;">
                        <p style="font-weight: 600; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${image.name}</p>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b4e57;">
                            <span>${new Date(image.uploadedAt).toLocaleDateString()}</span>
                            <span>${(image.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Update analytics with image count
    const imageUploadsElement = document.getElementById('imageUploads');
    if (imageUploadsElement) {
        imageUploadsElement.textContent = images.length;
    }
}

// Delete image
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
        const token = localStorage.getItem('adminSession');
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/gallery/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            alert('❌ Session expired. Please login again.');
            window.location.href = 'admin-login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        
        showStatus('✅ Image deleted successfully', 'success');
        loadAdminGallery();
        
    } catch (error) {
        console.error('Delete error:', error);
        showStatus('❌ Failed to delete image', 'error');
    }
}

// Enhanced analytics loading
async function loadAnalytics() {
    try {
        const token = localStorage.getItem('adminSession');
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            alert('❌ Session expired. Please login again.');
            window.location.href = 'admin-login.html';
            return;
        }
        
        if (response.ok) {
            const data = await response.json();
            displayAnalytics(data.stats, 'global-storage');
            return;
        }
        
        throw new Error('Analytics not available');
        
    } catch (error) {
        console.error('Analytics load error:', error);
        // Fallback to local data if needed
        const stats = {
            totalVisitors: 0,
            todayVisitors: 0,
            cartAdditions: 0,
            whatsappOrders: 0,
            chatInteractions: 0,
            contactSubmissions: 0,
            imageUploads: 0,
            imageViews: 0
        };
        displayAnalytics(stats, 'local');
    }
}

// Display analytics
function displayAnalytics(stats, source) {
    const elements = {
        totalVisitors: document.getElementById('totalVisitors'),
        todayVisitors: document.getElementById('todayVisitors'),
        cartAdditions: document.getElementById('cartAdditions'),
        whatsappOrders: document.getElementById('whatsappOrders'),
        chatInteractions: document.getElementById('chatInteractions'),
        contactSubmissions: document.getElementById('contactSubmissions'),
        imageUploads: document.getElementById('imageUploads'),
        imageViews: document.getElementById('imageViews')
    };
    
    // Update values
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key] || 0;
        }
    });

    // Add source indicator
    const sourceIndicator = document.getElementById('analyticsSource');
    if (sourceIndicator) {
        const sourceInfo = {
            'global-storage': { icon: '🌍', text: 'Global Storage', color: '#2196F3' },
            'local': { icon: '📱', text: 'Local Data', color: '#ff9800' }
        };
        
        const info = sourceInfo[source] || sourceInfo['local'];
        sourceIndicator.innerHTML = `
            <span style="color: ${info.color}; font-size: 12px;">
                ${info.icon} ${info.text}
            </span>
        `;
    }
}

// Status messages
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const colors = {
        'success': '#4CAF50',
        'error': '#f44336',
        'warning': '#ff9800',
        'info': '#2196F3'
    };
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    statusDiv.innerHTML = `
        <div style="
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

// Refresh gallery
async function refreshGallery() {
    showStatus('🔄 Refreshing gallery...', 'info');
    await loadAdminGallery();
}

// Show different sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    const button = event.target;
    
    if (section) section.classList.add('active');
    if (button) button.classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'analytics') {
        loadAnalytics();
    } else if (sectionName === 'gallery') {
        loadAdminGallery();
    }
}

// Update session timer every minute
setInterval(updateSessionTimer, 60000);