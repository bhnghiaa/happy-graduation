// Debug utilities for NITCNE app

// Cài đặt debug mode
var DEBUG = true;

// Debug logger
function debugLog(...args) {
    if (DEBUG) {
        console.log('%c[DEBUG]', 'color: blue; font-weight: bold;', ...args);
    }
}

// Error logger
function errorLog(...args) {
    if (DEBUG) {
        console.error('%c[ERROR]', 'color: red; font-weight: bold;', ...args);
    }
}

// Warn logger
function warnLog(...args) {
    if (DEBUG) {
        console.warn('%c[WARN]', 'color: orange; font-weight: bold;', ...args);
    }
}

// Check if the URL is valid
function isValidImageUrl(url) {
    if (!url) return false;
    if (typeof url !== 'string') return false;

    // Basic URL validation
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// Test an image URL
function testImageUrl(url) {
    if (!isValidImageUrl(url)) {
        errorLog(`Invalid URL format: ${url}`);
        return false;
    }

    debugLog(`Testing image URL: ${url}`);

    var img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = function () {
        debugLog(`✅ Image loaded successfully: ${url} (${this.width}x${this.height})`);
        return true;
    };

    img.onerror = function () {
        errorLog(`❌ Failed to load image: ${url}`);
        return false;
    };

    img.src = url;
}

// Force manual texture update for clouds
function forceTextureUpdate() {
    if (!sky || !sky.mesh) {
        errorLog("Sky not available");
        return;
    }

    debugLog("Forcing texture updates for all clouds...");

    sky.mesh.traverse(function (object) {
        if (object.material && object.material.map) {
            object.material.map.needsUpdate = true;
            debugLog("Updated texture for object", object);
        }
    });
}

// Manually create a cloud with a specific image
function debugAddCloud(url) {
    if (!isValidImageUrl(url)) {
        errorLog(`Cannot add cloud: Invalid URL: ${url}`);
        return;
    }

    if (typeof createNewCloudWithImage === 'function') {
        debugLog(`Adding cloud with image: ${url}`);
        createNewCloudWithImage(url);
    } else {
        errorLog("createNewCloudWithImage function not available");
    }
}

// Export to global scope for console access
window.debugLog = debugLog;
window.errorLog = errorLog;
window.warnLog = warnLog;
window.isValidImageUrl = isValidImageUrl;
window.testImageUrl = testImageUrl;
window.forceTextureUpdate = forceTextureUpdate;
window.debugAddCloud = debugAddCloud;
