# MTGen.net Technical Documentation

## Technology Stack
- **Server**: Node.js v13.14.0 (latest version supported by host)
- **Framework**: Express
- **View Engine**: Express-Handlebars
- **Server Management**: Phusion Passenger
- **Image Format**: WEBP for efficiency

## Hosting Environment
- Hosted on DreamHost
- Using Passenger for application serving
- Production environment variables set via .bash_profile

## Directory Structure
- `/public`: Static files (images, CSS, client-side JS)
- `/tmp`: Passenger application management
- `app.js`: Main application entry point

## Data Sources
- mtgjson.com: Primary source for set data
- Wizards of the Coast articles: Visual spoilers and official images
- scryfall.com: High-resolution card images when needed
- visualping.io: Monitoring source sites for changes

## Key Node.js Modules
- express-handlebars: Template engine
- compression: GZIP compression support
- express-status-monitor: Status monitoring at /status
- handlebars-dateformat: Date formatting in templates

## Development Environment Setup
1. Install Node Version Manager (nvm)
2. Install Node.js v13.14.0
3. Install Passenger locally for development
4. Install required npm packages

### Local Development
- Run locally on port 3000: `passenger start`
- Debug mode: Use VSCode debugger (F5)
- Note: Debug mode doesn't handle static files

### Deployment Process
1. Use FTP to upload changed files
2. Connect via SSH to server
3. Touch restart file to trigger Passenger reload

Notes about hosting environment:
- DreamHost limits Node.js version (currently max v13.14.0)
- Passenger manages all static file serving
- Production environment set via NODE_ENV in .bash_profile
- Must include PassengerNodejs path in .htaccess
1. Use FTP to upload changed files
2. Connect via SSH to server
3. Touch restart file to trigger Passenger reload

## Monitoring and Maintenance
- Status monitoring available at /status endpoint
- Server logs accessible via SSH
- Passenger restart required for some changes

## Image Processing
Convert PNG to WEBP:
```bash
find mtgen -name '*.png' -print0 | xargs -0 -P $(sysctl -n hw.ncpu) -I {} cwebp {} -quiet -mt -q 80 -o {}.webp
```

## Common Tasks and Troubleshooting
### Port Issues
Find process using port:
```bash
lsof -nPL -iTCP:3000
```

### Package Updates
Check outdated packages:
```bash
npm outdated -g --depth=0
```

Update all packages:
```bash
npm update -g
```

### Server Restart
Touch restart file:
```bash
touch tmp/restart.txt
```

## Future Considerations
- Monitor DreamHost for support of newer Node.js versions
- Consider implementing template caching
- Regular security updates for dependencies
