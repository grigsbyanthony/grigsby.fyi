// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const tagsContainer = document.getElementById('tags-container');
const postsContainer = document.getElementById('posts-container');
const pinnedPostsContainer = document.getElementById('pinned-posts-container');
const reposContainer = document.getElementById('repos-container');
const postsTab = document.getElementById('posts-tab');
const reposTab = document.getElementById('repos-tab');
const resourcesTab = document.getElementById('resources-tab');
const publicationsTab = document.getElementById('publications-tab');
const presentationsTab = document.getElementById('presentations-tab');
const postsContent = document.getElementById('posts-content');
const reposContent = document.getElementById('repos-content');
const resourcesContent = document.getElementById('resources-content');
const publicationsContent = document.getElementById('publications-content');
const presentationsContent = document.getElementById('presentations-content');
const presentationsContainer = document.getElementById('presentations-container');
const sortByDateButton = document.getElementById('sort-by-date');
const sortByTitleButton = document.getElementById('sort-by-title');
const currentYearElement = document.getElementById('current-year');

// Data structures
let posts = [];
let pinnedPosts = [];
let allTags = new Set();
let activeTags = new Set();
let reposLoaded = false;
let presentationsLoaded = false;
let currentSortMethod = 'date'; // Default sort method

// Initialize the blog
document.addEventListener('DOMContentLoaded', () => {
    initializeBlog();
    setupEventListeners();
    
    // Initialize resource filters if we're on the resources tab
    if (window.location.hash === '#resources') {
        switchTab('resources');
        setupResourceFilters();
    }
    
    // Initialize image gallery
    initializeImageGallery();
});

// Initialize the blog by loading posts
async function initializeBlog() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) throw new Error('No posts found.');
        
        const allPosts = await response.json();
        
        // Separate pinned and regular posts
        pinnedPosts = allPosts.filter(post => post.pinned === true);
        posts = allPosts.filter(post => !post.pinned);
        
        // Extract all tags
        allPosts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        // Render tags, pinned posts, and regular posts
        renderTagCloud();
        renderPinnedPosts();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = `
            <div class="post-card">
                <h3>Welcome to your new blog!</h3>
                <p>To get started, add your HTML posts to the "posts" directory and update the posts.json file.</p>
            </div>
        `;
        pinnedPostsContainer.innerHTML = '';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Tab switching functionality
    postsTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('posts');
    });
    
    reposTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('repos');
        if (!reposLoaded) {
            fetchGitHubRepos();
        }
    });
    
    resourcesTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('resources');
        setupResourceFilters();
    });
    
    publicationsTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('publications');
    });
    
    presentationsTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('presentations');
        loadPresentations();
    });
    
    // Sorting functionality
    sortByDateButton.addEventListener('click', () => {
        sortPosts('date');
        setActiveSortButton('date');
    });
    
    sortByTitleButton.addEventListener('click', () => {
        sortPosts('title');
        setActiveSortButton('title');
    });
}

// Perform search based on input
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        // If search is empty, show all posts
        renderPinnedPosts();
        renderPosts(posts);
        // Clear active tags
        activeTags.clear();
        renderTagCloud();
        return;
    }
    
    // Filter posts by tag
    const filteredPosts = posts.filter(post => {
        if (!post.tags || !Array.isArray(post.tags)) return false;
        return post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });
    
    const filteredPinnedPosts = pinnedPosts.filter(post => {
        if (!post.tags || !Array.isArray(post.tags)) return false;
        return post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });
    
    // Update active tags
    activeTags.clear();
    allTags.forEach(tag => {
        if (tag.toLowerCase().includes(searchTerm)) {
            activeTags.add(tag);
        }
    });
    
    // If no tags are selected, show all posts
    if (activeTags.size === 0) {
        renderPinnedPosts();
        renderPosts(posts);
    } else {
        // Filter regular posts by active tags
        const filteredPosts = posts.filter(post => {
            if (!post.tags || !Array.isArray(post.tags)) return false;
            return post.tags.some(tag => activeTags.has(tag));
        });
        
        // Filter pinned posts by active tags
        const filteredPinnedPosts = pinnedPosts.filter(post => {
            if (!post.tags || !Array.isArray(post.tags)) return false;
            return post.tags.some(tag => activeTags.has(tag));
        });
        
        renderPinnedPosts(filteredPinnedPosts);
        renderPosts(filteredPosts);
    }
    
    // Update tag cloud
    renderTagCloud();
}

