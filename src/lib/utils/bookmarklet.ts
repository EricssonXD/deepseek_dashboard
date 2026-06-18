export function buildBookmarkletCode(origin: string, sid: string): string {
	const code = `(function(){
    var TOKEN='';

    try {
      var raw = localStorage.getItem('userToken');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.value && parsed.value.length > 30) {
          TOKEN = parsed.value;
        }
      }
    } catch(e) {}

    if (!TOKEN) {
      for (var i=0; i<localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k);
        if (!v) continue;
        try { var p = JSON.parse(v); if (p && p.value) v = p.value; } catch(e) {}
        if (v && v.length > 50 && (v.startsWith('sk-') || v.startsWith('ds-') ||
            k.toLowerCase().indexOf('token') > -1 || k.toLowerCase().indexOf('auth') > -1)) {
          TOKEN = v; break;
        }
      }
    }

    if (!TOKEN) {
      document.cookie.split(';').forEach(function(c) {
        var parts = c.trim().split('=');
        if (parts[0].toLowerCase().indexOf('token') > -1 ||
            parts[0].toLowerCase().indexOf('auth') > -1 ||
            parts[0].toLowerCase().indexOf('session') > -1) {
          TOKEN = decodeURIComponent(parts.slice(1).join('='));
        }
      });
    }

    if (!TOKEN && window.__NEXT_DATA__) {
      try {
        TOKEN = JSON.parse(document.getElementById('__NEXT_DATA__').textContent)
          .props?.pageProps?.token || '';
      } catch(e) {}
    }

    if (TOKEN) {
      var prefix = TOKEN.slice(0, 15) + '...';
      fetch('${origin}/api/set-token?sid=${sid}', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token: TOKEN})
      }).then(function(r) { return r.json(); }).then(function(d) {
        alert('Token saved!\\nCaptured: ' + prefix + '\\nSwitch back to dashboard tab.');
      }).catch(function(e) {
        alert('Error: ' + e.message + '\\nIs dashboard server running at ${origin} ?');
      });
    } else {
      alert('Could not find token.\\nMake sure you are logged into platform.deepseek.com.\\n\\nTry: DevTools > Application > Local Storage > userToken');
    }
  })();`;

	return 'javascript:' + encodeURIComponent(code);
}
