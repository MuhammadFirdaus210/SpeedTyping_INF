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
const _lastWPM = select('#lastWPM');
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
let currentLanguage = '';
let allQuotes = [];

// Function to change language
function changeLanguage(lang) {
    if (lang === '') {
        // Reset to default state when "Select..." is chosen
        currentLanguage = '';
        allQuotes = [];
        input.textContent = '';
        output.textContent = '';
        return;
    }
    currentLanguage = lang;
    loadQuotes();
}

// Function to load quotes
function loadQuotes() {
    if (!currentLanguage) return; // Don't load quotes if no language is selected

    fetch('js/quotes.json')
        .then(response => response.json())
        .then(data => {
            allQuotes = data[currentLanguage];
            console.log(`Quotes loaded for language: ${currentLanguage}`, allQuotes);
        })
        .catch(error => console.error('Error:', error));
}

// Add event listener for language change
document.getElementById('languageSelect').addEventListener('change', (e) => {
    changeLanguage(e.target.value);
});

// Add event listener for difficulty change
document.getElementById('difficultySelect').addEventListener('change', (e) => {
    if (e.target.value === '') {
        // Reset to default state when "Select..." is chosen
        input.textContent = '';
        output.textContent = '';
    }
});

// Function to return random key from an array
const random = array => array[Math.floor(Math.random() * array.length)];

// speedTyping Class
class SpeedTyping {
    constructor() {
        this.index = 0;
        this.words = 0;
        this.errorIndex = 0;
        this.correctIndex = 0;
        this.accuracyIndex = 0;
        this.cpm = 0;
        this.wpm = 0;
        this.interval = null;
        this.duration = 60;
        this.typing = false;
        this.quote = '';
        this.author = '';
        this.remainingTime = this.duration;
        this.lastWPM = parseInt(localStorage.getItem('WPM')) || 0;
        this.startTime = null;
        this.currentWordStartIndex = 0; // Track the start index of the current word
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
        const languageSelect = document.getElementById('languageSelect');
        const difficultySelect = document.getElementById('difficultySelect');

        if (languageSelect.value === '' || difficultySelect.value === '') {
            alert('Please select both a language and a difficulty level.');
            return;
        }

        const selectedLevel = difficultySelect.value;
        console.log(`Selected level: ${selectedLevel}`);

        const filteredQuotes = allQuotes.filter(item => item.level.toLowerCase() === selectedLevel.toLowerCase());
        console.log(`Filtered quotes:`, filteredQuotes);

        if (filteredQuotes.length === 0) {
            alert('No quotes available for the selected difficulty level.');
            return;
        }

        this.author = this.getRandomItem(filteredQuotes.map(item => item.author));
        this.quote = this.getRandomItem(filteredQuotes.map(item => item.quote));

        const quoteWords = this.quote.split(' ').filter(Boolean).length;
        _totalWords.textContent = quoteWords;

        this.timer();
        btnPlay.classList.add('active');
        input.setAttribute('tabindex', '0');
        input.removeAttribute('disabled');
        input.focus();
        input.classList.add('active');

        if (!this.typing) {
            this.typing = true;
            input.textContent = this.quote;
            input.addEventListener('keypress', this.handleKeyPress.bind(this));
            input.addEventListener('keydown', this.handleKeyDown.bind(this)); // Add keydown event listener for backspace
        }
    }

    handleKeyPress(event) {
        event.preventDefault();
        const charCode = event.which || event.keyCode;
        const charTyped = String.fromCharCode(charCode);

        if (charCode === 32) { // Spacebar pressed
            if (this.index > this.currentWordStartIndex) { // Ensure at least one character is typed
                this.completeCurrentWord();
                this.moveToNextWord();
            }
            return;
        }

        if (charTyped === this.quote.charAt(this.index)) {
            this.index++;
            this.correctIndex++;
            output.innerHTML += charTyped;
        } else {
            output.innerHTML += `<span class="text-danger">${charTyped}</span>`;
            this.errorIndex++;
            _errors.textContent = this.errorIndex; // Update errors count
        }

        this.updateInput();
        this.updateStats();

        if (sound) {
            this.playSound(charTyped === this.quote.charAt(this.index - 1) ? keyClick : keyBeep);
        }

        if (this.index === this.quote.length) {
            this.words++;
            _writtenWords.textContent = this.words;
            this.stop();
            this.finish();
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Backspace' && this.index > this.currentWordStartIndex) {
            event.preventDefault();
            this.index--;
            const lastChar = output.innerHTML.slice(-1);
            output.innerHTML = output.innerHTML.slice(0, -1);
            if (lastChar.includes('text-danger')) {
                this.errorIndex--;
                _errors.textContent = this.errorIndex; // Update errors count
            } else {
                this.correctIndex--;
            }
            this.updateInput();
            this.updateStats();
        }
    }

    completeCurrentWord() {
        const currentWordEnd = this.quote.indexOf(' ', this.index);
        const currentWord = this.quote.substring(this.index, currentWordEnd === -1 ? this.quote.length : currentWordEnd);
        const remainingChars = currentWord.length;

        for (let i = 0; i < remainingChars; i++) {
            output.innerHTML += `<span class="text-danger">${this.quote.charAt(this.index)}</span>`;
            this.errorIndex++;
            this.index++;
        }
        _errors.textContent = this.errorIndex; // Update errors count
    }

