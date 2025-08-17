
const API_BASE = 'http://localhost:5000/api';
const MAX_CONTENT_LENGTH = 500;

let isLoading = false;

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

function showImagePreview(file) {
  const preview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImage');
  
  if (file) {
   
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      document.getElementById('imageUpload').value = '';
      return;
    }
 
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

function updateCharacterCount() {
  const content = document.getElementById('postContent').value;
  const charCount = document.getElementById('charCount');
  const length = content.length;
  
  charCount.textContent = `${length}/${MAX_CONTENT_LENGTH}`;
  
  charCount.className = 'character-count';
  if (length > MAX_CONTENT_LENGTH * 0.9) {
    charCount.className += ' danger';
  } else if (length > MAX_CONTENT_LENGTH * 0.75) {
    charCount.className += ' warning';
  }
}

function validateForm() {
  const content = document.getElementById('postContent').value.trim();
  const imageFile = document.getElementById('imageUpload').files[0];
  const postBtn = document.getElementById('postBtn');
  
  const isValid = content || imageFile;
  const isContentValid = content.length <= MAX_CONTENT_LENGTH;
  
  postBtn.disabled = !isValid || !isContentValid;
  
  return isValid && isContentValid;
}


async function createPost(formData) {
  try {
    const response = await apiRequest(`${API_BASE}/posts`, {
      method: 'POST',
      body: formData
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
    
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);
    
    const result = await createPost(formData);
    
    if (result.success) {
      
      document.getElementById('postContent').value = '';
      hideImagePreview();
      updateCharacterCount();
      validateForm();
      
      postBtn.textContent = '✓ Posted!';
      setTimeout(() => {
        postBtn.textContent = originalText;
      }, 2000);
      
      
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


let refreshInterval;

function startAutoRefresh() {
  
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


function handleVisibilityChange() {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
}


document.addEventListener('DOMContentLoaded', function() {
  const token = checkAuth();
  if (!token) return;
  
  const postContent = document.getElementById('postContent');
  const imageUpload = document.getElementById('imageUpload');
  const removeImageBtn = document.getElementById('removeImage');
  const postForm = document.getElementById('postForm');
  const logoutBtn = document.getElementById('logoutBtn');
  
  postContent.addEventListener('input', () => {
    updateCharacterCount();
    validateForm();
  });
 
  postContent.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validateForm()) {
        submitPost();
      }
    }
  });
  
  imageUpload.addEventListener('change', function() {
    showImagePreview(this.files[0]);
    validateForm();
  });
  

  removeImageBtn.addEventListener('click', () => {
    hideImagePreview();
    validateForm();
  });
  

  postForm.addEventListener('submit', handleFormSubmit);
  
 
  logoutBtn.addEventListener('click', handleLogout);
  
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  

  window.addEventListener('beforeunload', stopAutoRefresh);

  updateCharacterCount();
  validateForm();
  loadPosts();
  startAutoRefresh();
});


function showImagePreview(input) {
  if (input && input.files && input.files[0]) {
    showImagePreview(input.files[0]);
  }
}