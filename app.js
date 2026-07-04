const { createApp } = Vue;

// Static data for column configuration. Moved outside the component for clarity and performance.
const columnConfig = {
    todo: { title: 'POR HACER', colorClass: 'text-gray-100', countBgClass: 'bg-gray-500/20', countColorClass: 'text-gray-300', icon: '<path fill-rule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 9.75A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75ZM2 14.75a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />' },
    progress: { title: 'EN PROCESO', colorClass: 'text-gray-100', countBgClass: 'bg-gray-500/20', countColorClass: 'text-gray-300', icon: '<path d="m3.162 3.882 2.534-.326a.75.75 0 0 1 .83.513l1.88 5.526a.75.75 0 0 1-.04 1.234l-1.42 1.136a.75.75 0 0 0-.09 1.009l2.05 3.076a.75.75 0 0 0 .96.265l2.33-1.165a.75.75 0 0 1 .91.13l3.11 3.11a.75.75 0 0 1-.17 1.24l-2.178.871a.75.75 0 0 1-.732-.06l-4.28-3.424a.75.75 0 0 1-.212-.62v-2.93L3.55 3.13a.75.75 0 0 1-.388-.752V2.25a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.338l.05.006a.75.75 0 0 1 .42.82Z" /><path d="M7.25 10.25a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Z" />' },
    done: { title: 'HECHO', colorClass: 'text-gray-100', countBgClass: 'bg-gray-500/20', countColorClass: 'text-gray-300', icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" />' },
};

const app = createApp({
    data() {
        return {
            boardData: JSON.parse(localStorage.getItem('myTaskManagerData')) || {
                todo: [],
                progress: [],
                done: []
            },
            labels: {
                default: { bg: 'bg-gray-300' },
                red:     { bg: 'bg-red-400' },
                blue:    { bg: 'bg-blue-400' },
                green:   { bg: 'bg-green-400' },
                yellow:  { bg: 'bg-yellow-400' },
            },
            activeFilter: 'all',
            newTasks: {
                todo: { showForm: false, text: '', label: 'default' },
                progress: { showForm: false, text: '', label: 'default' },
                done: { showForm: false, text: '', label: 'default' },
            },
            editingTask: { id: null, text: '', column: null },
            labelPicker: { show: false, x: 0, y: 0, task: null },
            draggedTask: null,
            confirmationModal: {
                show: false,
                message: '',
                onConfirm: () => {}
            }
        }
    },
    computed: {
        filteredBoard() {
            const board = {};
            for (const colName in this.boardData) {
                const filteredTasks = this.boardData[colName].filter(task => 
                    this.activeFilter === 'all' || (task.label || 'default') === this.activeFilter
                );
                board[colName] = { ...columnConfig[colName], tasks: filteredTasks };
            }
            return board;
        }
    },
    watch: {
        boardData: {
            handler(newValue) {
                localStorage.setItem('myTaskManagerData', JSON.stringify(newValue));
            },
            deep: true
        }
    },
    methods: {
        setFilter(filter) {
            this.activeFilter = filter;
        },
        addTask(columnName) {
            const text = this.newTasks[columnName].text.trim();
            const label = this.newTasks[columnName].label;
            if (!text) return;
            const newTask = { id: Date.now().toString(), text: text, label: label };
            this.boardData[columnName].push(newTask);
            this.newTasks[columnName].text = '';
            this.newTasks[columnName].showForm = false;
            this.newTasks[columnName].label = 'default'; // Reset label
        },
        deleteTask(taskId, columnName) {
            this.confirmationModal.show = true;
            this.confirmationModal.message = '¿Estás seguro de que quieres eliminar esta tarea?';
            this.confirmationModal.onConfirm = () => {
                this.boardData[columnName] = this.boardData[columnName].filter(t => t.id !== taskId);
            };
        },
        handleConfirm() {
            this.confirmationModal.onConfirm();
            this.cancelConfirm();
        },
        showEditForm(task, columnName) {
            this.editingTask.id = task.id;
            this.editingTask.text = task.text;
            this.editingTask.column = columnName;
        },
        cancelEdit() {
            this.editingTask.id = null;
            this.editingTask.text = '';
            this.editingTask.column = null;
        },
        cancelConfirm() {
            this.confirmationModal.show = false;
            this.confirmationModal.message = '';
            this.confirmationModal.onConfirm = () => {};
        },
        updateTaskText() {
            if (!this.editingTask.id) return;
            
            const newText = this.editingTask.text.trim();
            const column = this.editingTask.column;

            const task = this.boardData[column]?.find(t => t.id === this.editingTask.id);

            if (task && newText) {
                task.text = newText;
            }
            this.cancelEdit();
        },
        showLabelPicker(event, task) {
            const rect = event.target.getBoundingClientRect();
            this.labelPicker = {
                show: true,
                x: rect.left,
                y: rect.bottom + 5,
                task: task
            };
            // Add a one-time click listener to close the picker
            const close = () => {
                this.labelPicker.show = false;
                document.removeEventListener('click', close);
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        },
        updateTaskLabel(task, newLabel) {
            task.label = newLabel;
            this.labelPicker.show = false;
        },
        // Drag and Drop Methods
        handleDragStart(event, task, fromColumn) {
            event.target.classList.add('opacity-50');
            this.draggedTask = { task, fromColumn };
        },
        handleDragEnd(event) {
            event.target.classList.remove('opacity-50');
            this.draggedTask = null;
        },
        handleDragOver(event) {
            const columnEl = event.target.closest('.glass-column');
            if (columnEl) {
                // Could add a visual indicator here
            }
        },
        handleDragLeave(event) {
            // Could remove visual indicator here
        },
        handleDrop(event, toColumn) {
            if (!this.draggedTask) return;

            const fromColumn = this.draggedTask.fromColumn;
            const taskToMove = this.draggedTask.task;

            // Find and remove task from its original column
            const fromTasks = this.boardData[fromColumn];
            const taskIndex = fromTasks.findIndex(t => t.id === taskToMove.id);
            if (taskIndex > -1) {
                fromTasks.splice(taskIndex, 1);
            }

            // Add task to the destination column, either at a specific position or at the end
            const toTasks = this.boardData[toColumn];
            const dropTargetElement = event.target.closest('.task-list-item');

            if (dropTargetElement) {
                const targetTaskId = dropTargetElement.getAttribute('data-task-id');
                const targetIndex = toTasks.findIndex(t => t.id === targetTaskId);
                // Insert before the target task
                toTasks.splice(targetIndex, 0, taskToMove); 
            } else {
                toTasks.push(taskToMove); // Add to the end if not dropped on a specific task
            }
        }
    }
});

// Custom directive to focus element
app.directive('focus', {
    mounted(el) {
        el.focus();
    }
});

app.mount('#app');