// Render the tag cloud
function renderTagCloud() {
    tagsContainer.innerHTML = '';
    
    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();
    
    sortedTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        if (activeTags.has(tag)) {
            tagElement.classList.add('active');
        }
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => filterByTag(tag));
        tagsContainer.appendChild(tagElement);
    });
}

// Render pinned posts to the pinned posts container
function renderPinnedPosts(postsToRender = pinnedPosts) {
    pinnedPostsContainer.innerHTML = '';
    
    // Hide the pinned posts section if there are no pinned posts to display
    const pinnedPostsSection = document.querySelector('.pinned-posts');
    
    if (!postsToRender || postsToRender.length === 0) {
        pinnedPostsSection.style.display = 'none';
        return;
    }
    
    // Show the section if we have pinned posts
    pinnedPostsSection.style.display = 'block';
    
    postsToRender.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'pinned-post-card';
        
        const postDate = new Date(post.date);
        const formattedDate = postDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let tagsHtml = '';
        if (post.tags && Array.isArray(post.tags)) {
            tagsHtml = post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join(' ');
        }
        
        // Default image if none is provided
        const imageUrl = post.image || 'images/default-post.jpg';
        
        postCard.innerHTML = `
            <div class="pinned-post-content">
                <div class="pin-icon">
                    <img src="assets/images/map-pin-solid.svg" alt="Pinned" />
                </div>
                <h3><a href="${post.url}">${post.title}</a></h3>
                <div class="post-meta">
                    <span class="post-date">${formattedDate}</span>
                    <div class="post-tags">${tagsHtml}</div>
                </div>
                <p class="post-excerpt">${post.excerpt}</p>
                
            </div>
            <div class="pinned-post-image">
                <img src="${imageUrl}" alt="${post.title}">
            </div>
        `;
        
        pinnedPostsContainer.appendChild(postCard);
    });
}

// Switch between tabs (Posts, Repos, Resources, Publications, and Presentations)
function switchTab(tabName) {
    // Remove active class from all tabs and content
    postsTab.parentElement.classList.remove('active');
    reposTab.parentElement.classList.remove('active');
    resourcesTab.parentElement.classList.remove('active');
    publicationsTab.parentElement.classList.remove('active');
    presentationsTab.parentElement.classList.remove('active');
    
    postsContent.classList.remove('active');
    reposContent.classList.remove('active');
    resourcesContent.classList.remove('active');
    publicationsContent.classList.remove('active');
    presentationsContent.classList.remove('active');
    
    // Add active class to selected tab and content
    if (tabName === 'posts') {
        postsTab.parentElement.classList.add('active');
        postsContent.classList.add('active');
    } else if (tabName === 'repos') {
        reposTab.parentElement.classList.add('active');
        reposContent.classList.add('active');
    } else if (tabName === 'resources') {
        resourcesTab.parentElement.classList.add('active');
        resourcesContent.classList.add('active');
    } else if (tabName === 'publications') {
        publicationsTab.parentElement.classList.add('active');
        publicationsContent.classList.add('active');
    } else if (tabName === 'presentations') {
        presentationsTab.parentElement.classList.add('active');
        presentationsContent.classList.add('active');
    }
}

// Fetch GitHub repositories
async function fetchGitHubRepos() {
    try {
        reposContainer.innerHTML = '<p class="loading-repos">Loading repositories...</p>';
        
        // Replace 'yourusername' with your actual GitHub username
        const response = await fetch('https://api.github.com/users/grigsbyanthony/repos?sort=updated&direction=desc');
        
        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }
        
        const repos = await response.json();
        renderRepos(repos);
        reposLoaded = true;
    } catch (error) {
        reposContainer.innerHTML = `<p class="error">Error loading repositories: ${error.message}</p>`;
    }
}

