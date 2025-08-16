
document.addEventListener('DOMContentLoaded', function() {
 
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      
      try {
        const res = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (data.token) {
          localStorage.setItem("token", data.token);
          window.location.href = "wall.html";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        alert("Network error. Please try again.");
      }
    });
  }

  
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      
      try {
        const res = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        
        if (data.token) {
          localStorage.setItem("token", data.token);
          window.location.href = "wall.html";
        } else {
          alert(data.message || "Signup failed");
        }
      } catch (error) {
        alert("Network error. Please try again.");
      }
    });
  }
});