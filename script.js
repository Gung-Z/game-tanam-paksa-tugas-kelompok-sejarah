import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9_YkrVStYnx77UU8Jg3zqEj-n0hJJE3A",
    authDomain: "gametugassejarahkelompok2.firebaseapp.com",
    projectId: "gametugassejarahkelompok2",
    storageBucket: "gametugassejarahkelompok2.firebasestorage.app",
    messagingSenderId: "1044879828390",
    appId: "1:1044879828390:web:cb934e9dd9d3eca842db67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data dan Elemen Game
const wordsList = [
    "Johannes van den Bosch", "Seperlima", "Padi", "Gagal",
    "Eduard Douwes Dekker", "Liberal", "Undang-Undang Agraria",
    "Tanam Paksa", "Perang", "Komoditas Ekspor", "Nila",
    "Cultuurprocenten", "Kelaparan", "Max Havelaar",
    "H.W. Daendels", "Seperempat", "Politik Etis"
];

const wordBank = document.getElementById('word-bank');
const dropzones = document.querySelectorAll('.dropzone');
const btnCheck = document.getElementById('btn-check');
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer');

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const inputName = document.getElementById('player-name');
const btnStartGame = document.getElementById('btn-start-game');

let selectedWordElement = null;
const totalTime = 7 * 60; // 7 menit
let timeRemaining = totalTime;
let timerInterval;
let isGameOver = false;
let currentPlayerName = "";

// Event listener untuk tombol mulai
btnStartGame.addEventListener('click', () => {
    const nameValue = inputName.value.trim();
    if (nameValue === "") {
        alert("Harap masukkan nama kamu terlebih dahulu!");
        return;
    }
    currentPlayerName = nameValue;
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    initGame();
});

// Event listener enter keyboard
inputName.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        btnStartGame.click();
    }
});

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

function initGame() {
    isGameOver = false;
    selectedWordElement = null;
    timeRemaining = totalTime;
    scoreDisplay.innerHTML = "";
    btnCheck.disabled = false;
    btnCheck.textContent = "Selesai & Kumpulkan";

    wordBank.innerHTML = '';
    shuffle(wordsList);
    
    wordsList.forEach(word => {
        const span = document.createElement('span');
        span.classList.add('word');
        span.textContent = word;
        span.dataset.word = word;
        span.addEventListener('click', () => selectWord(span));
        wordBank.appendChild(span);
    });

    dropzones.forEach(zone => {
        zone.textContent = "";
        zone.classList.remove('correct', 'wrong');
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            checkAnswers();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent =
        (minutes < 10 ? "0" : "") + minutes + ":" +
        (seconds < 10 ? "0" : "") + seconds;
}

function selectWord(element) {
    if (isGameOver) return;
    document.querySelectorAll('.word').forEach(el => el.classList.remove('selected'));
    if (selectedWordElement === element) {
        selectedWordElement = null;
    } else {
        selectedWordElement = element;
        element.classList.add('selected');
    }
}

dropzones.forEach(zone => {
    zone.addEventListener('click', () => {
        if (isGameOver) return;
        const currentText = zone.textContent;
        if (selectedWordElement) {
            if (currentText) returnWordToBank(currentText);
            const wordToPlace = selectedWordElement.dataset.word;
            zone.textContent = wordToPlace;
            selectedWordElement.classList.add('hidden');
            selectedWordElement.classList.remove('selected');
            selectedWordElement = null;
        } else if (currentText) {
            returnWordToBank(currentText);
            zone.textContent = "";
        }
    });
});

function returnWordToBank(word) {
    const bankWords = document.querySelectorAll('.word');
    bankWords.forEach(el => {
        if (el.dataset.word === word) el.classList.remove('hidden');
    });
}

async function checkAnswers() {
    if (isGameOver) return;
    isGameOver = true;
    clearInterval(timerInterval);
    
    btnCheck.textContent = "Menyimpan Skor...";
    btnCheck.disabled = true;

    let correctCount = 0;
    const total = dropzones.length;

    const timeTaken = totalTime - timeRemaining;
    const minutesTaken = Math.floor(timeTaken / 60);
    const secondsTaken = timeTaken % 60;
    const timeString = `${minutesTaken} menit ${secondsTaken} detik`;

    document.querySelectorAll('.word').forEach(el => el.classList.remove('selected'));
    selectedWordElement = null;

    dropzones.forEach(zone => {
        const answer = zone.textContent.trim();
        const correctAnswer = zone.dataset.answer;
        if (answer === correctAnswer) {
            zone.classList.add('correct');
            correctCount++;
        } else {
            zone.classList.add('wrong');
        }
    });

    let scoreColor = correctCount === total ? "#2e7d32" : "#d32f2f";
    scoreDisplay.innerHTML = `<span style="color:${scoreColor}">Skor: ${correctCount} dari ${total} benar.</span><br>
                              <span style="color:#424242; font-weight:normal;">Waktu pengerjaan: ${timeString}.</span>`;

    try {
        await addDoc(collection(db, "skor_sejarah"), {
            nama: currentPlayerName,
            skor_benar: correctCount,
            total_soal: total,
            waktu_pengerjaan: timeString,
            detik_dihabiskan: timeTaken,
            tanggal: serverTimestamp()
        });
        btnCheck.textContent = "Skor Berhasil Disimpan!";
        btnCheck.style.backgroundColor = "#4CAF50";
    } catch (e) {
        console.error("Error adding document: ", e);
        btnCheck.textContent = "Gagal menyimpan skor (cek koneksi)";
        btnCheck.style.backgroundColor = "#d32f2f";
    }
}

btnCheck.addEventListener('click', checkAnswers);