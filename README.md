# Easy mobile wedding invitation

This project is a mobile-optimized wedding invitation website. It provides an optimal user experience on all devices with responsive design. Created for personal use.
If you find it useful, please Fork and Star!

## Sample site

[Visit the site](https://wedding-invitation-neon-five.vercel.app)

## Support the developer

If this project has been helpful, show your support with a cup of coffee! Your support helps create better open source projects.



[☕ Buy the developer a coffee](https://qr.kakaopay.com/Ej8soKM2U)

## Features

- Full-screen portrait main image with wedding information
- Wedding-related information organized by section (dynamic background color system)
- Real-time D-day countdown timer (fixed-width numbers)
- Location information and directions using Naver Map API
- Image gallery (scroll/grid layout options, configurable position, touch swipe support)
- RSVP system with Slack notifications (enable/disable)
- Account number accordion expand/collapse with copy functionality
- Groom/bride shuttle information accordion
- Elegant button ripple effects and touch feedback
- Share invitation via Web Share API
- URL copy functionality

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- styled-components
- Naver Map API
- Web Share API
- Slack Webhook API

## Getting started

### Environment setup

1. Clone the repository:
  ```
   git clone https://github.com/your-username/wedding-invitation.git
   cd wedding-invitation
  ```
2. Install dependencies:
  ```
   npm install
  ```
3. Create `.env.local` file:
  ```
   # AMAP (embedded venue map) - get key at https://console.amap.com/
   NEXT_PUBLIC_AMAP_KEY=your_amap_key
   NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=your_amap_security_js_code

   # Naver Map (direction button only)
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id

   # Slack Webhook URL (for RSVP notifications)
   NEXT_PUBLIC_SLACK_WEBHOOK_URL=your_slack_webhook_url

   # Site URL (after deployment)
   NEXT_PUBLIC_SITE_URL=https://your-wedding-site.com
  ```
4. Run the development server:
  ```
   npm run dev
  ```

## Editing content

To edit the invitation content, edit the `src/config/wedding-config.ts` file. You can modify the following:

- Meta information (title, description, etc.)
- Main screen information (title, image, date, venue)
- Schedule
- Venue information (map coordinates, directions URL, transportation info, etc.)
- Groom/bride shuttle information
- Gallery images and layout settings
- Invitation message
- Account information
- **RSVP settings (enable/disable)**
- Slack notification settings

### RSVP section settings

You can show or hide the RSVP section:

```typescript
rsvp: {
  enabled: true, // Show RSVP section (true: show, false: hide)
  showMealOption: false, // Show meal option input
},
```

- Set `enabled: false` to completely hide the RSVP section.
- The dynamic background color system will automatically adjust so other sections alternate colors naturally.

## AMAP (高德地图) setup – embedded venue map

The **embedded map** on the venue section uses AMAP (高德地图) JavaScript API 2.0.

1. Register at [高德开放平台](https://console.amap.com/) and create an application.
2. Add a key for **Web端 (JS API)** and note the **安全密钥** (security JS code).
3. In `.env.local` set:
  - `NEXT_PUBLIC_AMAP_KEY` = your Web JS API key
  - `NEXT_PUBLIC_AMAP_SECURITY_JS_CODE` = your 安全密钥
4. Restrict the key to your domain (e.g. `localhost`, your production domain) in the AMAP console.

Keys created after 2021-12-02 require the security code. See [AMAP JS API 2.0 加载](https://lbs.amap.com/api/javascript-api-v2/guide/abc/load).

## Naver Map (direction button only)

### How to get a Naver Cloud Platform API key

The "Naver Map" button opens Naver Maps for directions. The embedded map is AMAP; Naver key is only needed if you keep the Naver Map button.

1. Sign up and log in at [Naver Cloud Platform](https://www.ncloud.com/).
2. In the console, go to "Products & Services" > "AI·Application Service" > "Maps".
3. Click "Application 등록" to create a new application.
4. Enter the application name and select "WEB 환경".
5. Register the web service URL (deployment domain or development URL [[http://localhost:3000]](http://localhost:3000])):
  - Local development: [http://localhost:3000](http://localhost:3000)
  - Production: [https://your-wedding-site.com](https://your-wedding-site.com)
6. Set the Client ID in `.env.local` as `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`.

### Map configuration

Venue coordinates and zoom are shared by AMAP and direction links. Configure in `wedding-config.ts`:

```typescript
venue: {
  name: "Venue name",
  address: "Address",
  tel: "Phone number",
  naverMapId: "Place name for Naver Map search",
  coordinates: {
    latitude: 37.5045,  // Latitude
    longitude: 127.0495 // Longitude
  },
  placeId: "12136346", // Naver Map place ID
  mapZoom: "17.08",    // Map zoom level
  // ... other settings
  
  // Groom shuttle (hidden if not set)
  groomShuttle: {
    location: "In front of Seoul Station Exit 2",
    departureTime: "Departure 10:30 AM",
    contact: {
      name: "John Doe",
      tel: "010-1234-5678"
    }
  },
  
  // Bride shuttle (hidden if not set)
  brideShuttle: {
    location: "In front of Gangnam Station Exit 4",
    departureTime: "Departure 10:30 AM",
    contact: {
      name: "Jane Doe",
      tel: "010-8765-4321"
    }
  }
}
```

#### How to find coordinates and place ID

1. Search for the venue on [Naver Map](https://map.naver.com).
2. Click the search result to view details.
3. Check the browser address bar:
  - In URLs like `https://map.naver.com/p/search/placename/place/12345678`, the last number is the `placeId`.
4. In the directions URL you can find the zoom level and coordinates:
  - `https://map.naver.com/p/directions/-/-/-/walk/place/12345678?c=17.08,0,0,0,dh`
  - The first value after `c=` (`17.08`) is the `mapZoom` value.
5. Latitude and longitude can be found by opening Naver Map developer tools and running:
  ```javascript
   // Run in browser console
   console.log(map.getCenter().toString());
   // Output: lat: 37.1234, lng: 127.5678
  ```

### Gallery configuration

The gallery uses a **single folder** (`public/images/gallery/`). Images are **rotated randomly** on each load:

- **Main (hero) image**: One random portrait from the gallery folder is chosen server-side per request.
- **Gallery section**: The API returns a random subset of images (up to `maxDisplay`, default 9) from the same folder.

You can still configure layout and position in `wedding-config.ts`:

```typescript
gallery: {
  layout: "scroll", // "scroll" or "grid"
  position: "middle", // "middle" or "bottom"
  maxDisplay: 9,     // max images to show per load (shuffled each time)
  images: [],       // fallback when folder read fails
},
```

#### Adding gallery images

1. **Option A – Copy manually**  
   Place image files (e.g. `.jpg`, `.webp`) in `public/images/gallery/`.  
   Then run the analysis script once to regenerate the manifest (optional but recommended for portrait detection for the main image):
   ```bash
   npm run analyze-photos -- "path/to/your/photos" --copy
   ```

2. **Option B – Use the analysis script**  
   From the project root:
   ```bash
   node scripts/analyze-photos.js "path/to/source/photos"        # report only
   node scripts/analyze-photos.js "path/to/source/photos" --copy       # copy to gallery
   node scripts/analyze-photos.js "path/to/source/photos" --copy --resize  # copy + resize to ~1200×900, <500KB
   ```
   With `--copy`, the script writes `public/images/gallery/manifest.json` (filename, dimensions, orientation). The server uses this to pick a random portrait for the main image without reading file dimensions on every request.

#### Gallery layout options

- `**"scroll"**`: Horizontal scroll gallery.
  - Navigate with left/right arrow buttons
  - Touch swipe support
  - Efficient use of screen space
- `**"grid"**`: 3-column grid showing all images at once.
  - View all gallery images on one screen
  - Responsive design optimized for mobile
  - Useful when you have many images

#### Gallery position options

- `**"middle"**`: Default position (after venue info)
  - Main screen → Invitation message → Schedule → Venue info → **Gallery** → RSVP → Account info
- `**"bottom"`**: Bottom position (above Footer)
  - Main screen → Invitation message → Schedule → Venue info → RSVP → Account info → **Gallery**

Both layouts support image zoom on click. In zoom view you can navigate with keyboard arrows, mouse wheel, and touch gestures.

## Slack webhook setup

To receive RSVP notifications in Slack:

1. Go to [Slack API](https://api.slack.com/apps) and log in.
2. Click "Create New App" and select "From scratch".
3. Enter the app name (e.g. "Wedding RSVP") and select your Slack workspace.
4. Select "Incoming Webhooks" in the left menu and enable it.
5. Click "Add New Webhook to Workspace".
6. Choose the channel for notifications and click "Allow".
7. Set the generated Webhook URL in `.env.local` as `NEXT_PUBLIC_SLACK_WEBHOOK_URL`.
8. Configure the Slack channel in `wedding-config.ts`:
  ```typescript
   slack: {
     webhookUrl: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL || "",
     channel: "#wedding-rsvp", // Channel for notifications
   }
  ```

## Adding images and fonts

### Images

- **Main image**: Chosen at random from portrait images in `public/images/gallery/` (see Gallery configuration). Fallback is set in `wedding-config.ts` (`main.image`).
- **Gallery images**: Place files in `public/images/gallery/`. The site shows a random subset each load. Use the optional script to copy/resize and generate a manifest:
  ```bash
  node scripts/analyze-photos.js "<source-photos-path>" --copy --resize
  ```

Image optimization tips:

- Main image: 1080x1920px recommended (portrait mobile optimization)
- Gallery images: 1200x900px recommended (4:3 ratio)
- File size: JPG or WebP format, under 500KB per image recommended

### Fonts

Add custom fonts to `public/fonts/`:

- MaruBuri-ExtraLight.ttf
- MaruBuri-Light.ttf
- MaruBuri-Regular.ttf
- MaruBuri-SemiBold.ttf
- MaruBuri-Bold.ttf
- PlayfairDisplay-Italic.ttf

## Deployment

This project can be easily deployed to Vercel or Netlify.

### Vercel deployment

1. Sign up at [Vercel](https://vercel.com) and connect your GitHub account.
2. Create a new project and select this repository.
3. Set environment variables (from `.env.local`).
4. Click Deploy.
5. (Optional) Configure a custom domain.

#### Deploy with Vercel CLI

1. Install Vercel CLI:
  ```
   npm install -g vercel
  ```
2. Log in:
  ```
   vercel login
  ```
3. Deploy:
  ```
   vercel
  ```
4. Deploy to production:
  ```
   vercel --prod
  ```

### Netlify deployment

1. Sign up at [Netlify](https://netlify.com) and connect your GitHub account.
2. Create a new site and select this repository.
3. Build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
4. Set environment variables (from `.env.local`).
5. (Optional) Configure a custom domain.

## Security and privacy

### API keys and environment variables

- Never commit `.env.local` to the Git repository. It is included in `.gitignore` by default.
- Store all API keys and secrets in environment variables.
- Set environment variables securely in deployment services like Vercel or Netlify.

### Privacy considerations

- Handle personal information (phone numbers, account numbers, etc.) on the invitation carefully.
- Get consent before including information about the couple, parents, etc.
- When collecting RSVP information, clearly state the purpose and retention period.
- Before deployment, ensure all test data and placeholder information has been removed.

### Unauthorized copying and identification

- Legal action may be taken if unauthorized copies are found.

**Note**: This project is released under the CC BY-NC-ND (Attribution-NonCommercial-NoDerivatives) license. Commercial use is explicitly prohibited except for personal wedding purposes.

### Pre-deployment checklist

- Test API keys replaced with production keys
- All personal information appropriately handled
- `.gitignore` excludes sensitive files like `.env.local`
- `wedding-config.ts` contains only real information
- Test data and placeholder text replaced with actual content

## Performance optimization

This project includes the following performance optimizations:

1. **Code splitting**: Dynamic imports load each section on demand.
2. **Image optimization**: next/image for optimized images.
3. **Lazy loading**: Applied to gallery images.
4. **Script optimization**: Naver Map API loaded dynamically when needed.
5. **Mobile touch optimization**: Ripple effects and touch feedback for better UX
6. **Dynamic color system**: Colors computed at build time for runtime performance
7. **Conditional rendering**: Unnecessary sections like RSVP excluded for smaller bundle size

### Share functionality

Two ways to share the invitation:

1. Copy URL: Copy the current URL to clipboard
2. Share: Use Web Share API to open the device share menu

## Troubleshooting

### Naver Map not displaying

- Verify the correct Client ID is set in `.env.local`.
- Check that the web service URL is correctly registered in Naver Cloud Platform console.
- Check the browser console for error messages.
- For authentication errors, verify:
  - Client ID is correct
  - Web service URL includes the current domain
  - [http://localhost:3000](http://localhost:3000) is registered for local development
  - Actual domain is registered for production deployment

### RSVP notifications not sending to Slack

- Verify the correct Slack Webhook URL is set in `.env.local`.
- Check the Webhook URL format ([https://hooks.slack.com/services/](https://hooks.slack.com/services/)...).
- Ensure the Slack app is correctly installed in the workspace.
- Verify the notification channel exists and the app has access.

### Share functionality not working

- Web Share API is widely supported on mobile but limited on desktop browsers.
- Check browser support at [Can I use Web Share API](https://caniuse.com/web-share).
- On unsupported browsers, only the URL copy feature works.

## Contributing

Contributions are welcome! Here are guidelines for contributing.

### How to contribute

1. Fork this repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

### Pull Request guidelines

When submitting a Pull Request, include:

```markdown
## Description
Briefly describe the changes and why they were made.

## Related issues
Reference any related issue numbers (e.g. #123).

## Checklist
- [ ] Code follows project style guidelines.
- [ ] When changing existing behavior, comments explain the reason.
- [ ] Documentation updated if needed.
- [ ] Code has been tested.
```

### Code style

- Follow the project's eslint and prettier configuration for TypeScript.
- Use functional components for React.
- Use styled-components for styling.
- Use clear variable names and appropriate comments for readability.

## License

This project is released under the CC BY-NC-ND (Attribution-NonCommercial-NoDerivatives) license.

### License summary

This work is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.en).

The following restrictions apply:

- **Attribution (BY)**: You must give appropriate credit to the original author.
- **NonCommercial (NC)**: This work may not be used for commercial purposes. You may not use this project to provide paid services or derive commercial benefit.
- **NoDerivatives (ND)**: You may not remix, transform, or build upon this work. You may not modify this project's code to create or distribute other projects.

Additionally, except for personal wedding use, you may not replicate this project for private use.

## Other information

- Fonts: [MaruBuri](https://hangeul.naver.com/font) is a free font from Naver. [PlayfairDisplay](https://fonts.google.com/specimen/Playfair+Display) is licensed under the Open Font License.
- Images: Sample images are from Unsplash or personal photos. For testing only. Respect copyright when using in production.

