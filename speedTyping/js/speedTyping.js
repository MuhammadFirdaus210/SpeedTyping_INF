// Shorthand for querySelectors
const select = e => document.querySelector(e);
const selectAll = e => document.querySelectorAll(e);

// DOM elements 
const input = select('#textInput');
const output = select('#textOutput');
const inputFull = select('#textFull');
// Counters
const _timer = select('#timer');
const _wpm = select('#wpm');
const _cpm = select('#cpm');
const _errors = select('#errors');
const _accuracy = select('#accuracy');
const _totalWords = select('#totalWords');
const _writtenWords = select('#writtenWords');
const _lastWPM = select('#lastWPM'); // Updated to match the new ID
// Modal
const modal = select('#ModalCenter');
const modalBody = select('.modal-body');
const modalClose = selectAll('.modal-close');
const modalReload = select('#modalReload');
// Control btns
const btnPlay = select('#btnPlay');
const btnRefresh = select('#btnRefresh');
// Key sound 
const soundOn = select('.icon-sound-on');
const soundOff = select('.icon-sound-off');
const keyClick = select('#keyClick');
const keyBeep = select('#keyBeep');

let sound = true;
let currentLanguage = 'en';
let allQuotes = [];

// Function to change language
function changeLanguage(lang) {
    currentLanguage = lang;
    loadQuotes();
}

// Function to load quotes
function loadQuotes() {
    fetch('js/quotes.json')
        .then(response => response.json())
        .then(data => {
            allQuotes = data[currentLanguage];
        })
        .catch(error => console.error('Error:', error));
}

// Add event listener for language change
document.getElementById('languageSelect').addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

// Initial load
loadQuotes();

// Function to return random key from an array
const random = array => array[Math.floor(Math.random() * array.length)];

// speedTyping Class
class speedTyping {
    constructor() {
        this.index = 0;        // Main index
        this.words = 0;        // Completed words index
        this.errorIndex = 0;        // Errors index
        this.correctIndex = 0;        // Correct index
        this.accuracyIndex = 0;        // Accuracy counter
        this.cpm = 0;        // CPM counter
        this.wpm = 0;        // WPM cpm / 5 
        this.interval = null;     // interval counter
        this.duration = 60;       // Test duration time (60 seconds)
        this.typing = false;    // To check if we are typing
        this.quote = '';       // Current quote
        this.author = '';       // Current author
        this.remainingTime = this.duration;
        this.lastWPM = parseInt(localStorage.getItem('WPM')) || 0; // Last WPM
        this.startTime = null; // Start time of the test
    }

    timer() {
        if (typeof this.interval !== 'number') {
            this.startTime = Date.now();
            const end = this.startTime + 1000 * this.duration;
            _timer.innerHTML = `${this.duration}<span class="small">s</span>`;
            this.interval = setInterval(() => {
                const remaining = Math.round((end - Date.now()) / 1000);
                this.remainingTime = remaining;
                _timer.innerHTML = `${remaining}<span class="small">s</span>`;
                if (remaining <= 0) {
                    this.stop();
                    this.finish();
                }
            }, 1000);
        }
    }

    start() {
        const difficultySelect = document.getElementById('difficultySelect');
        const selectedLevel = difficultySelect.value;

        // Filter out quotes based on the selected difficulty level
        const filteredQuotes = allQuotes.filter(item => item.level === selectedLevel);
        if (filteredQuotes.length === 0) {
            alert('No quotes available for the selected difficulty level.');
            return;
        }

        // Get Authors / Quotes only
        const getQuote = filteredQuotes.map(item => item.quote);
        const getAuthor = filteredQuotes.map(item => item.author);

        // Get random author quotes
        this.author = random(getAuthor);
        // Get random quotes
        this.quote = random(getQuote);

        // Count how many words in a single quote by splitting the array by whitespaces
        const quoteWords = this.quote.split(' ').filter(i => i).length;
        // Display total words counter
        _totalWords.textContent = quoteWords;

        // Set the timer
        this.timer();
        // Set active class to Play btn
        btnPlay.classList.add('active');
        // Enable the typing area
        input.setAttribute('tabindex', '0');
        input.removeAttribute('disabled');
        // Add set focus and Active class
        input.focus();
        input.classList.add('active');

        // Check if we start typing
        if (!this.typing) {
            this.typing = true;

            // Display the quotes in the input div
            input.textContent = this.quote;

            // Start the event listener
            input.addEventListener('keypress', this.handleKeyPress.bind(this));
        }
    }

