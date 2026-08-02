// ── Amber — SPA + Router + Views ──
const L='<'; const G='>'; const S='/';

// helpers
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function strip(h){return (h||'').replace(/<[^>]+>/g,'').replace(/&[^;]+;/g,'').slice(0,220)}
function title(m){return (m.title && m.title.english) || (m.title && m.title.romaji) || m.title || 'Sin título'}
function img(m){return m.coverImage && (m.coverImage.extraLarge || m.coverImage.large) || ''}
function hue(m){return (m.coverImage && m.coverImage.color) || '#D9A441'}
function score(m){return m.averageScore ? (m.averageScore/10).toFixed(1) : null}
function fmtTimeUntil(s){if(s<=0)return 'Ya disponible';if(s<60)return s+'s';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d'}
function fmtAiring(unix){var d=unix*1000,now=Date.now(),h=Math.floor((d-now)/36e5);if(h<1)return 'Reciente';if(h<24)return 'Hace '+h+'h';return 'Hace '+Math.floor(h/24)+'d'}

const D = window.AMBER_DATA || {popular:[],hero:[],recent:[],trending:[]}
const pop = D.popular || [];
const heroItems = D.hero || [];
const recent = D.recent || [];
const trending = D.trending || [];

// localStorage helpers
function getLS(k,d){try{var v=localStorage.getItem('amber_'+k);return v?JSON.parse(v):d}catch(e){return d}}
function setLS(k,v){try{localStorage.setItem('amber_'+k,JSON.stringify(v))}catch(e){}}
function getContinue(){return getLS('continue',[])}
function addContinue(id,title,image,ep,progress,total){var arr=getContinue();var idx=arr.findIndex(function(e){return e.id===id});var entry={id:id,title:title,image:image,episode:ep,progress:progress,total:total||0,ts:Date.now()};if(idx>=0){arr[idx]=entry}else{arr.unshift(entry)}if(arr.length>24)arr=arr.slice(0,24);setLS('continue',arr)}
function getFavorites(){return getLS('fav',[])}
function toggleFav(id,title,image){var arr=getFavorites();var idx=arr.findIndex(function(e){return e.id===id});if(idx>=0){arr.splice(idx,1)}else{arr.unshift({id:id,title:title,image:image,ts:Date.now()})}setLS('fav',arr)}
function isFav(id){return getFavorites().some(function(e){return e.id===id})}
function getHistory(){return getLS('hist',[])}
function addHistory(id,title,image,ep,progress){var arr=getHistory();var idx=arr.findIndex(function(e){return e.id===id+'_'+ep});var entry={id:id+'_'+ep,animeId:id,title:title,image:image,episode:ep,progress:progress||0,ts:Date.now()};if(idx>=0){arr[idx]=entry}else{arr.unshift(entry)}if(arr.length>50)arr=arr.slice(0,50);setLS('hist',arr)}
function clearHistory(){setLS('hist',[])}

const main = document.getElementById('main')
let currentRoute = ''
let heroIdx = 0
let heroTimer = null

function navigate(hash){
  if(!hash || hash==='#/') hash='#/'
  if(window.location.hash!==hash) window.location.hash=hash
  render()
}

function render(){
  var h = window.location.hash || '#/'
  currentRoute = h
  document.title = 'Amber — Anime Premium'
  // update active nav link
  document.querySelectorAll('.nav__link').forEach(function(a){
    a.classList.toggle('active', a.getAttribute('href')===h)
  })
  // clear hero timer
  if(heroTimer){clearInterval(heroTimer);heroTimer=null}
  // scroll to top
  window.scrollTo(0,0)
  // dispatch
  if(h==='#/' || h==='') renderHome()
  else if(h.startsWith('#/search')) renderSearch(h)
  else if(h.startsWith('#/anime?')) renderDetail(h)
  else if(h.startsWith('#/watch?')) renderWatch(h)
  else if(h==='#/favorites') renderFavorites()
  else if(h==='#/history') renderHistory()
  else if(h==='#/profile') renderProfile()
  else renderHome()
}

function cardHTML(m,idx,opts){
  opts=opts||{}
  var rank = opts.rank||''
  var sc = score(m)
  var yr = (m.seasonYear)?String(m.seasonYear):''
  var h = hue(m)
  var link = '#/anime?id='+m.id+(m.idMal?'&mal='+m.idMal:'')
  var extra = opts.extraClass||''
  var rankBadge = rank ? '<div class="card__rank">'+rank+'</div>' : ''
  var scoreHtml = sc ? '<span class="card__score">★ '+sc+'</span>' : ''
  var yearHtml = yr ? '<span class="card__chip card__chip--year">'+yr+'</span>' : ''
  return '<a class="card '+extra+'" href="'+link+'" draggable="false">'
    +'<div class="card__art">'
    +'<span class="card__shim" aria-hidden="true"></span>'
    +'<img class="card__img" src="'+img(m)+'" alt="'+esc(title(m))+'" loading="lazy" onerror="this.style.display=\'none\'">'
    +'<div class="card__overlay">'
    +rankBadge
    +'<div class="card__meta">'+scoreHtml+yearHtml+'</div>'
    +'<div class="card__hue" style="background:'+h+'"></div>'
    +'</div>'
    +'<div class="card__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 5v14l12-7z" fill="currentColor"/></svg></div>'
    +'</div>'
    +'<div class="card__cap"><p class="card__title">'+esc(title(m))+'</p>'
    +'<p class="card__sub">'+((m.genres||[]).slice(0,2).join(', ')||'')+'</p></div>'
    +'</a>'
}

function railHTML(title,items,sub,opts){
  if(!items||!items.length) return ''
  opts=opts||{}
  var id='rail-'+Math.random().toString(36).slice(2,8)
  var cards=''
  items.forEach(function(m,i){cards+=cardHTML(m,i,opts)})
  return '<section class="rail">'
    +'<header class="rail__head">'
    +'<h2 class="rail__title">'+title+'</h2>'
    +(sub?'<p class="rail__sub">'+sub+'</p>':'')
    +'<div class="rail__nav">'
    +'<button class="iconbtn rail__prev" onclick="scrollRail(\''+id+'\',-1)" aria-label="Anterior">‹</button>'
    +'<button class="iconbtn rail__next" onclick="scrollRail(\''+id+'\',1)" aria-label="Siguiente">›</button>'
    +'</div></header>'
    +'<div class="rail__viewport">'
    +'<div class="rail__track" id="'+id+'">'+cards+'</div>'
    +'<div class="rail__edge rail__edge--l"></div>'
    +'<div class="rail__edge rail__edge--r"></div>'
    +'</div></section>'
}

function scrollRail(id,dir){
  var el=document.getElementById(id)
  if(!el)return
  var step=el.offsetWidth*.75
  el.scrollBy({left:dir*step,behavior:'smooth'})
}

function renderHome(){
  // hero
  var heroHTML='<div class="hero">' 
  heroItems.forEach(function(m,i){
    var active = i===heroIdx ? 'current' : ''
    var sc = score(m)
    var genres=(m.genres||[]).slice(0,3).map(function(g){return '<span class="hero__badge">'+g+'</span>'}).join('')
    var desc=strip(m.description||'')
    var epCount=m.episodes?m.episodes+' episodios':''
    heroHTML+='<div class="hero__slide '+active+'">'
    +'<img class="hero__img" src="'+(m.bannerImage||img(m))+'" alt="">'
    +'<div class="hero__grad hero__grad--r"></div>'
    +'<div class="hero__grad hero__grad--t"></div>'
    +'<div class="hero__grad hero__grad--b"></div>'
    +'<div class="hero__content">'
    +'<div class="hero__badges">'+genres+'</div>'
    +'<h1 class="hero__title">'+esc(title(m))+'</h1>'
    +'<p class="hero__desc">'+esc(desc)+'</p>'
    +'<div class="hero__meta">'
    +(sc?'<span class="hero__score"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>'+sc+'</span>':'')
    +(epCount?'<span class="hero__eps">'+epCount+'</span>':'')
    +'</div>'
    +'<div class="hero__btns">'
    +'<a href="#/anime?id='+m.id+(m.idMal?'&mal='+m.idMal:'')+'" class="btn btn--primary"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 5v14l12-7z" fill="currentColor"/></svg> Ver ahora</a>'
    +'<a href="#/anime?id='+m.id+(m.idMal?'&mal='+m.idMal:'')+'" class="btn btn--ghost">Más información</a>'
    +'</div></div></div>'
  })
  // dots
  heroHTML+='<div class="hero__dots">' 
  heroItems.forEach(function(_,i){heroHTML+='<button class="hero__dot '+(i===heroIdx?'active':'')+'" onclick="heroGo('+i+')"></button>'})
  heroHTML+='</div>'
  // nav arrows
  heroHTML+='<button class="hero__nav hero__nav--l" onclick="heroGo(-1)" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'
  heroHTML+='<button class="hero__nav hero__nav--r" onclick="heroGo(1)" aria-label="Siguiente"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'
  heroHTML+='</div>'

  // rails
  var contItems=getContinue().slice(0,12).map(function(c){return{title:{english:c.title,romaji:c.title},coverImage:{extraLarge:c.image},averageScore:null,genres:[],id:c.animeId||0,seasonYear:null}})
  var favItems=getFavorites().slice(0,12).map(function(f){return{title:{english:f.title,romaji:f.title},coverImage:{extraLarge:f.image},averageScore:null,genres:[],id:f.id||0,seasonYear:null}})
  var curSeason=pop.filter(function(m){return m.status==='RELEASING'}).slice(0,18)
  var topRated=pop.slice().sort(function(a,b){return(b.averageScore||0)-(a.averageScore||0)}).slice(0,18)

  var sections=''
  if(contItems.length) sections+=railHTML('Continuar viendo',contItems,'Último visto',{extraClass:'card--continue'})
  sections+=railHTML('Episodios recientes',recent,'Airing en AniList',{rank:true})
  if(favItems.length) sections+=railHTML('Mis favoritos',favItems,'Tu biblioteca')
  sections+=railHTML('Temporada actual',curSeason,'En emisión',{rank:true})
  sections+=railHTML('Tendencias',trending,'Trending ahora',{rank:true})
  sections+=railHTML('Top calificados',topRated,'Por puntuación',{rank:true})
  sections+=railHTML('Más populares',pop,'Todos los tiempos',{rank:true})

  main.className='app app-home'
  main.innerHTML=heroHTML+sections

  // hero auto-rotate
  heroTimer=setInterval(function(){heroGo(1)},6000)
  // scroll edge shadows
  initRails()
}

function heroGo(dir){
  if(!heroItems.length)return
  heroIdx=(dir<0?(heroIdx-1+heroItems.length):heroIdx+1)%heroItems.length
  renderHome()
}

function initRails(){
  document.querySelectorAll('.rail__track').forEach(function(t){
    function check(){
      var l=t.parentElement.querySelector('.rail__edge--l')
      var r=t.parentElement.querySelector('.rail__edge--r')
      if(l)l.classList.toggle('visible',t.scrollLeft>10)
      if(r)r.classList.toggle('visible',t.scrollLeft<t.scrollWidth-t.clientWidth-10)
    }
    t.addEventListener('scroll',check)
    check()
  })
}

function renderSearch(hash){
  var params=new URLSearchParams(hash.replace('#/search',''))
  var q=params.get('q')||''
  var qLower=q.toLowerCase()
  // local filter of AniList data
  var results=pop.concat(trending).filter(function(m){
    var t=title(m).toLowerCase()
    var rom=m.title&&m.title.romaji?m.title.romaji.toLowerCase():''
    var syn=(m.synonyms||[]).join(' ').toLowerCase()
    return t.indexOf(qLower)>=0||rom.indexOf(qLower)>=0||syn.indexOf(qLower)>=0
  })
  // dedupe
  var seen={}; results=results.filter(function(m){if(seen[m.id])return false;seen[m.id]=1;return true})

  var grid=results.map(function(m,i){return cardHTML(m,i+1,{rank:String(i+1)})}).join('')
  if(!grid) grid='<div class="page-empty"><p>No se encontraron resultados para "'+esc(q)+'"</p></div>'

  main.className='app'
  main.innerHTML='<div class="search-page">'
    +'<form class="search-page__bar" onsubmit="return doSearch(event)">'
    +'<div class="search-page__input-wrap">'
    +'<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m20 20-3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
    +'<input id="searchInput" class="search-page__input" type="search" placeholder="Buscar anime…" value="'+esc(q)+'">'
    +'</div>'
    +'<button class="search-page__btn" type="submit">Buscar</button>'
    +'</form>'
    +'<div class="search-grid">'+grid+'</div>'
    +'</div>'

  if(!q) document.getElementById('searchInput').focus()
}

function doSearch(e){e.preventDefault();var v=document.getElementById('searchInput').value.trim();navigate('#/search?q='+encodeURIComponent(v));return false}

function renderDetail(hash){
  var params=new URLSearchParams(hash.replace('#/anime',''))
  var id=parseInt(params.get('id'))
  var mal=parseInt(params.get('mal'))||null
  var m=pop.concat(trending).find(function(x){return x.id===id})||pop[0]
  var h=hue(m)
  var sc=score(m)
  var fav=isFav(String(m.id))
  var banner=m.bannerImage||''
  var desc=strip(m.description||'')
  var genres=(m.genres||[]).map(function(g){return '<span class="detail__genre">'+g+'</span>'}).join('')
  var chars=(m.characters||[]).map(function(c){return '<div class="detail__char"><img src="'+(c.image||'')+'" alt="'+esc(c.name)+'" onerror="this.style.display=\'none\'"><span class="detail__char-name">'+esc(c.name)+'</span></div>'}).join('')

  main.className='app'
  main.innerHTML='<div class="detail">'
    +(banner?'<div class="detail__banner"><img src="'+banner+'" alt=""><div class="detail__banner-grad"></div></div>':'')
    +'<div class="detail__body">'
    +'<div class="detail__main">'
    +'<div class="detail__poster"><img src="'+img(m)+'" alt="'+esc(title(m))+'" onerror="this.style.display=\'none\'">'
    +'<button class="detail__poster-fav '+(fav?'active':'')+'" onclick="toggleFavDetail('+m.id+')" aria-label="Favorito">'
    +'<svg viewBox="0 0 24 24" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="'+(fav?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"/></svg>'
    +'</button></div>'
    +'<div class="detail__info">'
    +'<h1>'+esc(title(m))+'</h1>'
    +(m.title&&m.title.romaji&&m.title.romaji!==title(m)?'<p class="detail__romaji">'+esc(m.title.romaji)+'</p>':'')
    +'<div class="detail__badges">'
    +(sc?'<span class="detail__badge detail__badge--score" style="border-color:'+h+'55;color:'+h+'">★ '+sc+'</span>':'')
    +(m.genres&&m.genres.length?'<span class="detail__badge">'+m.genres.length+' géneros</span>':'')
    +'</div>'
    +'<div class="detail__genres">'+genres+'</div>'
    +'<div class="detail__section"><h2>Sinopsis</h2><p class="detail__desc">'+esc(desc)+'</p></div>'
    +'</div></div></div></div>'

  // store data for continue watching
  window.__detailData = m
}

function toggleFavDetail(id){
  var m=window.__detailData
  if(!m)return
  toggleFav(String(id),title(m),img(m))
  renderDetail(currentRoute)
}

function renderWatch(hash){
  var params=new URLSearchParams(hash.replace('#/watch',''))
  var epNum=params.get('ep')||'1'
  var animeId=params.get('id')||''
  var animeTitle=params.get('t')||'Anime'
  var animeImg=params.get('img')||''
  var servers=['Archivo','Embed','Servidor 2','Servidor 3']
  var activeServer=0
  var variant='SUB'

  // store for continue watching
  addContinue(animeId,animeTitle,animeImg,epNum,0)
  addHistory(animeId,animeTitle,animeImg,epNum,0)

  main.className='app'
  main.innerHTML='<div class="watch">'
    +'<div class="watch__breadcrumb"><a href="#/">Inicio</a> / <a href="#/anime?id='+animeId+'">'+esc(animeTitle)+'</a> / Ep '+epNum+'</div>'
    +'<div class="watch__player"><div class="spinner"></div><p style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--mute);font-size:14px">El reproductor conecta con el backend real en el producto actual</p></div>'
    +'<div class="watch__controls">'
    +'<div class="watch__nav">'
    +'<button class="watch__nav-btn" onclick="watchNav('+animeId+',\''+esc(animeTitle)+'\',\''+esc(animeImg)+'\','+epNum+','+(-1)+')" '+(parseInt(epNum)<=1?'disabled':'')+'>‹ Anterior</button>'
    +'<span class="watch__label">Episodio '+epNum+'</span>'
    +'<button class="watch__nav-btn" onclick="watchNav('+animeId+',\''+esc(animeTitle)+'\',\''+esc(animeImg)+'\','+epNum+',1)">Siguiente ›</button>'
    +'</div>'
    +'<div class="watch__variant">'
    +'<button class="active" onclick="setVariant(this,\''+variant+'\')">SUB</button>'
    +'<button onclick="setVariant(this,\''+variant+'\')">DUB</button>'
    +'</div></div>'
    +'<div class="watch__servers"><h3>Servidores</h3><div class="watch__server-list">'
    +servers.map(function(s,i){return '<button class="watch__server'+(i===0?' active':'')+'">'+s+'</button>'}).join('')
    +'</div></div>'
    +'<div class="watch__downloads"><h3>Descargar</h3><div class="watch__dl-list">'
    +servers.slice(0,3).map(function(s){return '<a class="watch__dl" href="#"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> '+s+'</a>'}).join('')
    +'</div></div></div>'

  // bind server clicks
  document.querySelectorAll('.watch__server').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('.watch__server').forEach(function(x){x.classList.remove('active')})
      b.classList.add('active')
    })
  })
}

