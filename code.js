figma.showUI(__html__,{width:240,height:120,themeColors:!0});let anode,aparent,p1,refreshRate=150,nodeAry=[],handle,handleWeight,origin,initialRotation,updateIntervalId=null,childCount=0,pixelsRounding=!1,originAlignment=!0;figma.ui.onmessage=e=>{const{nodeCount:n,align2origin:t,round2pixels:l}=e;if(t!==void 0&&(originAlignment=t),l!==void 0&&(pixelsRounding=l),childCount=+n||childCount,!(childCount<=1))if(anode)n&&(clearNodeAry(),createChild(),handle||createHandle(),updateIntervalId||refreshcanvas()),updateChild();else{if(figma.currentPage.selection.length>1){notify("Select one node. Multiple nodes are not supported"),partialReset();return}if(figma.currentPage.selection.length===0){notify("Select atleast one node."),partialReset();return}anode=figma.currentPage.selection[0],aparent=anode.parent,initialRotation=anode.rotation,initialRotation?(anode.rotation=0,origin=[anode.x+anode.width/2,anode.y+anode.height*2],p1=[anode.x+anode.width/2,anode.y+anode.height/2],anode.relativeTransform=getRelativeTranform(initialRotation,anode)):(origin=[anode.x+anode.width/2,anode.y+anode.height*2],p1=[anode.x+anode.width/2,anode.y+anode.height/2]),createChild(),updateChild(),createHandle(),refreshcanvas()}},figma.on("close",()=>{removeHandle()});function notify(e,n=2e3,t=!1){figma.notify(e,{timeout:n,error:t})}function createChild(){if(anode.type==="COMPONENT")for(let e=0;e<childCount-1;e++)nodeAry.push(anode.createInstance());else for(let e=0;e<childCount-1;e++)nodeAry.push(anode.clone());nodeAry.forEach((e,n)=>aparent.insertChild(n,e))}function updateChild(e=childCount){function n(r,i,o){let a=360/r,f=[];function c(s,u,d){const g=m=>Math.sin(Math.PI/180*m),M=m=>Math.cos(Math.PI/180*m);let y=u[0]+M(s)*(d[0]-u[0])+g(s)*(d[1]-u[1]),v=u[1]-g(s)*(d[0]-u[0])+M(s)*(d[1]-u[1]);return[y,v]}for(let s=0;s<r-1;s++){let u=c(a,i,o);f.push(u),o=u}return f}function t(r){let i=360/r,o=[];if(originAlignment)for(let a=0;a<r;a++){let f=(a+1)*-i;o.push(f)}else for(let a=0;a<r;a++)o.push(0);return o.pop(),o.reverse()}let l=n(+e,origin,p1),h=t(+e);nodeAry.forEach((r,i)=>{if(r.removed){clearNodeAry(),createChild(),updateChild();return}r.x=l[i][0]-anode.width/2,r.y=l[i][1]-anode.height/2}),h.forEach((r,i)=>{let o=r;initialRotation&&(o=o+initialRotation),nodeAry[i].relativeTransform=getRelativeTranform(o,nodeAry[i])})}function createHandle(){handle=figma.createLine(),handle.name="handle",handle.resize(.01,0),handleWeight=anode.height/5.5,handle.strokeWeight=handleWeight,handle.strokeAlign="CENTER",handle.strokeCap="ROUND",handle.strokes=[{blendMode:"NORMAL",color:{r:1,g:0,b:0},opacity:1,type:"SOLID",visible:!0}],handle=handle,handle.x=origin[0],handle.y=origin[1],aparent.insertChild(0,handle)}function getRelativeTranform(e,n){let t=e*(Math.PI/180),l=n.x+n.width/2,h=n.y+n.height/2,r=Math.cos(t)*n.x+n.y*Math.sin(t)-h*Math.sin(t)-l*Math.cos(t)+l,i=-Math.sin(t)*n.x+l*Math.sin(t)+n.y*Math.cos(t)-h*Math.cos(t)+h;return pixelsRounding&&(r=Math.round(r),i=Math.round(i)),n.relativeTransform=[[Math.cos(t),Math.sin(t),r],[-Math.sin(t),Math.cos(t),i]]}function refreshcanvas(){updateIntervalId=setInterval(()=>{if(anode.removed){notify("The Root node has been removed!",3e3,!0),clearNodeAry(),figma.closePlugin();return}if(anode.rotation!==initialRotation&&(initialRotation=anode.rotation,updateChild()),handle.removed){reset();return}(origin[0]!==handle.x||origin[1]!==handle.y)&&(origin=[handle.x,handle.y],updateChild()),p1=getCenter([anode.x,anode.y],anode.width,anode.height,initialRotation)},refreshRate)}function getCenter(e,n,t,l){if(!initialRotation){let c=e[0]+n/2,s=e[1]+t/2;return[c,s]}const h=c=>Math.sin(Math.PI/180*c),r=c=>Math.cos(Math.PI/180*c);let i=90-l,o=[e[0]+r(l)*n,e[1]-h(l)*n],a=[e[0]+r(i)*t,e[1]+h(i)*t];return[(a[0]+o[0])/2,(a[1]+o[1])/2]}function partialReset(){figma.ui.postMessage({type:"clearInput"}),clearNodeAry(),removeHandle(),initialRotation=null,childCount=null}function reset(){clearNodeAry(),removeHandle(),figma.ui.postMessage({type:"clearInput"}),anode=null,aparent=null,p1=null,origin=null,initialRotation=null,childCount=null}function clearNodeAry(){nodeAry.forEach(e=>{e.removed||e.remove()}),nodeAry.length=0}function removeHandle(){handle&&!handle.removed&&(handle.remove(),handle=null),clearInterval(updateIntervalId),updateIntervalId=null}
