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

/* ======================
   AUTH & SESSION HANDLING
   ====================== */
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isWarmDelightsAdmin');
    const sessionToken = localStorage.getItem('adminSession');
    const loginTime = localStorage.getItem('adminLoginTime');

    if (!isAdmin || !sessionToken) {
        alert('🔒 Unauthorized access. Please login to continue.');
        window.location.href = 'admin-login.html';
        return false;
    }

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

function logout(force = false) {
    if (!force && !confirm('Are you sure you want to logout?')) {
        return;
    }

    trackAdminActivity('logout', { forced: force });

    localStorage.removeItem('isWarmDelightsAdmin');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminLoginHistory');
    
    if (!force) {
        alert('👋 Logged out successfully');
    }
    window.location.href = 'admin-login.html';
}

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
        
        if (sessionInfoElement) {
            sessionInfoElement.textContent = remainingMinutes < 15 ? 'Session expiring soon' : 'Session active';
            sessionInfoElement.style.color = remainingMinutes < 15 ? '#ff4444' : 'white';
        }
    } else {
        logout(true);
    }
}
setInterval(updateSessionTimer, 60000);

/* ======================
   ACTIVITY TRACKING
   ====================== */
function trackAdminActivity(action, data = {}) {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    activities.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        session: localStorage.getItem('adminSession')
    });
    
    if (activities.length > 50) {
        activities.splice(0, activities.length - 50);
    }
    localStorage.setItem('adminActivities', JSON.stringify(activities));
}

/* ======================
   IMAGE UPLOAD & GALLERY
   ====================== */
function initializeAdmin() {
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

// ✅ Upload ONLY to backend
async function uploadImages() {
    const files = window.selectedFiles;
    if (!files || files.length === 0) {
        showStatus('❌ Please select images first', 'error');
        return;
    }

    showStatus('📤 Uploading images...', 'info');
    trackAdminActivity('upload_started', { fileCount: files.length });

    try {
        const token = localStorage.getItem('adminSession');
        let backendUploads = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);

            const backendResponse = await fetch(`${API_BASE_URL}/admin/gallery/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (backendResponse.ok) {
                console.log('✅ Backend upload successful:', file.name);
                backendUploads++;
            } else {
                console.error('❌ Backend upload failed:', file.name, await backendResponse.text());
            }
        }

        if (backendUploads > 0) {
            showStatus(`✅ Uploaded ${backendUploads} image(s) to backend!`, 'success');
            loadAdminGallery();
        } else {
            showStatus('❌ Upload failed, please try again', 'error');
        }

        document.getElementById('imageUpload').value = '';
        window.selectedFiles = null;

        trackAdminActivity('upload_completed', { backendUploads: backendUploads });
    } catch (error) {
        showStatus('❌ Upload failed: ' + error.message, 'error');
        trackAdminActivity('upload_failed', { error: error.message });
    }
}

// ✅ Load gallery from backend only
async function loadAdminGallery() {
    const galleryContainer = document.getElementById('adminGallery');
    if (!galleryContainer) return;

    try {
        const token = localStorage.getItem('adminSession');
        const response = await fetch(`${API_BASE_URL}/admin/gallery`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const images = await response.json();

        if (!images || images.length === 0) {
            galleryContainer.innerHTML = '<p style="text-align: center; color: #6b4e57;">No images uploaded yet</p>';
            return;
        }

        galleryContainer.innerHTML = images.map(img => `
            <div class="admin-gallery-item">
                <img src="${API_BASE_URL.replace('/api','')}/uploads/${img.filename}" alt="${img.name}">
                <button class="delete-btn" onclick="deleteImage('${img.filename}')">✖</button>
                <div class="image-info">
                    <p>${img.name}</p>
                    <p>${new Date(img.uploadDate).toLocaleString()}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Failed to load gallery:', error);
        galleryContainer.innerHTML = '<p>Error loading gallery</p>';
    }
}

async function deleteImage(filename) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
        const token = localStorage.getItem('adminSession');
        const response = await fetch(`${API_BASE_URL}/admin/gallery/${filename}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showStatus('✅ Image deleted successfully', 'success');
            trackAdminActivity('image_deleted', { filename });
            loadAdminGallery();
        } else {
            showStatus('❌ Failed to delete image', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        showStatus('❌ Error deleting image', 'error');
    }
}

/* ======================
   ANALYTICS & LOGGING
   ====================== */
async function loadAnalytics() {
    try {
        const token = localStorage.getItem('adminSession');
        if (token) {
            const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const backendStats = await response.json();
                displayAnalytics(backendStats.stats);
                trackAdminActivity('analytics_viewed', { source: 'backend' });
                return;
            }
        }
    } catch (error) {
        console.log('Backend analytics not available, using localStorage');
    }
    const stats = getLocalAnalyticsData();
    displayAnalytics(stats);
    trackAdminActivity('analytics_viewed', { source: 'localStorage' });
}

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

function getLocalAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const today = new Date().toDateString();
    return {
        totalVisitors: events.filter(e => e.type === 'page_visit').length,
        todayVisitors: events.filter(e => e.type === 'page_visit' && new Date(e.timestamp).toDateString() === today).length,
        cartAdditions: events.filter(e => e.type === 'cart_add').length,
        whatsappOrders: events.filter(e => e.type === 'whatsapp_order').length,
        chatInteractions: events.filter(e => e.type === 'chat_message').length,
        contactSubmissions: events.filter(e => e.type === 'contact_submit').length,
        imageUploads: 0,
        imageViews: events.filter(e => e.type === 'gallery_viewed').length
    };
}

/* ======================
   VISITOR + ACTIVITY LOG
   ====================== */
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
            <span style="color: #6b4e57; font-size: 12px;">${new Date(event.timestamp).toLocaleString()}</span>
        </div>
    `).join('');
    trackAdminActivity('visitor_log_viewed');
}

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
            <span class="activity-time">${new Date(activity.timestamp).toLocaleString()}</span>
        </div>
    `).join('');
}

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

/* ======================
   UI HELPERS
   ====================== */
function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;
    statusDiv.innerHTML = `<div class="status-message ${type}">${message}</div>`;
    setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
}

function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${sectionName}-section`).classList.add('active');
    event.target.classList.add('active');
    trackAdminActivity(`section_viewed`, { section: sectionName });
    if (sectionName === 'analytics') loadAnalytics();
    else if (sectionName === 'visitors') loadVisitorLog();
    else if (sectionName === 'activity') loadActivityLog();
    else if (sectionName === 'gallery') loadAdminGallery();
}

function refreshGallery() {
    loadAdminGallery();
    showStatus('Gallery refreshed', 'info');
}

/* ======================
   SHORTCUTS + EVENTS
   ====================== */
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); logout(); }
    if (e.key === 'Escape') { if (confirm('Press OK to logout, Cancel to continue')) logout(); }
    if (e.ctrlKey && e.key === 'r') { e.preventDefault(); loadAnalytics(); loadAdminGallery(); loadVisitorLog(); loadActivityLog(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); showSection('gallery'); }
    if (e.ctrlKey && e.key === 'a') { e.preventDefault(); showSection('analytics'); }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) trackAdminActivity('dashboard_hidden');
    else trackAdminActivity('dashboard_visible');
});

window.addEventListener('beforeunload', function() {
    trackAdminActivity('dashboard_exit');
});
