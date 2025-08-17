// Configuration
const API_BASE = 'http://localhost:5000/api';
const MAX_CONTENT_LENGTH = 500;

// State management
let isLoading = false;

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Authentication functions
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return token;
}

function handleAuthError() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

// API functions
async function apiRequest(url, options = {}) {
  const token = checkAuth();
  if (!token) return null;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      handleAuthError();
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Post loading function
async function loadPosts() {
  if (isLoading) return;
  isLoading = true;
  
  const postContainer = document.getElementById('posts');
  
  try {
    const response = await apiRequest(`${API_BASE}/posts`);
    if (!response) return;
    
    const posts = await response.json();
    
    if (posts.length === 0) {
      postContainer.innerHTML = `
        <div class="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to share something with your squad!</p>
        </div>
      `;
      return;
    }
    
    postContainer.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-header">
          <div class="post-author">${escapeHtml(post.author || 'Anonymous')}</div>
          <div class="post-time">${formatRelativeTime(post.createdAt)}</div>
        </div>
        ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
        ${post.image ? `<img src="${post.image}" alt="Post Image" class="post-image">` : ''}
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading posts:', error);
    postContainer.innerHTML = `
      <div class="error">
        <h3>Error loading posts</h3>
        <p>Please check your connection and try again.</p>
        <button onclick="loadPosts()" class="retry-btn">Retry</button>
      </div>
    `;
  } finally {
    isLoading = false;
  }
}

// Image preview functions
function showImagePreview(file) {
  const preview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImage');
  
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      document.getElementById('imageUpload').value = '';
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      document.getElementById('imageUpload').value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    hideImagePreview();
  }
}

function hideImagePreview() {
  const preview = document.getElementById('imagePreview');
  const imageUpload = document.getElementById('imageUpload');
  preview.style.display = 'none';
  imageUpload.value = '';
}

// Character count function
function updateCharacterCount() {
  const content = document.getElementById('postContent').value;
  const charCount = document.getElementById('charCount');
  const length = content.length;
  
  charCount.textContent = `${length}/${MAX_CONTENT_LENGTH}`;
  
  // Update styling based on character count
  charCount.className = 'character-count';
  if (length > MAX_CONTENT_LENGTH * 0.9) {
    charCount.className += ' danger';
  } else if (length > MAX_CONTENT_LENGTH * 0.75) {
    charCount.className += ' warning';
  }
}

// Form validation
function validateForm() {
  const content = document.getElementById('postContent').value.trim();
  const imageFile = document.getElementById('imageUpload').files[0];
  const postBtn = document.getElementById('postBtn');
  
  // For now, only validate content since image upload isn't implemented
  const isValid = content.length > 0;
  const isContentValid = content.length <= MAX_CONTENT_LENGTH;
  
  postBtn.disabled = !isValid || !isContentValid;
  
  return isValid && isContentValid;
}

// Post creation function
async function createPost(content, imageFile) {
  try {
    // For now, we'll send as JSON since your backend expects imageURL
    // In a real app, you'd upload the image to a service like Cloudinary first
    const postData = {
      content: content || '',
      imageURL: '' // For now, empty since we need image upload service
    };

    const response = await apiRequest(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    
    if (!response) return { success: false, message: 'Authentication failed' };
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Error creating post' };
    }
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// Event handlers
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    alert('Please write something or upload an image!');
    return;
  }
  
  submitPost();
}

async function submitPost() {
  const postBtn = document.getElementById('postBtn');
  const originalText = postBtn.textContent;
  postBtn.disabled = true;
  postBtn.textContent = 'Posting...';
  
  try {
    const content = document.getElementById('postContent').value.trim();
    const imageFile = document.getElementById('imageUpload').files[0];
    
    // For now, we'll ignore the image since backend expects URL, not file
    if (imageFile) {
      alert('Image upload feature will be available soon! For now, please post text only.');
      postBtn.disabled = false;
      postBtn.textContent = originalText;
      return;
    }
    
    if (!content) {
      alert('Please write something to post!');
      postBtn.disabled = false;
      postBtn.textContent = originalText;
      return;
    }
    
    const result = await createPost(content, null);
    
    if (result.success) {
      // Reset form
      document.getElementById('postContent').value = '';
      hideImagePreview();
      updateCharacterCount();
      validateForm();
      
      // Show success feedback
      postBtn.textContent = '✓ Posted!';
      setTimeout(() => {
        postBtn.textContent = originalText;
      }, 2000);
      
      // Reload posts
      loadPosts();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error in submitPost:', error);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    postBtn.disabled = false;
    if (postBtn.textContent === 'Posting...') {
      postBtn.textContent = originalText;
    }
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
}

// Auto-refresh functionality
let refreshInterval;

function startAutoRefresh() {
  // Refresh posts every 30 seconds
  refreshInterval = setInterval(() => {
    if (!isLoading) {
      loadPosts();
    }
  }, 30000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Visibility change handler to pause refresh when tab is hidden
function handleVisibilityChange() {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  const token = checkAuth();
  if (!token) return;
  
  // Get DOM elements
  const postContent = document.getElementById('postContent');
  const imageUpload = document.getElementById('imageUpload');
  const removeImageBtn = document.getElementById('removeImage');
  const postForm = document.getElementById('postForm');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Character count tracking
  postContent.addEventListener('input', () => {
    updateCharacterCount();
    validateForm();
  });
  
  // Prevent form submission on Enter (allow Shift+Enter for new lines)
  postContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validateForm()) {
        submitPost();
      }
    }
  });
  
  // Image upload handling
  imageUpload.addEventListener('change', function() {
    showImagePreview(this.files[0]);
    validateForm();
  });
  
  // Remove image button
  removeImageBtn.addEventListener('click', () => {
    hideImagePreview();
    validateForm();
  });
  
  // Form submission
  postForm.addEventListener('submit', handleFormSubmit);
  
  // Logout functionality
  logoutBtn.addEventListener('click', handleLogout);
  
  // Visibility change handler
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Window beforeunload handler
  window.addEventListener('beforeunload', stopAutoRefresh);
  
  // Initial setup
  updateCharacterCount();
  validateForm();
  loadPosts();
  startAutoRefresh();
});

// Legacy function for backward compatibility
function showImagePreview(input) {
  if (input && input.files && input.files[0]) {
    showImagePreview(input.files[0]);
  }
}