    handleKeyPress(event) {
        // Prevent the default action
        event.preventDefault();
        // Just in case
        event = event || window.event;
        // Get the pressed key code
        const charCode = event.which || event.keyCode;
        // Read it as a normal key
        const charTyped = String.fromCharCode(charCode);

        // Compare the pressed key to the quote letter
        if (charTyped === this.quote.charAt(this.index)) {
            // Detect the spaces by white space " "  or key code is (32) - Double check maybe not necessarily
            if (charTyped === " " && charCode === 32) {
                this.words++;
                // Display the written words
                _writtenWords.textContent = this.words;
            }
            // Increment the keys index
            this.index++;

            // Hold current quote
            const currentQuote = this.quote.substring(this.index, this.quote.length);

            // Update the input div value when typing
            input.textContent = currentQuote;
            output.innerHTML += charTyped;
            // Increment the correct keys
            this.correctIndex++;
            // If index = the quote length, that means the text is done, call the finish() method
            if (this.index === this.quote.length) {
                this.words++; // Increment words for the last word
                _writtenWords.textContent = this.words; // Update written words
                this.stop();
                this.finish();
                return;
            }
            // Play typing sound if enabled
            if (sound) {
                keyClick.currentTime = 0;
                keyClick.play();
            }
        } else {
            // Add the errors into the output div
            output.innerHTML += `<span class="text-danger">${charTyped}</span>`;
            // Increment the wrong keys counter
            this.errorIndex++;
            // Add accuracy error counter to the dom
            _errors.textContent = this.errorIndex;
            // Play typing sound if enabled
            if (sound) {
                keyBeep.currentTime = 0;
                keyBeep.play();
            }
        }
        // CPM counter
        this.cpm = Math.floor((this.correctIndex + this.errorIndex) / (this.duration - this.remainingTime) * 60);
        // Add to the dom
        _cpm.textContent = this.cpm;
        // WPM: (correct chars / total time * 60 / 5)
        this.wpm = Math.round(this.cpm / 5);
        _wpm.textContent = this.wpm;
        // Accuracy: (Correct chars * 100 / total index)
        this.accuracyIndex = Math.round((this.correctIndex * 100) / (this.correctIndex + this.errorIndex));
        // Add accuracy to the dom. We need to check it because division by 0 gives us special values (infinity, NaN)
        if (this.accuracyIndex > 0 && Number.isInteger(this.accuracyIndex)) 
            _accuracy.innerHTML = `${this.accuracyIndex}<span class="small">%</span>`;
    }

    stop() {
        clearInterval(this.interval);
        this.interval = null;
        this.typing = false;
        _timer.textContent = '0';
        btnPlay.classList.remove('active');
        input.setAttribute('disabled', 'true');
        btnRefresh.classList.add('active');
        inputFull.classList.remove('d-none');
        inputFull.innerHTML = `&#8220;${this.quote}&#8221; <span class="d-block small text-muted text-right pr-3">&ndash; ${this.author}</span></div>`;

        // Calculate the time taken
        const timeTaken = this.duration - this.remainingTime;
        
        // Add timer information to the output
        output.innerHTML += `<br><br><strong>Time taken:</strong> ${timeTaken} seconds`;
        output.innerHTML += `<br><strong>Remaining Time:</strong> ${this.remainingTime} seconds`;

        // Calculate total words typed and remaining words
        const totalWordsTyped = this.words; // No need to add 1 here
        const remainingWords = Math.max(0, this.quote.split(' ').filter(i => i).length - totalWordsTyped);

        // Add words information to the output
        output.innerHTML += `<br><strong>Total Words Typed:</strong> ${totalWordsTyped}`;
        output.innerHTML += `<br><strong>Remaining Words:</strong> ${remainingWords}`;
    }

