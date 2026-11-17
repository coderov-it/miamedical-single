/* Native DOM/SVG rendering; the generated document works from file:// offline. */
const graphData = JSON.parse(document.getElementById('graph-data').textContent);
const byId = new Map(graphData.nodes.map((node) => [node.id, node]));
const kindLabels = {
  page: 'Page',
  layout: 'Layout',
  component: 'Component',
  primitive: 'Primitive',
};
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const icon = (name) => `<svg aria-hidden="true"><use href="#${name}" /></svg>`;

class ComponentGraph {
  constructor(onSelect) {
    this.viewport = document.getElementById('viewport');
    this.stage = document.getElementById('stage');
    this.nodeLayer = document.getElementById('nodes');
    this.edges = document.getElementById('connections');
    this.expanded = new Set();
    this.scale = 1;
    this.onSelect = onSelect;
    this.nodeLayer.addEventListener('click', (event) => {
      const button = event.target.closest('[data-node-key]');
      if (!button) return;
      const entry = this.visible.find((item) => item.key === button.dataset.nodeKey);
      this.anchorKey = entry.key;
      this.selected = entry.node.id;
      if (this.expanded.has(entry.key)) this.expanded.delete(entry.key);
      else if (!entry.cycle) this.expanded.add(entry.key);
      this.render();
      this.onSelect(entry.node.id);
      const replacement = [...this.nodeLayer.children].find(
        (item) => item.dataset.nodeKey === entry.key,
      );
      replacement?.focus({ preventScroll: true });
    });
    this.installPan();
    new ResizeObserver(() => this.render()).observe(this.viewport);
  }

  setRoot(id) {
    this.root = id;
    this.selected = id;
    this.expanded.clear();
    this.scale = 1;
    this.panX = null;
    this.panY = null;
    this.visible = [];
    this.anchorKey = 'root';
    this.render();
    this.onSelect(id);
  }

  render() {
    if (!this.root) return;
    const previousAnchor = this.visible?.find((entry) => entry.key === this.anchorKey);
    const visible = [];
    const links = [];
    let leaves = 0;
    let maxDepth = 0;
    this.truncated = false;
    const visit = (id, key, depth, ancestry, edge) => {
      if (visible.length >= 600) {
        this.truncated = true;
        return null;
      }
      const node = byId.get(id);
      const entry = { node, key, depth, edge, cycle: ancestry.has(id), x: 0, y: depth * 180 + 58 };
      visible.push(entry);
      maxDepth = Math.max(maxDepth, depth);
      const children = [];
      if (this.expanded.has(key) && !entry.cycle) {
        const next = new Set(ancestry).add(id);
        node.children.forEach((child, index) => {
          const result = visit(child.target, `${key}/${index}`, depth + 1, next, child);
          if (result) {
            children.push(result);
            links.push([entry, result]);
          }
        });
      }
      if (children.length) entry.x = (children[0].x + children[children.length - 1].x) / 2;
      else entry.x = leaves++ * 296 + 52;
      return entry;
    };
    visit(this.root, 'root', 0, new Set(), null);
    this.visible = visible;
    this.contentWidth = leaves * 296 + 56;
    this.contentHeight = maxDepth * 180 + 216;
    const width = this.contentWidth;
    const height = this.contentHeight;
    const anchor = visible.find((entry) => entry.key === this.anchorKey);
    if (this.panX === null) {
      this.panX = (this.viewport.clientWidth - width * this.scale) / 2;
      this.panY = Math.min(90, (this.viewport.clientHeight - height * this.scale) / 2);
    } else if (previousAnchor && anchor) {
      this.panX += (previousAnchor.x - anchor.x) * this.scale;
      this.panY += (previousAnchor.y - anchor.y) * this.scale;
    }
    for (const layer of [this.nodeLayer, this.edges]) {
      layer.style.width = `${width}px`;
      layer.style.height = `${height}px`;
    }
    this.applyTransform();
    this.edges.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.edges.innerHTML = links
      .map(([parent, child]) => {
        const x1 = parent.x + 124;
        const y1 = parent.y + 100;
        const x2 = child.x + 124;
        const y2 = child.y;
        let className = 'connection';
        if (child.edge.kind !== 'component') className += ' inherited';
        if (child.node.id === this.selected) className += ' highlighted';
        return `<path class="${className}" d="M ${x1} ${y1} C ${x1} ${y1 + 40}, ${x2} ${y2 - 40}, ${x2} ${y2}" />`;
      })
      .join('');
    this.nodeLayer.innerHTML = visible
      .map((entry) => {
        const { node, key, cycle } = entry;
        let className = `graph-node ${node.kind}`;
        if (node.id === this.selected) className += ' selected';
        const isOpen = this.expanded.has(key);
        const hasChildren = node.children.length > 0 && !cycle;
        let indicator = '·';
        if (hasChildren) indicator = '+';
        if (hasChildren && isOpen) indicator = '−';
        if (cycle) indicator = '↩';
        let subtitle = node.kind === 'page' ? node.route : node.id.split('/').slice(-2).join('/');
        if (entry.edge?.kind === 'layout') subtitle = 'Inherited layout · SvelteKit';
        if (entry.edge?.kind === 'dynamic') subtitle = 'Dynamic import';
        let label = `${node.name}, ${kindLabels[node.kind]}, ${node.children.length} connections`;
        if (cycle) label += ', recursive reference';
        let expandedAttribute = '';
        if (hasChildren) expandedAttribute = `aria-expanded="${isOpen}"`;
        return `<button class="${className}" data-node-key="${key}" data-file="${escapeHtml(node.id)}" style="left:${entry.x}px;top:${entry.y}px" ${expandedAttribute} aria-label="${escapeHtml(label)}" title="${escapeHtml(node.id)}">
        <span class="node-top"><span class="kind-label">${kindLabels[node.kind]}</span><span class="framework">${node.framework}</span></span>
        <span class="node-name">${escapeHtml(node.name)}</span><span class="node-subtitle">${escapeHtml(subtitle)}</span><span class="node-toggle">${indicator}</span>
      </button>`;
      })
      .join('');
    document.getElementById('zoom-label').textContent = `${Math.round(this.scale * 100)}%`;
    let message = 'Select a page. Explore one level at a time.';
    if (this.truncated)
      message = '600-node display limit. Collapse a branch or explore a component as the root.';
    document.getElementById('status').textContent = message;
  }

