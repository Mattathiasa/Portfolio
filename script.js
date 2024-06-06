// Function to fetch GitHub projects
async function fetchGitHubProjects(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        return [];
    }
}

// Function to display GitHub projects
async function displayGitHubProjects(username) {
    const projectsContainer = document.querySelector('#projects .project-list');
    const projects = await fetchGitHubProjects(username);

    if (projects.length === 0) {
        projectsContainer.innerHTML = '<p>No projects found.</p>';
        return;
    }

    projectsContainer.innerHTML = projects.map(project => `
      <div class="project">
        <h3>${project.name}</h3>
        <p>${project.description || 'No description available.'}</p>
        <a href="${project.html_url}" target="_blank">View on GitHub</a>
      </div>
    `).join('');
}

// Display GitHub projects
displayGitHubProjects('mattathiasa');







var words = ["Mattathias Abraham", "a Software Engineer", "an aspiring Football Freestyler"];
var output = document.getElementById("output");
var currentIndex = 0;
var currentWordIndex = 0;

var clickSound = document.getElementById("clickSound");
clickSound.playbackRate = 1.5; // Set the playback rate to 2x speed

function displayIAm() {
    output.innerHTML = "I am ";
    setTimeout(spellOut, 1000); // Initial delay before spelling out the word (500 milliseconds)
}

function spellOut() {
    if (currentWordIndex < words[currentIndex].length) {
        output.innerHTML += words[currentIndex][currentWordIndex];
        currentWordIndex++;
        if (isElementInViewport(output)) {
            clickSound.currentTime = 0; // Reset the sound to start from the beginning
            clickSound.play(); // Play the clicking sound
        }
        setTimeout(spellOut, 140); // Adjust the timing here (50 milliseconds)
    } else {
        currentWordIndex = 0;
        output.innerHTML = "I am ";
        currentIndex = (currentIndex + 1) % words.length;
        setTimeout(spellOut, 500); // Delay before starting the next word (500 milliseconds)
    }
}

function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

window.addEventListener("scroll", function () {
    if (!isElementInViewport(output)) {
        clickSound.pause(); // Pause the clicking sound if the header is not in view
    }
});

document.addEventListener("DOMContentLoaded", function () {
    clickSound.play(); // Play the clicking sound when the page is loaded
});

displayIAm();











document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    menuToggle.addEventListener('click', function () {
        navList.classList.toggle('active');
    });

    document.addEventListener('click', function (event) {
        if (!menuToggle.contains(event.target) && !navList.contains(event.target)) {
            navList.classList.remove('active');
        }
    });
});