// Render GitHub repositories
function renderRepos(repos) {
    reposContainer.innerHTML = '';
    
    if (!repos || repos.length === 0) {
        reposContainer.innerHTML = '<p class="no-repos">No repositories found.</p>';
        return;
    }
    
    // Sort repos by stars (most stars first)
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    
    // Limit to top 12 repositories for better display
    const displayRepos = repos.slice(0, 12);
    
    displayRepos.forEach(repo => {
        const repoCard = document.createElement('div');
        repoCard.className = 'repo-card';
        
        // Format the date
        const updatedDate = new Date(repo.updated_at);
        const formattedDate = updatedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create language badge if language exists
        let languageBadge = '';
        if (repo.language) {
            languageBadge = `<span class="repo-language">${repo.language}</span>`;
        }
        
        // Truncate description if too long
        const description = repo.description || 'No description available.';
        const truncatedDescription = description.length > 120 ? 
            description.substring(0, 120) + '...' : description;
        
        repoCard.innerHTML = `
            <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
            <div class="repo-meta">
                <span class="repo-date">Updated on ${formattedDate}</span>
                ${languageBadge}
            </div>
            <p class="repo-description">${truncatedDescription}</p>
            <div class="repo-stats">
                <span class="repo-stat"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                <span class="repo-stat"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
            </div>
            <a href="${repo.html_url}" class="view-repo" target="_blank">View on GitHub</a>
        `;
        
        reposContainer.appendChild(repoCard);
    });
}

// Sort posts by the specified method
function sortPosts(method) {
    currentSortMethod = method;
    
    // Get the current posts being displayed (could be filtered by search)
    const currentPosts = [...postsContainer.querySelectorAll('.post-card')].map(card => {
        const titleElement = card.querySelector('h3 a');
        const dateElement = card.querySelector('.post-date');
        
        return {
            element: card,
            title: titleElement ? titleElement.textContent : '',
            date: dateElement ? new Date(dateElement.textContent) : new Date(0)
        };
    });
    
    // Sort the posts based on the selected method
    if (method === 'date') {
        // Sort by date (newest first)
        currentPosts.sort((a, b) => b.date - a.date);
    } else if (method === 'title') {
        // Sort by title (alphabetically)
        currentPosts.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Re-append the posts in the sorted order
    currentPosts.forEach(post => {
        postsContainer.appendChild(post.element);
    });
}

// Set the active sort button
function setActiveSortButton(method) {
    sortByDateButton.classList.toggle('active', method === 'date');
    sortByTitleButton.classList.toggle('active', method === 'title');
}

// Render posts
function renderPosts(postsToRender) {
    postsContainer.innerHTML = '';
    
    if (!postsToRender || postsToRender.length === 0) {
        postsContainer.innerHTML = '<p class="no-posts">No posts found.</p>';
        return;
    }
    
    // Sort posts before rendering based on current sort method
    if (currentSortMethod === 'date') {
        postsToRender.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentSortMethod === 'title') {
        postsToRender.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    postsToRender.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        
        const postDate = new Date(post.date);
        const formattedDate = postDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let tagsHtml = '';
        if (post.tags && Array.isArray(post.tags)) {
            tagsHtml = post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join(' ');
        }
        
        // Default image if none is provided
        const imageUrl = post.image || 'images/default-post.jpg';
        
        postCard.innerHTML = `
            <div class="post-content">
                <h3><a href="${post.url}">${post.title}</a></h3>
                <div class="post-meta">
                    <span class="post-date">${formattedDate}</span>
                    <div class="post-tags">${tagsHtml}</div>
                </div>
                <p class="post-excerpt">${post.excerpt}</p>
                
            </div>
            <div class="post-image">
                <img src="${imageUrl}" alt="${post.title}">
            </div>
        `;
        
        postsContainer.appendChild(postCard);
    });
}

