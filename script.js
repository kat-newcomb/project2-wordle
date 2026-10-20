// Get the answer randomly from a “dictionary” (array) of 5 letter words that you create (you
// must have at least 30 words)
const WORDS = [
    "APPLE", "MAPLE", "CIDER", "ACORN", "GOURD", "STRAW", "SCARF", "BOOTS", "AMBER", "BROWN",
    "OCHRE", "EMBER", "SMOKE", "WOODS", "CROWS", "WHEAT", "CROPS", "SPICE", "RAKES", "CHILL",
    "QUILT", "PLAID", "FIELD", "TOAST", "CANDY", "STORM", "CLOUD", "FROST", "NIGHT", "CRISP",
    "GLOOM", "SHAWL", "ROOTS", "YIELD", "BALES", "TARTS", "SPOOK", "GHOST", "WITCH", "PATCH",
    "STALK", "HUSKS", "TWEED", "HONEY"
];
const KEY_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DEL"]
];

const STATUS_RANK = { absent:1, present:2, correct:3 };
const WIN_MSG = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];
const WORD_API = "https://api.datamuse.com/words?max=1&sp=";

// the user gets 6 tries to guess a 5 letter word. Each guess must be a 5 letter word.
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const REVEAL_DELAY = 300;
const API_WAIT = 4000;

// A JavaScript class
function WordleGame(answer)
{
    this.answer = answer;
    this.guesses = [];
    this.won = false;

    this.score = function(guess)
    {
        var answerLetters = this.answer.split('');
        var guessLetters = guess.split('');
        var result = [];
        var unused = [];

        for (var i = 0; i < WORD_LENGTH; i++)
            result.push("absent");

        // .map or .forEach
        answerLetters.forEach((letter, i) => {
            if (guessLetters[i] == letter)
                result[i] = "correct";
            else if (unused[letter])
                unused[letter]++;
            else
                unused[letter] = 1;
        });

        // Note: If a letter appears twice in the guess but only once in the answer, you must eliminate all
        // possible yellow/green responses from with one of the letters and then consider the second letter.
        guessLetters.forEach((letter, i) => {
            if (result[i] != "correct" && unused[letter] > 0)
            {
                result[i] = "present";
                unused[letter]--;
            }
        });

        return result;
    };

    this.submit = function(guess)
    {
        var result = this.score(guess);
        var greens = 0;

        result.forEach(status => { if (status == "correct") greens++; });
        this.guesses.push(guess);
        this.won = (greens == WORD_LENGTH);
        return result;
    };

    this.attempts = () => this.guesses.length;
    this.isOver = () => this.won || this.guesses.length >= MAX_GUESSES;
}

// Optional extra credit (5 points):
// Display the average guesses needed for the user on that device over multiple browser sessions
// (hint- use a cookie)
function GameStats()
{
    this.played = readCookie("played");
    this.wins = readCookie("wins");
    this.totalGuesses = readCookie("totalGuesses");
    this.record = function(won, guesses)
    {
        this.played++;
        if (won)
        {
            this.wins++;
            this.totalGuesses += guesses;
        }
        saveCookie("played", this.played);
        saveCookie("wins", this.wins);
        saveCookie("totalGuesses", this.totalGuesses);
    };

    this.average = () => {
        var avg;
        if (this.wins == 0)
            avg = "-";
        else
            avg = Math.floor(this.totalGuesses / this.wins * 10 + 0.5) / 10;
        return avg;
    };
    this.winRate = () => {
        var rate;
        if (this.played == 0)
            rate = 0;
        else
            rate = Math.floor(this.wins / this.played * 100 + 0.5);
        return rate;
    };
}

function saveCookie(name, value)
{
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    var expireTime = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + "; " + expireTime;
}

function readCookie(name)
{
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++)
    {
        var pos = cookies[i].indexOf("=");
        if (cookies[i].substring(0, pos) == name)
        {
            var n = parseInt(cookies[i].substring(pos + 1));
            if (n)
                return n;
            else
                return 0;
        }
    }
    return 0;
}

// a. Create a function to do one word and then loop to call it six times.
// b. Use a <div> for each of the cells
// c. You may add the div’s with document.write
// d. Add a class to the <div> to be able to style each letter.  Add a second class to identify
// the position of the letter.  Elements can have two or more classes separated by a space
function drawRow(row)
{
    document.write("<div class='row'>");
    for (var col = 0; col < WORD_LENGTH; col++)
        document.write("<div class='tile pos" + col + "' id='tile" + row + col + "'></div>");
    document.write("</div>");
}

