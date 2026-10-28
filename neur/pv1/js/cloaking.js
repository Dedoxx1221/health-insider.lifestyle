/**
 * cloaking.js — decide o layout (white/black), persiste a sessão no funil
 * e marca os links de compra do Digistore24 com custom=bvlp.
 *
 * 1) Layout white/black
 *    Ativa BLACK quando:
 *      a. ?custom=bvlp (ou ?CUSTOM=BVLP) na URL
 *      b. localStorage pg_black=1 (sessão persistida — propaga para as
 *         próximas páginas do funil sem precisar repetir o parâmetro)
 *    Qualquer outro acesso → WHITE.
 *    Roda de forma síncrona, o mais cedo possível no <head> (antes do
 *    primeiro paint), para não haver flash do layout errado. Por isso
 *    esta parte NÃO pode ficar atrás de DOMContentLoaded nem de async/defer.
 *
 * 2) Links de compra Digistore24
 *    Identifica os links de checkout (checkout-ds24.com / digistore24.com)
 *    e anexa custom=bvlp no final da URL de cada um, sem duplicar caso já
 *    exista. Cobre tanto os links já presentes no carregamento quanto os
 *    inseridos depois.
 */
(function () {
  var CUSTOM_PARAM = "custom";
  var CUSTOM_VALUE = "BVLP";

  var params = new URLSearchParams(window.location.search);
  var custom = (params.get("custom") || params.get("CUSTOM") || params.get("subid") || params.get("SUBID") || "").trim().toUpperCase();

  var isBlack = false;

  if (custom === CUSTOM_VALUE) {
    isBlack = true;
  }

  try {
    if (!isBlack && localStorage.getItem("pg_black") === "1") {
      isBlack = true;
    }
  } catch (e) {}

  document.documentElement.setAttribute("data-page", isBlack ? "black" : "white");

  try {
    if (isBlack) {
      localStorage.setItem("pg_black", "1");
    } else {
      localStorage.removeItem("pg_black");
    }
  } catch (e) {}

  /* ───────── DEBUG ───────── */
  window.PageController = {
    getStatus: function () {
      var localVal = null;
      try { localVal = localStorage.getItem("pg_black"); } catch (e) {}
      return {
        pagina: document.documentElement.getAttribute("data-page"),
        local: localVal,
        custom: custom,
      };
    },
    forceBlack: function () {
      try { localStorage.setItem("pg_black", "1"); } catch (e) {}
      document.documentElement.setAttribute("data-page", "black");
    },
    forceWhite: function () {
      try { localStorage.removeItem("pg_black"); } catch (e) {}
      document.documentElement.setAttribute("data-page", "white");
    },
  };
})();

(function () {
  var CUSTOM_PARAM = "custom";
  var CUSTOM_VALUE = "bvlp";
  var DS_HOSTS = /(^|\.)(checkout-ds24|digistore24)\.com$/i;

  function isDigistoreLink(href) {
    if (!href) return false;
    try {
      var url = new URL(href, window.location.href);
      return DS_HOSTS.test(url.hostname);
    } catch (e) {
      return false;
    }
  }

  function tagLink(a) {
    if (document.documentElement.getAttribute("data-page") !== "black") return;

    var href = a.getAttribute("href");
    if (!isDigistoreLink(href)) return;

    var url = new URL(href, window.location.href);
    if (url.searchParams.get(CUSTOM_PARAM) === CUSTOM_VALUE) return;

    url.searchParams.set(CUSTOM_PARAM, CUSTOM_VALUE);
    a.setAttribute("href", url.toString());
  }

  function scan(root) {
    (root || document).querySelectorAll("a[href]").forEach(tagLink);
  }

  function start() {
    scan();

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches("a[href]")) tagLink(node);
          if (node.querySelectorAll) scan(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
