// node_modules/svelte/internal/index.mjs
function noop() {
}
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length2 = $$scope.ctx.length / 32;
    for (let i = 0; i < length2; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function exclude_internal_props(props) {
  const result = {};
  for (const k in props)
    if (k[0] !== "$")
      result[k] = props[k];
  return result;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
var tasks = new Set();
var is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function upper_bound(low, high, key, value) {
  while (low < high) {
    const mid = low + (high - low >> 1);
    if (key(mid) <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
function init_hydrate(target) {
  if (target.hydrate_init)
    return;
  target.hydrate_init = true;
  let children2 = target.childNodes;
  if (target.nodeName === "HEAD") {
    const myChildren = [];
    for (let i = 0; i < children2.length; i++) {
      const node = children2[i];
      if (node.claim_order !== void 0) {
        myChildren.push(node);
      }
    }
    children2 = myChildren;
  }
  const m = new Int32Array(children2.length + 1);
  const p = new Int32Array(children2.length);
  m[0] = -1;
  let longest = 0;
  for (let i = 0; i < children2.length; i++) {
    const current = children2[i].claim_order;
    const seqLen = (longest > 0 && children2[m[longest]].claim_order <= current ? longest + 1 : upper_bound(1, longest, (idx) => children2[m[idx]].claim_order, current)) - 1;
    p[i] = m[seqLen] + 1;
    const newLen = seqLen + 1;
    m[newLen] = i;
    longest = Math.max(newLen, longest);
  }
  const lis = [];
  const toMove = [];
  let last = children2.length - 1;
  for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
    lis.push(children2[cur - 1]);
    for (; last >= cur; last--) {
      toMove.push(children2[last]);
    }
    last--;
  }
  for (; last >= 0; last--) {
    toMove.push(children2[last]);
  }
  lis.reverse();
  toMove.sort((a, b) => a.claim_order - b.claim_order);
  for (let i = 0, j = 0; i < toMove.length; i++) {
    while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
      j++;
    }
    const anchor = j < lis.length ? lis[j] : null;
    target.insertBefore(toMove[i], anchor);
  }
}
function append(target, node) {
  target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);
  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element("style");
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
  return style.sheet;
}
function append_hydration(target, node) {
  if (is_hydrating) {
    init_hydrate(target);
    if (target.actual_end_child === void 0 || target.actual_end_child !== null && target.actual_end_child.parentNode !== target) {
      target.actual_end_child = target.firstChild;
    }
    while (target.actual_end_child !== null && target.actual_end_child.claim_order === void 0) {
      target.actual_end_child = target.actual_end_child.nextSibling;
    }
    if (node !== target.actual_end_child) {
      if (node.claim_order !== void 0 || node.parentNode !== target) {
        target.insertBefore(node, target.actual_end_child);
      }
    } else {
      target.actual_end_child = node.nextSibling;
    }
  } else if (node.parentNode !== target || node.nextSibling !== null) {
    target.appendChild(node);
  }
}
function insert_hydration(target, node, anchor) {
  if (is_hydrating && !anchor) {
    append_hydration(target, node);
  } else if (node.parentNode !== target || node.nextSibling != anchor) {
    target.insertBefore(node, anchor || null);
  }
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function listen(node, event2, handler, options) {
  node.addEventListener(event2, handler, options);
  return () => node.removeEventListener(event2, handler, options);
}
function prevent_default(fn) {
  return function(event2) {
    event2.preventDefault();
    return fn.call(this, event2);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
  const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
  for (const key in attributes) {
    if (attributes[key] == null) {
      node.removeAttribute(key);
    } else if (key === "style") {
      node.style.cssText = attributes[key];
    } else if (key === "__value") {
      node.value = node[key] = attributes[key];
    } else if (descriptors[key] && descriptors[key].set) {
      node[key] = attributes[key];
    } else {
      attr(node, key, attributes[key]);
    }
  }
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function init_claim_info(nodes) {
  if (nodes.claim_info === void 0) {
    nodes.claim_info = { last_index: 0, total_claimed: 0 };
  }
}
function claim_node(nodes, predicate, processNode, createNode, dontUpdateLastIndex = false) {
  init_claim_info(nodes);
  const resultNode = (() => {
    for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        }
        return node;
      }
    }
    for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
      const node = nodes[i];
      if (predicate(node)) {
        const replacement = processNode(node);
        if (replacement === void 0) {
          nodes.splice(i, 1);
        } else {
          nodes[i] = replacement;
        }
        if (!dontUpdateLastIndex) {
          nodes.claim_info.last_index = i;
        } else if (replacement === void 0) {
          nodes.claim_info.last_index--;
        }
        return node;
      }
    }
    return createNode();
  })();
  resultNode.claim_order = nodes.claim_info.total_claimed;
  nodes.claim_info.total_claimed += 1;
  return resultNode;
}
function claim_element_base(nodes, name, attributes, create_element) {
  return claim_node(nodes, (node) => node.nodeName === name, (node) => {
    const remove = [];
    for (let j = 0; j < node.attributes.length; j++) {
      const attribute = node.attributes[j];
      if (!attributes[attribute.name]) {
        remove.push(attribute.name);
      }
    }
    remove.forEach((v) => node.removeAttribute(v));
    return void 0;
  }, () => create_element(name));
}
function claim_element(nodes, name, attributes) {
  return claim_element_base(nodes, name, attributes, element);
}
function claim_svg_element(nodes, name, attributes) {
  return claim_element_base(nodes, name, attributes, svg_element);
}
function claim_text(nodes, data) {
  return claim_node(nodes, (node) => node.nodeType === 3, (node) => {
    const dataStr = "" + data;
    if (node.data.startsWith(dataStr)) {
      if (node.data.length !== dataStr.length) {
        return node.splitText(dataStr.length);
      }
    } else {
      node.data = dataStr;
    }
  }, () => text(data), true);
}
function claim_space(nodes) {
  return claim_text(nodes, " ");
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
var crossorigin;
function is_crossorigin() {
  if (crossorigin === void 0) {
    crossorigin = false;
    try {
      if (typeof window !== "undefined" && window.parent) {
        void window.parent.document;
      }
    } catch (error) {
      crossorigin = true;
    }
  }
  return crossorigin;
}
function add_resize_listener(node, fn) {
  const computed_style = getComputedStyle(node);
  if (computed_style.position === "static") {
    node.style.position = "relative";
  }
  const iframe = element("iframe");
  iframe.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  const crossorigin2 = is_crossorigin();
  let unsubscribe;
  if (crossorigin2) {
    iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}<\/script>";
    unsubscribe = listen(window, "message", (event2) => {
      if (event2.source === iframe.contentWindow)
        fn();
    });
  } else {
    iframe.src = "about:blank";
    iframe.onload = () => {
      unsubscribe = listen(iframe.contentWindow, "resize", fn);
    };
  }
  append(node, iframe);
  return () => {
    if (crossorigin2) {
      unsubscribe();
    } else if (unsubscribe && iframe.contentWindow) {
      unsubscribe();
    }
    detach(iframe);
  };
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
var managed_styles = new Map();
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event2 = custom_event(type, detail, { cancelable });
      callbacks.slice().forEach((fn) => {
        fn.call(component, event2);
      });
      return !event2.defaultPrevented;
    }
    return true;
  };
}
function bubble(component, event2) {
  const callbacks = component.$$.callbacks[event2.type];
  if (callbacks) {
    callbacks.slice().forEach((fn) => fn.call(this, event2));
  }
}
var dirty_components = [];
var binding_callbacks = [];
var render_callbacks = [];
var flush_callbacks = [];
var resolved_promise = Promise.resolve();
var update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
var seen_callbacks = new Set();
var flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
var outroing = new Set();
var outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
var globals = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : global;
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
var boolean_attributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
function create_component(block) {
  block && block.c();
}
function claim_component(block, parent_nodes) {
  block && block.l(parent_nodes);
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance6, create_fragment6, not_equal, props, append_styles2, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles2 && append_styles2($$.root);
  let ready = false;
  $$.ctx = instance6 ? instance6(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment6 ? create_fragment6($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr2, _oldValue, newValue) {
      this[attr2] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop;
    }
    $on(type, callback) {
      if (!is_function(callback)) {
        return noop;
      }
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}
var SvelteComponent = class {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
};

// node_modules/svelte-knob/src/Knob.svelte
function add_css(target) {
  append_styles(target, "svelte-lrqbdu", "@keyframes svelte-lrqbdu-dash-frame{100%{stroke-dashoffset:0}}.knob-control__range.svelte-lrqbdu{fill:none;transition:stroke .1s ease-in}.knob-control__value.svelte-lrqbdu{animation-name:svelte-lrqbdu-dash-frame;animation-fill-mode:forwards;fill:none}.knob-control__text-display.svelte-lrqbdu{font-size:1.3rem;text-align:center}");
}
function create_if_block(ctx) {
  let path;
  let text_1;
  let t;
  return {
    c() {
      path = svg_element("path");
      text_1 = svg_element("text");
      t = text(ctx[7]);
      this.h();
    },
    l(nodes) {
      path = claim_svg_element(nodes, "path", {
        d: true,
        "stroke-width": true,
        stroke: true,
        "data-dash": true,
        style: true,
        class: true
      });
      var path_nodes = children(path);
      path_nodes.forEach(detach);
      text_1 = claim_svg_element(nodes, "text", {
        x: true,
        y: true,
        "text-anchor": true,
        fill: true,
        class: true
      });
      var text_1_nodes = children(text_1);
      t = claim_text(text_1_nodes, ctx[7]);
      text_1_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path, "d", ctx[8]);
      attr(path, "stroke-width", ctx[4]);
      attr(path, "stroke", ctx[1]);
      attr(path, "data-dash", length);
      attr(path, "style", ctx[12]);
      attr(path, "class", "knob-control__value svelte-lrqbdu");
      attr(text_1, "x", "50");
      attr(text_1, "y", "57");
      attr(text_1, "text-anchor", "middle");
      attr(text_1, "fill", ctx[3]);
      attr(text_1, "class", "knob-control__text-display svelte-lrqbdu");
    },
    m(target, anchor) {
      insert_hydration(target, path, anchor);
      ctx[40](path);
      insert_hydration(target, text_1, anchor);
      append_hydration(text_1, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 256) {
        attr(path, "d", ctx2[8]);
      }
      if (dirty[0] & 16) {
        attr(path, "stroke-width", ctx2[4]);
      }
      if (dirty[0] & 2) {
        attr(path, "stroke", ctx2[1]);
      }
      if (dirty[0] & 4096) {
        attr(path, "style", ctx2[12]);
      }
      if (dirty[0] & 128)
        set_data(t, ctx2[7]);
      if (dirty[0] & 8) {
        attr(text_1, "fill", ctx2[3]);
      }
    },
    d(detaching) {
      if (detaching)
        detach(path);
      ctx[40](null);
      if (detaching)
        detach(text_1);
    }
  };
}
function create_fragment(ctx) {
  let div;
  let svg;
  let path;
  let mounted;
  let dispose;
  let if_block = ctx[0] && create_if_block(ctx);
  return {
    c() {
      div = element("div");
      svg = svg_element("svg");
      path = svg_element("path");
      if (if_block)
        if_block.c();
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true, style: true });
      var div_nodes = children(div);
      svg = claim_svg_element(div_nodes, "svg", { width: true, height: true, viewBox: true });
      var svg_nodes = children(svg);
      path = claim_svg_element(svg_nodes, "path", {
        d: true,
        "stroke-width": true,
        stroke: true,
        class: true
      });
      var path_nodes = children(path);
      path_nodes.forEach(detach);
      if (if_block)
        if_block.l(svg_nodes);
      svg_nodes.forEach(detach);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(path, "d", ctx[9]);
      attr(path, "stroke-width", ctx[4]);
      attr(path, "stroke", ctx[2]);
      attr(path, "class", "knob-control__range svelte-lrqbdu");
      attr(svg, "width", ctx[10]);
      attr(svg, "height", ctx[10]);
      attr(svg, "viewBox", "0 0 100 100");
      attr(div, "class", "knob-control");
      attr(div, "style", ctx[11]);
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      append_hydration(div, svg);
      append_hydration(svg, path);
      if (if_block)
        if_block.m(svg, null);
      ctx[41](div);
      if (!mounted) {
        dispose = [
          listen(svg, "click", ctx[13]),
          listen(svg, "mousedown", ctx[14]),
          listen(svg, "mouseup", ctx[15]),
          listen(svg, "touchstart", ctx[16]),
          listen(svg, "touchend", ctx[17])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 512) {
        attr(path, "d", ctx2[9]);
      }
      if (dirty[0] & 16) {
        attr(path, "stroke-width", ctx2[4]);
      }
      if (dirty[0] & 4) {
        attr(path, "stroke", ctx2[2]);
      }
      if (ctx2[0]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          if_block.m(svg, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if (dirty[0] & 1024) {
        attr(svg, "width", ctx2[10]);
      }
      if (dirty[0] & 1024) {
        attr(svg, "height", ctx2[10]);
      }
      if (dirty[0] & 2048) {
        attr(div, "style", ctx2[11]);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block)
        if_block.d();
      ctx[41](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
var RADIUS = 40;
var MID_X = 50;
var MID_Y = 50;
var length = 0;
function mapRange(x, inMin, inMax, outMin, outMax) {
  return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
function instance($$self, $$props, $$invalidate) {
  let dashStyle;
  let style;
  let computedSize;
  let rangePath;
  let valuePath;
  let zeroRadians;
  let valueRadians;
  let minX;
  let minY;
  let maxX;
  let maxY;
  let zeroX;
  let zeroY;
  let valueX;
  let valueY;
  let largeArc;
  let sweep;
  let valueDisplay;
  const MIN_RADIANS = 4 * Math.PI / 3;
  const MAX_RADIANS = -Math.PI / 3;
  let pathValue;
  let knob;
  let animatedValue = 0;
  let interval = null;
  let { animation = {
    animated: false,
    animateValue: false,
    animationDuration: 2e3,
    animationFunction: "ease-in-out"
  } } = $$props;
  let { value = 0 } = $$props;
  let { max = 100 } = $$props;
  let { min = 0 } = $$props;
  let { showValue = true } = $$props;
  let { disabled = false } = $$props;
  let { step = 1 } = $$props;
  let { size = 100 } = $$props;
  let { responsive = false } = $$props;
  let { primaryColor = "#409eff" } = $$props;
  let { secondaryColor = "#dcdfe6" } = $$props;
  let { textColor = "#000000" } = $$props;
  let { strokeWidth = 17 } = $$props;
  let { valueDisplayFunction = (v) => v } = $$props;
  onMount(async () => {
    dashLength();
    clearInterval(interval);
    interval = null;
    if (animation.animateValue) {
      interval = setInterval(() => {
        if (animatedValue < value) {
          $$invalidate(27, animatedValue += 1);
        } else {
          clearInterval(interval);
          interval = null;
        }
      }, animation.animationDuration * 1e3 / value / 1e3);
    }
  });
  function updatePosition(offsetX, offsetY) {
    const dx = offsetX - size / 2;
    const dy = size / 2 - offsetY;
    const angle = Math.atan2(dy, dx);
    let mappedValue;
    const start = -Math.PI / 2 - Math.PI / 6;
    if (angle > MAX_RADIANS) {
      mappedValue = mapRange(angle, MIN_RADIANS, MAX_RADIANS, min, max);
    } else if (angle < start) {
      mappedValue = mapRange(angle + 2 * Math.PI, MIN_RADIANS, MAX_RADIANS, min, max);
    } else {
      return;
    }
    $$invalidate(18, value = Math.round((mappedValue - min) / step) * step + min);
  }
  ;
  function onClick(e) {
    if (!disabled) {
      updatePosition(e.offsetX, e.offsetY);
    }
  }
  ;
  function onMouseDown(e) {
    if (!disabled) {
      e.preventDefault();
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  }
  ;
  function onMouseUp(e) {
    if (!disabled) {
      e.preventDefault();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
  }
  ;
  function onTouchStart(e) {
    if (!disabled) {
      e.preventDefault();
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onTouchEnd);
    }
  }
  ;
  function onTouchEnd(e) {
    if (!disabled) {
      e.preventDefault();
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    }
  }
  ;
  function onMouseMove(e) {
    if (!disabled) {
      e.preventDefault();
      updatePosition(e.offsetX, e.offsetY);
    }
  }
  ;
  function onTouchMove(e) {
    if (!disabled && e.touches.length == 1) {
      const boundingClientRect = knob.getBoundingClientRect();
      const touch = e.targetTouches.item(0);
      const offsetX = touch.clientX - boundingClientRect.left;
      const offsetY = touch.clientY - boundingClientRect.top;
      updatePosition(offsetX, offsetY);
    }
  }
  ;
  function dashLength() {
    let element2 = pathValue;
    let length2 = element2.getTotalLength();
    if (animation.animated) {
      element2.style.animationDuration = animation.animationDuration / 1e3 + "s";
      element2.style.animationFunction = animation.animationFunction;
    }
    element2.dataset.dash = length2;
    length2 = length2;
  }
  ;
  ;
  function path_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      pathValue = $$value;
      $$invalidate(5, pathValue);
    });
  }
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      knob = $$value;
      $$invalidate(6, knob);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("animation" in $$props2)
      $$invalidate(19, animation = $$props2.animation);
    if ("value" in $$props2)
      $$invalidate(18, value = $$props2.value);
    if ("max" in $$props2)
      $$invalidate(20, max = $$props2.max);
    if ("min" in $$props2)
      $$invalidate(21, min = $$props2.min);
    if ("showValue" in $$props2)
      $$invalidate(0, showValue = $$props2.showValue);
    if ("disabled" in $$props2)
      $$invalidate(22, disabled = $$props2.disabled);
    if ("step" in $$props2)
      $$invalidate(23, step = $$props2.step);
    if ("size" in $$props2)
      $$invalidate(24, size = $$props2.size);
    if ("responsive" in $$props2)
      $$invalidate(25, responsive = $$props2.responsive);
    if ("primaryColor" in $$props2)
      $$invalidate(1, primaryColor = $$props2.primaryColor);
    if ("secondaryColor" in $$props2)
      $$invalidate(2, secondaryColor = $$props2.secondaryColor);
    if ("textColor" in $$props2)
      $$invalidate(3, textColor = $$props2.textColor);
    if ("strokeWidth" in $$props2)
      $$invalidate(4, strokeWidth = $$props2.strokeWidth);
    if ("valueDisplayFunction" in $$props2)
      $$invalidate(26, valueDisplayFunction = $$props2.valueDisplayFunction);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & 50331648) {
      $:
        $$invalidate(11, style = "height:" + (responsive ? size + "%" : size - 5 + "px"));
    }
    if ($$self.$$.dirty[0] & 50331648) {
      $:
        $$invalidate(10, computedSize = responsive ? size + "%" : size);
    }
    if ($$self.$$.dirty[1] & 480) {
      $:
        $$invalidate(9, rangePath = `M ${minX} ${minY} A ${RADIUS} ${RADIUS} 0 1 1 ${maxX} ${maxY}`);
    }
    if ($$self.$$.dirty[0] & 3145728) {
      $:
        $$invalidate(28, zeroRadians = min > 0 && max > 0 ? mapRange(min, min, max, MIN_RADIANS, MAX_RADIANS) : mapRange(0, min, max, MIN_RADIANS, MAX_RADIANS));
    }
    if ($$self.$$.dirty[0] & 268435456) {
      $:
        $$invalidate(35, zeroX = MID_X + Math.cos(zeroRadians) * RADIUS);
    }
    if ($$self.$$.dirty[0] & 268435456) {
      $:
        $$invalidate(34, zeroY = MID_Y - Math.sin(zeroRadians) * RADIUS);
    }
    if ($$self.$$.dirty[0] & 3407872) {
      $:
        $$invalidate(29, valueRadians = mapRange(value, min, max, MIN_RADIANS, MAX_RADIANS));
    }
    if ($$self.$$.dirty[0] & 805306368) {
      $:
        $$invalidate(31, largeArc = Math.abs(zeroRadians - valueRadians) < Math.PI ? 0 : 1);
    }
    if ($$self.$$.dirty[0] & 805306368) {
      $:
        $$invalidate(30, sweep = valueRadians > zeroRadians ? 0 : 1);
    }
    if ($$self.$$.dirty[0] & 536870912) {
      $:
        $$invalidate(33, valueX = MID_X + Math.cos(valueRadians) * RADIUS);
    }
    if ($$self.$$.dirty[0] & 536870912) {
      $:
        $$invalidate(32, valueY = MID_Y - Math.sin(valueRadians) * RADIUS);
    }
    if ($$self.$$.dirty[0] & 1073741824 | $$self.$$.dirty[1] & 31) {
      $:
        $$invalidate(8, valuePath = `M ${zeroX} ${zeroY} A ${RADIUS} ${RADIUS} 0 ${largeArc} ${sweep} ${valueX} ${valueY}`);
    }
    if ($$self.$$.dirty[0] & 202113024) {
      $:
        $$invalidate(7, valueDisplay = animation.animateValue ? valueDisplayFunction(animatedValue) : valueDisplayFunction(value));
    }
  };
  $:
    $$invalidate(12, dashStyle = {
      strokeDasharray: length,
      strokeDashoffset: length
    });
  $:
    $$invalidate(39, minX = MID_X + Math.cos(MIN_RADIANS) * RADIUS);
  $:
    $$invalidate(38, minY = MID_Y - Math.sin(MIN_RADIANS) * RADIUS);
  $:
    $$invalidate(37, maxX = MID_X + Math.cos(MAX_RADIANS) * RADIUS);
  $:
    $$invalidate(36, maxY = MID_Y - Math.sin(MAX_RADIANS) * RADIUS);
  return [
    showValue,
    primaryColor,
    secondaryColor,
    textColor,
    strokeWidth,
    pathValue,
    knob,
    valueDisplay,
    valuePath,
    rangePath,
    computedSize,
    style,
    dashStyle,
    onClick,
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd,
    value,
    animation,
    max,
    min,
    disabled,
    step,
    size,
    responsive,
    valueDisplayFunction,
    animatedValue,
    zeroRadians,
    valueRadians,
    sweep,
    largeArc,
    valueY,
    valueX,
    zeroY,
    zeroX,
    maxY,
    maxX,
    minY,
    minX,
    path_binding,
    div_binding
  ];
}
var Knob = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {
      animation: 19,
      value: 18,
      max: 20,
      min: 21,
      showValue: 0,
      disabled: 22,
      step: 23,
      size: 24,
      responsive: 25,
      primaryColor: 1,
      secondaryColor: 2,
      textColor: 3,
      strokeWidth: 4,
      valueDisplayFunction: 26
    }, add_css, [-1, -1]);
  }
  get animation() {
    return this.$$.ctx[19];
  }
  set animation(animation) {
    this.$$set({ animation });
    flush();
  }
  get value() {
    return this.$$.ctx[18];
  }
  set value(value) {
    this.$$set({ value });
    flush();
  }
  get max() {
    return this.$$.ctx[20];
  }
  set max(max) {
    this.$$set({ max });
    flush();
  }
  get min() {
    return this.$$.ctx[21];
  }
  set min(min) {
    this.$$set({ min });
    flush();
  }
  get showValue() {
    return this.$$.ctx[0];
  }
  set showValue(showValue) {
    this.$$set({ showValue });
    flush();
  }
  get disabled() {
    return this.$$.ctx[22];
  }
  set disabled(disabled) {
    this.$$set({ disabled });
    flush();
  }
  get step() {
    return this.$$.ctx[23];
  }
  set step(step) {
    this.$$set({ step });
    flush();
  }
  get size() {
    return this.$$.ctx[24];
  }
  set size(size) {
    this.$$set({ size });
    flush();
  }
  get responsive() {
    return this.$$.ctx[25];
  }
  set responsive(responsive) {
    this.$$set({ responsive });
    flush();
  }
  get primaryColor() {
    return this.$$.ctx[1];
  }
  set primaryColor(primaryColor) {
    this.$$set({ primaryColor });
    flush();
  }
  get secondaryColor() {
    return this.$$.ctx[2];
  }
  set secondaryColor(secondaryColor) {
    this.$$set({ secondaryColor });
    flush();
  }
  get textColor() {
    return this.$$.ctx[3];
  }
  set textColor(textColor) {
    this.$$set({ textColor });
    flush();
  }
  get strokeWidth() {
    return this.$$.ctx[4];
  }
  set strokeWidth(strokeWidth) {
    this.$$set({ strokeWidth });
    flush();
  }
  get valueDisplayFunction() {
    return this.$$.ctx[26];
  }
  set valueDisplayFunction(valueDisplayFunction) {
    this.$$set({ valueDisplayFunction });
    flush();
  }
};
var Knob_default = Knob;

// node_modules/svelte-knob/src/index.js
var src_default = Knob_default;

// node_modules/fluent-svelte/Tooltip/TooltipSurface.svelte
function add_css2(target) {
  append_styles(target, "svelte-gc7m6k", ".tooltip.svelte-gc7m6k{align-items:center;background-clip:padding-box;background-color:var(--fds-solid-background-quarternary);border:1px solid var(--fds-surface-stroke-flyout);border-radius:var(--fds-control-corner-radius);box-shadow:var(--fds-tooltip-shadow);box-sizing:border-box;display:inline-flex;font-family:var(--fds-font-family-text);font-size:var(--fds-body-font-size);font-weight:400;inline-size:-webkit-max-content;inline-size:-moz-max-content;inline-size:max-content;justify-content:center;line-height:20px;max-inline-size:320px;padding-block:5px 7px;padding-inline:8px;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}");
}
function create_fragment2(ctx) {
  let div;
  let div_class_value;
  let forwardEvents_action;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[4], null);
  let div_levels = [
    {
      class: div_class_value = "tooltip " + ctx[1]
    },
    { role: "tooltip" },
    ctx[3]
  ];
  let div_data = {};
  for (let i = 0; i < div_levels.length; i += 1) {
    div_data = assign(div_data, div_levels[i]);
  }
  return {
    c() {
      div = element("div");
      if (default_slot)
        default_slot.c();
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true, role: true });
      var div_nodes = children(div);
      if (default_slot)
        default_slot.l(div_nodes);
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      set_attributes(div, div_data);
      toggle_class(div, "svelte-gc7m6k", true);
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      if (default_slot) {
        default_slot.m(div, null);
      }
      ctx[6](div);
      current = true;
      if (!mounted) {
        dispose = action_destroyer(forwardEvents_action = ctx[2].call(null, div));
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 16)) {
          update_slot_base(default_slot, default_slot_template, ctx2, ctx2[4], !current ? get_all_dirty_from_scope(ctx2[4]) : get_slot_changes(default_slot_template, ctx2[4], dirty, null), null);
        }
      }
      set_attributes(div, div_data = get_spread_update(div_levels, [
        (!current || dirty & 2 && div_class_value !== (div_class_value = "tooltip " + ctx2[1])) && { class: div_class_value },
        { role: "tooltip" },
        dirty & 8 && ctx2[3]
      ]));
      toggle_class(div, "svelte-gc7m6k", true);
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (default_slot)
        default_slot.d(detaching);
      ctx[6](null);
      mounted = false;
      dispose();
    }
  };
}
function instance2($$self, $$props, $$invalidate) {
  const omit_props_names = ["class", "element"];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let { $$slots: slots = {}, $$scope } = $$props;
  let { class: className = "" } = $$props;
  let { element: element2 = null } = $$props;
  const forwardEvents = createEventForwarder(get_current_component());
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      element2 = $$value;
      $$invalidate(0, element2);
    });
  }
  $$self.$$set = ($$new_props) => {
    $$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    $$invalidate(3, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("class" in $$new_props)
      $$invalidate(1, className = $$new_props.class);
    if ("element" in $$new_props)
      $$invalidate(0, element2 = $$new_props.element);
    if ("$$scope" in $$new_props)
      $$invalidate(4, $$scope = $$new_props.$$scope);
  };
  return [element2, className, forwardEvents, $$restProps, $$scope, slots, div_binding];
}
var TooltipSurface = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance2, create_fragment2, safe_not_equal, { class: 1, element: 0 }, add_css2);
  }
  get class() {
    return this.$$.ctx[1];
  }
  set class(className) {
    this.$$set({ class: className });
    flush();
  }
  get element() {
    return this.$$.ctx[0];
  }
  set element(element2) {
    this.$$set({ element: element2 });
    flush();
  }
};
var TooltipSurface_default = TooltipSurface;

// node_modules/fluent-svelte/internal.js
function createEventForwarder(component, exclude = []) {
  let $on;
  let events = [];
  component.$on = (eventType, callback) => {
    let destructor = () => {
    };
    if (exclude.includes(eventType)) {
      const callbacks = component.$$.callbacks[eventType] || (component.$$.callbacks[eventType] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    if ($on) {
      destructor = $on(eventType, callback);
    } else {
      events.push([eventType, callback]);
    }
    return () => destructor();
  };
  return (node) => {
    const destructors = [];
    const forwardDestructors = {};
    const forward = (e) => bubble(component, e);
    $on = (eventType, callback) => {
      let handler = callback;
      let options = false;
      const off = listen(node, eventType, handler, options);
      const destructor = () => {
        off();
        const idx = destructors.indexOf(destructor);
        if (idx > -1) {
          destructors.splice(idx, 1);
        }
      };
      destructors.push(destructor);
      if (!(eventType in forwardDestructors)) {
        forwardDestructors[eventType] = listen(node, eventType, forward);
      }
      return destructor;
    };
    for (const event2 of events) {
      $on(event2[0], event2[1]);
    }
    return {
      destroy: () => {
        for (const destructor of destructors) {
          destructor();
        }
        for (let entry of Object.entries(forwardDestructors)) {
          entry[1]();
        }
      }
    };
  };
}

// node_modules/fluent-svelte/Slider/Slider.svelte
var { window: window_1 } = globals;
function add_css3(target) {
  append_styles(target, "svelte-1ikqxku", '.slider.svelte-1ikqxku.svelte-1ikqxku{align-items:center;border-radius:var(--fds-control-corner-radius);display:flex;justify-content:center;min-block-size:32px;min-inline-size:32px;position:relative}.slider.svelte-1ikqxku>*{direction:ltr}.slider.svelte-1ikqxku.svelte-1ikqxku:focus-visible{box-shadow:var(--fds-focus-stroke);outline:none}.slider-thumb.svelte-1ikqxku:active .slider-tooltip,.slider.svelte-1ikqxku:active .slider-tooltip,.slider.svelte-1ikqxku:focus-visible .slider-tooltip{opacity:1}.slider.orientation-horizontal.svelte-1ikqxku.svelte-1ikqxku{block-size:32px;inline-size:100%}.slider.orientation-horizontal.svelte-1ikqxku .slider-rail.svelte-1ikqxku{block-size:4px;inline-size:100%;justify-content:flex-start}.slider.orientation-horizontal.svelte-1ikqxku .slider-track.svelte-1ikqxku{block-size:100%;inline-size:var(--fds-slider-percentage)}.slider.orientation-horizontal.svelte-1ikqxku .slider-thumb.svelte-1ikqxku{inset-inline-start:calc(var(--fds-slider-percentage) + var(--fds-slider-thumb-offset));transform:translateX(-50%)}.slider.orientation-horizontal.svelte-1ikqxku .slider-tick.svelte-1ikqxku{flex-direction:column;height:100%;inset-inline-start:var(--fds-slider-tick-percentage);padding:6px 0}.slider.orientation-horizontal.svelte-1ikqxku .slider-tick.svelte-1ikqxku:after,.slider.orientation-horizontal.svelte-1ikqxku .slider-tick.svelte-1ikqxku:before{-webkit-border-start:1px solid var(--fds-control-strong-fill-default);border-inline-start:1px solid var(--fds-control-strong-fill-default);height:4px;width:1px}.slider.orientation-horizontal.reverse.svelte-1ikqxku .slider-rail.svelte-1ikqxku{justify-content:flex-end}.slider.orientation-horizontal.reverse.svelte-1ikqxku .slider-thumb.svelte-1ikqxku{inset-inline-end:calc(var(--fds-slider-percentage) + var(--fds-slider-thumb-offset));inset-inline-start:unset;transform:translateX(50%)}.slider.orientation-horizontal.reverse.svelte-1ikqxku .slider-tick.svelte-1ikqxku{inset-inline-end:var(--fds-slider-tick-percentage);inset-inline-start:unset}.slider.orientation-vertical.svelte-1ikqxku.svelte-1ikqxku{block-size:100%;inline-size:32px}.slider.orientation-vertical.svelte-1ikqxku .slider-rail.svelte-1ikqxku{align-items:flex-end;block-size:100%;inline-size:4px}.slider.orientation-vertical.svelte-1ikqxku .slider-track.svelte-1ikqxku{block-size:var(--fds-slider-percentage);inline-size:100%}.slider.orientation-vertical.svelte-1ikqxku .slider-thumb.svelte-1ikqxku{inset-block-end:calc(var(--fds-slider-percentage) + var(--fds-slider-thumb-offset));transform:translateY(50%)}.slider.orientation-vertical.svelte-1ikqxku .slider-tick.svelte-1ikqxku{inset-block-end:var(--fds-slider-tick-percentage);padding:0 6px;width:100%}.slider.orientation-vertical.svelte-1ikqxku .slider-tick.svelte-1ikqxku:after,.slider.orientation-vertical.svelte-1ikqxku .slider-tick.svelte-1ikqxku:before{-webkit-border-before:1px solid var(--fds-control-strong-fill-default);border-block-start:1px solid var(--fds-control-strong-fill-default);height:1px;width:4px}.slider.orientation-vertical.reverse.svelte-1ikqxku .slider-rail.svelte-1ikqxku{align-items:flex-start}.slider.orientation-vertical.reverse.svelte-1ikqxku .slider-thumb.svelte-1ikqxku{inset-block-end:unset;inset-block-start:calc(var(--fds-slider-percentage) + var(--fds-slider-thumb-offset));transform:translateY(-50%)}.slider.orientation-vertical.reverse.svelte-1ikqxku .slider-tick.svelte-1ikqxku{inset-block-end:unset;inset-block-start:var(--fds-slider-tick-percentage)}.slider.disabled.svelte-1ikqxku .slider-rail.svelte-1ikqxku,.slider.disabled.svelte-1ikqxku .slider-thumb.svelte-1ikqxku:before,.slider.disabled.svelte-1ikqxku .slider-track.svelte-1ikqxku{background-color:var(--fds-accent-disabled)}.slider.disabled.svelte-1ikqxku .slider-thumb.svelte-1ikqxku:before{transform:none}.slider.disabled.svelte-1ikqxku .slider-tick.svelte-1ikqxku:after,.slider.disabled.svelte-1ikqxku .slider-tick.svelte-1ikqxku:before{border-color:var(--fds-control-fill-disabled)}.slider-rail.svelte-1ikqxku.svelte-1ikqxku{align-items:center;background-color:var(--fds-control-strong-fill-default);border-radius:50px;display:flex;overflow:hidden}.slider-track.svelte-1ikqxku.svelte-1ikqxku{background-color:var(--fds-accent-default)}.slider-tick-bar.svelte-1ikqxku.svelte-1ikqxku{height:100%;inset-block-start:0;inset-inline-start:0;position:absolute;width:100%;z-index:-1}.slider-tick-bar.placement-after.svelte-1ikqxku .slider-tick.svelte-1ikqxku:before,.slider-tick-bar.placement-before.svelte-1ikqxku .slider-tick.svelte-1ikqxku:after{visibility:hidden}.slider-tick.svelte-1ikqxku.svelte-1ikqxku{align-items:center;box-sizing:border-box;display:flex;justify-content:space-between;position:absolute}.slider-tick.svelte-1ikqxku.svelte-1ikqxku:after,.slider-tick.svelte-1ikqxku.svelte-1ikqxku:before{content:""}.slider-thumb.svelte-1ikqxku.svelte-1ikqxku{align-items:center;background-color:var(--fds-control-solid-fill-default);block-size:20px;box-shadow:0 0 0 1px var(--fds-control-stroke-default);display:flex;inline-size:20px;justify-content:center;z-index:10}.slider-thumb.svelte-1ikqxku.svelte-1ikqxku,.slider-thumb.svelte-1ikqxku.svelte-1ikqxku:before{border-radius:100%;position:absolute}.slider-thumb.svelte-1ikqxku.svelte-1ikqxku:before{background-color:var(--fds-accent-default);block-size:12px;content:"";inline-size:12px;transition:var(--fds-control-fast-duration) var(--fds-control-fast-out-slow-in-easing) transform}.slider-thumb.svelte-1ikqxku.svelte-1ikqxku:hover:before{transform:scale(1.167)}.slider-thumb.svelte-1ikqxku:hover .slider-tooltip{opacity:1;transition-delay:1s}.slider-thumb.svelte-1ikqxku.svelte-1ikqxku:active:before{background-color:var(--fds-accent-tertiary);transform:scale(.833)}.slider.svelte-1ikqxku .slider-tooltip{inset-block-end:calc(100% + 18px);inset-inline-start:50%;max-inline-size:unset;opacity:0;pointer-events:none;position:absolute;transform:translateX(-50%);transition:var(--fds-control-fast-duration) linear opacity;white-space:nowrap;z-index:100}');
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[46] = list[i];
  return child_ctx;
}
var get_tooltip_slot_changes = (dirty) => ({
  prefix: dirty[0] & 8192,
  suffix: dirty[0] & 16384,
  value: dirty[0] & 1
});
var get_tooltip_slot_context = (ctx) => ({
  prefix: ctx[13],
  suffix: ctx[14],
  value: ctx[0]
});
function create_if_block_2(ctx) {
  let tooltipsurface;
  let current;
  tooltipsurface = new TooltipSurface_default({
    props: {
      class: "slider-tooltip",
      $$slots: { default: [create_default_slot] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(tooltipsurface.$$.fragment);
    },
    l(nodes) {
      claim_component(tooltipsurface.$$.fragment, nodes);
    },
    m(target, anchor) {
      mount_component(tooltipsurface, target, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      const tooltipsurface_changes = {};
      if (dirty[0] & 24577 | dirty[1] & 4096) {
        tooltipsurface_changes.$$scope = { dirty, ctx: ctx2 };
      }
      tooltipsurface.$set(tooltipsurface_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(tooltipsurface.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(tooltipsurface.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(tooltipsurface, detaching);
    }
  };
}
function fallback_block(ctx) {
  let t0;
  let t1;
  let t2;
  return {
    c() {
      t0 = text(ctx[13]);
      t1 = text(ctx[0]);
      t2 = text(ctx[14]);
    },
    l(nodes) {
      t0 = claim_text(nodes, ctx[13]);
      t1 = claim_text(nodes, ctx[0]);
      t2 = claim_text(nodes, ctx[14]);
    },
    m(target, anchor) {
      insert_hydration(target, t0, anchor);
      insert_hydration(target, t1, anchor);
      insert_hydration(target, t2, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 8192)
        set_data(t0, ctx2[13]);
      if (dirty[0] & 1)
        set_data(t1, ctx2[0]);
      if (dirty[0] & 16384)
        set_data(t2, ctx2[14]);
    },
    d(detaching) {
      if (detaching)
        detach(t0);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(t2);
    }
  };
}
function create_default_slot(ctx) {
  let current;
  const tooltip_slot_template = ctx[34].tooltip;
  const tooltip_slot = create_slot(tooltip_slot_template, ctx, ctx[43], get_tooltip_slot_context);
  const tooltip_slot_or_fallback = tooltip_slot || fallback_block(ctx);
  return {
    c() {
      if (tooltip_slot_or_fallback)
        tooltip_slot_or_fallback.c();
    },
    l(nodes) {
      if (tooltip_slot_or_fallback)
        tooltip_slot_or_fallback.l(nodes);
    },
    m(target, anchor) {
      if (tooltip_slot_or_fallback) {
        tooltip_slot_or_fallback.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (tooltip_slot) {
        if (tooltip_slot.p && (!current || dirty[0] & 24577 | dirty[1] & 4096)) {
          update_slot_base(tooltip_slot, tooltip_slot_template, ctx2, ctx2[43], !current ? get_all_dirty_from_scope(ctx2[43]) : get_slot_changes(tooltip_slot_template, ctx2[43], dirty, get_tooltip_slot_changes), get_tooltip_slot_context);
        }
      } else {
        if (tooltip_slot_or_fallback && tooltip_slot_or_fallback.p && (!current || dirty[0] & 24577)) {
          tooltip_slot_or_fallback.p(ctx2, !current ? [-1, -1] : dirty);
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(tooltip_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(tooltip_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (tooltip_slot_or_fallback)
        tooltip_slot_or_fallback.d(detaching);
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      children(div).forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", "slider-track svelte-1ikqxku");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      ctx[37](div);
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(div);
      ctx[37](null);
    }
  };
}
function create_if_block2(ctx) {
  let div;
  let div_class_value;
  let each_value = ctx[10];
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  return {
    c() {
      div = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true });
      var div_nodes = children(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].l(div_nodes);
      }
      div_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", div_class_value = "slider-tick-bar placement-" + ctx[11] + " svelte-1ikqxku");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
      ctx[39](div);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 33555456) {
        each_value = ctx2[10];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(div, null);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (dirty[0] & 2048 && div_class_value !== (div_class_value = "slider-tick-bar placement-" + ctx2[11] + " svelte-1ikqxku")) {
        attr(div, "class", div_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
      ctx[39](null);
    }
  };
}
function create_each_block(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      this.h();
    },
    l(nodes) {
      div = claim_element(nodes, "DIV", { class: true, style: true });
      children(div).forEach(detach);
      this.h();
    },
    h() {
      attr(div, "class", "slider-tick svelte-1ikqxku");
      set_style(div, "--fds-slider-tick-percentage", ctx[25](ctx[46]) + "%");
    },
    m(target, anchor) {
      insert_hydration(target, div, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 1024) {
        set_style(div, "--fds-slider-tick-percentage", ctx2[25](ctx2[46]) + "%");
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment3(ctx) {
  let div2;
  let div0;
  let div0_resize_listener;
  let t0;
  let div1;
  let t1;
  let t2;
  let input;
  let div2_tabindex_value;
  let div2_style_value;
  let div2_class_value;
  let forwardEvents_action;
  let current;
  let mounted;
  let dispose;
  let if_block0 = ctx[12] && !ctx[17] && create_if_block_2(ctx);
  let if_block1 = ctx[15] && create_if_block_1(ctx);
  let if_block2 = ctx[10] && create_if_block2(ctx);
  let div2_levels = [
    {
      tabindex: div2_tabindex_value = ctx[17] ? -1 : 0
    },
    {
      style: div2_style_value = "--fds-slider-percentage: " + ctx[23] + "%; --fds-slider-thumb-offset: " + (ctx[22] / 2 - linearScale([0, 50], [0, ctx[22] / 2])(ctx[23])) + "px;"
    },
    {
      class: div2_class_value = "slider orientation-" + ctx[16] + " " + ctx[18]
    },
    ctx[30]
  ];
  let div2_data = {};
  for (let i = 0; i < div2_levels.length; i += 1) {
    div2_data = assign(div2_data, div2_levels[i]);
  }
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      div1 = element("div");
      if (if_block1)
        if_block1.c();
      t1 = space();
      if (if_block2)
        if_block2.c();
      t2 = space();
      input = element("input");
      this.h();
    },
    l(nodes) {
      div2 = claim_element(nodes, "DIV", { tabindex: true, style: true, class: true });
      var div2_nodes = children(div2);
      div0 = claim_element(div2_nodes, "DIV", {
        class: true,
        role: true,
        "aria-valuemin": true,
        "aria-valuemax": true,
        "aria-valuenow": true
      });
      var div0_nodes = children(div0);
      if (if_block0)
        if_block0.l(div0_nodes);
      div0_nodes.forEach(detach);
      t0 = claim_space(div2_nodes);
      div1 = claim_element(div2_nodes, "DIV", { class: true });
      var div1_nodes = children(div1);
      if (if_block1)
        if_block1.l(div1_nodes);
      div1_nodes.forEach(detach);
      t1 = claim_space(div2_nodes);
      if (if_block2)
        if_block2.l(div2_nodes);
      t2 = claim_space(div2_nodes);
      input = claim_element(div2_nodes, "INPUT", {
        type: true,
        min: true,
        max: true,
        step: true
      });
      div2_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "class", "slider-thumb svelte-1ikqxku");
      attr(div0, "role", "slider");
      attr(div0, "aria-valuemin", ctx[7]);
      attr(div0, "aria-valuemax", ctx[8]);
      attr(div0, "aria-valuenow", ctx[0]);
      add_render_callback(() => ctx[36].call(div0));
      attr(div1, "class", "slider-rail svelte-1ikqxku");
      attr(input, "type", "range");
      input.hidden = true;
      attr(input, "min", ctx[7]);
      attr(input, "max", ctx[8]);
      attr(input, "step", ctx[9]);
      input.disabled = ctx[17];
      input.value = ctx[0];
      set_attributes(div2, div2_data);
      toggle_class(div2, "disabled", ctx[17]);
      toggle_class(div2, "reverse", ctx[21]);
      toggle_class(div2, "svelte-1ikqxku", true);
    },
    m(target, anchor) {
      insert_hydration(target, div2, anchor);
      append_hydration(div2, div0);
      if (if_block0)
        if_block0.m(div0, null);
      ctx[35](div0);
      div0_resize_listener = add_resize_listener(div0, ctx[36].bind(div0));
      append_hydration(div2, t0);
      append_hydration(div2, div1);
      if (if_block1)
        if_block1.m(div1, null);
      ctx[38](div1);
      append_hydration(div2, t1);
      if (if_block2)
        if_block2.m(div2, null);
      append_hydration(div2, t2);
      append_hydration(div2, input);
      ctx[40](input);
      ctx[42](div2);
      current = true;
      if (!mounted) {
        dispose = [
          listen(window_1, "mousemove", ctx[27]),
          listen(window_1, "touchmove", ctx[27]),
          listen(window_1, "mouseup", ctx[26]),
          listen(window_1, "touchend", ctx[26]),
          listen(window_1, "touchcancel", ctx[26]),
          action_destroyer(forwardEvents_action = ctx[24].call(null, div2)),
          listen(div2, "mousedown", prevent_default(ctx[41])),
          listen(div2, "touchstart", ctx[29]),
          listen(div2, "keydown", ctx[28])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[12] && !ctx2[17]) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty[0] & 135168) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(div0, null);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (!current || dirty[0] & 128) {
        attr(div0, "aria-valuemin", ctx2[7]);
      }
      if (!current || dirty[0] & 256) {
        attr(div0, "aria-valuemax", ctx2[8]);
      }
      if (!current || dirty[0] & 1) {
        attr(div0, "aria-valuenow", ctx2[0]);
      }
      if (ctx2[15]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_1(ctx2);
          if_block1.c();
          if_block1.m(div1, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (ctx2[10]) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block2(ctx2);
          if_block2.c();
          if_block2.m(div2, t2);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (!current || dirty[0] & 128) {
        attr(input, "min", ctx2[7]);
      }
      if (!current || dirty[0] & 256) {
        attr(input, "max", ctx2[8]);
      }
      if (!current || dirty[0] & 512) {
        attr(input, "step", ctx2[9]);
      }
      if (!current || dirty[0] & 131072) {
        input.disabled = ctx2[17];
      }
      if (!current || dirty[0] & 1) {
        input.value = ctx2[0];
      }
      set_attributes(div2, div2_data = get_spread_update(div2_levels, [
        (!current || dirty[0] & 131072 && div2_tabindex_value !== (div2_tabindex_value = ctx2[17] ? -1 : 0)) && { tabindex: div2_tabindex_value },
        (!current || dirty[0] & 12582912 && div2_style_value !== (div2_style_value = "--fds-slider-percentage: " + ctx2[23] + "%; --fds-slider-thumb-offset: " + (ctx2[22] / 2 - linearScale([0, 50], [0, ctx2[22] / 2])(ctx2[23])) + "px;")) && { style: div2_style_value },
        (!current || dirty[0] & 327680 && div2_class_value !== (div2_class_value = "slider orientation-" + ctx2[16] + " " + ctx2[18])) && { class: div2_class_value },
        dirty[0] & 1073741824 && ctx2[30]
      ]));
      toggle_class(div2, "disabled", ctx2[17]);
      toggle_class(div2, "reverse", ctx2[21]);
      toggle_class(div2, "svelte-1ikqxku", true);
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block0);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if (if_block0)
        if_block0.d();
      ctx[35](null);
      div0_resize_listener();
      if (if_block1)
        if_block1.d();
      ctx[38](null);
      if (if_block2)
        if_block2.d();
      ctx[40](null);
      ctx[42](null);
      mounted = false;
      run_all(dispose);
    }
  };
}
function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1])
      return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}
function instance3($$self, $$props, $$invalidate) {
  let percentage;
  const omit_props_names = [
    "value",
    "min",
    "max",
    "step",
    "ticks",
    "tickPlacement",
    "tooltip",
    "prefix",
    "suffix",
    "track",
    "orientation",
    "reverse",
    "disabled",
    "class",
    "inputElement",
    "containerElement",
    "tickBarElement",
    "thumbElement",
    "railElement",
    "trackElement",
    "stepUp",
    "stepDown"
  ];
  let $$restProps = compute_rest_props($$props, omit_props_names);
  let { $$slots: slots = {}, $$scope } = $$props;
  let { value = 0 } = $$props;
  let { min = 0 } = $$props;
  let { max = 100 } = $$props;
  let { step = 1 } = $$props;
  let { ticks = [] } = $$props;
  let { tickPlacement = "around" } = $$props;
  let { tooltip = true } = $$props;
  let { prefix = "" } = $$props;
  let { suffix = "" } = $$props;
  let { track = true } = $$props;
  let { orientation = "horizontal" } = $$props;
  let { reverse = false } = $$props;
  let { disabled = false } = $$props;
  let { class: className = "" } = $$props;
  let { inputElement = null } = $$props;
  let { containerElement = null } = $$props;
  let { tickBarElement = null } = $$props;
  let { thumbElement = null } = $$props;
  let { railElement = null } = $$props;
  let { trackElement = null } = $$props;
  let dragging = false;
  let holding = false;
  let directionAwareReverse = false;
  let thumbClientWidth = 20;
  const dispatch = createEventDispatcher();
  const forwardEvents = createEventForwarder(get_current_component(), ["input", "change", "beforeinput"]);
  const valueToPercentage = (v) => (v - min) / (max - min) * 100;
  function cancelMove() {
    $$invalidate(20, holding = false);
    $$invalidate(19, dragging = false);
  }
  function handleMove() {
    if (holding)
      $$invalidate(19, dragging = true);
  }
  function calculateValue(event2) {
    if (disabled || !railElement)
      return;
    const { top, bottom, left, right, width, height } = railElement.getBoundingClientRect();
    const percentageX = event2.touches ? event2.touches[0].clientX : event2.clientX;
    const percentageY = event2.touches ? event2.touches[0].clientY : event2.clientY;
    const position = orientation === "horizontal" ? percentageX : percentageY;
    const startingPos = orientation === "horizontal" ? directionAwareReverse ? right : left : directionAwareReverse ? top : bottom;
    const length2 = orientation === "horizontal" ? width : height;
    let nextStep = min + Math.round((max - min) * ((position - startingPos) / length2) * (directionAwareReverse ? -1 : 1) * (orientation === "vertical" ? -1 : 1) / step) * step;
    if (nextStep <= min)
      nextStep = min;
    else if (nextStep >= max)
      nextStep = max;
    $$invalidate(0, value = nextStep);
  }
  function handleArrowKeys(event2) {
    const { key } = event2;
    if (key === "ArrowDown" || key === "ArrowUp")
      event2.preventDefault();
    if (key === "ArrowLeft" || key === "ArrowDown" && !disabled) {
      if (reverse) {
        stepUp();
      } else {
        stepDown();
      }
    } else if (key === "ArrowRight" || key === "ArrowUp" && !disabled) {
      if (reverse) {
        stepDown();
      } else {
        stepUp();
      }
    }
  }
  function handleTouchStart(event2) {
    if (event2.cancelable)
      event2.preventDefault();
    $$invalidate(20, holding = true);
  }
  function stepUp() {
    $$invalidate(0, value += step);
    if (value > max)
      $$invalidate(0, value = max);
  }
  function stepDown() {
    $$invalidate(0, value -= step);
    if (value < min)
      $$invalidate(0, value = min);
  }
  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      thumbElement = $$value;
      $$invalidate(4, thumbElement);
    });
  }
  function div0_elementresize_handler() {
    thumbClientWidth = this.clientWidth;
    $$invalidate(22, thumbClientWidth);
  }
  function div_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      trackElement = $$value;
      $$invalidate(6, trackElement);
    });
  }
  function div1_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      railElement = $$value;
      $$invalidate(5, railElement);
    });
  }
  function div_binding_1($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      tickBarElement = $$value;
      $$invalidate(3, tickBarElement);
    });
  }
  function input_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      inputElement = $$value;
      $$invalidate(2, inputElement);
    });
  }
  const mousedown_handler = () => {
    $$invalidate(20, holding = true);
    $$invalidate(19, dragging = true);
  };
  function div2_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      containerElement = $$value;
      $$invalidate(1, containerElement);
    });
  }
  $$self.$$set = ($$new_props) => {
    $$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    $$invalidate(30, $$restProps = compute_rest_props($$props, omit_props_names));
    if ("value" in $$new_props)
      $$invalidate(0, value = $$new_props.value);
    if ("min" in $$new_props)
      $$invalidate(7, min = $$new_props.min);
    if ("max" in $$new_props)
      $$invalidate(8, max = $$new_props.max);
    if ("step" in $$new_props)
      $$invalidate(9, step = $$new_props.step);
    if ("ticks" in $$new_props)
      $$invalidate(10, ticks = $$new_props.ticks);
    if ("tickPlacement" in $$new_props)
      $$invalidate(11, tickPlacement = $$new_props.tickPlacement);
    if ("tooltip" in $$new_props)
      $$invalidate(12, tooltip = $$new_props.tooltip);
    if ("prefix" in $$new_props)
      $$invalidate(13, prefix = $$new_props.prefix);
    if ("suffix" in $$new_props)
      $$invalidate(14, suffix = $$new_props.suffix);
    if ("track" in $$new_props)
      $$invalidate(15, track = $$new_props.track);
    if ("orientation" in $$new_props)
      $$invalidate(16, orientation = $$new_props.orientation);
    if ("reverse" in $$new_props)
      $$invalidate(31, reverse = $$new_props.reverse);
    if ("disabled" in $$new_props)
      $$invalidate(17, disabled = $$new_props.disabled);
    if ("class" in $$new_props)
      $$invalidate(18, className = $$new_props.class);
    if ("inputElement" in $$new_props)
      $$invalidate(2, inputElement = $$new_props.inputElement);
    if ("containerElement" in $$new_props)
      $$invalidate(1, containerElement = $$new_props.containerElement);
    if ("tickBarElement" in $$new_props)
      $$invalidate(3, tickBarElement = $$new_props.tickBarElement);
    if ("thumbElement" in $$new_props)
      $$invalidate(4, thumbElement = $$new_props.thumbElement);
    if ("railElement" in $$new_props)
      $$invalidate(5, railElement = $$new_props.railElement);
    if ("trackElement" in $$new_props)
      $$invalidate(6, trackElement = $$new_props.trackElement);
    if ("$$scope" in $$new_props)
      $$invalidate(43, $$scope = $$new_props.$$scope);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & 2 | $$self.$$.dirty[1] & 1) {
      $:
        if (containerElement) {
          $$invalidate(21, directionAwareReverse = (window === null || window === void 0 ? void 0 : window.getComputedStyle(containerElement).direction) === "ltr" ? reverse : !reverse);
        }
    }
    if ($$self.$$.dirty[0] & 524673) {
      $: {
        if (value <= min)
          $$invalidate(0, value = min);
        else if (value >= max)
          $$invalidate(0, value = max);
        if (dragging) {
          calculateValue(event);
          $$invalidate(19, dragging = false);
        }
      }
    }
    if ($$self.$$.dirty[0] & 1) {
      $:
        dispatch("change", value);
    }
    if ($$self.$$.dirty[0] & 1) {
      $:
        $$invalidate(23, percentage = valueToPercentage(value));
    }
  };
  return [
    value,
    containerElement,
    inputElement,
    tickBarElement,
    thumbElement,
    railElement,
    trackElement,
    min,
    max,
    step,
    ticks,
    tickPlacement,
    tooltip,
    prefix,
    suffix,
    track,
    orientation,
    disabled,
    className,
    dragging,
    holding,
    directionAwareReverse,
    thumbClientWidth,
    percentage,
    forwardEvents,
    valueToPercentage,
    cancelMove,
    handleMove,
    handleArrowKeys,
    handleTouchStart,
    $$restProps,
    reverse,
    stepUp,
    stepDown,
    slots,
    div0_binding,
    div0_elementresize_handler,
    div_binding,
    div1_binding,
    div_binding_1,
    input_binding,
    mousedown_handler,
    div2_binding,
    $$scope
  ];
}
var Slider = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance3, create_fragment3, safe_not_equal, {
      value: 0,
      min: 7,
      max: 8,
      step: 9,
      ticks: 10,
      tickPlacement: 11,
      tooltip: 12,
      prefix: 13,
      suffix: 14,
      track: 15,
      orientation: 16,
      reverse: 31,
      disabled: 17,
      class: 18,
      inputElement: 2,
      containerElement: 1,
      tickBarElement: 3,
      thumbElement: 4,
      railElement: 5,
      trackElement: 6,
      stepUp: 32,
      stepDown: 33
    }, add_css3, [-1, -1]);
  }
  get value() {
    return this.$$.ctx[0];
  }
  set value(value) {
    this.$$set({ value });
    flush();
  }
  get min() {
    return this.$$.ctx[7];
  }
  set min(min) {
    this.$$set({ min });
    flush();
  }
  get max() {
    return this.$$.ctx[8];
  }
  set max(max) {
    this.$$set({ max });
    flush();
  }
  get step() {
    return this.$$.ctx[9];
  }
  set step(step) {
    this.$$set({ step });
    flush();
  }
  get ticks() {
    return this.$$.ctx[10];
  }
  set ticks(ticks) {
    this.$$set({ ticks });
    flush();
  }
  get tickPlacement() {
    return this.$$.ctx[11];
  }
  set tickPlacement(tickPlacement) {
    this.$$set({ tickPlacement });
    flush();
  }
  get tooltip() {
    return this.$$.ctx[12];
  }
  set tooltip(tooltip) {
    this.$$set({ tooltip });
    flush();
  }
  get prefix() {
    return this.$$.ctx[13];
  }
  set prefix(prefix) {
    this.$$set({ prefix });
    flush();
  }
  get suffix() {
    return this.$$.ctx[14];
  }
  set suffix(suffix) {
    this.$$set({ suffix });
    flush();
  }
  get track() {
    return this.$$.ctx[15];
  }
  set track(track) {
    this.$$set({ track });
    flush();
  }
  get orientation() {
    return this.$$.ctx[16];
  }
  set orientation(orientation) {
    this.$$set({ orientation });
    flush();
  }
  get reverse() {
    return this.$$.ctx[31];
  }
  set reverse(reverse) {
    this.$$set({ reverse });
    flush();
  }
  get disabled() {
    return this.$$.ctx[17];
  }
  set disabled(disabled) {
    this.$$set({ disabled });
    flush();
  }
  get class() {
    return this.$$.ctx[18];
  }
  set class(className) {
    this.$$set({ class: className });
    flush();
  }
  get inputElement() {
    return this.$$.ctx[2];
  }
  set inputElement(inputElement) {
    this.$$set({ inputElement });
    flush();
  }
  get containerElement() {
    return this.$$.ctx[1];
  }
  set containerElement(containerElement) {
    this.$$set({ containerElement });
    flush();
  }
  get tickBarElement() {
    return this.$$.ctx[3];
  }
  set tickBarElement(tickBarElement) {
    this.$$set({ tickBarElement });
    flush();
  }
  get thumbElement() {
    return this.$$.ctx[4];
  }
  set thumbElement(thumbElement) {
    this.$$set({ thumbElement });
    flush();
  }
  get railElement() {
    return this.$$.ctx[5];
  }
  set railElement(railElement) {
    this.$$set({ railElement });
    flush();
  }
  get trackElement() {
    return this.$$.ctx[6];
  }
  set trackElement(trackElement) {
    this.$$set({ trackElement });
    flush();
  }
  get stepUp() {
    return this.$$.ctx[32];
  }
  get stepDown() {
    return this.$$.ctx[33];
  }
};
var Slider_default = Slider;

// node_modules/svelte/store/index.mjs
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update2(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update2, subscribe: subscribe2 };
}

// node_modules/fluent-svelte/MenuBar/flyoutState.js
var currentMenu = writable(null);

// synth.svelte
function add_css4(target) {
  append_styles(target, "svelte-tg3qw5", '@import url("https://unpkg.com/fluent-svelte/theme.css");:root{--fds-control-strong-fill-default:gray}.branding.svelte-tg3qw5>button.red.svelte-tg3qw5{background-color:tomato}.branding.svelte-tg3qw5>button.svelte-tg3qw5{font-size:100px;background-color:transparent;padding:12px}.branding.svelte-tg3qw5.svelte-tg3qw5{display:flex;justify-content:center;align-items:center}.flexline.svelte-tg3qw5.svelte-tg3qw5{display:flex;justify-content:space-evenly}.flexbox.svelte-tg3qw5.svelte-tg3qw5{display:flex;flex-direction:column;justify-content:flex-start;width:min-content;text-align:center}.flexbox.svelte-tg3qw5>.svelte-tg3qw5{width:auto;margin:5px auto}.container.svelte-tg3qw5>.svelte-tg3qw5{border:1px solid gray}.container.svelte-tg3qw5.svelte-tg3qw5{display:grid;grid-template-columns:200px 200px 200px 200px 200px 200px;grid-template-rows:200px 200px 150px 150px 150px;gap:0px 0px;grid-auto-flow:row;justify-content:center;align-content:center;justify-items:stretch;align-items:stretch;grid-template-areas:"osc1 osc1 branding branding adsr1 adsr1"\n      "osc2 osc2 vcf vcf adsr2 adsr2"\n      "sub noise hpf fine lfos voicing"\n      "reserved1 modMatrix modMatrix modMatrix modMatrix reverb"\n      "reserved2 modMatrix modMatrix modMatrix modMatrix delay"}.modMatrix.svelte-tg3qw5.svelte-tg3qw5{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr 1fr 1fr;gap:0px 0px;grid-auto-flow:row;justify-content:center;justify-items:stretch;align-items:stretch;grid-template-areas:". lfo1 lfo2 env1 env2 nw pb at math shape invert clip"\n      "_math . . . . . . . . . . ."\n      "_shape . . . . . . . . . . ."\n      "_invert . . . . . . . . . . ."\n      "_clip . . . . . . . . . . .";grid-area:modMatrix}.modMatrix.svelte-tg3qw5>.svelte-tg3qw5{border:1px dashed gray}.env1.svelte-tg3qw5.svelte-tg3qw5{grid-area:env1}.env2.svelte-tg3qw5.svelte-tg3qw5{grid-area:env2}._math.svelte-tg3qw5.svelte-tg3qw5{grid-area:_math}._shape.svelte-tg3qw5.svelte-tg3qw5{grid-area:_shape}._invert.svelte-tg3qw5.svelte-tg3qw5{grid-area:_invert}._clip.svelte-tg3qw5.svelte-tg3qw5{grid-area:_clip}.nw.svelte-tg3qw5.svelte-tg3qw5{grid-area:nw}.pb.svelte-tg3qw5.svelte-tg3qw5{grid-area:pb}.at.svelte-tg3qw5.svelte-tg3qw5{grid-area:at}.math.svelte-tg3qw5.svelte-tg3qw5{grid-area:math}.shape.svelte-tg3qw5.svelte-tg3qw5{grid-area:shape}.invert.svelte-tg3qw5.svelte-tg3qw5{grid-area:invert}.clip.svelte-tg3qw5.svelte-tg3qw5{grid-area:clip}.lfo1.svelte-tg3qw5.svelte-tg3qw5{grid-area:lfo1}.lfo2.svelte-tg3qw5.svelte-tg3qw5{grid-area:lfo2}.adsr1.svelte-tg3qw5.svelte-tg3qw5{grid-area:adsr1}.adsr2.svelte-tg3qw5.svelte-tg3qw5{grid-area:adsr2}.osc1.svelte-tg3qw5.svelte-tg3qw5{grid-area:osc1}.osc2.svelte-tg3qw5.svelte-tg3qw5{grid-area:osc2}.lfos.svelte-tg3qw5.svelte-tg3qw5{grid-area:lfos}.sub.svelte-tg3qw5.svelte-tg3qw5{grid-area:sub}.noise.svelte-tg3qw5.svelte-tg3qw5{grid-area:noise}.reverb.svelte-tg3qw5.svelte-tg3qw5{grid-area:reverb}.delay.svelte-tg3qw5.svelte-tg3qw5{grid-area:delay}.voicing.svelte-tg3qw5.svelte-tg3qw5{grid-area:voicing}.vcf.svelte-tg3qw5.svelte-tg3qw5{grid-area:vcf}.hpf.svelte-tg3qw5.svelte-tg3qw5{grid-area:hpf}.fine.svelte-tg3qw5.svelte-tg3qw5{grid-area:fine}.branding.svelte-tg3qw5.svelte-tg3qw5{grid-area:branding}.reserved1.svelte-tg3qw5.svelte-tg3qw5{grid-area:reserved1}.reserved2.svelte-tg3qw5.svelte-tg3qw5{grid-area:reserved2}button.svelte-tg3qw5.svelte-tg3qw5{font-size:12px;padding:4px}button.svelte-tg3qw5.svelte-tg3qw5:focus{background:tomato;color:white}button.pt.svelte-tg3qw5.svelte-tg3qw5{height:24px}');
}
function create_fragment4(ctx) {
  let div65;
  let div18;
  let div0;
  let t0;
  let t1;
  let div1;
  let t2;
  let div2;
  let t3;
  let div3;
  let t4;
  let div4;
  let t5;
  let div5;
  let t6;
  let div6;
  let t7;
  let div7;
  let t8;
  let div8;
  let t9;
  let div9;
  let t10;
  let div10;
  let t11;
  let div11;
  let t12;
  let div12;
  let t13;
  let div13;
  let t14;
  let div14;
  let t15;
  let div15;
  let t16;
  let div16;
  let t17;
  let div17;
  let t18;
  let t19;
  let div25;
  let t20;
  let div24;
  let div19;
  let slider0;
  let t21;
  let t22;
  let div20;
  let slider1;
  let t23;
  let t24;
  let div21;
  let slider2;
  let t25;
  let t26;
  let div22;
  let slider3;
  let t27;
  let t28;
  let div23;
  let button0;
  let t29;
  let t30;
  let button1;
  let t31;
  let t32;
  let div32;
  let t33;
  let div31;
  let div26;
  let slider4;
  let t34;
  let t35;
  let div27;
  let slider5;
  let t36;
  let t37;
  let div28;
  let slider6;
  let t38;
  let t39;
  let div29;
  let slider7;
  let t40;
  let t41;
  let div30;
  let button2;
  let t42;
  let t43;
  let button3;
  let t44;
  let t45;
  let div40;
  let t46;
  let div39;
  let div34;
  let knob0;
  let updating_value;
  let t47;
  let div33;
  let t48;
  let t49;
  let div36;
  let knob1;
  let t50;
  let div35;
  let t51;
  let t52;
  let div38;
  let knob2;
  let t53;
  let div37;
  let t54;
  let t55;
  let div48;
  let t56;
  let div47;
  let div42;
  let knob3;
  let updating_value_1;
  let t57;
  let div41;
  let t58;
  let t59;
  let button4;
  let t60;
  let t61;
  let div44;
  let knob4;
  let t62;
  let div43;
  let t63;
  let t64;
  let div46;
  let knob5;
  let t65;
  let div45;
  let t66;
  let t67;
  let div49;
  let t68;
  let div54;
  let t69;
  let div53;
  let div51;
  let knob6;
  let t70;
  let div50;
  let t71;
  let t72;
  let div52;
  let button5;
  let t73;
  let t74;
  let button6;
  let t75;
  let t76;
  let div55;
  let t77;
  let div56;
  let t78;
  let div57;
  let t79;
  let div58;
  let t80;
  let div59;
  let t81;
  let div60;
  let t82;
  let div61;
  let t83;
  let div62;
  let button7;
  let t84;
  let t85;
  let div63;
  let t86;
  let div64;
  let current;
  let mounted;
  let dispose;
  slider0 = new Slider_default({
    props: { orientation: "vertical", value: 24 }
  });
  slider1 = new Slider_default({
    props: { orientation: "vertical", value: 50 }
  });
  slider2 = new Slider_default({
    props: { orientation: "vertical", value: 76 }
  });
  slider3 = new Slider_default({
    props: { orientation: "vertical", value: 24 }
  });
  slider4 = new Slider_default({
    props: { orientation: "vertical", value: 24 }
  });
  slider5 = new Slider_default({
    props: { orientation: "vertical", value: 50 }
  });
  slider6 = new Slider_default({
    props: { orientation: "vertical", value: 76 }
  });
  slider7 = new Slider_default({
    props: { orientation: "vertical", value: 24 }
  });
  function knob0_value_binding(value) {
    ctx[7](value);
  }
  let knob0_props = {
    min: ctx[3]?.freq?.annotation?.min,
    max: ctx[3]?.freq?.annotation?.max,
    step: 10,
    strokeWidth: 10,
    primaryColor: "#E844C3"
  };
  if (ctx[0] !== void 0) {
    knob0_props.value = ctx[0];
  }
  knob0 = new src_default({ props: knob0_props });
  binding_callbacks.push(() => bind(knob0, "value", knob0_value_binding));
  knob1 = new src_default({
    props: {
      value: 0,
      min: 0,
      max: 4,
      step: 1,
      strokeWidth: 10,
      primaryColor: "#E844C3",
      valueDisplayFunction: ctx[8]
    }
  });
  knob2 = new src_default({
    props: {
      value: 12,
      min: -60,
      max: 60,
      step: 1,
      strokeWidth: 10,
      primaryColor: "#E844C3"
    }
  });
  function knob3_value_binding(value) {
    ctx[9](value);
  }
  let knob3_props = {
    min: ctx[4]?.freq?.annotation?.min,
    max: ctx[4]?.freq?.annotation?.max,
    step: 10,
    strokeWidth: 10,
    primaryColor: "#E844C3"
  };
  if (ctx[1] !== void 0) {
    knob3_props.value = ctx[1];
  }
  knob3 = new src_default({ props: knob3_props });
  binding_callbacks.push(() => bind(knob3, "value", knob3_value_binding));
  knob4 = new src_default({
    props: {
      value: 0,
      min: 0,
      max: 4,
      step: 1,
      strokeWidth: 10,
      primaryColor: "#E844C3",
      valueDisplayFunction: ctx[10]
    }
  });
  knob5 = new src_default({
    props: {
      value: 12,
      min: -60,
      max: 60,
      step: 1,
      strokeWidth: 10,
      primaryColor: "#E844C3"
    }
  });
  knob6 = new src_default({
    props: {
      value: 12,
      min: -60,
      max: 60,
      step: 1,
      strokeWidth: 10,
      primaryColor: "#E844C3"
    }
  });
  return {
    c() {
      div65 = element("div");
      div18 = element("div");
      div0 = element("div");
      t0 = text("d");
      t1 = space();
      div1 = element("div");
      t2 = space();
      div2 = element("div");
      t3 = space();
      div3 = element("div");
      t4 = space();
      div4 = element("div");
      t5 = space();
      div5 = element("div");
      t6 = space();
      div6 = element("div");
      t7 = space();
      div7 = element("div");
      t8 = space();
      div8 = element("div");
      t9 = space();
      div9 = element("div");
      t10 = space();
      div10 = element("div");
      t11 = space();
      div11 = element("div");
      t12 = space();
      div12 = element("div");
      t13 = space();
      div13 = element("div");
      t14 = space();
      div14 = element("div");
      t15 = space();
      div15 = element("div");
      t16 = space();
      div16 = element("div");
      t17 = space();
      div17 = element("div");
      t18 = text("X");
      t19 = space();
      div25 = element("div");
      t20 = text("ENV1\n			");
      div24 = element("div");
      div19 = element("div");
      create_component(slider0.$$.fragment);
      t21 = text("A");
      t22 = space();
      div20 = element("div");
      create_component(slider1.$$.fragment);
      t23 = text("D");
      t24 = space();
      div21 = element("div");
      create_component(slider2.$$.fragment);
      t25 = text("S");
      t26 = space();
      div22 = element("div");
      create_component(slider3.$$.fragment);
      t27 = text("R");
      t28 = space();
      div23 = element("div");
      button0 = element("button");
      t29 = text("snap");
      t30 = space();
      button1 = element("button");
      t31 = text("slow");
      t32 = space();
      div32 = element("div");
      t33 = text("ENV2\n			");
      div31 = element("div");
      div26 = element("div");
      create_component(slider4.$$.fragment);
      t34 = text("A");
      t35 = space();
      div27 = element("div");
      create_component(slider5.$$.fragment);
      t36 = text("D");
      t37 = space();
      div28 = element("div");
      create_component(slider6.$$.fragment);
      t38 = text("S");
      t39 = space();
      div29 = element("div");
      create_component(slider7.$$.fragment);
      t40 = text("R");
      t41 = space();
      div30 = element("div");
      button2 = element("button");
      t42 = text("snap");
      t43 = space();
      button3 = element("button");
      t44 = text("slow");
      t45 = space();
      div40 = element("div");
      t46 = text("OSC1\n			");
      div39 = element("div");
      div34 = element("div");
      create_component(knob0.$$.fragment);
      t47 = space();
      div33 = element("div");
      t48 = text("Tuning");
      t49 = space();
      div36 = element("div");
      create_component(knob1.$$.fragment);
      t50 = space();
      div35 = element("div");
      t51 = text("Shape");
      t52 = space();
      div38 = element("div");
      create_component(knob2.$$.fragment);
      t53 = space();
      div37 = element("div");
      t54 = text("Volume");
      t55 = space();
      div48 = element("div");
      t56 = text("OSC2\n			");
      div47 = element("div");
      div42 = element("div");
      create_component(knob3.$$.fragment);
      t57 = space();
      div41 = element("div");
      t58 = text("Tuning");
      t59 = space();
      button4 = element("button");
      t60 = text("sync");
      t61 = space();
      div44 = element("div");
      create_component(knob4.$$.fragment);
      t62 = space();
      div43 = element("div");
      t63 = text("Shape");
      t64 = space();
      div46 = element("div");
      create_component(knob5.$$.fragment);
      t65 = space();
      div45 = element("div");
      t66 = text("Volume");
      t67 = space();
      div49 = element("div");
      t68 = space();
      div54 = element("div");
      t69 = text("SUB\n				");
      div53 = element("div");
      div51 = element("div");
      create_component(knob6.$$.fragment);
      t70 = space();
      div50 = element("div");
      t71 = text("Volume");
      t72 = space();
      div52 = element("div");
      button5 = element("button");
      t73 = text("8vb");
      t74 = space();
      button6 = element("button");
      t75 = text("square");
      t76 = space();
      div55 = element("div");
      t77 = space();
      div56 = element("div");
      t78 = space();
      div57 = element("div");
      t79 = space();
      div58 = element("div");
      t80 = space();
      div59 = element("div");
      t81 = space();
      div60 = element("div");
      t82 = space();
      div61 = element("div");
      t83 = space();
      div62 = element("div");
      button7 = element("button");
      t84 = text("GATE");
      t85 = space();
      div63 = element("div");
      t86 = space();
      div64 = element("div");
      this.h();
    },
    l(nodes) {
      div65 = claim_element(nodes, "DIV", { class: true });
      var div65_nodes = children(div65);
      div18 = claim_element(div65_nodes, "DIV", { class: true });
      var div18_nodes = children(div18);
      div0 = claim_element(div18_nodes, "DIV", { class: true });
      var div0_nodes = children(div0);
      t0 = claim_text(div0_nodes, "d");
      div0_nodes.forEach(detach);
      t1 = claim_space(div18_nodes);
      div1 = claim_element(div18_nodes, "DIV", { class: true });
      children(div1).forEach(detach);
      t2 = claim_space(div18_nodes);
      div2 = claim_element(div18_nodes, "DIV", { class: true });
      children(div2).forEach(detach);
      t3 = claim_space(div18_nodes);
      div3 = claim_element(div18_nodes, "DIV", { class: true });
      children(div3).forEach(detach);
      t4 = claim_space(div18_nodes);
      div4 = claim_element(div18_nodes, "DIV", { class: true });
      children(div4).forEach(detach);
      t5 = claim_space(div18_nodes);
      div5 = claim_element(div18_nodes, "DIV", { class: true });
      children(div5).forEach(detach);
      t6 = claim_space(div18_nodes);
      div6 = claim_element(div18_nodes, "DIV", { class: true });
      children(div6).forEach(detach);
      t7 = claim_space(div18_nodes);
      div7 = claim_element(div18_nodes, "DIV", { class: true });
      children(div7).forEach(detach);
      t8 = claim_space(div18_nodes);
      div8 = claim_element(div18_nodes, "DIV", { class: true });
      children(div8).forEach(detach);
      t9 = claim_space(div18_nodes);
      div9 = claim_element(div18_nodes, "DIV", { class: true });
      children(div9).forEach(detach);
      t10 = claim_space(div18_nodes);
      div10 = claim_element(div18_nodes, "DIV", { class: true });
      children(div10).forEach(detach);
      t11 = claim_space(div18_nodes);
      div11 = claim_element(div18_nodes, "DIV", { class: true });
      children(div11).forEach(detach);
      t12 = claim_space(div18_nodes);
      div12 = claim_element(div18_nodes, "DIV", { class: true });
      children(div12).forEach(detach);
      t13 = claim_space(div18_nodes);
      div13 = claim_element(div18_nodes, "DIV", { class: true });
      children(div13).forEach(detach);
      t14 = claim_space(div18_nodes);
      div14 = claim_element(div18_nodes, "DIV", { class: true });
      children(div14).forEach(detach);
      t15 = claim_space(div18_nodes);
      div15 = claim_element(div18_nodes, "DIV", { class: true });
      var div15_nodes = children(div15);
      div15_nodes.forEach(detach);
      t16 = claim_space(div18_nodes);
      div16 = claim_element(div18_nodes, "DIV", { class: true });
      var div16_nodes = children(div16);
      div16_nodes.forEach(detach);
      t17 = claim_space(div18_nodes);
      div17 = claim_element(div18_nodes, "DIV", { style: true, class: true });
      var div17_nodes = children(div17);
      t18 = claim_text(div17_nodes, "X");
      div17_nodes.forEach(detach);
      div18_nodes.forEach(detach);
      t19 = claim_space(div65_nodes);
      div25 = claim_element(div65_nodes, "DIV", { class: true });
      var div25_nodes = children(div25);
      t20 = claim_text(div25_nodes, "ENV1\n			");
      div24 = claim_element(div25_nodes, "DIV", { class: true, style: true });
      var div24_nodes = children(div24);
      div19 = claim_element(div24_nodes, "DIV", { class: true });
      var div19_nodes = children(div19);
      claim_component(slider0.$$.fragment, div19_nodes);
      t21 = claim_text(div19_nodes, "A");
      div19_nodes.forEach(detach);
      t22 = claim_space(div24_nodes);
      div20 = claim_element(div24_nodes, "DIV", { class: true });
      var div20_nodes = children(div20);
      claim_component(slider1.$$.fragment, div20_nodes);
      t23 = claim_text(div20_nodes, "D");
      div20_nodes.forEach(detach);
      t24 = claim_space(div24_nodes);
      div21 = claim_element(div24_nodes, "DIV", { class: true });
      var div21_nodes = children(div21);
      claim_component(slider2.$$.fragment, div21_nodes);
      t25 = claim_text(div21_nodes, "S");
      div21_nodes.forEach(detach);
      t26 = claim_space(div24_nodes);
      div22 = claim_element(div24_nodes, "DIV", { class: true });
      var div22_nodes = children(div22);
      claim_component(slider3.$$.fragment, div22_nodes);
      t27 = claim_text(div22_nodes, "R");
      div22_nodes.forEach(detach);
      t28 = claim_space(div24_nodes);
      div23 = claim_element(div24_nodes, "DIV", { class: true });
      var div23_nodes = children(div23);
      button0 = claim_element(div23_nodes, "BUTTON", { class: true, state: true });
      var button0_nodes = children(button0);
      t29 = claim_text(button0_nodes, "snap");
      button0_nodes.forEach(detach);
      t30 = claim_space(div23_nodes);
      button1 = claim_element(div23_nodes, "BUTTON", { class: true, state: true });
      var button1_nodes = children(button1);
      t31 = claim_text(button1_nodes, "slow");
      button1_nodes.forEach(detach);
      div23_nodes.forEach(detach);
      div24_nodes.forEach(detach);
      div25_nodes.forEach(detach);
      t32 = claim_space(div65_nodes);
      div32 = claim_element(div65_nodes, "DIV", { class: true });
      var div32_nodes = children(div32);
      t33 = claim_text(div32_nodes, "ENV2\n			");
      div31 = claim_element(div32_nodes, "DIV", { class: true, style: true });
      var div31_nodes = children(div31);
      div26 = claim_element(div31_nodes, "DIV", { class: true });
      var div26_nodes = children(div26);
      claim_component(slider4.$$.fragment, div26_nodes);
      t34 = claim_text(div26_nodes, "A");
      div26_nodes.forEach(detach);
      t35 = claim_space(div31_nodes);
      div27 = claim_element(div31_nodes, "DIV", { class: true });
      var div27_nodes = children(div27);
      claim_component(slider5.$$.fragment, div27_nodes);
      t36 = claim_text(div27_nodes, "D");
      div27_nodes.forEach(detach);
      t37 = claim_space(div31_nodes);
      div28 = claim_element(div31_nodes, "DIV", { class: true });
      var div28_nodes = children(div28);
      claim_component(slider6.$$.fragment, div28_nodes);
      t38 = claim_text(div28_nodes, "S");
      div28_nodes.forEach(detach);
      t39 = claim_space(div31_nodes);
      div29 = claim_element(div31_nodes, "DIV", { class: true });
      var div29_nodes = children(div29);
      claim_component(slider7.$$.fragment, div29_nodes);
      t40 = claim_text(div29_nodes, "R");
      div29_nodes.forEach(detach);
      t41 = claim_space(div31_nodes);
      div30 = claim_element(div31_nodes, "DIV", { class: true });
      var div30_nodes = children(div30);
      button2 = claim_element(div30_nodes, "BUTTON", { class: true, state: true });
      var button2_nodes = children(button2);
      t42 = claim_text(button2_nodes, "snap");
      button2_nodes.forEach(detach);
      t43 = claim_space(div30_nodes);
      button3 = claim_element(div30_nodes, "BUTTON", { class: true, state: true });
      var button3_nodes = children(button3);
      t44 = claim_text(button3_nodes, "slow");
      button3_nodes.forEach(detach);
      div30_nodes.forEach(detach);
      div31_nodes.forEach(detach);
      div32_nodes.forEach(detach);
      t45 = claim_space(div65_nodes);
      div40 = claim_element(div65_nodes, "DIV", { class: true });
      var div40_nodes = children(div40);
      t46 = claim_text(div40_nodes, "OSC1\n			");
      div39 = claim_element(div40_nodes, "DIV", { class: true });
      var div39_nodes = children(div39);
      div34 = claim_element(div39_nodes, "DIV", { class: true });
      var div34_nodes = children(div34);
      claim_component(knob0.$$.fragment, div34_nodes);
      t47 = claim_space(div34_nodes);
      div33 = claim_element(div34_nodes, "DIV", { class: true });
      var div33_nodes = children(div33);
      t48 = claim_text(div33_nodes, "Tuning");
      div33_nodes.forEach(detach);
      div34_nodes.forEach(detach);
      t49 = claim_space(div39_nodes);
      div36 = claim_element(div39_nodes, "DIV", { class: true });
      var div36_nodes = children(div36);
      claim_component(knob1.$$.fragment, div36_nodes);
      t50 = claim_space(div36_nodes);
      div35 = claim_element(div36_nodes, "DIV", { class: true });
      var div35_nodes = children(div35);
      t51 = claim_text(div35_nodes, "Shape");
      div35_nodes.forEach(detach);
      div36_nodes.forEach(detach);
      t52 = claim_space(div39_nodes);
      div38 = claim_element(div39_nodes, "DIV", { class: true });
      var div38_nodes = children(div38);
      claim_component(knob2.$$.fragment, div38_nodes);
      t53 = claim_space(div38_nodes);
      div37 = claim_element(div38_nodes, "DIV", { class: true });
      var div37_nodes = children(div37);
      t54 = claim_text(div37_nodes, "Volume");
      div37_nodes.forEach(detach);
      div38_nodes.forEach(detach);
      div39_nodes.forEach(detach);
      div40_nodes.forEach(detach);
      t55 = claim_space(div65_nodes);
      div48 = claim_element(div65_nodes, "DIV", { class: true });
      var div48_nodes = children(div48);
      t56 = claim_text(div48_nodes, "OSC2\n			");
      div47 = claim_element(div48_nodes, "DIV", { class: true });
      var div47_nodes = children(div47);
      div42 = claim_element(div47_nodes, "DIV", { class: true });
      var div42_nodes = children(div42);
      claim_component(knob3.$$.fragment, div42_nodes);
      t57 = claim_space(div42_nodes);
      div41 = claim_element(div42_nodes, "DIV", { class: true });
      var div41_nodes = children(div41);
      t58 = claim_text(div41_nodes, "Tuning");
      div41_nodes.forEach(detach);
      t59 = claim_space(div42_nodes);
      button4 = claim_element(div42_nodes, "BUTTON", { state: true, class: true });
      var button4_nodes = children(button4);
      t60 = claim_text(button4_nodes, "sync");
      button4_nodes.forEach(detach);
      div42_nodes.forEach(detach);
      t61 = claim_space(div47_nodes);
      div44 = claim_element(div47_nodes, "DIV", { class: true });
      var div44_nodes = children(div44);
      claim_component(knob4.$$.fragment, div44_nodes);
      t62 = claim_space(div44_nodes);
      div43 = claim_element(div44_nodes, "DIV", { class: true });
      var div43_nodes = children(div43);
      t63 = claim_text(div43_nodes, "Shape");
      div43_nodes.forEach(detach);
      div44_nodes.forEach(detach);
      t64 = claim_space(div47_nodes);
      div46 = claim_element(div47_nodes, "DIV", { class: true });
      var div46_nodes = children(div46);
      claim_component(knob5.$$.fragment, div46_nodes);
      t65 = claim_space(div46_nodes);
      div45 = claim_element(div46_nodes, "DIV", { class: true });
      var div45_nodes = children(div45);
      t66 = claim_text(div45_nodes, "Volume");
      div45_nodes.forEach(detach);
      div46_nodes.forEach(detach);
      div47_nodes.forEach(detach);
      div48_nodes.forEach(detach);
      t67 = claim_space(div65_nodes);
      div49 = claim_element(div65_nodes, "DIV", { class: true });
      var div49_nodes = children(div49);
      div49_nodes.forEach(detach);
      t68 = claim_space(div65_nodes);
      div54 = claim_element(div65_nodes, "DIV", { class: true });
      var div54_nodes = children(div54);
      t69 = claim_text(div54_nodes, "SUB\n				");
      div53 = claim_element(div54_nodes, "DIV", { class: true });
      var div53_nodes = children(div53);
      div51 = claim_element(div53_nodes, "DIV", { class: true });
      var div51_nodes = children(div51);
      claim_component(knob6.$$.fragment, div51_nodes);
      t70 = claim_space(div51_nodes);
      div50 = claim_element(div51_nodes, "DIV", { class: true });
      var div50_nodes = children(div50);
      t71 = claim_text(div50_nodes, "Volume");
      div50_nodes.forEach(detach);
      div51_nodes.forEach(detach);
      t72 = claim_space(div53_nodes);
      div52 = claim_element(div53_nodes, "DIV", { class: true });
      var div52_nodes = children(div52);
      button5 = claim_element(div52_nodes, "BUTTON", { class: true });
      var button5_nodes = children(button5);
      t73 = claim_text(button5_nodes, "8vb");
      button5_nodes.forEach(detach);
      t74 = claim_space(div52_nodes);
      button6 = claim_element(div52_nodes, "BUTTON", { class: true });
      var button6_nodes = children(button6);
      t75 = claim_text(button6_nodes, "square");
      button6_nodes.forEach(detach);
      div52_nodes.forEach(detach);
      div53_nodes.forEach(detach);
      div54_nodes.forEach(detach);
      t76 = claim_space(div65_nodes);
      div55 = claim_element(div65_nodes, "DIV", { class: true });
      var div55_nodes = children(div55);
      div55_nodes.forEach(detach);
      t77 = claim_space(div65_nodes);
      div56 = claim_element(div65_nodes, "DIV", { class: true });
      var div56_nodes = children(div56);
      div56_nodes.forEach(detach);
      t78 = claim_space(div65_nodes);
      div57 = claim_element(div65_nodes, "DIV", { class: true });
      children(div57).forEach(detach);
      t79 = claim_space(div65_nodes);
      div58 = claim_element(div65_nodes, "DIV", { class: true });
      children(div58).forEach(detach);
      t80 = claim_space(div65_nodes);
      div59 = claim_element(div65_nodes, "DIV", { class: true });
      children(div59).forEach(detach);
      t81 = claim_space(div65_nodes);
      div60 = claim_element(div65_nodes, "DIV", { class: true });
      children(div60).forEach(detach);
      t82 = claim_space(div65_nodes);
      div61 = claim_element(div65_nodes, "DIV", { class: true });
      children(div61).forEach(detach);
      t83 = claim_space(div65_nodes);
      div62 = claim_element(div65_nodes, "DIV", { class: true });
      var div62_nodes = children(div62);
      button7 = claim_element(div62_nodes, "BUTTON", { class: true });
      var button7_nodes = children(button7);
      t84 = claim_text(button7_nodes, "GATE");
      button7_nodes.forEach(detach);
      div62_nodes.forEach(detach);
      t85 = claim_space(div65_nodes);
      div63 = claim_element(div65_nodes, "DIV", { class: true });
      children(div63).forEach(detach);
      t86 = claim_space(div65_nodes);
      div64 = claim_element(div65_nodes, "DIV", { class: true });
      children(div64).forEach(detach);
      div65_nodes.forEach(detach);
      this.h();
    },
    h() {
      attr(div0, "class", "env1 svelte-tg3qw5");
      attr(div1, "class", "env2 svelte-tg3qw5");
      attr(div2, "class", "_math svelte-tg3qw5");
      attr(div3, "class", "_shape svelte-tg3qw5");
      attr(div4, "class", "_invert svelte-tg3qw5");
      attr(div5, "class", "_clip svelte-tg3qw5");
      attr(div6, "class", "nw svelte-tg3qw5");
      attr(div7, "class", "pb svelte-tg3qw5");
      attr(div8, "class", "at svelte-tg3qw5");
      attr(div9, "class", "math svelte-tg3qw5");
      attr(div10, "class", "shape svelte-tg3qw5");
      attr(div11, "class", "invert svelte-tg3qw5");
      attr(div12, "class", "clip svelte-tg3qw5");
      attr(div13, "class", "lfo1 svelte-tg3qw5");
      attr(div14, "class", "lfo2 svelte-tg3qw5");
      attr(div15, "class", "svelte-tg3qw5");
      attr(div16, "class", "svelte-tg3qw5");
      set_style(div17, "text-align", "center");
      set_style(div17, "margin", "auto");
      set_style(div17, "color", "red");
      set_style(div17, "font-size", "24px");
      attr(div17, "class", "svelte-tg3qw5");
      attr(div18, "class", "modMatrix svelte-tg3qw5");
      attr(div19, "class", "flexbox svelte-tg3qw5");
      attr(div20, "class", "flexbox svelte-tg3qw5");
      attr(div21, "class", "flexbox svelte-tg3qw5");
      attr(div22, "class", "flexbox svelte-tg3qw5");
      attr(button0, "class", "pt svelte-tg3qw5");
      attr(button0, "state", "active");
      attr(button1, "class", "pt svelte-tg3qw5");
      attr(button1, "state", "active");
      attr(div23, "class", "flexbox svelte-tg3qw5");
      attr(div24, "class", "flexline svelte-tg3qw5");
      set_style(div24, "height", "150px");
      attr(div25, "class", "adsr1 svelte-tg3qw5");
      attr(div26, "class", "flexbox svelte-tg3qw5");
      attr(div27, "class", "flexbox svelte-tg3qw5");
      attr(div28, "class", "flexbox svelte-tg3qw5");
      attr(div29, "class", "flexbox svelte-tg3qw5");
      attr(button2, "class", "pt svelte-tg3qw5");
      attr(button2, "state", "active");
      attr(button3, "class", "pt svelte-tg3qw5");
      attr(button3, "state", "active");
      attr(div30, "class", "flexbox svelte-tg3qw5");
      attr(div31, "class", "flexline svelte-tg3qw5");
      set_style(div31, "height", "150px");
      attr(div32, "class", "adsr2 svelte-tg3qw5");
      attr(div33, "class", "svelte-tg3qw5");
      attr(div34, "class", "flexbox svelte-tg3qw5");
      attr(div35, "class", "svelte-tg3qw5");
      attr(div36, "class", "flexbox svelte-tg3qw5");
      attr(div37, "class", "svelte-tg3qw5");
      attr(div38, "class", "flexbox svelte-tg3qw5");
      attr(div39, "class", "flexline svelte-tg3qw5");
      attr(div40, "class", "osc1 svelte-tg3qw5");
      attr(div41, "class", "svelte-tg3qw5");
      attr(button4, "state", "active");
      attr(button4, "class", "svelte-tg3qw5");
      attr(div42, "class", "flexbox svelte-tg3qw5");
      attr(div43, "class", "svelte-tg3qw5");
      attr(div44, "class", "flexbox svelte-tg3qw5");
      attr(div45, "class", "svelte-tg3qw5");
      attr(div46, "class", "flexbox svelte-tg3qw5");
      attr(div47, "class", "flexline svelte-tg3qw5");
      attr(div48, "class", "osc2 svelte-tg3qw5");
      attr(div49, "class", "lfos svelte-tg3qw5");
      attr(div50, "class", "svelte-tg3qw5");
      attr(div51, "class", "flexbox svelte-tg3qw5");
      attr(button5, "class", "pt svelte-tg3qw5");
      attr(button6, "class", "pt svelte-tg3qw5");
      attr(div52, "class", "flexbox svelte-tg3qw5");
      attr(div53, "class", "flexline svelte-tg3qw5");
      attr(div54, "class", "sub svelte-tg3qw5");
      attr(div55, "class", "noise svelte-tg3qw5");
      attr(div56, "class", "reverb svelte-tg3qw5");
      attr(div57, "class", "delay svelte-tg3qw5");
      attr(div58, "class", "voicing svelte-tg3qw5");
      attr(div59, "class", "vcf svelte-tg3qw5");
      attr(div60, "class", "hpf svelte-tg3qw5");
      attr(div61, "class", "fine svelte-tg3qw5");
      attr(button7, "class", "svelte-tg3qw5");
      toggle_class(button7, "red", ctx[2]);
      attr(div62, "class", "branding svelte-tg3qw5");
      attr(div63, "class", "reserved1 svelte-tg3qw5");
      attr(div64, "class", "reserved2 svelte-tg3qw5");
      attr(div65, "class", "container svelte-tg3qw5");
    },
    m(target, anchor) {
      insert_hydration(target, div65, anchor);
      append_hydration(div65, div18);
      append_hydration(div18, div0);
      append_hydration(div0, t0);
      append_hydration(div18, t1);
      append_hydration(div18, div1);
      append_hydration(div18, t2);
      append_hydration(div18, div2);
      append_hydration(div18, t3);
      append_hydration(div18, div3);
      append_hydration(div18, t4);
      append_hydration(div18, div4);
      append_hydration(div18, t5);
      append_hydration(div18, div5);
      append_hydration(div18, t6);
      append_hydration(div18, div6);
      append_hydration(div18, t7);
      append_hydration(div18, div7);
      append_hydration(div18, t8);
      append_hydration(div18, div8);
      append_hydration(div18, t9);
      append_hydration(div18, div9);
      append_hydration(div18, t10);
      append_hydration(div18, div10);
      append_hydration(div18, t11);
      append_hydration(div18, div11);
      append_hydration(div18, t12);
      append_hydration(div18, div12);
      append_hydration(div18, t13);
      append_hydration(div18, div13);
      append_hydration(div18, t14);
      append_hydration(div18, div14);
      append_hydration(div18, t15);
      append_hydration(div18, div15);
      append_hydration(div18, t16);
      append_hydration(div18, div16);
      append_hydration(div18, t17);
      append_hydration(div18, div17);
      append_hydration(div17, t18);
      append_hydration(div65, t19);
      append_hydration(div65, div25);
      append_hydration(div25, t20);
      append_hydration(div25, div24);
      append_hydration(div24, div19);
      mount_component(slider0, div19, null);
      append_hydration(div19, t21);
      append_hydration(div24, t22);
      append_hydration(div24, div20);
      mount_component(slider1, div20, null);
      append_hydration(div20, t23);
      append_hydration(div24, t24);
      append_hydration(div24, div21);
      mount_component(slider2, div21, null);
      append_hydration(div21, t25);
      append_hydration(div24, t26);
      append_hydration(div24, div22);
      mount_component(slider3, div22, null);
      append_hydration(div22, t27);
      append_hydration(div24, t28);
      append_hydration(div24, div23);
      append_hydration(div23, button0);
      append_hydration(button0, t29);
      append_hydration(div23, t30);
      append_hydration(div23, button1);
      append_hydration(button1, t31);
      append_hydration(div65, t32);
      append_hydration(div65, div32);
      append_hydration(div32, t33);
      append_hydration(div32, div31);
      append_hydration(div31, div26);
      mount_component(slider4, div26, null);
      append_hydration(div26, t34);
      append_hydration(div31, t35);
      append_hydration(div31, div27);
      mount_component(slider5, div27, null);
      append_hydration(div27, t36);
      append_hydration(div31, t37);
      append_hydration(div31, div28);
      mount_component(slider6, div28, null);
      append_hydration(div28, t38);
      append_hydration(div31, t39);
      append_hydration(div31, div29);
      mount_component(slider7, div29, null);
      append_hydration(div29, t40);
      append_hydration(div31, t41);
      append_hydration(div31, div30);
      append_hydration(div30, button2);
      append_hydration(button2, t42);
      append_hydration(div30, t43);
      append_hydration(div30, button3);
      append_hydration(button3, t44);
      append_hydration(div65, t45);
      append_hydration(div65, div40);
      append_hydration(div40, t46);
      append_hydration(div40, div39);
      append_hydration(div39, div34);
      mount_component(knob0, div34, null);
      append_hydration(div34, t47);
      append_hydration(div34, div33);
      append_hydration(div33, t48);
      append_hydration(div39, t49);
      append_hydration(div39, div36);
      mount_component(knob1, div36, null);
      append_hydration(div36, t50);
      append_hydration(div36, div35);
      append_hydration(div35, t51);
      append_hydration(div39, t52);
      append_hydration(div39, div38);
      mount_component(knob2, div38, null);
      append_hydration(div38, t53);
      append_hydration(div38, div37);
      append_hydration(div37, t54);
      append_hydration(div65, t55);
      append_hydration(div65, div48);
      append_hydration(div48, t56);
      append_hydration(div48, div47);
      append_hydration(div47, div42);
      mount_component(knob3, div42, null);
      append_hydration(div42, t57);
      append_hydration(div42, div41);
      append_hydration(div41, t58);
      append_hydration(div42, t59);
      append_hydration(div42, button4);
      append_hydration(button4, t60);
      append_hydration(div47, t61);
      append_hydration(div47, div44);
      mount_component(knob4, div44, null);
      append_hydration(div44, t62);
      append_hydration(div44, div43);
      append_hydration(div43, t63);
      append_hydration(div47, t64);
      append_hydration(div47, div46);
      mount_component(knob5, div46, null);
      append_hydration(div46, t65);
      append_hydration(div46, div45);
      append_hydration(div45, t66);
      append_hydration(div65, t67);
      append_hydration(div65, div49);
      append_hydration(div65, t68);
      append_hydration(div65, div54);
      append_hydration(div54, t69);
      append_hydration(div54, div53);
      append_hydration(div53, div51);
      mount_component(knob6, div51, null);
      append_hydration(div51, t70);
      append_hydration(div51, div50);
      append_hydration(div50, t71);
      append_hydration(div53, t72);
      append_hydration(div53, div52);
      append_hydration(div52, button5);
      append_hydration(button5, t73);
      append_hydration(div52, t74);
      append_hydration(div52, button6);
      append_hydration(button6, t75);
      append_hydration(div65, t76);
      append_hydration(div65, div55);
      append_hydration(div65, t77);
      append_hydration(div65, div56);
      append_hydration(div65, t78);
      append_hydration(div65, div57);
      append_hydration(div65, t79);
      append_hydration(div65, div58);
      append_hydration(div65, t80);
      append_hydration(div65, div59);
      append_hydration(div65, t81);
      append_hydration(div65, div60);
      append_hydration(div65, t82);
      append_hydration(div65, div61);
      append_hydration(div65, t83);
      append_hydration(div65, div62);
      append_hydration(div62, button7);
      append_hydration(button7, t84);
      append_hydration(div65, t85);
      append_hydration(div65, div63);
      append_hydration(div65, t86);
      append_hydration(div65, div64);
      current = true;
      if (!mounted) {
        dispose = listen(button7, "click", ctx[11]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      const knob0_changes = {};
      if (dirty & 8)
        knob0_changes.min = ctx2[3]?.freq?.annotation?.min;
      if (dirty & 8)
        knob0_changes.max = ctx2[3]?.freq?.annotation?.max;
      if (!updating_value && dirty & 1) {
        updating_value = true;
        knob0_changes.value = ctx2[0];
        add_flush_callback(() => updating_value = false);
      }
      knob0.$set(knob0_changes);
      const knob3_changes = {};
      if (dirty & 16)
        knob3_changes.min = ctx2[4]?.freq?.annotation?.min;
      if (dirty & 16)
        knob3_changes.max = ctx2[4]?.freq?.annotation?.max;
      if (!updating_value_1 && dirty & 2) {
        updating_value_1 = true;
        knob3_changes.value = ctx2[1];
        add_flush_callback(() => updating_value_1 = false);
      }
      knob3.$set(knob3_changes);
      if (!current || dirty & 4) {
        toggle_class(button7, "red", ctx2[2]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(slider0.$$.fragment, local);
      transition_in(slider1.$$.fragment, local);
      transition_in(slider2.$$.fragment, local);
      transition_in(slider3.$$.fragment, local);
      transition_in(slider4.$$.fragment, local);
      transition_in(slider5.$$.fragment, local);
      transition_in(slider6.$$.fragment, local);
      transition_in(slider7.$$.fragment, local);
      transition_in(knob0.$$.fragment, local);
      transition_in(knob1.$$.fragment, local);
      transition_in(knob2.$$.fragment, local);
      transition_in(knob3.$$.fragment, local);
      transition_in(knob4.$$.fragment, local);
      transition_in(knob5.$$.fragment, local);
      transition_in(knob6.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(slider0.$$.fragment, local);
      transition_out(slider1.$$.fragment, local);
      transition_out(slider2.$$.fragment, local);
      transition_out(slider3.$$.fragment, local);
      transition_out(slider4.$$.fragment, local);
      transition_out(slider5.$$.fragment, local);
      transition_out(slider6.$$.fragment, local);
      transition_out(slider7.$$.fragment, local);
      transition_out(knob0.$$.fragment, local);
      transition_out(knob1.$$.fragment, local);
      transition_out(knob2.$$.fragment, local);
      transition_out(knob3.$$.fragment, local);
      transition_out(knob4.$$.fragment, local);
      transition_out(knob5.$$.fragment, local);
      transition_out(knob6.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div65);
      destroy_component(slider0);
      destroy_component(slider1);
      destroy_component(slider2);
      destroy_component(slider3);
      destroy_component(slider4);
      destroy_component(slider5);
      destroy_component(slider6);
      destroy_component(slider7);
      destroy_component(knob0);
      destroy_component(knob1);
      destroy_component(knob2);
      destroy_component(knob3);
      destroy_component(knob4);
      destroy_component(knob5);
      destroy_component(knob6);
      mounted = false;
      dispose();
    }
  };
}
function instance4($$self, $$props, $$invalidate) {
  let { inputs } = $$props;
  let shape = ["sine", "triangle", "saw", "square", "impulse"];
  const dispatch = createEventDispatcher();
  let osc1FreqIn;
  let osc2FreqIn;
  let osc1 = {};
  let osc2 = {};
  let gateOn = false;
  const setupInputs = (inputs2) => {
    if (!Array.isArray(inputs2))
      return;
    console.log(inputs2);
    $$invalidate(3, osc1.freq = inputs2.find((i) => i.endpointID === "osc1FreqIn"), osc1);
    $$invalidate(0, osc1FreqIn = osc1.freq.annotation.init);
    $$invalidate(4, osc2.freq = inputs2.find((i) => i.endpointID === "osc2FreqIn"), osc2);
    $$invalidate(1, osc2FreqIn = osc2.freq.annotation.init);
  };
  function knob0_value_binding(value) {
    osc1FreqIn = value;
    $$invalidate(0, osc1FreqIn);
  }
  const func = (v) => shape[v];
  function knob3_value_binding(value) {
    osc2FreqIn = value;
    $$invalidate(1, osc2FreqIn);
  }
  const func_1 = (v) => shape[v];
  const click_handler = (e) => $$invalidate(2, gateOn = !gateOn);
  $$self.$$set = ($$props2) => {
    if ("inputs" in $$props2)
      $$invalidate(6, inputs = $$props2.inputs);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 64) {
      $:
        setupInputs(inputs);
    }
    if ($$self.$$.dirty & 1) {
      $:
        dispatch("sendValue", { endpoint: "osc1FreqIn", val: osc1FreqIn });
    }
    if ($$self.$$.dirty & 2) {
      $:
        dispatch("sendValue", { endpoint: "osc2FreqIn", val: osc2FreqIn });
    }
    if ($$self.$$.dirty & 3) {
      $:
        console.log(osc2FreqIn, osc1FreqIn);
    }
    if ($$self.$$.dirty & 4) {
      $:
        dispatch("sendValue", { endpoint: "boolIn", val: gateOn });
    }
  };
  return [
    osc1FreqIn,
    osc2FreqIn,
    gateOn,
    osc1,
    osc2,
    shape,
    inputs,
    knob0_value_binding,
    func,
    knob3_value_binding,
    func_1,
    click_handler
  ];
}
var Synth = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance4, create_fragment4, safe_not_equal, { inputs: 6 }, add_css4);
  }
  get inputs() {
    return this.$$.ctx[6];
  }
  set inputs(inputs) {
    this.$$set({ inputs });
    flush();
  }
};
var synth_default = Synth;

// index.svelte
function add_css5(target) {
  append_styles(target, "svelte-renn8d", "body{margin:1px;font-family:'Sofia Sans Extra Condensed', sans-serif}main.svelte-renn8d{display:flex;flex-direction:column;justify-content:flex-start;align-items:flex-start;height:var(--vh);width:var(--vw);background-color:#ece7df;color:black}");
}
function create_fragment5(ctx) {
  let main;
  let synth;
  let current;
  synth = new synth_default({ props: { inputs: ctx[2] } });
  synth.$on("sendValue", ctx[5]);
  return {
    c() {
      main = element("main");
      create_component(synth.$$.fragment);
      this.h();
    },
    l(nodes) {
      main = claim_element(nodes, "MAIN", { style: true, class: true });
      var main_nodes = children(main);
      claim_component(synth.$$.fragment, main_nodes);
      main_nodes.forEach(detach);
      this.h();
    },
    h() {
      set_style(main, "--vh", ctx[0] + "px");
      set_style(main, "--vw", ctx[1] + "px");
      attr(main, "class", "svelte-renn8d");
    },
    m(target, anchor) {
      insert_hydration(target, main, anchor);
      mount_component(synth, main, null);
      current = true;
    },
    p(ctx2, [dirty]) {
      const synth_changes = {};
      if (dirty & 4)
        synth_changes.inputs = ctx2[2];
      synth.$set(synth_changes);
      if (!current || dirty & 1) {
        set_style(main, "--vh", ctx2[0] + "px");
      }
      if (!current || dirty & 2) {
        set_style(main, "--vw", ctx2[1] + "px");
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(synth.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(synth.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(main);
      destroy_component(synth);
    }
  };
}
function instance5($$self, $$props, $$invalidate) {
  let inputBinding;
  let { patch } = $$props;
  let vh = 500;
  let vw = 500;
  let inputs;
  onMount(async () => {
    $$invalidate(4, patch.onPatchStatusChanged = (buildError, manifest2, inputEndpoints, outputEndpoints) => {
      const { view } = manifest2;
      $$invalidate(0, vh = view.height);
      $$invalidate(1, vw = view.width);
      $$invalidate(2, inputs = inputEndpoints);
    }, patch);
    $$invalidate(4, patch.onParameterEndpointChanged = (...args) => console.log("onParameterEndpointChanged", args), patch);
    $$invalidate(4, patch.onSampleRateChanged = (...args) => console.log("onSampleRateChanged", args), patch);
    $$invalidate(4, patch.onParameterEndpointChanged = (...args) => console.log("onParameterEndpointChanged", args), patch);
    $$invalidate(4, patch.onOutputEvent = (...args) => console.log("onOutputEvent", args), patch);
    const manifest = patch.requestStatusUpdate();
  });
  function change() {
    inputBinding.value = "testing" + Math.round(Math.random() * 100);
  }
  function send({ endpoint, val }) {
    if (!endpoint)
      return;
    patch.sendEventOrValue(endpoint, val, 16);
  }
  const sendValue_handler = (e) => send(e.detail);
  $$self.$$set = ($$props2) => {
    if ("patch" in $$props2)
      $$invalidate(4, patch = $$props2.patch);
  };
  return [vh, vw, inputs, send, patch, sendValue_handler];
}
var Index = class extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance5, create_fragment5, safe_not_equal, { patch: 4 }, add_css5);
  }
  get patch() {
    return this.$$.ctx[4];
  }
  set patch(patch) {
    this.$$set({ patch });
    flush();
  }
};
var web_ui_default = Index;

// entry.js
function createCustomPatchView(patchConnection) {
  return new web_ui_default({
    target: document.body,
    props: { patch: patchConnection }
  });
}
export {
  createCustomPatchView as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9pbnRlcm5hbC9pbmRleC5tanMiLCAiLi4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1rbm9iL3NyYy9Lbm9iLnN2ZWx0ZSIsICIuLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWtub2Ivc3JjL2luZGV4LmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mbHVlbnQtc3ZlbHRlL1Rvb2x0aXAvVG9vbHRpcFN1cmZhY2Uuc3ZlbHRlIiwgIi4uL25vZGVfbW9kdWxlcy9mbHVlbnQtc3ZlbHRlL2ludGVybmFsLmpzIiwgIi4uL25vZGVfbW9kdWxlcy9mbHVlbnQtc3ZlbHRlL1NsaWRlci9TbGlkZXIuc3ZlbHRlIiwgIi4uL25vZGVfbW9kdWxlcy9zdmVsdGUvc3RvcmUvaW5kZXgubWpzIiwgIi4uL25vZGVfbW9kdWxlcy9mbHVlbnQtc3ZlbHRlL01lbnVCYXIvZmx5b3V0U3RhdGUuanMiLCAiLi4vc3ludGguc3ZlbHRlIiwgIi4uL2luZGV4LnN2ZWx0ZSIsICIuLi9lbnRyeS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZnVuY3Rpb24gbm9vcCgpIHsgfVxuY29uc3QgaWRlbnRpdHkgPSB4ID0+IHg7XG5mdW5jdGlvbiBhc3NpZ24odGFyLCBzcmMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZm9yIChjb25zdCBrIGluIHNyYylcbiAgICAgICAgdGFyW2tdID0gc3JjW2tdO1xuICAgIHJldHVybiB0YXI7XG59XG4vLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3RoZW4vaXMtcHJvbWlzZS9ibG9iL21hc3Rlci9pbmRleC5qc1xuLy8gRGlzdHJpYnV0ZWQgdW5kZXIgTUlUIExpY2Vuc2UgaHR0cHM6Ly9naXRodWIuY29tL3RoZW4vaXMtcHJvbWlzZS9ibG9iL21hc3Rlci9MSUNFTlNFXG5mdW5jdGlvbiBpc19wcm9taXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIGFkZF9sb2NhdGlvbihlbGVtZW50LCBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIpIHtcbiAgICBlbGVtZW50Ll9fc3ZlbHRlX21ldGEgPSB7XG4gICAgICAgIGxvYzogeyBmaWxlLCBsaW5lLCBjb2x1bW4sIGNoYXIgfVxuICAgIH07XG59XG5mdW5jdGlvbiBydW4oZm4pIHtcbiAgICByZXR1cm4gZm4oKTtcbn1cbmZ1bmN0aW9uIGJsYW5rX29iamVjdCgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cbmZ1bmN0aW9uIHJ1bl9hbGwoZm5zKSB7XG4gICAgZm5zLmZvckVhY2gocnVuKTtcbn1cbmZ1bmN0aW9uIGlzX2Z1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB0aGluZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmZ1bmN0aW9uIHNhZmVfbm90X2VxdWFsKGEsIGIpIHtcbiAgICByZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5sZXQgc3JjX3VybF9lcXVhbF9hbmNob3I7XG5mdW5jdGlvbiBzcmNfdXJsX2VxdWFsKGVsZW1lbnRfc3JjLCB1cmwpIHtcbiAgICBpZiAoIXNyY191cmxfZXF1YWxfYW5jaG9yKSB7XG4gICAgICAgIHNyY191cmxfZXF1YWxfYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIH1cbiAgICBzcmNfdXJsX2VxdWFsX2FuY2hvci5ocmVmID0gdXJsO1xuICAgIHJldHVybiBlbGVtZW50X3NyYyA9PT0gc3JjX3VybF9lcXVhbF9hbmNob3IuaHJlZjtcbn1cbmZ1bmN0aW9uIG5vdF9lcXVhbChhLCBiKSB7XG4gICAgcmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5mdW5jdGlvbiBpc19lbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9zdG9yZShzdG9yZSwgbmFtZSkge1xuICAgIGlmIChzdG9yZSAhPSBudWxsICYmIHR5cGVvZiBzdG9yZS5zdWJzY3JpYmUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAnJHtuYW1lfScgaXMgbm90IGEgc3RvcmUgd2l0aCBhICdzdWJzY3JpYmUnIG1ldGhvZGApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHN1YnNjcmliZShzdG9yZSwgLi4uY2FsbGJhY2tzKSB7XG4gICAgaWYgKHN0b3JlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgfVxuICAgIGNvbnN0IHVuc3ViID0gc3RvcmUuc3Vic2NyaWJlKC4uLmNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHVuc3ViLnVuc3Vic2NyaWJlID8gKCkgPT4gdW5zdWIudW5zdWJzY3JpYmUoKSA6IHVuc3ViO1xufVxuZnVuY3Rpb24gZ2V0X3N0b3JlX3ZhbHVlKHN0b3JlKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIHN1YnNjcmliZShzdG9yZSwgXyA9PiB2YWx1ZSA9IF8pKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuZnVuY3Rpb24gY29tcG9uZW50X3N1YnNjcmliZShjb21wb25lbnQsIHN0b3JlLCBjYWxsYmFjaykge1xuICAgIGNvbXBvbmVudC4kJC5vbl9kZXN0cm95LnB1c2goc3Vic2NyaWJlKHN0b3JlLCBjYWxsYmFjaykpO1xufVxuZnVuY3Rpb24gY3JlYXRlX3Nsb3QoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNsb3RfY3R4ID0gZ2V0X3Nsb3RfY29udGV4dChkZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGZuKTtcbiAgICAgICAgcmV0dXJuIGRlZmluaXRpb25bMF0oc2xvdF9jdHgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldF9zbG90X2NvbnRleHQoZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBmbikge1xuICAgIHJldHVybiBkZWZpbml0aW9uWzFdICYmIGZuXG4gICAgICAgID8gYXNzaWduKCQkc2NvcGUuY3R4LnNsaWNlKCksIGRlZmluaXRpb25bMV0oZm4oY3R4KSkpXG4gICAgICAgIDogJCRzY29wZS5jdHg7XG59XG5mdW5jdGlvbiBnZXRfc2xvdF9jaGFuZ2VzKGRlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBmbikge1xuICAgIGlmIChkZWZpbml0aW9uWzJdICYmIGZuKSB7XG4gICAgICAgIGNvbnN0IGxldHMgPSBkZWZpbml0aW9uWzJdKGZuKGRpcnR5KSk7XG4gICAgICAgIGlmICgkJHNjb3BlLmRpcnR5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBsZXRzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbGV0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGNvbnN0IG1lcmdlZCA9IFtdO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoJCRzY29wZS5kaXJ0eS5sZW5ndGgsIGxldHMubGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBtZXJnZWRbaV0gPSAkJHNjb3BlLmRpcnR5W2ldIHwgbGV0c1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICQkc2NvcGUuZGlydHkgfCBsZXRzO1xuICAgIH1cbiAgICByZXR1cm4gJCRzY29wZS5kaXJ0eTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZV9zbG90X2Jhc2Uoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIHNsb3RfY2hhbmdlcywgZ2V0X3Nsb3RfY29udGV4dF9mbikge1xuICAgIGlmIChzbG90X2NoYW5nZXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdF9jb250ZXh0ID0gZ2V0X3Nsb3RfY29udGV4dChzbG90X2RlZmluaXRpb24sIGN0eCwgJCRzY29wZSwgZ2V0X3Nsb3RfY29udGV4dF9mbik7XG4gICAgICAgIHNsb3QucChzbG90X2NvbnRleHQsIHNsb3RfY2hhbmdlcyk7XG4gICAgfVxufVxuZnVuY3Rpb24gdXBkYXRlX3Nsb3Qoc2xvdCwgc2xvdF9kZWZpbml0aW9uLCBjdHgsICQkc2NvcGUsIGRpcnR5LCBnZXRfc2xvdF9jaGFuZ2VzX2ZuLCBnZXRfc2xvdF9jb250ZXh0X2ZuKSB7XG4gICAgY29uc3Qgc2xvdF9jaGFuZ2VzID0gZ2V0X3Nsb3RfY2hhbmdlcyhzbG90X2RlZmluaXRpb24sICQkc2NvcGUsIGRpcnR5LCBnZXRfc2xvdF9jaGFuZ2VzX2ZuKTtcbiAgICB1cGRhdGVfc2xvdF9iYXNlKHNsb3QsIHNsb3RfZGVmaW5pdGlvbiwgY3R4LCAkJHNjb3BlLCBzbG90X2NoYW5nZXMsIGdldF9zbG90X2NvbnRleHRfZm4pO1xufVxuZnVuY3Rpb24gZ2V0X2FsbF9kaXJ0eV9mcm9tX3Njb3BlKCQkc2NvcGUpIHtcbiAgICBpZiAoJCRzY29wZS5jdHgubGVuZ3RoID4gMzIpIHtcbiAgICAgICAgY29uc3QgZGlydHkgPSBbXTtcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gJCRzY29wZS5jdHgubGVuZ3RoIC8gMzI7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRpcnR5W2ldID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRpcnR5O1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5mdW5jdGlvbiBleGNsdWRlX2ludGVybmFsX3Byb3BzKHByb3BzKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIHByb3BzKVxuICAgICAgICBpZiAoa1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdWx0W2tdID0gcHJvcHNba107XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGNvbXB1dGVfcmVzdF9wcm9wcyhwcm9wcywga2V5cykge1xuICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICBrZXlzID0gbmV3IFNldChrZXlzKTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcHJvcHMpXG4gICAgICAgIGlmICgha2V5cy5oYXMoaykgJiYga1swXSAhPT0gJyQnKVxuICAgICAgICAgICAgcmVzdFtrXSA9IHByb3BzW2tdO1xuICAgIHJldHVybiByZXN0O1xufVxuZnVuY3Rpb24gY29tcHV0ZV9zbG90cyhzbG90cykge1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIHNsb3RzKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIG9uY2UoZm4pIHtcbiAgICBsZXQgcmFuID0gZmFsc2U7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChyYW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJhbiA9IHRydWU7XG4gICAgICAgIGZuLmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIG51bGxfdG9fZW1wdHkodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG59XG5mdW5jdGlvbiBzZXRfc3RvcmVfdmFsdWUoc3RvcmUsIHJldCwgdmFsdWUpIHtcbiAgICBzdG9yZS5zZXQodmFsdWUpO1xuICAgIHJldHVybiByZXQ7XG59XG5jb25zdCBoYXNfcHJvcCA9IChvYmosIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xuZnVuY3Rpb24gYWN0aW9uX2Rlc3Ryb3llcihhY3Rpb25fcmVzdWx0KSB7XG4gICAgcmV0dXJuIGFjdGlvbl9yZXN1bHQgJiYgaXNfZnVuY3Rpb24oYWN0aW9uX3Jlc3VsdC5kZXN0cm95KSA/IGFjdGlvbl9yZXN1bHQuZGVzdHJveSA6IG5vb3A7XG59XG5cbmNvbnN0IGlzX2NsaWVudCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xubGV0IG5vdyA9IGlzX2NsaWVudFxuICAgID8gKCkgPT4gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpXG4gICAgOiAoKSA9PiBEYXRlLm5vdygpO1xubGV0IHJhZiA9IGlzX2NsaWVudCA/IGNiID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShjYikgOiBub29wO1xuLy8gdXNlZCBpbnRlcm5hbGx5IGZvciB0ZXN0aW5nXG5mdW5jdGlvbiBzZXRfbm93KGZuKSB7XG4gICAgbm93ID0gZm47XG59XG5mdW5jdGlvbiBzZXRfcmFmKGZuKSB7XG4gICAgcmFmID0gZm47XG59XG5cbmNvbnN0IHRhc2tzID0gbmV3IFNldCgpO1xuZnVuY3Rpb24gcnVuX3Rhc2tzKG5vdykge1xuICAgIHRhc2tzLmZvckVhY2godGFzayA9PiB7XG4gICAgICAgIGlmICghdGFzay5jKG5vdykpIHtcbiAgICAgICAgICAgIHRhc2tzLmRlbGV0ZSh0YXNrKTtcbiAgICAgICAgICAgIHRhc2suZigpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRhc2tzLnNpemUgIT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xufVxuLyoqXG4gKiBGb3IgdGVzdGluZyBwdXJwb3NlcyBvbmx5IVxuICovXG5mdW5jdGlvbiBjbGVhcl9sb29wcygpIHtcbiAgICB0YXNrcy5jbGVhcigpO1xufVxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IHRhc2sgdGhhdCBydW5zIG9uIGVhY2ggcmFmIGZyYW1lXG4gKiB1bnRpbCBpdCByZXR1cm5zIGEgZmFsc3kgdmFsdWUgb3IgaXMgYWJvcnRlZFxuICovXG5mdW5jdGlvbiBsb29wKGNhbGxiYWNrKSB7XG4gICAgbGV0IHRhc2s7XG4gICAgaWYgKHRhc2tzLnNpemUgPT09IDApXG4gICAgICAgIHJhZihydW5fdGFza3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByb21pc2U6IG5ldyBQcm9taXNlKGZ1bGZpbGwgPT4ge1xuICAgICAgICAgICAgdGFza3MuYWRkKHRhc2sgPSB7IGM6IGNhbGxiYWNrLCBmOiBmdWxmaWxsIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgYWJvcnQoKSB7XG4gICAgICAgICAgICB0YXNrcy5kZWxldGUodGFzayk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG4vLyBUcmFjayB3aGljaCBub2RlcyBhcmUgY2xhaW1lZCBkdXJpbmcgaHlkcmF0aW9uLiBVbmNsYWltZWQgbm9kZXMgY2FuIHRoZW4gYmUgcmVtb3ZlZCBmcm9tIHRoZSBET01cbi8vIGF0IHRoZSBlbmQgb2YgaHlkcmF0aW9uIHdpdGhvdXQgdG91Y2hpbmcgdGhlIHJlbWFpbmluZyBub2Rlcy5cbmxldCBpc19oeWRyYXRpbmcgPSBmYWxzZTtcbmZ1bmN0aW9uIHN0YXJ0X2h5ZHJhdGluZygpIHtcbiAgICBpc19oeWRyYXRpbmcgPSB0cnVlO1xufVxuZnVuY3Rpb24gZW5kX2h5ZHJhdGluZygpIHtcbiAgICBpc19oeWRyYXRpbmcgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHVwcGVyX2JvdW5kKGxvdywgaGlnaCwga2V5LCB2YWx1ZSkge1xuICAgIC8vIFJldHVybiBmaXJzdCBpbmRleCBvZiB2YWx1ZSBsYXJnZXIgdGhhbiBpbnB1dCB2YWx1ZSBpbiB0aGUgcmFuZ2UgW2xvdywgaGlnaClcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgICBjb25zdCBtaWQgPSBsb3cgKyAoKGhpZ2ggLSBsb3cpID4+IDEpO1xuICAgICAgICBpZiAoa2V5KG1pZCkgPD0gdmFsdWUpIHtcbiAgICAgICAgICAgIGxvdyA9IG1pZCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBoaWdoID0gbWlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG59XG5mdW5jdGlvbiBpbml0X2h5ZHJhdGUodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldC5oeWRyYXRlX2luaXQpXG4gICAgICAgIHJldHVybjtcbiAgICB0YXJnZXQuaHlkcmF0ZV9pbml0ID0gdHJ1ZTtcbiAgICAvLyBXZSBrbm93IHRoYXQgYWxsIGNoaWxkcmVuIGhhdmUgY2xhaW1fb3JkZXIgdmFsdWVzIHNpbmNlIHRoZSB1bmNsYWltZWQgaGF2ZSBiZWVuIGRldGFjaGVkIGlmIHRhcmdldCBpcyBub3QgPGhlYWQ+XG4gICAgbGV0IGNoaWxkcmVuID0gdGFyZ2V0LmNoaWxkTm9kZXM7XG4gICAgLy8gSWYgdGFyZ2V0IGlzIDxoZWFkPiwgdGhlcmUgbWF5IGJlIGNoaWxkcmVuIHdpdGhvdXQgY2xhaW1fb3JkZXJcbiAgICBpZiAodGFyZ2V0Lm5vZGVOYW1lID09PSAnSEVBRCcpIHtcbiAgICAgICAgY29uc3QgbXlDaGlsZHJlbiA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAobm9kZS5jbGFpbV9vcmRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbXlDaGlsZHJlbi5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNoaWxkcmVuID0gbXlDaGlsZHJlbjtcbiAgICB9XG4gICAgLypcbiAgICAqIFJlb3JkZXIgY2xhaW1lZCBjaGlsZHJlbiBvcHRpbWFsbHkuXG4gICAgKiBXZSBjYW4gcmVvcmRlciBjbGFpbWVkIGNoaWxkcmVuIG9wdGltYWxseSBieSBmaW5kaW5nIHRoZSBsb25nZXN0IHN1YnNlcXVlbmNlIG9mXG4gICAgKiBub2RlcyB0aGF0IGFyZSBhbHJlYWR5IGNsYWltZWQgaW4gb3JkZXIgYW5kIG9ubHkgbW92aW5nIHRoZSByZXN0LiBUaGUgbG9uZ2VzdFxuICAgICogc3Vic2VxdWVuY2Ugb2Ygbm9kZXMgdGhhdCBhcmUgY2xhaW1lZCBpbiBvcmRlciBjYW4gYmUgZm91bmQgYnlcbiAgICAqIGNvbXB1dGluZyB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIC5jbGFpbV9vcmRlciB2YWx1ZXMuXG4gICAgKlxuICAgICogVGhpcyBhbGdvcml0aG0gaXMgb3B0aW1hbCBpbiBnZW5lcmF0aW5nIHRoZSBsZWFzdCBhbW91bnQgb2YgcmVvcmRlciBvcGVyYXRpb25zXG4gICAgKiBwb3NzaWJsZS5cbiAgICAqXG4gICAgKiBQcm9vZjpcbiAgICAqIFdlIGtub3cgdGhhdCwgZ2l2ZW4gYSBzZXQgb2YgcmVvcmRlcmluZyBvcGVyYXRpb25zLCB0aGUgbm9kZXMgdGhhdCBkbyBub3QgbW92ZVxuICAgICogYWx3YXlzIGZvcm0gYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSwgc2luY2UgdGhleSBkbyBub3QgbW92ZSBhbW9uZyBlYWNoIG90aGVyXG4gICAgKiBtZWFuaW5nIHRoYXQgdGhleSBtdXN0IGJlIGFscmVhZHkgb3JkZXJlZCBhbW9uZyBlYWNoIG90aGVyLiBUaHVzLCB0aGUgbWF4aW1hbFxuICAgICogc2V0IG9mIG5vZGVzIHRoYXQgZG8gbm90IG1vdmUgZm9ybSBhIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZS5cbiAgICAqL1xuICAgIC8vIENvbXB1dGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlXG4gICAgLy8gbTogc3Vic2VxdWVuY2UgbGVuZ3RoIGogPT4gaW5kZXggayBvZiBzbWFsbGVzdCB2YWx1ZSB0aGF0IGVuZHMgYW4gaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBsZW5ndGggalxuICAgIGNvbnN0IG0gPSBuZXcgSW50MzJBcnJheShjaGlsZHJlbi5sZW5ndGggKyAxKTtcbiAgICAvLyBQcmVkZWNlc3NvciBpbmRpY2VzICsgMVxuICAgIGNvbnN0IHAgPSBuZXcgSW50MzJBcnJheShjaGlsZHJlbi5sZW5ndGgpO1xuICAgIG1bMF0gPSAtMTtcbiAgICBsZXQgbG9uZ2VzdCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gY2hpbGRyZW5baV0uY2xhaW1fb3JkZXI7XG4gICAgICAgIC8vIEZpbmQgdGhlIGxhcmdlc3Qgc3Vic2VxdWVuY2UgbGVuZ3RoIHN1Y2ggdGhhdCBpdCBlbmRzIGluIGEgdmFsdWUgbGVzcyB0aGFuIG91ciBjdXJyZW50IHZhbHVlXG4gICAgICAgIC8vIHVwcGVyX2JvdW5kIHJldHVybnMgZmlyc3QgZ3JlYXRlciB2YWx1ZSwgc28gd2Ugc3VidHJhY3Qgb25lXG4gICAgICAgIC8vIHdpdGggZmFzdCBwYXRoIGZvciB3aGVuIHdlIGFyZSBvbiB0aGUgY3VycmVudCBsb25nZXN0IHN1YnNlcXVlbmNlXG4gICAgICAgIGNvbnN0IHNlcUxlbiA9ICgobG9uZ2VzdCA+IDAgJiYgY2hpbGRyZW5bbVtsb25nZXN0XV0uY2xhaW1fb3JkZXIgPD0gY3VycmVudCkgPyBsb25nZXN0ICsgMSA6IHVwcGVyX2JvdW5kKDEsIGxvbmdlc3QsIGlkeCA9PiBjaGlsZHJlblttW2lkeF1dLmNsYWltX29yZGVyLCBjdXJyZW50KSkgLSAxO1xuICAgICAgICBwW2ldID0gbVtzZXFMZW5dICsgMTtcbiAgICAgICAgY29uc3QgbmV3TGVuID0gc2VxTGVuICsgMTtcbiAgICAgICAgLy8gV2UgY2FuIGd1YXJhbnRlZSB0aGF0IGN1cnJlbnQgaXMgdGhlIHNtYWxsZXN0IHZhbHVlLiBPdGhlcndpc2UsIHdlIHdvdWxkIGhhdmUgZ2VuZXJhdGVkIGEgbG9uZ2VyIHNlcXVlbmNlLlxuICAgICAgICBtW25ld0xlbl0gPSBpO1xuICAgICAgICBsb25nZXN0ID0gTWF0aC5tYXgobmV3TGVuLCBsb25nZXN0KTtcbiAgICB9XG4gICAgLy8gVGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSBvZiBub2RlcyAoaW5pdGlhbGx5IHJldmVyc2VkKVxuICAgIGNvbnN0IGxpcyA9IFtdO1xuICAgIC8vIFRoZSByZXN0IG9mIHRoZSBub2Rlcywgbm9kZXMgdGhhdCB3aWxsIGJlIG1vdmVkXG4gICAgY29uc3QgdG9Nb3ZlID0gW107XG4gICAgbGV0IGxhc3QgPSBjaGlsZHJlbi5sZW5ndGggLSAxO1xuICAgIGZvciAobGV0IGN1ciA9IG1bbG9uZ2VzdF0gKyAxOyBjdXIgIT0gMDsgY3VyID0gcFtjdXIgLSAxXSkge1xuICAgICAgICBsaXMucHVzaChjaGlsZHJlbltjdXIgLSAxXSk7XG4gICAgICAgIGZvciAoOyBsYXN0ID49IGN1cjsgbGFzdC0tKSB7XG4gICAgICAgICAgICB0b01vdmUucHVzaChjaGlsZHJlbltsYXN0XSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdC0tO1xuICAgIH1cbiAgICBmb3IgKDsgbGFzdCA+PSAwOyBsYXN0LS0pIHtcbiAgICAgICAgdG9Nb3ZlLnB1c2goY2hpbGRyZW5bbGFzdF0pO1xuICAgIH1cbiAgICBsaXMucmV2ZXJzZSgpO1xuICAgIC8vIFdlIHNvcnQgdGhlIG5vZGVzIGJlaW5nIG1vdmVkIHRvIGd1YXJhbnRlZSB0aGF0IHRoZWlyIGluc2VydGlvbiBvcmRlciBtYXRjaGVzIHRoZSBjbGFpbSBvcmRlclxuICAgIHRvTW92ZS5zb3J0KChhLCBiKSA9PiBhLmNsYWltX29yZGVyIC0gYi5jbGFpbV9vcmRlcik7XG4gICAgLy8gRmluYWxseSwgd2UgbW92ZSB0aGUgbm9kZXNcbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCB0b01vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgd2hpbGUgKGogPCBsaXMubGVuZ3RoICYmIHRvTW92ZVtpXS5jbGFpbV9vcmRlciA+PSBsaXNbal0uY2xhaW1fb3JkZXIpIHtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhbmNob3IgPSBqIDwgbGlzLmxlbmd0aCA/IGxpc1tqXSA6IG51bGw7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUodG9Nb3ZlW2ldLCBhbmNob3IpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGVuZCh0YXJnZXQsIG5vZGUpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5mdW5jdGlvbiBhcHBlbmRfc3R5bGVzKHRhcmdldCwgc3R5bGVfc2hlZXRfaWQsIHN0eWxlcykge1xuICAgIGNvbnN0IGFwcGVuZF9zdHlsZXNfdG8gPSBnZXRfcm9vdF9mb3Jfc3R5bGUodGFyZ2V0KTtcbiAgICBpZiAoIWFwcGVuZF9zdHlsZXNfdG8uZ2V0RWxlbWVudEJ5SWQoc3R5bGVfc2hlZXRfaWQpKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSBzdHlsZV9zaGVldF9pZDtcbiAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSBzdHlsZXM7XG4gICAgICAgIGFwcGVuZF9zdHlsZXNoZWV0KGFwcGVuZF9zdHlsZXNfdG8sIHN0eWxlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRfcm9vdF9mb3Jfc3R5bGUobm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50O1xuICAgIGNvbnN0IHJvb3QgPSBub2RlLmdldFJvb3ROb2RlID8gbm9kZS5nZXRSb290Tm9kZSgpIDogbm9kZS5vd25lckRvY3VtZW50O1xuICAgIGlmIChyb290ICYmIHJvb3QuaG9zdCkge1xuICAgICAgICByZXR1cm4gcm9vdDtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudDtcbn1cbmZ1bmN0aW9uIGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0KG5vZGUpIHtcbiAgICBjb25zdCBzdHlsZV9lbGVtZW50ID0gZWxlbWVudCgnc3R5bGUnKTtcbiAgICBhcHBlbmRfc3R5bGVzaGVldChnZXRfcm9vdF9mb3Jfc3R5bGUobm9kZSksIHN0eWxlX2VsZW1lbnQpO1xuICAgIHJldHVybiBzdHlsZV9lbGVtZW50LnNoZWV0O1xufVxuZnVuY3Rpb24gYXBwZW5kX3N0eWxlc2hlZXQobm9kZSwgc3R5bGUpIHtcbiAgICBhcHBlbmQobm9kZS5oZWFkIHx8IG5vZGUsIHN0eWxlKTtcbiAgICByZXR1cm4gc3R5bGUuc2hlZXQ7XG59XG5mdW5jdGlvbiBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSkge1xuICAgIGlmIChpc19oeWRyYXRpbmcpIHtcbiAgICAgICAgaW5pdF9oeWRyYXRlKHRhcmdldCk7XG4gICAgICAgIGlmICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPT09IHVuZGVmaW5lZCkgfHwgKCh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCAhPT0gbnVsbCkgJiYgKHRhcmdldC5hY3R1YWxfZW5kX2NoaWxkLnBhcmVudE5vZGUgIT09IHRhcmdldCkpKSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IHRhcmdldC5maXJzdENoaWxkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNraXAgbm9kZXMgb2YgdW5kZWZpbmVkIG9yZGVyaW5nXG4gICAgICAgIHdoaWxlICgodGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgIT09IG51bGwpICYmICh0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5jbGFpbV9vcmRlciA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQgPSB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZC5uZXh0U2libGluZztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSAhPT0gdGFyZ2V0LmFjdHVhbF9lbmRfY2hpbGQpIHtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgaW5zZXJ0IGlmIHRoZSBvcmRlcmluZyBvZiB0aGlzIG5vZGUgc2hvdWxkIGJlIG1vZGlmaWVkIG9yIHRoZSBwYXJlbnQgbm9kZSBpcyBub3QgdGFyZ2V0XG4gICAgICAgICAgICBpZiAobm9kZS5jbGFpbV9vcmRlciAhPT0gdW5kZWZpbmVkIHx8IG5vZGUucGFyZW50Tm9kZSAhPT0gdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0YXJnZXQuYWN0dWFsX2VuZF9jaGlsZCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgaWYgKGlzX2h5ZHJhdGluZyAmJiAhYW5jaG9yKSB7XG4gICAgICAgIGFwcGVuZF9oeWRyYXRpb24odGFyZ2V0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobm9kZS5wYXJlbnROb2RlICE9PSB0YXJnZXQgfHwgbm9kZS5uZXh0U2libGluZyAhPSBhbmNob3IpIHtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IgfHwgbnVsbCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZGV0YWNoKG5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXN0cm95X2VhY2goaXRlcmF0aW9ucywgZGV0YWNoaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChpdGVyYXRpb25zW2ldKVxuICAgICAgICAgICAgaXRlcmF0aW9uc1tpXS5kKGRldGFjaGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5mdW5jdGlvbiBlbGVtZW50X2lzKG5hbWUsIGlzKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSwgeyBpcyB9KTtcbn1cbmZ1bmN0aW9uIG9iamVjdF93aXRob3V0X3Byb3BlcnRpZXMob2JqLCBleGNsdWRlKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0ge307XG4gICAgZm9yIChjb25zdCBrIGluIG9iaikge1xuICAgICAgICBpZiAoaGFzX3Byb3Aob2JqLCBrKVxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgJiYgZXhjbHVkZS5pbmRleE9mKGspID09PSAtMSkge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGFyZ2V0W2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBzdmdfZWxlbWVudChuYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cbmZ1bmN0aW9uIHRleHQoZGF0YSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cbmZ1bmN0aW9uIHNwYWNlKCkge1xuICAgIHJldHVybiB0ZXh0KCcgJyk7XG59XG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgICByZXR1cm4gdGV4dCgnJyk7XG59XG5mdW5jdGlvbiBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcHJldmVudF9kZWZhdWx0KGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RvcF9wcm9wYWdhdGlvbihmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZXZlbnQpO1xuICAgIH07XG59XG5mdW5jdGlvbiBzZWxmKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMpXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJ1c3RlZChmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoZXZlbnQuaXNUcnVzdGVkKVxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBldmVudCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGF0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkgIT09IHZhbHVlKVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIHNldF9hdHRyaWJ1dGVzKG5vZGUsIGF0dHJpYnV0ZXMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhub2RlLl9fcHJvdG9fXyk7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBpZiAoYXR0cmlidXRlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBub2RlLnN0eWxlLmNzc1RleHQgPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSAnX192YWx1ZScpIHtcbiAgICAgICAgICAgIG5vZGUudmFsdWUgPSBub2RlW2tleV0gPSBhdHRyaWJ1dGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvcnNba2V5XSAmJiBkZXNjcmlwdG9yc1trZXldLnNldCkge1xuICAgICAgICAgICAgbm9kZVtrZXldID0gYXR0cmlidXRlc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBzZXRfc3ZnX2F0dHJpYnV0ZXMobm9kZSwgYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXR0cihub2RlLCBrZXksIGF0dHJpYnV0ZXNba2V5XSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGFfbWFwKG5vZGUsIGRhdGFfbWFwKSB7XG4gICAgT2JqZWN0LmtleXMoZGF0YV9tYXApLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YShub2RlLCBrZXksIGRhdGFfbWFwW2tleV0pO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0X2N1c3RvbV9lbGVtZW50X2RhdGEobm9kZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcCBpbiBub2RlKSB7XG4gICAgICAgIG5vZGVbcHJvcF0gPSB0eXBlb2Ygbm9kZVtwcm9wXSA9PT0gJ2Jvb2xlYW4nICYmIHZhbHVlID09PSAnJyA/IHRydWUgOiB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGF0dHIobm9kZSwgcHJvcCwgdmFsdWUpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHhsaW5rX2F0dHIobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGdldF9iaW5kaW5nX2dyb3VwX3ZhbHVlKGdyb3VwLCBfX3ZhbHVlLCBjaGVja2VkKSB7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoZ3JvdXBbaV0uY2hlY2tlZClcbiAgICAgICAgICAgIHZhbHVlLmFkZChncm91cFtpXS5fX3ZhbHVlKTtcbiAgICB9XG4gICAgaWYgKCFjaGVja2VkKSB7XG4gICAgICAgIHZhbHVlLmRlbGV0ZShfX3ZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIEFycmF5LmZyb20odmFsdWUpO1xufVxuZnVuY3Rpb24gdG9fbnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAnJyA/IG51bGwgOiArdmFsdWU7XG59XG5mdW5jdGlvbiB0aW1lX3Jhbmdlc190b19hcnJheShyYW5nZXMpIHtcbiAgICBjb25zdCBhcnJheSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuZnVuY3Rpb24gaW5pdF9jbGFpbV9pbmZvKG5vZGVzKSB7XG4gICAgaWYgKG5vZGVzLmNsYWltX2luZm8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2Rlcy5jbGFpbV9pbmZvID0geyBsYXN0X2luZGV4OiAwLCB0b3RhbF9jbGFpbWVkOiAwIH07XG4gICAgfVxufVxuZnVuY3Rpb24gY2xhaW1fbm9kZShub2RlcywgcHJlZGljYXRlLCBwcm9jZXNzTm9kZSwgY3JlYXRlTm9kZSwgZG9udFVwZGF0ZUxhc3RJbmRleCA9IGZhbHNlKSB7XG4gICAgLy8gVHJ5IHRvIGZpbmQgbm9kZXMgaW4gYW4gb3JkZXIgc3VjaCB0aGF0IHdlIGxlbmd0aGVuIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2VcbiAgICBpbml0X2NsYWltX2luZm8obm9kZXMpO1xuICAgIGNvbnN0IHJlc3VsdE5vZGUgPSAoKCkgPT4ge1xuICAgICAgICAvLyBXZSBmaXJzdCB0cnkgdG8gZmluZCBhbiBlbGVtZW50IGFmdGVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAgICAgZm9yIChsZXQgaSA9IG5vZGVzLmNsYWltX2luZm8ubGFzdF9pbmRleDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXNbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZW1lbnQgPSBwcm9jZXNzTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAocmVwbGFjZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2Rlc1tpXSA9IHJlcGxhY2VtZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRVcGRhdGVMYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSB0cnkgdG8gZmluZCBvbmUgYmVmb3JlXG4gICAgICAgIC8vIFdlIGl0ZXJhdGUgaW4gcmV2ZXJzZSBzbyB0aGF0IHdlIGRvbid0IGdvIHRvbyBmYXIgYmFja1xuICAgICAgICBmb3IgKGxldCBpID0gbm9kZXMuY2xhaW1faW5mby5sYXN0X2luZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBsYWNlbWVudCA9IHByb2Nlc3NOb2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzW2ldID0gcmVwbGFjZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZG9udFVwZGF0ZUxhc3RJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXBsYWNlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIHNwbGljZWQgYmVmb3JlIHRoZSBsYXN0X2luZGV4LCB3ZSBkZWNyZWFzZSBpdFxuICAgICAgICAgICAgICAgICAgICBub2Rlcy5jbGFpbV9pbmZvLmxhc3RfaW5kZXgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgd2UgY2FuJ3QgZmluZCBhbnkgbWF0Y2hpbmcgbm9kZSwgd2UgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gY3JlYXRlTm9kZSgpO1xuICAgIH0pKCk7XG4gICAgcmVzdWx0Tm9kZS5jbGFpbV9vcmRlciA9IG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZDtcbiAgICBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQgKz0gMTtcbiAgICByZXR1cm4gcmVzdWx0Tm9kZTtcbn1cbmZ1bmN0aW9uIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgY3JlYXRlX2VsZW1lbnQpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZU5hbWUgPT09IG5hbWUsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlbW92ZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuICAgICAgICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZS5wdXNoKGF0dHJpYnV0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZW1vdmUuZm9yRWFjaCh2ID0+IG5vZGUucmVtb3ZlQXR0cmlidXRlKHYpKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LCAoKSA9PiBjcmVhdGVfZWxlbWVudChuYW1lKSk7XG59XG5mdW5jdGlvbiBjbGFpbV9lbGVtZW50KG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzKSB7XG4gICAgcmV0dXJuIGNsYWltX2VsZW1lbnRfYmFzZShub2RlcywgbmFtZSwgYXR0cmlidXRlcywgZWxlbWVudCk7XG59XG5mdW5jdGlvbiBjbGFpbV9zdmdfZWxlbWVudChub2RlcywgbmFtZSwgYXR0cmlidXRlcykge1xuICAgIHJldHVybiBjbGFpbV9lbGVtZW50X2Jhc2Uobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Z19lbGVtZW50KTtcbn1cbmZ1bmN0aW9uIGNsYWltX3RleHQobm9kZXMsIGRhdGEpIHtcbiAgICByZXR1cm4gY2xhaW1fbm9kZShub2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IDMsIChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGFTdHIgPSAnJyArIGRhdGE7XG4gICAgICAgIGlmIChub2RlLmRhdGEuc3RhcnRzV2l0aChkYXRhU3RyKSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuZGF0YS5sZW5ndGggIT09IGRhdGFTdHIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuc3BsaXRUZXh0KGRhdGFTdHIubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUuZGF0YSA9IGRhdGFTdHI7XG4gICAgICAgIH1cbiAgICB9LCAoKSA9PiB0ZXh0KGRhdGEpLCB0cnVlIC8vIFRleHQgbm9kZXMgc2hvdWxkIG5vdCB1cGRhdGUgbGFzdCBpbmRleCBzaW5jZSBpdCBpcyBsaWtlbHkgbm90IHdvcnRoIGl0IHRvIGVsaW1pbmF0ZSBhbiBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIG9mIGFjdHVhbCBlbGVtZW50c1xuICAgICk7XG59XG5mdW5jdGlvbiBjbGFpbV9zcGFjZShub2Rlcykge1xuICAgIHJldHVybiBjbGFpbV90ZXh0KG5vZGVzLCAnICcpO1xufVxuZnVuY3Rpb24gZmluZF9jb21tZW50KG5vZGVzLCB0ZXh0LCBzdGFydCkge1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDggLyogY29tbWVudCBub2RlICovICYmIG5vZGUudGV4dENvbnRlbnQudHJpbSgpID09PSB0ZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9kZXMubGVuZ3RoO1xufVxuZnVuY3Rpb24gY2xhaW1faHRtbF90YWcobm9kZXMsIGlzX3N2Zykge1xuICAgIC8vIGZpbmQgaHRtbCBvcGVuaW5nIHRhZ1xuICAgIGNvbnN0IHN0YXJ0X2luZGV4ID0gZmluZF9jb21tZW50KG5vZGVzLCAnSFRNTF9UQUdfU1RBUlQnLCAwKTtcbiAgICBjb25zdCBlbmRfaW5kZXggPSBmaW5kX2NvbW1lbnQobm9kZXMsICdIVE1MX1RBR19FTkQnLCBzdGFydF9pbmRleCk7XG4gICAgaWYgKHN0YXJ0X2luZGV4ID09PSBlbmRfaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIdG1sVGFnSHlkcmF0aW9uKHVuZGVmaW5lZCwgaXNfc3ZnKTtcbiAgICB9XG4gICAgaW5pdF9jbGFpbV9pbmZvKG5vZGVzKTtcbiAgICBjb25zdCBodG1sX3RhZ19ub2RlcyA9IG5vZGVzLnNwbGljZShzdGFydF9pbmRleCwgZW5kX2luZGV4IC0gc3RhcnRfaW5kZXggKyAxKTtcbiAgICBkZXRhY2goaHRtbF90YWdfbm9kZXNbMF0pO1xuICAgIGRldGFjaChodG1sX3RhZ19ub2Rlc1todG1sX3RhZ19ub2Rlcy5sZW5ndGggLSAxXSk7XG4gICAgY29uc3QgY2xhaW1lZF9ub2RlcyA9IGh0bWxfdGFnX25vZGVzLnNsaWNlKDEsIGh0bWxfdGFnX25vZGVzLmxlbmd0aCAtIDEpO1xuICAgIGZvciAoY29uc3QgbiBvZiBjbGFpbWVkX25vZGVzKSB7XG4gICAgICAgIG4uY2xhaW1fb3JkZXIgPSBub2Rlcy5jbGFpbV9pbmZvLnRvdGFsX2NsYWltZWQ7XG4gICAgICAgIG5vZGVzLmNsYWltX2luZm8udG90YWxfY2xhaW1lZCArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEh0bWxUYWdIeWRyYXRpb24oY2xhaW1lZF9ub2RlcywgaXNfc3ZnKTtcbn1cbmZ1bmN0aW9uIHNldF9kYXRhKHRleHQsIGRhdGEpIHtcbiAgICBkYXRhID0gJycgKyBkYXRhO1xuICAgIGlmICh0ZXh0Lndob2xlVGV4dCAhPT0gZGF0YSlcbiAgICAgICAgdGV4dC5kYXRhID0gZGF0YTtcbn1cbmZ1bmN0aW9uIHNldF9pbnB1dF92YWx1ZShpbnB1dCwgdmFsdWUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xufVxuZnVuY3Rpb24gc2V0X2lucHV0X3R5cGUoaW5wdXQsIHR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICBpbnB1dC50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldF9zdHlsZShub2RlLCBrZXksIHZhbHVlLCBpbXBvcnRhbnQpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgbm9kZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlLCBpbXBvcnRhbnQgPyAnaW1wb3J0YW50JyA6ICcnKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZWxlY3Rfb3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNlbGVjdC5zZWxlY3RlZEluZGV4ID0gLTE7IC8vIG5vIG9wdGlvbiBzaG91bGQgYmUgc2VsZWN0ZWRcbn1cbmZ1bmN0aW9uIHNlbGVjdF9vcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gc2VsZWN0X3ZhbHVlKHNlbGVjdCkge1xuICAgIGNvbnN0IHNlbGVjdGVkX29wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuICAgIHJldHVybiBzZWxlY3RlZF9vcHRpb24gJiYgc2VsZWN0ZWRfb3B0aW9uLl9fdmFsdWU7XG59XG5mdW5jdGlvbiBzZWxlY3RfbXVsdGlwbGVfdmFsdWUoc2VsZWN0KSB7XG4gICAgcmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBvcHRpb24gPT4gb3B0aW9uLl9fdmFsdWUpO1xufVxuLy8gdW5mb3J0dW5hdGVseSB0aGlzIGNhbid0IGJlIGEgY29uc3RhbnQgYXMgdGhhdCB3b3VsZG4ndCBiZSB0cmVlLXNoYWtlYWJsZVxuLy8gc28gd2UgY2FjaGUgdGhlIHJlc3VsdCBpbnN0ZWFkXG5sZXQgY3Jvc3NvcmlnaW47XG5mdW5jdGlvbiBpc19jcm9zc29yaWdpbigpIHtcbiAgICBpZiAoY3Jvc3NvcmlnaW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjcm9zc29yaWdpbiA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjcm9zc29yaWdpbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNyb3Nzb3JpZ2luO1xufVxuZnVuY3Rpb24gYWRkX3Jlc2l6ZV9saXN0ZW5lcihub2RlLCBmbikge1xuICAgIGNvbnN0IGNvbXB1dGVkX3N0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoY29tcHV0ZWRfc3R5bGUucG9zaXRpb24gPT09ICdzdGF0aWMnKSB7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7ICcgK1xuICAgICAgICAnb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAwOyBvcGFjaXR5OiAwOyBwb2ludGVyLWV2ZW50czogbm9uZTsgei1pbmRleDogLTE7Jyk7XG4gICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGlmcmFtZS50YWJJbmRleCA9IC0xO1xuICAgIGNvbnN0IGNyb3Nzb3JpZ2luID0gaXNfY3Jvc3NvcmlnaW4oKTtcbiAgICBsZXQgdW5zdWJzY3JpYmU7XG4gICAgaWYgKGNyb3Nzb3JpZ2luKSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSBcImRhdGE6dGV4dC9odG1sLDxzY3JpcHQ+b25yZXNpemU9ZnVuY3Rpb24oKXtwYXJlbnQucG9zdE1lc3NhZ2UoMCwnKicpfTwvc2NyaXB0PlwiO1xuICAgICAgICB1bnN1YnNjcmliZSA9IGxpc3Rlbih3aW5kb3csICdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuc291cmNlID09PSBpZnJhbWUuY29udGVudFdpbmRvdylcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmcmFtZS5zcmMgPSAnYWJvdXQ6YmxhbmsnO1xuICAgICAgICBpZnJhbWUub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUgPSBsaXN0ZW4oaWZyYW1lLmNvbnRlbnRXaW5kb3csICdyZXNpemUnLCBmbik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGFwcGVuZChub2RlLCBpZnJhbWUpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmIChjcm9zc29yaWdpbikge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bnN1YnNjcmliZSAmJiBpZnJhbWUuY29udGVudFdpbmRvdykge1xuICAgICAgICAgICAgdW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfVxuICAgICAgICBkZXRhY2goaWZyYW1lKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gdG9nZ2xlX2NsYXNzKGVsZW1lbnQsIG5hbWUsIHRvZ2dsZSkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0W3RvZ2dsZSA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xufVxuZnVuY3Rpb24gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgeyBidWJibGVzID0gZmFsc2UsIGNhbmNlbGFibGUgPSBmYWxzZSB9ID0ge30pIHtcbiAgICBjb25zdCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZS5pbml0Q3VzdG9tRXZlbnQodHlwZSwgYnViYmxlcywgY2FuY2VsYWJsZSwgZGV0YWlsKTtcbiAgICByZXR1cm4gZTtcbn1cbmZ1bmN0aW9uIHF1ZXJ5X3NlbGVjdG9yX2FsbChzZWxlY3RvciwgcGFyZW50ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59XG5mdW5jdGlvbiBoZWFkX3NlbGVjdG9yKG5vZGVJZCwgaGVhZCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBzdGFydGVkID0gMDtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgaGVhZC5jaGlsZE5vZGVzKSB7XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIGNvbW1lbnQgbm9kZSAqLykge1xuICAgICAgICAgICAgY29uc3QgY29tbWVudCA9IG5vZGUudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKGNvbW1lbnQgPT09IGBIRUFEXyR7bm9kZUlkfV9FTkRgKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRlZCAtPSAxO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY29tbWVudCA9PT0gYEhFQURfJHtub2RlSWR9X1NUQVJUYCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGFydGVkID4gMCkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmNsYXNzIEh0bWxUYWcge1xuICAgIGNvbnN0cnVjdG9yKGlzX3N2ZyA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuaXNfc3ZnID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNfc3ZnID0gaXNfc3ZnO1xuICAgICAgICB0aGlzLmUgPSB0aGlzLm4gPSBudWxsO1xuICAgIH1cbiAgICBjKGh0bWwpIHtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgIH1cbiAgICBtKGh0bWwsIHRhcmdldCwgYW5jaG9yID0gbnVsbCkge1xuICAgICAgICBpZiAoIXRoaXMuZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNfc3ZnKVxuICAgICAgICAgICAgICAgIHRoaXMuZSA9IHN2Z19lbGVtZW50KHRhcmdldC5ub2RlTmFtZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5lID0gZWxlbWVudCh0YXJnZXQubm9kZU5hbWUpO1xuICAgICAgICAgICAgdGhpcy50ID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5jKGh0bWwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaShhbmNob3IpO1xuICAgIH1cbiAgICBoKGh0bWwpIHtcbiAgICAgICAgdGhpcy5lLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIHRoaXMubiA9IEFycmF5LmZyb20odGhpcy5lLmNoaWxkTm9kZXMpO1xuICAgIH1cbiAgICBpKGFuY2hvcikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5zZXJ0KHRoaXMudCwgdGhpcy5uW2ldLCBhbmNob3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHAoaHRtbCkge1xuICAgICAgICB0aGlzLmQoKTtcbiAgICAgICAgdGhpcy5oKGh0bWwpO1xuICAgICAgICB0aGlzLmkodGhpcy5hKTtcbiAgICB9XG4gICAgZCgpIHtcbiAgICAgICAgdGhpcy5uLmZvckVhY2goZGV0YWNoKTtcbiAgICB9XG59XG5jbGFzcyBIdG1sVGFnSHlkcmF0aW9uIGV4dGVuZHMgSHRtbFRhZyB7XG4gICAgY29uc3RydWN0b3IoY2xhaW1lZF9ub2RlcywgaXNfc3ZnID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoaXNfc3ZnKTtcbiAgICAgICAgdGhpcy5lID0gdGhpcy5uID0gbnVsbDtcbiAgICAgICAgdGhpcy5sID0gY2xhaW1lZF9ub2RlcztcbiAgICB9XG4gICAgYyhodG1sKSB7XG4gICAgICAgIGlmICh0aGlzLmwpIHtcbiAgICAgICAgICAgIHRoaXMubiA9IHRoaXMubDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmMoaHRtbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaShhbmNob3IpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm4ubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluc2VydF9oeWRyYXRpb24odGhpcy50LCB0aGlzLm5baV0sIGFuY2hvcik7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhdHRyaWJ1dGVfdG9fb2JqZWN0KGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJlc3VsdFthdHRyaWJ1dGUubmFtZV0gPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzKGVsZW1lbnQpIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICByZXN1bHRbbm9kZS5zbG90IHx8ICdkZWZhdWx0J10gPSB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBjb25zdHJ1Y3Rfc3ZlbHRlX2NvbXBvbmVudChjb21wb25lbnQsIHByb3BzKSB7XG4gICAgcmV0dXJuIG5ldyBjb21wb25lbnQocHJvcHMpO1xufVxuXG4vLyB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBpbmZvcm1hdGlvbiBmb3IgbXVsdGlwbGUgZG9jdW1lbnRzIGJlY2F1c2UgYSBTdmVsdGUgYXBwbGljYXRpb24gY291bGQgYWxzbyBjb250YWluIGlmcmFtZXNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvaXNzdWVzLzM2MjRcbmNvbnN0IG1hbmFnZWRfc3R5bGVzID0gbmV3IE1hcCgpO1xubGV0IGFjdGl2ZSA9IDA7XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcbiAgICBsZXQgaGFzaCA9IDUzODE7XG4gICAgbGV0IGkgPSBzdHIubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pXG4gICAgICAgIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBoYXNoID4+PiAwO1xufVxuZnVuY3Rpb24gY3JlYXRlX3N0eWxlX2luZm9ybWF0aW9uKGRvYywgbm9kZSkge1xuICAgIGNvbnN0IGluZm8gPSB7IHN0eWxlc2hlZXQ6IGFwcGVuZF9lbXB0eV9zdHlsZXNoZWV0KG5vZGUpLCBydWxlczoge30gfTtcbiAgICBtYW5hZ2VkX3N0eWxlcy5zZXQoZG9jLCBpbmZvKTtcbiAgICByZXR1cm4gaW5mbztcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9ydWxlKG5vZGUsIGEsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzZSwgZm4sIHVpZCA9IDApIHtcbiAgICBjb25zdCBzdGVwID0gMTYuNjY2IC8gZHVyYXRpb247XG4gICAgbGV0IGtleWZyYW1lcyA9ICd7XFxuJztcbiAgICBmb3IgKGxldCBwID0gMDsgcCA8PSAxOyBwICs9IHN0ZXApIHtcbiAgICAgICAgY29uc3QgdCA9IGEgKyAoYiAtIGEpICogZWFzZShwKTtcbiAgICAgICAga2V5ZnJhbWVzICs9IHAgKiAxMDAgKyBgJXske2ZuKHQsIDEgLSB0KX19XFxuYDtcbiAgICB9XG4gICAgY29uc3QgcnVsZSA9IGtleWZyYW1lcyArIGAxMDAlIHske2ZuKGIsIDEgLSBiKX19XFxufWA7XG4gICAgY29uc3QgbmFtZSA9IGBfX3N2ZWx0ZV8ke2hhc2gocnVsZSl9XyR7dWlkfWA7XG4gICAgY29uc3QgZG9jID0gZ2V0X3Jvb3RfZm9yX3N0eWxlKG5vZGUpO1xuICAgIGNvbnN0IHsgc3R5bGVzaGVldCwgcnVsZXMgfSA9IG1hbmFnZWRfc3R5bGVzLmdldChkb2MpIHx8IGNyZWF0ZV9zdHlsZV9pbmZvcm1hdGlvbihkb2MsIG5vZGUpO1xuICAgIGlmICghcnVsZXNbbmFtZV0pIHtcbiAgICAgICAgcnVsZXNbbmFtZV0gPSB0cnVlO1xuICAgICAgICBzdHlsZXNoZWV0Lmluc2VydFJ1bGUoYEBrZXlmcmFtZXMgJHtuYW1lfSAke3J1bGV9YCwgc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgIH1cbiAgICBjb25zdCBhbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJztcbiAgICBub2RlLnN0eWxlLmFuaW1hdGlvbiA9IGAke2FuaW1hdGlvbiA/IGAke2FuaW1hdGlvbn0sIGAgOiAnJ30ke25hbWV9ICR7ZHVyYXRpb259bXMgbGluZWFyICR7ZGVsYXl9bXMgMSBib3RoYDtcbiAgICBhY3RpdmUgKz0gMTtcbiAgICByZXR1cm4gbmFtZTtcbn1cbmZ1bmN0aW9uIGRlbGV0ZV9ydWxlKG5vZGUsIG5hbWUpIHtcbiAgICBjb25zdCBwcmV2aW91cyA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJykuc3BsaXQoJywgJyk7XG4gICAgY29uc3QgbmV4dCA9IHByZXZpb3VzLmZpbHRlcihuYW1lXG4gICAgICAgID8gYW5pbSA9PiBhbmltLmluZGV4T2YobmFtZSkgPCAwIC8vIHJlbW92ZSBzcGVjaWZpYyBhbmltYXRpb25cbiAgICAgICAgOiBhbmltID0+IGFuaW0uaW5kZXhPZignX19zdmVsdGUnKSA9PT0gLTEgLy8gcmVtb3ZlIGFsbCBTdmVsdGUgYW5pbWF0aW9uc1xuICAgICk7XG4gICAgY29uc3QgZGVsZXRlZCA9IHByZXZpb3VzLmxlbmd0aCAtIG5leHQubGVuZ3RoO1xuICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgIG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gbmV4dC5qb2luKCcsICcpO1xuICAgICAgICBhY3RpdmUgLT0gZGVsZXRlZDtcbiAgICAgICAgaWYgKCFhY3RpdmUpXG4gICAgICAgICAgICBjbGVhcl9ydWxlcygpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFyX3J1bGVzKCkge1xuICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmIChhY3RpdmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG1hbmFnZWRfc3R5bGVzLmZvckVhY2goaW5mbyA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IG93bmVyTm9kZSB9ID0gaW5mby5zdHlsZXNoZWV0O1xuICAgICAgICAgICAgLy8gdGhlcmUgaXMgbm8gb3duZXJOb2RlIGlmIGl0IHJ1bnMgb24ganNkb20uXG4gICAgICAgICAgICBpZiAob3duZXJOb2RlKVxuICAgICAgICAgICAgICAgIGRldGFjaChvd25lck5vZGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgbWFuYWdlZF9zdHlsZXMuY2xlYXIoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2FuaW1hdGlvbihub2RlLCBmcm9tLCBmbiwgcGFyYW1zKSB7XG4gICAgaWYgKCFmcm9tKVxuICAgICAgICByZXR1cm4gbm9vcDtcbiAgICBjb25zdCB0byA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKGZyb20ubGVmdCA9PT0gdG8ubGVmdCAmJiBmcm9tLnJpZ2h0ID09PSB0by5yaWdodCAmJiBmcm9tLnRvcCA9PT0gdG8udG9wICYmIGZyb20uYm90dG9tID09PSB0by5ib3R0b20pXG4gICAgICAgIHJldHVybiBub29wO1xuICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIFxuICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogc2hvdWxkIHRoaXMgYmUgc2VwYXJhdGVkIGZyb20gZGVzdHJ1Y3R1cmluZz8gT3Igc3RhcnQvZW5kIGFkZGVkIHRvIHB1YmxpYyBhcGkgYW5kIGRvY3VtZW50YXRpb24/XG4gICAgc3RhcnQ6IHN0YXJ0X3RpbWUgPSBub3coKSArIGRlbGF5LCBcbiAgICAvLyBAdHMtaWdub3JlIHRvZG86XG4gICAgZW5kID0gc3RhcnRfdGltZSArIGR1cmF0aW9uLCB0aWNrID0gbm9vcCwgY3NzIH0gPSBmbihub2RlLCB7IGZyb20sIHRvIH0sIHBhcmFtcyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBzdGFydGVkID0gZmFsc2U7XG4gICAgbGV0IG5hbWU7XG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgIG5hbWUgPSBjcmVhdGVfcnVsZShub2RlLCAwLCAxLCBkdXJhdGlvbiwgZGVsYXksIGVhc2luZywgY3NzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRlbGF5KSB7XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICBpZiAoY3NzKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgbmFtZSk7XG4gICAgICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgbG9vcChub3cgPT4ge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQgJiYgbm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGFydGVkICYmIG5vdyA+PSBlbmQpIHtcbiAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFydW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBub3cgLSBzdGFydF90aW1lO1xuICAgICAgICAgICAgY29uc3QgdCA9IDAgKyAxICogZWFzaW5nKHAgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICB0aWNrKHQsIDEgLSB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBzdGFydCgpO1xuICAgIHRpY2soMCwgMSk7XG4gICAgcmV0dXJuIHN0b3A7XG59XG5mdW5jdGlvbiBmaXhfcG9zaXRpb24obm9kZSkge1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcbiAgICBpZiAoc3R5bGUucG9zaXRpb24gIT09ICdhYnNvbHV0ZScgJiYgc3R5bGUucG9zaXRpb24gIT09ICdmaXhlZCcpIHtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSBzdHlsZTtcbiAgICAgICAgY29uc3QgYSA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIG5vZGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICBub2RlLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIG5vZGUuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBhZGRfdHJhbnNmb3JtKG5vZGUsIGEpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZF90cmFuc2Zvcm0obm9kZSwgYSkge1xuICAgIGNvbnN0IGIgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGlmIChhLmxlZnQgIT09IGIubGVmdCB8fCBhLnRvcCAhPT0gYi50b3ApIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBzdHlsZS50cmFuc2Zvcm0gPT09ICdub25lJyA/ICcnIDogc3R5bGUudHJhbnNmb3JtO1xuICAgICAgICBub2RlLnN0eWxlLnRyYW5zZm9ybSA9IGAke3RyYW5zZm9ybX0gdHJhbnNsYXRlKCR7YS5sZWZ0IC0gYi5sZWZ0fXB4LCAke2EudG9wIC0gYi50b3B9cHgpYDtcbiAgICB9XG59XG5cbmxldCBjdXJyZW50X2NvbXBvbmVudDtcbmZ1bmN0aW9uIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBjdXJyZW50X2NvbXBvbmVudCA9IGNvbXBvbmVudDtcbn1cbmZ1bmN0aW9uIGdldF9jdXJyZW50X2NvbXBvbmVudCgpIHtcbiAgICBpZiAoIWN1cnJlbnRfY29tcG9uZW50KVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIGNhbGxlZCBvdXRzaWRlIGNvbXBvbmVudCBpbml0aWFsaXphdGlvbicpO1xuICAgIHJldHVybiBjdXJyZW50X2NvbXBvbmVudDtcbn1cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gcnVuIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIHVwZGF0ZWQgYWZ0ZXIgYW55IHN0YXRlIGNoYW5nZS5cbiAqXG4gKiBUaGUgZmlyc3QgdGltZSB0aGUgY2FsbGJhY2sgcnVucyB3aWxsIGJlIGJlZm9yZSB0aGUgaW5pdGlhbCBgb25Nb3VudGBcbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtYmVmb3JldXBkYXRlXG4gKi9cbmZ1bmN0aW9uIGJlZm9yZVVwZGF0ZShmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLmJlZm9yZV91cGRhdGUucHVzaChmbik7XG59XG4vKipcbiAqIFRoZSBgb25Nb3VudGAgZnVuY3Rpb24gc2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gcnVuIGFzIHNvb24gYXMgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiBtb3VudGVkIHRvIHRoZSBET00uXG4gKiBJdCBtdXN0IGJlIGNhbGxlZCBkdXJpbmcgdGhlIGNvbXBvbmVudCdzIGluaXRpYWxpc2F0aW9uIChidXQgZG9lc24ndCBuZWVkIHRvIGxpdmUgKmluc2lkZSogdGhlIGNvbXBvbmVudDtcbiAqIGl0IGNhbiBiZSBjYWxsZWQgZnJvbSBhbiBleHRlcm5hbCBtb2R1bGUpLlxuICpcbiAqIGBvbk1vdW50YCBkb2VzIG5vdCBydW4gaW5zaWRlIGEgW3NlcnZlci1zaWRlIGNvbXBvbmVudF0oL2RvY3MjcnVuLXRpbWUtc2VydmVyLXNpZGUtY29tcG9uZW50LWFwaSkuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLW9ubW91bnRcbiAqL1xuZnVuY3Rpb24gb25Nb3VudChmbikge1xuICAgIGdldF9jdXJyZW50X2NvbXBvbmVudCgpLiQkLm9uX21vdW50LnB1c2goZm4pO1xufVxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBydW4gaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGNvbXBvbmVudCBoYXMgYmVlbiB1cGRhdGVkLlxuICpcbiAqIFRoZSBmaXJzdCB0aW1lIHRoZSBjYWxsYmFjayBydW5zIHdpbGwgYmUgYWZ0ZXIgdGhlIGluaXRpYWwgYG9uTW91bnRgXG4gKi9cbmZ1bmN0aW9uIGFmdGVyVXBkYXRlKGZuKSB7XG4gICAgZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuYWZ0ZXJfdXBkYXRlLnB1c2goZm4pO1xufVxuLyoqXG4gKiBTY2hlZHVsZXMgYSBjYWxsYmFjayB0byBydW4gaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgdW5tb3VudGVkLlxuICpcbiAqIE91dCBvZiBgb25Nb3VudGAsIGBiZWZvcmVVcGRhdGVgLCBgYWZ0ZXJVcGRhdGVgIGFuZCBgb25EZXN0cm95YCwgdGhpcyBpcyB0aGVcbiAqIG9ubHkgb25lIHRoYXQgcnVucyBpbnNpZGUgYSBzZXJ2ZXItc2lkZSBjb21wb25lbnQuXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLW9uZGVzdHJveVxuICovXG5mdW5jdGlvbiBvbkRlc3Ryb3koZm4pIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5vbl9kZXN0cm95LnB1c2goZm4pO1xufVxuLyoqXG4gKiBDcmVhdGVzIGFuIGV2ZW50IGRpc3BhdGNoZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBkaXNwYXRjaCBbY29tcG9uZW50IGV2ZW50c10oL2RvY3MjdGVtcGxhdGUtc3ludGF4LWNvbXBvbmVudC1kaXJlY3RpdmVzLW9uLWV2ZW50bmFtZSkuXG4gKiBFdmVudCBkaXNwYXRjaGVycyBhcmUgZnVuY3Rpb25zIHRoYXQgY2FuIHRha2UgdHdvIGFyZ3VtZW50czogYG5hbWVgIGFuZCBgZGV0YWlsYC5cbiAqXG4gKiBDb21wb25lbnQgZXZlbnRzIGNyZWF0ZWQgd2l0aCBgY3JlYXRlRXZlbnREaXNwYXRjaGVyYCBjcmVhdGUgYVxuICogW0N1c3RvbUV2ZW50XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnQpLlxuICogVGhlc2UgZXZlbnRzIGRvIG5vdCBbYnViYmxlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0xlYXJuL0phdmFTY3JpcHQvQnVpbGRpbmdfYmxvY2tzL0V2ZW50cyNFdmVudF9idWJibGluZ19hbmRfY2FwdHVyZSkuXG4gKiBUaGUgYGRldGFpbGAgYXJndW1lbnQgY29ycmVzcG9uZHMgdG8gdGhlIFtDdXN0b21FdmVudC5kZXRhaWxdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudC9kZXRhaWwpXG4gKiBwcm9wZXJ0eSBhbmQgY2FuIGNvbnRhaW4gYW55IHR5cGUgb2YgZGF0YS5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtY3JlYXRlZXZlbnRkaXNwYXRjaGVyXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSBnZXRfY3VycmVudF9jb21wb25lbnQoKTtcbiAgICByZXR1cm4gKHR5cGUsIGRldGFpbCwgeyBjYW5jZWxhYmxlID0gZmFsc2UgfSA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IGNvbXBvbmVudC4kJC5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYXJlIHRoZXJlIHNpdHVhdGlvbnMgd2hlcmUgZXZlbnRzIGNvdWxkIGJlIGRpc3BhdGNoZWRcbiAgICAgICAgICAgIC8vIGluIGEgc2VydmVyIChub24tRE9NKSBlbnZpcm9ubWVudD9cbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gY3VzdG9tX2V2ZW50KHR5cGUsIGRldGFpbCwgeyBjYW5jZWxhYmxlIH0pO1xuICAgICAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb21wb25lbnQsIGV2ZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICFldmVudC5kZWZhdWx0UHJldmVudGVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG59XG4vKipcbiAqIEFzc29jaWF0ZXMgYW4gYXJiaXRyYXJ5IGBjb250ZXh0YCBvYmplY3Qgd2l0aCB0aGUgY3VycmVudCBjb21wb25lbnQgYW5kIHRoZSBzcGVjaWZpZWQgYGtleWBcbiAqIGFuZCByZXR1cm5zIHRoYXQgb2JqZWN0LiBUaGUgY29udGV4dCBpcyB0aGVuIGF2YWlsYWJsZSB0byBjaGlsZHJlbiBvZiB0aGUgY29tcG9uZW50XG4gKiAoaW5jbHVkaW5nIHNsb3R0ZWQgY29udGVudCkgd2l0aCBgZ2V0Q29udGV4dGAuXG4gKlxuICogTGlrZSBsaWZlY3ljbGUgZnVuY3Rpb25zLCB0aGlzIG11c3QgYmUgY2FsbGVkIGR1cmluZyBjb21wb25lbnQgaW5pdGlhbGlzYXRpb24uXG4gKlxuICogaHR0cHM6Ly9zdmVsdGUuZGV2L2RvY3MjcnVuLXRpbWUtc3ZlbHRlLXNldGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gc2V0Q29udGV4dChrZXksIGNvbnRleHQpIHtcbiAgICBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LnNldChrZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0O1xufVxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGNvbnRleHQgdGhhdCBiZWxvbmdzIHRvIHRoZSBjbG9zZXN0IHBhcmVudCBjb21wb25lbnQgd2l0aCB0aGUgc3BlY2lmaWVkIGBrZXlgLlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtZ2V0Y29udGV4dFxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmdldChrZXkpO1xufVxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHdob2xlIGNvbnRleHQgbWFwIHRoYXQgYmVsb25ncyB0byB0aGUgY2xvc2VzdCBwYXJlbnQgY29tcG9uZW50LlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi4gVXNlZnVsLCBmb3IgZXhhbXBsZSwgaWYgeW91XG4gKiBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZSBhIGNvbXBvbmVudCBhbmQgd2FudCB0byBwYXNzIHRoZSBleGlzdGluZyBjb250ZXh0IHRvIGl0LlxuICpcbiAqIGh0dHBzOi8vc3ZlbHRlLmRldi9kb2NzI3J1bi10aW1lLXN2ZWx0ZS1nZXRhbGxjb250ZXh0c1xuICovXG5mdW5jdGlvbiBnZXRBbGxDb250ZXh0cygpIHtcbiAgICByZXR1cm4gZ2V0X2N1cnJlbnRfY29tcG9uZW50KCkuJCQuY29udGV4dDtcbn1cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBnaXZlbiBga2V5YCBoYXMgYmVlbiBzZXQgaW4gdGhlIGNvbnRleHQgb2YgYSBwYXJlbnQgY29tcG9uZW50LlxuICogTXVzdCBiZSBjYWxsZWQgZHVyaW5nIGNvbXBvbmVudCBpbml0aWFsaXNhdGlvbi5cbiAqXG4gKiBodHRwczovL3N2ZWx0ZS5kZXYvZG9jcyNydW4tdGltZS1zdmVsdGUtaGFzY29udGV4dFxuICovXG5mdW5jdGlvbiBoYXNDb250ZXh0KGtleSkge1xuICAgIHJldHVybiBnZXRfY3VycmVudF9jb21wb25lbnQoKS4kJC5jb250ZXh0LmhhcyhrZXkpO1xufVxuLy8gVE9ETyBmaWd1cmUgb3V0IGlmIHdlIHN0aWxsIHdhbnQgdG8gc3VwcG9ydFxuLy8gc2hvcnRoYW5kIGV2ZW50cywgb3IgaWYgd2Ugd2FudCB0byBpbXBsZW1lbnRcbi8vIGEgcmVhbCBidWJibGluZyBtZWNoYW5pc21cbmZ1bmN0aW9uIGJ1YmJsZShjb21wb25lbnQsIGV2ZW50KSB7XG4gICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudC50eXBlXTtcbiAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY2FsbGJhY2tzLnNsaWNlKCkuZm9yRWFjaChmbiA9PiBmbi5jYWxsKHRoaXMsIGV2ZW50KSk7XG4gICAgfVxufVxuXG5jb25zdCBkaXJ0eV9jb21wb25lbnRzID0gW107XG5jb25zdCBpbnRyb3MgPSB7IGVuYWJsZWQ6IGZhbHNlIH07XG5jb25zdCBiaW5kaW5nX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgcmVuZGVyX2NhbGxiYWNrcyA9IFtdO1xuY29uc3QgZmx1c2hfY2FsbGJhY2tzID0gW107XG5jb25zdCByZXNvbHZlZF9wcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5sZXQgdXBkYXRlX3NjaGVkdWxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2NoZWR1bGVfdXBkYXRlKCkge1xuICAgIGlmICghdXBkYXRlX3NjaGVkdWxlZCkge1xuICAgICAgICB1cGRhdGVfc2NoZWR1bGVkID0gdHJ1ZTtcbiAgICAgICAgcmVzb2x2ZWRfcHJvbWlzZS50aGVuKGZsdXNoKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0aWNrKCkge1xuICAgIHNjaGVkdWxlX3VwZGF0ZSgpO1xuICAgIHJldHVybiByZXNvbHZlZF9wcm9taXNlO1xufVxuZnVuY3Rpb24gYWRkX3JlbmRlcl9jYWxsYmFjayhmbikge1xuICAgIHJlbmRlcl9jYWxsYmFja3MucHVzaChmbik7XG59XG5mdW5jdGlvbiBhZGRfZmx1c2hfY2FsbGJhY2soZm4pIHtcbiAgICBmbHVzaF9jYWxsYmFja3MucHVzaChmbik7XG59XG4vLyBmbHVzaCgpIGNhbGxzIGNhbGxiYWNrcyBpbiB0aGlzIG9yZGVyOlxuLy8gMS4gQWxsIGJlZm9yZVVwZGF0ZSBjYWxsYmFja3MsIGluIG9yZGVyOiBwYXJlbnRzIGJlZm9yZSBjaGlsZHJlblxuLy8gMi4gQWxsIGJpbmQ6dGhpcyBjYWxsYmFja3MsIGluIHJldmVyc2Ugb3JkZXI6IGNoaWxkcmVuIGJlZm9yZSBwYXJlbnRzLlxuLy8gMy4gQWxsIGFmdGVyVXBkYXRlIGNhbGxiYWNrcywgaW4gb3JkZXI6IHBhcmVudHMgYmVmb3JlIGNoaWxkcmVuLiBFWENFUFRcbi8vICAgIGZvciBhZnRlclVwZGF0ZXMgY2FsbGVkIGR1cmluZyB0aGUgaW5pdGlhbCBvbk1vdW50LCB3aGljaCBhcmUgY2FsbGVkIGluXG4vLyAgICByZXZlcnNlIG9yZGVyOiBjaGlsZHJlbiBiZWZvcmUgcGFyZW50cy5cbi8vIFNpbmNlIGNhbGxiYWNrcyBtaWdodCB1cGRhdGUgY29tcG9uZW50IHZhbHVlcywgd2hpY2ggY291bGQgdHJpZ2dlciBhbm90aGVyXG4vLyBjYWxsIHRvIGZsdXNoKCksIHRoZSBmb2xsb3dpbmcgc3RlcHMgZ3VhcmQgYWdhaW5zdCB0aGlzOlxuLy8gMS4gRHVyaW5nIGJlZm9yZVVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuLy8gICAgZGlydHlfY29tcG9uZW50cyBhcnJheSBhbmQgd2lsbCBjYXVzZSBhIHJlZW50cmFudCBjYWxsIHRvIGZsdXNoKCkuIEJlY2F1c2Vcbi8vICAgIHRoZSBmbHVzaCBpbmRleCBpcyBrZXB0IG91dHNpZGUgdGhlIGZ1bmN0aW9uLCB0aGUgcmVlbnRyYW50IGNhbGwgd2lsbCBwaWNrXG4vLyAgICB1cCB3aGVyZSB0aGUgZWFybGllciBjYWxsIGxlZnQgb2ZmIGFuZCBnbyB0aHJvdWdoIGFsbCBkaXJ0eSBjb21wb25lbnRzLiBUaGVcbi8vICAgIGN1cnJlbnRfY29tcG9uZW50IHZhbHVlIGlzIHNhdmVkIGFuZCByZXN0b3JlZCBzbyB0aGF0IHRoZSByZWVudHJhbnQgY2FsbCB3aWxsXG4vLyAgICBub3QgaW50ZXJmZXJlIHdpdGggdGhlIFwicGFyZW50XCIgZmx1c2goKSBjYWxsLlxuLy8gMi4gYmluZDp0aGlzIGNhbGxiYWNrcyBjYW5ub3QgdHJpZ2dlciBuZXcgZmx1c2goKSBjYWxscy5cbi8vIDMuIER1cmluZyBhZnRlclVwZGF0ZSwgYW55IHVwZGF0ZWQgY29tcG9uZW50cyB3aWxsIE5PVCBoYXZlIHRoZWlyIGFmdGVyVXBkYXRlXG4vLyAgICBjYWxsYmFjayBjYWxsZWQgYSBzZWNvbmQgdGltZTsgdGhlIHNlZW5fY2FsbGJhY2tzIHNldCwgb3V0c2lkZSB0aGUgZmx1c2goKVxuLy8gICAgZnVuY3Rpb24sIGd1YXJhbnRlZXMgdGhpcyBiZWhhdmlvci5cbmNvbnN0IHNlZW5fY2FsbGJhY2tzID0gbmV3IFNldCgpO1xubGV0IGZsdXNoaWR4ID0gMDsgLy8gRG8gKm5vdCogbW92ZSB0aGlzIGluc2lkZSB0aGUgZmx1c2goKSBmdW5jdGlvblxuZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgLy8gRG8gbm90IHJlZW50ZXIgZmx1c2ggd2hpbGUgZGlydHkgY29tcG9uZW50cyBhcmUgdXBkYXRlZCwgYXMgdGhpcyBjYW5cbiAgICAvLyByZXN1bHQgaW4gYW4gaW5maW5pdGUgbG9vcC4gSW5zdGVhZCwgbGV0IHRoZSBpbm5lciBmbHVzaCBoYW5kbGUgaXQuXG4gICAgLy8gUmVlbnRyYW5jeSBpcyBvayBhZnRlcndhcmRzIGZvciBiaW5kaW5ncyBldGMuXG4gICAgaWYgKGZsdXNoaWR4ICE9PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2F2ZWRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgZG8ge1xuICAgICAgICAvLyBmaXJzdCwgY2FsbCBiZWZvcmVVcGRhdGUgZnVuY3Rpb25zXG4gICAgICAgIC8vIGFuZCB1cGRhdGUgY29tcG9uZW50c1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2hpbGUgKGZsdXNoaWR4IDwgZGlydHlfY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wb25lbnQgPSBkaXJ0eV9jb21wb25lbnRzW2ZsdXNoaWR4XTtcbiAgICAgICAgICAgICAgICBmbHVzaGlkeCsrO1xuICAgICAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIHVwZGF0ZShjb21wb25lbnQuJCQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyByZXNldCBkaXJ0eSBzdGF0ZSB0byBub3QgZW5kIHVwIGluIGEgZGVhZGxvY2tlZCBzdGF0ZSBhbmQgdGhlbiByZXRocm93XG4gICAgICAgICAgICBkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBmbHVzaGlkeCA9IDA7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgZGlydHlfY29tcG9uZW50cy5sZW5ndGggPSAwO1xuICAgICAgICBmbHVzaGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChiaW5kaW5nX2NhbGxiYWNrcy5sZW5ndGgpXG4gICAgICAgICAgICBiaW5kaW5nX2NhbGxiYWNrcy5wb3AoKSgpO1xuICAgICAgICAvLyB0aGVuLCBvbmNlIGNvbXBvbmVudHMgYXJlIHVwZGF0ZWQsIGNhbGxcbiAgICAgICAgLy8gYWZ0ZXJVcGRhdGUgZnVuY3Rpb25zLiBUaGlzIG1heSBjYXVzZVxuICAgICAgICAvLyBzdWJzZXF1ZW50IHVwZGF0ZXMuLi5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZW5kZXJfY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHJlbmRlcl9jYWxsYmFja3NbaV07XG4gICAgICAgICAgICBpZiAoIXNlZW5fY2FsbGJhY2tzLmhhcyhjYWxsYmFjaykpIHtcbiAgICAgICAgICAgICAgICAvLyAuLi5zbyBndWFyZCBhZ2FpbnN0IGluZmluaXRlIGxvb3BzXG4gICAgICAgICAgICAgICAgc2Vlbl9jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlbmRlcl9jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9IHdoaWxlIChkaXJ0eV9jb21wb25lbnRzLmxlbmd0aCk7XG4gICAgd2hpbGUgKGZsdXNoX2NhbGxiYWNrcy5sZW5ndGgpIHtcbiAgICAgICAgZmx1c2hfY2FsbGJhY2tzLnBvcCgpKCk7XG4gICAgfVxuICAgIHVwZGF0ZV9zY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWVuX2NhbGxiYWNrcy5jbGVhcigpO1xuICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChzYXZlZF9jb21wb25lbnQpO1xufVxuZnVuY3Rpb24gdXBkYXRlKCQkKSB7XG4gICAgaWYgKCQkLmZyYWdtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICQkLnVwZGF0ZSgpO1xuICAgICAgICBydW5fYWxsKCQkLmJlZm9yZV91cGRhdGUpO1xuICAgICAgICBjb25zdCBkaXJ0eSA9ICQkLmRpcnR5O1xuICAgICAgICAkJC5kaXJ0eSA9IFstMV07XG4gICAgICAgICQkLmZyYWdtZW50ICYmICQkLmZyYWdtZW50LnAoJCQuY3R4LCBkaXJ0eSk7XG4gICAgICAgICQkLmFmdGVyX3VwZGF0ZS5mb3JFYWNoKGFkZF9yZW5kZXJfY2FsbGJhY2spO1xuICAgIH1cbn1cblxubGV0IHByb21pc2U7XG5mdW5jdGlvbiB3YWl0KCkge1xuICAgIGlmICghcHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBwcm9taXNlID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xufVxuZnVuY3Rpb24gZGlzcGF0Y2gobm9kZSwgZGlyZWN0aW9uLCBraW5kKSB7XG4gICAgbm9kZS5kaXNwYXRjaEV2ZW50KGN1c3RvbV9ldmVudChgJHtkaXJlY3Rpb24gPyAnaW50cm8nIDogJ291dHJvJ30ke2tpbmR9YCkpO1xufVxuY29uc3Qgb3V0cm9pbmcgPSBuZXcgU2V0KCk7XG5sZXQgb3V0cm9zO1xuZnVuY3Rpb24gZ3JvdXBfb3V0cm9zKCkge1xuICAgIG91dHJvcyA9IHtcbiAgICAgICAgcjogMCxcbiAgICAgICAgYzogW10sXG4gICAgICAgIHA6IG91dHJvcyAvLyBwYXJlbnQgZ3JvdXBcbiAgICB9O1xufVxuZnVuY3Rpb24gY2hlY2tfb3V0cm9zKCkge1xuICAgIGlmICghb3V0cm9zLnIpIHtcbiAgICAgICAgcnVuX2FsbChvdXRyb3MuYyk7XG4gICAgfVxuICAgIG91dHJvcyA9IG91dHJvcy5wO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvbl9pbihibG9jaywgbG9jYWwpIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2suaSkge1xuICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICBibG9jay5pKGxvY2FsKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uX291dChibG9jaywgbG9jYWwsIGRldGFjaCwgY2FsbGJhY2spIHtcbiAgICBpZiAoYmxvY2sgJiYgYmxvY2subykge1xuICAgICAgICBpZiAob3V0cm9pbmcuaGFzKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgb3V0cm9pbmcuYWRkKGJsb2NrKTtcbiAgICAgICAgb3V0cm9zLmMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICBvdXRyb2luZy5kZWxldGUoYmxvY2spO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFjaClcbiAgICAgICAgICAgICAgICAgICAgYmxvY2suZCgxKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgYmxvY2subyhsb2NhbCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxufVxuY29uc3QgbnVsbF90cmFuc2l0aW9uID0geyBkdXJhdGlvbjogMCB9O1xuZnVuY3Rpb24gY3JlYXRlX2luX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcykge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7IGRpcmVjdGlvbjogJ2luJyB9O1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgIGxldCBydW5uaW5nID0gZmFsc2U7XG4gICAgbGV0IGFuaW1hdGlvbl9uYW1lO1xuICAgIGxldCB0YXNrO1xuICAgIGxldCB1aWQgPSAwO1xuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIGlmIChhbmltYXRpb25fbmFtZSlcbiAgICAgICAgICAgIGRlbGV0ZV9ydWxlKG5vZGUsIGFuaW1hdGlvbl9uYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDAsIDEsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MsIHVpZCsrKTtcbiAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgY29uc3Qgc3RhcnRfdGltZSA9IG5vdygpICsgZGVsYXk7XG4gICAgICAgIGNvbnN0IGVuZF90aW1lID0gc3RhcnRfdGltZSArIGR1cmF0aW9uO1xuICAgICAgICBpZiAodGFzaylcbiAgICAgICAgICAgIHRhc2suYWJvcnQoKTtcbiAgICAgICAgcnVubmluZyA9IHRydWU7XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgdHJ1ZSwgJ3N0YXJ0JykpO1xuICAgICAgICB0YXNrID0gbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHRydWUsICdlbmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobm93ID49IHN0YXJ0X3RpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IGVhc2luZygobm93IC0gc3RhcnRfdGltZSkgLyBkdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHRpY2sodCwgMSAtIHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW5uaW5nO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFydCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSk7XG4gICAgICAgICAgICBpZiAoaXNfZnVuY3Rpb24oY29uZmlnKSkge1xuICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZyhvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB3YWl0KCkudGhlbihnbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9LFxuICAgICAgICBlbmQoKSB7XG4gICAgICAgICAgICBpZiAocnVubmluZykge1xuICAgICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gY3JlYXRlX291dF90cmFuc2l0aW9uKG5vZGUsIGZuLCBwYXJhbXMpIHtcbiAgICBjb25zdCBvcHRpb25zID0geyBkaXJlY3Rpb246ICdvdXQnIH07XG4gICAgbGV0IGNvbmZpZyA9IGZuKG5vZGUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgbGV0IHJ1bm5pbmcgPSB0cnVlO1xuICAgIGxldCBhbmltYXRpb25fbmFtZTtcbiAgICBjb25zdCBncm91cCA9IG91dHJvcztcbiAgICBncm91cC5yICs9IDE7XG4gICAgZnVuY3Rpb24gZ28oKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGlmIChjc3MpXG4gICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIDEsIDAsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICBjb25zdCBzdGFydF90aW1lID0gbm93KCkgKyBkZWxheTtcbiAgICAgICAgY29uc3QgZW5kX3RpbWUgPSBzdGFydF90aW1lICsgZHVyYXRpb247XG4gICAgICAgIGFkZF9yZW5kZXJfY2FsbGJhY2soKCkgPT4gZGlzcGF0Y2gobm9kZSwgZmFsc2UsICdzdGFydCcpKTtcbiAgICAgICAgbG9vcChub3cgPT4ge1xuICAgICAgICAgICAgaWYgKHJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAobm93ID49IGVuZF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpY2soMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIGZhbHNlLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghLS1ncm91cC5yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgcmVzdWx0IGluIGBlbmQoKWAgYmVpbmcgY2FsbGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gd2UgZG9uJ3QgbmVlZCB0byBjbGVhbiB1cCBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5fYWxsKGdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vdyA+PSBzdGFydF90aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBlYXNpbmcoKG5vdyAtIHN0YXJ0X3RpbWUpIC8gZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0aWNrKDEgLSB0LCB0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVubmluZztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgIHdhaXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZyhvcHRpb25zKTtcbiAgICAgICAgICAgIGdvKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ28oKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZW5kKHJlc2V0KSB7XG4gICAgICAgICAgICBpZiAocmVzZXQgJiYgY29uZmlnLnRpY2spIHtcbiAgICAgICAgICAgICAgICBjb25maWcudGljaygxLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChydW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgICAgICAgICBkZWxldGVfcnVsZShub2RlLCBhbmltYXRpb25fbmFtZSk7XG4gICAgICAgICAgICAgICAgcnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24obm9kZSwgZm4sIHBhcmFtcywgaW50cm8pIHtcbiAgICBjb25zdCBvcHRpb25zID0geyBkaXJlY3Rpb246ICdib3RoJyB9O1xuICAgIGxldCBjb25maWcgPSBmbihub2RlLCBwYXJhbXMsIG9wdGlvbnMpO1xuICAgIGxldCB0ID0gaW50cm8gPyAwIDogMTtcbiAgICBsZXQgcnVubmluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICBsZXQgYW5pbWF0aW9uX25hbWUgPSBudWxsO1xuICAgIGZ1bmN0aW9uIGNsZWFyX2FuaW1hdGlvbigpIHtcbiAgICAgICAgaWYgKGFuaW1hdGlvbl9uYW1lKVxuICAgICAgICAgICAgZGVsZXRlX3J1bGUobm9kZSwgYW5pbWF0aW9uX25hbWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbml0KHByb2dyYW0sIGR1cmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IGQgPSAocHJvZ3JhbS5iIC0gdCk7XG4gICAgICAgIGR1cmF0aW9uICo9IE1hdGguYWJzKGQpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTogdCxcbiAgICAgICAgICAgIGI6IHByb2dyYW0uYixcbiAgICAgICAgICAgIGQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0YXJ0OiBwcm9ncmFtLnN0YXJ0LFxuICAgICAgICAgICAgZW5kOiBwcm9ncmFtLnN0YXJ0ICsgZHVyYXRpb24sXG4gICAgICAgICAgICBncm91cDogcHJvZ3JhbS5ncm91cFxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnbyhiKSB7XG4gICAgICAgIGNvbnN0IHsgZGVsYXkgPSAwLCBkdXJhdGlvbiA9IDMwMCwgZWFzaW5nID0gaWRlbnRpdHksIHRpY2sgPSBub29wLCBjc3MgfSA9IGNvbmZpZyB8fCBudWxsX3RyYW5zaXRpb247XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSB7XG4gICAgICAgICAgICBzdGFydDogbm93KCkgKyBkZWxheSxcbiAgICAgICAgICAgIGJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFiKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlIHRvZG86IGltcHJvdmUgdHlwaW5nc1xuICAgICAgICAgICAgcHJvZ3JhbS5ncm91cCA9IG91dHJvcztcbiAgICAgICAgICAgIG91dHJvcy5yICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pIHtcbiAgICAgICAgICAgIHBlbmRpbmdfcHJvZ3JhbSA9IHByb2dyYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGFuIGludHJvLCBhbmQgdGhlcmUncyBhIGRlbGF5LCB3ZSBuZWVkIHRvIGRvXG4gICAgICAgICAgICAvLyBhbiBpbml0aWFsIHRpY2sgYW5kL29yIGFwcGx5IENTUyBhbmltYXRpb24gaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGlmIChjc3MpIHtcbiAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICBhbmltYXRpb25fbmFtZSA9IGNyZWF0ZV9ydWxlKG5vZGUsIHQsIGIsIGR1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBjc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGIpXG4gICAgICAgICAgICAgICAgdGljaygwLCAxKTtcbiAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IGluaXQocHJvZ3JhbSwgZHVyYXRpb24pO1xuICAgICAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiBkaXNwYXRjaChub2RlLCBiLCAnc3RhcnQnKSk7XG4gICAgICAgICAgICBsb29wKG5vdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBlbmRpbmdfcHJvZ3JhbSAmJiBub3cgPiBwZW5kaW5nX3Byb2dyYW0uc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZ19wcm9ncmFtID0gaW5pdChwZW5kaW5nX3Byb2dyYW0sIGR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ19wcm9ncmFtID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2gobm9kZSwgcnVubmluZ19wcm9ncmFtLmIsICdzdGFydCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3NzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcl9hbmltYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbl9uYW1lID0gY3JlYXRlX3J1bGUobm9kZSwgdCwgcnVubmluZ19wcm9ncmFtLmIsIHJ1bm5pbmdfcHJvZ3JhbS5kdXJhdGlvbiwgMCwgZWFzaW5nLCBjb25maWcuY3NzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3cgPj0gcnVubmluZ19wcm9ncmFtLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0ID0gcnVubmluZ19wcm9ncmFtLmIsIDEgLSB0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKG5vZGUsIHJ1bm5pbmdfcHJvZ3JhbS5iLCAnZW5kJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdfcHJvZ3JhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIGRvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocnVubmluZ19wcm9ncmFtLmIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50cm8gXHUyMDE0IHdlIGNhbiB0aWR5IHVwIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyX2FuaW1hdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3V0cm8gXHUyMDE0IG5lZWRzIHRvIGJlIGNvb3JkaW5hdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghLS1ydW5uaW5nX3Byb2dyYW0uZ3JvdXAucilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bl9hbGwocnVubmluZ19wcm9ncmFtLmdyb3VwLmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmdfcHJvZ3JhbSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobm93ID49IHJ1bm5pbmdfcHJvZ3JhbS5zdGFydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5vdyAtIHJ1bm5pbmdfcHJvZ3JhbS5zdGFydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBydW5uaW5nX3Byb2dyYW0uYSArIHJ1bm5pbmdfcHJvZ3JhbS5kICogZWFzaW5nKHAgLyBydW5uaW5nX3Byb2dyYW0uZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGljayh0LCAxIC0gdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhKHJ1bm5pbmdfcHJvZ3JhbSB8fCBwZW5kaW5nX3Byb2dyYW0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcnVuKGIpIHtcbiAgICAgICAgICAgIGlmIChpc19mdW5jdGlvbihjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgd2FpdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZyhvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgZ28oYik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbyhiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZW5kKCkge1xuICAgICAgICAgICAgY2xlYXJfYW5pbWF0aW9uKCk7XG4gICAgICAgICAgICBydW5uaW5nX3Byb2dyYW0gPSBwZW5kaW5nX3Byb2dyYW0gPSBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlX3Byb21pc2UocHJvbWlzZSwgaW5mbykge1xuICAgIGNvbnN0IHRva2VuID0gaW5mby50b2tlbiA9IHt9O1xuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0eXBlLCBpbmRleCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoaW5mby50b2tlbiAhPT0gdG9rZW4pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGluZm8ucmVzb2x2ZWQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IGNoaWxkX2N0eCA9IGluZm8uY3R4O1xuICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoaWxkX2N0eCA9IGNoaWxkX2N0eC5zbGljZSgpO1xuICAgICAgICAgICAgY2hpbGRfY3R4W2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBibG9jayA9IHR5cGUgJiYgKGluZm8uY3VycmVudCA9IHR5cGUpKGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBuZWVkc19mbHVzaCA9IGZhbHNlO1xuICAgICAgICBpZiAoaW5mby5ibG9jaykge1xuICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9ja3MuZm9yRWFjaCgoYmxvY2ssIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGluZGV4ICYmIGJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cF9vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25fb3V0KGJsb2NrLCAxLCAxLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZm8uYmxvY2tzW2ldID09PSBibG9jaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmJsb2Nrc1tpXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja19vdXRyb3MoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5mby5ibG9jay5kKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmxvY2suYygpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihibG9jaywgMSk7XG4gICAgICAgICAgICBibG9jay5tKGluZm8ubW91bnQoKSwgaW5mby5hbmNob3IpO1xuICAgICAgICAgICAgbmVlZHNfZmx1c2ggPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGluZm8uYmxvY2sgPSBibG9jaztcbiAgICAgICAgaWYgKGluZm8uYmxvY2tzKVxuICAgICAgICAgICAgaW5mby5ibG9ja3NbaW5kZXhdID0gYmxvY2s7XG4gICAgICAgIGlmIChuZWVkc19mbHVzaCkge1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNfcHJvbWlzZShwcm9taXNlKSkge1xuICAgICAgICBjb25zdCBjdXJyZW50X2NvbXBvbmVudCA9IGdldF9jdXJyZW50X2NvbXBvbmVudCgpO1xuICAgICAgICBwcm9taXNlLnRoZW4odmFsdWUgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnRoZW4sIDEsIGluZm8udmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChudWxsKTtcbiAgICAgICAgfSwgZXJyb3IgPT4ge1xuICAgICAgICAgICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGN1cnJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLmNhdGNoLCAyLCBpbmZvLmVycm9yLCBlcnJvcik7XG4gICAgICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQobnVsbCk7XG4gICAgICAgICAgICBpZiAoIWluZm8uaGFzQ2F0Y2gpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGlmIHdlIHByZXZpb3VzbHkgaGFkIGEgdGhlbi9jYXRjaCBibG9jaywgZGVzdHJveSBpdFxuICAgICAgICBpZiAoaW5mby5jdXJyZW50ICE9PSBpbmZvLnBlbmRpbmcpIHtcbiAgICAgICAgICAgIHVwZGF0ZShpbmZvLnBlbmRpbmcsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChpbmZvLmN1cnJlbnQgIT09IGluZm8udGhlbikge1xuICAgICAgICAgICAgdXBkYXRlKGluZm8udGhlbiwgMSwgaW5mby52YWx1ZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnJlc29sdmVkID0gcHJvbWlzZTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVfYXdhaXRfYmxvY2tfYnJhbmNoKGluZm8sIGN0eCwgZGlydHkpIHtcbiAgICBjb25zdCBjaGlsZF9jdHggPSBjdHguc2xpY2UoKTtcbiAgICBjb25zdCB7IHJlc29sdmVkIH0gPSBpbmZvO1xuICAgIGlmIChpbmZvLmN1cnJlbnQgPT09IGluZm8udGhlbikge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby52YWx1ZV0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaWYgKGluZm8uY3VycmVudCA9PT0gaW5mby5jYXRjaCkge1xuICAgICAgICBjaGlsZF9jdHhbaW5mby5lcnJvcl0gPSByZXNvbHZlZDtcbiAgICB9XG4gICAgaW5mby5ibG9jay5wKGNoaWxkX2N0eCwgZGlydHkpO1xufVxuXG5jb25zdCBnbG9iYWxzID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgPyB3aW5kb3dcbiAgICA6IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJ1xuICAgICAgICA/IGdsb2JhbFRoaXNcbiAgICAgICAgOiBnbG9iYWwpO1xuXG5mdW5jdGlvbiBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICBibG9jay5kKDEpO1xuICAgIGxvb2t1cC5kZWxldGUoYmxvY2sua2V5KTtcbn1cbmZ1bmN0aW9uIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApIHtcbiAgICB0cmFuc2l0aW9uX291dChibG9jaywgMSwgMSwgKCkgPT4ge1xuICAgICAgICBsb29rdXAuZGVsZXRlKGJsb2NrLmtleSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmaXhfYW5kX2Rlc3Ryb3lfYmxvY2soYmxvY2ssIGxvb2t1cCkge1xuICAgIGJsb2NrLmYoKTtcbiAgICBkZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gZml4X2FuZF9vdXRyb19hbmRfZGVzdHJveV9ibG9jayhibG9jaywgbG9va3VwKSB7XG4gICAgYmxvY2suZigpO1xuICAgIG91dHJvX2FuZF9kZXN0cm95X2Jsb2NrKGJsb2NrLCBsb29rdXApO1xufVxuZnVuY3Rpb24gdXBkYXRlX2tleWVkX2VhY2gob2xkX2Jsb2NrcywgZGlydHksIGdldF9rZXksIGR5bmFtaWMsIGN0eCwgbGlzdCwgbG9va3VwLCBub2RlLCBkZXN0cm95LCBjcmVhdGVfZWFjaF9ibG9jaywgbmV4dCwgZ2V0X2NvbnRleHQpIHtcbiAgICBsZXQgbyA9IG9sZF9ibG9ja3MubGVuZ3RoO1xuICAgIGxldCBuID0gbGlzdC5sZW5ndGg7XG4gICAgbGV0IGkgPSBvO1xuICAgIGNvbnN0IG9sZF9pbmRleGVzID0ge307XG4gICAgd2hpbGUgKGktLSlcbiAgICAgICAgb2xkX2luZGV4ZXNbb2xkX2Jsb2Nrc1tpXS5rZXldID0gaTtcbiAgICBjb25zdCBuZXdfYmxvY2tzID0gW107XG4gICAgY29uc3QgbmV3X2xvb2t1cCA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCBkZWx0YXMgPSBuZXcgTWFwKCk7XG4gICAgaSA9IG47XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICBjb25zdCBjaGlsZF9jdHggPSBnZXRfY29udGV4dChjdHgsIGxpc3QsIGkpO1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGNoaWxkX2N0eCk7XG4gICAgICAgIGxldCBibG9jayA9IGxvb2t1cC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFibG9jaykge1xuICAgICAgICAgICAgYmxvY2sgPSBjcmVhdGVfZWFjaF9ibG9jayhrZXksIGNoaWxkX2N0eCk7XG4gICAgICAgICAgICBibG9jay5jKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZHluYW1pYykge1xuICAgICAgICAgICAgYmxvY2sucChjaGlsZF9jdHgsIGRpcnR5KTtcbiAgICAgICAgfVxuICAgICAgICBuZXdfbG9va3VwLnNldChrZXksIG5ld19ibG9ja3NbaV0gPSBibG9jayk7XG4gICAgICAgIGlmIChrZXkgaW4gb2xkX2luZGV4ZXMpXG4gICAgICAgICAgICBkZWx0YXMuc2V0KGtleSwgTWF0aC5hYnMoaSAtIG9sZF9pbmRleGVzW2tleV0pKTtcbiAgICB9XG4gICAgY29uc3Qgd2lsbF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IGRpZF9tb3ZlID0gbmV3IFNldCgpO1xuICAgIGZ1bmN0aW9uIGluc2VydChibG9jaykge1xuICAgICAgICB0cmFuc2l0aW9uX2luKGJsb2NrLCAxKTtcbiAgICAgICAgYmxvY2subShub2RlLCBuZXh0KTtcbiAgICAgICAgbG9va3VwLnNldChibG9jay5rZXksIGJsb2NrKTtcbiAgICAgICAgbmV4dCA9IGJsb2NrLmZpcnN0O1xuICAgICAgICBuLS07XG4gICAgfVxuICAgIHdoaWxlIChvICYmIG4pIHtcbiAgICAgICAgY29uc3QgbmV3X2Jsb2NrID0gbmV3X2Jsb2Nrc1tuIC0gMV07XG4gICAgICAgIGNvbnN0IG9sZF9ibG9jayA9IG9sZF9ibG9ja3NbbyAtIDFdO1xuICAgICAgICBjb25zdCBuZXdfa2V5ID0gbmV3X2Jsb2NrLmtleTtcbiAgICAgICAgY29uc3Qgb2xkX2tleSA9IG9sZF9ibG9jay5rZXk7XG4gICAgICAgIGlmIChuZXdfYmxvY2sgPT09IG9sZF9ibG9jaykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgbmV4dCA9IG5ld19ibG9jay5maXJzdDtcbiAgICAgICAgICAgIG8tLTtcbiAgICAgICAgICAgIG4tLTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbmV3X2xvb2t1cC5oYXMob2xkX2tleSkpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgYmxvY2tcbiAgICAgICAgICAgIGRlc3Ryb3kob2xkX2Jsb2NrLCBsb29rdXApO1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFsb29rdXAuaGFzKG5ld19rZXkpIHx8IHdpbGxfbW92ZS5oYXMobmV3X2tleSkpIHtcbiAgICAgICAgICAgIGluc2VydChuZXdfYmxvY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRpZF9tb3ZlLmhhcyhvbGRfa2V5KSkge1xuICAgICAgICAgICAgby0tO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbHRhcy5nZXQobmV3X2tleSkgPiBkZWx0YXMuZ2V0KG9sZF9rZXkpKSB7XG4gICAgICAgICAgICBkaWRfbW92ZS5hZGQobmV3X2tleSk7XG4gICAgICAgICAgICBpbnNlcnQobmV3X2Jsb2NrKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpbGxfbW92ZS5hZGQob2xkX2tleSk7XG4gICAgICAgICAgICBvLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgd2hpbGUgKG8tLSkge1xuICAgICAgICBjb25zdCBvbGRfYmxvY2sgPSBvbGRfYmxvY2tzW29dO1xuICAgICAgICBpZiAoIW5ld19sb29rdXAuaGFzKG9sZF9ibG9jay5rZXkpKVxuICAgICAgICAgICAgZGVzdHJveShvbGRfYmxvY2ssIGxvb2t1cCk7XG4gICAgfVxuICAgIHdoaWxlIChuKVxuICAgICAgICBpbnNlcnQobmV3X2Jsb2Nrc1tuIC0gMV0pO1xuICAgIHJldHVybiBuZXdfYmxvY2tzO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVfZWFjaF9rZXlzKGN0eCwgbGlzdCwgZ2V0X2NvbnRleHQsIGdldF9rZXkpIHtcbiAgICBjb25zdCBrZXlzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrZXkgPSBnZXRfa2V5KGdldF9jb250ZXh0KGN0eCwgbGlzdCwgaSkpO1xuICAgICAgICBpZiAoa2V5cy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaGF2ZSBkdXBsaWNhdGUga2V5cyBpbiBhIGtleWVkIGVhY2gnKTtcbiAgICAgICAgfVxuICAgICAgICBrZXlzLmFkZChrZXkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0X3NwcmVhZF91cGRhdGUobGV2ZWxzLCB1cGRhdGVzKSB7XG4gICAgY29uc3QgdXBkYXRlID0ge307XG4gICAgY29uc3QgdG9fbnVsbF9vdXQgPSB7fTtcbiAgICBjb25zdCBhY2NvdW50ZWRfZm9yID0geyAkJHNjb3BlOiAxIH07XG4gICAgbGV0IGkgPSBsZXZlbHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgY29uc3QgbyA9IGxldmVsc1tpXTtcbiAgICAgICAgY29uc3QgbiA9IHVwZGF0ZXNbaV07XG4gICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBvKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIG4pKVxuICAgICAgICAgICAgICAgICAgICB0b19udWxsX291dFtrZXldID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIG4pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWFjY291bnRlZF9mb3Jba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVba2V5XSA9IG5ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGVkX2ZvcltrZXldID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXZlbHNbaV0gPSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gbykge1xuICAgICAgICAgICAgICAgIGFjY291bnRlZF9mb3Jba2V5XSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdG9fbnVsbF9vdXQpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIHVwZGF0ZSkpXG4gICAgICAgICAgICB1cGRhdGVba2V5XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZTtcbn1cbmZ1bmN0aW9uIGdldF9zcHJlYWRfb2JqZWN0KHNwcmVhZF9wcm9wcykge1xuICAgIHJldHVybiB0eXBlb2Ygc3ByZWFkX3Byb3BzID09PSAnb2JqZWN0JyAmJiBzcHJlYWRfcHJvcHMgIT09IG51bGwgPyBzcHJlYWRfcHJvcHMgOiB7fTtcbn1cblxuLy8gc291cmNlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9pbmRpY2VzLmh0bWxcbmNvbnN0IGJvb2xlYW5fYXR0cmlidXRlcyA9IG5ldyBTZXQoW1xuICAgICdhbGxvd2Z1bGxzY3JlZW4nLFxuICAgICdhbGxvd3BheW1lbnRyZXF1ZXN0JyxcbiAgICAnYXN5bmMnLFxuICAgICdhdXRvZm9jdXMnLFxuICAgICdhdXRvcGxheScsXG4gICAgJ2NoZWNrZWQnLFxuICAgICdjb250cm9scycsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWZlcicsXG4gICAgJ2Rpc2FibGVkJyxcbiAgICAnZm9ybW5vdmFsaWRhdGUnLFxuICAgICdoaWRkZW4nLFxuICAgICdpbmVydCcsXG4gICAgJ2lzbWFwJyxcbiAgICAnaXRlbXNjb3BlJyxcbiAgICAnbG9vcCcsXG4gICAgJ211bHRpcGxlJyxcbiAgICAnbXV0ZWQnLFxuICAgICdub21vZHVsZScsXG4gICAgJ25vdmFsaWRhdGUnLFxuICAgICdvcGVuJyxcbiAgICAncGxheXNpbmxpbmUnLFxuICAgICdyZWFkb25seScsXG4gICAgJ3JlcXVpcmVkJyxcbiAgICAncmV2ZXJzZWQnLFxuICAgICdzZWxlY3RlZCdcbl0pO1xuXG4vKiogcmVnZXggb2YgYWxsIGh0bWwgdm9pZCBlbGVtZW50IG5hbWVzICovXG5jb25zdCB2b2lkX2VsZW1lbnRfbmFtZXMgPSAvXig/OmFyZWF8YmFzZXxicnxjb2x8Y29tbWFuZHxlbWJlZHxocnxpbWd8aW5wdXR8a2V5Z2VufGxpbmt8bWV0YXxwYXJhbXxzb3VyY2V8dHJhY2t8d2JyKSQvO1xuZnVuY3Rpb24gaXNfdm9pZChuYW1lKSB7XG4gICAgcmV0dXJuIHZvaWRfZWxlbWVudF9uYW1lcy50ZXN0KG5hbWUpIHx8IG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJyFkb2N0eXBlJztcbn1cblxuY29uc3QgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIgPSAvW1xccydcIj4vPVxcdXtGREQwfS1cXHV7RkRFRn1cXHV7RkZGRX1cXHV7RkZGRn1cXHV7MUZGRkV9XFx1ezFGRkZGfVxcdXsyRkZGRX1cXHV7MkZGRkZ9XFx1ezNGRkZFfVxcdXszRkZGRn1cXHV7NEZGRkV9XFx1ezRGRkZGfVxcdXs1RkZGRX1cXHV7NUZGRkZ9XFx1ezZGRkZFfVxcdXs2RkZGRn1cXHV7N0ZGRkV9XFx1ezdGRkZGfVxcdXs4RkZGRX1cXHV7OEZGRkZ9XFx1ezlGRkZFfVxcdXs5RkZGRn1cXHV7QUZGRkV9XFx1e0FGRkZGfVxcdXtCRkZGRX1cXHV7QkZGRkZ9XFx1e0NGRkZFfVxcdXtDRkZGRn1cXHV7REZGRkV9XFx1e0RGRkZGfVxcdXtFRkZGRX1cXHV7RUZGRkZ9XFx1e0ZGRkZFfVxcdXtGRkZGRn1cXHV7MTBGRkZFfVxcdXsxMEZGRkZ9XS91O1xuLy8gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0yXG4vLyBodHRwczovL2luZnJhLnNwZWMud2hhdHdnLm9yZy8jbm9uY2hhcmFjdGVyXG5mdW5jdGlvbiBzcHJlYWQoYXJncywgYXR0cnNfdG9fYWRkKSB7XG4gICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oe30sIC4uLmFyZ3MpO1xuICAgIGlmIChhdHRyc190b19hZGQpIHtcbiAgICAgICAgY29uc3QgY2xhc3Nlc190b19hZGQgPSBhdHRyc190b19hZGQuY2xhc3NlcztcbiAgICAgICAgY29uc3Qgc3R5bGVzX3RvX2FkZCA9IGF0dHJzX3RvX2FkZC5zdHlsZXM7XG4gICAgICAgIGlmIChjbGFzc2VzX3RvX2FkZCkge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZXMuY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgPSBjbGFzc2VzX3RvX2FkZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuY2xhc3MgKz0gJyAnICsgY2xhc3Nlc190b19hZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0eWxlc190b19hZGQpIHtcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVzLnN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnN0eWxlID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZXNfdG9fYWRkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMuc3R5bGUgPSBzdHlsZV9vYmplY3RfdG9fc3RyaW5nKG1lcmdlX3Nzcl9zdHlsZXMoYXR0cmlidXRlcy5zdHlsZSwgc3R5bGVzX3RvX2FkZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBzdHIgPSAnJztcbiAgICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBpZiAoaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIudGVzdChuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpXG4gICAgICAgICAgICBzdHIgKz0gJyAnICsgbmFtZTtcbiAgICAgICAgZWxzZSBpZiAoYm9vbGVhbl9hdHRyaWJ1dGVzLmhhcyhuYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcgJyArIG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IGAgJHtuYW1lfT1cIiR7dmFsdWV9XCJgO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cjtcbn1cbmZ1bmN0aW9uIG1lcmdlX3Nzcl9zdHlsZXMoc3R5bGVfYXR0cmlidXRlLCBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICBjb25zdCBzdHlsZV9vYmplY3QgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGluZGl2aWR1YWxfc3R5bGUgb2Ygc3R5bGVfYXR0cmlidXRlLnNwbGl0KCc7JykpIHtcbiAgICAgICAgY29uc3QgY29sb25faW5kZXggPSBpbmRpdmlkdWFsX3N0eWxlLmluZGV4T2YoJzonKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGluZGl2aWR1YWxfc3R5bGUuc2xpY2UoMCwgY29sb25faW5kZXgpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbmRpdmlkdWFsX3N0eWxlLnNsaWNlKGNvbG9uX2luZGV4ICsgMSkudHJpbSgpO1xuICAgICAgICBpZiAoIW5hbWUpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGZvciAoY29uc3QgbmFtZSBpbiBzdHlsZV9kaXJlY3RpdmUpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZV9kaXJlY3RpdmVbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgc3R5bGVfb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgc3R5bGVfb2JqZWN0W25hbWVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHlsZV9vYmplY3Q7XG59XG5jb25zdCBBVFRSX1JFR0VYID0gL1smXCJdL2c7XG5jb25zdCBDT05URU5UX1JFR0VYID0gL1smPF0vZztcbi8qKlxuICogTm90ZTogdGhpcyBtZXRob2QgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIGFuZCBoYXMgYmVlbiBvcHRpbWl6ZWRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9zdmVsdGVqcy9zdmVsdGUvcHVsbC81NzAxXG4gKi9cbmZ1bmN0aW9uIGVzY2FwZSh2YWx1ZSwgaXNfYXR0ciA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc3RyID0gU3RyaW5nKHZhbHVlKTtcbiAgICBjb25zdCBwYXR0ZXJuID0gaXNfYXR0ciA/IEFUVFJfUkVHRVggOiBDT05URU5UX1JFR0VYO1xuICAgIHBhdHRlcm4ubGFzdEluZGV4ID0gMDtcbiAgICBsZXQgZXNjYXBlZCA9ICcnO1xuICAgIGxldCBsYXN0ID0gMDtcbiAgICB3aGlsZSAocGF0dGVybi50ZXN0KHN0cikpIHtcbiAgICAgICAgY29uc3QgaSA9IHBhdHRlcm4ubGFzdEluZGV4IC0gMTtcbiAgICAgICAgY29uc3QgY2ggPSBzdHJbaV07XG4gICAgICAgIGVzY2FwZWQgKz0gc3RyLnN1YnN0cmluZyhsYXN0LCBpKSArIChjaCA9PT0gJyYnID8gJyZhbXA7JyA6IChjaCA9PT0gJ1wiJyA/ICcmcXVvdDsnIDogJyZsdDsnKSk7XG4gICAgICAgIGxhc3QgPSBpICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGVzY2FwZWQgKyBzdHIuc3Vic3RyaW5nKGxhc3QpO1xufVxuZnVuY3Rpb24gZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSh2YWx1ZSkge1xuICAgIC8vIGtlZXAgYm9vbGVhbnMsIG51bGwsIGFuZCB1bmRlZmluZWQgZm9yIHRoZSBzYWtlIG9mIGBzcHJlYWRgXG4gICAgY29uc3Qgc2hvdWxkX2VzY2FwZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgfHwgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpO1xuICAgIHJldHVybiBzaG91bGRfZXNjYXBlID8gZXNjYXBlKHZhbHVlLCB0cnVlKSA6IHZhbHVlO1xufVxuZnVuY3Rpb24gZXNjYXBlX29iamVjdChvYmopIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKG9ialtrZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGVhY2goaXRlbXMsIGZuKSB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgc3RyICs9IGZuKGl0ZW1zW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn1cbmNvbnN0IG1pc3NpbmdfY29tcG9uZW50ID0ge1xuICAgICQkcmVuZGVyOiAoKSA9PiAnJ1xufTtcbmZ1bmN0aW9uIHZhbGlkYXRlX2NvbXBvbmVudChjb21wb25lbnQsIG5hbWUpIHtcbiAgICBpZiAoIWNvbXBvbmVudCB8fCAhY29tcG9uZW50LiQkcmVuZGVyKSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnc3ZlbHRlOmNvbXBvbmVudCcpXG4gICAgICAgICAgICBuYW1lICs9ICcgdGhpcz17Li4ufSc7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgPCR7bmFtZX0+IGlzIG5vdCBhIHZhbGlkIFNTUiBjb21wb25lbnQuIFlvdSBtYXkgbmVlZCB0byByZXZpZXcgeW91ciBidWlsZCBjb25maWcgdG8gZW5zdXJlIHRoYXQgZGVwZW5kZW5jaWVzIGFyZSBjb21waWxlZCwgcmF0aGVyIHRoYW4gaW1wb3J0ZWQgYXMgcHJlLWNvbXBpbGVkIG1vZHVsZXMuIE90aGVyd2lzZSB5b3UgbWF5IG5lZWQgdG8gZml4IGEgPCR7bmFtZX0+LmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50O1xufVxuZnVuY3Rpb24gZGVidWcoZmlsZSwgbGluZSwgY29sdW1uLCB2YWx1ZXMpIHtcbiAgICBjb25zb2xlLmxvZyhge0BkZWJ1Z30gJHtmaWxlID8gZmlsZSArICcgJyA6ICcnfSgke2xpbmV9OiR7Y29sdW1ufSlgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2codmFsdWVzKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuICcnO1xufVxubGV0IG9uX2Rlc3Ryb3k7XG5mdW5jdGlvbiBjcmVhdGVfc3NyX2NvbXBvbmVudChmbikge1xuICAgIGZ1bmN0aW9uICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cywgY29udGV4dCkge1xuICAgICAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0ICQkID0ge1xuICAgICAgICAgICAgb25fZGVzdHJveSxcbiAgICAgICAgICAgIGNvbnRleHQ6IG5ldyBNYXAoY29udGV4dCB8fCAocGFyZW50X2NvbXBvbmVudCA/IHBhcmVudF9jb21wb25lbnQuJCQuY29udGV4dCA6IFtdKSksXG4gICAgICAgICAgICAvLyB0aGVzZSB3aWxsIGJlIGltbWVkaWF0ZWx5IGRpc2NhcmRlZFxuICAgICAgICAgICAgb25fbW91bnQ6IFtdLFxuICAgICAgICAgICAgYmVmb3JlX3VwZGF0ZTogW10sXG4gICAgICAgICAgICBhZnRlcl91cGRhdGU6IFtdLFxuICAgICAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKVxuICAgICAgICB9O1xuICAgICAgICBzZXRfY3VycmVudF9jb21wb25lbnQoeyAkJCB9KTtcbiAgICAgICAgY29uc3QgaHRtbCA9IGZuKHJlc3VsdCwgcHJvcHMsIGJpbmRpbmdzLCBzbG90cyk7XG4gICAgICAgIHNldF9jdXJyZW50X2NvbXBvbmVudChwYXJlbnRfY29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHJlbmRlcjogKHByb3BzID0ge30sIHsgJCRzbG90cyA9IHt9LCBjb250ZXh0ID0gbmV3IE1hcCgpIH0gPSB7fSkgPT4ge1xuICAgICAgICAgICAgb25fZGVzdHJveSA9IFtdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0geyB0aXRsZTogJycsIGhlYWQ6ICcnLCBjc3M6IG5ldyBTZXQoKSB9O1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9ICQkcmVuZGVyKHJlc3VsdCwgcHJvcHMsIHt9LCAkJHNsb3RzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIHJ1bl9hbGwob25fZGVzdHJveSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IEFycmF5LmZyb20ocmVzdWx0LmNzcykubWFwKGNzcyA9PiBjc3MuY29kZSkuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgICAgIG1hcDogbnVsbCAvLyBUT0RPXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBoZWFkOiByZXN1bHQudGl0bGUgKyByZXN1bHQuaGVhZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJCRyZW5kZXJcbiAgICB9O1xufVxuZnVuY3Rpb24gYWRkX2F0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgYm9vbGVhbikge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsIHx8IChib29sZWFuICYmICF2YWx1ZSkpXG4gICAgICAgIHJldHVybiAnJztcbiAgICBjb25zdCBhc3NpZ25tZW50ID0gKGJvb2xlYW4gJiYgdmFsdWUgPT09IHRydWUpID8gJycgOiBgPVwiJHtlc2NhcGUodmFsdWUsIHRydWUpfVwiYDtcbiAgICByZXR1cm4gYCAke25hbWV9JHthc3NpZ25tZW50fWA7XG59XG5mdW5jdGlvbiBhZGRfY2xhc3NlcyhjbGFzc2VzKSB7XG4gICAgcmV0dXJuIGNsYXNzZXMgPyBgIGNsYXNzPVwiJHtjbGFzc2VzfVwiYCA6ICcnO1xufVxuZnVuY3Rpb24gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoc3R5bGVfb2JqZWN0KVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBzdHlsZV9vYmplY3Rba2V5XSlcbiAgICAgICAgLm1hcChrZXkgPT4gYCR7a2V5fTogJHtlc2NhcGVfYXR0cmlidXRlX3ZhbHVlKHN0eWxlX29iamVjdFtrZXldKX07YClcbiAgICAgICAgLmpvaW4oJyAnKTtcbn1cbmZ1bmN0aW9uIGFkZF9zdHlsZXMoc3R5bGVfb2JqZWN0KSB7XG4gICAgY29uc3Qgc3R5bGVzID0gc3R5bGVfb2JqZWN0X3RvX3N0cmluZyhzdHlsZV9vYmplY3QpO1xuICAgIHJldHVybiBzdHlsZXMgPyBgIHN0eWxlPVwiJHtzdHlsZXN9XCJgIDogJyc7XG59XG5cbmZ1bmN0aW9uIGJpbmQoY29tcG9uZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGluZGV4ID0gY29tcG9uZW50LiQkLnByb3BzW25hbWVdO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbXBvbmVudC4kJC5ib3VuZFtpbmRleF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2soY29tcG9uZW50LiQkLmN0eFtpbmRleF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNyZWF0ZV9jb21wb25lbnQoYmxvY2spIHtcbiAgICBibG9jayAmJiBibG9jay5jKCk7XG59XG5mdW5jdGlvbiBjbGFpbV9jb21wb25lbnQoYmxvY2ssIHBhcmVudF9ub2Rlcykge1xuICAgIGJsb2NrICYmIGJsb2NrLmwocGFyZW50X25vZGVzKTtcbn1cbmZ1bmN0aW9uIG1vdW50X2NvbXBvbmVudChjb21wb25lbnQsIHRhcmdldCwgYW5jaG9yLCBjdXN0b21FbGVtZW50KSB7XG4gICAgY29uc3QgeyBmcmFnbWVudCwgYWZ0ZXJfdXBkYXRlIH0gPSBjb21wb25lbnQuJCQ7XG4gICAgZnJhZ21lbnQgJiYgZnJhZ21lbnQubSh0YXJnZXQsIGFuY2hvcik7XG4gICAgaWYgKCFjdXN0b21FbGVtZW50KSB7XG4gICAgICAgIC8vIG9uTW91bnQgaGFwcGVucyBiZWZvcmUgdGhlIGluaXRpYWwgYWZ0ZXJVcGRhdGVcbiAgICAgICAgYWRkX3JlbmRlcl9jYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdfb25fZGVzdHJveSA9IGNvbXBvbmVudC4kJC5vbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gaWYgdGhlIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAvLyBpdCB3aWxsIHVwZGF0ZSB0aGUgYCQkLm9uX2Rlc3Ryb3lgIHJlZmVyZW5jZSB0byBgbnVsbGAuXG4gICAgICAgICAgICAvLyB0aGUgZGVzdHJ1Y3R1cmVkIG9uX2Rlc3Ryb3kgbWF5IHN0aWxsIHJlZmVyZW5jZSB0byB0aGUgb2xkIGFycmF5XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50LiQkLm9uX2Rlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuJCQub25fZGVzdHJveS5wdXNoKC4uLm5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSAtIGNvbXBvbmVudCB3YXMgZGVzdHJveWVkIGltbWVkaWF0ZWx5LFxuICAgICAgICAgICAgICAgIC8vIG1vc3QgbGlrZWx5IGFzIGEgcmVzdWx0IG9mIGEgYmluZGluZyBpbml0aWFsaXNpbmdcbiAgICAgICAgICAgICAgICBydW5fYWxsKG5ld19vbl9kZXN0cm95KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudC4kJC5vbl9tb3VudCA9IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYWZ0ZXJfdXBkYXRlLmZvckVhY2goYWRkX3JlbmRlcl9jYWxsYmFjayk7XG59XG5mdW5jdGlvbiBkZXN0cm95X2NvbXBvbmVudChjb21wb25lbnQsIGRldGFjaGluZykge1xuICAgIGNvbnN0ICQkID0gY29tcG9uZW50LiQkO1xuICAgIGlmICgkJC5mcmFnbWVudCAhPT0gbnVsbCkge1xuICAgICAgICBydW5fYWxsKCQkLm9uX2Rlc3Ryb3kpO1xuICAgICAgICAkJC5mcmFnbWVudCAmJiAkJC5mcmFnbWVudC5kKGRldGFjaGluZyk7XG4gICAgICAgIC8vIFRPRE8gbnVsbCBvdXQgb3RoZXIgcmVmcywgaW5jbHVkaW5nIGNvbXBvbmVudC4kJCAoYnV0IG5lZWQgdG9cbiAgICAgICAgLy8gcHJlc2VydmUgZmluYWwgc3RhdGU/KVxuICAgICAgICAkJC5vbl9kZXN0cm95ID0gJCQuZnJhZ21lbnQgPSBudWxsO1xuICAgICAgICAkJC5jdHggPSBbXTtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlX2RpcnR5KGNvbXBvbmVudCwgaSkge1xuICAgIGlmIChjb21wb25lbnQuJCQuZGlydHlbMF0gPT09IC0xKSB7XG4gICAgICAgIGRpcnR5X2NvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICBzY2hlZHVsZV91cGRhdGUoKTtcbiAgICAgICAgY29tcG9uZW50LiQkLmRpcnR5LmZpbGwoMCk7XG4gICAgfVxuICAgIGNvbXBvbmVudC4kJC5kaXJ0eVsoaSAvIDMxKSB8IDBdIHw9ICgxIDw8IChpICUgMzEpKTtcbn1cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zLCBpbnN0YW5jZSwgY3JlYXRlX2ZyYWdtZW50LCBub3RfZXF1YWwsIHByb3BzLCBhcHBlbmRfc3R5bGVzLCBkaXJ0eSA9IFstMV0pIHtcbiAgICBjb25zdCBwYXJlbnRfY29tcG9uZW50ID0gY3VycmVudF9jb21wb25lbnQ7XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KGNvbXBvbmVudCk7XG4gICAgY29uc3QgJCQgPSBjb21wb25lbnQuJCQgPSB7XG4gICAgICAgIGZyYWdtZW50OiBudWxsLFxuICAgICAgICBjdHg6IFtdLFxuICAgICAgICAvLyBzdGF0ZVxuICAgICAgICBwcm9wcyxcbiAgICAgICAgdXBkYXRlOiBub29wLFxuICAgICAgICBub3RfZXF1YWwsXG4gICAgICAgIGJvdW5kOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgLy8gbGlmZWN5Y2xlXG4gICAgICAgIG9uX21vdW50OiBbXSxcbiAgICAgICAgb25fZGVzdHJveTogW10sXG4gICAgICAgIG9uX2Rpc2Nvbm5lY3Q6IFtdLFxuICAgICAgICBiZWZvcmVfdXBkYXRlOiBbXSxcbiAgICAgICAgYWZ0ZXJfdXBkYXRlOiBbXSxcbiAgICAgICAgY29udGV4dDogbmV3IE1hcChvcHRpb25zLmNvbnRleHQgfHwgKHBhcmVudF9jb21wb25lbnQgPyBwYXJlbnRfY29tcG9uZW50LiQkLmNvbnRleHQgOiBbXSkpLFxuICAgICAgICAvLyBldmVyeXRoaW5nIGVsc2VcbiAgICAgICAgY2FsbGJhY2tzOiBibGFua19vYmplY3QoKSxcbiAgICAgICAgZGlydHksXG4gICAgICAgIHNraXBfYm91bmQ6IGZhbHNlLFxuICAgICAgICByb290OiBvcHRpb25zLnRhcmdldCB8fCBwYXJlbnRfY29tcG9uZW50LiQkLnJvb3RcbiAgICB9O1xuICAgIGFwcGVuZF9zdHlsZXMgJiYgYXBwZW5kX3N0eWxlcygkJC5yb290KTtcbiAgICBsZXQgcmVhZHkgPSBmYWxzZTtcbiAgICAkJC5jdHggPSBpbnN0YW5jZVxuICAgICAgICA/IGluc3RhbmNlKGNvbXBvbmVudCwgb3B0aW9ucy5wcm9wcyB8fCB7fSwgKGksIHJldCwgLi4ucmVzdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByZXN0Lmxlbmd0aCA/IHJlc3RbMF0gOiByZXQ7XG4gICAgICAgICAgICBpZiAoJCQuY3R4ICYmIG5vdF9lcXVhbCgkJC5jdHhbaV0sICQkLmN0eFtpXSA9IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghJCQuc2tpcF9ib3VuZCAmJiAkJC5ib3VuZFtpXSlcbiAgICAgICAgICAgICAgICAgICAgJCQuYm91bmRbaV0odmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChyZWFkeSlcbiAgICAgICAgICAgICAgICAgICAgbWFrZV9kaXJ0eShjb21wb25lbnQsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSlcbiAgICAgICAgOiBbXTtcbiAgICAkJC51cGRhdGUoKTtcbiAgICByZWFkeSA9IHRydWU7XG4gICAgcnVuX2FsbCgkJC5iZWZvcmVfdXBkYXRlKTtcbiAgICAvLyBgZmFsc2VgIGFzIGEgc3BlY2lhbCBjYXNlIG9mIG5vIERPTSBjb21wb25lbnRcbiAgICAkJC5mcmFnbWVudCA9IGNyZWF0ZV9mcmFnbWVudCA/IGNyZWF0ZV9mcmFnbWVudCgkJC5jdHgpIDogZmFsc2U7XG4gICAgaWYgKG9wdGlvbnMudGFyZ2V0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLmh5ZHJhdGUpIHtcbiAgICAgICAgICAgIHN0YXJ0X2h5ZHJhdGluZygpO1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBjaGlsZHJlbihvcHRpb25zLnRhcmdldCk7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQubChub2Rlcyk7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGRldGFjaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgICAgICAgICAgJCQuZnJhZ21lbnQgJiYgJCQuZnJhZ21lbnQuYygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmludHJvKVxuICAgICAgICAgICAgdHJhbnNpdGlvbl9pbihjb21wb25lbnQuJCQuZnJhZ21lbnQpO1xuICAgICAgICBtb3VudF9jb21wb25lbnQoY29tcG9uZW50LCBvcHRpb25zLnRhcmdldCwgb3B0aW9ucy5hbmNob3IsIG9wdGlvbnMuY3VzdG9tRWxlbWVudCk7XG4gICAgICAgIGVuZF9oeWRyYXRpbmcoKTtcbiAgICAgICAgZmx1c2goKTtcbiAgICB9XG4gICAgc2V0X2N1cnJlbnRfY29tcG9uZW50KHBhcmVudF9jb21wb25lbnQpO1xufVxubGV0IFN2ZWx0ZUVsZW1lbnQ7XG5pZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgU3ZlbHRlRWxlbWVudCA9IGNsYXNzIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgb25fbW91bnQgfSA9IHRoaXMuJCQ7XG4gICAgICAgICAgICB0aGlzLiQkLm9uX2Rpc2Nvbm5lY3QgPSBvbl9tb3VudC5tYXAocnVuKS5maWx0ZXIoaXNfZnVuY3Rpb24pO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB0b2RvOiBpbXByb3ZlIHR5cGluZ3NcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMuJCQuc2xvdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgdG9kbzogaW1wcm92ZSB0eXBpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLiQkLnNsb3R0ZWRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHIsIF9vbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXNbYXR0cl0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgICAgIHJ1bl9hbGwodGhpcy4kJC5vbl9kaXNjb25uZWN0KTtcbiAgICAgICAgfVxuICAgICAgICAkZGVzdHJveSgpIHtcbiAgICAgICAgICAgIGRlc3Ryb3lfY29tcG9uZW50KHRoaXMsIDEpO1xuICAgICAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgJG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBUT0RPIHNob3VsZCB0aGlzIGRlbGVnYXRlIHRvIGFkZEV2ZW50TGlzdGVuZXI/XG4gICAgICAgICAgICBpZiAoIWlzX2Z1bmN0aW9uKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub29wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgICAgICBjYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkc2V0KCQkcHJvcHMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuJCQuc2tpcF9ib3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy4kJHNldCgkJHByb3BzKTtcbiAgICAgICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzLiBVc2VkIHdoZW4gZGV2PWZhbHNlLlxuICovXG5jbGFzcyBTdmVsdGVDb21wb25lbnQge1xuICAgICRkZXN0cm95KCkge1xuICAgICAgICBkZXN0cm95X2NvbXBvbmVudCh0aGlzLCAxKTtcbiAgICAgICAgdGhpcy4kZGVzdHJveSA9IG5vb3A7XG4gICAgfVxuICAgICRvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIWlzX2Z1bmN0aW9uKGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gKHRoaXMuJCQuY2FsbGJhY2tzW3R5cGVdIHx8ICh0aGlzLiQkLmNhbGxiYWNrc1t0eXBlXSA9IFtdKSk7XG4gICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcbiAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgJHNldCgkJHByb3BzKSB7XG4gICAgICAgIGlmICh0aGlzLiQkc2V0ICYmICFpc19lbXB0eSgkJHByb3BzKSkge1xuICAgICAgICAgICAgdGhpcy4kJC5za2lwX2JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuJCRzZXQoJCRwcm9wcyk7XG4gICAgICAgICAgICB0aGlzLiQkLnNraXBfYm91bmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hfZGV2KHR5cGUsIGRldGFpbCkge1xuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoY3VzdG9tX2V2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oeyB2ZXJzaW9uOiAnMy41NS4xJyB9LCBkZXRhaWwpLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2Rldih0YXJnZXQsIG5vZGUpIHtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTUluc2VydCcsIHsgdGFyZ2V0LCBub2RlIH0pO1xuICAgIGFwcGVuZCh0YXJnZXQsIG5vZGUpO1xufVxuZnVuY3Rpb24gYXBwZW5kX2h5ZHJhdGlvbl9kZXYodGFyZ2V0LCBub2RlKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSB9KTtcbiAgICBhcHBlbmRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSk7XG59XG5mdW5jdGlvbiBpbnNlcnRfZGV2KHRhcmdldCwgbm9kZSwgYW5jaG9yKSB7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01JbnNlcnQnLCB7IHRhcmdldCwgbm9kZSwgYW5jaG9yIH0pO1xuICAgIGluc2VydCh0YXJnZXQsIG5vZGUsIGFuY2hvcik7XG59XG5mdW5jdGlvbiBpbnNlcnRfaHlkcmF0aW9uX2Rldih0YXJnZXQsIG5vZGUsIGFuY2hvcikge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NSW5zZXJ0JywgeyB0YXJnZXQsIG5vZGUsIGFuY2hvciB9KTtcbiAgICBpbnNlcnRfaHlkcmF0aW9uKHRhcmdldCwgbm9kZSwgYW5jaG9yKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9kZXYobm9kZSkge1xuICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlJywgeyBub2RlIH0pO1xuICAgIGRldGFjaChub2RlKTtcbn1cbmZ1bmN0aW9uIGRldGFjaF9iZXR3ZWVuX2RldihiZWZvcmUsIGFmdGVyKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG4gICAgICAgIGRldGFjaF9kZXYoYmVmb3JlLm5leHRTaWJsaW5nKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZXRhY2hfYmVmb3JlX2RldihhZnRlcikge1xuICAgIHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgZGV0YWNoX2RldihhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRldGFjaF9hZnRlcl9kZXYoYmVmb3JlKSB7XG4gICAgd2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuICAgICAgICBkZXRhY2hfZGV2KGJlZm9yZS5uZXh0U2libGluZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbGlzdGVuX2Rldihub2RlLCBldmVudCwgaGFuZGxlciwgb3B0aW9ucywgaGFzX3ByZXZlbnRfZGVmYXVsdCwgaGFzX3N0b3BfcHJvcGFnYXRpb24pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSBvcHRpb25zID09PSB0cnVlID8gWydjYXB0dXJlJ10gOiBvcHRpb25zID8gQXJyYXkuZnJvbShPYmplY3Qua2V5cyhvcHRpb25zKSkgOiBbXTtcbiAgICBpZiAoaGFzX3ByZXZlbnRfZGVmYXVsdClcbiAgICAgICAgbW9kaWZpZXJzLnB1c2goJ3ByZXZlbnREZWZhdWx0Jyk7XG4gICAgaWYgKGhhc19zdG9wX3Byb3BhZ2F0aW9uKVxuICAgICAgICBtb2RpZmllcnMucHVzaCgnc3RvcFByb3BhZ2F0aW9uJyk7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01BZGRFdmVudExpc3RlbmVyJywgeyBub2RlLCBldmVudCwgaGFuZGxlciwgbW9kaWZpZXJzIH0pO1xuICAgIGNvbnN0IGRpc3Bvc2UgPSBsaXN0ZW4obm9kZSwgZXZlbnQsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NUmVtb3ZlRXZlbnRMaXN0ZW5lcicsIHsgbm9kZSwgZXZlbnQsIGhhbmRsZXIsIG1vZGlmaWVycyB9KTtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBhdHRyX2Rldihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG4gICAgYXR0cihub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01SZW1vdmVBdHRyaWJ1dGUnLCB7IG5vZGUsIGF0dHJpYnV0ZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIGRpc3BhdGNoX2RldignU3ZlbHRlRE9NU2V0QXR0cmlidXRlJywgeyBub2RlLCBhdHRyaWJ1dGUsIHZhbHVlIH0pO1xufVxuZnVuY3Rpb24gcHJvcF9kZXYobm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgbm9kZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICBkaXNwYXRjaF9kZXYoJ1N2ZWx0ZURPTVNldFByb3BlcnR5JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBkYXRhc2V0X2Rldihub2RlLCBwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICBub2RlLmRhdGFzZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhc2V0JywgeyBub2RlLCBwcm9wZXJ0eSwgdmFsdWUgfSk7XG59XG5mdW5jdGlvbiBzZXRfZGF0YV9kZXYodGV4dCwgZGF0YSkge1xuICAgIGRhdGEgPSAnJyArIGRhdGE7XG4gICAgaWYgKHRleHQud2hvbGVUZXh0ID09PSBkYXRhKVxuICAgICAgICByZXR1cm47XG4gICAgZGlzcGF0Y2hfZGV2KCdTdmVsdGVET01TZXREYXRhJywgeyBub2RlOiB0ZXh0LCBkYXRhIH0pO1xuICAgIHRleHQuZGF0YSA9IGRhdGE7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9lYWNoX2FyZ3VtZW50KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJyAmJiAhKGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiAnbGVuZ3RoJyBpbiBhcmcpKSB7XG4gICAgICAgIGxldCBtc2cgPSAneyNlYWNofSBvbmx5IGl0ZXJhdGVzIG92ZXIgYXJyYXktbGlrZSBvYmplY3RzLic7XG4gICAgICAgIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIGFyZyAmJiBTeW1ib2wuaXRlcmF0b3IgaW4gYXJnKSB7XG4gICAgICAgICAgICBtc2cgKz0gJyBZb3UgY2FuIHVzZSBhIHNwcmVhZCB0byBjb252ZXJ0IHRoaXMgaXRlcmFibGUgaW50byBhbiBhcnJheS4nO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlX3Nsb3RzKG5hbWUsIHNsb3QsIGtleXMpIHtcbiAgICBmb3IgKGNvbnN0IHNsb3Rfa2V5IG9mIE9iamVjdC5rZXlzKHNsb3QpKSB7XG4gICAgICAgIGlmICghfmtleXMuaW5kZXhPZihzbG90X2tleSkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgPCR7bmFtZX0+IHJlY2VpdmVkIGFuIHVuZXhwZWN0ZWQgc2xvdCBcIiR7c2xvdF9rZXl9XCIuYCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV9keW5hbWljX2VsZW1lbnQodGFnKSB7XG4gICAgY29uc3QgaXNfc3RyaW5nID0gdHlwZW9mIHRhZyA9PT0gJ3N0cmluZyc7XG4gICAgaWYgKHRhZyAmJiAhaXNfc3RyaW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignPHN2ZWx0ZTplbGVtZW50PiBleHBlY3RzIFwidGhpc1wiIGF0dHJpYnV0ZSB0byBiZSBhIHN0cmluZy4nKTtcbiAgICB9XG59XG5mdW5jdGlvbiB2YWxpZGF0ZV92b2lkX2R5bmFtaWNfZWxlbWVudCh0YWcpIHtcbiAgICBpZiAodGFnICYmIGlzX3ZvaWQodGFnKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oYDxzdmVsdGU6ZWxlbWVudCB0aGlzPVwiJHt0YWd9XCI+IGlzIHNlbGYtY2xvc2luZyBhbmQgY2Fubm90IGhhdmUgY29udGVudC5gKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjb25zdHJ1Y3Rfc3ZlbHRlX2NvbXBvbmVudF9kZXYoY29tcG9uZW50LCBwcm9wcykge1xuICAgIGNvbnN0IGVycm9yX21lc3NhZ2UgPSAndGhpcz17Li4ufSBvZiA8c3ZlbHRlOmNvbXBvbmVudD4gc2hvdWxkIHNwZWNpZnkgYSBTdmVsdGUgY29tcG9uZW50Lic7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgY29tcG9uZW50KHByb3BzKTtcbiAgICAgICAgaWYgKCFpbnN0YW5jZS4kJCB8fCAhaW5zdGFuY2UuJHNldCB8fCAhaW5zdGFuY2UuJG9uIHx8ICFpbnN0YW5jZS4kZGVzdHJveSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yX21lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCB7IG1lc3NhZ2UgfSA9IGVycjtcbiAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJyAmJiBtZXNzYWdlLmluZGV4T2YoJ2lzIG5vdCBhIGNvbnN0cnVjdG9yJykgIT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JfbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIFN2ZWx0ZSBjb21wb25lbnRzIHdpdGggc29tZSBtaW5vciBkZXYtZW5oYW5jZW1lbnRzLiBVc2VkIHdoZW4gZGV2PXRydWUuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudERldiBleHRlbmRzIFN2ZWx0ZUNvbXBvbmVudCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKCFvcHRpb25zLnRhcmdldCAmJiAhb3B0aW9ucy4kJGlubGluZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIid0YXJnZXQnIGlzIGEgcmVxdWlyZWQgb3B0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgICRkZXN0cm95KCkge1xuICAgICAgICBzdXBlci4kZGVzdHJveSgpO1xuICAgICAgICB0aGlzLiRkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICB9O1xuICAgIH1cbiAgICAkY2FwdHVyZV9zdGF0ZSgpIHsgfVxuICAgICRpbmplY3Rfc3RhdGUoKSB7IH1cbn1cbi8qKlxuICogQmFzZSBjbGFzcyB0byBjcmVhdGUgc3Ryb25nbHkgdHlwZWQgU3ZlbHRlIGNvbXBvbmVudHMuXG4gKiBUaGlzIG9ubHkgZXhpc3RzIGZvciB0eXBpbmcgcHVycG9zZXMgYW5kIHNob3VsZCBiZSB1c2VkIGluIGAuZC50c2AgZmlsZXMuXG4gKlxuICogIyMjIEV4YW1wbGU6XG4gKlxuICogWW91IGhhdmUgY29tcG9uZW50IGxpYnJhcnkgb24gbnBtIGNhbGxlZCBgY29tcG9uZW50LWxpYnJhcnlgLCBmcm9tIHdoaWNoXG4gKiB5b3UgZXhwb3J0IGEgY29tcG9uZW50IGNhbGxlZCBgTXlDb21wb25lbnRgLiBGb3IgU3ZlbHRlK1R5cGVTY3JpcHQgdXNlcnMsXG4gKiB5b3Ugd2FudCB0byBwcm92aWRlIHR5cGluZ3MuIFRoZXJlZm9yZSB5b3UgY3JlYXRlIGEgYGluZGV4LmQudHNgOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFN2ZWx0ZUNvbXBvbmVudFR5cGVkIH0gZnJvbSBcInN2ZWx0ZVwiO1xuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50VHlwZWQ8e2Zvbzogc3RyaW5nfT4ge31cbiAqIGBgYFxuICogVHlwaW5nIHRoaXMgbWFrZXMgaXQgcG9zc2libGUgZm9yIElERXMgbGlrZSBWUyBDb2RlIHdpdGggdGhlIFN2ZWx0ZSBleHRlbnNpb25cbiAqIHRvIHByb3ZpZGUgaW50ZWxsaXNlbnNlIGFuZCB0byB1c2UgdGhlIGNvbXBvbmVudCBsaWtlIHRoaXMgaW4gYSBTdmVsdGUgZmlsZVxuICogd2l0aCBUeXBlU2NyaXB0OlxuICogYGBgc3ZlbHRlXG4gKiA8c2NyaXB0IGxhbmc9XCJ0c1wiPlxuICogXHRpbXBvcnQgeyBNeUNvbXBvbmVudCB9IGZyb20gXCJjb21wb25lbnQtbGlicmFyeVwiO1xuICogPC9zY3JpcHQ+XG4gKiA8TXlDb21wb25lbnQgZm9vPXsnYmFyJ30gLz5cbiAqIGBgYFxuICpcbiAqICMjIyMgV2h5IG5vdCBtYWtlIHRoaXMgcGFydCBvZiBgU3ZlbHRlQ29tcG9uZW50KERldilgP1xuICogQmVjYXVzZVxuICogYGBgdHNcbiAqIGNsYXNzIEFTdWJjbGFzc09mU3ZlbHRlQ29tcG9uZW50IGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50PHtmb286IHN0cmluZ30+IHt9XG4gKiBjb25zdCBjb21wb25lbnQ6IHR5cGVvZiBTdmVsdGVDb21wb25lbnQgPSBBU3ViY2xhc3NPZlN2ZWx0ZUNvbXBvbmVudDtcbiAqIGBgYFxuICogd2lsbCB0aHJvdyBhIHR5cGUgZXJyb3IsIHNvIHdlIG5lZWQgdG8gc2VwYXJhdGUgdGhlIG1vcmUgc3RyaWN0bHkgdHlwZWQgY2xhc3MuXG4gKi9cbmNsYXNzIFN2ZWx0ZUNvbXBvbmVudFR5cGVkIGV4dGVuZHMgU3ZlbHRlQ29tcG9uZW50RGV2IHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxvb3BfZ3VhcmQodGltZW91dCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ID4gdGltZW91dCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZSBsb29wIGRldGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgeyBIdG1sVGFnLCBIdG1sVGFnSHlkcmF0aW9uLCBTdmVsdGVDb21wb25lbnQsIFN2ZWx0ZUNvbXBvbmVudERldiwgU3ZlbHRlQ29tcG9uZW50VHlwZWQsIFN2ZWx0ZUVsZW1lbnQsIGFjdGlvbl9kZXN0cm95ZXIsIGFkZF9hdHRyaWJ1dGUsIGFkZF9jbGFzc2VzLCBhZGRfZmx1c2hfY2FsbGJhY2ssIGFkZF9sb2NhdGlvbiwgYWRkX3JlbmRlcl9jYWxsYmFjaywgYWRkX3Jlc2l6ZV9saXN0ZW5lciwgYWRkX3N0eWxlcywgYWRkX3RyYW5zZm9ybSwgYWZ0ZXJVcGRhdGUsIGFwcGVuZCwgYXBwZW5kX2RldiwgYXBwZW5kX2VtcHR5X3N0eWxlc2hlZXQsIGFwcGVuZF9oeWRyYXRpb24sIGFwcGVuZF9oeWRyYXRpb25fZGV2LCBhcHBlbmRfc3R5bGVzLCBhc3NpZ24sIGF0dHIsIGF0dHJfZGV2LCBhdHRyaWJ1dGVfdG9fb2JqZWN0LCBiZWZvcmVVcGRhdGUsIGJpbmQsIGJpbmRpbmdfY2FsbGJhY2tzLCBibGFua19vYmplY3QsIGJ1YmJsZSwgY2hlY2tfb3V0cm9zLCBjaGlsZHJlbiwgY2xhaW1fY29tcG9uZW50LCBjbGFpbV9lbGVtZW50LCBjbGFpbV9odG1sX3RhZywgY2xhaW1fc3BhY2UsIGNsYWltX3N2Z19lbGVtZW50LCBjbGFpbV90ZXh0LCBjbGVhcl9sb29wcywgY29tcG9uZW50X3N1YnNjcmliZSwgY29tcHV0ZV9yZXN0X3Byb3BzLCBjb21wdXRlX3Nsb3RzLCBjb25zdHJ1Y3Rfc3ZlbHRlX2NvbXBvbmVudCwgY29uc3RydWN0X3N2ZWx0ZV9jb21wb25lbnRfZGV2LCBjcmVhdGVFdmVudERpc3BhdGNoZXIsIGNyZWF0ZV9hbmltYXRpb24sIGNyZWF0ZV9iaWRpcmVjdGlvbmFsX3RyYW5zaXRpb24sIGNyZWF0ZV9jb21wb25lbnQsIGNyZWF0ZV9pbl90cmFuc2l0aW9uLCBjcmVhdGVfb3V0X3RyYW5zaXRpb24sIGNyZWF0ZV9zbG90LCBjcmVhdGVfc3NyX2NvbXBvbmVudCwgY3VycmVudF9jb21wb25lbnQsIGN1c3RvbV9ldmVudCwgZGF0YXNldF9kZXYsIGRlYnVnLCBkZXN0cm95X2Jsb2NrLCBkZXN0cm95X2NvbXBvbmVudCwgZGVzdHJveV9lYWNoLCBkZXRhY2gsIGRldGFjaF9hZnRlcl9kZXYsIGRldGFjaF9iZWZvcmVfZGV2LCBkZXRhY2hfYmV0d2Vlbl9kZXYsIGRldGFjaF9kZXYsIGRpcnR5X2NvbXBvbmVudHMsIGRpc3BhdGNoX2RldiwgZWFjaCwgZWxlbWVudCwgZWxlbWVudF9pcywgZW1wdHksIGVuZF9oeWRyYXRpbmcsIGVzY2FwZSwgZXNjYXBlX2F0dHJpYnV0ZV92YWx1ZSwgZXNjYXBlX29iamVjdCwgZXhjbHVkZV9pbnRlcm5hbF9wcm9wcywgZml4X2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfYW5kX291dHJvX2FuZF9kZXN0cm95X2Jsb2NrLCBmaXhfcG9zaXRpb24sIGZsdXNoLCBnZXRBbGxDb250ZXh0cywgZ2V0Q29udGV4dCwgZ2V0X2FsbF9kaXJ0eV9mcm9tX3Njb3BlLCBnZXRfYmluZGluZ19ncm91cF92YWx1ZSwgZ2V0X2N1cnJlbnRfY29tcG9uZW50LCBnZXRfY3VzdG9tX2VsZW1lbnRzX3Nsb3RzLCBnZXRfcm9vdF9mb3Jfc3R5bGUsIGdldF9zbG90X2NoYW5nZXMsIGdldF9zcHJlYWRfb2JqZWN0LCBnZXRfc3ByZWFkX3VwZGF0ZSwgZ2V0X3N0b3JlX3ZhbHVlLCBnbG9iYWxzLCBncm91cF9vdXRyb3MsIGhhbmRsZV9wcm9taXNlLCBoYXNDb250ZXh0LCBoYXNfcHJvcCwgaGVhZF9zZWxlY3RvciwgaWRlbnRpdHksIGluaXQsIGluc2VydCwgaW5zZXJ0X2RldiwgaW5zZXJ0X2h5ZHJhdGlvbiwgaW5zZXJ0X2h5ZHJhdGlvbl9kZXYsIGludHJvcywgaW52YWxpZF9hdHRyaWJ1dGVfbmFtZV9jaGFyYWN0ZXIsIGlzX2NsaWVudCwgaXNfY3Jvc3NvcmlnaW4sIGlzX2VtcHR5LCBpc19mdW5jdGlvbiwgaXNfcHJvbWlzZSwgaXNfdm9pZCwgbGlzdGVuLCBsaXN0ZW5fZGV2LCBsb29wLCBsb29wX2d1YXJkLCBtZXJnZV9zc3Jfc3R5bGVzLCBtaXNzaW5nX2NvbXBvbmVudCwgbW91bnRfY29tcG9uZW50LCBub29wLCBub3RfZXF1YWwsIG5vdywgbnVsbF90b19lbXB0eSwgb2JqZWN0X3dpdGhvdXRfcHJvcGVydGllcywgb25EZXN0cm95LCBvbk1vdW50LCBvbmNlLCBvdXRyb19hbmRfZGVzdHJveV9ibG9jaywgcHJldmVudF9kZWZhdWx0LCBwcm9wX2RldiwgcXVlcnlfc2VsZWN0b3JfYWxsLCByYWYsIHJ1biwgcnVuX2FsbCwgc2FmZV9ub3RfZXF1YWwsIHNjaGVkdWxlX3VwZGF0ZSwgc2VsZWN0X211bHRpcGxlX3ZhbHVlLCBzZWxlY3Rfb3B0aW9uLCBzZWxlY3Rfb3B0aW9ucywgc2VsZWN0X3ZhbHVlLCBzZWxmLCBzZXRDb250ZXh0LCBzZXRfYXR0cmlidXRlcywgc2V0X2N1cnJlbnRfY29tcG9uZW50LCBzZXRfY3VzdG9tX2VsZW1lbnRfZGF0YSwgc2V0X2N1c3RvbV9lbGVtZW50X2RhdGFfbWFwLCBzZXRfZGF0YSwgc2V0X2RhdGFfZGV2LCBzZXRfaW5wdXRfdHlwZSwgc2V0X2lucHV0X3ZhbHVlLCBzZXRfbm93LCBzZXRfcmFmLCBzZXRfc3RvcmVfdmFsdWUsIHNldF9zdHlsZSwgc2V0X3N2Z19hdHRyaWJ1dGVzLCBzcGFjZSwgc3ByZWFkLCBzcmNfdXJsX2VxdWFsLCBzdGFydF9oeWRyYXRpbmcsIHN0b3BfcHJvcGFnYXRpb24sIHN1YnNjcmliZSwgc3ZnX2VsZW1lbnQsIHRleHQsIHRpY2ssIHRpbWVfcmFuZ2VzX3RvX2FycmF5LCB0b19udW1iZXIsIHRvZ2dsZV9jbGFzcywgdHJhbnNpdGlvbl9pbiwgdHJhbnNpdGlvbl9vdXQsIHRydXN0ZWQsIHVwZGF0ZV9hd2FpdF9ibG9ja19icmFuY2gsIHVwZGF0ZV9rZXllZF9lYWNoLCB1cGRhdGVfc2xvdCwgdXBkYXRlX3Nsb3RfYmFzZSwgdmFsaWRhdGVfY29tcG9uZW50LCB2YWxpZGF0ZV9keW5hbWljX2VsZW1lbnQsIHZhbGlkYXRlX2VhY2hfYXJndW1lbnQsIHZhbGlkYXRlX2VhY2hfa2V5cywgdmFsaWRhdGVfc2xvdHMsIHZhbGlkYXRlX3N0b3JlLCB2YWxpZGF0ZV92b2lkX2R5bmFtaWNfZWxlbWVudCwgeGxpbmtfYXR0ciB9O1xuIiwgIjxkaXYgY2xhc3M9XCJrbm9iLWNvbnRyb2xcIiBzdHlsZT1cIntzdHlsZX1cIiBiaW5kOnRoaXM9e2tub2J9PlxyXG4gICAgPHN2ZyB3aWR0aD1cIntjb21wdXRlZFNpemV9XCIgaGVpZ2h0PVwie2NvbXB1dGVkU2l6ZX1cIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIlxyXG4gICAgICAgIG9uOmNsaWNrPVwie29uQ2xpY2t9XCJcclxuICAgICAgICBvbjptb3VzZWRvd249XCJ7b25Nb3VzZURvd259XCJcclxuICAgICAgICBvbjptb3VzZXVwPVwie29uTW91c2VVcH1cIlxyXG4gICAgICAgIG9uOnRvdWNoc3RhcnQ9XCJ7b25Ub3VjaFN0YXJ0fVwiXHJcbiAgICAgICAgb246dG91Y2hlbmQ9XCJ7b25Ub3VjaEVuZH1cIj5cclxuICAgICAgICA8cGF0aFxyXG4gICAgICAgICAgICBkPVwie3JhbmdlUGF0aH1cIlxyXG4gICAgICAgICAgICBzdHJva2Utd2lkdGg9XCJ7c3Ryb2tlV2lkdGh9XCJcclxuICAgICAgICAgICAgc3Ryb2tlPVwie3NlY29uZGFyeUNvbG9yfVwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwia25vYi1jb250cm9sX19yYW5nZVwiPlxyXG4gICAgICAgIDwvcGF0aD5cclxuXHJcbiAgICAgICAgeyNpZiBzaG93VmFsdWV9XHJcbiAgICAgICAgPHBhdGhcclxuICAgICAgICAgICAgZD1cInt2YWx1ZVBhdGh9XCJcclxuICAgICAgICAgICAgc3Ryb2tlLXdpZHRoPVwie3N0cm9rZVdpZHRofVwiXHJcbiAgICAgICAgICAgIHN0cm9rZT1cIntwcmltYXJ5Q29sb3J9XCJcclxuICAgICAgICAgICAgYmluZDp0aGlzPXtwYXRoVmFsdWV9XHJcbiAgICAgICAgICAgIGRhdGEtZGFzaD1cIntsZW5ndGh9XCJcclxuICAgICAgICAgICAgc3R5bGU9XCJ7ZGFzaFN0eWxlfVwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwia25vYi1jb250cm9sX192YWx1ZVwiPlxyXG4gICAgICAgIDwvcGF0aD5cclxuICAgICAgICA8dGV4dFxyXG4gICAgICAgICAgICB4PVwiNTBcIlxyXG4gICAgICAgICAgICB5PVwiNTdcIlxyXG4gICAgICAgICAgICB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiXHJcbiAgICAgICAgICAgIGZpbGw9XCJ7dGV4dENvbG9yfVwiXHJcbiAgICAgICAgICAgIGNsYXNzPVwia25vYi1jb250cm9sX190ZXh0LWRpc3BsYXlcIj5cclxuICAgICAgICAgICAge3ZhbHVlRGlzcGxheX1cclxuICAgICAgICA8L3RleHQ+XHJcbiAgICAgICAgey9pZn1cclxuICAgIDwvc3ZnPlxyXG48L2Rpdj5cclxuXHJcbjxzY3JpcHQ+XHJcbmltcG9ydCB7XHJcbiAgICBvbk1vdW50XHJcbn0gZnJvbSAnc3ZlbHRlJ1xyXG5cclxuY29uc3QgUkFESVVTID0gNDA7XHJcbmNvbnN0IE1JRF9YID0gNTA7XHJcbmNvbnN0IE1JRF9ZID0gNTA7XHJcbmNvbnN0IE1JTl9SQURJQU5TID0gNCAqIE1hdGguUEkgLyAzO1xyXG5jb25zdCBNQVhfUkFESUFOUyA9IC1NYXRoLlBJIC8gMztcclxuXHJcbmxldCBwYXRoVmFsdWU7XHJcbmxldCBrbm9iO1xyXG5cclxubGV0IGxlbmd0aCA9IDA7XHJcbmxldCBhbmltYXRlZFZhbHVlID0gMDtcclxubGV0IGludGVydmFsID0gbnVsbDtcclxuXHJcbmV4cG9ydCBsZXQgYW5pbWF0aW9uID0ge1xyXG4gICAgYW5pbWF0ZWQ6IGZhbHNlLFxyXG4gICAgYW5pbWF0ZVZhbHVlOiBmYWxzZSxcclxuICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAyMDAwLFxyXG4gICAgYW5pbWF0aW9uRnVuY3Rpb246ICdlYXNlLWluLW91dCcsXHJcbn1cclxuXHJcbmV4cG9ydCBsZXQgdmFsdWUgPSAwO1xyXG5leHBvcnQgbGV0IG1heCA9IDEwMDtcclxuZXhwb3J0IGxldCBtaW4gPSAwO1xyXG5leHBvcnQgbGV0IHNob3dWYWx1ZSA9IHRydWU7XHJcblxyXG5leHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2U7XHJcbmV4cG9ydCBsZXQgc3RlcCA9IDE7XHJcbmV4cG9ydCBsZXQgc2l6ZSA9IDEwMDtcclxuZXhwb3J0IGxldCByZXNwb25zaXZlID0gZmFsc2U7XHJcbmV4cG9ydCBsZXQgcHJpbWFyeUNvbG9yID0gJyM0MDllZmYnO1xyXG5leHBvcnQgbGV0IHNlY29uZGFyeUNvbG9yID0gJyNkY2RmZTYnO1xyXG5leHBvcnQgbGV0IHRleHRDb2xvciA9ICcjMDAwMDAwJztcclxuZXhwb3J0IGxldCBzdHJva2VXaWR0aCA9IDE3O1xyXG5leHBvcnQgbGV0IHZhbHVlRGlzcGxheUZ1bmN0aW9uID0gKHYpID0+IHY7XHJcblxyXG5vbk1vdW50KGFzeW5jICgpID0+IHtcclxuICAgIGRhc2hMZW5ndGgoKVxyXG4gICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgXHJcbiAgICBpbnRlcnZhbCA9IG51bGw7XHJcbiAgICBpZiAoYW5pbWF0aW9uLmFuaW1hdGVWYWx1ZSkge1xyXG4gICAgICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYW5pbWF0ZWRWYWx1ZSA8IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBhbmltYXRlZFZhbHVlICs9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcclxuICAgICAgICAgICAgICAgIGludGVydmFsID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIChhbmltYXRpb24uYW5pbWF0aW9uRHVyYXRpb24gKiAxMDAwKSAvIHZhbHVlIC8gMTAwMCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJDogZGFzaFN0eWxlID0ge1xyXG4gICAgc3Ryb2tlRGFzaGFycmF5OiBsZW5ndGgsXHJcbiAgICBzdHJva2VEYXNob2Zmc2V0OiBsZW5ndGhcclxufVxyXG5cclxuJDogc3R5bGUgPSAnaGVpZ2h0OicgKyAocmVzcG9uc2l2ZSA/IHNpemUgKyAnJScgOiBzaXplIC0gNSArICdweCcpO1xyXG5cclxuJDogY29tcHV0ZWRTaXplID0gcmVzcG9uc2l2ZSA/IHNpemUgKyAnJScgOiBzaXplXHJcblxyXG4kOiByYW5nZVBhdGggPSBgTSAke21pblh9ICR7bWluWX0gQSAke1JBRElVU30gJHtSQURJVVN9IDAgMSAxICR7bWF4WH0gJHttYXhZfWA7XHJcblxyXG4kOiB2YWx1ZVBhdGggPSBgTSAke3plcm9YfSAke3plcm9ZfSBBICR7UkFESVVTfSAke1JBRElVU30gMCAke2xhcmdlQXJjfSAke3N3ZWVwfSAke3ZhbHVlWH0gJHt2YWx1ZVl9YDtcclxuXHJcblxyXG4kOiB6ZXJvUmFkaWFucyA9IChtaW4gPiAwICYmIG1heCA+IDApID9tYXBSYW5nZShtaW4sIG1pbiwgbWF4LCBNSU5fUkFESUFOUywgTUFYX1JBRElBTlMpOm1hcFJhbmdlKDAsIG1pbiwgbWF4LCBNSU5fUkFESUFOUywgTUFYX1JBRElBTlMpO1xyXG5cclxuJDogdmFsdWVSYWRpYW5zID0gbWFwUmFuZ2UodmFsdWUsIG1pbiwgbWF4LCBNSU5fUkFESUFOUywgTUFYX1JBRElBTlMpO1xyXG5cclxuJDogbWluWCA9IE1JRF9YICsgTWF0aC5jb3MoTUlOX1JBRElBTlMpICogUkFESVVTO1xyXG5cclxuJDogbWluWSA9IE1JRF9ZIC0gTWF0aC5zaW4oTUlOX1JBRElBTlMpICogUkFESVVTO1xyXG5cclxuJDogbWF4WCA9IE1JRF9YICsgTWF0aC5jb3MoTUFYX1JBRElBTlMpICogUkFESVVTO1xyXG5cclxuJDogbWF4WSA9IE1JRF9ZIC0gTWF0aC5zaW4oTUFYX1JBRElBTlMpICogUkFESVVTO1xyXG5cclxuJDogemVyb1ggPSBNSURfWCArIE1hdGguY29zKHplcm9SYWRpYW5zKSAqIFJBRElVUztcclxuXHJcbiQ6IHplcm9ZID1NSURfWSAtIE1hdGguc2luKHplcm9SYWRpYW5zKSAqIFJBRElVUztcclxuXHJcbiQ6IHZhbHVlWCA9TUlEX1ggKyBNYXRoLmNvcyh2YWx1ZVJhZGlhbnMpICogUkFESVVTO1xyXG5cclxuJDogdmFsdWVZID0gTUlEX1kgLSBNYXRoLnNpbih2YWx1ZVJhZGlhbnMpICogUkFESVVTO1xyXG5cclxuJDogbGFyZ2VBcmMgPSBNYXRoLmFicyh6ZXJvUmFkaWFucyAtIHZhbHVlUmFkaWFucykgPCBNYXRoLlBJID8gMCA6IDE7XHJcblxyXG4kOiBzd2VlcCA9IHZhbHVlUmFkaWFucyA+IHplcm9SYWRpYW5zID8gMCA6IDE7XHJcblxyXG4kOiB2YWx1ZURpc3BsYXkgPSBhbmltYXRpb24uYW5pbWF0ZVZhbHVlID8gdmFsdWVEaXNwbGF5RnVuY3Rpb24oYW5pbWF0ZWRWYWx1ZSk6dmFsdWVEaXNwbGF5RnVuY3Rpb24odmFsdWUpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVBvc2l0aW9uKG9mZnNldFgsIG9mZnNldFkpIHtcclxuICAgIGNvbnN0IGR4ID0gb2Zmc2V0WCAtIHNpemUgLyAyO1xyXG4gICAgY29uc3QgZHkgPSBzaXplIC8gMiAtIG9mZnNldFk7XHJcbiAgICBjb25zdCBhbmdsZSA9IE1hdGguYXRhbjIoZHksIGR4KTtcclxuXHJcbiAgICBsZXQgbWFwcGVkVmFsdWU7XHJcblxyXG4gICAgY29uc3Qgc3RhcnQgPSAtTWF0aC5QSSAvIDIgLSBNYXRoLlBJIC8gNjtcclxuICAgXHJcbiAgICBpZiAoYW5nbGUgPiBNQVhfUkFESUFOUykge1xyXG4gICAgICAgIG1hcHBlZFZhbHVlID0gbWFwUmFuZ2UoYW5nbGUsIE1JTl9SQURJQU5TLCBNQVhfUkFESUFOUywgbWluLCBtYXgpO1xyXG4gICAgfSBlbHNlIGlmIChhbmdsZSA8IHN0YXJ0KSB7XHJcbiAgICAgICAgbWFwcGVkVmFsdWUgPSBtYXBSYW5nZShhbmdsZSArIDIgKiBNYXRoLlBJLCBNSU5fUkFESUFOUywgTUFYX1JBRElBTlMsIG1pbiwgbWF4KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICBcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBcclxuXHJcbiAgICB2YWx1ZSA9IE1hdGgucm91bmQoKG1hcHBlZFZhbHVlIC0gbWluKSAvIHN0ZXApICogc3RlcCArIG1pbjtcclxuXHJcbiBcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uQ2xpY2soZSkge1xyXG4gXHJcbiAgICBpZiAoIWRpc2FibGVkKSB7XHJcbiAgIFxyXG4gICAgICAgIHVwZGF0ZVBvc2l0aW9uKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcclxuICAgIGlmICghZGlzYWJsZWQpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBvbk1vdXNlVXAoZSkge1xyXG4gICAgaWYgKCFkaXNhYmxlZCkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XHJcbiAgICBpZiAoIWRpc2FibGVkKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBvblRvdWNoRW5kKGUpIHtcclxuICAgIGlmICghZGlzYWJsZWQpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpIHtcclxuICAgIGlmICghZGlzYWJsZWQpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdXBkYXRlUG9zaXRpb24oZS5vZmZzZXRYLCBlLm9mZnNldFkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xyXG4gICAgaWYgKCFkaXNhYmxlZCAmJiBlLnRvdWNoZXMubGVuZ3RoID09IDEpIHtcclxuICAgICAgICBjb25zdCBib3VuZGluZ0NsaWVudFJlY3QgPSBrbm9iLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGNvbnN0IHRvdWNoID0gZS50YXJnZXRUb3VjaGVzLml0ZW0oMCk7XHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IHRvdWNoLmNsaWVudFggLSBib3VuZGluZ0NsaWVudFJlY3QubGVmdDtcclxuICAgICAgICBjb25zdCBvZmZzZXRZID0gdG91Y2guY2xpZW50WSAtIGJvdW5kaW5nQ2xpZW50UmVjdC50b3A7XHJcbiAgICAgICAgdXBkYXRlUG9zaXRpb24ob2Zmc2V0WCwgb2Zmc2V0WSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBkYXNoTGVuZ3RoKCkge1xyXG4gICBcclxuICAgIGxldCBlbGVtZW50ID0gcGF0aFZhbHVlO1xyXG4gICAgbGV0IGxlbmd0aCA9IGVsZW1lbnQuZ2V0VG90YWxMZW5ndGgoKVxyXG4gICAgaWYgKGFuaW1hdGlvbi5hbmltYXRlZCkge1xyXG4gICAgICAgIGVsZW1lbnQuc3R5bGUuYW5pbWF0aW9uRHVyYXRpb24gPSAoYW5pbWF0aW9uLmFuaW1hdGlvbkR1cmF0aW9uIC8gMTAwMCkgKyAncydcclxuICAgICAgICBlbGVtZW50LnN0eWxlLmFuaW1hdGlvbkZ1bmN0aW9uID0gYW5pbWF0aW9uLmFuaW1hdGlvbkZ1bmN0aW9uXHJcbiAgICB9XHJcbiAgICBlbGVtZW50LmRhdGFzZXQuZGFzaCA9IGxlbmd0aFxyXG4gICAgbGVuZ3RoID0gbGVuZ3RoXHJcbn07XHJcblxyXG5mdW5jdGlvbiBtYXBSYW5nZSh4LCBpbk1pbiwgaW5NYXgsIG91dE1pbiwgb3V0TWF4KSAge1xyXG4gICAgcmV0dXJuICh4IC0gaW5NaW4pICogKG91dE1heCAtIG91dE1pbikgLyAoaW5NYXggLSBpbk1pbikgKyBvdXRNaW47XHJcbn07XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN0eWxlPlxyXG5Aa2V5ZnJhbWVzIGRhc2gtZnJhbWUge1xyXG4gICAgMTAwJSB7XHJcbiAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7XHJcbiAgICB9XHJcbn1cclxuXHJcbi5rbm9iLWNvbnRyb2xfX3JhbmdlIHtcclxuICAgIGZpbGw6IG5vbmU7XHJcbiAgICB0cmFuc2l0aW9uOiBzdHJva2UgLjFzIGVhc2UtaW47XHJcbn1cclxuXHJcbi5rbm9iLWNvbnRyb2xfX3ZhbHVlIHtcclxuICAgIGFuaW1hdGlvbi1uYW1lOiBkYXNoLWZyYW1lO1xyXG4gICAgYW5pbWF0aW9uLWZpbGwtbW9kZTogZm9yd2FyZHM7XHJcbiAgICBmaWxsOiBub25lO1xyXG59XHJcblxyXG4ua25vYi1jb250cm9sX190ZXh0LWRpc3BsYXkge1xyXG4gICAgZm9udC1zaXplOiAxLjNyZW07XHJcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbn1cclxuPC9zdHlsZT5cclxuIiwgImltcG9ydCBLbm9iIGZyb20gXCIuL0tub2Iuc3ZlbHRlXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBLbm9iOyIsICI8c2NyaXB0ID5pbXBvcnQgeyBjcmVhdGVFdmVudEZvcndhcmRlciB9IGZyb20gXCIuLi9pbnRlcm5hbFwiO1xyXG5pbXBvcnQgeyBnZXRfY3VycmVudF9jb21wb25lbnQgfSBmcm9tIFwic3ZlbHRlL2ludGVybmFsXCI7XHJcbi8qKiBTcGVjaWZpZXMgYSBjdXN0b20gY2xhc3MgbmFtZSBmb3IgdGhlIHN1cmZhY2UuICovXHJcbmxldCBjbGFzc05hbWUgPSBcIlwiO1xyXG5leHBvcnQgeyBjbGFzc05hbWUgYXMgY2xhc3MgfTtcclxuLyoqIE9idGFpbnMgYSBib3VuZCBET00gcmVmZXJlbmNlIHRvIHRoZSBzdXJmYWNlIGVsZW1lbnQuICovXHJcbmV4cG9ydCBsZXQgZWxlbWVudCA9IG51bGw7XHJcbmNvbnN0IGZvcndhcmRFdmVudHMgPSBjcmVhdGVFdmVudEZvcndhcmRlcihnZXRfY3VycmVudF9jb21wb25lbnQoKSk7XHJcbjwvc2NyaXB0PlxuXG48ZGl2XG5cdGNsYXNzPVwidG9vbHRpcCB7Y2xhc3NOYW1lfVwiXG5cdHJvbGU9XCJ0b29sdGlwXCJcblx0dXNlOmZvcndhcmRFdmVudHNcblx0YmluZDp0aGlzPXtlbGVtZW50fVxuXHR7Li4uJCRyZXN0UHJvcHN9XG4+XG5cdDxzbG90IC8+XG48L2Rpdj5cblxuPHN0eWxlID4udG9vbHRpcHthbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jbGlwOnBhZGRpbmctYm94O2JhY2tncm91bmQtY29sb3I6dmFyKC0tZmRzLXNvbGlkLWJhY2tncm91bmQtcXVhcnRlcm5hcnkpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tZmRzLXN1cmZhY2Utc3Ryb2tlLWZseW91dCk7Ym9yZGVyLXJhZGl1czp2YXIoLS1mZHMtY29udHJvbC1jb3JuZXItcmFkaXVzKTtib3gtc2hhZG93OnZhcigtLWZkcy10b29sdGlwLXNoYWRvdyk7Ym94LXNpemluZzpib3JkZXItYm94O2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1mYW1pbHk6dmFyKC0tZmRzLWZvbnQtZmFtaWx5LXRleHQpO2ZvbnQtc2l6ZTp2YXIoLS1mZHMtYm9keS1mb250LXNpemUpO2ZvbnQtd2VpZ2h0OjQwMDtpbmxpbmUtc2l6ZTotd2Via2l0LW1heC1jb250ZW50O2lubGluZS1zaXplOi1tb3otbWF4LWNvbnRlbnQ7aW5saW5lLXNpemU6bWF4LWNvbnRlbnQ7anVzdGlmeS1jb250ZW50OmNlbnRlcjtsaW5lLWhlaWdodDoyMHB4O21heC1pbmxpbmUtc2l6ZTozMjBweDtwYWRkaW5nLWJsb2NrOjVweCA3cHg7cGFkZGluZy1pbmxpbmU6OHB4Oy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX08L3N0eWxlPlxuIiwgImltcG9ydCB7IGJ1YmJsZSwgbGlzdGVuIH0gZnJvbSBcInN2ZWx0ZS9pbnRlcm5hbFwiO1xyXG5pbXBvcnQgeyB0YWJiYWJsZSB9IGZyb20gXCJ0YWJiYWJsZVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVGb2N1c1RyYXAgfSBmcm9tIFwiZm9jdXMtdHJhcFwiO1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIENvbWJvQm94SXRlbSB9IGZyb20gXCIuL0NvbWJvQm94L0NvbWJvQm94SXRlbS5zdmVsdGVcIjtcclxuZXhwb3J0IHsgZGVmYXVsdCBhcyBGbHlvdXRTdXJmYWNlIH0gZnJvbSBcIi4vRmx5b3V0L0ZseW91dFN1cmZhY2Uuc3ZlbHRlXCI7XHJcbmV4cG9ydCB7IGRlZmF1bHQgYXMgVG9vbHRpcFN1cmZhY2UgfSBmcm9tIFwiLi9Ub29sdGlwL1Rvb2x0aXBTdXJmYWNlLnN2ZWx0ZVwiO1xyXG5leHBvcnQgeyBkZWZhdWx0IGFzIE1lbnVGbHlvdXRTdXJmYWNlIH0gZnJvbSBcIi4vTWVudUZseW91dC9NZW51Rmx5b3V0U3VyZmFjZS5zdmVsdGVcIjtcclxuZXhwb3J0IHsgZGVmYXVsdCBhcyBDYWxlbmRhclZpZXdJdGVtIH0gZnJvbSBcIi4vQ2FsZW5kYXJWaWV3L0NhbGVuZGFyVmlld0l0ZW0uc3ZlbHRlXCI7XHJcbmV4cG9ydCBmdW5jdGlvbiBleHRlcm5hbE1vdXNlRXZlbnRzKG5vZGUsIG9wdGlvbnMgPSB7IHR5cGU6IFwiY2xpY2tcIiwgc3RvcFByb3BhZ2F0aW9uOiBmYWxzZSB9KSB7XHJcbiAgICBjb25zdCB7IHR5cGUsIHN0b3BQcm9wYWdhdGlvbiB9ID0gb3B0aW9ucztcclxuICAgIGNvbnN0IGhhbmRsZUV2ZW50ID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbilcclxuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgaWYgKG5vZGUgJiYgIW5vZGUuY29udGFpbnMoZXZlbnQudGFyZ2V0KSAmJiAhZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkge1xyXG4gICAgICAgICAgICBub2RlLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KGBvdXRlciR7dHlwZX1gLCB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWw6IGV2ZW50XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCwgdHJ1ZSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGRlc3Ryb3koKSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlRXZlbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuLy8gQmFzaWMgd3JhcHBlciBhY3Rpb24gYXJvdW5kIGZvY3VzLXRyYXBcclxuZXhwb3J0IGZ1bmN0aW9uIGZvY3VzVHJhcChub2RlLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCB0cmFwID0gY3JlYXRlRm9jdXNUcmFwKG5vZGUsIChvcHRpb25zID0geyAuLi5vcHRpb25zLCBmYWxsYmFja0ZvY3VzOiBub2RlIH0pKTtcclxuICAgIHRyYXAuYWN0aXZhdGUoKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZGVzdHJveSgpIHtcclxuICAgICAgICAgICAgdHJhcC5kZWFjdGl2YXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufVxyXG4vLyBJRCBnZW5lcmF0b3IgZm9yIGhhbmRsaW5nIFdBSS1BUklBIHJlbGF0ZWQgYXR0cmlidXRlc1xyXG5leHBvcnQgZnVuY3Rpb24gdWlkKHByZWZpeCkge1xyXG4gICAgcmV0dXJuIChwcmVmaXggK1xyXG4gICAgICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMjYpICsgOTcpICtcclxuICAgICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KS5zbGljZSgyKSArXHJcbiAgICAgICAgRGF0ZS5ub3coKS50b1N0cmluZygxNikuc3BsaXQoXCIuXCIpWzBdKTtcclxufVxyXG4vLyBDb250cm9scyB0aGUgZm9jdXMgb2YgYSBsaXN0IG9mIGVsZW1lbnRzIGJ5IHVzaW5nIHRoZSBhcnJvdyBrZXlzXHJcbmV4cG9ydCBmdW5jdGlvbiBhcnJvd05hdmlnYXRpb24obm9kZSwgb3B0aW9ucyA9IHsgcHJldmVudFRhYjogZmFsc2UsIHN0b3BQcm9wYWdhdGlvbjogZmFsc2UgfSkge1xyXG4gICAgY29uc3QgaGFuZGxlS2V5RG93biA9IChldmVudCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHsga2V5IH0gPSBldmVudDtcclxuICAgICAgICBjb25zdCB7IGFjdGl2ZUVsZW1lbnQgfSA9IGRvY3VtZW50O1xyXG4gICAgICAgIGxldCB0YWJPcmRlciA9IHRhYmJhYmxlKG5vZGUpO1xyXG4gICAgICAgIC8vIGlmIChkaXJlY3RDaGlsZHJlbikgdGFiT3JkZXIgPSB0YWJPcmRlci5maWx0ZXIoY2hpbGQgPT4gY2hpbGQucGFyZW50RWxlbWVudCA9PT0gbm9kZSk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSB0YWJPcmRlci5pbmRleE9mKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xyXG4gICAgICAgIGlmICh0YWJPcmRlci5sZW5ndGggPCAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKGtleSA9PT0gXCJBcnJvd1VwXCIgfHxcclxuICAgICAgICAgICAga2V5ID09PSBcIkFycm93RG93blwiIHx8XHJcbiAgICAgICAgICAgIGtleSA9PT0gXCJIb21lXCIgfHxcclxuICAgICAgICAgICAga2V5ID09PSBcIkVuZFwiIHx8XHJcbiAgICAgICAgICAgIChrZXkgPT09IFwiVGFiXCIgJiYgb3B0aW9ucy5wcmV2ZW50VGFiKSkge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdG9wUHJvcGFnYXRpb24pXHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGtleSA9PT0gXCJBcnJvd1VwXCIpIHtcclxuICAgICAgICAgICAgaWYgKHRhYk9yZGVyWzBdID09PSBhY3RpdmVFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0YWJPcmRlclt0YWJPcmRlci5sZW5ndGggLSAxXS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhYk9yZGVyLmluY2x1ZGVzKGFjdGl2ZUVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICB0YWJPcmRlclthY3RpdmVJbmRleCAtIDFdLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIkFycm93RG93blwiKSB7XHJcbiAgICAgICAgICAgIGlmICh0YWJPcmRlclt0YWJPcmRlci5sZW5ndGggLSAxXSA9PT0gYWN0aXZlRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdGFiT3JkZXJbMF0uZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0YWJPcmRlci5pbmNsdWRlcyhhY3RpdmVFbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgdGFiT3JkZXJbYWN0aXZlSW5kZXggKyAxXS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJIb21lXCIpIHtcclxuICAgICAgICAgICAgdGFiT3JkZXJbMF0uZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIkVuZFwiKSB7XHJcbiAgICAgICAgICAgIHRhYk9yZGVyW3RhYk9yZGVyLmxlbmd0aCAtIDFdLmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bik7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGRlc3Ryb3k6ICgpID0+IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaGFuZGxlS2V5RG93bilcclxuICAgIH07XHJcbn1cclxuLy8gUmV0dXJucyBhIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGR1cmF0aW9uIG9mIGEgc3BlY2lmaWVkIENTUyBjdXN0b20gcHJvcGVydHkgaW4gbXNcclxuZXhwb3J0IGZ1bmN0aW9uIGdldENTU0R1cmF0aW9uKHByb3BlcnR5KSB7XHJcbiAgICBjb25zdCBkdXJhdGlvbiA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7XHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdChkdXJhdGlvbikgKiAoL1xcZHMkLy50ZXN0KGR1cmF0aW9uKSA/IDEwMDAgOiAxKSB8fCAwO1xyXG59XHJcbi8vIEZ1bmN0aW9uIGZvciBmb3J3YXJkaW5nIERPTSBldmVudHMgdG8gdGhlIGNvbXBvbmVudCdzIGRlY2xhcmF0aW9uXHJcbi8vIEFkYXB0ZWQgZnJvbSByZ29zc2lhdXgvc3ZlbHRlLWhlYWRsZXNzdWkgd2hpY2ggaXMgbW9kaWZpZWQgZnJvbSBocGVycmluL3N2ZWx0ZS1tYXRlcmlhbC11aVxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZlbnRGb3J3YXJkZXIoY29tcG9uZW50LCBleGNsdWRlID0gW10pIHtcclxuICAgIC8vIFRoaXMgaXMgb3VyIHBzZXVkbyAkb24gZnVuY3Rpb24uIEl0IGlzIGRlZmluZWQgb24gY29tcG9uZW50IG1vdW50LlxyXG4gICAgbGV0ICRvbjtcclxuICAgIC8vIFRoaXMgaXMgYSBsaXN0IG9mIGV2ZW50cyBib3VuZCBiZWZvcmUgbW91bnQuXHJcbiAgICBsZXQgZXZlbnRzID0gW107XHJcbiAgICAvLyBNb25rZXlwYXRjaCBTdmVsdGVDb21wb25lbnQuJG9uIHdpdGggb3VyIG93biBmb3J3YXJkLWNvbXBhdGlibGUgdmVyc2lvblxyXG4gICAgY29tcG9uZW50LiRvbiA9IChldmVudFR5cGUsIGNhbGxiYWNrKSA9PiB7XHJcbiAgICAgICAgbGV0IGRlc3RydWN0b3IgPSAoKSA9PiB7IH07XHJcbiAgICAgICAgaWYgKGV4Y2x1ZGUuaW5jbHVkZXMoZXZlbnRUeXBlKSkge1xyXG4gICAgICAgICAgICAvLyBCYWlsIG91dCBvZiB0aGUgZXZlbnQgZm9yd2FyZGluZyBhbmQgcnVuIHRoZSBub3JtYWwgU3ZlbHRlICRvbigpIGNvZGVcclxuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gY29tcG9uZW50LiQkLmNhbGxiYWNrc1tldmVudFR5cGVdIHx8IChjb21wb25lbnQuJCQuY2FsbGJhY2tzW2V2ZW50VHlwZV0gPSBbXSk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCRvbikge1xyXG4gICAgICAgICAgICBkZXN0cnVjdG9yID0gJG9uKGV2ZW50VHlwZSwgY2FsbGJhY2spOyAvLyBUaGUgZXZlbnQgd2FzIGJvdW5kIHByb2dyYW1tYXRpY2FsbHkuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBldmVudHMucHVzaChbZXZlbnRUeXBlLCBjYWxsYmFja10pOyAvLyBUaGUgZXZlbnQgd2FzIGJvdW5kIGJlZm9yZSBtb3VudCBieSBTdmVsdGUuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoKSA9PiBkZXN0cnVjdG9yKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChub2RlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZGVzdHJ1Y3RvcnMgPSBbXTtcclxuICAgICAgICBjb25zdCBmb3J3YXJkRGVzdHJ1Y3RvcnMgPSB7fTtcclxuICAgICAgICBjb25zdCBmb3J3YXJkID0gKGUpID0+IGJ1YmJsZShjb21wb25lbnQsIGUpO1xyXG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIGxpc3RlbmluZyBhbmQgZm9yd2FyZGluZ1xyXG4gICAgICAgIC8vIGFsbCBib3VuZCBldmVudHMuXHJcbiAgICAgICAgJG9uID0gKGV2ZW50VHlwZSwgY2FsbGJhY2spID0+IHtcclxuICAgICAgICAgICAgbGV0IGhhbmRsZXIgPSBjYWxsYmFjaztcclxuICAgICAgICAgICAgLy8gRE9NIGFkZEV2ZW50TGlzdGVuZXIgb3B0aW9ucyBhcmd1bWVudC5cclxuICAgICAgICAgICAgbGV0IG9wdGlvbnMgPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gTGlzdGVuIGZvciB0aGUgZXZlbnQgZGlyZWN0bHksIHdpdGggdGhlIGdpdmVuIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IGxpc3Rlbihub2RlLCBldmVudFR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBjb25zdCBkZXN0cnVjdG9yID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgb2ZmKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpZHggPSBkZXN0cnVjdG9ycy5pbmRleE9mKGRlc3RydWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkeCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJ1Y3RvcnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGRlc3RydWN0b3JzLnB1c2goZGVzdHJ1Y3Rvcik7XHJcbiAgICAgICAgICAgIC8vIEZvcndhcmQgdGhlIGV2ZW50IGZyb20gU3ZlbHRlLlxyXG4gICAgICAgICAgICBpZiAoIShldmVudFR5cGUgaW4gZm9yd2FyZERlc3RydWN0b3JzKSkge1xyXG4gICAgICAgICAgICAgICAgZm9yd2FyZERlc3RydWN0b3JzW2V2ZW50VHlwZV0gPSBsaXN0ZW4obm9kZSwgZXZlbnRUeXBlLCBmb3J3YXJkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZGVzdHJ1Y3RvcjtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIExpc3RlbiB0byBhbGwgdGhlIGV2ZW50cyBhZGRlZCBiZWZvcmUgbW91bnQuXHJcbiAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBldmVudHMpIHtcclxuICAgICAgICAgICAgJG9uKGV2ZW50WzBdLCBldmVudFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGRlc3Ryb3k6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZXZlbnQgbGlzdGVuZXJzLlxyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBkZXN0cnVjdG9yIG9mIGRlc3RydWN0b3JzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBldmVudCBmb3J3YXJkZXJzLlxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW50cnkgb2YgT2JqZWN0LmVudHJpZXMoZm9yd2FyZERlc3RydWN0b3JzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5WzFdKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG4iLCAiPHNjcmlwdCA+aW1wb3J0IHsgY3JlYXRlRXZlbnRGb3J3YXJkZXIsIFRvb2x0aXBTdXJmYWNlIH0gZnJvbSBcIi4uL2ludGVybmFsXCI7XHJcbmltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gXCJzdmVsdGVcIjtcclxuaW1wb3J0IHsgZ2V0X2N1cnJlbnRfY29tcG9uZW50IH0gZnJvbSBcInN2ZWx0ZS9pbnRlcm5hbFwiO1xyXG4vKiogVGhlIHNsaWRlcidzIGN1cnJlbnQgdmFsdWUuICovXHJcbmV4cG9ydCBsZXQgdmFsdWUgPSAwO1xyXG4vKiogVGhlIG1pbmltdW0gdmFsdWUgb2YgdGhlIHNsaWRlci4gKi9cclxuZXhwb3J0IGxldCBtaW4gPSAwO1xyXG4vKiogVGhlIG1heGltdW0gdmFsdWUgb2YgdGhlIHNsaWRlci4gKi9cclxuZXhwb3J0IGxldCBtYXggPSAxMDA7XHJcbi8qKiBEZXRlcm1pbmVzIGhvdyBtdWNoIHRoZSBzbGlkZXIncyB2YWx1ZSBzaG91bGQgaW5jcmVhc2UgcGVyIHN0ZXAuICovXHJcbmV4cG9ydCBsZXQgc3RlcCA9IDE7XHJcbi8qKiBEZXRlcm1pbmVzIHRoZSBwb3NpdGlvbiBvZiBzbGlkZXIgdGlja3MgYWxvbmcgdGhlIG1pbiBhbmQgbWF4IG9mIHRoZSB0cmFjay4gKi9cclxuZXhwb3J0IGxldCB0aWNrcyA9IFtdO1xyXG4vKiogRGV0ZXJtaW5lcyB0aGUgcGxhY2VtZW50IG9mIHNsaWRlciB0aWNrcyBhcm91bmQgdGhlIHRyYWNrLiAqL1xyXG5leHBvcnQgbGV0IHRpY2tQbGFjZW1lbnQgPSBcImFyb3VuZFwiO1xyXG4vKiogRGV0ZXJtaW5lcyBpZiB0aGUgc2xpZGVyJ3MgdmFsdWUgdG9vbHRpcCB3aWxsIGJlIHNob3duLiAqL1xyXG5leHBvcnQgbGV0IHRvb2x0aXAgPSB0cnVlO1xyXG4vKiogVGV4dCBwbGFjZWQgYmVmb3JlIHRoZSBzbGlkZXIncyB2YWx1ZSB0b29sdGlwLiAqL1xyXG5leHBvcnQgbGV0IHByZWZpeCA9IFwiXCI7XHJcbi8qKiBUZXh0IHBsYWNlZCBhZnRlciB0aGUgc2xpZGVyJ3MgdmFsdWUgdG9vbHRpcC4gKi9cclxuZXhwb3J0IGxldCBzdWZmaXggPSBcIlwiO1xyXG4vKiogRGV0ZXJtaW5lcyBpZiB0aGUgc2xpZGVyJ3MgZmlsbCB0cmFjayB3aWxsIGJlIHZpc2libGUgb3Igbm90LiAqL1xyXG5leHBvcnQgbGV0IHRyYWNrID0gdHJ1ZTtcclxuLyoqIERldGVybWluZXMgdGhlIHNsaWRlcidzIG9yaWVudGF0aW9uLiAqL1xyXG5leHBvcnQgbGV0IG9yaWVudGF0aW9uID0gXCJob3Jpem9udGFsXCI7XHJcbi8qKiBEZXRlcm1pbmVzIGlmIHRoZSBzbGlkZXIgdHJhY2sgd2lsbCBiZSBpbiByZXZlcnNlIGRpcmVjdGlvbi4gKi9cclxuZXhwb3J0IGxldCByZXZlcnNlID0gZmFsc2U7XHJcbi8qKiBDb250cm9scyB3aGV0aGVyIHRoZSBzbGlkZXIgaXMgZGlzYWJsZWQuICovXHJcbmV4cG9ydCBsZXQgZGlzYWJsZWQgPSBmYWxzZTtcclxuLyoqIFNwZWNpZmllcyBhIGN1c3RvbSBjbGFzcyBuYW1lIGZvciB0aGUgc2xpZGVyJ3MgY29udGFpbmVyIGVsZW1lbnQuICovXHJcbmxldCBjbGFzc05hbWUgPSBcIlwiO1xyXG5leHBvcnQgeyBjbGFzc05hbWUgYXMgY2xhc3MgfTtcclxuLyoqIE9idGFpbnMgYSBib3VuZCBET00gcmVmZXJlbmNlIHRvIHRoZSBzbGlkZXIncyBpbnB1dCBlbGVtZW50LiAqL1xyXG5leHBvcnQgbGV0IGlucHV0RWxlbWVudCA9IG51bGw7XHJcbi8qKiBPYnRhaW5zIGEgYm91bmQgRE9NIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyJ3Mgb3V0ZXIgY29udGFpbmVyIGVsZW1lbnQuICovXHJcbmV4cG9ydCBsZXQgY29udGFpbmVyRWxlbWVudCA9IG51bGw7XHJcbi8qKiBPYnRhaW5zIGEgYm91bmQgRE9NIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyJ3MgdGljayBjb250YWluZXIgZWxlbWVudC4gKi9cclxuZXhwb3J0IGxldCB0aWNrQmFyRWxlbWVudCA9IG51bGw7XHJcbi8qKiBPYnRhaW5zIGEgYm91bmQgRE9NIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyJ3MgdGh1bWIgZWxlbWVudC4gKi9cclxuZXhwb3J0IGxldCB0aHVtYkVsZW1lbnQgPSBudWxsO1xyXG4vKiogT2J0YWlucyBhIGJvdW5kIERPTSByZWZlcmVuY2UgdG8gdGhlIHNsaWRlcidzIG91dGVyIHJhaWwgZWxlbWVudC4gKi9cclxuZXhwb3J0IGxldCByYWlsRWxlbWVudCA9IG51bGw7XHJcbi8qKiBPYnRhaW5zIGEgYm91bmQgRE9NIHJlZmVyZW5jZSB0byB0aGUgc2xpZGVyJ3MgdHJhY2sgKGZpbGwpIGVsZW1lbnQuICovXHJcbmV4cG9ydCBsZXQgdHJhY2tFbGVtZW50ID0gbnVsbDtcclxubGV0IGRyYWdnaW5nID0gZmFsc2U7XHJcbmxldCBob2xkaW5nID0gZmFsc2U7XHJcbmxldCBkaXJlY3Rpb25Bd2FyZVJldmVyc2UgPSBmYWxzZTtcclxubGV0IHRodW1iQ2xpZW50V2lkdGggPSAyMDtcclxuJDogaWYgKGNvbnRhaW5lckVsZW1lbnQpIHtcclxuICAgIGRpcmVjdGlvbkF3YXJlUmV2ZXJzZSA9XHJcbiAgICAgICAgKHdpbmRvdyA9PT0gbnVsbCB8fCB3aW5kb3cgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGNvbnRhaW5lckVsZW1lbnQpLmRpcmVjdGlvbikgPT09IFwibHRyXCIgPyByZXZlcnNlIDogIXJldmVyc2U7XHJcbn1cclxuY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcclxuY29uc3QgZm9yd2FyZEV2ZW50cyA9IGNyZWF0ZUV2ZW50Rm9yd2FyZGVyKGdldF9jdXJyZW50X2NvbXBvbmVudCgpLCBbXHJcbiAgICBcImlucHV0XCIsXHJcbiAgICBcImNoYW5nZVwiLFxyXG4gICAgXCJiZWZvcmVpbnB1dFwiXHJcbl0pO1xyXG4vLyBEaXZpZGVzIHRoZSBjdXJyZW50IHZhbHVlIG1pbnVzIHRoZSBtaW5pbXVtIHZhbHVlXHJcbi8vIGJ5IHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIG1heCBhbmQgbWluIHZhbHVlcyxcclxuLy8gYW5kIG11bHRpcGxpZXMgYnkgMTAwIHRvIGdldCBhIHBlcmNlbnRhZ2UuXHJcbmNvbnN0IHZhbHVlVG9QZXJjZW50YWdlID0gdiA9PiAoKHYgLSBtaW4pIC8gKG1heCAtIG1pbikpICogMTAwO1xyXG5mdW5jdGlvbiBjYW5jZWxNb3ZlKCkge1xyXG4gICAgaG9sZGluZyA9IGZhbHNlO1xyXG4gICAgZHJhZ2dpbmcgPSBmYWxzZTtcclxufVxyXG5mdW5jdGlvbiBoYW5kbGVNb3ZlKCkge1xyXG4gICAgaWYgKGhvbGRpbmcpXHJcbiAgICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xyXG59XHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZVZhbHVlKGV2ZW50KSB7XHJcbiAgICBpZiAoZGlzYWJsZWQgfHwgIXJhaWxFbGVtZW50KVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGNvbnN0IHsgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0LCB3aWR0aCwgaGVpZ2h0IH0gPSByYWlsRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgIGNvbnN0IHBlcmNlbnRhZ2VYID0gZXZlbnQudG91Y2hlcyA/IGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCA6IGV2ZW50LmNsaWVudFg7XHJcbiAgICBjb25zdCBwZXJjZW50YWdlWSA9IGV2ZW50LnRvdWNoZXMgPyBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgOiBldmVudC5jbGllbnRZO1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSBvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCIgPyBwZXJjZW50YWdlWCA6IHBlcmNlbnRhZ2VZO1xyXG4gICAgY29uc3Qgc3RhcnRpbmdQb3MgPSBvcmllbnRhdGlvbiA9PT0gXCJob3Jpem9udGFsXCJcclxuICAgICAgICA/IGRpcmVjdGlvbkF3YXJlUmV2ZXJzZVxyXG4gICAgICAgICAgICA/IHJpZ2h0XHJcbiAgICAgICAgICAgIDogbGVmdFxyXG4gICAgICAgIDogZGlyZWN0aW9uQXdhcmVSZXZlcnNlXHJcbiAgICAgICAgICAgID8gdG9wXHJcbiAgICAgICAgICAgIDogYm90dG9tO1xyXG4gICAgY29uc3QgbGVuZ3RoID0gb3JpZW50YXRpb24gPT09IFwiaG9yaXpvbnRhbFwiID8gd2lkdGggOiBoZWlnaHQ7XHJcbiAgICBsZXQgbmV4dFN0ZXAgPSBtaW4gK1xyXG4gICAgICAgIE1hdGgucm91bmQoKChtYXggLSBtaW4pICpcclxuICAgICAgICAgICAgKChwb3NpdGlvbiAtIHN0YXJ0aW5nUG9zKSAvIGxlbmd0aCkgKlxyXG4gICAgICAgICAgICAoZGlyZWN0aW9uQXdhcmVSZXZlcnNlID8gLTEgOiAxKSAqXHJcbiAgICAgICAgICAgIChvcmllbnRhdGlvbiA9PT0gXCJ2ZXJ0aWNhbFwiID8gLTEgOiAxKSkgL1xyXG4gICAgICAgICAgICBzdGVwKSAqXHJcbiAgICAgICAgICAgIHN0ZXA7XHJcbiAgICBpZiAobmV4dFN0ZXAgPD0gbWluKVxyXG4gICAgICAgIG5leHRTdGVwID0gbWluO1xyXG4gICAgZWxzZSBpZiAobmV4dFN0ZXAgPj0gbWF4KVxyXG4gICAgICAgIG5leHRTdGVwID0gbWF4O1xyXG4gICAgdmFsdWUgPSBuZXh0U3RlcDtcclxufVxyXG5mdW5jdGlvbiBoYW5kbGVBcnJvd0tleXMoZXZlbnQpIHtcclxuICAgIGNvbnN0IHsga2V5IH0gPSBldmVudDtcclxuICAgIGlmIChrZXkgPT09IFwiQXJyb3dEb3duXCIgfHwga2V5ID09PSBcIkFycm93VXBcIilcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaWYgKGtleSA9PT0gXCJBcnJvd0xlZnRcIiB8fCAoa2V5ID09PSBcIkFycm93RG93blwiICYmICFkaXNhYmxlZCkpIHtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICBzdGVwVXAoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHN0ZXBEb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoa2V5ID09PSBcIkFycm93UmlnaHRcIiB8fCAoa2V5ID09PSBcIkFycm93VXBcIiAmJiAhZGlzYWJsZWQpKSB7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgc3RlcERvd24oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHN0ZXBVcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBoYW5kbGVUb3VjaFN0YXJ0KGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQuY2FuY2VsYWJsZSlcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgaG9sZGluZyA9IHRydWU7XHJcbn1cclxuZnVuY3Rpb24gbGluZWFyU2NhbGUoaW5wdXQsIG91dHB1dCkge1xyXG4gICAgcmV0dXJuICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgIGlmIChpbnB1dFswXSA9PT0gaW5wdXRbMV0gfHwgb3V0cHV0WzBdID09PSBvdXRwdXRbMV0pXHJcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRbMF07XHJcbiAgICAgICAgY29uc3QgcmF0aW8gPSAob3V0cHV0WzFdIC0gb3V0cHV0WzBdKSAvIChpbnB1dFsxXSAtIGlucHV0WzBdKTtcclxuICAgICAgICByZXR1cm4gb3V0cHV0WzBdICsgcmF0aW8gKiAodmFsdWUgLSBpbnB1dFswXSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzdGVwVXAoKSB7XHJcbiAgICB2YWx1ZSArPSBzdGVwO1xyXG4gICAgaWYgKHZhbHVlID4gbWF4KVxyXG4gICAgICAgIHZhbHVlID0gbWF4O1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzdGVwRG93bigpIHtcclxuICAgIHZhbHVlIC09IHN0ZXA7XHJcbiAgICBpZiAodmFsdWUgPCBtaW4pXHJcbiAgICAgICAgdmFsdWUgPSBtaW47XHJcbn1cclxuJDogZGlzcGF0Y2goXCJjaGFuZ2VcIiwgdmFsdWUpO1xyXG4kOiBwZXJjZW50YWdlID0gdmFsdWVUb1BlcmNlbnRhZ2UodmFsdWUpO1xyXG4kOiB7XHJcbiAgICBpZiAodmFsdWUgPD0gbWluKVxyXG4gICAgICAgIHZhbHVlID0gbWluO1xyXG4gICAgZWxzZSBpZiAodmFsdWUgPj0gbWF4KVxyXG4gICAgICAgIHZhbHVlID0gbWF4O1xyXG4gICAgaWYgKGRyYWdnaW5nKSB7XHJcbiAgICAgICAgY2FsY3VsYXRlVmFsdWUoZXZlbnQpO1xyXG4gICAgICAgIGRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuPC9zY3JpcHQ+XG5cbjxzdmVsdGU6d2luZG93XG5cdG9uOm1vdXNlbW92ZT17aGFuZGxlTW92ZX1cblx0b246dG91Y2htb3ZlPXtoYW5kbGVNb3ZlfVxuXHRvbjptb3VzZXVwPXtjYW5jZWxNb3ZlfVxuXHRvbjp0b3VjaGVuZD17Y2FuY2VsTW92ZX1cblx0b246dG91Y2hjYW5jZWw9e2NhbmNlbE1vdmV9XG4vPlxuXG48IS0tXG5AY29tcG9uZW50XG5BIHNsaWRlciBpcyBhIGNvbnRyb2wgdGhhdCBsZXRzIHRoZSB1c2VyIHNlbGVjdCBmcm9tIGEgcmFuZ2Ugb2YgdmFsdWVzIGJ5IG1vdmluZyBhIHRodW1iIGNvbnRyb2wgYWxvbmcgYSB0cmFjay4gW0RvY3NdKGh0dHBzOi8vZmx1ZW50LXN2ZWx0ZS52ZXJjZWwuYXBwL2RvY3MvY29tcG9uZW50cy9zbGlkZXIpXG4tIFVzYWdlOlxuICAgIGBgYHRzeFxuICAgIDxTbGlkZXIgYmluZDp2YWx1ZSBtaW49ey0xMDB9IG1heD17MTAwfSBzdGVwPXsxMH0gdGlja3M9e1stNTAsIDAsIDUwXX0gLz5cbiAgICBgYGBcbi0tPlxuPGRpdlxuXHR1c2U6Zm9yd2FyZEV2ZW50c1xuXHRvbjptb3VzZWRvd258cHJldmVudERlZmF1bHQ9eygpID0+IHtcblx0XHRob2xkaW5nID0gdHJ1ZTtcblx0XHRkcmFnZ2luZyA9IHRydWU7XG5cdH19XG5cdG9uOnRvdWNoc3RhcnQ9e2hhbmRsZVRvdWNoU3RhcnR9XG5cdG9uOmtleWRvd249e2hhbmRsZUFycm93S2V5c31cblx0dGFiaW5kZXg9e2Rpc2FibGVkID8gLTEgOiAwfVxuXHRzdHlsZT1cIi0tZmRzLXNsaWRlci1wZXJjZW50YWdlOiB7cGVyY2VudGFnZX0lOyAtLWZkcy1zbGlkZXItdGh1bWItb2Zmc2V0OiB7dGh1bWJDbGllbnRXaWR0aCAvXG5cdFx0MiAtXG5cdFx0bGluZWFyU2NhbGUoWzAsIDUwXSwgWzAsIHRodW1iQ2xpZW50V2lkdGggLyAyXSkocGVyY2VudGFnZSl9cHg7XCJcblx0Y2xhc3M9XCJzbGlkZXIgb3JpZW50YXRpb24te29yaWVudGF0aW9ufSB7Y2xhc3NOYW1lfVwiXG5cdGNsYXNzOmRpc2FibGVkXG5cdGNsYXNzOnJldmVyc2U9e2RpcmVjdGlvbkF3YXJlUmV2ZXJzZX1cblx0YmluZDp0aGlzPXtjb250YWluZXJFbGVtZW50fVxuXHR7Li4uJCRyZXN0UHJvcHN9XG4+XG5cdDxkaXZcblx0XHRjbGFzcz1cInNsaWRlci10aHVtYlwiXG5cdFx0cm9sZT1cInNsaWRlclwiXG5cdFx0YXJpYS12YWx1ZW1pbj17bWlufVxuXHRcdGFyaWEtdmFsdWVtYXg9e21heH1cblx0XHRhcmlhLXZhbHVlbm93PXt2YWx1ZX1cblx0XHRiaW5kOnRoaXM9e3RodW1iRWxlbWVudH1cblx0XHRiaW5kOmNsaWVudFdpZHRoPXt0aHVtYkNsaWVudFdpZHRofVxuXHQ+XG5cdFx0eyNpZiB0b29sdGlwICYmICFkaXNhYmxlZH1cblx0XHRcdDxUb29sdGlwU3VyZmFjZSBjbGFzcz1cInNsaWRlci10b29sdGlwXCI+XG5cdFx0XHRcdDxzbG90IG5hbWU9XCJ0b29sdGlwXCIge3ByZWZpeH0ge3N1ZmZpeH0ge3ZhbHVlfT5cblx0XHRcdFx0XHR7cHJlZml4fXt2YWx1ZX17c3VmZml4fVxuXHRcdFx0XHQ8L3Nsb3Q+XG5cdFx0XHQ8L1Rvb2x0aXBTdXJmYWNlPlxuXHRcdHsvaWZ9XG5cdDwvZGl2PlxuXG5cdDxkaXYgY2xhc3M9XCJzbGlkZXItcmFpbFwiIGJpbmQ6dGhpcz17cmFpbEVsZW1lbnR9PlxuXHRcdHsjaWYgdHJhY2t9XG5cdFx0XHQ8ZGl2IGNsYXNzPVwic2xpZGVyLXRyYWNrXCIgYmluZDp0aGlzPXt0cmFja0VsZW1lbnR9IC8+XG5cdFx0ey9pZn1cblx0PC9kaXY+XG5cblx0eyNpZiB0aWNrc31cblx0XHQ8ZGl2IGNsYXNzPVwic2xpZGVyLXRpY2stYmFyIHBsYWNlbWVudC17dGlja1BsYWNlbWVudH1cIiBiaW5kOnRoaXM9e3RpY2tCYXJFbGVtZW50fT5cblx0XHRcdHsjZWFjaCB0aWNrcyBhcyB0aWNrfVxuXHRcdFx0XHQ8ZGl2XG5cdFx0XHRcdFx0Y2xhc3M9XCJzbGlkZXItdGlja1wiXG5cdFx0XHRcdFx0c3R5bGU9XCItLWZkcy1zbGlkZXItdGljay1wZXJjZW50YWdlOiB7dmFsdWVUb1BlcmNlbnRhZ2UodGljayl9JVwiXG5cdFx0XHRcdC8+XG5cdFx0XHR7L2VhY2h9XG5cdFx0PC9kaXY+XG5cdHsvaWZ9XG5cblx0PGlucHV0IHR5cGU9XCJyYW5nZVwiIGhpZGRlbiB7bWlufSB7bWF4fSB7c3RlcH0ge2Rpc2FibGVkfSB7dmFsdWV9IGJpbmQ6dGhpcz17aW5wdXRFbGVtZW50fSAvPlxuPC9kaXY+XG5cbjxzdHlsZSA+LnNsaWRlcnthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyLXJhZGl1czp2YXIoLS1mZHMtY29udHJvbC1jb3JuZXItcmFkaXVzKTtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjttaW4tYmxvY2stc2l6ZTozMnB4O21pbi1pbmxpbmUtc2l6ZTozMnB4O3Bvc2l0aW9uOnJlbGF0aXZlfS5zbGlkZXI+Omdsb2JhbCgqKXtkaXJlY3Rpb246bHRyfS5zbGlkZXI6Zm9jdXMtdmlzaWJsZXtib3gtc2hhZG93OnZhcigtLWZkcy1mb2N1cy1zdHJva2UpO291dGxpbmU6bm9uZX0uc2xpZGVyLXRodW1iOmFjdGl2ZSA6Z2xvYmFsKC5zbGlkZXItdG9vbHRpcCksLnNsaWRlcjphY3RpdmUgOmdsb2JhbCguc2xpZGVyLXRvb2x0aXApLC5zbGlkZXI6Zm9jdXMtdmlzaWJsZSA6Z2xvYmFsKC5zbGlkZXItdG9vbHRpcCl7b3BhY2l0eToxfS5zbGlkZXIub3JpZW50YXRpb24taG9yaXpvbnRhbHtibG9jay1zaXplOjMycHg7aW5saW5lLXNpemU6MTAwJX0uc2xpZGVyLm9yaWVudGF0aW9uLWhvcml6b250YWwgLnNsaWRlci1yYWlse2Jsb2NrLXNpemU6NHB4O2lubGluZS1zaXplOjEwMCU7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsIC5zbGlkZXItdHJhY2t7YmxvY2stc2l6ZToxMDAlO2lubGluZS1zaXplOnZhcigtLWZkcy1zbGlkZXItcGVyY2VudGFnZSl9LnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsIC5zbGlkZXItdGh1bWJ7aW5zZXQtaW5saW5lLXN0YXJ0OmNhbGModmFyKC0tZmRzLXNsaWRlci1wZXJjZW50YWdlKSArIHZhcigtLWZkcy1zbGlkZXItdGh1bWItb2Zmc2V0KSk7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSl9LnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsIC5zbGlkZXItdGlja3tmbGV4LWRpcmVjdGlvbjpjb2x1bW47aGVpZ2h0OjEwMCU7aW5zZXQtaW5saW5lLXN0YXJ0OnZhcigtLWZkcy1zbGlkZXItdGljay1wZXJjZW50YWdlKTtwYWRkaW5nOjZweCAwfS5zbGlkZXIub3JpZW50YXRpb24taG9yaXpvbnRhbCAuc2xpZGVyLXRpY2s6YWZ0ZXIsLnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsIC5zbGlkZXItdGljazpiZWZvcmV7LXdlYmtpdC1ib3JkZXItc3RhcnQ6MXB4IHNvbGlkIHZhcigtLWZkcy1jb250cm9sLXN0cm9uZy1maWxsLWRlZmF1bHQpO2JvcmRlci1pbmxpbmUtc3RhcnQ6MXB4IHNvbGlkIHZhcigtLWZkcy1jb250cm9sLXN0cm9uZy1maWxsLWRlZmF1bHQpO2hlaWdodDo0cHg7d2lkdGg6MXB4fS5zbGlkZXIub3JpZW50YXRpb24taG9yaXpvbnRhbC5yZXZlcnNlIC5zbGlkZXItcmFpbHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9LnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsLnJldmVyc2UgLnNsaWRlci10aHVtYntpbnNldC1pbmxpbmUtZW5kOmNhbGModmFyKC0tZmRzLXNsaWRlci1wZXJjZW50YWdlKSArIHZhcigtLWZkcy1zbGlkZXItdGh1bWItb2Zmc2V0KSk7aW5zZXQtaW5saW5lLXN0YXJ0OnVuc2V0O3RyYW5zZm9ybTp0cmFuc2xhdGVYKDUwJSl9LnNsaWRlci5vcmllbnRhdGlvbi1ob3Jpem9udGFsLnJldmVyc2UgLnNsaWRlci10aWNre2luc2V0LWlubGluZS1lbmQ6dmFyKC0tZmRzLXNsaWRlci10aWNrLXBlcmNlbnRhZ2UpO2luc2V0LWlubGluZS1zdGFydDp1bnNldH0uc2xpZGVyLm9yaWVudGF0aW9uLXZlcnRpY2Fse2Jsb2NrLXNpemU6MTAwJTtpbmxpbmUtc2l6ZTozMnB4fS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwgLnNsaWRlci1yYWlse2FsaWduLWl0ZW1zOmZsZXgtZW5kO2Jsb2NrLXNpemU6MTAwJTtpbmxpbmUtc2l6ZTo0cHh9LnNsaWRlci5vcmllbnRhdGlvbi12ZXJ0aWNhbCAuc2xpZGVyLXRyYWNre2Jsb2NrLXNpemU6dmFyKC0tZmRzLXNsaWRlci1wZXJjZW50YWdlKTtpbmxpbmUtc2l6ZToxMDAlfS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwgLnNsaWRlci10aHVtYntpbnNldC1ibG9jay1lbmQ6Y2FsYyh2YXIoLS1mZHMtc2xpZGVyLXBlcmNlbnRhZ2UpICsgdmFyKC0tZmRzLXNsaWRlci10aHVtYi1vZmZzZXQpKTt0cmFuc2Zvcm06dHJhbnNsYXRlWSg1MCUpfS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwgLnNsaWRlci10aWNre2luc2V0LWJsb2NrLWVuZDp2YXIoLS1mZHMtc2xpZGVyLXRpY2stcGVyY2VudGFnZSk7cGFkZGluZzowIDZweDt3aWR0aDoxMDAlfS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwgLnNsaWRlci10aWNrOmFmdGVyLC5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwgLnNsaWRlci10aWNrOmJlZm9yZXstd2Via2l0LWJvcmRlci1iZWZvcmU6MXB4IHNvbGlkIHZhcigtLWZkcy1jb250cm9sLXN0cm9uZy1maWxsLWRlZmF1bHQpO2JvcmRlci1ibG9jay1zdGFydDoxcHggc29saWQgdmFyKC0tZmRzLWNvbnRyb2wtc3Ryb25nLWZpbGwtZGVmYXVsdCk7aGVpZ2h0OjFweDt3aWR0aDo0cHh9LnNsaWRlci5vcmllbnRhdGlvbi12ZXJ0aWNhbC5yZXZlcnNlIC5zbGlkZXItcmFpbHthbGlnbi1pdGVtczpmbGV4LXN0YXJ0fS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwucmV2ZXJzZSAuc2xpZGVyLXRodW1ie2luc2V0LWJsb2NrLWVuZDp1bnNldDtpbnNldC1ibG9jay1zdGFydDpjYWxjKHZhcigtLWZkcy1zbGlkZXItcGVyY2VudGFnZSkgKyB2YXIoLS1mZHMtc2xpZGVyLXRodW1iLW9mZnNldCkpO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC01MCUpfS5zbGlkZXIub3JpZW50YXRpb24tdmVydGljYWwucmV2ZXJzZSAuc2xpZGVyLXRpY2t7aW5zZXQtYmxvY2stZW5kOnVuc2V0O2luc2V0LWJsb2NrLXN0YXJ0OnZhcigtLWZkcy1zbGlkZXItdGljay1wZXJjZW50YWdlKX0uc2xpZGVyLmRpc2FibGVkIC5zbGlkZXItcmFpbCwuc2xpZGVyLmRpc2FibGVkIC5zbGlkZXItdGh1bWI6YmVmb3JlLC5zbGlkZXIuZGlzYWJsZWQgLnNsaWRlci10cmFja3tiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWZkcy1hY2NlbnQtZGlzYWJsZWQpfS5zbGlkZXIuZGlzYWJsZWQgLnNsaWRlci10aHVtYjpiZWZvcmV7dHJhbnNmb3JtOm5vbmV9LnNsaWRlci5kaXNhYmxlZCAuc2xpZGVyLXRpY2s6YWZ0ZXIsLnNsaWRlci5kaXNhYmxlZCAuc2xpZGVyLXRpY2s6YmVmb3Jle2JvcmRlci1jb2xvcjp2YXIoLS1mZHMtY29udHJvbC1maWxsLWRpc2FibGVkKX0uc2xpZGVyLXJhaWx7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6dmFyKC0tZmRzLWNvbnRyb2wtc3Ryb25nLWZpbGwtZGVmYXVsdCk7Ym9yZGVyLXJhZGl1czo1MHB4O2Rpc3BsYXk6ZmxleDtvdmVyZmxvdzpoaWRkZW59LnNsaWRlci10cmFja3tiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWZkcy1hY2NlbnQtZGVmYXVsdCl9LnNsaWRlci10aWNrLWJhcntoZWlnaHQ6MTAwJTtpbnNldC1ibG9jay1zdGFydDowO2luc2V0LWlubGluZS1zdGFydDowO3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOjEwMCU7ei1pbmRleDotMX0uc2xpZGVyLXRpY2stYmFyLnBsYWNlbWVudC1hZnRlciAuc2xpZGVyLXRpY2s6YmVmb3JlLC5zbGlkZXItdGljay1iYXIucGxhY2VtZW50LWJlZm9yZSAuc2xpZGVyLXRpY2s6YWZ0ZXJ7dmlzaWJpbGl0eTpoaWRkZW59LnNsaWRlci10aWNre2FsaWduLWl0ZW1zOmNlbnRlcjtib3gtc2l6aW5nOmJvcmRlci1ib3g7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO3Bvc2l0aW9uOmFic29sdXRlfS5zbGlkZXItdGljazphZnRlciwuc2xpZGVyLXRpY2s6YmVmb3Jle2NvbnRlbnQ6XCJcIn0uc2xpZGVyLXRodW1ie2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLWZkcy1jb250cm9sLXNvbGlkLWZpbGwtZGVmYXVsdCk7YmxvY2stc2l6ZToyMHB4O2JveC1zaGFkb3c6MCAwIDAgMXB4IHZhcigtLWZkcy1jb250cm9sLXN0cm9rZS1kZWZhdWx0KTtkaXNwbGF5OmZsZXg7aW5saW5lLXNpemU6MjBweDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3otaW5kZXg6MTB9LnNsaWRlci10aHVtYiwuc2xpZGVyLXRodW1iOmJlZm9yZXtib3JkZXItcmFkaXVzOjEwMCU7cG9zaXRpb246YWJzb2x1dGV9LnNsaWRlci10aHVtYjpiZWZvcmV7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS1mZHMtYWNjZW50LWRlZmF1bHQpO2Jsb2NrLXNpemU6MTJweDtjb250ZW50OlwiXCI7aW5saW5lLXNpemU6MTJweDt0cmFuc2l0aW9uOnZhcigtLWZkcy1jb250cm9sLWZhc3QtZHVyYXRpb24pIHZhcigtLWZkcy1jb250cm9sLWZhc3Qtb3V0LXNsb3ctaW4tZWFzaW5nKSB0cmFuc2Zvcm19LnNsaWRlci10aHVtYjpob3ZlcjpiZWZvcmV7dHJhbnNmb3JtOnNjYWxlKDEuMTY3KX0uc2xpZGVyLXRodW1iOmhvdmVyIDpnbG9iYWwoLnNsaWRlci10b29sdGlwKXtvcGFjaXR5OjE7dHJhbnNpdGlvbi1kZWxheToxc30uc2xpZGVyLXRodW1iOmFjdGl2ZTpiZWZvcmV7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS1mZHMtYWNjZW50LXRlcnRpYXJ5KTt0cmFuc2Zvcm06c2NhbGUoLjgzMyl9LnNsaWRlciA6Z2xvYmFsKC5zbGlkZXItdG9vbHRpcCl7aW5zZXQtYmxvY2stZW5kOmNhbGMoMTAwJSArIDE4cHgpO2luc2V0LWlubGluZS1zdGFydDo1MCU7bWF4LWlubGluZS1zaXplOnVuc2V0O29wYWNpdHk6MDtwb2ludGVyLWV2ZW50czpub25lO3Bvc2l0aW9uOmFic29sdXRlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpO3RyYW5zaXRpb246dmFyKC0tZmRzLWNvbnRyb2wtZmFzdC1kdXJhdGlvbikgbGluZWFyIG9wYWNpdHk7d2hpdGUtc3BhY2U6bm93cmFwO3otaW5kZXg6MTAwfTwvc3R5bGU+XG4iLCAiaW1wb3J0IHsgbm9vcCwgc2FmZV9ub3RfZXF1YWwsIHN1YnNjcmliZSwgcnVuX2FsbCwgaXNfZnVuY3Rpb24gfSBmcm9tICcuLi9pbnRlcm5hbC9pbmRleC5tanMnO1xuZXhwb3J0IHsgZ2V0X3N0b3JlX3ZhbHVlIGFzIGdldCB9IGZyb20gJy4uL2ludGVybmFsL2luZGV4Lm1qcyc7XG5cbmNvbnN0IHN1YnNjcmliZXJfcXVldWUgPSBbXTtcbi8qKlxuICogQ3JlYXRlcyBhIGBSZWFkYWJsZWAgc3RvcmUgdGhhdCBhbGxvd3MgcmVhZGluZyBieSBzdWJzY3JpcHRpb24uXG4gKiBAcGFyYW0gdmFsdWUgaW5pdGlhbCB2YWx1ZVxuICogQHBhcmFtIHtTdGFydFN0b3BOb3RpZmllcn1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHJlYWRhYmxlKHZhbHVlLCBzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1YnNjcmliZTogd3JpdGFibGUodmFsdWUsIHN0YXJ0KS5zdWJzY3JpYmVcbiAgICB9O1xufVxuLyoqXG4gKiBDcmVhdGUgYSBgV3JpdGFibGVgIHN0b3JlIHRoYXQgYWxsb3dzIGJvdGggdXBkYXRpbmcgYW5kIHJlYWRpbmcgYnkgc3Vic2NyaXB0aW9uLlxuICogQHBhcmFtIHsqPX12YWx1ZSBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0YXJ0U3RvcE5vdGlmaWVyPX1zdGFydCBzdGFydCBhbmQgc3RvcCBub3RpZmljYXRpb25zIGZvciBzdWJzY3JpcHRpb25zXG4gKi9cbmZ1bmN0aW9uIHdyaXRhYmxlKHZhbHVlLCBzdGFydCA9IG5vb3ApIHtcbiAgICBsZXQgc3RvcDtcbiAgICBjb25zdCBzdWJzY3JpYmVycyA9IG5ldyBTZXQoKTtcbiAgICBmdW5jdGlvbiBzZXQobmV3X3ZhbHVlKSB7XG4gICAgICAgIGlmIChzYWZlX25vdF9lcXVhbCh2YWx1ZSwgbmV3X3ZhbHVlKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBuZXdfdmFsdWU7XG4gICAgICAgICAgICBpZiAoc3RvcCkgeyAvLyBzdG9yZSBpcyByZWFkeVxuICAgICAgICAgICAgICAgIGNvbnN0IHJ1bl9xdWV1ZSA9ICFzdWJzY3JpYmVyX3F1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmliZXIgb2Ygc3Vic2NyaWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlclsxXSgpO1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyX3F1ZXVlLnB1c2goc3Vic2NyaWJlciwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocnVuX3F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZVtpXVswXShzdWJzY3JpYmVyX3F1ZXVlW2kgKyAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcl9xdWV1ZS5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiB1cGRhdGUoZm4pIHtcbiAgICAgICAgc2V0KGZuKHZhbHVlKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShydW4sIGludmFsaWRhdGUgPSBub29wKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmliZXIgPSBbcnVuLCBpbnZhbGlkYXRlXTtcbiAgICAgICAgc3Vic2NyaWJlcnMuYWRkKHN1YnNjcmliZXIpO1xuICAgICAgICBpZiAoc3Vic2NyaWJlcnMuc2l6ZSA9PT0gMSkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0KHNldCkgfHwgbm9vcDtcbiAgICAgICAgfVxuICAgICAgICBydW4odmFsdWUpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlcnMuZGVsZXRlKHN1YnNjcmliZXIpO1xuICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgICAgICAgc3RvcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNldCwgdXBkYXRlLCBzdWJzY3JpYmUgfTtcbn1cbmZ1bmN0aW9uIGRlcml2ZWQoc3RvcmVzLCBmbiwgaW5pdGlhbF92YWx1ZSkge1xuICAgIGNvbnN0IHNpbmdsZSA9ICFBcnJheS5pc0FycmF5KHN0b3Jlcyk7XG4gICAgY29uc3Qgc3RvcmVzX2FycmF5ID0gc2luZ2xlXG4gICAgICAgID8gW3N0b3Jlc11cbiAgICAgICAgOiBzdG9yZXM7XG4gICAgY29uc3QgYXV0byA9IGZuLmxlbmd0aCA8IDI7XG4gICAgcmV0dXJuIHJlYWRhYmxlKGluaXRpYWxfdmFsdWUsIChzZXQpID0+IHtcbiAgICAgICAgbGV0IGluaXRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgICAgbGV0IHBlbmRpbmcgPSAwO1xuICAgICAgICBsZXQgY2xlYW51cCA9IG5vb3A7XG4gICAgICAgIGNvbnN0IHN5bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAocGVuZGluZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKHNpbmdsZSA/IHZhbHVlc1swXSA6IHZhbHVlcywgc2V0KTtcbiAgICAgICAgICAgIGlmIChhdXRvKSB7XG4gICAgICAgICAgICAgICAgc2V0KHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbGVhbnVwID0gaXNfZnVuY3Rpb24ocmVzdWx0KSA/IHJlc3VsdCA6IG5vb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVuc3Vic2NyaWJlcnMgPSBzdG9yZXNfYXJyYXkubWFwKChzdG9yZSwgaSkgPT4gc3Vic2NyaWJlKHN0b3JlLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHZhbHVlc1tpXSA9IHZhbHVlO1xuICAgICAgICAgICAgcGVuZGluZyAmPSB+KDEgPDwgaSk7XG4gICAgICAgICAgICBpZiAoaW5pdGVkKSB7XG4gICAgICAgICAgICAgICAgc3luYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICBwZW5kaW5nIHw9ICgxIDw8IGkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGluaXRlZCA9IHRydWU7XG4gICAgICAgIHN5bmMoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBydW5fYWxsKHVuc3Vic2NyaWJlcnMpO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICB9O1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBkZXJpdmVkLCByZWFkYWJsZSwgd3JpdGFibGUgfTtcbiIsICJpbXBvcnQgeyB3cml0YWJsZSB9IGZyb20gXCJzdmVsdGUvc3RvcmVcIjtcclxuZXhwb3J0IGNvbnN0IGN1cnJlbnRNZW51ID0gd3JpdGFibGUobnVsbCk7XHJcbiIsICI8c2NyaXB0PlxuXHRpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIsIG9uTW91bnQgfSBmcm9tICdzdmVsdGUnO1xuXHRpbXBvcnQgS25vYiBmcm9tICdzdmVsdGUta25vYidcblx0aW1wb3J0IHsgU2xpZGVyIH0gZnJvbSBcImZsdWVudC1zdmVsdGVcIjtcblx0ZXhwb3J0IGxldCBpbnB1dHM7XG5cblx0bGV0IHNoYXBlID0gWydzaW5lJywgJ3RyaWFuZ2xlJywnc2F3JywgJ3NxdWFyZScsICdpbXB1bHNlJ107XG5cblx0Y29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblxuXHQkOiBzZXR1cElucHV0cyAoaW5wdXRzKVxuXHQkOiBkaXNwYXRjaCgnc2VuZFZhbHVlJywgeyBlbmRwb2ludCA6ICdvc2MxRnJlcUluJywgdmFsIDogb3NjMUZyZXFJbiB9KTtcblx0JDogZGlzcGF0Y2goJ3NlbmRWYWx1ZScsIHsgZW5kcG9pbnQgOiAnb3NjMkZyZXFJbicsIHZhbCA6IG9zYzJGcmVxSW4gfSk7XG5cdCQ6IGNvbnNvbGUubG9nKG9zYzJGcmVxSW4sIG9zYzFGcmVxSW4pO1xuXHQkOiBkaXNwYXRjaCgnc2VuZFZhbHVlJywgeyBlbmRwb2ludCA6ICdib29sSW4nLCB2YWwgOiBnYXRlT24gfSlcblxuXHRsZXQgb3NjMUZyZXFJbjtcblx0bGV0IG9zYzJGcmVxSW47XG5cdGxldCBvc2MxID0ge307XG5cdGxldCBvc2MyID0ge307XG5cdGxldCBnYXRlT24gPSBmYWxzZTtcblxuXHRjb25zdCBzZXR1cElucHV0cyA9IChpbnB1dHMpID0+IHtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShpbnB1dHMpKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGNvbnNvbGUubG9nKGlucHV0cylcblx0XHRvc2MxLmZyZXEgPSBpbnB1dHMuZmluZChpID0+IGkuZW5kcG9pbnRJRCA9PT0gJ29zYzFGcmVxSW4nKTtcblx0XHRvc2MxRnJlcUluID0gb3NjMS5mcmVxLmFubm90YXRpb24uaW5pdDtcblx0XHRvc2MyLmZyZXEgPSBpbnB1dHMuZmluZChpID0+IGkuZW5kcG9pbnRJRCA9PT0gJ29zYzJGcmVxSW4nKTtcblx0XHRvc2MyRnJlcUluID0gb3NjMi5mcmVxLmFubm90YXRpb24uaW5pdDtcblx0fVxuXG48L3NjcmlwdD5cblxuPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuXHQ8ZGl2IGNsYXNzPVwibW9kTWF0cml4XCI+XG5cdFx0PGRpdiBjbGFzcz1cImVudjFcIj5kPC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cImVudjJcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiX21hdGhcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiX3NoYXBlXCI+PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cIl9pbnZlcnRcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiX2NsaXBcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwibndcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwicGJcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiYXRcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwibWF0aFwiPjwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzaGFwZVwiPjwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJpbnZlcnRcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiY2xpcFwiPjwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJsZm8xXCI+PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cImxmbzJcIj48L2Rpdj5cblx0XHRcdDxkaXY+XG5cdFx0XHRcdFxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHRcblx0XHRcdDwvZGl2PlxuXHRcdFx0PGRpdiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO21hcmdpbjphdXRvO2NvbG9yOnJlZDtmb250LXNpemU6MjRweDtcIj5cblx0XHRcdFx0WFxuXHRcdFx0PC9kaXY+XG5cdFx0XHRcblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJhZHNyMVwiPlxuXHRcdFx0RU5WMVxuXHRcdFx0PGRpdiBjbGFzcz1cImZsZXhsaW5lXCIgc3R5bGU9XCJoZWlnaHQ6MTUwcHg7XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4Ym94XCI+PFNsaWRlciBvcmllbnRhdGlvbj1cInZlcnRpY2FsXCIgdmFsdWU9ezI0fSAvPkE8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj48U2xpZGVyIG9yaWVudGF0aW9uPVwidmVydGljYWxcIiB2YWx1ZT17NTB9IC8+RDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPjxTbGlkZXIgb3JpZW50YXRpb249XCJ2ZXJ0aWNhbFwiIHZhbHVlPXs3Nn0gLz5TPC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4Ym94XCI+PFNsaWRlciBvcmllbnRhdGlvbj1cInZlcnRpY2FsXCIgdmFsdWU9ezI0fSAvPlI8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj5cblx0XHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XCJwdFwiIHN0YXRlPVwiYWN0aXZlXCI+c25hcDwvYnV0dG9uPlxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cInB0XCIgc3RhdGU9XCJhY3RpdmVcIj5zbG93PC9idXR0b24+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJhZHNyMlwiPlxuXHRcdFx0RU5WMlxuXHRcdFx0PGRpdiBjbGFzcz1cImZsZXhsaW5lXCIgc3R5bGU9XCJoZWlnaHQ6MTUwcHg7XCI+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4Ym94XCI+PFNsaWRlciBvcmllbnRhdGlvbj1cInZlcnRpY2FsXCIgdmFsdWU9ezI0fSAvPkE8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj48U2xpZGVyIG9yaWVudGF0aW9uPVwidmVydGljYWxcIiB2YWx1ZT17NTB9IC8+RDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPjxTbGlkZXIgb3JpZW50YXRpb249XCJ2ZXJ0aWNhbFwiIHZhbHVlPXs3Nn0gLz5TPC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4Ym94XCI+PFNsaWRlciBvcmllbnRhdGlvbj1cInZlcnRpY2FsXCIgdmFsdWU9ezI0fSAvPlI8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj5cblx0XHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XCJwdFwiIHN0YXRlPVwiYWN0aXZlXCI+c25hcDwvYnV0dG9uPlxuXHRcdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cInB0XCIgc3RhdGU9XCJhY3RpdmVcIj5zbG93PC9idXR0b24+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+XG5cdFx0XG5cdDxkaXYgY2xhc3M9XCJvc2MxXCI+XG5cdFx0XHRPU0MxXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGxpbmVcIj5cblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj5cblx0XHRcdFx0XHQ8S25vYiBcblx0XHRcdFx0XHRcdGJpbmQ6dmFsdWU9e29zYzFGcmVxSW59IFxuXHRcdFx0XHRcdFx0bWluPXtvc2MxPy5mcmVxPy5hbm5vdGF0aW9uPy5taW59IFxuXHRcdFx0XHRcdFx0bWF4PXtvc2MxPy5mcmVxPy5hbm5vdGF0aW9uPy5tYXh9XG5cdFx0XHRcdFx0XHRzdGVwPXsxMH0gc3Ryb2tlV2lkdGg9ezEwfSBwcmltYXJ5Q29sb3I9XCIjRTg0NEMzXCIgLz5cblx0XHRcdFx0XHQ8ZGl2PlR1bmluZzwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4Ym94XCI+XG5cdFx0XHRcdFx0PEtub2IgdmFsdWU9ezB9IG1pbj17MH0gbWF4PXs0fSBzdGVwPXsxfSBzdHJva2VXaWR0aD17MTB9IHByaW1hcnlDb2xvcj1cIiNFODQ0QzNcIlxuXHRcdFx0XHRcdFx0XHRcdHZhbHVlRGlzcGxheUZ1bmN0aW9uPXt2PT5zaGFwZVt2XX0+PC9Lbm9iPlxuXHRcdFx0XHRcdDxkaXY+U2hhcGU8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPlxuXHRcdFx0XHRcdDxLbm9iIHZhbHVlPXsxMn0gbWluPXstNjB9IG1heD17NjB9IHN0ZXA9ezF9IHN0cm9rZVdpZHRoPXsxMH0gcHJpbWFyeUNvbG9yPVwiI0U4NDRDM1wiIC8+XG5cdFx0XHRcdFx0PGRpdj5Wb2x1bWU8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cIm9zYzJcIj5cblx0XHRcdE9TQzJcblx0XHRcdDxkaXYgY2xhc3M9XCJmbGV4bGluZVwiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPlxuXHRcdFx0XHRcdDxLbm9iIFxuXHRcdFx0XHRcdFx0YmluZDp2YWx1ZT17b3NjMkZyZXFJbn0gXG5cdFx0XHRcdFx0XHRtaW49e29zYzI/LmZyZXE/LmFubm90YXRpb24/Lm1pbn0gXG5cdFx0XHRcdFx0XHRtYXg9e29zYzI/LmZyZXE/LmFubm90YXRpb24/Lm1heH1cblx0XHRcdFx0XHRcdHN0ZXA9ezEwfSBzdHJva2VXaWR0aD17MTB9IHByaW1hcnlDb2xvcj1cIiNFODQ0QzNcIiAvPlxuXHRcdFx0XHRcdDxkaXY+VHVuaW5nPC9kaXY+XG5cdFx0XHRcdFx0PGJ1dHRvbiBzdGF0ZT1cImFjdGl2ZVwiPnN5bmM8L2J1dHRvbj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPlxuXHRcdFx0XHRcdDxLbm9iIHZhbHVlPXswfSBtaW49ezB9IG1heD17NH0gc3RlcD17MX0gc3Ryb2tlV2lkdGg9ezEwfSBwcmltYXJ5Q29sb3I9XCIjRTg0NEMzXCJcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZURpc3BsYXlGdW5jdGlvbj17dj0+c2hhcGVbdl19PjwvS25vYj5cblx0XHRcdFx0XHQ8ZGl2PlNoYXBlPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcblx0XHRcdFx0PGRpdiBjbGFzcz1cImZsZXhib3hcIj5cblx0XHRcdFx0XHQ8S25vYiB2YWx1ZT17MTJ9IG1pbj17LTYwfSBtYXg9ezYwfSBzdGVwPXsxfSBzdHJva2VXaWR0aD17MTB9IHByaW1hcnlDb2xvcj1cIiNFODQ0QzNcIiAvPlxuXHRcdFx0XHRcdDxkaXY+Vm9sdW1lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0XG5cdFx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJsZm9zXCI+XG5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdWJcIj5cblx0XHRcdFNVQlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGxpbmVcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPlx0XHRcdFx0XHRcblx0XHRcdFx0XHQ8S25vYiB2YWx1ZT17MTJ9IG1pbj17LTYwfSBtYXg9ezYwfSBzdGVwPXsxfSBzdHJva2VXaWR0aD17MTB9IHByaW1hcnlDb2xvcj1cIiNFODQ0QzNcIiAvPlxuXHRcdFx0XHRcdDxkaXY+Vm9sdW1lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiZmxleGJveFwiPlxuXHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVwicHRcIj44dmI8L2J1dHRvbj5cblx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cInB0XCI+c3F1YXJlPC9idXR0b24+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJub2lzZVwiPlxuXG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwicmV2ZXJiXCI+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwiZGVsYXlcIj48L2Rpdj5cblx0PGRpdiBjbGFzcz1cInZvaWNpbmdcIj48L2Rpdj5cblx0PGRpdiBjbGFzcz1cInZjZlwiPjwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwiaHBmXCI+PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJmaW5lXCI+PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJicmFuZGluZ1wiPlxuXHRcdDxidXR0b24gY2xhc3M6cmVkPXtnYXRlT259IG9uOmNsaWNrPXsgZSA9PiBnYXRlT24gPSAhZ2F0ZU9uIH0+R0FURTwvYnV0dG9uPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInJlc2VydmVkMVwiPjwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwicmVzZXJ2ZWQyXCI+PC9kaXY+XG48L2Rpdj5cblxuPHN0eWxlPlxuXG5cdEBpbXBvcnQgdXJsKFwiaHR0cHM6Ly91bnBrZy5jb20vZmx1ZW50LXN2ZWx0ZS90aGVtZS5jc3NcIik7XG5cdFxuXHQ6Z2xvYmFsKDpyb290KSB7XG5cdFx0LS1mZHMtY29udHJvbC1zdHJvbmctZmlsbC1kZWZhdWx0IDogZ3JheTtcblx0fVxuXG5cdC5icmFuZGluZyA+IGJ1dHRvbi5yZWQge1xuXHRcdGJhY2tncm91bmQtY29sb3I6dG9tYXRvO1xuXHR9XG5cblx0LmJyYW5kaW5nID4gYnV0dG9uIHtcblx0XHRmb250LXNpemU6MTAwcHg7XG5cdFx0YmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG5cdFx0cGFkZGluZzoxMnB4O1xuXHR9XG5cdC5icmFuZGluZyB7XG5cdFx0ZGlzcGxheTpmbGV4O1xuXHRcdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRcdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdH1cblx0XG5cdC5mbGV4bGluZSB7XG5cdFx0ZGlzcGxheTpmbGV4O1xuXHRcdGp1c3RpZnktY29udGVudDogc3BhY2UtZXZlbmx5O1xuXHR9XG5cdC5mbGV4Ym94IHtcblx0XHRkaXNwbGF5OmZsZXg7XG5cdFx0ZmxleC1kaXJlY3Rpb246Y29sdW1uO1xuXHRcdGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcblx0XHR3aWR0aDptaW4tY29udGVudDtcblx0XHR0ZXh0LWFsaWduOmNlbnRlcjtcblx0fVxuXHQuZmxleGJveCA+ICoge1xuXHRcdHdpZHRoOmF1dG87XG5cdFx0bWFyZ2luOjVweCBhdXRvO1xuXHR9XG5cbiAgLmNvbnRhaW5lciA+ICoge1xuICAgIGJvcmRlcjogMXB4IHNvbGlkIGdyYXk7XG4gIH1cblxuICAuY29udGFpbmVyIHsgIGRpc3BsYXk6IGdyaWQ7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAyMDBweCAyMDBweCAyMDBweCAyMDBweCAyMDBweCAyMDBweDtcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IDIwMHB4IDIwMHB4IDE1MHB4IDE1MHB4IDE1MHB4O1xuICAgIGdhcDogMHB4IDBweDtcbiAgICBncmlkLWF1dG8tZmxvdzogcm93O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFsaWduLWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWl0ZW1zOiBzdHJldGNoO1xuICAgIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xuICAgIGdyaWQtdGVtcGxhdGUtYXJlYXM6XG4gICAgICBcIm9zYzEgb3NjMSBicmFuZGluZyBicmFuZGluZyBhZHNyMSBhZHNyMVwiXG4gICAgICBcIm9zYzIgb3NjMiB2Y2YgdmNmIGFkc3IyIGFkc3IyXCJcbiAgICAgIFwic3ViIG5vaXNlIGhwZiBmaW5lIGxmb3Mgdm9pY2luZ1wiXG4gICAgICBcInJlc2VydmVkMSBtb2RNYXRyaXggbW9kTWF0cml4IG1vZE1hdHJpeCBtb2RNYXRyaXggcmV2ZXJiXCJcbiAgICAgIFwicmVzZXJ2ZWQyIG1vZE1hdHJpeCBtb2RNYXRyaXggbW9kTWF0cml4IG1vZE1hdHJpeCBkZWxheVwiO1xuICB9XG5cbiAgLm1vZE1hdHJpeCB7ICBkaXNwbGF5OiBncmlkO1xuICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogMWZyIDFmciAxZnIgMWZyIDFmciAxZnIgMWZyIDFmciAxZnIgMWZyIDFmciAxZnI7XG4gICAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiAxZnIgMWZyIDFmciAxZnIgMWZyO1xuICAgIGdhcDogMHB4IDBweDtcbiAgICBncmlkLWF1dG8tZmxvdzogcm93O1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGp1c3RpZnktaXRlbXM6IHN0cmV0Y2g7XG4gICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgZ3JpZC10ZW1wbGF0ZS1hcmVhczpcbiAgICAgIFwiLiBsZm8xIGxmbzIgZW52MSBlbnYyIG53IHBiIGF0IG1hdGggc2hhcGUgaW52ZXJ0IGNsaXBcIlxuICAgICAgXCJfbWF0aCAuIC4gLiAuIC4gLiAuIC4gLiAuIC5cIlxuICAgICAgXCJfc2hhcGUgLiAuIC4gLiAuIC4gLiAuIC4gLiAuXCJcbiAgICAgIFwiX2ludmVydCAuIC4gLiAuIC4gLiAuIC4gLiAuIC5cIlxuICAgICAgXCJfY2xpcCAuIC4gLiAuIC4gLiAuIC4gLiAuIC5cIjtcbiAgICBncmlkLWFyZWE6IG1vZE1hdHJpeDtcbiAgfVxuXG5cdC5tb2RNYXRyaXggPiAqIHtcblx0XHRib3JkZXI6IDFweCBkYXNoZWQgZ3JheTtcblx0fVxuXG4gIC5lbnYxIHsgZ3JpZC1hcmVhOiBlbnYxOyB9XG5cbiAgLmVudjIgeyBncmlkLWFyZWE6IGVudjI7IH1cblxuICAuX21hdGggeyBncmlkLWFyZWE6IF9tYXRoOyB9XG5cbiAgLl9zaGFwZSB7IGdyaWQtYXJlYTogX3NoYXBlOyB9XG5cbiAgLl9pbnZlcnQgeyBncmlkLWFyZWE6IF9pbnZlcnQ7IH1cblxuICAuX2NsaXAgeyBncmlkLWFyZWE6IF9jbGlwOyB9XG5cbiAgLm53IHsgZ3JpZC1hcmVhOiBudzsgfVxuXG4gIC5wYiB7IGdyaWQtYXJlYTogcGI7IH1cblxuICAuYXQgeyBncmlkLWFyZWE6IGF0OyB9XG5cbiAgLm1hdGggeyBncmlkLWFyZWE6IG1hdGg7IH1cblxuICAuc2hhcGUgeyBncmlkLWFyZWE6IHNoYXBlOyB9XG5cbiAgLmludmVydCB7IGdyaWQtYXJlYTogaW52ZXJ0OyB9XG5cbiAgLmNsaXAgeyBncmlkLWFyZWE6IGNsaXA7IH1cblxuICAubGZvMSB7IGdyaWQtYXJlYTogbGZvMTsgfVxuXG4gIC5sZm8yIHsgZ3JpZC1hcmVhOiBsZm8yOyB9XG5cbiAgLmFkc3IxIHsgZ3JpZC1hcmVhOiBhZHNyMTsgfVxuXG4gIC5hZHNyMiB7IGdyaWQtYXJlYTogYWRzcjI7IH1cblxuICAub3NjMSB7IGdyaWQtYXJlYTogb3NjMTsgfVxuXG4gIC5vc2MyIHsgZ3JpZC1hcmVhOiBvc2MyOyB9XG5cbiAgLmxmb3MgeyBncmlkLWFyZWE6IGxmb3M7IH1cblxuICAuc3ViIHsgZ3JpZC1hcmVhOiBzdWI7IH1cblxuICAubm9pc2UgeyBncmlkLWFyZWE6IG5vaXNlOyB9XG5cbiAgLnJldmVyYiB7IGdyaWQtYXJlYTogcmV2ZXJiOyB9XG5cbiAgLmRlbGF5IHsgZ3JpZC1hcmVhOiBkZWxheTsgfVxuXG4gIC52b2ljaW5nIHsgZ3JpZC1hcmVhOiB2b2ljaW5nOyB9XG5cbiAgLnZjZiB7IGdyaWQtYXJlYTogdmNmOyB9XG5cbiAgLmhwZiB7IGdyaWQtYXJlYTogaHBmOyB9XG5cbiAgLmZpbmUgeyBncmlkLWFyZWE6IGZpbmU7IH1cblxuICAuYnJhbmRpbmcgeyBncmlkLWFyZWE6IGJyYW5kaW5nOyB9XG5cbiAgLnJlc2VydmVkMSB7IGdyaWQtYXJlYTogcmVzZXJ2ZWQxOyB9XG5cbiAgLnJlc2VydmVkMiB7IGdyaWQtYXJlYTogcmVzZXJ2ZWQyOyB9XG5cblx0YnV0dG9uIHtcblx0XHRmb250LXNpemU6MTJweDtcblx0XHRwYWRkaW5nOjRweDtcblx0fVxuXHRidXR0b246Zm9jdXMge1xuXHRcdGJhY2tncm91bmQ6dG9tYXRvO1xuXHRcdGNvbG9yOndoaXRlO1xuXHR9XG5cdGJ1dHRvbi5wdCB7XG5cdFx0aGVpZ2h0OjI0cHg7XG5cdH1cblxuPC9zdHlsZT4iLCAiPHNjcmlwdD5cbiAgaW1wb3J0IFN5bnRoIGZyb20gXCIuL3N5bnRoLnN2ZWx0ZVwiO1xuICBpbXBvcnQgeyBvbk1vdW50IH0gZnJvbSBcInN2ZWx0ZVwiO1xuICBcbiAgbGV0IGlucHV0QmluZGluZztcbiAgZXhwb3J0IGxldCBwYXRjaDtcbiAgY29uc3QgZnJhbWVzID0gMTY7XG4gIGxldCBpID0gJ18nO1xuICBsZXQgdmggPSA1MDA7XG4gIGxldCB2dyA9IDUwMDtcbiAgbGV0IGlucHV0cztcblxuICBvbk1vdW50KGFzeW5jKCk9PntcblxuICAgIHBhdGNoLm9uUGF0Y2hTdGF0dXNDaGFuZ2VkID0gKGJ1aWxkRXJyb3IsIG1hbmlmZXN0LCBpbnB1dEVuZHBvaW50cywgb3V0cHV0RW5kcG9pbnRzKT0+IHtcbiAgICAgIGNvbnN0IHsgdmlldyB9ID0gbWFuaWZlc3Q7XG4gICAgICB2aCA9IHZpZXcuaGVpZ2h0O1xuICAgICAgdncgPSB2aWV3LndpZHRoO1xuICAgICAgaW5wdXRzID0gaW5wdXRFbmRwb2ludHM7XG4gICAgfTtcblxuICAgIHBhdGNoLm9uUGFyYW1ldGVyRW5kcG9pbnRDaGFuZ2VkID0gKC4uLmFyZ3MpPT5jb25zb2xlLmxvZygnb25QYXJhbWV0ZXJFbmRwb2ludENoYW5nZWQnICwgYXJncyk7XG4gICAgcGF0Y2gub25TYW1wbGVSYXRlQ2hhbmdlZCA9ICguLi5hcmdzKT0+Y29uc29sZS5sb2coJ29uU2FtcGxlUmF0ZUNoYW5nZWQnICwgYXJncyk7XG4gICAgcGF0Y2gub25QYXJhbWV0ZXJFbmRwb2ludENoYW5nZWQgPSAoLi4uYXJncyk9PmNvbnNvbGUubG9nKCdvblBhcmFtZXRlckVuZHBvaW50Q2hhbmdlZCcgLCBhcmdzKTtcbiAgICBwYXRjaC5vbk91dHB1dEV2ZW50ID0gKC4uLmFyZ3MpPT5jb25zb2xlLmxvZygnb25PdXRwdXRFdmVudCcgLCBhcmdzKTtcbiAgICBjb25zdCBtYW5pZmVzdCA9IHBhdGNoLnJlcXVlc3RTdGF0dXNVcGRhdGUoKTtcbiAgfSlcblxuICBmdW5jdGlvbiBjaGFuZ2UoKSB7XG4gICAgaW5wdXRCaW5kaW5nLnZhbHVlID0gXCJ0ZXN0aW5nXCIgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VuZCh7ZW5kcG9pbnQsIHZhbH0pIHtcbiAgICBpZiAoIWVuZHBvaW50KVxuICAgICAgcmV0dXJuO1xuICAgIHBhdGNoLnNlbmRFdmVudE9yVmFsdWUgKGVuZHBvaW50LCB2YWwsIDE2KTtcbiAgfVxuICBcbjwvc2NyaXB0PlxuXG48bWFpbiBzdHlsZT1cIlxuICAtLXZoOnt2aH1weDtcbiAgLS12dzp7dnd9cHg7XG5cIj5cblxuPFN5bnRoIHtpbnB1dHN9IG9uOnNlbmRWYWx1ZT17KGUpPT5zZW5kKGUuZGV0YWlsKX0gLz5cblxuPC9tYWluPlxuXG48c3R5bGU+XG4gIDpnbG9iYWwoYm9keSkge1xuICAgIG1hcmdpbjoxcHg7XG4gICAgZm9udC1mYW1pbHk6ICdTb2ZpYSBTYW5zIEV4dHJhIENvbmRlbnNlZCcsIHNhbnMtc2VyaWY7XG4gIH1cbiAgbWFpbiB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICBoZWlnaHQ6IHZhcigtLXZoKTtcbiAgICB3aWR0aDogdmFyKC0tdncpO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNlY2U3ZGY7XG4gICAgY29sb3I6IGJsYWNrO1xuICB9XG4gIFxuXG4gIGxhYmVsIHsgZGlzcGxheTogZmxleCB9XG5cdGlucHV0LCBwIHsgbWFyZ2luOiA2cHggfVxuXG48L3N0eWxlPlxuIiwgImltcG9ydCBUZXN0IGZyb20gXCIuL2luZGV4LnN2ZWx0ZVwiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tUGF0Y2hWaWV3IChwYXRjaENvbm5lY3Rpb24pXG57XG4gICAgcmV0dXJuIG5ldyBUZXN0KHtcbiAgICAgICAgdGFyZ2V0OiBkb2N1bWVudC5ib2R5LFxuICAgICAgICBwcm9wczogeyBwYXRjaCA6IHBhdGNoQ29ubmVjdGlvbiB9LFxuICAgICAgICAvL2NvbnRleHQ6IG5ldyBNYXAoW1sncGF0Y2gnLCBwYXRjaENvbm5lY3Rpb25dXSlcbiAgICB9KVxufSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxnQkFBZ0I7QUFBQTtBQUVoQixnQkFBZ0IsS0FBSyxLQUFLO0FBRXRCLGFBQVcsS0FBSztBQUNaLFFBQUksS0FBSyxJQUFJO0FBQ2pCLFNBQU87QUFBQTtBQVlYLGFBQWEsSUFBSTtBQUNiLFNBQU87QUFBQTtBQUVYLHdCQUF3QjtBQUNwQixTQUFPLE9BQU8sT0FBTztBQUFBO0FBRXpCLGlCQUFpQixLQUFLO0FBQ2xCLE1BQUksUUFBUTtBQUFBO0FBRWhCLHFCQUFxQixPQUFPO0FBQ3hCLFNBQU8sT0FBTyxVQUFVO0FBQUE7QUFFNUIsd0JBQXdCLEdBQUcsR0FBRztBQUMxQixTQUFPLEtB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