function drawBoard()
{
    for (var row = 0; row < MAX_GUESSES; row++)
        drawRow(row);
}

// Display a used letter board indicating letters used.  The used letter board must
// include a visual indicator of whether the used letter was correct/in the wrong place/ or not in the word.
function drawKeyboard()
{
    KEY_ROWS.forEach(keys => {
        document.write("<div class='key-row'>");
        keys.forEach(key => {
            var classes;
            if (key.length > 1)
                classes = "key wide";
            else
                classes = "key";
            document.write("<button type='button' class='" + classes + "' id='key" + key +
                           "' onclick=\"pressKey('" + key + "')\">" + key + "</button>");
        });
        document.write("</div>");
    });
}

var game;
var stats;
var busy = false;
var lastAnswer = "";
var keyStatus = [];

// An arrow function
const getTile = (row, col) => document.getElementById("tile" + row + col);
const setStatus = (text) => document.getElementById("status").innerHTML = text;

function startGame()
{
    var answer;
    do {
        answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    } while (answer == lastAnswer);
    lastAnswer = answer;
    game = new WordleGame(answer);

    // Display the answer for each game in the console (to assist with debugging)
    console.log("Answer: " + answer);
    for (var row = 0; row < MAX_GUESSES; row++)
    {
        for (var col = 0; col < WORD_LENGTH; col++)
        {
            getTile(row, col).innerHTML = "";
            getTile(row, col).className = "tile pos" + col;
        }
    }

    for (var letter in keyStatus)
        document.getElementById("key" + letter).classList.remove(keyStatus[letter]);
    keyStatus = [];
    document.getElementById("guess").value = "";

    // Include a button that will restart the game when clicked.
    // Hide the button until the game is won or lost.
    document.getElementById("restartBtn").classList.add("hidden");
    closeModal();
    clearError();
    busy = false;
    setInputEnabled(true);
    setStatus("Guess 1 of " + MAX_GUESSES);
    document.getElementById("guess").focus();
}

function setInputEnabled(enabled)
{
    document.getElementById("guess").disabled = !enabled;
    document.getElementById("guessBtn").disabled = !enabled;
}

function showPreview()
{
    if (game.isOver())
        return;

    var text = document.getElementById("guess").value.toUpperCase();
    var row = game.attempts();

    for (var col = 0; col < WORD_LENGTH; col++)
    {
        var tile = getTile(row, col);
        if (col < text.length)
        {
            tile.innerHTML = text.charAt(col);
            tile.classList.add("filled");
        }
        else
        {
            tile.innerHTML = "";
            tile.classList.remove("filled");
        }
    }
    clearError();
}

function pressKey(key)
{
    var input = document.getElementById("guess");

    if (busy || game.isOver())
        return;
    if (key == "ENTER")
    {
        submitGuess();
        return;
    }

    if (key == "DEL")
        input.value = input.value.substring(0, input.value.length - 1);
    else if (input.value.length < WORD_LENGTH)
        input.value += key;

    showPreview();
}

function showError(message)
{
    var input = document.getElementById("guess");
    var row = document.getElementsByClassName("row")[game.attempts()];

    document.getElementById("error").innerHTML = message;
    input.focus();
    input.select();
    row.classList.add("shake");
    setTimeout(() => row.classList.remove("shake"), 400);
}

function clearError()
{
    document.getElementById("error").innerHTML = "";
}

// Get the guess from the user using an input text field and a button.
// Note: this is different from the online version.
function submitGuess()
{
    var guess = document.getElementById("guess").value.toUpperCase();
    //Each guess must be a 5 letter word.
    var fiveLetters = new RegExp("^[A-Z]{5}$");

    if (busy || game.isOver())
        return false;

    if (!fiveLetters.test(guess))
    {
        showError("Your guess must be exactly 5 letters. Please try again.");
        return false;
    }

    busy = true;
    if (WORDS.indexOf(guess) != -1)
        acceptGuess(guess);
    else
        checkWithApi(guess);

    return false;
}

