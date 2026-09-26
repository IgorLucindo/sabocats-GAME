const fs = require('fs');

function setupDevWatcher(io, targetPath) {
    let reloadTimeout;
    
    fs.watch(targetPath, { recursive: true }, (eventType, filename) => {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            console.log(`Frontend file changed (${filename}). Reloading clients...`);
            io.emit('DEV_RELOAD'); 
        }, 200); 
    });
}

module.exports = { setupDevWatcher };