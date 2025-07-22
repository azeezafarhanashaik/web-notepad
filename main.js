class NotesApp {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.autoSaveTimer = null;
        this.autoSaveDelay = 1000; // 1 second
        
        this.initElements();
        this.loadNotes();
        this.loadTheme();
        this.bindEvents();
        this.showEmptyState();
    }
    
    initElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.searchInput = document.getElementById('searchInput');
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.notesList = document.getElementById('notesList');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteEditor = document.getElementById('noteEditor');
        this.lastSaved = document.getElementById('lastSaved');
        this.catPlaceholder = document.getElementById('catPlaceholder');
    }
    
    bindEvents() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        this.noteTitle.addEventListener('input', () => this.handleNoteChange());
        this.noteEditor.addEventListener('input', () => this.handleNoteChange());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N for new note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewNote();
        }
        
        // Ctrl/Cmd + S for save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentNote();
        }
        
        // Ctrl/Cmd + D for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleTheme();
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    createNewNote() {
        const newNote = {
            id: this.generateId(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotesList();
        this.selectNote(newNote.id);
        this.noteTitle.focus();
        this.noteTitle.select();
    }
    
    selectNote(noteId) {
        this.saveCurrentNote();
        this.currentNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        
        if (note) {
            this.noteTitle.value = note.title;
            this.noteEditor.value = note.content;
            this.updateLastSaved(note.updatedAt);
            this.updateActiveNote();
            this.hideEmptyState();
        }
    }
    
    handleNoteChange() {
        if (!this.currentNoteId) return;
        
        clearTimeout(this.autoSaveTimer);
        this.lastSaved.textContent = 'Saving...';
        this.lastSaved.className = 'last-saved saving';
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveCurrentNote();
        }, this.autoSaveDelay);
    }
    
    saveCurrentNote() {
        if (!this.currentNoteId) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            note.title = this.noteTitle.value || 'Untitled Note';
            note.content = this.noteEditor.value;
            note.updatedAt = new Date();
            
            this.saveNotes();
            this.renderNotesList();
            this.updateLastSaved(note.updatedAt);
            this.updateActiveNote();
        }
    }
    
    toggleNoteStar(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.starred = !note.starred;
            this.saveNotes();
            this.renderNotesList();
            
            const message = note.starred 
                ? '⭐ Purr-fect! Note starred!' 
                : '😸 Note unstarred, but still loved!';
            this.showCatNotification(message);
        }
    }
    
    deleteNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        const noteTitle = note ? note.title : 'this note';
        
        if (confirm(`🐱 Are you sure you want to delete "${noteTitle}"? This cat will miss it!`)) {
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveNotes();
            this.updateUI();
            
            if (this.currentNoteId === noteId) {
                this.currentNoteId = null;
            }
            
            this.showCatNotification('😿 Note deleted! The cat is sad...');
        }
    }
    
    searchNotes(query) {
        const filteredNotes = query.trim() 
            ? this.notes.filter(note => 
                note.title.toLowerCase().includes(query.toLowerCase()) ||
                note.content.toLowerCase().includes(query.toLowerCase())
              )
            : this.notes;
        
        this.renderNotesList(filteredNotes);
    }
    
    renderNotesList(notesToRender = this.notes) {
        // Sort notes: starred first, then by update time
        const sortedNotes = [...notesToRender].sort((a, b) => {
            if (a.starred && !b.starred) return -1;
            if (!a.starred && b.starred) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        // Clear notes list but keep cat placeholder
        const existingNotes = this.notesList.querySelectorAll('.note-item');
        existingNotes.forEach(note => note.remove());
        
        if (sortedNotes.length === 0) {
            this.catPlaceholder.style.display = 'block';
            return;
        }
        
        this.catPlaceholder.style.display = 'none';
        
        sortedNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = `note-item ${note.id === this.currentNoteId ? 'active' : ''} ${note.starred ? 'starred' : ''}`;
            noteElement.dataset.noteId = note.id;
            
            const preview = note.content.length > 100 
                ? note.content.substring(0, 100) + '...'
                : note.content || 'No content';
            
            noteElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div class="note-item-title">
                            ${note.starred ? '<span class="star-icon">⭐</span>' : ''}
                            ${this.escapeHtml(note.title)}
                        </div>
                        <div class="note-item-preview">${this.escapeHtml(preview)}</div>
                        <div class="note-item-date">${this.formatDate(note.updatedAt)}</div>
                    </div>
                    <div class="note-actions">
                        <button class="action-btn star-btn ${note.starred ? 'starred' : ''}" title="${note.starred ? 'Unstar note' : 'Star note'}">
                            ${note.starred ? '★' : '☆'}
                        </button>
                        <button class="action-btn delete-btn" title="Delete note">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            noteElement.addEventListener('click', () => this.selectNote(note.id));
            
            // Star button
            const starBtn = noteElement.querySelector('.star-btn');
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNoteStar(note.id);
            });
            
            // Delete button
            const deleteBtn = noteElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(note.id);
            });
            
            this.notesList.appendChild(noteElement);
        });
    }
    
    updateNotesList() {
        this.renderNotesList();
        this.updateActiveNote();
    }
    
    updateUI() {
        this.renderNotesList();
        if (!this.currentNoteId || !this.notes.find(n => n.id === this.currentNoteId)) {
            this.showEmptyState();
        } else {
            this.showEditor();
        }
        this.updateActiveNote();
    }

    updateActiveNote() {
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === this.currentNoteId);
        });
    }
    
    updateLastSaved(date) {
        this.lastSaved.textContent = `Last saved: ${this.formatTime(date)}`;
        this.lastSaved.className = 'last-saved saved';
        
        setTimeout(() => {
            this.lastSaved.className = 'last-saved';
        }, 2000);
    }
    
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">😺</div>
            <h2>No note selected</h2>
            <p>This cat is waiting for you to select a note or create a new one!</p>
        `;
        
        document.querySelector('.main-content').innerHTML = '';
        document.querySelector('.main-content').appendChild(emptyState);
    }
    
    hideEmptyState() {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            document.querySelector('.main-content').innerHTML = `
                <div class="editor-header">
                    <input type="text" class="note-title" id="noteTitle" placeholder="Untitled Note" />
                    <div class="editor-info">
                        <span class="last-saved" id="lastSaved">Last saved: Never</span>
                    </div>
                </div>
                
                <div class="editor-container">
                    <textarea 
                        class="note-editor" 
                        id="noteEditor" 
                        placeholder="Start writing your note..."
                    ></textarea>
                </div>
            `;
            
            this.initElements();
            this.noteTitle.addEventListener('input', () => this.handleNoteChange());
            this.noteEditor.addEventListener('input', () => this.handleNoteChange());
        }
    }
    
    // Cat-themed features
    startCatMoodCycle() {
        setInterval(() => {
            this.currentCatMood = (this.currentCatMood + 1) % this.catMoods.length;
            this.catMood.textContent = this.catMoods[this.currentCatMood];
        }, 5000); // Change every 5 seconds
    }
    
    changeCatMood() {
        this.currentCatMood = Math.floor(Math.random() * this.catMoods.length);
        this.catMood.textContent = this.catMoods[this.currentCatMood];
        this.showCatNotification('😸 Meow! Cat mood changed!');
    }
    
    createPawPrint(event) {
        // Only create paw prints occasionally and not on UI elements
        if (Math.random() > 0.1 || event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT') return;
        
        const pawPrint = document.createElement('div');
        pawPrint.className = 'paw-prints';
        pawPrint.textContent = '🐾';
        pawPrint.style.left = event.clientX + 'px';
        pawPrint.style.top = event.clientY + 'px';
        
        document.body.appendChild(pawPrint);
        
        setTimeout(() => {
            pawPrint.remove();
        }, 2000);
    }
    
    showCatNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cat-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveNotes() {
        try {
            localStorage.setItem('notes-app-data', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    }
    
    loadNotes() {
        try {
            const savedNotes = localStorage.getItem('notes-app-data');
            if (savedNotes) {
                this.notes = JSON.parse(savedNotes).map(note => ({
                    ...note,
                    starred: note.starred || false,
                    createdAt: new Date(note.createdAt),
                    updatedAt: new Date(note.updatedAt)
                }));
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('notes-app-theme', newTheme);
        
        // Add rotation animation
        this.themeToggle.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            this.themeToggle.style.transform = '';
        }, 300);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('notes-app-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return this.formatTime(date);
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('notes-app-theme')) {
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
});
