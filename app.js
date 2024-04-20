import { createClient } from '@supabase/supabase-js'

// инизиализация с supabase
const supabaseUrl = 'https://dmnnniaeguntkzmggnka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbm5uaWFlZ3VudGt6bWdnbmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MDI1NTMsImV4cCI6MjAyOTA3ODU1M30.JC2TfNfNKU-zNqDm-r1X71Ro-VIQRapHz-2mj_Paod4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
});

document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    await register(email, password);
});

document.getElementById('postForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const author = document.getElementById('author').value;
    await createPost(title, description, author);
});

async function login(email, password) {
    const { error, session } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('Error logging in:', error);
    else {
        console.log('Logged in:', session.user);
        sessionStorage.setItem('sb:token', session.access_token);
        fetchPosts();
    }
}

async function register(email, password) {
    const { error, user } = await supabase.auth.signUp({ email, password });
    if (error) console.error('Error registering:', error);
    else console.log('Registered and logged in:', user);
}

async function createPost(title, description, author) {
    const token = sessionStorage.getItem('sb:token');
    const { data, error } = await supabase
        .from('posts')
        .insert([{ title, description, author }]);
    if (error) console.error('Error adding post', error);
    else console.log('Post added!', data);
    fetchPosts();
}

async function fetchPosts() {
    const token = sessionStorage.getItem('sb:token');
    const { data, error } = await supabase
        .from('posts')
        .select('*');
    if (error) console.error('Error fetching posts', error);
    else displayPosts(data);
}

function displayPosts(posts) {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.description}</p>
            <small>Author: ${post.author}</small>
            <button onclick="deletePost(${post.id})">Delete</button>
            <button onclick="editPost(${post.id}, '${post.title.replace(/'/g, "\\'")}', '${post.description.replace(/'/g, "\\'")}', '${post.author.replace(/'/g, "\\'")}')">Edit</button>
        `;
        container.appendChild(postElement);
    });
}



supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
        console.log("User session active", session);
        sessionStorage.setItem('sb:token', session.access_token);
        fetchPosts();
    } else {
        console.log("No user logged in");
        document.getElementById('postsContainer').innerHTML = '<p>Please log in to view posts.</p>';
        sessionStorage.removeItem('sb:token');
    }
});

async function deletePost(id) {
    const token = sessionStorage.getItem('sb:token');
    const { data, error } = await supabase
        .from('posts')
        .delete()
        .match({ id });
    if (error) console.error('Error deleting post', error);
    else {
        console.log('Post deleted!', data);
        fetchPosts();
    }
}

function editPost(id, title, description, author) {
    document.getElementById('title').value = title;
    document.getElementById('description').value = description;
    document.getElementById('author').value = author;

    document.getElementById('postForm').onsubmit = async function (event) {
        event.preventDefault();
        await updatePost(id, document.getElementById('title').value, document.getElementById('description').value, document.getElementById('author').value);
        resetPostForm();
    };
}

async function updatePost(id, title, description, author) {
    const token = sessionStorage.getItem('sb:token');
    const { data, error } = await supabase
        .from('posts')
        .update({ title, description, author })
        .match({ id });
    if (error) console.error('Error updating post', error);
    else {
        console.log('Post updated!', data);
        fetchPosts();
    }
}

function resetPostForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postForm').onsubmit = async function (event) {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const author = document.getElementById('author').value;
        await createPost(title, description, author);
    };
    fetchPosts();
}