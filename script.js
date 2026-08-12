/* ============ Hero pathfinding visualization ============ */
(function pathfindViz(){
  const canvas = document.getElementById('pathfindCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const cols = 14, rows = 9;
  const cell = canvas.width / cols;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // simple maze: 0 = open, 1 = wall
  let grid = Array.from({length: rows}, () => Array.from({length: cols}, () => (Math.random() < 0.22 ? 1 : 0)));
  const start = {r: 1, c: 1};
  const goal = {r: rows - 2, c: cols - 2};
  grid[start.r][start.c] = 0; grid[goal.r][goal.c] = 0;

  function neighbors(node){
    const {r,c} = node;
    const out = [];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => {
      const nr = r+dr, nc = c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]===0) out.push({r:nr,c:nc});
    });
    return out;
  }
  function h(a,b){ return Math.abs(a.r-b.r) + Math.abs(a.c-b.c); }
  function key(n){ return n.r+','+n.c; }

  function astar(){
    const open = [{...start, g:0, f:h(start,goal)}];
    const cameFrom = {};
    const gScore = {[key(start)]: 0};
    const visitedOrder = [];
    const frontierSnapshots = [];
    const closed = new Set();

    while(open.length){
      open.sort((a,b)=>a.f-b.f);
      const current = open.shift();
      const ck = key(current);
      if(closed.has(ck)) continue;
      closed.add(ck);
      visitedOrder.push(current);
      frontierSnapshots.push(open.map(n=>({r:n.r,c:n.c})));

      if(current.r === goal.r && current.c === goal.c){
        const path = [];
        let cur = ck;
        while(cur){ const [r,c] = cur.split(',').map(Number); path.unshift({r,c}); cur = cameFrom[cur]; }
        return {visitedOrder, frontierSnapshots, path};
      }
      neighbors(current).forEach(n=>{
        const nk = key(n);
        const tentativeG = gScore[ck] + 1;
        if(gScore[nk] === undefined || tentativeG < gScore[nk]){
          gScore[nk] = tentativeG;
          cameFrom[nk] = ck;
          open.push({...n, g: tentativeG, f: tentativeG + h(n, goal)});
        }
      });
    }
    return {visitedOrder, frontierSnapshots, path: []};
  }

  function drawGrid(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        ctx.fillStyle = grid[r][c]===1 ? '#1A1E2B' : '#12151E';
        ctx.fillRect(c*cell, r*cell, cell-1.5, cell-1.5);
      }
    }
  }
  function cellRect(node){ return [node.c*cell, node.r*cell, cell-1.5, cell-1.5]; }

  function drawMarker(node, color){
    const [x,y,w,hh] = cellRect(node);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x+w/2, y+hh/2, Math.min(w,hh)*0.28, 0, Math.PI*2);
    ctx.fill();
  }

  let frame = 0, result = astar(), running = true;

  function animate(){
    if(!running) return;
    drawGrid();

    const step = Math.floor(frame / 2);
    const visited = result.visitedOrder.slice(0, Math.min(step, result.visitedOrder.length));
    visited.forEach(n => {
      const [x,y,w,hh] = cellRect(n);
      ctx.fillStyle = 'rgba(242,166,90,0.16)';
      ctx.fillRect(x,y,w,hh);
    });

    const frontier = result.frontierSnapshots[Math.min(step, result.frontierSnapshots.length-1)] || [];
    frontier.forEach(n => {
      const [x,y,w,hh] = cellRect(n);
      ctx.fillStyle = 'rgba(94,234,212,0.14)';
      ctx.fillRect(x,y,w,hh);
    });

    if(step >= result.visitedOrder.length){
      const pathLen = Math.min(step - result.visitedOrder.length, result.path.length);
      for(let i=0;i<pathLen;i++) drawMarker(result.path[i], '#F2A65A');
    }

    drawMarker(start, '#5EEAD4');
    drawMarker(goal, '#F2A65A');

    frame++;
    const totalFrames = (result.visitedOrder.length + result.path.length) * 2 + 40;
    if(frame > totalFrames){
      // reroll a new maze and restart after a pause
      setTimeout(()=>{
        grid = Array.from({length: rows}, () => Array.from({length: cols}, () => (Math.random() < 0.22 ? 1 : 0)));
        grid[start.r][start.c] = 0; grid[goal.r][goal.c] = 0;
        result = astar();
        frame = 0;
        if(!prefersReduced) requestAnimationFrame(animate);
      }, 1400);
      return;
    }
    if(!prefersReduced) requestAnimationFrame(animate);
  }

  drawGrid();
  drawMarker(start, '#5EEAD4');
  drawMarker(goal, '#F2A65A');
  if(!prefersReduced){
    requestAnimationFrame(animate);
  }
})();

/* ============ Chat widget ============ */
(function chatWidget(){
  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const suggestions = document.getElementById('chatSuggestions');
  const openers = [document.getElementById('openChatNav'), document.getElementById('openChatHero')].filter(Boolean);

  let history = []; // {role, content}
  let sending = false;

  function openPanel(){
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    input.focus();
  }
  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  launcher.addEventListener('click', openPanel);
  openers.forEach(btn => btn.addEventListener('click', openPanel));
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closePanel(); });

  function addMessage(role, text){
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg--user' : 'chat-msg--agent');
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function addTyping(){
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--agent chat-msg--typing';
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function sendMessage(text){
    if(!text.trim() || sending) return;
    sending = true;
    if(suggestions) suggestions.style.display = 'none';
    addMessage('user', text);
    history.push({role: 'user', content: text});
    input.value = '';
    const typingEl = addTyping();

    try{
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ messages: history })
      });
      if(!res.ok) throw new Error('Request failed: ' + res.status);
      const data = await res.json();
      typingEl.remove();
      const reply = data.reply || "Sorry, I couldn't generate a response just now.";
      addMessage('agent', reply);
      history.push({role: 'assistant', content: reply});
    } catch(err){
      typingEl.remove();
      addMessage('agent', "I couldn't reach the backend just now. If you're the site owner: make sure ANTHROPIC_API_KEY is set in your deployment's environment variables, and that /api/chat is deployed.");
      console.error(err);
    } finally {
      sending = false;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage(input.value);
  });

  if(suggestions){
    suggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.textContent));
    });
  }
})();