function watchNav(id,t,img,ep,dir){
  var n=parseInt(ep)+dir
  if(n<1)return
  navigate('#/watch?id='+id+'&t='+encodeURIComponent(t)+'&img='+encodeURIComponent(img)+'&ep='+n)
}

function setVariant(btn,current){
  btn.parentElement.querySelectorAll('button').forEach(function(b){b.classList.remove('active')})
  btn.classList.add('active')
}

function renderFavorites(){
  var favs=getFavorites()
  var grid=favs.map(function(f){
    return '<div class="fav-item"><a href="#/anime?id='+f.id+'" class="card" draggable="false">'
      +'<div class="card__art"><img class="card__img" src="'+(f.image||'')+'" alt="'+esc(f.title)+'" loading="lazy">'
      +'<div class="card__overlay"></div></div>'
      +'<div class="card__cap"><p class="card__title">'+esc(f.title)+'</p></div>'
      +'</a>'
      +'<button class="hist-item__del" onclick="removeFav(\''+f.id+'\')" title="Eliminar"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      +'</div>'
  }).join('')

  main.className='app'
  main.innerHTML='<div class="fav-page">'
    +'<h1 class="page-title">Mis Favoritos <span class="page-title__count">('+favs.length+')</span></h1>'
    +(favs.length?'<div class="fav-grid">'+grid+'</div>':'<div class="page-empty"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><p>No tienes favoritos aún</p><a href="#/" class="btn btn--primary">Explorar animes</a></div>')
    +'</div>'
}

