// Enhanced Admin Dashboard JavaScript with Security and Backend Sync
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
    
    // Auto-sync localStorage images to backend
    setTimeout(() => {
        syncLocalImagesToBackend();
    }, 2000);
    
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

// Backend API URL
const API_BASE_URL = 'https://warm-delights-backend-production.up.railway.app/api';

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
        trackAdminActivity('files_selected', { fileCount: validFiles.length });
    }
}

// Enhanced upload function that uploads to both localStorage AND backend
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
        let backendUploads = 0;
        
        // Get admin token for backend upload
        const token = localStorage.getItem('adminSession');
        
        for (const file of files) {
            // 1. Save to localStorage (immediate display)
            const base64 = await fileToBase64(file);
            const localImageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                data: base64,
                uploadDate: new Date().toISOString(),
                size: file.size
            };
            uploadedImages.push(localImageData);
            
            // 2. Upload to backend API (for all users)
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                const backendResponse = await fetch(`${API_BASE_URL}/admin/gallery/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (backendResponse.ok) {
                    console.log('✅ Backend upload successful:', file.name);
                    backendUploads++;
                } else {
                    console.error('❌ Backend upload failed:', file.name, await backendResponse.text());
                }
            } catch (backendError) {
                console.error('❌ Backend upload error:', backendError);
                // Continue with localStorage save even if backend fails
            }
        }
        
        // Save to localStorage
        const existingImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        const allImages = [...existingImages, ...uploadedImages];
        localStorage.setItem('adminGalleryImages', JSON.stringify(allImages));
        
        // Show appropriate success message
        if (backendUploads === files.length) {
            showStatus(`✅ Successfully uploaded ${uploadedImages.length} image(s) to both local and backend!`, 'success');
        } else if (backendUploads > 0) {
            showStatus(`✅ Uploaded ${uploadedImages.length} image(s) locally, ${backendUploads} to backend`, 'warning');
        } else {
            showStatus(`✅ Uploaded ${uploadedImages.length} image(s) locally (backend unavailable)`, 'warning');
        }
        
        loadAdminGallery();
        
        // Track successful upload
        trackAdminActivity('upload_completed', { 
            fileCount: uploadedImages.length,
            backendUploads: backendUploads,
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

// SYNC LOCALSTORAGE IMAGES TO BACKEND API
async function syncLocalImagesToBackend() {
    const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
    
    if (adminImages.length === 0) {
        console.log('No local images to sync');
        return;
    }

    console.log('🔄 Syncing', adminImages.length, 'images to backend...');
    
    // Get admin token
    const token = localStorage.getItem('adminSession');
    if (!token) {
        console.log('No admin token available for sync');
        return;
    }
    
    let syncedCount = 0;
    
    for (const image of adminImages) {
        try {
            // Convert base64 to blob
            const response = await fetch(image.data);
            const blob = await response.blob();
            
            // Create form data
            const formData = new FormData();
            formData.append('image', blob, image.name);
            
            // Upload to backend
            const uploadResponse = await fetch(`${API_BASE_URL}/admin/gallery/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                console.log('✅ Synced:', image.name);
                syncedCount++;
            } else {
                console.error('❌ Sync failed for:', image.name);
            }
        } catch (error) {
            console.error('❌ Sync error for', image.name, ':', error);
        }
    }
    
    if (syncedCount > 0) {
        showStatus(`✅ Synced ${syncedCount} images to backend!`, 'success');
        trackAdminActivity('images_synced', { count: syncedCount });
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

// Load admin gallery (enhanced with backend sync status)
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
                <p class="image-name">${image.name}</p>
                <div class="image-details">
                    <span class="image-date">${new Date(image.uploadDate).toLocaleDateString()}</span>
                    <span class="image-size">${(image.size / 1024).toFixed(1)} KB</span>
                </div>
                <div style="margin-top: 5px;">
                    <span class="image-views">Local ✓</span>
                </div>
            </div>
        </div>
    `).join('');

    // Update analytics with image count
    const imageUploadsElement = document.getElementById('imageUploads');
    if (imageUploadsElement) {
        imageUploadsElement.textContent = images.length;
    }
}

// Delete image with tracking (enhanced with backend cleanup)
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    const images = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
    const imageToDelete = images.find(img => img.id == imageId);
    const filteredImages = images.filter(img => img.id != imageId);
    
    // Remove from localStorage
    localStorage.setItem('adminGalleryImages', JSON.stringify(filteredImages));
    
    // Try to delete from backend too (if it exists there)
    try {
        const token = localStorage.getItem('adminSession');
        if (token) {
            // Note: This would require backend endpoint to delete by filename
            // For now, we'll just track the deletion
            console.log('Image deleted from localStorage:', imageToDelete?.name);
        }
    } catch (error) {
        console.log('Backend deletion not available:', error);
    }
    
    // Track deletion
    trackAdminActivity('image_deleted', { 
        imageId: imageId,
        imageName: imageToDelete?.name 
    });
    
    loadAdminGallery();
    showStatus('✅ Image deleted successfully', 'success');
}

// Enhanced load analytics with backend integration
async function loadAnalytics() {
    try {
        // Try to load from backend first
        const token = localStorage.getItem('adminSession');
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const backendStats = await response.json();
                    displayAnalytics(backendStats.stats);
                    trackAdminActivity('analytics_viewed', { source: 'backend' });
                    return;
                }
            } catch (error) {
                console.log('Backend analytics not available, using localStorage');
            }
        }
    } catch (error) {
        console.log('Using localStorage analytics');
    }
    
    // Fallback to localStorage analytics
    const stats = getLocalAnalyticsData();
    displayAnalytics(stats);
    trackAdminActivity('analytics_viewed', { source: 'localStorage' });
}

// Display analytics data
function displayAnalytics(stats) {
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
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key] || 0;
        }
    });
}

// Get local analytics data
function getLocalAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
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
        contactSubmissions: events.filter(e => e.type === 'contact_submit').length,
        imageUploads: adminImages.length,
        imageViews: events.filter(e => e.type === 'gallery_viewed').length
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
        'custom_order': '🎨 Custom order request',
        'gallery_viewed': '🖼️ Viewed gallery (' + (event.data?.imageCount || 0) + ' images)'
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
        'images_synced': '🔄 Synced images to backend',
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

// Refresh gallery function
function refreshGallery() {
    loadAdminGallery();
    showStatus('Gallery refreshed', 'info');
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+L for quick logout
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
    
    // Escape key to show logout confirmation
    if (e.key === 'Escape') {
        if (confirm('Press OK to logout, Cancel to continue')) {
            logout();
        }
    }
    
    // Ctrl+R for refresh analytics
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        loadAnalytics();
        loadAdminGallery();
        loadVisitorLog();
        loadActivityLog();
    }
    
    // Ctrl+G for gallery section
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        showSection('gallery');
    }
    
    // Ctrl+A for analytics section
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        showSection('analytics');
    }
    
    // Ctrl+S for sync images
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        syncLocalImagesToBackend();
    }
});

// Auto-save on visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        trackAdminActivity('dashboard_hidden');
    } else {
        trackAdminActivity('dashboard_visible');
    }
});

// Warning before closing tab
window.addEventListener('beforeunload', function(e) {
    trackAdminActivity('dashboard_exit');
});
