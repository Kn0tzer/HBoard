


// settings page
const isStandalone = window.navigator.standalone;
const phoneElement = document.querySelector(".phone");

if (isStandalone) {
    document.getElementById("content").style.display = "none";
    document.querySelectorAll(".instruction").forEach(el => el.style.display = "none");
    if (phoneElement) {
        phoneElement.style.display = "flex";
    }
} else {
    document.getElementById("content").style.display = "none";
    document.querySelectorAll(".instruction").forEach(el => el.style.display = "none");
}










function parseBase64Data() {
    const base64Input = document.getElementById('base64Input').value;
    console.log("31");
    try {
        // decode base64
        const jsonString = atob(base64Input);
        
        // Create an object to store the parsed data
        const parsedData = {};
        
        // match json objects
        const jsonRegex = /{[^}]+}/g;
        const matches = jsonString.match(jsonRegex);
        console.log("39");
        
        if (matches) {
            console.log("41");
            matches.forEach(match => {
                const obj = JSON.parse(match);
                // Get the first (and only) key-value pair from this object
                const key = Object.keys(obj)[0];
                let value = obj[key];
                
                // URL decode the key
                const decodedKey = decodeURIComponent(key);
                
                // Clean up the URL by removing escaped forward slashes
                if (value) {
                    console.log("53");
                    value = value.replace(/\\/g, '');
                }
                console.log("56");
                parsedData[decodedKey] = value;
                console.log("58");
            });
        }
        console.log("61");
        // Store in localStorage
        localStorage.setItem('appData', JSON.stringify(parsedData));
        console.log("64");
        window.location.href = 'index.html';
        console.log("66");
    } catch (error) {
    }
}








        // Load or set app positions in localStorage
        function initializeAppPositions() {
            const appPositions = JSON.parse(localStorage.getItem('appPositions')) || {};
           const appData = JSON.parse(localStorage.getItem('appData')) || {};

           // Give all apps positions
           Object.keys(appData).forEach(appName => {
                if (!appPositions[appName]) {
                    appPositions[appName] = findNextAvailablePosition(appPositions);
                }
           });

           localStorage.setItem('appPositions', JSON.stringify(appPositions));
           return appPositions;
        }

        function findNextAvailablePosition(positions) {
            const occupiedPositions = new Set(Object.values(positions));
            let position = 1;

            while (occupiedPositions.has(position)) {
                position++;
            }

            return position;
        }

        // Update one app's position
        function updateAppPosition(appName, newPosition) {
            const appPositions = JSON.parse(localStorage.getItem('appPositions')) || {};
            appPositions[appName] = newPosition;
            localStorage.setItem('appPositions', JSON.stringify(appPositions));
        }

        // render apps in position (change this later)
        function renderApps() {
            const appData = JSON.parse(localStorage.getItem('appData')) || {};
            const appPositions = JSON.parse(localStorage.getItem('appPositions')) || {};
            const pagesContainer = document.querySelector('.home-screen .pages');

            // Sort apps by position
            const apps = Object.entries(appData).map(([name, iconUrl]) => ({
                name,
                iconUrl,
                position: appPositions[name] || findNextAvailablePosition(appPositions)
            }));

            apps.sort((a, b) => a.position - b.position);

            // Create pages and fill with apps
            let currentPage = null;
            let currentPageNum = -1;

            apps.forEach((app, index) => {
                const pageNum = Math.floor((app.position - 1) / 24);

                if (pageNum !== currentPageNum) {
                    currentPage = document.createElement('div');
                    currentPage.classList.add('page');
                    pagesContainer.appendChild(currentPage);
                    currentPageNum = pageNum;

                    const dotsContainer = document.querySelector('.page-dots-container');
                    const dot = document.createElement('div');
                    dot.className = 'page-dot-active', 'page-dot';
                    dotsContainer.appendChild(dot);
                }

                    const appContainer = createAppElement(app.name, app.iconUrl);
                    currentPage.appendChild(appContainer);
            });

            // Update page dots
            updatePageDots(document.querySelectorAll('.page').length);
        }

        // Create a single app element
        function createAppElement(appName, iconUrl) {
            const appContainer = document.createElement('div');
            appContainer.classList.add('app-container');

            const link = document.createElement('a');
            const shortcutUrl = `shortcuts://x-callback-url/run-shortcut?name=HBoard&input=${encodeURIComponent(appName)}`;
            link.setAttribute('href', shortcutUrl);
            link.setAttribute('draggable', 'false');
            link.setAttribute('target', '_self');

            const img = document.createElement('img');
            img.setAttribute('draggable', 'false');
            img.setAttribute('src', iconUrl);

            const label = document.createElement('div');
            label.classList.add('label');
            label.textContent = appName;

            link.appendChild(img);
            appContainer.appendChild(link);
            appContainer.appendChild(label);

            return appContainer;
        }


        // on page load
        const urlParams = new URLSearchParams(window.location.search);
        let appData = JSON.parse(localStorage.getItem('appData')) || {};

        if (urlParams.toString()) {
            urlParams.forEach((value, key) => {
                appData[key] = value;
            });
            localStorage.setItem('appData', JSON.stringify(appData));

            initializeAppPositions();
            renderApps();
        } else if (Object.keys(appData).length > 0) {
                renderApps();
        }


