 const form = document.getElementById('chatForm');
    const input = document.getElementById('messageInput');
    const messagesDiv = document.getElementById('messages');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = input.value.trim();
        if (message) {
            addMessage("You", message);
            input.value = '';
        }
    });

    function addMessage(sender, text) {
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `<strong>${sender}:</strong> ${text}`;
        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // auto scroll
    }