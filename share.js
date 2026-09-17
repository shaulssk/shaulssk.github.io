(function () {
  function ready(fn) { if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }
  ready(function () {
    var title = document.title || 'Shaul SSK';
    var url = location.href;
    var msg = encodeURIComponent(title + ' - ' + url + ' (shaulssk.in)');
    var a = document.createElement('a');
    a.href = 'https://wa.me/?text=' + msg;
    a.target = '_blank';
    a.rel = 'noopener';
    a.id = 'wa-share-btn';
    a.setAttribute('aria-label', 'Share on WhatsApp');
    a.innerHTML = '<span style="margin-right:8px;">\uD83D\uDCF1</span>Share';
    a.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9999;' +
      'background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;' +
      'font-family:inherit;font-size:14px;font-weight:700;padding:10px 16px;' +
      'border-radius:999px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.35);' +
      'display:inline-flex;align-items:center;';
    a.style.display = 'none';
    document.body.appendChild(a);
    setTimeout(function () { a.style.display = 'inline-flex'; }, 1200);
  });
})();