  expandLevel() {
    const candidates = this.visible.filter(
      (entry) => !entry.cycle && entry.node.children.length && !this.expanded.has(entry.key),
    );
    if (!candidates.length) {
      document.getElementById('status').textContent = 'All visible branches are already expanded.';
      return;
    }
    const depth = Math.min(...candidates.map((entry) => entry.depth));
    for (const entry of candidates) if (entry.depth === depth) this.expanded.add(entry.key);
    this.render();
  }

  zoom(scale) {
    const previous = this.scale;
    const centerX = this.viewport.clientWidth / 2;
    const centerY = this.viewport.clientHeight / 2;
    this.scale = Math.min(1.6, Math.max(0.25, scale));
    this.panX = centerX - ((centerX - this.panX) / previous) * this.scale;
    this.panY = centerY - ((centerY - this.panY) / previous) * this.scale;
    this.render();
  }

  fit() {
    const widthRatio = this.viewport.clientWidth / this.contentWidth;
    const heightRatio = this.viewport.clientHeight / this.contentHeight;
    this.scale = Math.max(0.25, Math.min(1, widthRatio, heightRatio));
    this.panX = (this.viewport.clientWidth - this.contentWidth * this.scale) / 2;
    this.panY = (this.viewport.clientHeight - this.contentHeight * this.scale) / 2;
    this.render();
  }

  applyTransform() {
    for (const layer of [this.nodeLayer, this.edges]) {
      layer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }
    this.viewport.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
  }

  installPan() {
    let drag;
    this.viewport.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button') || event.button !== 0) return;
      drag = {
        x: event.clientX,
        y: event.clientY,
        left: this.panX,
        top: this.panY,
      };
      this.viewport.setPointerCapture(event.pointerId);
      this.viewport.classList.add('panning');
    });
    this.viewport.addEventListener('pointermove', (event) => {
      if (!drag) return;
      this.panX = drag.left + event.clientX - drag.x;
      this.panY = drag.top + event.clientY - drag.y;
      this.applyTransform();
    });
    const stop = () => {
      drag = null;
      this.viewport.classList.remove('panning');
    };
    this.viewport.addEventListener('pointerup', stop);
    this.viewport.addEventListener('pointercancel', stop);
    this.viewport.addEventListener('lostpointercapture', stop);
    this.viewport.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          this.zoom(this.scale * Math.exp(-event.deltaY * 0.005));
          return;
        }
        this.panX -= event.deltaX;
        this.panY -= event.deltaY;
        this.applyTransform();
      },
      { passive: false },
    );
    this.viewport.addEventListener('keydown', (event) => {
      if (event.target !== this.viewport) return;
      const movement = {
        ArrowLeft: [60, 0],
        ArrowRight: [-60, 0],
        ArrowUp: [0, 60],
        ArrowDown: [0, -60],
      }[event.key];
      if (!movement) return;
      event.preventDefault();
      this.panX += movement[0];
      this.panY += movement[1];
      this.applyTransform();
    });
  }
}