// Optional extra credit: Add an API (10 points)
// Incorporate an API – you only need to do ONE of the following:
// Use an API to check if a 5 letter guess word is a valid word
// Note: Find a free API. You may need to try more than one to get it to work as you want.
function checkWithApi(guess)
{
    var answered = false;

    if (!window.$)
    {
        acceptGuess(guess);
        return;
    }

    setStatus("Checking the dictionary...");
    $.get(WORD_API + guess.toLowerCase(), function(data)
    {
        if (answered)
            return;
        answered = true;

        if (data.length > 0 && data[0].word.toUpperCase() == guess)
            acceptGuess(guess);
        else
        {
            busy = false;
            setStatus("Guess " + (game.attempts() + 1) + " of " + MAX_GUESSES);
            showError(guess + " is not in the dictionary. Try a different word.");
        }
    });

    setTimeout(() => {
        if (answered)
            return;
        answered = true;
        console.log("Dictionary API did not respond, accepting " + guess);
        acceptGuess(guess);
    }, API_WAIT);
}

function acceptGuess(guess)
{
    var row = game.attempts();
    var result = game.submit(guess);
    var letters = guess.split('');

    document.getElementById("guess").value = "";
    setInputEnabled(false);
    setStatus("");
    clearError();

    // After each guess report the following to the user using a visual cue such as
    // changing the background to indicate the status of each letter.
    // Letters that are in the correct place. (usually green)
    // Letters that are in the word but are in the wrong position.  (usually yellow)
    letters.forEach((letter, col) => {
        setTimeout(() => {
            var tile = getTile(row, col);
            tile.innerHTML = letter;
            tile.classList.remove("filled");
            tile.classList.add(result[col]);
        }, col * REVEAL_DELAY);
    });

    setTimeout(() => {
        updateKeyboard(letters, result);
        busy = false;

        if (game.isOver())
            endGame();
        else
        {
            setInputEnabled(true);
            setStatus("Guess " + (game.attempts() + 1) + " of " + MAX_GUESSES);
            document.getElementById("guess").focus();
        }
    }, WORD_LENGTH * REVEAL_DELAY);
}

// Display a used letter board indicating letters used.  The used letter board must
// include a visual indicator of whether the used letter was correct/in the wrong place/ or not in the word.
function updateKeyboard(letters, result)
{
    letters.forEach((letter, i) => {
        var key = document.getElementById("key" + letter);
        var current = keyStatus[letter];

        if (!current || STATUS_RANK[result[i]] > STATUS_RANK[current])
        {
            if (current)
                key.classList.remove(current);
            key.classList.add(result[i]);
            keyStatus[letter] = result[i];
        }
    });
}

function endGame()
{
    var tries = game.attempts();
    setInputEnabled(false);
    stats.record(game.won, tries);
    showStats();

    // Include a button that will restart the game when clicked.
    // Hide the button until the game is won or lost.
    document.getElementById("restartBtn").classList.remove("hidden");

    if (game.won)
    {
        var guessWord;
        if (tries == 1)
            guessWord = " guess.";
        else
            guessWord = " guesses.";

        setStatus("Solved in " + tries + "/" + MAX_GUESSES);
        openModal(WIN_MSG[tries - 1],
                  "You got it in " + tries + guessWord,
                  game.answer, "correct");
    }
    else
    {
        // If the user uses up all 6 guesses without guessing the word, show the answer
        // word in a popup (and show the button to restart the game).
        setStatus("Out of guesses");
        openModal("Out of guesses", "The word was:", game.answer, "absent");
    }
}

function openModal(title, message, word, color)
{
    var letters = word.split('');
    var html = "";

    letters.forEach(letter => {
        html += "<span class='mini " + color + "'>" + letter + "</span>";
    });

    document.getElementById("modalTitle").innerHTML = title;
    document.getElementById("modalMsg").innerHTML = message;
    document.getElementById("modalWord").innerHTML = html;
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal()
{
    document.getElementById("modal").classList.add("hidden");
}

function showStats()
{
    document.getElementById("avgGuesses").innerHTML = stats.average();
    document.getElementById("statPlayed").innerHTML = stats.played;
    document.getElementById("statWinRate").innerHTML = stats.winRate();
    document.getElementById("statAvg").innerHTML = stats.average();
}

// An event handler
window.onload = function()
{
    stats = new GameStats();
    document.getElementById("restartBtn").onclick = startGame;
    document.getElementById("modalPlayAgain").onclick = startGame;
    document.getElementById("modalClose").onclick = closeModal;
    document.getElementById("guess").addEventListener("keyup", showPreview);

    showStats();
    startGame();
};
