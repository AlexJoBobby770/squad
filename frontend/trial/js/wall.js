async function loadPosts() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/posts", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const posts = await res.json();
  const postContainer = document.getElementById("posts");

  postContainer.innerHTML = posts.map(p => `
    <div class="post">
      <p>${p.content}</p>
      ${p.imageURL ? `<img src="${p.imageURL}" alt="Post Image">` : ""}
    </div>
  `).join("");
}

loadPosts();
