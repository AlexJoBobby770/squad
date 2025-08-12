// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return false;
  }
  return token;
}

// Load and display posts
async function loadPosts() {
  const token = checkAuth();
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/posts", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

    const posts = await res.json();
    const postContainer = document.getElementById("posts");

    if (posts.length === 0) {
      postContainer.innerHTML = '<p style="text-align:center; color:#666;">No posts yet. Be the first to share something!</p>';
      return;
    }

    postContainer.innerHTML = posts.map(post => `
      <div class="post">
        <h4>${post.author || 'Anonymous'}</h4>
        <p>${post.content}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post Image" style="max-width: 100%; margin-top: 10px; border-radius: 6px;">` : ""}
        <small style="color: #666;">${new Date(post.createdAt).toLocaleString()}</small>
      </div>
    `).join("");
  } catch (error) {
    console.error("Error loading posts:", error);
    document.getElementById("posts").innerHTML = '<p style="color:red;">Error loading posts. Please refresh.</p>';
  }
}

// Handle new post submission
document.addEventListener('DOMContentLoaded', function() {
  const token = checkAuth();
  if (!token) return;

  const postForm = document.getElementById("postForm");
  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const content = document.getElementById("postContent").value;
      const imageURL = document.getElementById("imageURL").value;
      
      if (!content.trim()) {
        alert("Please write something!");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/posts", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ content, imageURL })
        });

        const data = await res.json();
        
        if (res.ok) {
          document.getElementById("postContent").value = "";
          document.getElementById("imageURL").value = "";
          loadPosts(); // Refresh posts
        } else {
          alert(data.message || "Error creating post");
        }
      } catch (error) {
        alert("Network error. Please try again.");
      }
    });
  }

  // Load posts when page loads
  loadPosts();

  // Add logout button functionality (you can add this button to your HTML)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }
});