function removeFav(id){toggleFav(id,'','');renderFavorites()}

function renderHistory(){
  var hist=getHistory()
  var list=hist.map(function(h){
    var pct=h.progress?Math.min(Math.floor((h.progress/3600)*100),100):0
    return '<div class="hist-item">'
      +'<a href="#/watch?id='+h.animeId+'&t='+encodeURIComponent(h.title)+'&ep='+h.episode+'" class="hist-item__thumb">'
      +'<img src="'+(h.image||'')+'" alt="">'
      +'<div class="hist-item__progress"><div class="hist-item__progress-fill" style="width:'+pct+'%"></div></div></a>'
      +'<div class="hist-item__info"><a href="#/anime?id='+h.animeId+'"><h3>'+esc(h.title)+'</h3></a>'
      +'<p class="hist-item__sub">Ep. '+h.episode+' — '+timeAgo(h.ts)+'</p></div>'
      +'<div class="hist-item__actions">'
      +'<a href="#/watch?id='+h.animeId+'&t='+encodeURIComponent(h.title)+'&ep='+h.episode+'" class="iconbtn" title="Reproducir"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 5v14l12-7z" fill="currentColor"/></svg></a>'
      +'<button class="hist-item__del" onclick="removeHist(\''+h.id+'\')" title="Eliminar"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
      +'</div></div>'
  }).join('')

  main.className='app'
  main.innerHTML='<div class="hist-page">'
    +'<h1 class="page-title">Historial <span class="page-title__count">('+hist.length+')</span></h1>'
    +(hist.length?'<div class="hist-grid">'+list+'</div><div style="text-align:center;margin-top:24px"><button class="btn btn--ghost" onclick="clearHistPage()">Limpiar todo</button></div>':'<div class="page-empty"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><p>No hay historial</p><a href="#/" class="btn btn--primary">Empezar a ver</a></div>')
    +'</div>'
}

