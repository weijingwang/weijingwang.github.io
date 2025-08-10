const fs = require('fs').promises;
const path = require('path');

// Utilities (copied from your portfolio.js)
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

// Load all projects from markdown files
async function loadProjects() {
  const contentDir = path.join(__dirname, 'src', 'content');
  const files = await fs.readdir(contentDir);
  const markdownFiles = files.filter(f => f.endsWith('.md'));
  
  const projects = [];
  const hiddenProjects = [];
  let lastUpdated = '';
  
  for (const filename of markdownFiles) {
    try {
      const content = await fs.readFile(path.join(contentDir, filename), 'utf8');
      const { metadata, content: markdownContent } = parseFrontmatter(content);
      
      // Use filename (without .md) as ID
      const id = filename.replace('.md', '');
      
      const project = {
        id: id,
        title: metadata.title || 'Untitled',
        description: metadata.description || '',
        image: metadata.image || 'default.gif',
        alt: metadata.alt || metadata.title || 'Untitled',
        publishedDate: metadata.publishedDate,
        lastUpdated: metadata.lastUpdated,
        externalLink: metadata.externalLink,
        content: markdownContent,
        metadata: metadata,
        hidden: metadata.hidden === 'true' || metadata.hidden === true
      };
      
      console.log(`Processing ${filename}: hidden=${project.hidden}, title=${project.title}`);
      
      // Separate hidden projects (like resume) from gallery projects
      if (project.hidden) {
        hiddenProjects.push(project);
      } else {
        // Only require publishedDate for gallery projects
        if (metadata.publishedDate) {
          projects.push(project);
        } else {
          console.log(`Skipping ${filename} - no publishedDate and not hidden`);
        }
      }
      
      // Track latest update (include hidden projects in date calculation)
      const projectDate = project.lastUpdated || project.publishedDate;
      if (projectDate && projectDate > lastUpdated) {
        lastUpdated = projectDate;
      }
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
    }
  }
  
  return { projects, hiddenProjects, lastUpdated };
}

// Generate static index.html
async function generateIndex(projects, lastUpdated) {
  const template = await fs.readFile(path.join(__dirname, 'src', 'index.html'), 'utf8');
  
  // Sort projects by date (newest first)
  const sortedProjects = [...projects].sort((a, b) => 
    parseInt(b.publishedDate) - parseInt(a.publishedDate)
  );
  
  // Generate gallery HTML
  const galleryHTML = sortedProjects.map(project => {
    const href = project.externalLink || `${project.id}.html`;
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
  
  // Generate last updated text
  const lastUpdatedHTML = lastUpdated ? 
    `<p id="last-updated" class="date">Last updated ${formatDate(lastUpdated, true)}</p>` : 
    '<p id="last-updated"></p>';
  
  // Update the resume link to point to static HTML
  let staticHTML = template
    .replace('href="subpage.html?id=resume"', 'href="resume.html"')
    .replace('<div class="gallery" id="gallery"></div>', `<div class="gallery" id="gallery">${galleryHTML}</div>`)
    .replace('<p id="last-updated"></p>', lastUpdatedHTML)
    .replace('<script src="portfolio.js"></script>', ''); // Remove the dynamic script
  
  await fs.writeFile(path.join(__dirname, 'index.html'), staticHTML);
  console.log('Generated index.html in root');
}

// Generate static subpage HTML files
async function generateSubpages(projects, hiddenProjects) {
  try {
    console.log(`generateSubpages called with ${projects.length} projects and ${hiddenProjects ? hiddenProjects.length : 'undefined'} hidden projects`);
    
    // Combine both gallery projects and hidden projects for page generation
    const allProjects = [...projects, ...(hiddenProjects || [])];
    
    console.log(`Generating pages for ${allProjects.length} total projects (${projects.length} gallery + ${hiddenProjects ? hiddenProjects.length : 0} hidden)`);
    if (hiddenProjects && hiddenProjects.length > 0) {
      console.log('Hidden projects:', hiddenProjects.map(p => p.id));
    }
    
    for (const project of allProjects) {
      try {
        const title = project.title || 'Untitled Project';
        const publishDate = project.publishedDate ? formatDate(project.publishedDate, true) : '';
        const updateDate = project.lastUpdated ? 
          ` • Updated ${formatDate(project.lastUpdated, true)}` : '';
        
        // Handle special case for resume (no image) or YouTube video
        let imageSection = '';
        if (project.id !== 'resume') {
          if (project.metadata.youtube) {
            // YouTube video embed
            const youtubeId = project.metadata.youtube.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || project.metadata.youtube;
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
                <img src="assets/images/${project.image}" alt="${project.alt}" 
                     onerror="this.src='./assets/images/default.gif'">
              </div>
            `;
          }
        }
        
        // Generate the full HTML page
        const pageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Weijing website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <a href="index.html"><h1>Weijing website</h1></a>
  </header>

  <div class="content" id="content">
    <h2>${title}</h2>
    ${publishDate ? `<div class="date">Published ${publishDate}${updateDate}</div>` : ''}
    ${imageSection}
    <div class="text-content">
      ${parseMarkdown(project.content)}
    </div>
  </div>

  <div style="text-align: center;">
    <a href="index.html" class="back-btn">← Back to Projects</a>
  </div>
</body>
</html>`;
        
        await fs.writeFile(path.join(__dirname, `${project.id}.html`), pageHTML);
        console.log(`Generated ${project.id}.html in root`);
      } catch (error) {
        console.error(`Error generating page for ${project.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in generateSubpages:', error);
    throw error;
  }
}

// Copy static assets
async function copyAssets() {
  // Copy CSS
  await fs.copyFile(path.join(__dirname, 'src', 'styles.css'), path.join(__dirname, 'styles.css'));
  console.log('Copied styles.css to root');
  
  // Copy assets directory
  await fs.cp(path.join(__dirname, 'src', 'assets'), path.join(__dirname, 'assets'), { recursive: true });
  console.log('Copied assets directory to root');
}

// Clean root directory (remove generated files)
async function cleanRoot() {
  const filesToClean = [
    'index.html',
    'styles.css',
    'assets'
  ];
  
  // Also clean any generated HTML files (project pages)
  const files = await fs.readdir(__dirname);
  const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html');
  filesToClean.push(...htmlFiles);
  
  for (const file of filesToClean) {
    try {
      const filePath = path.join(__dirname, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.rm(filePath, { force: true });
      }
      console.log(`Cleaned ${file}`);
    } catch (error) {
      // File doesn't exist, ignore
    }
  }
}

// Main build function
async function build() {
  try {
    console.log('Building static site to root...');
    
    // Clean previous build
    await cleanRoot();
    
    // Load projects
    const { projects, hiddenProjects, lastUpdated } = await loadProjects();
    console.log(`Loaded ${projects.length} gallery projects and ${hiddenProjects.length} hidden projects`);
    
    // Generate pages in root
    await generateIndex(projects, lastUpdated);
    console.log('About to generate subpages...');
    await generateSubpages(projects, hiddenProjects);
    await copyAssets();
    
    console.log('✅ Static site built successfully in root directory!');
    console.log('You can now deploy the root directory to GitHub Pages');
    console.log('Source files are in ./src/');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
if (require.main === module) {
  build().catch(console.error);
}

module.exports = { build };