// Enhanced Admin Dashboard JavaScript with Security
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAdminAuth()) {
        return; // Stop if not authenticated
    }
    
    // Track dashboard access
    trackAdminActivity('dashboard_access');
    
    // Initialize dashboard functions
    initializeAdmin();
    loadAnalytics();
    loadAdminGallery();
    loadVisitorLog();
    loadActivityLog();
    
    // Start session timer
    updateSessionTimer();
    
    // Auto-logout warning at 1 hour 45 minutes
    setTimeout(() => {
        if (confirm('⚠️ Session will expire in 15 minutes. Continue working?')) {
            // Extend session by updating login time
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            trackAdminActivity('session_extended');
            updateSessionTimer();
        }
    }, 105 * 60 * 1000); // 1 hour 45 minutes
});

// Enhanced admin authentication check
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isWarmDelightsAdmin');
    const sessionToken = localStorage.getItem('adminSession');
    const loginTime = localStorage.getItem('adminLoginTime');

    // Check if admin flags exist
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

        if (diffMinutes > 120) { // 2 hours
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

    // Track logout
    trackAdminActivity('logout', { forced: force });

    // Clear all admin-related data
    localStorage.removeItem('isWarmDelightsAdmin');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminLoginHistory');
    
    // Optional: Clear admin attempts data (uncomment if needed)
    // localStorage.removeItem('adminAttempts');
    // localStorage.removeItem('adminLockout');
    
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
    const remainingMinutes = 120 - elapsedMinutes; // 2 hours total
    
    const timerElement = document.getElementById('sessionTimer');
    const sessionInfoElement = document.getElementById('sessionInfo');
    
    if (remainingMinutes > 0) {
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = Math.floor(remainingMinutes % 60);
        
        if (timerElement) {
            timerElement.textContent = `⏱️ ${hours}h ${minutes}m left`;
            timerElement.style.color = remainingMinutes < 15 ? '#ff4444' : 'white';
        }
        
        if (sessionInfoElement) {
            sessionInfoElement.textContent = remainingMinutes < 15 ? 'Session expiring soon' : 'Session active';
            sessionInfoElement.style.color = remainingMinutes < 15 ? '#ff4444' : 'white';
        }
    } else {
        logout(true);
    }
}

// Update timer every minute
setInterval(updateSessionTimer, 60000);

// Admin activity tracking
function trackAdminActivity(action, data = {}) {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    activities.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        session: localStorage.getItem('adminSession')
    });
    
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.splice(0, activities.length - 50);
    }
    
    localStorage.setItem('adminActivities', JSON.stringify(activities));
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
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            showStatus(`❌ ${file.name}: Invalid file type`, 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            showStatus(`❌ ${file.name}: File too large (max 5MB)`, 'error');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length > 0) {
        showStatus(`✅ ${validFiles.length} file(s) selected for upload`, 'success');
        window.selectedFiles = validFiles;
        trackAdminActivity('files_selected', { fileCount: validFiles.length });
    }
}

// Upload images with tracking
async function uploadImages() {
    const files = window.selectedFiles;
    if (!files || files.length === 0) {
        showStatus('❌ Please select images first', 'error');
        return;
    }
    
    showStatus('📤 Uploading images...', 'info');
    trackAdminActivity('upload_started', { fileCount: files.length });
    
    try {
        const uploadedImages = [];
        
        for (const file of files) {
            const base64 = await fileToBase64(file);
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                data: base64,
                uploadDate: new Date().toISOString(),
                size: file.size
            };
            uploadedImages.push(imageData);
        }
        
        // Save to localStorage
        const existingImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        const allImages = [...existingImages, ...uploadedImages];
        localStorage.setItem('adminGalleryImages', JSON.stringify(allImages));
        
        showStatus(`✅ Successfully uploaded ${uploadedImages.length} image(s)!`, 'success');
        loadAdminGallery();
        
        // Track successful upload
        trackAdminActivity('upload_completed', { 
            fileCount: uploadedImages.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0)
        });
        
        // Clear selection
        document.getElementById('imageUpload').value = '';
        window.selectedFiles = null;
        
    } catch (error) {
        showStatus('❌ Upload failed: ' + error.message, 'error');
        trackAdminActivity('upload_failed', { error: error.message });
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Load admin gallery
function loadAdminGallery() {
    const galleryContainer = document.getElementById('adminGallery');
    if (!galleryContainer) return;
    
    const images = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
    
    if (images.length === 0) {
        galleryContainer.innerHTML = '<p style="text-align: center; color: #6b4e57;">No images uploaded yet</p>';
        return;
    }
    
    galleryContainer.innerHTML = images.map(image => `
        <div class="admin-gallery-item">
            <img src="${image.data}" alt="${image.name}">
            <button class="delete-btn" onclick="deleteImage('${image.id}')" title="Delete image">
                ✕
            </button>
            <div class="image-info">
                <p style="font-weight: 600;">${image.name}</p>
                <p style="color: #9ca3af; margin-top: 5px;">
                    ${new Date(image.uploadDate).toLocaleDateString()}
                </p>
                <p style="color: #9ca3af;">
                    ${(image.size / 1024).toFixed(1)} KB
                </p>
            </div>
        </div>
    `).join('');
}

// Delete image with tracking
function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    const images = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
    const imageToDelete = images.find(img => img.id == imageId);
    const filteredImages = images.filter(img => img.id != imageId);
    localStorage.setItem('adminGalleryImages', JSON.stringify(filteredImages));
    
    // Track deletion
    trackAdminActivity('image_deleted', { 
        imageId: imageId,
        imageName: imageToDelete?.name 
    });
    
    loadAdminGallery();
    showStatus('✅ Image deleted successfully', 'success');
}

