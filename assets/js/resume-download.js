(function() {
  'use strict';
  
  function initDownload() {
    var countdownEl = document.getElementById('countdown');
    var statusEl = document.getElementById('download-status');
    var fallbackEl = document.getElementById('download-fallback');
    var downloadUrl = 'https://drive.google.com/uc?export=download&id=1kgQviVfRqzTI7Nr-B6LtMAfTWLfPSL-X';
    
    if (!countdownEl || !statusEl || !fallbackEl) return;
    
    var countdown = 3;
    
    var timer = setInterval(function() {
      countdown--;
      if (countdown > 0) {
        countdownEl.textContent = countdown;
      } else {
        clearInterval(timer);
        
        var link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'Eldar_Shahmaliyev_Resume.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        statusEl.innerHTML = 'Download started! Thank you for your interest.';
        fallbackEl.style.display = 'block';
      }
    }, 1000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDownload);
  } else {
    initDownload();
  }
})();