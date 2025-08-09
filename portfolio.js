// Simple portfolio JavaScript

// Utilities
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateString, includeDay = false) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  const monthName = monthNames[parseInt(month) - 1];
  return includeDay ? 
    `${monthName} ${parseInt(day)}, ${year}` : 
    `${monthName} ${year}`;
}

function parseMarkdown(text) {
  if (!text) return '';
  
  // Handle images and YouTube videos FIRST (before links)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\s*\{([^}]+)\})?/g, (match, alt, src, caption) => {
    // Check if it's a YouTube link
    const youtubeMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    
    if (youtubeMatch) {
      const id = youtubeMatch[1];
      const isPlaylist = src.includes('playlist');
      const embedSrc = isPlaylist 
        ? `https://www.youtube.com/embed/videoseries?list=${id}`
        : `https://www.youtube.com/embed/${id}`;
      
      const iframe = `<div class="video-container"><iframe src="${embedSrc}" frameborder="0" allowfullscreen></iframe></div>`;
      
      return caption ? `<figure>${iframe}<figcaption>${caption}</figcaption></figure>` : iframe;
    }
    
    // Regular image
    const img = `<img src="${src}" alt="${alt}">`;
    return caption ? `<figure>${img}<figcaption>${caption}</figcaption></figure>` : img;
  });
  
  // Then handle other formatting
  text = text
    .replace(/^# .*$/gm, '') // Remove main title
    .replace(/^## (.*$)/gm, '<h3>$1</h3>') // Headers
    .replace(/^### (.*$)/gm, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>') // Code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>') // Links
    .replace(/^- (.+)$/gm, '<li>$1</li>'); // Lists
  
  // Wrap consecutive list items in <ul>
  text = text.replace(/(<li>.*?<\/li>\s*)+/gs, match => `<ul>${match}</ul>`);
  
  // Convert paragraphs
  return text
    .split('\n\n')
    .map(block => block.trim())
    .filter(block => block)
    .map(block => {
      // Don't wrap headers, lists, figures, or videos in paragraphs
      if (block.match(/^<(h\d|ul|figure|div class="video)/)) return block;
      return `<p>${block}</p>`;
    })
    .join('\n');
}

// Data loading
async function loadData() {
  const response = await fetch('portfolio-data.json');
  return response.json();
}

async function loadMarkdown(projectId) {
  try {
    const response = await fetch(`content/${projectId}.md`);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

// Gallery page
function renderGallery() {
  loadData()
    .then(data => {
      // Update last updated
      const lastUpdatedEl = document.getElementById("last-updated");
      if (lastUpdatedEl && data.lastUpdated) {
        lastUpdatedEl.textContent = `Last updated ${formatDate(data.lastUpdated, true)}`;
        lastUpdatedEl.className = 'date';
      }
      
      // Sort projects by date (newest first)
      const projects = [...data.projects].sort((a, b) => 
        parseInt(b.publishedDate) - parseInt(a.publishedDate)
      );
      
      // Render gallery
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = projects.map(project => {
        const href = project.externalLink || `subpage.html?id=${project.id}`;
        const target = project.externalLink ? 'target="_blank" rel="noopener noreferrer"' : '';
        
        return `
          <a href="${href}" ${target} class="art-item">
            <img src="assets/images/${project.image}" alt="${project.alt}" 
                 onerror="this.src='./assets/images/default.gif'">
            <div class="description">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <div class="date">Published ${formatDate(project.publishedDate)}</div>
            </div>
          </a>
        `;
      }).join('');
    })
    .catch(() => {
      document.getElementById("gallery").innerHTML = 
        '<p class="loading">Error loading projects. Please try again later.</p>';
    });
}

// Subpage
async function renderSubpage() {
  const params = new URLSearchParams(window.location.search);
  const artId = params.get('id');
  const contentDiv = document.getElementById('content');
  
  if (!artId) {
    contentDiv.innerHTML = '<p>No project specified.</p>';
    return;
  }

  // Handle special resume page
  if (artId === 'resume') {
    try {
      const markdown = await loadMarkdown('resume');
      if (markdown) {
        // Extract title from first # header or use default
        const titleMatch = markdown.match(/^# (.*)$/m);
        const title = titleMatch ? titleMatch[1] : 'Resume';
        
        contentDiv.innerHTML = `
          <h2>${title}</h2>
          <div class="text-content">
            ${parseMarkdown(markdown)}
          </div>
        `;
      } else {
        contentDiv.innerHTML = '<p>Resume file not found. Please add content/resume.md</p>';
      }
    } catch (error) {
      contentDiv.innerHTML = '<p>Error loading resume.</p>';
    }
    return;
  }

  // Regular project handling
  try {
    const data = await loadData();
    const project = data.projects.find(p => p.id === parseInt(artId));
    
    if (!project) {
      contentDiv.innerHTML = '<p>Project not found.</p>';
      return;
    }

    // Get content
    const markdown = await loadMarkdown(artId);
    let content;
    
    if (markdown) {
      content = parseMarkdown(markdown);
    } else if (project.detailedContent) {
      content = parseMarkdown(project.detailedContent);
    } else {
      content = `<p>${project.description}</p>`;
    }
    
    // Build date string
    const publishDate = formatDate(project.publishedDate, true);
    const updateDate = project.lastUpdated ? 
      ` • Updated ${formatDate(project.lastUpdated, true)}` : '';
    
    // Render content
    contentDiv.innerHTML = `
      <h2>${project.title}</h2>
      <div class="date">Published ${publishDate}${updateDate}</div>
      <div class="image-container">
        <img src="assets/images/${project.image}" alt="${project.alt}" 
             onerror="this.src='./assets/images/default.gif'">
      </div>
      <div class="text-content">
        ${content}
      </div>
    `;
  } catch (error) {
    contentDiv.innerHTML = '<p class="loading">Error loading project. Please try again later.</p>';
  }
}

// Auto-run based on page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery')) {
    renderGallery();
  } else if (document.getElementById('content')) {
    renderSubpage();
  }
});