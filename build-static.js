const fs = require('fs').promises;
const path = require('path');

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

function parseMarkdown(text, projectId) {
  if (!text) return '';
  
  // Handle images and YouTube videos FIRST - with proper path resolution
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)(?:\s*\{([^}]+)\})?/g, (match, alt, src, caption) => {
    // Check if it's a YouTube link
    const youtubeMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|playlist\?list=)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    
    if (youtubeMatch) {
      const id = youtubeMatch[1];
      const isPlaylist = src.includes('playlist');
      const embedSrc = isPlaylist 
        ? `https://www.youtube.com/embed/videoseries?list=${id}`
        : `https://www.youtube.com/embed/${id}`;
      
      const iframe = `<div class="video-container">
        <iframe src="${embedSrc}" 
                frameborder="0" 
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
        </iframe>
      </div>`;
      
      return caption ? `<figure>${iframe}<figcaption>${caption}</figcaption></figure>` : iframe;
    }
    
    // Handle image paths
    let imagePath = src;
    if (src.startsWith('./')) {
      // Relative to project folder
      imagePath = `assets/projects/${projectId}/${src.substring(2)}`;
    } else if (src.startsWith('../global-assets/')) {
      // Global asset
      imagePath = `assets/global/${src.substring(17)}`;
    } else if (!src.startsWith('http')) {
      // Assume it's a project-local image
      imagePath = `assets/projects/${projectId}/${src}`;
    }
    
    const img = `<img src="${imagePath}" alt="${alt}" loading="lazy">`;
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

