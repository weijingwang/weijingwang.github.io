// Portfolio JavaScript with automatic markdown loading

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

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, content: content };
  }
  
  const [, yamlContent, markdownContent] = match;
  const metadata = {};
  
  // Simple YAML parser for basic key-value pairs
  yamlContent.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      metadata[key] = value;
    }
  });
  
  return { metadata, content: markdownContent };
}

// Get list of markdown files
async function getMarkdownFiles() {
  // Since we can't list directory contents directly in the browser,
  // we'll try to load a manifest file or use a known list
  try {
    const response = await fetch('content/manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      return manifest.files || [];
    }
  } catch (error) {
    // Fallback: try common filenames
    console.log('No manifest found, using fallback file list');
  }
  
  // Fallback list - you can expand this or create a manifest.json file
  const commonFiles = [
    'resume.md',
    'pyweek34.md',
    'pyweek35.md',
    'ECE120A.md',
    'ECE153A.md',
    'pyweek36.md',
    'theremin.md',
    'ring_resonator.md',
    'pyweek38.md',
    'ECE241_intrapredict.md',
    'capstone_fall.md',
    'capstone_demo2.md'
  ];
  
  // Test which files exist
  const existingFiles = [];
  for (const file of commonFiles) {
    try {
      const response = await fetch(`content/${file}`, { method: 'HEAD' });
      if (response.ok) {
        existingFiles.push(file);
      }
    } catch (error) {
      // File doesn't exist, skip it
    }
  }
  
  return existingFiles;
}

// Load all projects from markdown files
async function loadProjects() {
  const files = await getMarkdownFiles();
  const projects = [];
  let lastUpdated = '';
  
  for (const filename of files) {
    try {
      const response = await fetch(`content/${filename}`);
      if (!response.ok) continue;
      
      const content = await response.text();
      const { metadata, content: markdownContent } = parseFrontmatter(content);
      
      // Skip files without required metadata
      if (!metadata.title || !metadata.publishedDate) {
        continue;
      }
      
      // Use filename (without .md) as ID
      const id = filename.replace('.md', '');
      
      const project = {
        id: id,
        title: metadata.title,
        description: metadata.description || '',
        image: metadata.image || 'default.gif',
        alt: metadata.alt || metadata.title,
        publishedDate: metadata.publishedDate,
        lastUpdated: metadata.lastUpdated,
        externalLink: metadata.externalLink,
        content: markdownContent,
        hidden: metadata.hidden === 'true' || metadata.hidden === true
      };
      
      // Skip hidden projects
      if (!project.hidden) {
        projects.push(project);
      }
      
      // Track latest update
      const projectDate = project.lastUpdated || project.publishedDate;
      if (projectDate > lastUpdated) {
        lastUpdated = projectDate;
      }
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
    }
  }
  
  return { projects, lastUpdated };
}

// Gallery page
function renderGallery() {
  loadProjects()
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
    .catch(error => {
      console.error('Error loading projects:', error);
      document.getElementById("gallery").innerHTML = 
        '<p class="loading">Error loading projects. Please try again later.</p>';
    });
}

// Subpage
async function renderSubpage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  const contentDiv = document.getElementById('content');
  
  if (!projectId) {
    contentDiv.innerHTML = '<p>No project specified.</p>';
    return;
  }

  try {
    const response = await fetch(`content/${projectId}.md`);
    if (!response.ok) {
      contentDiv.innerHTML = '<p>Project not found.</p>';
      return;
    }
    
    const content = await response.text();
    const { metadata, content: markdownContent } = parseFrontmatter(content);
    
    // Use metadata or fallback values
    const title = metadata.title || 'Untitled Project';
    const publishDate = metadata.publishedDate ? formatDate(metadata.publishedDate, true) : '';
    const updateDate = metadata.lastUpdated ? 
      ` • Updated ${formatDate(metadata.lastUpdated, true)}` : '';
    
    // Handle special case for resume (no image) or YouTube video
    let imageSection = '';
    if (projectId !== 'resume') {
      if (metadata.youtube) {
        // YouTube video embed
        const youtubeId = metadata.youtube.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || metadata.youtube;
        imageSection = `
          <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                    frameborder="0" allowfullscreen 
                    title="${title} - YouTube Video"></iframe>
          </div>
        `;
      } else {
        // Regular image
        imageSection = `
          <div class="image-container">
            <img src="assets/images/${metadata.image || 'default.gif'}" alt="${metadata.alt || title}" 
                 onerror="this.src='./assets/images/default.gif'">
          </div>
        `;
      }
    }
    
    // Render content
    contentDiv.innerHTML = `
      <h2>${title}</h2>
      ${publishDate ? `<div class="date">Published ${publishDate}${updateDate}</div>` : ''}
      ${imageSection}
      <div class="text-content">
        ${parseMarkdown(markdownContent)}
      </div>
    `;
  } catch (error) {
    console.error('Error loading project:', error);
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