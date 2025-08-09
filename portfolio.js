// Shared portfolio JavaScript for both main page and subpages

function loadProjects() {
  return fetch('portfolio-data.json')
    .then(response => response.json())
    .then(data => data.projects)
    .catch(error => {
      console.error('Error loading projects:', error);
      throw error;
    });
}

function renderGallery() {
  loadProjects()
    .then(projects => {
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = projects.map(item => `
        ${item.externalLink ? 
          `<a href="${item.externalLink}" rel="noopener noreferrer" class="art-item">` :
          `<a href="subpage.html?id=${item.id}" class="art-item">`
        }
          <img src="assets/images/${item.image}" alt="${item.alt}" onerror="this.src='./assets/images/default.gif'">
          <div class="description">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        </a>
      `).join("");
    })
    .catch(error => {
      document.getElementById("gallery").innerHTML = '<p>Error loading projects. Please try again later.</p>';
    });
}

function renderSubpage() {
  const urlParams = new URLSearchParams(window.location.search);
  const artId = urlParams.get('id');
  
  if (!artId) {
    document.getElementById('content').innerHTML = '<p>No project specified.</p>';
    return;
  }

  loadProjects()
    .then(projects => {
      const selectedArt = projects.find(item => item.id === parseInt(artId));
      const contentDiv = document.getElementById('content');
      
      if (selectedArt) {
        contentDiv.innerHTML = `
          <img src="assets/images/${selectedArt.image}" alt="${selectedArt.alt}" onerror="this.src='./assets/images/default.gif'">
          <h2>${selectedArt.title}</h2>
          <p>${selectedArt.description}</p>
        `;
      } else {
        contentDiv.innerHTML = `<p>Project not found.</p>`;
      }
    })
    .catch(error => {
      document.getElementById('content').innerHTML = '<p>Error loading project details. Please try again later.</p>';
    });
}

// Auto-detect which page we're on and run appropriate function
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery')) {
    renderGallery();
  } else if (document.getElementById('content')) {
    renderSubpage();
  }
});