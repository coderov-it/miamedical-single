(() => {
  let app = 'website';
  let listMode = 'pages';
  let query = '';
  let rootId = '';
  const search = document.getElementById('search');
  const fileList = document.getElementById('file-list');
  const inspector = document.getElementById('inspector');
  const graph = new ComponentGraph(showDetails);

  function linkList(entries, emptyText) {
    if (!entries.length) return `<p class="empty-detail">${emptyText}</p>`;
    return `<div class="detail-list">${entries
      .map((entry) => {
        const node = byId.get(entry.target);
        let suffix = '';
        if (entry.kind === 'layout') suffix = ' · inherited layout';
        if (entry.kind === 'dynamic') suffix = ' · dynamic';
        return `<button data-focus="${escapeHtml(node.id)}"><span><strong>${escapeHtml(node.name)}</strong><small>${escapeHtml(node.id.split('/').slice(-2).join('/'))}${suffix}</small></span>${icon('arrow')}</button>`;
      })
      .join('')}</div>`;
  }

  function showDetails(id) {
    const node = byId.get(id);
    const parentCount = new Set(node.parents.map((parent) => parent.target)).size;
    let status = 'Reachable from pages';
    if (!node.reachable) status = 'Not reachable from pages';
    inspector.innerHTML = `<div class="inspector-heading"><span class="eyebrow">COMPONENT</span><span class="type-badge ${node.kind}">${kindLabels[node.kind]}</span></div>
      <div class="detail-title">${icon('code')}<h2>${escapeHtml(node.name)}</h2></div>
      <div class="file-path">${escapeHtml(node.id)}</div>
      <button class="copy-path" id="copy-path">Copy path <span>↗</span></button>
      <div class="detail-metrics"><div><strong>${node.children.length}</strong><span>Connections</span></div><div><strong>${parentCount}</strong><span>Used by</span></div><div><strong>${node.lines}</strong><span>Lines</span></div></div>
      <div class="reachability"><span class="live-dot"></span>${status}</div>
      <button id="focus-selected" class="primary-button">Explore from here ${icon('arrow')}</button>
      <div class="detail-section"><h3>Uses these components <span>${node.children.length}</span></h3>${linkList(node.children, 'No local child components found.')}</div>
      <div class="detail-section"><h3>Used by <span>${parentCount}</span></h3>${linkList(node.parents, 'No local components reference this file.')}</div>
      <details class="module-details"><summary>Local modules <span>${node.modules.length}</span></summary>${node.modules.map((file) => `<code>${escapeHtml(file)}</code>`).join('')}</details>
      <details class="module-details"><summary>External components <span>${node.external.length}</span></summary>${node.external.map((name) => `<code>${escapeHtml(name)}</code>`).join('')}</details>
      <details class="module-details"><summary>Unresolved references <span>${node.unresolved.length}</span></summary>${node.unresolved.map((name) => `<code>${escapeHtml(name)}</code>`).join('')}</details>`;
    document.getElementById('copy-path').onclick = async () => {
      try {
        await navigator.clipboard.writeText(node.id);
        document.getElementById('copy-path').textContent = 'Path copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(inspector.querySelector('.file-path'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.getElementById('status').textContent =
          'Path selected: press Ctrl+C or ⌘C to copy.';
      }
    };
    document.getElementById('focus-selected').onclick = () => chooseRoot(id);
  }

  function chooseRoot(id) {
    const node = byId.get(id);
    rootId = id;
    app = node.app;
    updateAppButtons();
    graph.setRoot(id);
    renderList();
    const url = new URL(location.href);
    url.hash = encodeURIComponent(id);
    history.replaceState(null, '', url);
  }

  function updateAppButtons() {
    document
      .querySelectorAll('[data-app]')
      .forEach((button) => button.setAttribute('aria-pressed', button.dataset.app === app));
  }

  function renderList() {
    const all = graphData.nodes.filter((node) => node.app === app);
    document.getElementById('page-count').textContent = all.filter(
      (node) => node.kind === 'page',
    ).length;
    document.getElementById('all-count').textContent = all.length;
    const onlyOrphans = document.getElementById('orphans').checked;
    const filtered = all
      .filter((node) => {
        if (query && !`${node.name} ${node.id} ${node.route ?? ''}`.toLowerCase().includes(query))
          return false;
        if (onlyOrphans) return !node.reachable;
        return Boolean(query) || listMode === 'all' || node.kind === 'page';
      })
      .sort((a, b) => {
        if (a.route === '/') return -1;
        if (b.route === '/') return 1;
        return a.name.localeCompare(b.name);
      });
    if (!filtered.length) {
      fileList.innerHTML = `<div class="list-empty">No files found.<br><span>Try another name or path.</span></div>`;
      return;
    }
    let group = '';
    fileList.innerHTML = filtered
      .map((node) => {
        let heading = '';
        let current = 'COMPONENTS';
        if (node.kind === 'page') current = 'PAGES';
        if (query || listMode === 'all' || onlyOrphans)
          current = node.id.split('/').slice(3, -1).join('/') || 'src';
        if (current !== group) {
          group = current;
          heading = `<div class="list-heading">${escapeHtml(group)}</div>`;
        }
        let className = 'file-item';
        if (node.id === rootId) className += ' active';
        let currentAttribute = '';
        if (node.id === rootId) currentAttribute = 'aria-current="true"';
        const subtitle = node.route ?? node.framework;
        return `${heading}<button class="${className}" data-focus="${escapeHtml(node.id)}" ${currentAttribute}><span class="file-icon ${node.kind}">${icon('branch')}</span><span class="file-copy"><strong>${escapeHtml(node.name)}</strong><small>${escapeHtml(subtitle)}</small></span><span class="file-count">${node.children.length}</span></button>`;
      })
      .join('');
  }

  document.querySelectorAll('[data-app]').forEach((button) => {
    button.onclick = () => {
      app = button.dataset.app;
      query = '';
      search.value = '';
      document.getElementById('orphans').checked = false;
      const home = graphData.nodes.find((node) => node.app === app && node.route === '/');
      chooseRoot(home.id);
    };
  });
  document.querySelectorAll('[data-list]').forEach((button) => {
    button.onclick = () => {
      listMode = button.dataset.list;
      document
        .querySelectorAll('[data-list]')
        .forEach((item) => item.setAttribute('aria-pressed', item === button));
      renderList();
    };
  });
  search.addEventListener('input', () => {
    query = search.value.trim().toLowerCase();
    renderList();
  });
  document.getElementById('orphans').onchange = renderList;
  for (const element of [fileList, inspector]) {
    element.addEventListener('click', (event) => {
      const button = event.target.closest('[data-focus]');
      if (button) chooseRoot(button.dataset.focus);
    });
  }
  document.getElementById('expand-level').onclick = () => graph.expandLevel();
  document.getElementById('collapse').onclick = () => {
    graph.expanded.clear();
    graph.render();
  };
  document.getElementById('zoom-out').onclick = () => graph.zoom(graph.scale - 0.15);
  document.getElementById('zoom-in').onclick = () => graph.zoom(graph.scale + 0.15);
  document.getElementById('fit-view').onclick = () => graph.fit();
  document.getElementById('toggle-inspector').onclick = (event) => {
    const button = event.currentTarget;
    const hidden = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !hidden);
    document.querySelector('.graph-and-inspector').classList.toggle('hide-inspector', hidden);
    if (!hidden && matchMedia('(max-width: 640px)').matches) setSidebar(false);
  };
  function setSidebar(open) {
    document.getElementById('sidebar').hidden = !open;
    document.getElementById('toggle-sidebar').setAttribute('aria-expanded', open);
    if (open && matchMedia('(max-width: 640px)').matches) {
      document.querySelector('.graph-and-inspector').classList.add('hide-inspector');
      document.getElementById('toggle-inspector').setAttribute('aria-expanded', false);
    }
  }
  document.getElementById('toggle-sidebar').onclick = () =>
    setSidebar(document.getElementById('sidebar').hidden);
  document.getElementById('close-sidebar').onclick = () => setSidebar(false);
  const dialog = document.getElementById('info-dialog');
  document.getElementById('show-info').onclick = () => dialog.showModal();
  document.getElementById('close-info').onclick = () => dialog.close();
  document.addEventListener('keydown', (event) => {
    if (
      event.key === '/' &&
      !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
      !dialog.open
    ) {
      event.preventDefault();
      setSidebar(true);
      search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === search) {
      search.value = '';
      query = '';
      renderList();
    }
  });
  let initialId = decodeURIComponent(location.hash.slice(1));
  if (!byId.has(initialId)) initialId = 'apps/website/src/pages/index.astro';
  chooseRoot(initialId);
})();
