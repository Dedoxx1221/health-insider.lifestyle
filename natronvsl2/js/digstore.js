(function () {
  var LAYOUT_PARAM = "custom";
  var STORAGE_KEY = "cartpanda:layout";
  var VALID_LAYOUTS = ["1", "2"];
  var DEFAULT_LAYOUT = "1";
  var DS_HOSTS = /(^|\.)(checkout-ds24|digistore24)\.com$/i;

  function isValidLayout(value) {
    return VALID_LAYOUTS.indexOf(value) !== -1;
  }

  function readStoredLayout() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeStoredLayout(layout) {
    try {
      window.localStorage.setItem(STORAGE_KEY, layout);
    } catch (error) {
      /* localStorage indisponÃ­vel (modo privado, cookies bloqueados, etc.) */
    }
  }

  // Prioridade: ?custom= na URL > valor salvo no localStorage > padrÃ£o (1).
  // Roda de forma sÃ­ncrona no <head> para nÃ£o piscar o layout errado.
  function resolveInitialLayout() {
    var fromUrl = new URLSearchParams(window.location.search).get(LAYOUT_PARAM);
    if (isValidLayout(fromUrl)) {
      writeStoredLayout(fromUrl);
      return fromUrl;
    }

    var fromStorage = readStoredLayout();
    if (isValidLayout(fromStorage)) {
      return fromStorage;
    }

    return DEFAULT_LAYOUT;
  }

  var activeLayout = resolveInitialLayout();
  document.documentElement.setAttribute("data-layout", activeLayout);

  function getLayout() {
    var current = document.documentElement.getAttribute("data-layout");
    return isValidLayout(current) ? current : DEFAULT_LAYOUT;
  }

  // Aplica o layout, persiste no localStorage e avisa a pÃ¡gina.
  function setLayout(layout, options) {
    var next = isValidLayout(layout) ? layout : DEFAULT_LAYOUT;
    var opts = options || {};

    document.documentElement.setAttribute("data-layout", next);
    if (opts.persist !== false) writeStoredLayout(next);

    document.dispatchEvent(
      new CustomEvent("digistore:layoutchange", { detail: { layout: next } })
    );

    return next;
  }

  function toggleLayout(options) {
    return setLayout(getLayout() === "2" ? "1" : "2", options);
  }

  // API pÃºblica para trocar o layout via console ou outros scripts.
  window.digistoreLayout = {
    get: getLayout,
    set: setLayout,
    toggle: toggleLayout,
    clearStored: function () {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        /* ignore */
      }
    }
  };

  function isDigistoreLink(href) {
    if (!href) return false;
    try {
      return DS_HOSTS.test(new URL(href, window.location.href).hostname);
    } catch (error) {
      return false;
    }
  }

  // Leva o layout ativo adiante nos links de checkout da Digistore24.
  function configureLink(link) {
    var href = link.getAttribute("href");
    if (!isDigistoreLink(href)) return;

    var url = new URL(href, window.location.href);
    url.searchParams.set(LAYOUT_PARAM, getLayout());
    link.setAttribute("href", url.toString());
  }

  function configureLinks(root) {
    (root || document).querySelectorAll("a[href]").forEach(configureLink);
  }

  function init() {
    configureLinks();

    document.addEventListener("digistore:layoutchange", function () {
      configureLinks();
    });

    // Cobre links inseridos depois (ex.: upsell do digistoreUpsell()).
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches("a[href]")) configureLink(node);
          if (node.querySelectorAll) configureLinks(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();