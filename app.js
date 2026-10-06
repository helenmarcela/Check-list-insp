const STORAGE_KEYS = {
  users: 'checklist_app_users',
  session: 'checklist_app_session',
  checklists: 'checklist_app_checklists',
};

const state = {
  users: loadFromStorage(STORAGE_KEYS.users, []),
  sessionUserId: loadFromStorage(STORAGE_KEYS.session, null),
  checklistsByUser: loadFromStorage(STORAGE_KEYS.checklists, {}),
  selectedChecklistId: null,
  search: '',
};

const elements = {
  authScreen: document.getElementById('auth-screen'),
  dashboardScreen: document.getElementById('dashboard-screen'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  currentUserEmail: document.getElementById('current-user-email'),
  checklistList: document.getElementById('checklist-list'),
  checklistDetail: document.getElementById('checklist-detail'),
  statsCards: document.getElementById('stats-cards'),
  searchInput: document.getElementById('search-input'),
  toast: document.getElementById('toast'),
  newChecklistButton: document.getElementById('new-checklist-button'),
  logoutButton: document.getElementById('logout-button'),
  themeToggle: document.getElementById('theme-toggle'),
  demoLoginButton: document.getElementById('demo-login-button'),
};

initialize();

function initialize() {
  migrateItemStatuses();
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.registerForm.addEventListener('submit', handleRegisterSubmit);
  elements.newChecklistButton.addEventListener('click', createChecklist);
  elements.logoutButton.addEventListener('click', logout);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.demoLoginButton.addEventListener('click', loginWithDemoAccount);
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderDashboard();
  });

  document.querySelectorAll('[data-auth-tab]').forEach((button) => {
    button.addEventListener('click', () => switchAuthTab(button.dataset.authTab));
  });

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('input', handleDocumentInput);
  applyTheme(localStorage.getItem('checklist_app_theme') || 'light');
  updateDemoMachineChecklist();

  if (state.sessionUserId) {
    state.selectedChecklistId = getUserChecklists()[0]?.id || null;
  }

  function toggleTheme() {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem('checklist_app_theme', nextTheme);
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    const isDark = theme === 'dark';
    elements.themeToggle.textContent = isDark ? 'Tema claro' : 'Tema escuro';
    elements.themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
  }

  render();
}

