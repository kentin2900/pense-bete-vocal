// app.js

const notesGrid = document.getElementById('notesGrid');
const micBtn = document.getElementById('micBtn');
const statusOverlay = document.getElementById('statusOverlay');
const statusText = document.getElementById('statusText');

let recognition;
let isRecording = false;

// Color palette for post-its
const colors = ['yellow', 'pink', 'green', 'orange'];

// Initialize Speech Recognition
function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Désolé, votre navigateur ne supporte pas la reconnaissance vocale. Essayez Chrome ou Edge.");
        return null;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'fr-FR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        statusOverlay.classList.remove('hidden');
        statusText.innerText = "Je vous écoute...";
    };

    rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
            addNote(transcript);
        }
    };

    rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        stopRecording();
        if (event.error === 'not-allowed') {
            alert("L'accès au microphone a été refusé. Veuillez autoriser le micro pour utiliser l'app.");
        }
    };

    rec.onend = () => {
        stopRecording();
    };

    return rec;
}

function stopRecording() {
    isRecording = false;
    micBtn.classList.remove('recording');
    statusOverlay.classList.add('hidden');
}

function toggleRecording() {
    if (!recognition) {
        recognition = initRecognition();
    }
    
    if (!recognition) return;

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Note Management
let notes = JSON.parse(localStorage.getItem('vocal_notes') || '[]');

function saveNotes() {
    localStorage.setItem('vocal_notes', JSON.stringify(notes));
}

function addNote(text) {
    const note = {
        id: Date.now(),
        text: text,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.floor(Math.random() * 6) - 3 // random rotation between -3 and 3 degrees
    };
    
    notes.push(note);
    saveNotes();
    renderNotes();
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
}

function renderNotes() {
    notesGrid.innerHTML = '';
    
    notes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = `note note-${note.color}`;
        noteEl.style.setProperty('--rot', `${note.rotation}deg`);
        noteEl.style.transform = `rotate(${note.rotation}deg)`;
        
        // Format date (e.g. Nov 3)
        const dateObj = note.id ? new Date(note.id) : new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateStr = `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
        
        // Random duration for visual effect
        const duration = `0:${Math.floor(Math.random() * 40 + 10)}`;

        noteEl.innerHTML = `
            <div class="tape"></div>
            <button class="delete-btn" title="Supprimer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
            <div class="note-title">${note.text}</div>
            <div class="note-subtitle">Note</div>
            <div class="audio-player">
                <div class="play-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                    <div class="progress-thumb"></div>
                </div>
                <div class="time">${duration}</div>
            </div>
            <div class="note-footer">
                <span>Tape</span>
                <span>${dateStr}</span>
            </div>
        `;
        
        noteEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNote(note.id);
        });
        
        notesGrid.appendChild(noteEl);
    });
}

// Export Data
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

function exportNotes() {
    if (notes.length === 0) {
        alert("Il n'y a aucune note à sauvegarder.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "pense_bete_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Import Data
function triggerImport() {
    fileInput.click();
}

function importNotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedNotes = JSON.parse(e.target.result);
            if (Array.isArray(importedNotes)) {
                notes = importedNotes;
                saveNotes();
                renderNotes();
                alert("Notes restaurées avec succès !");
            } else {
                alert("Le fichier n'est pas valide.");
            }
        } catch (error) {
            alert("Erreur lors de la lecture du fichier.");
        }
    };
    reader.readAsText(file);
    // Reset input so the same file can be loaded again if needed
    event.target.value = '';
}

// Event Listeners
micBtn.addEventListener('click', toggleRecording);
exportBtn.addEventListener('click', exportNotes);
importBtn.addEventListener('click', triggerImport);
fileInput.addEventListener('change', importNotes);

// Initial Render
renderNotes();

// Keyboard support
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isRecording) {
        e.preventDefault();
        toggleRecording();
    }
});
