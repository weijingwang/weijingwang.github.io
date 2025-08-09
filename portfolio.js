// Shared portfolio JavaScript for both main page and subpages

function loadProjects() {
  return fetch('portfolio-data.json')
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      console.error('Error loading projects:', error);
      throw error;
    });
}

function formatDate(dateString, includeDay = false) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  if (includeDay) {
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  } else {
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
}

function parseMarkdown(text) {
  if (!text) return '';
  
  return text
    // Remove the main title (first # header) since we handle that separately
    .replace(/^# .*$/gm, '')
    // Headers (convert remaining headers down one level for better hierarchy)
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Line breaks and paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraph tags
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs and extra whitespace
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>(<h[3-4]>)/g, '$1')
    .replace(/(<\/h[3-4]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
}

// Load markdown file for a project
async function loadMarkdownContent(projectId) {
  try {
    const response = await fetch(`content/${projectId}.md`);
    if (!response.ok) {
      return null; // File doesn't exist, fallback to JSON content
    }
    return await response.text();
  } catch (error) {
    console.log(`No markdown file found for project ${projectId}, using JSON content`);
    return null;
  }
}

function renderGallery() {
  loadProjects()
    .then(data => {
      const projects = data.projects;
      const lastUpdated = data.lastUpdated;
      
      // Add last updated text
      const lastUpdatedDiv = document.getElementById("last-updated");
      if (lastUpdatedDiv) {
        lastUpdatedDiv.innerHTML = `Last updated ${formatDate(lastUpdated, true)}`;
      }
      
      // Sort projects by publishedDate in descending order (newest first)
      const sortedProjects = [...projects].sort((a, b) => {
        return parseInt(b.publishedDate) - parseInt(a.publishedDate);
      });
      
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = sortedProjects.map(item => `
        ${item.externalLink ? 
          `<a href="${item.externalLink}" rel="noopener noreferrer" class="art-item">` :
          `<a href="subpage.html?id=${item.id}" class="art-item">`
        }
          <img src="assets/images/${item.image}" alt="${item.alt}" onerror="this.src='./assets/images/default.gif'">
          <div class="description">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <p class="published-date">Published ${formatDate(item.publishedDate)}</p>
          </div>
        </a>
      `).join("");
    })
    .catch(error => {
      document.getElementById("gallery").innerHTML = '<p>Error loading projects. Please try again later.</p>';
    });
}

async function renderSubpage() {
  const urlParams = new URLSearchParams(window.location.search);
  const artId = urlParams.get('id');
  
  if (!artId) {
    document.getElementById('content').innerHTML = '<p>No project specified.</p>';
    return;
  }

  try {
    const data = await loadProjects();
    const projects = data.projects;
    const selectedArt = projects.find(item => item.id === parseInt(artId));
    const contentDiv = document.getElementById('content');
    
    if (!selectedArt) {
      contentDiv.innerHTML = `<p>Project not found.</p>`;
      return;
    }

    // Try to load markdown file first, fallback to JSON content
    const markdownContent = await loadMarkdownContent(artId);
    
    let parsedContent;
    let subtitle = '';
    
    if (markdownContent) {
      // Extract subtitle if it exists (first ## header)
      const subtitleMatch = markdownContent.match(/^## (.*)$/m);
      if (subtitleMatch) {
        subtitle = `<h3 class="subtitle">${subtitleMatch[1]}</h3>`;
      }
      parsedContent = parseMarkdown(markdownContent);
    } else if (selectedArt.detailedContent) {
      parsedContent = parseMarkdown(selectedArt.detailedContent);
    } else {
      parsedContent = `<p>${selectedArt.description}</p>`;
    }
    
    const lastUpdatedText = selectedArt.lastUpdated ? 
      ` • Last updated ${formatDate(selectedArt.lastUpdated, true)}` : '';
    
    contentDiv.innerHTML = `
      <h2>${selectedArt.title}</h2>
      <p class="published-date">Published ${formatDate(selectedArt.publishedDate, true)}${lastUpdatedText}</p>
      <div class="subpage-image-container">
        <img src="assets/images/${selectedArt.image}" alt="${selectedArt.alt}" onerror="this.src='./assets/images/default.gif'">
      </div>
      ${subtitle}
      <div class="markdown-content">
        ${parsedContent}
      </div>
    `;
  } catch (error) {
    document.getElementById('content').innerHTML = '<p>Error loading project details. Please try again later.</p>';
  }
}

// Auto-detect which page we're on and run appropriate function
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery')) {
    renderGallery();
  } else if (document.getElementById('content')) {
    renderSubpage();
  }
});