function updateDemoMachineChecklist() {
  const demoUser = state.users.find((user) => user.email.toLowerCase() === 'teste@checklist.local');
  if (!demoUser) {
    return;
  }

  const demoChecklists = state.checklistsByUser[demoUser.id] || [];
  const checklist = demoChecklists.find((item) =>
    ['Inspeção de máquinas ou caminhões', 'Inspeção de máquinas e caminhões', 'Inspeção de máquinas', 'Preparar uma viagem'].includes(item.name)
  );
  if (!checklist) {
    return;
  }

  const sampleMachineItems = [
    'Verificar visualmente proteções e dispositivos de segurança, sem removê-los',
    'Inspecionar cabos, conexões e mangueiras por danos ou desgaste visível',
    'Verificar pneus: calibragem conforme especificação, nível de desgaste, cortes e danos',
    'Verificar retrovisores e vidros: fixação, limpeza, visibilidade e ausência de trincas ou danos',
    'Verificar setas e faróis: funcionamento, limpeza e ausência de danos',
    'Verificar extintor: presença, validade, sinalização e estado geral',
    'Verificar freios conforme procedimento do fabricante e reportar qualquer anormalidade',
    'Verificar se há vazamentos, peças soltas ou sinais anormais de desgaste',
    'Registrar anormalidades e comunicar o responsável antes de usar a máquina',
  ];
  let changed = false;

  if (checklist.name === 'Preparar uma viagem') {
    checklist.items = [];
    checklist.name = 'Inspeção de máquinas ou caminhões';
    checklist.description = 'Checklist visual de rotina. Siga o manual do fabricante e os procedimentos de segurança do local. Não remova proteções nem inspecione partes móveis com a máquina em operação.';
    checklist.completed = false;
    changed = true;
  }

  if (checklist.name === 'Inspeção de máquinas e caminhões' || checklist.name === 'Inspeção de máquinas') {
    checklist.name = 'Inspeção de máquinas ou caminhões';
    changed = true;
  }

  const itemToRemove = 'Confirmar que a área ao redor da máquina está limpa e desobstruída';
  const itemsToRemove = [
    itemToRemove,
    'Conferir se etiquetas de segurança e identificação estão legíveis',
  ];
  const filteredItems = checklist.items.filter((item) => !itemsToRemove.includes(item.text));
  if (filteredItems.length !== checklist.items.length) {
    checklist.items = filteredItems;
    changed = true;
  }

  const oldMirrorItem = 'Verificar retrovisores: fixação, limpeza e ajuste para boa visibilidade';
  const updatedMirrorItem = 'Verificar retrovisores e vidros: fixação, limpeza, visibilidade e ausência de trincas ou danos';
  const existingMirrorItem = checklist.items.find((item) => item.text === oldMirrorItem);
  if (existingMirrorItem) {
    existingMirrorItem.text = updatedMirrorItem;
    changed = true;
  }

  for (const text of sampleMachineItems) {
    if (!checklist.items.some((item) => item.text === text)) {
      checklist.items.push({
        id: generateId('item'),
        text,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const now = new Date().toISOString();
  checklist.updatedAt = now;
  state.checklistsByUser[demoUser.id] = demoChecklists;
  saveToStorage(STORAGE_KEYS.checklists, state.checklistsByUser);
}

function migrateItemStatuses() {
  let changed = false;

  Object.values(state.checklistsByUser).forEach((checklists) => {
    checklists.forEach((checklist) => {
      checklist.items.forEach((item) => {
        if (!['pending', 'conforming', 'nonconforming', 'attention'].includes(item.status)) {
          item.status = item.done ? 'conforming' : 'pending';
          changed = true;
        }

        if ('done' in item) {
          delete item.done;
          changed = true;
        }
      });
    });
  });

  if (changed) {
    persistChecklists();
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Preencha e-mail e senha.');
    return;
  }

  loginUser(email, password);
}

async function loginWithDemoAccount() {
  const email = 'teste@checklist.local';
  const passwordHash = await hashPassword('Teste123!');
  let user = state.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    user = {
      id: generateId('user'),
      name: 'Conta de teste',
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    state.users.push(user);
  } else {
    user.passwordHash = passwordHash;
  }

  if (!state.checklistsByUser[user.id]) {
    state.checklistsByUser[user.id] = [];
  }

  const demoChecklists = state.checklistsByUser[user.id];
  const sampleMachineItems = [
    'Verificar visualmente proteções e dispositivos de segurança, sem removê-los',
    'Inspecionar cabos, conexões e mangueiras por danos ou desgaste visível',
    'Verificar pneus: calibragem conforme especificação, nível de desgaste, cortes e danos',
    'Verificar retrovisores e vidros: fixação, limpeza, visibilidade e ausência de trincas ou danos',
    'Verificar setas e faróis: funcionamento, limpeza e ausência de danos',
    'Verificar extintor: presença, validade, sinalização e estado geral',
    'Verificar freios conforme procedimento do fabricante e reportar qualquer anormalidade',
    'Verificar se há vazamentos, peças soltas ou sinais anormais de desgaste',
    'Registrar anormalidades e comunicar o responsável antes de usar a máquina',
  ];
  const previousSample = demoChecklists.find((checklist) => checklist.name === 'Preparar uma viagem');

  if (previousSample) {
    const now = new Date().toISOString();
    previousSample.name = 'Inspeção de máquinas ou caminhões';
    previousSample.description = 'Checklist visual de rotina. Siga o manual do fabricante e os procedimentos de segurança do local. Não remova proteções nem inspecione partes móveis com a máquina em operação.';
    previousSample.updatedAt = now;
    previousSample.completed = false;
    previousSample.items = sampleMachineItems.map((text) => ({
      id: generateId('item'),
      text,
      status: 'pending',
      createdAt: now,
    }));
  } else if (demoChecklists.length === 0) {
    const now = new Date().toISOString();
    demoChecklists.push({
      id: generateId('checklist'),
      name: 'Inspeção de máquinas ou caminhões',
      description: 'Checklist visual de rotina. Siga o manual do fabricante e os procedimentos de segurança do local. Não remova proteções nem inspecione partes móveis com a máquina em operação.',
      createdAt: now,
      updatedAt: now,
      completed: false,
      items: sampleMachineItems.map((text) => ({
        id: generateId('item'),
        text,
        status: 'pending',
        createdAt: now,
      })),
    });
  }

  saveToStorage(STORAGE_KEYS.users, state.users);
  saveToStorage(STORAGE_KEYS.checklists, state.checklistsByUser);
  state.sessionUserId = user.id;
  saveToStorage(STORAGE_KEYS.session, user.id);
  state.selectedChecklistId = state.checklistsByUser[user.id][0]?.id || null;
  render();
  showToast('Você entrou na conta de teste.');
}

async function loginUser(email, password) {
  const user = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    showToast('Usuário não encontrado.');
    return;
  }

  const hashedPassword = await hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    showToast('Senha incorreta.');
    return;
  }

  state.sessionUserId = user.id;
  saveToStorage(STORAGE_KEYS.session, user.id);
  state.selectedChecklistId = getUserChecklists()[0]?.id || null;
  render();
  elements.loginForm.reset();
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  if (!name || !email || !password) {
    showToast('Preencha todos os campos para continuar.');
    return;
  }

  if (password.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  const emailExists = state.users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    showToast('Este e-mail já está cadastrado.');
    return;
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: generateId('user'),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  state.users.push(newUser);
  state.checklistsByUser[newUser.id] = [];
  saveToStorage(STORAGE_KEYS.users, state.users);
  saveToStorage(STORAGE_KEYS.checklists, state.checklistsByUser);

  state.sessionUserId = newUser.id;
  saveToStorage(STORAGE_KEYS.session, newUser.id);
  state.selectedChecklistId = null;

  elements.registerForm.reset();
  switchAuthTab('login');
  render();
  showToast('Cadastro realizado com sucesso!');
}

function logout() {
  state.sessionUserId = null;
  state.selectedChecklistId = null;
  saveToStorage(STORAGE_KEYS.session, null);
  render();
}

function render() {
  const hasSession = Boolean(state.sessionUserId);
  elements.authScreen.classList.toggle('hidden', hasSession);
  elements.dashboardScreen.classList.toggle('hidden', !hasSession);

  if (!hasSession) {
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    logout();
    return;
  }

  elements.currentUserEmail.textContent = currentUser.email;
  renderDashboard();
}

function renderDashboard() {
  const checklists = getFilteredChecklists();
  const stats = calculateStats();

  elements.statsCards.innerHTML = `
    <div class="stat-card">
      <h3>Total</h3>
      <strong>${stats.total}</strong>
    </div>
    <div class="stat-card">
      <h3>Finalizados</h3>
      <strong>${stats.completed}</strong>
    </div>
    <div class="stat-card">
      <h3>Pendentes</h3>
      <strong>${stats.pending}</strong>
    </div>
    <div class="stat-card">
      <h3>Progresso</h3>
      <strong>${stats.progress}%</strong>
    </div>
  `;

  if (checklists.length === 0) {
    elements.checklistList.innerHTML = `
      <div class="empty-state">
        <p>Nenhum checklist encontrado.</p>
      </div>
    `;
  } else {
    elements.checklistList.innerHTML = checklists
      .map((checklist) => {
        const assessedCount = checklist.items.filter((item) => getItemStatus(item) !== 'pending').length;
        const progress = checklist.items.length ? Math.round((assessedCount / checklist.items.length) * 100) : 0;
        const badgeClass = checklist.completed ? 'success' : 'warning';
        const badgeLabel = checklist.completed ? 'Avaliação finalizada' : 'Em andamento';
        const selectedClass = state.selectedChecklistId === checklist.id ? 'selected' : '';

        return `
          <article class="checklist-card ${selectedClass}" data-checklist-card="${checklist.id}">
            <div class="checklist-card-header">
              <h3>${escapeHtml(checklist.name || 'Checklist sem nome')}</h3>
              <span class="badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="checklist-meta">
              <span>${checklist.items.length} itens</span>
              <span>${formatDate(checklist.updatedAt)}</span>
            </div>
            <div class="progress-bar"><span style="width: ${progress}%"></span></div>
            <div class="checklist-meta">
              <span>${assessedCount}/${checklist.items.length} avaliados</span>
              <span>${progress}%</span>
            </div>
          </article>
        `;
      })
      .join('');
  }

  const selectedChecklist = getUserChecklists().find((item) => item.id === state.selectedChecklistId) || null;
  if (!selectedChecklist) {
    elements.checklistDetail.innerHTML = `
      <div class="empty-state">
        <p>Selecione um checklist para visualizar os itens.</p>
      </div>
    `;
    return;
  }

  const assessedCount = selectedChecklist.items.filter((item) => getItemStatus(item) !== 'pending').length;
  const nonconformingCount = selectedChecklist.items.filter((item) => getItemStatus(item) === 'nonconforming').length;
  const attentionCount = selectedChecklist.items.filter((item) => getItemStatus(item) === 'attention').length;
  const selectedProgress = selectedChecklist.items.length
    ? Math.round((assessedCount / selectedChecklist.items.length) * 100)
    : 0;

  const pendingCount = selectedChecklist.items.length - assessedCount;
  const pendingText = pendingCount > 0
    ? `${pendingCount} ${pendingCount === 1 ? 'pendente' : 'pendentes'}`
    : 'Todos avaliados';

  elements.checklistDetail.innerHTML = `
    <div class="detail-header">
      <h2>${escapeHtml(selectedChecklist.name || 'Checklist sem nome')}</h2>
      <span class="badge ${selectedChecklist.completed ? 'success' : 'warning'}">
        ${selectedChecklist.completed ? 'Avaliação finalizada' : 'Em andamento'}
      </span>
    </div>

    <div class="detail-form">
      <div class="inspection-meta-grid">
        <label>
          Nome do operador
          <input type="text" data-field="operatorName" value="${escapeAttribute(selectedChecklist.operatorName || '')}" placeholder="Ex.: João da Silva" />
        </label>

        <label>
          Nome da máquina ou caminhão
          <input type="text" data-field="equipmentName" value="${escapeAttribute(selectedChecklist.equipmentName || '')}" placeholder="Ex.: Escavadeira CAT 320 ou Caminhão Volvo FH" />
        </label>

        <label>
          Data
          <input type="date" data-field="inspectionDate" value="${escapeAttribute(selectedChecklist.inspectionDate || getTodayDate())}" />
        </label>

        <label>
          Horário
          <input type="time" data-field="inspectionTime" value="${escapeAttribute(selectedChecklist.inspectionTime || getCurrentTime())}" />
        </label>

        <label>
          Horímetro
          <input type="text" data-field="hourMeter" value="${escapeAttribute(selectedChecklist.hourMeter || '')}" placeholder="Ex.: 1458,5 h" />
        </label>
      </div>

      <label>
        Nome do checklist
        <input type="text" data-field="name" value="${escapeAttribute(selectedChecklist.name || '')}" />
      </label>

      <label>
        Descrição
        <textarea data-field="description" rows="3">${escapeHtml(selectedChecklist.description || '')}</textarea>
      </label>

      <div class="checklist-meta">
        <span>${pendingText}</span>
        <span>${nonconformingCount} reprovado${nonconformingCount === 1 ? '' : 's'} · ${attentionCount} atenção · ${selectedProgress}%</span>
      </div>
      <div class="progress-bar"><span style="width: ${selectedProgress}%"></span></div>

      <ul class="item-list">
        ${selectedChecklist.items.length === 0 ? '<li class="empty-state"><p>Adicione itens ao checklist.</p></li>' : selectedChecklist.items.map((item) => `
          <li class="item-row item-status-${getItemStatus(item)}">
            <textarea
              data-role="item-text"
              data-item-id="${item.id}"
              rows="2"
              aria-label="Texto do item de verificação"
            >${escapeHtml(item.text || '')}</textarea>
            <span class="item-status-label">${
              getItemStatus(item) === 'conforming'
                ? 'Aprovado / normal'
                : getItemStatus(item) === 'nonconforming'
                  ? 'Reprovado / problema'
                  : getItemStatus(item) === 'attention'
                    ? 'Atenção'
                  : 'Pendente de avaliação'
            }</span>
            <div class="status-tabs" role="group" aria-label="Avaliação de ${escapeAttribute(item.text || 'item')}">
              <button type="button" class="status-tab conforming ${getItemStatus(item) === 'conforming' ? 'active' : ''}" data-role="item-status" data-item-id="${item.id}" data-status="conforming" aria-pressed="${getItemStatus(item) === 'conforming'}">Aprovado</button>
              <button type="button" class="status-tab nonconforming ${getItemStatus(item) === 'nonconforming' ? 'active' : ''}" data-role="item-status" data-item-id="${item.id}" data-status="nonconforming" aria-pressed="${getItemStatus(item) === 'nonconforming'}">Reprovado</button>
              <button type="button" class="status-tab attention ${getItemStatus(item) === 'attention' ? 'active' : ''}" data-role="item-status" data-item-id="${item.id}" data-status="attention" aria-pressed="${getItemStatus(item) === 'attention'}">Atenção</button>
            </div>
            <label class="item-observation-field">
              Observação deste item
              <textarea
                data-role="item-observation"
                data-item-id="${item.id}"
                rows="2"
                placeholder="Adicione detalhes ou descreva o problema encontrado..."
                aria-label="Observação do item: ${escapeAttribute(item.text || '')}"
              >${escapeHtml(item.observation || '')}</textarea>
            </label>
            <button type="button" class="danger-btn" data-action="delete-item" data-item-id="${item.id}">Excluir</button>
          </li>
        `).join('')}
      </ul>

      <form id="add-item-form" class="add-item-form">
        <input type="text" id="new-item-input" placeholder="Adicionar item ao checklist" />
        <button type="submit" class="primary-btn">Adicionar</button>
      </form>

      <label class="field-block extra-notes-field">
        <span class="field-label-highlight">Observações extras</span>
        <textarea data-field="extraNotes" rows="3" placeholder="Descreva observações relevantes, ocorrências ou recomendações...">${escapeHtml(selectedChecklist.extraNotes || '')}</textarea>
      </label>

      <div class="finalization-box">
        <strong>Finalização do checklist</strong>
        <div class="detail-actions">
          <button type="button" class="primary-btn" data-action="finalize-checklist">Finalizar e salvar</button>
        </div>
      </div>
    </div>
  `;

  const addItemForm = document.getElementById('add-item-form');
  if (addItemForm) {
    addItemForm.addEventListener('submit', handleAddItemSubmit);
  }
  resizeItemTextareas();
}

function handleDocumentClick(event) {
  const checklistCard = event.target.closest('[data-checklist-card]');
  if (checklistCard) {
    const checklistId = checklistCard.dataset.checklistCard;
    state.selectedChecklistId = checklistId;
    renderDashboard();
    return;
  }

  if (event.target.dataset.role === 'item-status') {
    const checklist = getSelectedChecklist();
    const item = checklist?.items.find((entry) => entry.id === event.target.dataset.itemId);
    if (!checklist || !item) {
      return;
    }

    item.status = getItemStatus(item) === event.target.dataset.status
      ? 'pending'
      : event.target.dataset.status;
    checklist.updatedAt = new Date().toISOString();
    checklist.completed = checklist.items.length > 0
      && checklist.items.every((entry) => getItemStatus(entry) !== 'pending');
    persistChecklists();
    renderDashboard();
    return;
  }

  const action = event.target.dataset.action;
  if (!action) {
    return;
  }

  const checklist = getSelectedChecklist();
  if (!checklist) {
    return;
  }

  if (action === 'delete-item') {
    const itemId = event.target.dataset.itemId;
    deleteItemFromChecklist(checklist.id, itemId);
    return;
  }

  if (action === 'delete-checklist') {
    deleteChecklist(checklist.id);
    return;
  }

  if (action === 'finalize-checklist') {
    finalizeChecklist(checklist.id);
  }
}

function handleDocumentInput(event) {
  const field = event.target.dataset.field;
  if (field) {
    const checklist = getSelectedChecklist();
    if (!checklist) {
      return;
    }

    if (field === 'name') {
      checklist.name = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'description') {
      checklist.description = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'operatorName') {
      checklist.operatorName = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'equipmentName') {
      checklist.equipmentName = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'inspectionDate') {
      checklist.inspectionDate = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'inspectionTime') {
      checklist.inspectionTime = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'hourMeter') {
      checklist.hourMeter = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'extraNotes') {
      checklist.extraNotes = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    if (field === 'finalizationAction') {
      checklist.finalizationAction = event.target.value;
      checklist.updatedAt = new Date().toISOString();
    }

    persistChecklists();
    return;
  }

  if (event.target.dataset.role === 'item-text') {
    const checklist = getSelectedChecklist();
    const itemId = event.target.dataset.itemId;
    const item = checklist?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.text = event.target.value;
    checklist.updatedAt = new Date().toISOString();
    resizeTextarea(event.target);
    persistChecklists();
    return;
  }

  if (event.target.dataset.role === 'item-observation') {
    const checklist = getSelectedChecklist();
    const itemId = event.target.dataset.itemId;
    const item = checklist?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.observation = event.target.value;
    checklist.updatedAt = new Date().toISOString();
    resizeTextarea(event.target);
    persistChecklists();
  }
}

function resizeItemTextareas() {
  document.querySelectorAll('.item-row textarea').forEach(resizeTextarea);
}

function resizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function handleAddItemSubmit(event) {
  event.preventDefault();
  const checklist = getSelectedChecklist();
  const input = document.getElementById('new-item-input');
  const text = input.value.trim();

  if (!checklist) {
    showToast('Selecione um checklist para adicionar itens.');
    return;
  }

  if (!text) {
    showToast('Digite o nome do item antes de adicionar.');
    return;
  }

  checklist.items.push({
    id: generateId('item'),
    text,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  checklist.updatedAt = new Date().toISOString();
  checklist.completed = false;
  persistChecklists();
  input.value = '';
  renderDashboard();
}

function createChecklist() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast('Faça login para criar checklists.');
    return;
  }

  const userChecklists = getUserChecklists();
  const checklist = {
    id: generateId('checklist'),
    name: `Checklist ${userChecklists.length + 1}`,
    description: '',
    operatorName: '',
    equipmentName: '',
    inspectionDate: getTodayDate(),
    inspectionTime: getCurrentTime(),
    hourMeter: '',
    extraNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completed: false,
    items: [],
  };

  userChecklists.push(checklist);
  state.selectedChecklistId = checklist.id;
  persistChecklists();
  renderDashboard();
}

function deleteChecklist(checklistId) {
  const userChecklists = getUserChecklists();
  const listWithoutSelected = userChecklists.filter((item) => item.id !== checklistId);
  state.checklistsByUser[state.sessionUserId] = listWithoutSelected;

  if (state.selectedChecklistId === checklistId) {
    state.selectedChecklistId = listWithoutSelected[0]?.id || null;
  }

  persistChecklists();
  renderDashboard();
  showToast('Checklist excluído.');
}

function deleteItemFromChecklist(checklistId, itemId) {
  const checklist = getUserChecklists().find((item) => item.id === checklistId);
  if (!checklist) {
    return;
  }

  checklist.items = checklist.items.filter((item) => item.id !== itemId);
  checklist.updatedAt = new Date().toISOString();
  checklist.completed = checklist.items.length > 0
    && checklist.items.every((item) => getItemStatus(item) !== 'pending');
  persistChecklists();
  renderDashboard();
}

function finalizeChecklist(checklistId) {
  const checklist = getUserChecklists().find((item) => item.id === checklistId);
  if (!checklist) {
    return;
  }

  if (checklist.items.length === 0) {
    showToast('Adicione itens antes de finalizar o checklist.');
    return;
  }

  const hasPendingItems = checklist.items.some((item) => getItemStatus(item) === 'pending');
  if (hasPendingItems) {
    showToast('Avalie todos os itens como aprovado, reprovado ou atenção antes de finalizar.');
    return;
  }

  checklist.completed = true;
  checklist.updatedAt = new Date().toISOString();
  persistChecklists();
  renderDashboard();
  showToast('Checklist finalizado com sucesso!');
  generateReport(checklist);
}

function generateReport(checklist) {
  const total = checklist.items.length;
  const conforming = checklist.items.filter((item) => getItemStatus(item) === 'conforming').length;
  const nonconforming = checklist.items.filter((item) => getItemStatus(item) === 'nonconforming').length;
  const attention = checklist.items.filter((item) => getItemStatus(item) === 'attention').length;
  const pending = checklist.items.filter((item) => getItemStatus(item) === 'pending').length;
  const content = [
    `Checklist: ${checklist.name}`,
    `Operador: ${checklist.operatorName || 'Não informado'}`,
    `Máquina ou caminhão: ${checklist.equipmentName || 'Não informado'}`,
    `Data: ${checklist.inspectionDate || getTodayDate()}`,
    `Horário: ${checklist.inspectionTime || getCurrentTime()}`,
    `Horímetro: ${checklist.hourMeter || 'Não informado'}`,
    `Observações: ${checklist.extraNotes || 'Sem observações extras'}`,
    `Descrição: ${checklist.description || 'Sem descrição'}`,
    `Status da avaliação: ${checklist.completed ? 'Finalizada' : 'Em andamento'}`,
    `Itens totais: ${total}`,
    `Conformes: ${conforming}`,
    `Não conformes: ${nonconforming}`,
    `Atenção: ${attention}`,
    `Itens pendentes: ${pending}`,
    '',
    'Itens:',
    ...checklist.items.map((item) => {
      const statusLabel = {
        conforming: 'CONFORME',
        nonconforming: 'NÃO CONFORME',
        attention: 'ATENÇÃO',
        pending: 'PENDENTE',
      }[getItemStatus(item)];
      const observation = item.observation?.trim()
        ? `\n  Observação: ${item.observation.trim()}`
        : '';
      return `- [${statusLabel}] ${item.text}${observation}`;
    }),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(checklist.name || 'checklist')}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function calculateStats() {
  const checklists = getUserChecklists();
  const total = checklists.length;
  const completed = checklists.filter((checklist) => checklist.completed).length;
  const pending = checklists.filter((checklist) => !checklist.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, pending, progress };
}

function getFilteredChecklists() {
  const list = getUserChecklists();
  if (!state.search) {
    return list;
  }

  return list.filter((checklist) => checklist.name.toLowerCase().includes(state.search));
}

function getUserChecklists() {
  if (!state.sessionUserId) {
    return [];
  }
  return state.checklistsByUser[state.sessionUserId] || [];
}

function getSelectedChecklist() {
  return getUserChecklists().find((item) => item.id === state.selectedChecklistId) || null;
}

function getItemStatus(item) {
  if (['pending', 'conforming', 'nonconforming', 'attention'].includes(item.status)) {
    return item.status;
  }
  return item.done ? 'conforming' : 'pending';
}

function persistChecklists() {
  saveToStorage(STORAGE_KEYS.checklists, state.checklistsByUser);
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const buttons = document.querySelectorAll('[data-auth-tab]');

  const isLogin = tab === 'login';
  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);

  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.authTab === tab);
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    elements.toast.classList.remove('visible');
  }, 2500);
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.sessionUserId) || null;
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}-${Date.now().toString(36)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Hoje';
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'checklist';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}
