const statementNames={income:'利润表',balance:'资产负债表',cash:'现金流量表'};
function showStatements(host,p,kind=p.section){
 const c=companies[p.id],periods=window.reportData[p.id]?.p||[];
 if(!periods.length){host.textContent='暂无报表数据，可查阅下方披露文件。';return;}
 if(!c.numeric){host.innerHTML='<details class="details"><summary>已收录报告期（'+periods.length+'）</summary>'+periods.map(row=>'<div class="doc">'+esc(row[2])+' · '+esc(row[0])+' '+esc(row[3])+'</div>').join('')+'</details><p class="info">这些期间尚无可公开展示的结构化数字，可在下方打开披露原文。</p>';return;}
 const title=statementNames[kind]||'主要指标';
 const selected=p.compare?[periods[p.a],periods[p.b]]:periods;
 const columns=selected.map(period=>({period,state:'idle',lines:[],unit:''}));
 const note='金额按表头币种列示。';
 host.innerHTML=periodControls(p,periods,title)+
  '<div class="figures" role="region" tabindex="0" aria-label="'+title+'，横向滑动查看报告期"><table class="statement-grid '+(p.compare?'pair-grid':'')+'" style="width:'+(p.compare?'100%':'calc('+(selected.length*10)+'rem + min(42vw, 12rem))')+'"><colgroup><col style="width:'+(p.compare?'38%':'min(42vw, 12rem)')+'">'+selected.map(()=>'<col>').join('')+'</colgroup><thead><tr><th scope="col">科目</th>'+
  selected.map(r=>'<th scope="col"><b>'+esc(r[2])+'</b><br>'+esc(kind==='balance'?'期末余额':r[3])+' · <span class="currency">'+esc(r[4])+'</span><br>'+(kind==='balance'?esc(r[0]):esc(r[1])+' 至<br>'+esc(r[0]))+'<span class="column-status"></span></th>').join('')+
  '</tr></thead><tbody></tbody></table></div><p class="info">'+note+' 股数和每股值按科目列示。横线表示该期缺项。</p>';
 const scroller=host.querySelector('.figures'),headers=[...scroller.querySelectorAll('thead th')].slice(1);
 const body=scroller.querySelector('tbody');
 function drawRows(){
  const items=new Map();
  const hasFull=columns.some(col=>col.state==='ready');
  // A partially cached period must not put its short list ahead of the complete statement.
  for(const state of ['ready','partial'])columns.forEach((col,i)=>{
   if(col.state!==state)return;
   col.lines.forEach(([id,name,value,role='',unit])=>{
    if(hasFull&&state==='partial'&&role==='group')return;
    const key=c.m==='A'?id:id+'/'+name;
    if(!items.has(key))items.set(key,{id,name,role,unit:unit||(/股数|股份数目|股份数量/.test(name)?'shares':name.includes('每股')?'perShare':'amount'),values:[]});
    items.get(key).values[i]=value;
   });
  });
  let ordered=[...items.values()];
  
  if(kind==='overview'&&(c.m!=='A'||p.view==='browse'))ordered.sort((a,b)=>overviewOrder.indexOf(a.id)-overviewOrder.indexOf(b.id));
  body.innerHTML=ordered.map(({id,name,role,unit,values})=>{
   const cells=columns.map((col,i)=>{
    if(role==='group')return '<td></td>';
    const value=values[i];
    let display;
    if(value!=null)display=unit==='text'?value:reportNumber(value,unit,col.unit);
    else display=col.state==='partial'&&!(i in values)?'待载入':col.state==='error'?'未载入':col.state==='ready'||col.state==='partial'?'—':'…';
    const period=col.period;
    const token=c.m==='A'?period[0]:[period[0],period[1],period[6],period[4]].join('|');
    const flags=window.reportData[p.id]?.w?.[token];
    const pos=(kind==='overview'?overviewIds.indexOf(id):({TOTAL_OPERATE_INCOME:0,PARENT_NETPROFIT:1,BASIC_EPS:7,NETCASH_OPERATE:5,TOTAL_ASSETS:3,TOTAL_LIABILITIES:4})[id])??({
     '营业收入':0,'营业总收入':0,'归属于母公司股东净利润':1,'归属于母公司股东的净利润':1,
     '归属于母公司所有者的净利润':1,'资产总计':3,'负债合计':4,'总资产':3,'总负债':4,'经营活动产生的现金流量净额':5,'基本每股收益':7
    })[name];
    return '<td>'+esc(display)+(flags?.includes(pos)?' <small title="该期数据仍待核对">待核</small>':'')+'</td>';
   }).join('');
   return '<tr class="line-'+role+'"><th scope="row">'+esc(name)+'</th>'+cells+'</tr>';
  }).join('');
  if(!items.size)body.innerHTML='<tr><th scope="row">明细</th>'+columns.map(col=>'<td>'+({ready:'暂无明细',loading:'载入中…',error:'未载入',idle:'…'}[col.state])+'</td>').join('')+'</tr>';
 }
 async function loadColumn(i){
  const col=columns[i];
  if(col.state==='loading'||col.state==='ready')return;
  col.state='loading';
  const status=headers[i].querySelector('.column-status');
  status.textContent='载入中…';
  col.unit=col.period[4];
  const period=col.period, tables=window.reportData[p.id].tables||{};
  const values=period[5], positions={income:[0,1,7],balance:[3,4],cash:[5]};
  const detail=tables[[period[0],period[1],period[6],period[4]].join('|')]||tables[period[0]];
  col.lines=kind==='overview'?overviewLines(c,values):detail?.[kind]||positions[kind].filter(pos=>values[pos]!=null).map(pos=>[overviewIds[pos],fields[pos],values[pos],'key',pos===7?'perShare':'amount']);
  col.state='ready';
  status.textContent='';
  drawRows();
 }
 drawRows();
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   observer.unobserve(entry.target);loadColumn(headers.indexOf(entry.target));
  }
 },{root:scroller,rootMargin:'0px 80px'});
 headers.forEach(th=>observer.observe(th));
 p.stopColumns=()=>observer.disconnect();
 scroller.addEventListener('click',e=>{
  const retry=e.target.closest('[data-reload]');
  if(retry)loadColumn(Number(retry.dataset.reload));
 });
}