function timeAgo(ts){var d=Date.now()-ts,m=Math.floor(d/6e4),h=Math.floor(m/60),dy=Math.floor(h/24);if(m<60)return 'Hace '+m+' min';if(h<24)return 'Hace '+h+'h';return 'Hace '+dy+'d'}
function removeHist(id){var a=getHistory().filter(function(e){return e.id!==id});setLS('hist',a);renderHistory()}
function clearHistPage(){clearHistory();renderHistory()}

function renderProfile(){
  var favs=getFavorites()
  var hist=getHistory()
  var cont=getContinue()

  main.className='app'
  main.innerHTML='<div class="profile-page">'
    +'<div class="profile-header">'
    +'<div class="profile-avatar">AP</div>'
    +'<div class="profile-info"><h2>Amber User</h2><p>Prototipo premium — Obsidian + Amber</p></div>'
    +'</div>'
    +'<div class="profile-stats">'
    +'<div class="profile-stat active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/></svg><div class="num">'+hist.length+'</div><div class="label">Episodios vistos</div></div>'
    +'<div class="profile-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><div class="num">'+favs.length+'</div><div class="label">Favoritos</div></div>'
    +'<div class="profile-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><div class="num">'+cont.length+'</div><div class="label">En progreso</div></div>'
    +'</div>'
    +'<div class="profile-tab-content"><p style="text-align:center;color:var(--mute);padding:40px 0">La sincronización con backend conecta aquí en el producto real</p></div>'
    +'</div>'
}

window.addEventListener('scroll',function(){
  var nav=document.getElementById('nav')
  if(nav)nav.classList.toggle('scrolled',window.scrollY>30)
})

window.addEventListener('hashchange',render)
window.addEventListener('DOMContentLoaded',function(){
  render()
})