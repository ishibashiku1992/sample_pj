(() => {
  'use strict';

  const STORAGE_KEY = 'todo-app.items';

  const form = document.getElementById('new-form');
  const input = document.getElementById('new-input');
  const list = document.getElementById('list');
  const empty = document.getElementById('empty');
  const footer = document.getElementById('footer');
  const count = document.getElementById('count');
  const clearDone = document.getElementById('clear-done');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const template = document.getElementById('item-template');

  let todos = load();
  let filter = 'all';

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // ストレージが使えない環境ではメモリ上でのみ保持する
    }
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function update(next) {
    todos = next;
    save();
    render();
  }

  function visibleTodos() {
    if (filter === 'active') return todos.filter((t) => !t.done);
    if (filter === 'done') return todos.filter((t) => t.done);
    return todos;
  }

  function render() {
    list.replaceChildren(...visibleTodos().map(renderItem));

    const remaining = todos.filter((t) => !t.done).length;
    count.textContent = `残り ${remaining} 件`;
    clearDone.disabled = remaining === todos.length;

    footer.hidden = todos.length === 0;
    empty.hidden = list.children.length > 0;
    empty.textContent = todos.length === 0 ? 'TODOはありません' : '該当するTODOはありません';

    filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  }

  function renderItem(todo) {
    const li = template.content.firstElementChild.cloneNode(true);
    li.dataset.id = todo.id;
    li.classList.toggle('done', todo.done);
    li.querySelector('.toggle').checked = todo.done;
    li.querySelector('.text').textContent = todo.text;
    return li;
  }

  function startEdit(li) {
    const todo = todos.find((t) => t.id === li.dataset.id);
    if (!todo) return;

    const span = li.querySelector('.text');
    const field = document.createElement('input');
    field.className = 'edit';
    field.value = todo.text;
    field.maxLength = 200;
    span.replaceWith(field);
    field.focus();
    field.select();

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      const text = field.value.trim();
      if (!commit) return render();
      if (!text) return update(todos.filter((t) => t.id !== todo.id));
      update(todos.map((t) => (t.id === todo.id ? { ...t, text } : t)));
    };

    field.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    field.addEventListener('blur', () => finish(true));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    update([...todos, { id: newId(), text, done: false }]);
    input.value = '';
  });

  list.addEventListener('change', (e) => {
    if (!e.target.matches('.toggle')) return;
    const id = e.target.closest('.item').dataset.id;
    update(todos.map((t) => (t.id === id ? { ...t, done: e.target.checked } : t)));
  });

  list.addEventListener('click', (e) => {
    if (!e.target.matches('.delete')) return;
    const id = e.target.closest('.item').dataset.id;
    update(todos.filter((t) => t.id !== id));
  });

  list.addEventListener('dblclick', (e) => {
    if (!e.target.matches('.text')) return;
    startEdit(e.target.closest('.item'));
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;
      render();
    });
  });

  clearDone.addEventListener('click', () => {
    update(todos.filter((t) => !t.done));
  });

  render();
})();