initializeAppPositions();
renderApps();



// track mouse/touch movements
const slider = document.querySelector('.pages');
const pages = document.querySelectorAll('.page');
const pageWidth = slider.offsetWidth;
let isDown = false;
let startX;
let startY;
let scrollLeft;
let lastX;
let velocity = 0;
let isDraggingDown = false;

let pressTimer = null;
let isJiggling = false;
const LONG_PRESS_DURATION = 500;
let pressStartTime = 0;

// MOUSE AND TOUCH page scrolling eventListeners
slider.addEventListener('mousedown', (e) => {
isDown = true;
startX = e.pageX;
startY = e.pageY;
lastX = startX;
scrollLeft = slider.scrollLeft;
velocity = 0;
isDraggingDown = false;

pressStartTime = Date.now();
startLongPressTimer(e);
});

slider.addEventListener('mouseleave', () => {
if (isDown) handleScrollEnd();
isDown = false;

clearLongPressTimer();
});

slider.addEventListener('mouseup', () => {
// Check for quick tap
const pressDuration = Date.now() - pressStartTime;
if (pressDuration < LONG_PRESS_DURATION) {
if (isJiggling) {
    isJiggling = false;
    stopJiggleAnimation();
}
}

handleScrollEnd();
isDown = false;

clearLongPressTimer();
});

// TOUCH ONLY scroll end detection for page dots
slider.addEventListener('touchend', () => {
// Check for quick tap
const pressDuration = Date.now() - pressStartTime;
if (pressDuration < LONG_PRESS_DURATION && !hasMovedSignificantly(e)) {
if (isJiggling) {
    isJiggling = false;
    stopJiggleAnimation();
}
}

const currentScroll = slider.scrollLeft;
const targetPage = Math.round(currentScroll / pageWidth);
updatePageDots(targetPage);

clearLongPressTimer();
});

// MOUSE ONLY downward drag eventListeners
slider.addEventListener('mousemove', (e) => {
if (!isDown) return;
e.preventDefault();

const x = e.pageX;
const y = e.pageY;
const deltaY = y - startY;
const deltaX = x - lastX;
lastX = x;

// MOUSE ONLY drag down check
if (Math.abs(deltaY) > Math.abs(deltaX) && !isDraggingDown) {
isDraggingDown = true;
}

if (isDraggingDown) {
const screenHeight = window.innerHeight;
const dragPercentage = (deltaY / screenHeight) * 100;

if (dragPercentage > 15) {
    window.location.href = 'shortcuts://x-callback-url/run-shortcut?name=HBoard&input=Spotlight' // MOUSE ONLY open url on drag down 15% of screen
    isDown = false;
    return;
}
} else {
velocity = velocity * 0.8 + deltaX * 0.2;
slider.scrollLeft -= deltaX;
}

clearLongPressTimer();
});