    finish() {
        // Show the modal
        modal.style.display = 'block';
        const wpm = this.wpm;
        const timeTaken = this.duration - this.remainingTime;
        let result = '';
        const message = `Your typing speed is <strong>${wpm}</strong> WPM which equals <strong>${this.cpm}</strong> CPM. You've made <strong>${this.errorIndex}</strong> mistakes with <strong>${this.accuracyIndex}%</strong> total accuracy.`;

        if (this.remainingTime <= 0) {
            result = `
                <div class="modal-icon my-3"><img src="img/time-up.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">Time's Up!</h4>
                    <p class="lead pt-2">You ran out of time. ${message}</p>
                </div>`;
        } else if (wpm > 5 && wpm < 20) {
            result = `
                <div class="modal-icon my-3"><img src="img/sleeping.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">Sheeessh!</h4>
                    <p class="lead pt-2">${message} You should do more practice!</p>
                </div>`;
        } else if (wpm > 20 && wpm < 40) {
            result = `
                <div class="modal-icon my-3"><img src="img/thinking.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">About Average!</h4>
                    <p class="lead pt-2">${message} You can do better!</p>
                </div>`;
        } else if (wpm > 40 && wpm < 60) {
            result = `
                <div class="modal-icon my-3"><img src="img/surprised.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">Great Job!</h4>
                    <p class="lead pt-2">${message} You're doing great!</p>
                </div>`;
        } else if (wpm > 60) {
            result = `
                <div class="modal-icon my-3"><img src="img/shocked.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">Insane!</h4>
                    <p class="lead pt-2">${message} You're are Awesome!</p>
                </div>`;
        } else {
            result = `
                <div class="modal-icon my-3"><img src="img/smart.svg" class="media-object"></div>
                <div class="media-body p-2">
                    <h4 class="media-heading">Hmmm!</h4>
                    <p class="lead pt-2">Please stop playing around and start typing!</p>
                </div>`;
        }

        // Calculate total words typed and remaining words
        const totalWordsTyped = this.words; // No need to add 1 here
        const remainingWords = Math.max(0, this.quote.split(' ').filter(i => i).length - totalWordsTyped);

        // Add additional information
        result += `
            <div class="mt-3">
                <p><strong>Total Words:</strong> ${_totalWords.textContent}</p>
                <p><strong>Written Words:</strong> ${totalWordsTyped}</p>
                <p><strong>Errors:</strong> ${this.errorIndex}</p>
                <p><strong>Accuracy:</strong> ${this.accuracyIndex}%</p>
                <p><strong>Time Taken:</strong> ${timeTaken} seconds</p>
                <p><strong>Remaining Time:</strong> ${this.remainingTime} seconds</p>
                <p><strong>CPM:</strong> ${this.cpm}</p>
                <p><strong>WPM:</strong> ${this.wpm}</p>
            </div>`;

        // Update the DOM
        modalBody.innerHTML = result;
        // Target all modal close buttons
        modalClose.forEach(btn => btn.addEventListener('click', () => modal.style.display = 'none'));
        // Also close the modal when user clicks outside
        window.addEventListener('click', e => e.target === modal ? modal.style.display = 'none' : '');
        // Repeat the test btn
        modalReload.addEventListener('click', () => {
            this.lastWPM = this.wpm; // Update Last WPM before reloading
            localStorage.setItem('WPM', this.wpm);
            location.reload();
        });

        // Update Last WPM in the DOM
        _lastWPM.textContent = this.wpm;
    }
}

// Init the class
const typingTest = new speedTyping();

// Start the test when Start btn clicked
btnPlay.addEventListener('click', () => typingTest.start());
// Reload the page when Refresh btn is clicked
btnRefresh.addEventListener('click', () => {
    localStorage.setItem('WPM', 0); // Reset Last WPM to 0
    location.reload();
});

// Display the saved Last WPM on page load
_lastWPM.textContent = typingTest.lastWPM;

// Add event listeners for sound control
soundOn.addEventListener('click', () => {
    sound = false;
    soundOn.classList.add('d-none');
    soundOff.classList.remove('d-none');
});

soundOff.addEventListener('click', () => {
    sound = true;
    soundOff.classList.add('d-none');
    soundOn.classList.remove('d-none');
});