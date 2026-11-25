if ('serviceWorker' in navigator) {
  if(navigator.serviceWorker.controller)navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    for (const note of document.querySelectorAll('[data-offline]')) {
      note.textContent = '已打开的公司可离线重读。首次查看其他公司或打开原文需要联网。';
    }
  }).catch(() => {});
}