// TOUCH ONLY downward drag eventListeners
slider.addEventListener('touchstart', (e) => {
startX = e.touches[0].pageX;
startY = e.touches[0].pageY;
isDraggingDown = false;

pressStartTime = Date.now();
startLongPressTimer(e);
});

slider.addEventListener('touchmove', (e) => {
const y = e.touches[0].pageY;
const x = e.touches[0].pageX;
const deltaY = y - startY;
const deltaX = x - startX;

// TOUCH ONLY drag down check
if (Math.abs(deltaY) > Math.abs(deltaX) && !isDraggingDown) {
isDraggingDown = true;
}

if (isDraggingDown) {
e.preventDefault();
const screenHeight = window.innerHeight;
const dragPercentage = (deltaY / screenHeight) * 100;

if (dragPercentage > 15) {
    window.location.href = 'shortcuts://x-callback-url/run-shortcut?name=HBoard&input=Spotlight'; // TOUCH ONLY open url on drag down 15% of screen
    isDraggingDown = false;
    return;
}
}




// stop jiggle mode timer on move
clearLongPressTimer();
});

// Update page dots on scroll
slider.addEventListener('scroll', () => {
const currentScroll = slider.scrollLeft;
const currentPage = Math.round(currentScroll / pageWidth);
updatePageDots(currentPage);
});

function handleScrollEnd() {
const currentScroll = slider.scrollLeft;
const targetPage = Math.round(currentScroll / pageWidth); // check closest page

if (Math.abs(velocity) > 1) {
const direction = velocity > 0 ? -1 : 1;
const newPage = Math.max(0, Math.min(pages.length - 1, targetPage + direction));
scrollToPage(newPage);
} else {
scrollToPage(targetPage);
}
}

function scrollToPage(pageIndex) {
slider.scrollTo({
left: pageIndex * pageWidth,
behavior: 'smooth' // update this later for accurate ios scrolling
});
updatePageDots(pageIndex);
}

function updatePageDots(pageIndex) {
const dots = document.querySelectorAll('.page-dots-container div');
dots.forEach((dot, index) => {
if (index === pageIndex) {
    dot.className = 'page-dot-active';
} else {
    dot.className = 'page-dot';
}
});
}





// when holding and not moving for longer than 0.5s start jiggle mode
function startLongPressTimer(e) {
if (pressTimer === null) {
pressTimer = setTimeout(() => {
    if (!isDraggingDown && Math.abs(slider.scrollLeft - scrollLeft) < 5) {
        isJiggling = !isJiggling;
        if (isJiggling) {
            addJiggleToImages();
        } else {
            stopJiggleAnimation();
        }
    }
}, LONG_PRESS_DURATION);
}
}

function clearLongPressTimer() {
if (pressTimer) {
clearTimeout(pressTimer);
pressTimer = null;
}
}

function stopJiggleAnimation() {
const images = document.querySelectorAll('img'); // change later
images.forEach(img => {
img.getAnimations().forEach(animation => {
    animation.cancel();
});
});
}

function addJiggleToImages() {
const images = document.querySelectorAll('img');

images.forEach(img => {
// Css animation smoothing
img.style.transformOrigin = 'center';
img.style.position = 'relative';

// Position keyframes
const positionKeyframes = [
{ transform: 'translate(-1.5px, -1.5px)' },
{ transform: 'translate(0, 0)' },
{ transform: 'translate(-1.5px, 0)' },
{ transform: 'translate(0, -1.5px)' },
{ transform: 'translate(-1.5px, -1.5px)' }
];

// Rotation keyframes
const rotationKeyframes = [
{ transform: 'rotate(-3deg)' },
{ transform: 'rotate(3deg)' },
{ transform: 'rotate(-3deg)' }
];

// Random delay 0-250ms to jiggle out of sync
const randomDelay = Math.random() * 250;

// Position animation
img.animate(positionKeyframes, {
duration: 250,
iterations: Infinity,
delay: randomDelay,
easing: 'linear'
});

// Rotation animation
img.animate(rotationKeyframes, {
duration: 250,
iterations: Infinity,
delay: randomDelay,
easing: 'linear'
});
});
}