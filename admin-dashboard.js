// Enhanced Admin Dashboard JavaScript with Global Storage + Session Cache Integration
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
    
    // Auto-sync with global storage
    setTimeout(() => {
        syncWithGlobalStorage();
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

// **🌍 GLOBAL STORAGE CONFIGURATION**
const API_CONFIG = {
    BACKEND_URL: 'https://warm-delights-backend-production.up.railway.app',
    
    // Admin token configuration
    ADMIN_TOKEN: 'warmdelights_admin_token_2025',
    
    // Session cache for admin
    CACHE_KEY: 'warmDelights_admin_cache',
    CACHE_EXPIRY_KEY: 'warmDelights_admin_cache_expiry',
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes for admin
};

// **🔐 ENHANCED ADMIN AUTHENTICATION WITH GLOBAL STORAGE**
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

    // ADD THIS CHECK - Test backend connectivity with token
    const token = localStorage.getItem('adminSession');
    if (token && token.startsWith('eyJ')) { // Only test if it's a JWT token
        try {
            fetch(`${API_CONFIG.BACKEND_URL}/api/admin/analytics`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok && response.status === 401) {
                    console.log('Token invalid, will redirect to login on next admin action');
                    // Don't redirect immediately, just log - let specific actions handle 401
                }
            })
            .catch(error => {
                console.log('Backend connectivity test failed:', error);
                // Continue with local auth as fallback
            });
        } catch (error) {
            console.log('Token validation error:', error);
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

    // Clear all admin-related data including cache
    localStorage.removeItem('isWarmDelightsAdmin');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminLoginHistory');
    localStorage.removeItem('adminToken');
    
    // Clear admin session cache
    sessionStorage.removeItem(API_CONFIG.CACHE_KEY);
    sessionStorage.removeItem(API_CONFIG.CACHE_EXPIRY_KEY);
    
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

// **📊 ENHANCED ADMIN ACTIVITY TRACKING WITH GLOBAL STORAGE**
function trackAdminActivity(action, data = {}) {
    // Store in session storage
    const sessionActivities = JSON.parse(sessionStorage.getItem('adminSessionActivities') || '[]');
    sessionActivities.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        session: localStorage.getItem('adminSession')
    });
    
    if (sessionActivities.length > 50) {
        sessionActivities.splice(0, sessionActivities.length - 50);
    }
    sessionStorage.setItem('adminSessionActivities', JSON.stringify(sessionActivities));

    // Store in localStorage for persistence
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    activities.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        session: localStorage.getItem('adminSession')
    });
    
    // Keep only last 100 activities in localStorage
    if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
    }
    localStorage.setItem('adminActivities', JSON.stringify(activities));

    // Send to global storage backend
    try {
        const token = localStorage.getItem('adminSession');
        if (token) {
            fetch(`${API_CONFIG.BACKEND_URL}/api/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventType: `admin_${action}`,
                    data: data
                })
            }).catch(() => {
                console.log('Admin activity stored locally - backend offline');
            });
        }
    } catch (error) {
        console.log('Admin activity stored locally');
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
        trackAdminActivity('files_selected', { fileCount: validFiles.length });
    }
}

// **📤 ENHANCED UPLOAD TO GLOBAL STORAGE**
async function uploadImages() {
    const files = window.selectedFiles;
    if (!files || files.length === 0) {
        showStatus('❌ Please select images first', 'error');
        return;
    }
    
    showStatus('📤 Uploading to global storage...', 'info');
    trackAdminActivity('upload_started', { fileCount: files.length });
    
    try {
        let successCount = 0;
        let localCount = 0;
        
        // Get admin token for backend upload
        const token = localStorage.getItem('adminSession') || API_CONFIG.ADMIN_TOKEN;
        
        for (const file of files) {
            // 1. Upload to global storage backend (primary)
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/gallery/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    },
                    body: formData
                });
                
                // Check for authentication failure
                if (backendResponse.status === 401) {
                    alert('❌ Session expired. Please login again.');
                    window.location.href = 'admin-login.html';
                    return;
                }
                
                // Check for other errors
                if (!backendResponse.ok) {
                    throw new Error(`Upload failed: ${backendResponse.status} ${backendResponse.statusText}`);
                }
                
                const result = await backendResponse.json();
                console.log('✅ Global storage upload successful:', result);
                successCount++;
                
            } catch (backendError) {
                console.error('❌ Global storage upload failed:', backendError);
                
                // 2. Fallback to localStorage (if backend fails)
                const base64 = await fileToBase64(file);
                const localImageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    filename: file.name,
                    data: base64,
                    uploadDate: new Date().toISOString(),
                    size: file.size,
                    source: 'localStorage'
                };
                
                const existingImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
                existingImages.push(localImageData);
                localStorage.setItem('adminGalleryImages', JSON.stringify(existingImages));
                localCount++;
            }
        }
        
        // Show appropriate success message
        if (successCount === files.length) {
            showStatus(`✅ Successfully uploaded ${successCount} image(s) to global storage!`, 'success');
        } else if (successCount > 0) {
            showStatus(`⚠️ Uploaded ${successCount} to global storage, ${localCount} locally`, 'warning');
        } else {
            showStatus(`⚠️ Uploaded ${localCount} image(s) locally (global storage unavailable)`, 'warning');
        }
        
        // Clear admin cache to force refresh
        sessionStorage.removeItem(API_CONFIG.CACHE_KEY);
        sessionStorage.removeItem(API_CONFIG.CACHE_EXPIRY_KEY);
        
        // Reload gallery
        loadAdminGallery();
        
        // Track successful upload
        trackAdminActivity('upload_completed', { 
            fileCount: files.length,
            globalStorageUploads: successCount,
            localUploads: localCount,
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

// **🔄 SYNC WITH GLOBAL STORAGE**
async function syncWithGlobalStorage() {
    console.log('🔄 Syncing with global storage...');
    
    try {
        const token = localStorage.getItem('adminSession') || API_CONFIG.ADMIN_TOKEN;
        
        // Check global storage connection
        const healthResponse = await fetch(`${API_CONFIG.BACKEND_URL}/health`);
        if (!healthResponse.ok) {
            throw new Error('Global storage not available');
        }
        
        // Get current state from global storage
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
            const globalImages = await response.json();
            console.log(`✅ Global storage has ${globalImages.length} images`);
            
            // Update cache with global storage state
            const cacheData = {
                images: globalImages,
                timestamp: Date.now(),
                source: 'global-storage'
            };
            sessionStorage.setItem(API_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
            sessionStorage.setItem(API_CONFIG.CACHE_EXPIRY_KEY, (Date.now() + API_CONFIG.CACHE_DURATION).toString());
            
            showStatus(`🔄 Synced with global storage (${globalImages.length} images)`, 'info');
            trackAdminActivity('sync_completed', { globalImages: globalImages.length });
            
            return globalImages;
        }
    } catch (error) {
        console.log('❌ Global storage sync failed:', error);
        showStatus('⚠️ Using local data - global storage unavailable', 'warning');
    }
    
    return null;
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

// **🖼️ ENHANCED ADMIN GALLERY WITH GLOBAL STORAGE + SESSION CACHE**
async function loadAdminGallery() {
    const galleryContainer = document.getElementById('adminGallery');
    if (!galleryContainer) return;

    try {
        // Step 1: Try session cache first
        const cached = sessionStorage.getItem(API_CONFIG.CACHE_KEY);
        const expiry = sessionStorage.getItem(API_CONFIG.CACHE_EXPIRY_KEY);
        
        if (cached && expiry && Date.now() < parseInt(expiry)) {
            const cacheData = JSON.parse(cached);
            console.log('⚡ Loading admin gallery from cache:', cacheData.images.length);
            displayAdminImages(cacheData.images, 'session-cache');
            return;
        }

        // Step 2: Show loading state
        galleryContainer.innerHTML = `
            <div class="admin-loading" style="text-align: center; padding: 40px; color: var(--primary-pink);">
                <div class="loading-spinner" style="
                    border: 3px solid var(--secondary-pink);
                    border-top: 3px solid var(--primary-pink);
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                "></div>
                <p>Loading from global storage...</p>
            </div>
        `;

        // Step 3: Try to load from global storage
        const token = localStorage.getItem('adminSession') || API_CONFIG.ADMIN_TOKEN;
        
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/images`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (response.ok) {
            const globalImages = await response.json();
            console.log(`✅ Loaded ${globalImages.length} images from global storage`);
            
            // Cache the results
            const cacheData = {
                images: globalImages,
                timestamp: Date.now(),
                source: 'global-storage'
            };
            sessionStorage.setItem(API_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
            sessionStorage.setItem(API_CONFIG.CACHE_EXPIRY_KEY, (Date.now() + API_CONFIG.CACHE_DURATION).toString());
            
            displayAdminImages(globalImages, 'global-storage');
            trackAdminActivity('admin_gallery_viewed', { source: 'global-storage', count: globalImages.length });
            return;
        }

        throw new Error('Global storage not available');
    } catch (error) {
        console.log('⚠️ Global storage unavailable, using localStorage:', error);
        
        // Step 4: Fallback to localStorage
        const localImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        displayAdminImages(localImages, 'localStorage');
        trackAdminActivity('admin_gallery_viewed', { source: 'localStorage', count: localImages.length });
    }
}

// **🎨 DISPLAY ADMIN IMAGES WITH SOURCE INDICATOR**
function displayAdminImages(images, source) {
    const galleryContainer = document.getElementById('adminGallery');
    if (!galleryContainer) return;
    if (images.length === 0) {
        galleryContainer.innerHTML = `<div>No images uploaded yet</div>`;
        return;
    }
    const sourceIndicator = {
        'session-cache': { icon: '⚡', text: 'From Cache', color: '#4CAF50' },
        'global-storage': { icon: '🌍', text: 'Global Storage', color: '#2196F3' },
        'localStorage': { icon: '📱', text: 'Local Only', color: '#ff9800' }
    };
    const indicator = sourceIndicator[source] || sourceIndicator['localStorage'];
    galleryContainer.innerHTML = `
        <div class="gallery-source-indicator" style="background: ${indicator.color}; color: white;">
            ${indicator.icon} ${indicator.text} • ${images.length} images
        </div>
        ${images.map((image, index) => {
            const imageUrl = image.url || `${API_CONFIG.BACKEND_URL}/uploads/${image.filename || image}`;
            const imageName = image.originalName || image.name || image.filename || image;
            const imageDate = image.uploadedAt || image.uploadDate || 'Unknown';
            const imageSize = image.size ? `${(image.size / 1024).toFixed(1)} KB` : 'Unknown';
            const imageId = image.id || `${imageName}_${index}`;
            return `
                <div class="admin-gallery-item" style="animation-delay: ${index * 0.1}s;">
                    <img src="${imageUrl}" alt="${imageName}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="image-error" style="display:none; align-items:center; justify-content:center; height:160px; background:#f5f5f5; color:#666; font-size:12px;">
                        Image Not Available
                    </div>
                    ${source !== 'global-storage' ? `<button class="delete-btn" onclick="deleteImage('${imageId}')" title="Delete image">✕</button>` : ''}
                    <div class="image-info">
                        <p class="image-name" title="${imageName}">${imageName}</p>
                        <div class="image-details">
                            <span>${new Date(imageDate).toLocaleDateString()}</span>
                            <span>${imageSize}</span>
                        </div>
                        <div class="image-status" style="margin-top:5px;">
                            <span class="status-badge" style="background: ${indicator.color}; color: white; font-size: 10px; border-radius: 10px; padding: 2px 6px;">
                                ${indicator.text}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
    `;
    // Update image uploads count in analytics UI
    const imageUploadsElement = document.getElementById('imageUploads');
    if (imageUploadsElement) {
        imageUploadsElement.textContent = images.length;
    }
}

// **🗑️ DELETE IMAGE WITH GLOBAL STORAGE INTEGRATION**
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
        // Try to delete from global storage first
        const token = localStorage.getItem('adminSession') || API_CONFIG.ADMIN_TOKEN;
        
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/gallery/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('✅ Image deleted from global storage');
                showStatus('✅ Image deleted from global storage', 'success');
                
                // Clear cache to force refresh
                sessionStorage.removeItem(API_CONFIG.CACHE_KEY);
                sessionStorage.removeItem(API_CONFIG.CACHE_EXPIRY_KEY);
                
                loadAdminGallery();
                trackAdminActivity('image_deleted_global', { imageId: imageId });
                return;
            }
        } catch (globalError) {
            console.log('Global storage delete failed, trying localStorage:', globalError);
        }
        
        // Fallback: delete from localStorage
        const images = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
        const imageToDelete = images.find(img => img.id == imageId);
        const filteredImages = images.filter(img => img.id != imageId);
        
        localStorage.setItem('adminGalleryImages', JSON.stringify(filteredImages));
        
        loadAdminGallery();
        showStatus('✅ Image deleted from local storage', 'warning');
        trackAdminActivity('image_deleted_local', { 
            imageId: imageId,
            imageName: imageToDelete?.name 
        });
        
    } catch (error) {
        console.error('Delete error:', error);
        showStatus('❌ Failed to delete image', 'error');
    }
}

// **📊 ENHANCED ANALYTICS WITH GLOBAL STORAGE**
async function loadAnalytics() {
    try {
        // Try to load from global storage backend
        const token = localStorage.getItem('adminSession') || API_CONFIG.ADMIN_TOKEN;
        
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/admin/analytics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const backendStats = await response.json();
                console.log('✅ Analytics loaded from global storage:', backendStats);
                displayAnalytics(backendStats.stats, 'global-storage');
                trackAdminActivity('analytics_viewed', { source: 'global-storage' });
                return;
            }
        } catch (error) {
            console.log('Global storage analytics not available, using localStorage');
        }
        
        // Fallback to localStorage analytics
        const stats = getLocalAnalyticsData();
        displayAnalytics(stats, 'localStorage');
        trackAdminActivity('analytics_viewed', { source: 'localStorage' });
        
    } catch (error) {
        console.error('Analytics load error:', error);
        const stats = getLocalAnalyticsData();
        displayAnalytics(stats, 'localStorage');
    }
}

// **📈 DISPLAY ANALYTICS WITH SOURCE INDICATOR**
function displayAnalytics(stats, source = 'localStorage') {
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
            'localStorage': { icon: '📱', text: 'Local Data', color: '#ff9800' }
        };
        
        const info = sourceInfo[source] || sourceInfo['localStorage'];
        sourceIndicator.innerHTML = `
            <span style="color: ${info.color}; font-size: 12px;">
                ${info.icon} ${info.text}
            </span>
        `;
    }
}

// Get local analytics data
function getLocalAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const sessionEvents = JSON.parse(sessionStorage.getItem('warmDelightsEvents') || '[]');
    const allEvents = [...events, ...sessionEvents];
    const adminImages = JSON.parse(localStorage.getItem('adminGalleryImages') || '[]');
    const today = new Date().toDateString();
    
    return {
        totalVisitors: allEvents.filter(e => e.type === 'page_visit').length,
        todayVisitors: allEvents.filter(e => 
            e.type === 'page_visit' && 
            new Date(e.timestamp).toDateString() === today
        ).length,
        cartAdditions: allEvents.filter(e => e.type === 'cart_add').length,
        whatsappOrders: allEvents.filter(e => e.type === 'whatsapp_order').length,
        chatInteractions: allEvents.filter(e => e.type === 'chat_message').length,
        contactSubmissions: allEvents.filter(e => e.type === 'contact_submit').length,
        imageUploads: adminImages.length,
        imageViews: allEvents.filter(e => e.type === 'image_view').length
    };
}

// **👥 ENHANCED VISITOR LOG**
function loadVisitorLog() {
    const events = JSON.parse(localStorage.getItem('warmDelightsEvents') || '[]');
    const sessionEvents = JSON.parse(sessionStorage.getItem('warmDelightsEvents') || '[]');
    const allEvents = [...events, ...sessionEvents]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 30); // Last 30 events
    
    const visitorLog = document.getElementById('visitorLog');
    if (!visitorLog) return;
    
    if (allEvents.length === 0) {
        visitorLog.innerHTML = '<p style="text-align: center; color: #6b4e57;">No visitor activity yet</p>';
        return;
    }
    
    visitorLog.innerHTML = allEvents.map(event => `
        <div class="log-entry" style="
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            align-items: center;
        ">
            <span style="flex: 1;">${getEventDescription(event)}</span>
            <span style="color: #6b4e57; font-size: 11px; white-space: nowrap; margin-left: 10px;">
                ${new Date(event.timestamp).toLocaleString()}
            </span>
        </div>
    `).join('');
    
    trackAdminActivity('visitor_log_viewed');
}

// **📋 ENHANCED ACTIVITY LOG**
function loadActivityLog() {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    const sessionActivities = JSON.parse(sessionStorage.getItem('adminSessionActivities') || '[]');
    const allActivities = [...activities, ...sessionActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 30); // Last 30 activities
    
    const activityLog = document.getElementById('activityLog');
    if (!activityLog) return;
    
    if (allActivities.length === 0) {
        activityLog.innerHTML = '<p style="text-align: center; color: #6b4e57;">No admin activity yet</p>';
        return;
    }
    
    activityLog.innerHTML = allActivities.map(activity => `
        <div class="activity-entry" style="
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            align-items: center;
        ">
            <span class="activity-action" style="flex: 1;">${getActivityDescription(activity.action)}</span>
            <span class="activity-time" style="color: #6b4e57; font-size: 11px; white-space: nowrap; margin-left: 10px;">
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
        'gallery_viewed': '🖼️ Viewed gallery (' + (event.data?.imageCount || 0) + ' images)',
        'image_view': '👁️ Viewed image'
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
        'image_deleted_global': '🗑️ Deleted image from global storage',
        'image_deleted_local': '🗑️ Deleted image from local storage',
        'files_selected': '📁 Selected files',
        'analytics_viewed': '📊 Viewed analytics',
        'visitor_log_viewed': '👥 Viewed visitor log',
        'admin_gallery_viewed': '🖼️ Viewed admin gallery',
        'session_extended': '⏰ Extended session',
        'sync_completed': '🔄 Synced with global storage',
        'dashboard_hidden': '👁️ Dashboard hidden',
        'dashboard_visible': '👁️ Dashboard visible',
        'dashboard_exit': '🚪 Exited dashboard',
        'logout': '🚪 Logged out'
    };
    
    return descriptions[action] || action;
}

// **📱 ENHANCED STATUS MESSAGES**
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('uploadStatus');
    if (!statusDiv) return;

    const icons = {
        'success': '✅',
        'error': '❌', 
        'warning': '⚠️',
        'info': 'ℹ️'
    };

    statusDiv.innerHTML = `
        <div class="status-message ${type}">
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;

    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

// **🔄 REFRESH GALLERY WITH GLOBAL STORAGE**
async function refreshGallery() {
    // Clear all caches
    sessionStorage.removeItem(API_CONFIG.CACHE_KEY);
    sessionStorage.removeItem(API_CONFIG.CACHE_EXPIRY_KEY);
    
    showStatus('🔄 Refreshing gallery from global storage...', 'info');
    
    await loadAdminGallery();
    trackAdminActivity('gallery_refreshed');
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

// **⌨️ ENHANCED KEYBOARD SHORTCUTS**
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
    
    // Ctrl+R for refresh everything
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshGallery();
        loadAnalytics();
        loadVisitorLog();
        loadActivityLog();
        showStatus('🔄 All data refreshed', 'info');
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
    
    // Ctrl+S for sync with global storage
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        syncWithGlobalStorage();
    }

    // Ctrl+U for upload
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) fileInput.click();
    }
});

// **👁️ VISIBILITY CHANGE TRACKING**
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        trackAdminActivity('dashboard_hidden');
    } else {
        trackAdminActivity('dashboard_visible');
        // Refresh data when coming back
        if (document.getElementById('gallery-section').classList.contains('active')) {
            loadAdminGallery();
        }
    }
});

// **⚠️ BEFORE UNLOAD WARNING**
window.addEventListener('beforeunload', function(e) {
    trackAdminActivity('dashboard_exit');
});

// **🔍 DEBUG TOOLS FOR ADMIN**
window.adminDebugTools = {
    checkGlobalStorage: () => fetch(`${API_CONFIG.BACKEND_URL}/health`).then(r => r.json()),
    clearAllCaches: () => {
        sessionStorage.clear();
        showStatus('🗑️ All caches cleared', 'info');
    },
    testConnection: () => {
        showStatus('🔗 Testing connection...', 'info');
        checkAPIConnection();
    }
};

console.log('🚀 Warm Delights Admin Dashboard v3.0.0 loaded');
console.log('🛠️ Debug tools available:', window.adminDebugTools);

// Add loading styles
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .admin-loading .loading-spinner {
        border: 3px solid var(--secondary-pink);
        border-top: 3px solid var(--primary-pink);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(adminStyles);
