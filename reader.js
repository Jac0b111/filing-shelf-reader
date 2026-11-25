'use strict';
const {companies,version} = window.shelfCatalog;
const labels={A:'A股',HK:'港股',US:'美股'};
const ids=Object.keys(companies);
const readable=ids.filter(k=>companies[k].periods>0);
const browseMarkets=Object.keys(labels).map(m=>ids.filter(id=>companies[id].m===m && (companies[id].numeric || companies[id].docs>0))).filter(pool=>pool.length);
function randomCompany(){
  const market=browseMarkets[Math.floor(Math.random()*browseMarkets.length)];
  return market[Math.floor(Math.random()*market.length)];
}
const initial=['A:002230','HK:00700','US:AAPL','A:600519'].filter(k=>companies[k]);
const follows=new Set(JSON.parse(localStorage.getItem('shelf.follow')||JSON.stringify(initial)));
let recent=localStorage.getItem('shelf.recent')||initial[0];
if(!companies[recent])recent=readable[0];
window.reportData={};
const loading=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(c){
  if(!c.periods&&!c.docs)return Promise.resolve();
  if(!loading.has(c.b))loading.set(c.b,new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='data/'+c.b+'.js?v='+version;
    script.onload=()=>{
      resolve();
      if('serviceWorker' in navigator && !navigator.serviceWorker.controller){
        navigator.serviceWorker.ready.then(async()=>{
          if(!navigator.serviceWorker.controller)await new Promise(done=>navigator.serviceWorker.addEventListener('controllerchange',done,{once:true}));
          await fetch(script.src);
        }).catch(()=>{});
      }
    };
    script.onerror=()=>{loading.delete(c.b);script.remove();reject(new Error('本地数据未能打开，请重试'));};
    document.head.append(script);
  }));
  return loading.get(c.b);
}
function theme(c){return c.m==='HK'?'tencent':c.m==='US'?'apple':c.c==='600519'?'maotai':'iflytek';}
function cover(c,mini){
  const year=(c.latest.match(/\d{4}/)||[''])[0];
  return '<span class="book theme-'+theme(c)+(mini?' mini':'')+'" aria-hidden="true">'+(mini?'':'<small>FINANCIAL<br>REPORT</small>')+'<canvas></canvas><span class="year">'+(mini?year.slice(2):year)+'</span></span>';
}
function tabs(p){return ['','A','HK','US'].map(m=>'<button class="chip" data-market="'+m+'" aria-pressed="'+(p.market===m)+'">'+(labels[m]||'全部')+'</button>').join('');}
const panes=Array.from(document.querySelectorAll('.device'),(node,i)=>({node,view:i?'browse':'shelf',id:i?randomCompany():recent,market:'',q:'',limit:20,shelfTop:0,section:'overview',origin:'shelf',a:0,b:1,compare:false}));
function shelf(p){
  const c=companies[recent];
  return '<div class="content"><div class="inner"><div class="cap"><h1 class="page-title">我的书架</h1><span class="mark">'+mark+'</span></div><div class="search">'+icon('search')+'<input type="search" aria-label="搜索三地公司" placeholder="搜索公司名称、股票代码"></div><button class="hero" data-open="'+esc(recent)+'"><span class="ghost"></span><span class="capline">'+icon('bookmark')+'继续阅读</span><h3>'+esc(c.n)+'</h3><p>'+esc(c.latest||'历年公告')+'</p><span class="hero-action">接着读 '+icon('arrow')+'</span>'+cover(c,false)+'</button><div class="section-head"><h3 class="list-title">我的关注</h3><button data-action="directory" class="source">全部公司 '+icon('next')+'</button></div><div class="tabs">'+tabs(p)+'</div><div class="rows"></div><details class="details attach"><summary>添加到手机主屏幕</summary><p class="info">iPhone：用 Safari 打开，点共享 → 添加到主屏幕。安卓：用 Chrome 打开，点菜单 → 安装应用或添加到主屏幕。</p><p class="info" data-offline>看过的公司资料可缓存在这台设备上，打开原文需要联网。</p></details><p class="info"><a href="library.html">本机完整资料库</a> · <a href="sources.html">数据说明</a></p></div></div>';
}
function list(p){
  const q=p.q.trim().toLowerCase(),ticker=q.replace(/[-_]/g,'.'),all=p.directory||q;
  const matches=(all?ids:[...follows]).filter(id=>{
    const c=companies[id];return c&&(!p.market||c.m===p.market)&&(!q||[c.c,c.n,c.e].join(' ').toLowerCase().includes(q)||(c.m==='US'&&c.c.toLowerCase()===ticker));
  });
  if(q)matches.sort((a,b)=>Number(companies[b].c.toLowerCase()===ticker)-Number(companies[a].c.toLowerCase()===ticker));
  p.node.querySelector('.list-title').textContent=q?'搜索结果':p.directory?'公司目录':'我的关注';
  p.node.querySelector('[data-action="directory"]').textContent=p.directory?'回到关注':'全部公司（'+ids.length.toLocaleString('zh-CN')+'） ›';
  const rows=p.node.querySelector('.rows');
  rows.innerHTML=matches.slice(0,p.limit).map(id=>{
    const c=companies[id];return '<div class="row"><button class="row-main" data-open="'+esc(id)+'">'+cover(c,true)+'<span><strong>'+esc(c.n)+'</strong><span class="meta">'+esc(c.c)+' · '+labels[c.m]+' · '+esc(c.latest||(c.docs?'已收录披露文件':'待补报告'))+'</span></span></button><button class="years-link" data-open="'+esc(id)+'">历年 '+icon('next')+'</button></div>';
  }).join('')||'<p class="empty">没有匹配的公司</p>';
  if(matches.length>p.limit)rows.insertAdjacentHTML('beforeend','<button class="results-more" data-action="more">查看更多（共 '+matches.length+' 个代码）</button>');
  rows.querySelectorAll('canvas').forEach(engraving);
}
const fields=['营业收入','归母净利润','扣非归母净利润','总资产','总负债','经营现金流净额','毛利率','基本每股收益'];
const overviewSections=[
 ['关键指标',[0,1,2]],['资产与负债',[3,4]],['经营现金流',[5]],['盈利能力',[6]],['每股指标',[7]]
];
const overviewIds=['TOTALOPERATEREVE','PARENTNETPROFIT','KCFJCXSYJLR','TOTAL_ASSETS_PK','LIABILITY','NETCASH_OPERATE_PK','XSMLL','EPSJB'];
const overviewOrder=overviewSections.flatMap(([group,indices])=>['@'+group,...indices.map(i=>overviewIds[i])]);
function overviewLines(c,values){
 return overviewSections.flatMap(([group,indices])=>{
  const rows=indices.filter(i=>values[i]!=null).map(i=>[
   overviewIds[i],i===0&&c.financial?'总收入':fields[i],values[i],
   i<3||i===5?'key':'',i===7?'perShare':i===6?'percent':'amount'
  ]);
  return rows.length?[['@'+group,group,null,'group'],...rows]:[];
 });
}
function periodControls(p,rows,title){
  const opts=(index,skip)=>rows.map((r,i)=>'<option value="'+i+'" '+(i===index?'selected ':'')+(i===skip?'disabled':'')+'>'+esc(r[2])+' · '+esc(r[3])+' · '+esc(r[4])+'</option>').join('');
  return '<div class="file-head"><h3>'+title+'</h3><button class="source" data-action="compare" '+(rows.length<2?'disabled':'')+'>'+ (p.compare?'横滑浏览全部':'选两期对比')+'</button></div>'+
    (p.compare?'<div class="periods"><label>报告一<select data-side="a">'+opts(p.a,p.b)+'</select></label><label>报告二<select data-side="b">'+opts(p.b,p.a)+'</select></label></div>':'');
}
function renderNumbers(p){
  p.stopColumns?.();p.stopColumns=null;
  const host=p.node.querySelector('.numbers');
  showStatements(host,p,p.view==='read'?p.section:'overview');
}
function originalSearch(c){
  if(c.m==='HK')return 'https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=zh';
  if(c.m==='US')return 'https://www.sec.gov/edgar/browse/?CIK='+encodeURIComponent(c.ref||c.c)+'&owner=exclude';
  return c.ref?'https://www.cninfo.com.cn/new/disclosure/stock?stockCode='+encodeURIComponent(c.c)+'&orgId='+encodeURIComponent(c.ref)+'&market='+(c.m==='HK'?'hke':c.c.startsWith('6')?'sse':c.c.startsWith('92')?'bse':'szse'):'https://www.cninfo.com.cn/new/fulltextSearch?keyWord='+encodeURIComponent(c.c);
}
async function paint(p){
  p.stopColumns?.();p.stopColumns=null;
  const key=p.id,view=p.view;
  const isReport=view==='read',c=companies[key];
  const previous=p.node.dataset.view;
  p.node.dataset.view=view;
  if(previous&&previous!==view&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    requestAnimationFrame(()=>p.node.querySelector('.content')?.animate(
      [{opacity:.65,transform:'translateX('+(isReport?16:previous==='read'?-12:0)+'px)'},{opacity:1,transform:'none'}],
      {duration:225,easing:'cubic-bezier(.2,.75,.25,1)'}));
  }
  p.node.classList.toggle('company-pane',isReport);
  p.node.parentElement.classList.toggle('reading',panes.some(pane=>pane.view==='read'));
  const navItems=isReport?[
    ['overview','overview','主要指标'],['income','income','利润表'],
    ['balance','balance','资产负债表'],['cash','cash','现金流量表']
  ]:[['shelf','book','书架'],['browse','shuffle','随手翻']];
  const footer='<nav aria-label="'+(isReport?'公司财报':'主导航')+'" class="foot-nav '+(isReport?'report-nav':'')+'" style="--count:'+navItems.length+';--active:'+navItems.findIndex(([v])=>v===(isReport?p.section:view))+'">'+navItems.map(([v,i,l])=>{
    const active=v===(isReport?p.section:view);
    return '<button '+(isReport?'data-section':'data-action')+'="'+v+'" class="nav-button '+(active?'active':'')+'" '+(active?'aria-current="page"':'')+'><span class="navglyph">'+icon(i)+l+'</span></button>';
  }).join('')+'</nav>';
  if(view==='shelf'){
    p.node.innerHTML=shelf(p)+footer;p.node.querySelector('input').value=p.q;list(p);engraving(p.node.querySelector('.hero canvas'));
    p.node.querySelector('.content').scrollTop=p.shelfTop;return;
  }
  const follow='<button data-action="follow" class="filter-button">'+(follows.has(key)?'✓ 已关注':'＋ 关注')+'</button>';
  const backLabel=p.origin==='browse'?'随手翻':'书架';
  const top=isReport?
    '<header class="report-header"><div class="cap"><button class="report-back" data-action="back">'+icon('back')+backLabel+'</button>'+follow+'</div><h1 class="page-title">'+esc(c.n)+'</h1><p class="meta">'+labels[c.m]+' · '+esc(c.c)+'</p></header>':
    '<div class="cap"><h1 class="page-title">随手翻</h1>'+follow+'</div><div class="folio theme-'+theme(c)+'"><div class="market">'+labels[c.m]+' · '+esc(c.c)+'</div><h2>'+esc(c.n)+'</h2><div class="art"><canvas></canvas></div><div class="folio-line"><b>'+esc(c.latest||'历年披露')+'</b></div></div><div class="read-actions"><button class="secondary" data-open="'+esc(key)+'">打开财报</button><button class="primary" data-action="next">下一家公司 '+icon('arrow')+'</button></div>';
  p.node.innerHTML='<div class="content reader"><div class="inner">'+top+'<section class="numbers">正在打开报告…</section><section class="documents"></section></div></div>'+footer;
  if(!isReport)engraving(p.node.querySelector('canvas'));
  const panel=p.node.querySelector('.numbers');
  try{await load(c);}catch(err){if(panel.isConnected)panel.innerHTML='<p>本地数据未能打开。</p><button class="secondary" data-action="retry">重试</button>';return;}
  if(!panel.isConnected)return;
  renderNumbers(p);
  const forms=window.reportData[key]?.d||[];
  const direct=d=>{
    const match=c.m==='A' && d[2].match(/^https:\/\/data\.eastmoney\.com\/notices\/detail\/\d+\/(AN\d+)\.html$/);
    return match?'https://pdf.dfcfw.com/pdf/H2_'+match[1]+'_1.pdf':d[2];
  };
  p.node.querySelector('.documents').innerHTML='<details class="details" '+(!c.numeric?'open':'')+'><summary>历年披露文件（'+forms.length+'）</summary>'+forms.map(d=>'<a class="doc" rel="noopener noreferrer" target="_blank" href="'+esc(direct(d))+'">'+esc(d[1])+'<br><small>'+esc(d[0])+'</small></a>').join('')+'</details><p class="info"><a rel="noopener noreferrer" target="_blank" href="'+esc(originalSearch(c))+'">查询官方披露</a> · <a href="sources.html">查看来源与统计</a></p>';

}
function openReport(p,id,view='read',section='overview',restore=false){
  if(p.view==='shelf')p.shelfTop=p.node.querySelector('.content')?.scrollTop||0;
  if(view==='read'&&!restore)p.origin=p.view==='browse'?'browse':'shelf';
  if(p===panes[0]&&!restore){
    const route=view==='browse'?'browse':'company';
    history.pushState({origin:p.origin,fromApp:true},'','#'+route+'='+encodeURIComponent(id));
  }
  p.id=id;p.view=view;p.section=section;p.a=0;p.b=1;p.compare=false;p.pairChosen=false;
  recent=id;localStorage.setItem('shelf.recent',id);paint(p);
}
for(const p of panes){
  p.node.addEventListener('input',e=>{if(e.target.matches('input[type=search]')){p.q=e.target.value;p.limit=20;list(p);}});
  p.node.addEventListener('change',e=>{if(e.target.dataset.side){p[e.target.dataset.side]=Number(e.target.value);renderNumbers(p);p.node.querySelector('[data-side="'+e.target.dataset.side+'"]').focus({preventScroll:true});}});
  p.node.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.section){
      if(p.section===b.dataset.section)return;
      p.section=b.dataset.section;
      if(p===panes[0])history.replaceState(history.state,'','#company='+encodeURIComponent(p.id)+'&section='+p.section);
      const nav=b.closest('nav'),old=nav.querySelector('.active');
      old.removeAttribute('aria-current');old.classList.remove('active');
      b.classList.add('active');b.setAttribute('aria-current','page');
      nav.style.setProperty('--active',[...nav.children].indexOf(b));
      p.node.querySelector('.content').scrollTop=0;
      if(window.reportData[p.id])renderNumbers(p);
      else paint(p);
      return;
    }
    if(b.dataset.open){openReport(p,b.dataset.open);return;}
    if(b.hasAttribute('data-market')){p.market=b.dataset.market;p.limit=20;paint(p);return;}
    switch(b.dataset.action){
      case 'directory':p.directory=!p.directory;p.q='';p.limit=20;paint(p);break;
      case 'more':p.limit+=30;list(p);break;
      case 'back':
        if(p===panes[0]&&history.state?.fromApp){history.back();break;}
        p.view=p.origin;
        if(p===panes[0])history.replaceState(null,'',location.href.split('#')[0]);
        paint(p);break;
      case 'shelf':if(p===panes[0]&&location.hash)history.pushState(null,'',location.href.split('#')[0]);p.view='shelf';paint(p);break;
      case 'browse':case 'next':{
        openReport(p,randomCompany(),'browse');break;
      }
      case 'compare':{
        if(!p.pairChosen){p.pairChosen=true;const rows=window.reportData[p.id].p;const alt=rows.findIndex(r=>r[0]!==rows[0][0]&&r[3]===rows[0][3]);p.a=0;p.b=alt>0?alt:1;}
        p.compare=!p.compare;renderNumbers(p);p.node.querySelector('[data-action=compare]').focus({preventScroll:true});break;
      }
      case 'follow':if(follows.has(p.id))follows.delete(p.id);else follows.add(p.id);
        localStorage.setItem('shelf.follow',JSON.stringify([...follows]));
        for(const pane of panes){
          if(pane.view==='shelf')list(pane);
          else if(pane.id===p.id)pane.node.querySelector('[data-action=follow]').textContent=follows.has(p.id)?'✓ 已关注':'＋ 关注';
        }
        break;
      case 'retry':paint(p);break;
    }
  });
  paint(p);
}

function restoreRoute(){
  const params=new URLSearchParams(location.hash.slice(1)),p=panes[0];
  const company=params.get('company'),browse=params.get('browse');
  if(companies[company]){
    p.origin=history.state?.origin==='browse'?'browse':'shelf';
    const section=params.get('section');
    openReport(p,company,'read',Object.hasOwn(statementNames,section)?section:'overview',true);
  }else if(companies[browse])openReport(p,browse,'browse','overview',true);
  else if(p.view!=='shelf'){p.view='shelf';paint(p);}
}
window.addEventListener('hashchange',restoreRoute);
if(location.hash)restoreRoute();
