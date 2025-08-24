---
icon: fas fa-download
order: 4
title: Download Resume
sitemap: false
---

Thanks for your interest! Here's my complete professional background as a Software Engineer.

<div id="download-status">
Preparing download... <span id="countdown">3</span> seconds remaining.
</div>

> **Manual Download**: If it doesn't start automatically, [click here to download my resume](https://drive.google.com/uc?export=download&id=1kgQviVfRqzTI7Nr-B6LtMAfTWLfPSL-X).
{: .prompt-tip #download-fallback style="display: none;" }

<script>
document.addEventListener('DOMContentLoaded', function() {
  const countdownEl = document.getElementById('countdown');
  const statusEl = document.getElementById('download-status');
  const fallbackEl = document.getElementById('download-fallback');
  const downloadUrl = 'https://drive.google.com/uc?export=download&id=1kgQviVfRqzTI7Nr-B6LtMAfTWLfPSL-X';
  
  let countdown = 3;
  
  const timer = setInterval(function() {
    countdown--;
    if (countdown > 0) {
      countdownEl.textContent = countdown;
    } else {
      clearInterval(timer);
      
      // Start automatic download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Eldar_Shahmaliyev_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update UI
      statusEl.innerHTML = 'Download started! Thank you for your interest.';
      fallbackEl.style.display = 'block';
    }
  }, 1000);
});
</script>