// Load analytics
function loadAnalytics() {
    const stats = getAnalyticsData();
    
    const elements = {
        totalVisitors: document.getElementById('totalVisitors'),
        todayVisitors: document.getElementById('todayVisitors'),
        cartAdditions: document.getElementById('cartAdditions'),
        whatsappOrders: document.getElementById('whatsappOrders'),
        chatInteractions: document.getElementById('chatInteractions'),
        contactSubmissions: document.getElementById('contactSubmissions')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key] || 0;
        }
    });
    
    trackAdminActivity('analytics_viewed');
}

// Get analytics data
function getAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const today = new Date().toDateString();
    
    return {
        totalVisitors: events.filter(e => e.type === 'page_visit').length,
        todayVisitors: events.filter(e => 
            e.type === 'page_visit' && 
            new Date(e.timestamp).toDateString() === today
        ).length,
        cartAdditions: events.filter(e => e.type === 'cart_add').length,
        whatsappOrders: events.filter(e => e.type === 'whatsapp_order').length,
        chatInteractions: events.filter(e => e.type === 'chat_message').length,
        contactSubmissions: events.filter(e => e.type === 'contact_submit').length
    };
}

// Load visitor log
function loadVisitorLog() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const recentEvents = events.slice(-20).reverse();
    
    const visitorLog = document.getElementById('visitorLog');
    if (!visitorLog) return;
    
    if (recentEvents.length === 0) {
        visitorLog.innerHTML = '<p style="text-align: center; color: #6b4e57;">No visitor activity yet</p>';
        return;
    }
    
    visitorLog.innerHTML = recentEvents.map(event => `
        <div class="log-entry">
            <span>${getEventDescription(event)}</span>
            <span style="color: #6b4e57; font-size: 12px;">
                ${new Date(event.timestamp).toLocaleString()}
            </span>
        </div>
    `).join('');
    
    trackAdminActivity('visitor_log_viewed');
}

// Load admin activity log
function loadActivityLog() {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    const recentActivities = activities.slice(-20).reverse();
    
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    if (recentActivities.length === 0) {
        activityLog.innerHTML = '<p style="text-align: center; color: #6b4e57;">No admin activity yet</p>';
        return;
    }
    
    activityLog.innerHTML = recentActivities.map(activity => `
        <div class="activity-entry">
            <span class="activity-action">${getActivityDescription(activity.action)}</span>
            <span class="activity-time">
                ${new Date(activity.timestamp).toLocaleString()}
            </span>
        </div>
    `).join('');
}

// Get event description
function getEventDescription(event) {
    const descriptions = {
        'page_visit': '👥 New visitor',
        'cart_add': '🛒 Added ' + (event.data?.itemName || 'item') + ' to cart',
        'whatsapp_order': '💬 Placed WhatsApp order (₹' + (event.data?.total || '0') + ')',
        'chat_message': '💬 Used chatbot',
        'contact_submit': '📧 Sent contact form',
        'custom_order': '🎨 Custom order request'
    };
    
    return descriptions[event.type] || '📊 Unknown activity';
}

// Get activity description
function getActivityDescription(action) {
    const descriptions = {
        'dashboard_access': '🚪 Accessed dashboard',
        'upload_started': '📤 Started image upload',
        'upload_completed': '✅ Completed image upload',
        'upload_failed': '❌ Image upload failed',
        'image_deleted': '🗑️ Deleted image',
        'files_selected': '📁 Selected files',
        'analytics_viewed': '📊 Viewed analytics',
        'visitor_log_viewed': '👥 Viewed visitor log',
        'session_extended': '⏰ Extended session',
        'dashboard_hidden': '👁️ Dashboard hidden',
        'dashboard_visible': '👁️ Dashboard visible',
        'dashboard_exit': '🚪 Exited dashboard',
        'logout': '🚪 Logged out'
    };
    
    return descriptions[action] || action;
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `<div class="status-message ${type}">${message}</div>`;
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
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
    document.getElementById(`${sectionName}-section`).classList.add('active');
    event.target.classList.add('active');
    
    // Load section-specific data and track
    trackAdminActivity(`section_viewed`, { section: sectionName });
    
    if (sectionName === 'analytics') {
        loadAnalytics();
    } else if (sectionName === 'visitors') {
        loadVisitorLog();
    } else if (sectionName === 'activity') {
        loadActivityLog();
    } else if (sectionName === 'gallery') {
        loadAdminGallery();
    }
}