// Filter posts by tag
function filterByTag(tag) {
    // Toggle the active state of the clicked tag
    if (activeTags.has(tag)) {
        activeTags.delete(tag);
    } else {
        activeTags.add(tag);
    }
    
    // If no tags are active, show all posts
    if (activeTags.size === 0) {
        renderPinnedPosts();
        renderPosts(posts);
    } else {
        // Filter posts by active tags
        const filteredPosts = posts.filter(post => {
            if (!post.tags || !Array.isArray(post.tags)) return false;
            return post.tags.some(tag => activeTags.has(tag));
        });
        
        const filteredPinnedPosts = pinnedPosts.filter(post => {
            if (!post.tags || !Array.isArray(post.tags)) return false;
            return post.tags.some(tag => activeTags.has(tag));
        });
        
        renderPinnedPosts(filteredPinnedPosts);
        renderPosts(filteredPosts);
    }
    
    // Update the tag cloud to reflect active tags
    renderTagCloud();
    
    // Clear the search input
    searchInput.value = '';
}

// Load presentations from JSON file
async function loadPresentations() {
    // Mark as loaded to prevent future loading attempts
    presentationsLoaded = true;
    
    // Static presentations are now directly in the HTML
    // No need to fetch or render dynamically
    console.log('Using static presentations from HTML');
    return;
    
    /* Original dynamic loading code commented out
    try {
        presentationsContainer.innerHTML = '<p class="loading-presentations">Loading presentations...</p>';
        
        const response = await fetch('assets/presentations/presentations.json');
        if (!response.ok) throw new Error('No presentations found.');
        
        const presentations = await response.json();
        renderPresentations(presentations);
        presentationsLoaded = true;
    } catch (error) {
        console.error('Error loading presentations:', error);
        presentationsContainer.innerHTML = `<p class="error">Error loading presentations: ${error.message}</p>`;
    }
    */
}

// Image Gallery Functions
function initializeImageGallery() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    if (galleryImages.length === 0) return;
    
    let currentIndex = 0;
    const totalImages = galleryImages.length;
    
    // Set initial active image
    galleryImages[currentIndex].classList.add('active');
    
    // Function to transition to the next image
    function nextImage() {
        // Add 'previous' class to the current active image
        galleryImages[currentIndex].classList.add('previous');
        galleryImages[currentIndex].classList.remove('active');
        
        // Calculate next index
        currentIndex = (currentIndex + 1) % totalImages;
        
        // Add 'active' class to the next image
        galleryImages[currentIndex].classList.add('active');
        
        // Remove 'previous' class from all other images after transition
        setTimeout(() => {
            galleryImages.forEach((img, idx) => {
                if (idx !== currentIndex) {
                    img.classList.remove('previous');
                }
            });
        }, 800); // Match this to the CSS transition duration
    }
    
    // Set interval for automatic transitions
    setInterval(nextImage, 5000); // Change image every 5 seconds
}

// Render presentations
function renderPresentations(presentations) {
    presentationsContainer.innerHTML = '';
    
    if (!presentations || presentations.length === 0) {
        presentationsContainer.innerHTML = '<p class="no-presentations">No presentations available yet. Check back soon!</p>';
        return;
    }
    
    // Sort presentations by date (newest first)
    presentations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    presentations.forEach(presentation => {
        const presentationCard = document.createElement('div');
        presentationCard.className = 'presentation-card';
        
        const presentationDate = new Date(presentation.date);
        const formattedDate = presentationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        presentationCard.innerHTML = `
            <h3>${presentation.title}</h3>
            <div class="presentation-meta">
                <span class="presentation-venue">${presentation.venue}</span>
                <span class="presentation-date">${formattedDate}</span>
            </div>
            <p class="presentation-description">${presentation.description}</p>
            <a href="assets/presentations/${presentation.file}" class="download-button" download>
                <i class="fas fa-download"></i> Download Presentation
            </a>
        `;
        
        presentationsContainer.appendChild(presentationCard);
    });
}

// Resource filtering functionality
function setupResourceFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const books = document.querySelectorAll('.book');
    
    // Set up click event for each filter button
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the filter value
            const filterValue = button.getAttribute('data-filter');
            
            // Show/hide books based on filter
            books.forEach(book => {
                if (filterValue === 'all') {
                    book.style.display = 'block';
                } else {
                    if (book.getAttribute('data-category') === filterValue) {
                        book.style.display = 'block';
                    } else {
                        book.style.display = 'none';
                    }
                }
            });
        });
    });
}

// Set the current year in the footer
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}
