export function buildBookmarkletCode(): string {
	const code = `(function(){
    var host = window.location.hostname;
    var isDeepSeek = host === 'platform.deepseek.com' || host === 'chat.deepseek.com';

    if (!isDeepSeek) {
      // Not on DeepSeek — navigate there so localStorage is accessible, then re-click
      window.location = 'https://platform.deepseek.com/#token-extract';
      return;
    }

    var TOKEN='';

    // Primary: check known userToken key
    try {
      var raw = localStorage.getItem('userToken');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.value && parsed.value.length > 30) {
          TOKEN = parsed.value;
        }
      }
    } catch(e) {}

    // Fallback: scan all localStorage for token-like values
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

    if (TOKEN) {
      navigator.clipboard.writeText(TOKEN).then(function() {
        alert('Token copied to clipboard!\\n\\nSwitch back to dashboard tab and paste it.');
      }).catch(function() {
        prompt('Copy your token (Ctrl+C):', TOKEN);
      });
    } else {
      alert('Could not find token.\\nMake sure you are logged into platform.deepseek.com.\\n\\nTry: DevTools > Application > Local Storage > userToken');
    }
  })();`;

	return 'javascript:' + encodeURIComponent(code);
}
