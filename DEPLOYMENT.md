# CommishCrunch - Static Site Deployment

This project is configured for static site generation and can be hosted on any static hosting platform.

## Build for Production

```bash
# Install dependencies
pnpm install

# Build static site
pnpm run build
```

The static files will be generated in the `out/` directory.

## Hosting Options

### 1. Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Build command: `pnpm run build`
3. Publish directory: `out`
4. Deploy!

### 2. Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect Next.js and handle the build
3. Deploy!

### 3. GitHub Pages
1. Build locally: `pnpm run build`
2. Push the `out/` folder contents to your `gh-pages` branch
3. Enable GitHub Pages in repository settings

### 4. Any Static Host
1. Build locally: `pnpm run build`
2. Upload the contents of the `out/` folder to your web server
3. Configure your server to serve `index.html` for all routes

## Local Testing

To test the static build locally:

```bash
# Build and serve locally
pnpm run static
```

## Features

- ✅ Fully static - no server required
- ✅ Works offline after first load
- ✅ All data stored locally in browser (IndexedDB)
- ✅ No external dependencies or APIs
- ✅ Mobile-friendly responsive design
- ✅ Fast loading and performance optimized

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Full support

## Notes

- All user data is stored locally in the browser
- No user accounts or external services required
- Export/import functionality allows data portability
- Perfect for sales teams who need offline access