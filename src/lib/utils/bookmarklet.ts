export function buildBookmarkletCode(origin: string): string {
	const code = `(function(){
    var TOKEN='';
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      var v=localStorage.getItem(k);
      if(v&&v.length>50&&(v.startsWith('sk-')||v.startsWith('ds-')||k.toLowerCase().indexOf('token')>-1||k.toLowerCase().indexOf('auth')>-1)){
        TOKEN=v;break;
      }
    }
    if(!TOKEN){
      document.cookie.split(';').forEach(function(c){
        var parts=c.trim().split('=');
        if(parts[0].toLowerCase().indexOf('token')>-1||parts[0].toLowerCase().indexOf('auth')>-1||parts[0].toLowerCase().indexOf('session')>-1){
          TOKEN=decodeURIComponent(parts.slice(1).join('='));
        }
      });
    }
    if(!TOKEN&&window.__NEXT_DATA__){
      try{TOKEN=JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props?.pageProps?.token||'';}catch(e){}
    }
    if(TOKEN){
      fetch('${origin}/api/set-token',{
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token:TOKEN})
      }).then(function(r){return r.json()}).then(function(d){
        alert('Token saved! Prefix: '+d.prefix+'\\nSwitch back to dashboard tab.');
      }).catch(function(e){
        alert('Error: '+e.message+'\\nIs dashboard server running?');
      });
    } else {
      alert('Could not find token.\\nMake sure you are logged into platform.deepseek.com.\\n\\nTry: open DevTools > Application > Local Storage > look for auth token, then paste it manually.');
    }
  })();`;

	return 'javascript:' + encodeURIComponent(code);
}
