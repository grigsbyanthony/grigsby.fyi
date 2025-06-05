# grigsby.fyi

A minimalist academic/research blog built with HTML, CSS, and JavaScript for GitHub Pages.

## Overview

This website serves as a platform for sharing academic and research content. It features:

- Clean, minimalist design inspired by modern academic blogs
- Simple tagging system for categorizing content
- Search functionality to find posts by tags
- Responsive design that works well on all devices
- Easy integration with Quarto or R Markdown HTML exports

## Structure

```
grigsby.fyi/
├── index.html          # Main landing page
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── script.js       # JavaScript functionality
├── posts/              # Directory for blog posts
│   ├── posts.json      # Metadata for all posts
│   ├── sample-post-1.html
│   └── sample-post-2.html
└── README.md           # This documentation
```

## How to Add New Posts

1. **Export your content**: Export your Quarto or R Markdown document as HTML
2. **Add to posts directory**: Place the HTML file in the `posts` directory
3. **Update metadata**: Add an entry to `posts/posts.json` with the following structure:

```json
{
  "title": "Your Post Title",
  "date": "YYYY-MM-DD",
  "url": "posts/your-post-filename.html",
  "excerpt": "A brief summary of your post",
  "tags": ["tag1", "tag2", "tag3"]
}
```

## Deploying to GitHub Pages

1. Create a GitHub repository (ideally named `username.github.io`)
2. Push this code to that repository
3. In the repository settings, enable GitHub Pages and select the main branch as the source

## Local Development

To test the site locally, you can use any simple HTTP server. For example, with Python:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Then visit `http://localhost:8000` in your browser.

## Customization

- Edit `css/style.css` to change the visual appearance
- Modify the site description in `index.html`
- Add or remove tags as needed in your posts

## License

© Anthony Grigsby. All rights reserved.
