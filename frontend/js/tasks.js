
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return false;
  }
  return token;
}

async function loadTasks() {
  const token = checkAuth();
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/tasks", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

    const tasks = await res.json();
    const taskList = document.getElementById("taskList");

    if (tasks.length === 0) {
      taskList.innerHTML = '<li style="text-align:center; color:#666;">No tasks yet. Add your first task!</li>';
      return;
    }

    taskList.innerHTML = tasks.map(task => `
      <li>
        <div>
          <strong>${task.name}</strong>
          <br>
          <small style="color: #666;">Created: ${new Date(task.createdAt).toLocaleDateString()}</small>
          <br>
          <small style="color: ${task.completed ? 'green' : 'orange'};">
            Status: ${task.completed ? '✅ Completed' : '⏳ Pending'}
          </small>
        </div>
        <div>
          ${!task.completed ? 
            `<button onclick="completeTask('${task._id}')" style="background: green; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Complete</button>` : 
            `<span style="color: green;">✅</span>`
          }
          <button onclick="deleteTask('${task._id}')" style="background: red; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 5px;">Delete</button>
        </div>
      </li>
    `).join("");
  } catch (error) {
    console.error("Error loading tasks:", error);
    document.getElementById("taskList").innerHTML = '<li style="color:red;">Error loading tasks. Please refresh.</li>';
  }
}


async function completeTask(taskId) {
  const token = checkAuth();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ completed: true })
    });

    if (res.ok) {
      loadTasks(); 
    } else {
      alert("Error completing task");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
}


async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  
  const token = checkAuth();
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      loadTasks(); 
    } else {
      alert("Error deleting task");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
}


document.addEventListener('DOMContentLoaded', function() {
  const token = checkAuth();
  if (!token) return;

  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const taskName = document.getElementById("taskName").value;
      
      if (!taskName.trim()) {
        alert("Please enter a task name!");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/tasks", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ name: taskName })
        });

        const data = await res.json();
        
        if (res.ok) {
          document.getElementById("taskName").value = "";
          loadTasks(); 
        } else {
          alert(data.message || "Error creating task");
        }
      } catch (error) {
        alert("Network error. Please try again.");
      }
    });
  }

  loadTasks();
});