// Load all projects from new folder structure
async function loadProjects() {
  const contentDir = path.join(__dirname, 'src', 'content');
  
  try {
    const items = await fs.readdir(contentDir);
    const projectDirs = [];
    
    // Filter for directories and markdown files
    for (const item of items) {
      const itemPath = path.join(contentDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Check if directory has index.md
        try {
          await fs.access(path.join(itemPath, 'index.md'));
          projectDirs.push(item);
        } catch {
          // No index.md, skip this directory
        }
      } else if (item.endsWith('.md')) {
        // Handle remaining flat .md files (for backward compatibility)
        projectDirs.push(item.replace('.md', ''));
      }
    }
    
    const projects = [];
    const hiddenProjects = [];
    let lastUpdated = '';
    
    for (const projectId of projectDirs) {
      try {
        let content;
        let markdownPath;
        
        // Try folder structure first, then fall back to flat file
        const folderPath = path.join(contentDir, projectId, 'index.md');
        const flatPath = path.join(contentDir, `${projectId}.md`);
        
        try {
          content = await fs.readFile(folderPath, 'utf8');
          markdownPath = folderPath;
        } catch {
          content = await fs.readFile(flatPath, 'utf8');
          markdownPath = flatPath;
        }
        
        const { metadata, content: markdownContent } = parseFrontmatter(content);
        
        const project = {
          id: projectId,
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
        
        console.log(`Processing ${projectId}: hidden=${project.hidden}, title=${project.title}`);
        
        if (project.hidden) {
          hiddenProjects.push(project);
        } else {
          if (metadata.publishedDate) {
            projects.push(project);
          } else {
            console.log(`Skipping ${projectId} - no publishedDate and not hidden`);
          }
        }
        
        const projectDate = project.lastUpdated || project.publishedDate;
        if (projectDate && projectDate > lastUpdated) {
          lastUpdated = projectDate;
        }
      } catch (error) {
        console.warn(`Failed to load ${projectId}:`, error);
      }
    }
    
    return { projects, hiddenProjects, lastUpdated };
  } catch (error) {
    console.error('Error reading content directory:', error);
    return { projects: [], hiddenProjects: [], lastUpdated: '' };
  }
}

// Generate static index.html with optimized asset paths
async function generateIndex(projects, lastUpdated) {
  const template = await fs.readFile(path.join(__dirname, 'src', 'index.html'), 'utf8');
  
  const sortedProjects = [...projects].sort((a, b) => 
    parseInt(b.publishedDate) - parseInt(a.publishedDate)
  );
  
  const galleryHTML = sortedProjects.map(project => {
    const href = project.externalLink || `${project.id}.html`;
    const target = project.externalLink ? 'target="_blank" rel="noopener noreferrer"' : '';
    
    // Determine image path
    let imagePath;
    if (project.image.startsWith('../global-assets/')) {
      imagePath = `assets/global/${project.image.substring(17)}`;
    } else {
      imagePath = `assets/projects/${project.id}/${project.image}`;
    }
    
    return `
      <a href="${href}" ${target} class="art-item">
        <img src="${imagePath}" alt="${project.alt}" 
             loading="lazy"
             onerror="this.src='./assets/global/default.gif'">
        <div class="description">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="date">Published ${formatDate(project.publishedDate)}</div>
        </div>
      </a>
    `;
  }).join('');
  
  const lastUpdatedHTML = lastUpdated ? 
    `<p id="last-updated" class="date">Last updated ${formatDate(lastUpdated, true)}</p>` : 
    '<p id="last-updated"></p>';
  
  let staticHTML = template
    .replace('href="subpage.html?id=resume"', 'href="resume.html"')
    .replace('<div class="gallery" id="gallery"></div>', `<div class="gallery" id="gallery">${galleryHTML}</div>`)
    .replace('<p id="last-updated"></p>', lastUpdatedHTML)
    .replace('<script src="portfolio.js"></script>', '')
    .replace('<head>', `<head>
  <link rel="preload" href="styles.css" as="style">
  <meta name="description" content="Weijing Wang's portfolio - projects from school and personal work">`)
    .replace('src="assets/images/headshot.webp"', 'src="assets/global/headshot.webp" loading="eager"');
  
  await fs.writeFile(path.join(__dirname, 'index.html'), staticHTML);
  console.log('Generated optimized index.html in root');
}

// Generate static subpage HTML files with new structure
async function generateSubpages(projects, hiddenProjects) {
  const allProjects = [...projects, ...(hiddenProjects || [])];
  
  for (const project of allProjects) {
    try {
      const title = project.title || 'Untitled Project';
      const publishDate = project.publishedDate ? formatDate(project.publishedDate, true) : '';
      const updateDate = project.lastUpdated ? 
        ` • Updated ${formatDate(project.lastUpdated, true)}` : '';
      
      let imageSection = '';
      if (project.id !== 'resume') {
        if (project.metadata.youtube) {
          // Regular YouTube embed
          const youtubeId = project.metadata.youtube.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] || project.metadata.youtube;
          imageSection = `
            <div class="video-container">
              <iframe src="https://www.youtube.com/embed/${youtubeId}" 
                      frameborder="0" 
                      allowfullscreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
              </iframe>
            </div>
          `;
        } else {
          // Regular image with proper path resolution
          let imagePath;
          if (project.image.startsWith('../global-assets/')) {
            imagePath = `assets/global/${project.image.substring(17)}`;
          } else {
            imagePath = `assets/projects/${project.id}/${project.image}`;
          }
          
          imageSection = `
            <div class="image-container">
              <img src="${imagePath}" alt="${project.alt}" 
                   loading="lazy"
                   onerror="this.src='./assets/global/default.gif'">
            </div>
          `;
        }
      }
      
      const pageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Weijing website</title>
  <meta name="description" content="${project.description || title}">
  <link rel="preload" href="styles.css" as="style">
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
      ${parseMarkdown(project.content, project.id)}
    </div>
  </div>

  <div style="text-align: center;">
    <a href="index.html" class="back-btn">← Back to Projects</a>
  </div>
</body>
</html>`;
      
      await fs.writeFile(path.join(__dirname, `${project.id}.html`), pageHTML);
      console.log(`Generated optimized ${project.id}.html`);
    } catch (error) {
      console.error(`Error generating page for ${project.id}:`, error);
    }
  }
}

// Copy static assets with new structure
async function copyAssets() {
  // Copy CSS
  await fs.copyFile(path.join(__dirname, 'src', 'styles.css'), path.join(__dirname, 'styles.css'));
  console.log('Copied styles.css to root');
  
  // Create assets structure
  const assetsRoot = path.join(__dirname, 'assets');
  const globalDir = path.join(assetsRoot, 'global');
  const projectsDir = path.join(assetsRoot, 'projects');
  
  await fs.mkdir(globalDir, { recursive: true });
  await fs.mkdir(projectsDir, { recursive: true });
  
  // Copy global assets
  try {
    const globalAssetsDir = path.join(__dirname, 'src', 'global-assets');
    const globalFiles = await fs.readdir(globalAssetsDir);
    for (const file of globalFiles) {
      await fs.copyFile(
        path.join(globalAssetsDir, file),
        path.join(globalDir, file)
      );
    }
    console.log(`Copied ${globalFiles.length} global assets`);
  } catch (error) {
    console.log('No global-assets directory found, checking for old structure...');
    
    // Fallback: copy from old images directory
    try {
      const oldImagesDir = path.join(__dirname, 'src', 'assets', 'images');
      await fs.copyFile(path.join(oldImagesDir, 'headshot.webp'), path.join(globalDir, 'headshot.webp'));
      await fs.copyFile(path.join(oldImagesDir, 'default.gif'), path.join(globalDir, 'default.gif'));
      console.log('Copied global assets from old structure');
    } catch (error) {
      console.warn('Could not copy global assets from old structure:', error.message);
    }
  }
  
  // Copy project assets
  const contentDir = path.join(__dirname, 'src', 'content');
  try {
    const items = await fs.readdir(contentDir);
    
    for (const item of items) {
      const itemPath = path.join(contentDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        // Copy all files except index.md from project directory
        const projectDir = path.join(projectsDir, item);
        await fs.mkdir(projectDir, { recursive: true });
        
        const projectFiles = await fs.readdir(itemPath);
        for (const file of projectFiles) {
          if (file !== 'index.md') {
            await fs.copyFile(
              path.join(itemPath, file),
              path.join(projectDir, file)
            );
          }
        }
        console.log(`Copied assets for project: ${item}`);
      }
    }
  } catch (error) {
    console.warn('Error copying project assets:', error.message);
  }
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
    console.log('Building optimized static site with new folder structure...');
    
    // Clean previous build
    await cleanRoot();
    
    // Load projects
    const { projects, hiddenProjects, lastUpdated } = await loadProjects();
    console.log(`Loaded ${projects.length} gallery projects and ${hiddenProjects.length} hidden projects`);
    
    // Generate pages in root
    await generateIndex(projects, lastUpdated);
    await generateSubpages(projects, hiddenProjects);
    await copyAssets();
    
    console.log('✅ Optimized static site built successfully!');
    console.log('📈 Performance features:');
    console.log('   - Lazy loading for all images');
    console.log('   - Standard YouTube embeds');
    console.log('   - Organized folder structure per project');
    console.log('   - Preloaded CSS for faster rendering');
    console.log('\n🚀 Deploy the root directory to GitHub Pages');
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