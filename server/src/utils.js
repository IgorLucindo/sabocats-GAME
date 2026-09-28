const fs = require('fs');

function setupDevWatcher(io, targetPath) {
    let reloadTimeout;
    
    fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
        // Ignore file access/metadata events on static assets
        if (!filename || filename.includes('assets')) return;

        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            console.log(`Frontend file changed (${filename}). Reloading clients...`);
            io.emit('DEV_RELOAD'); 
        }, 200); 
    });
}

module.exports = { setupDevWatcher };