    moveToNextWord() {
        const nextSpaceIndex = this.quote.indexOf(' ', this.index);
        if (nextSpaceIndex !== -1) {
            this.index = nextSpaceIndex + 1;
            output.innerHTML += ' '; // Add space to the output
        } else {
            this.index = this.quote.length;
        }
        this.words++;
        _writtenWords.textContent = this.words;
        this.currentWordStartIndex = this.index; // Update the start index of the next word
        this.updateInput();
    }

    updateInput() {
        const currentQuote = this.quote.substring(this.index);
        input.textContent = currentQuote;
    }

    updateStats() {
        const elapsedTime = (Date.now() - this.startTime) / 60000;

        this.cpm = Math.floor((this.correctIndex + this.errorIndex) / elapsedTime);
        _cpm.textContent = this.cpm;

        this.wpm = Math.round((this.correctIndex / 5) / elapsedTime);
        _wpm.textContent = this.wpm;

        this.accuracyIndex = Math.round((this.correctIndex * 100) / (this.correctIndex + this.errorIndex));
        if (this.accuracyIndex > 0 && Number.isFinite(this.accuracyIndex)) {
            _accuracy.innerHTML = `${this.accuracyIndex}<span class="small">%</span>`;
        }
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
        inputFull.innerHTML = `&#8220;${this.quote}&#8221; <span class="d-block small text-muted text-right pr-3">&ndash; ${this.author}</span>`;

        const timeTaken = this.duration - this.remainingTime;
        const totalWordsTyped = this.words;
        const remainingWords = Math.max(0, this.quote.split(' ').filter(Boolean).length - totalWordsTyped);

        output.innerHTML += `
            <br><br><strong>Time taken:</strong> ${timeTaken} seconds
            <br><strong>Remaining Time:</strong> ${this.remainingTime} seconds
            <br><strong>Total Words Typed:</strong> ${totalWordsTyped}
            <br><strong>Remaining Words:</strong> ${remainingWords}
        `;
    }

    finish() {
        modal.style.display = 'block';
        const message = `Your typing speed is <strong>${this.wpm}</strong> WPM which equals <strong>${this.cpm}</strong> CPM. You've made <strong>${this.errorIndex}</strong> mistakes with <strong>${this.accuracyIndex}%</strong> total accuracy.`;
        const timeTaken = this.duration - this.remainingTime;

        let result = this.getResultMessage(message);

        result += this.getAdditionalInfo(timeTaken);

        modalBody.innerHTML = result;
        this.setupModalListeners();
        this.updateLastWPM();
    }

    getResultMessage(message) {
        if (this.remainingTime <= 0) {
            return this.getMessageTemplate("Time's Up!", "timeout.jpg", `You ran out of time. ${message}`);
        } else if (this.wpm > 5 && this.wpm < 20) {
            return this.getMessageTemplate("Sheeessh!", "sleeping.svg", `${message} You should do more practice!`);
        } else if (this.wpm >= 20 && this.wpm < 40) {
            return this.getMessageTemplate("About Average!", "thinking.svg", `${message} You can do better!`);
        } else if (this.wpm >= 40 && this.wpm < 60) {
            return this.getMessageTemplate("Great Job!", "surprised.svg", `${message} You're doing great!`);
        } else if (this.wpm >= 60) {
            return this.getMessageTemplate("Insane!", "shocked.svg", `${message} You're are Awesome!`);
        } else {
            return this.getMessageTemplate("Hmmm!", "smart.svg", "Please stop playing around and start typing!");
        }
    }

    getMessageTemplate(heading, imageSrc, content) {
        return `
            <div class="modal-icon my-3"><img src="img/${imageSrc}" class="media-object"></div>
            <div class="media-body p-2">
                <h4 class="media-heading">${heading}</h4>
                <p class="lead pt-2">${content}</p>
            </div>`;
    }

    getAdditionalInfo(timeTaken) {
        const totalWordsTyped = this.words;
        const remainingWords = Math.max(0, this.quote.split(' ').filter(Boolean).length - totalWordsTyped);

        return `
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
    }

    setupModalListeners() {
        modalClose.forEach(btn => btn.addEventListener('click', () => modal.style.display = 'none'));
        window.addEventListener('click', e => e.target === modal ? modal.style.display = 'none' : '');
        modalReload.addEventListener('click', () => {
            this.updateLastWPM();
            location.reload();
        });
    }

    updateLastWPM() {
        this.lastWPM = this.wpm;
        localStorage.setItem('WPM', this.wpm);
        _lastWPM.textContent = this.wpm;
    }

    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    playSound(audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
    }
}

// Init the class
const typingTest = new SpeedTyping();

// Event Listeners
btnPlay.addEventListener('click', () => typingTest.start());
btnRefresh.addEventListener('click', () => {
    localStorage.setItem('WPM', 0);
    location.reload();
});

// Display the saved Last WPM on page load
_lastWPM.textContent = typingTest.lastWPM;

// Sound control
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

// Function to reset dropdowns on page load
function resetDropdowns() {
    document.getElementById('languageSelect').value = '';
    document.getElementById('difficultySelect').value = '';
}

// Call resetDropdowns when the page loads
window.addEventListener('load', resetDropdowns);
