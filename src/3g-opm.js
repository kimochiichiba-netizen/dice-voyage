function dvOpm(ctx, id, T){
  var W=240,H=340,cx=120;

  /* ================= helpers ================= */
  function hxa(c){
    if(c.charAt(0)==='#'){var n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
    var m=c.substring(c.indexOf('(')+1).split(',');
    return [parseFloat(m[0])||0,parseFloat(m[1])||0,parseFloat(m[2])||0];
  }
  function cs(r,g,b){r=r<0?0:(r>255?255:r);g=g<0?0:(g>255?255:g);b=b<0?0:(b>255?255:b);return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';}
  function dk(c,f){var a=hxa(c);return cs(a[0]*(1-0.44*f),a[1]*(1-0.54*f),a[2]*(1-0.24*f)+16*f);}
  function lt(c,f){var a=hxa(c);return cs(a[0]+(255-a[0])*f,a[1]+(250-a[1])*f,a[2]+(228-a[2])*f);}
  function AP(p,cl){ctx.moveTo(p[0][0],p[0][1]);
    for(var i=1;i<p.length;i++){var q=p[i];
      if(q.length===6)ctx.bezierCurveTo(q[0],q[1],q[2],q[3],q[4],q[5]);
      else if(q.length===4)ctx.quadraticCurveTo(q[0],q[1],q[2],q[3]);
      else ctx.lineTo(q[0],q[1]);}
    if(cl)ctx.closePath();}
  function P(p,cl){ctx.beginPath();AP(p,cl);}
  function P2(a,b){ctx.beginPath();AP(a,true);AP(b,true);}
  function FP(p,c){P(p,true);ctx.fillStyle=c;ctx.fill();}
  function SP(p,c,w,cl){P(p,!!cl);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}
  function CL(p,fn){ctx.save();P(p,true);ctx.clip();fn();ctx.restore();}
  function ci(x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fillStyle=c;ctx.fill();}
  function cio(x,y,r,c,w){ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}
  function rimP(p){P(p,true);ctx.fillStyle='#FFFFFF';ctx.fill();ctx.strokeStyle='#FFFFFF';ctx.lineWidth=4.6;ctx.lineJoin='round';ctx.stroke();}
  function rimS(p,w){P(p,false);ctx.strokeStyle='#FFFFFF';ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();}
  function rnd(s){var x=Math.sin((s+1.7)*12.9898+(id+1)*78.233)*43758.5453;return x-Math.floor(x);}

  /* ================= background ================= */
  (function(){
    var g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#3A80CE');g.addColorStop(0.40,'#6CACE7');g.addColorStop(0.70,'#A8D2F0');g.addColorStop(1,'#8B93CC');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    function puff(px,py,s,base,shad){
      var o=[[0,0,1],[-0.94,0.22,0.68],[0.96,0.24,0.64],[-0.46,-0.46,0.64],[0.54,-0.38,0.58],[1.64,0.46,0.42],[-1.64,0.48,0.40]],i;
      for(i=0;i<o.length;i++)ci(px+o[i][0]*s,py+o[i][1]*s+s*0.32,o[i][2]*s*0.90,shad);
      for(i=0;i<o.length;i++)ci(px+o[i][0]*s,py+o[i][1]*s,o[i][2]*s*0.90,base);
    }
    var k;
    for(k=0;k<7;k++)puff(rnd(k+3)*272-26,14+rnd(k+7)*168,9+rnd(k)*13,'#FFFFFF','#B8D4EE');
    for(k=0;k<5;k++)puff(rnd(k+31)*280-26,274+rnd(k+41)*62,14+rnd(k+21)*16,'#8878BE','#6B5A9E');
    var rg=ctx.createRadialGradient(cx,160,8,cx,160,150);
    rg.addColorStop(0,'rgba(255,255,255,0.46)');rg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  })();

  /* ================= character table ================= */
  var CH=[
    {sk:0,eye:'#8A4A1E',m:'#F2C21E',s:'#C0392B',hr:'#E8C24A',sw:64,fem:0,brow:-2.0,mth:0.4},
    {sk:1,eye:'#2E7FD0',m:'#3E8FE0',s:'#EAF6FF',hr:'#9AD6EE',sw:48,fem:1,brow:0.0,mth:0.8},
    {sk:2,eye:'#3E9B4E',m:'#4E7A2E',s:'#C9A05A',hr:'#6B4A2A',sw:61,fem:0,brow:-2.6,mth:0.2},
    {sk:1,eye:'#E8B92E',m:'#7B4FBE',s:'#F6E27A',hr:'#8E5FD0',sw:47,fem:1,brow:-1.4,mth:0.0},
    {sk:0,eye:'#D22B2B',m:'#212838',s:'#D22B2B',hr:'#1A1D26',sw:59,fem:0,brow:-2.8,mth:-0.2},
    {sk:1,eye:'#E86AA0',m:'#E86AA0',s:'#FFF0F5',hr:'#F291B8',sw:46,fem:1,brow:1.4,mth:2.6},
    {sk:0,eye:'#6B7C95',m:'#2A2E3A',s:'#C8CCD8',hr:'#C9CEDA',sw:57,fem:0,brow:-1.0,mth:0.6},
    {sk:2,eye:'#3E9B4E',m:'#E0762A',s:'#5AA8C8',hr:'#EE8A32',sw:49,fem:1,brow:-0.8,mth:2.2},
    {sk:0,eye:'#2A2E36',m:'#2E3440',s:'#9AA6B8',hr:'#E6EAF0',sw:63,fem:0,brow:-3.0,mth:-0.4},
    {sk:1,eye:'#3FBF87',m:'#3FBF87',s:'#101418',hr:'#3FBF87',sw:45,fem:1,brow:-2.2,mth:0.0},
    {sk:2,eye:'#7A4A2A',m:'#D8632C',s:'#EFE8D6',hr:'#2A1A12',sw:70,fem:0,brow:-3.2,mth:0.4}
  ];
  var SKN=[
    {b:'#F3C2A2',s:'#CE8E6E',d:'#A9654A',ln:'#7A4032'},
    {b:'#FAE1CE',s:'#DBAB92',d:'#BC826E',ln:'#8A5344'},
    {b:'#C88D64',s:'#9C603C',d:'#77442A',ln:'#542C1B'}
  ];
  var C=CH[id],SK=SKN[C.sk];
  var hb=C.hr,hs=dk(hb,0.30),hd=dk(hb,0.58),hl=lt(hb,0.32);
  var t=T*0.001;
  var bob=Math.sin(t*1.5+id*0.7)*1.2;
  var swy=Math.sin(t*1.05+id*1.3);

  /* ================= geometry ================= */
  var sw=C.sw,fem=C.fem;
  var shY=126;
  var nw=fem?11:13.5;
  var hy=30,ey=68,chin=fem?98:100,fw=fem?24.5:26;
  var ny=ey+12,my=ey+21;
  var chW=sw*0.74,waW=sw*0.56,hpW=sw*0.70;

  var dL=(id%2)?-4:4,dR=-dL;
  var torso=[
    [cx-nw-4,110],
    [cx-sw*0.26,113+dL*0.4, cx-sw*0.50,124+dL, cx-sw*0.60,136+dL],
    [cx-chW-1,178],
    [cx-waW,256],
    [cx-hpW,300],
    [cx-hpW-1,341],
    [cx+hpW+1,341],
    [cx+hpW,300],
    [cx+waW,256],
    [cx+chW+1,178],
    [cx+sw*0.60,136+dR],
    [cx+sw*0.50,124+dR, cx+sw*0.26,113+dR*0.4, cx+nw+4,110]
  ];
  function armP(g){var d=(g<0)?dL:dR;return [
    [cx+g*sw*0.34,110+d*0.5],
    [cx+g*sw*0.86,112+d, cx+g*sw*1.10,146+d, cx+g*sw*1.12,176+d*0.6],
    [cx+g*sw*1.14,250],
    [cx+g*sw*1.06,341],
    [cx+g*sw*0.80,341],
    [cx+g*sw*0.76,254],
    [cx+g*sw*0.66,202, cx+g*sw*0.52,176, cx+g*sw*0.46,152]
  ];}
  var neck=[[cx-nw*0.86,chin-13],[cx-nw*0.98,chin+4, cx-nw-4,112, cx-nw-7,126],[cx+nw+7,126],[cx+nw+4,112, cx+nw*0.98,chin+4, cx+nw*0.86,chin-13]];
  var face=[
    [cx,hy],
    [cx+fw*0.88,hy+1, cx+fw,hy+15, cx+fw,ey-4],
    [cx+fw,ey+11, cx+fw*0.99,ey+18, cx+fw*0.90,ey+23],
    [cx+fw*0.80,ey+28],
    [cx+fw*0.58,chin-3, cx+fw*0.30,chin, cx,chin],
    [cx-fw*0.30,chin, cx-fw*0.58,chin-3, cx-fw*0.80,ey+28],
    [cx-fw*0.90,ey+23],
    [cx-fw*0.94,ey+16, cx-fw,ey+9, cx-fw,ey-4],
    [cx-fw,hy+15, cx-fw*0.88,hy+1, cx,hy]
  ];

  /* ================= hair ================= */
  function fringe(n,amp,tilt){
    var a=[],i,span=2*fw+8;
    for(i=0;i<n;i++){
      var u0=i/n,u1=(i+0.55)/n,u2=(i+1)/n;
      function bx(u){return cx-fw-4+u*span;}
      function by(u){return ey-23+Math.abs(u-0.40)*13+tilt*(u-0.5)*8;}
      var g=1+0.55*Math.sin(i*2.3+id);
      a.push([bx(u0),by(u0)-amp*0.30]);
      a.push([bx(u1),by(u1)+amp*g]);
      a.push([bx(u2),by(u2)-amp*0.30]);
    }
    return a;
  }
  function capTop(){return [[cx+fw+4,ey-2],[cx+fw+8,hy+2, cx+fw*0.74,hy-9, cx,hy-8],[cx-fw*0.74,hy-9, cx-fw-8,hy+2, cx-fw-4,ey-2]];}
  function cap(n,amp,tilt){return capTop().concat(fringe(n,amp,tilt));}

  function hairShapes(){
    var back=null,front=null,lump=null;
    if(id===0){front=cap(7,8,0.7);
      back=[[cx-fw-5,ey-4],[cx-fw-13,hy+6, cx-fw*0.4,hy-17, cx+5,hy-15],[cx+fw*0.8,hy-15, cx+fw+13,hy+4, cx+fw+5,ey-4]];}
    else if(id===1){front=cap(6,3,0.9);
      back=[[cx-fw-6,ey-10],[cx-fw-22,ey+42, cx-sw*1.02,190, cx-sw*0.80,244],[cx-18,232],[cx-9,150],[cx+9,150],[cx+18,232],[cx+sw*0.80,244],[cx+sw*1.02,190, cx+fw+22,ey+42, cx+fw+6,ey-10]];}
    else if(id===2){front=cap(6,5,0.4);}
    else if(id===3){front=cap(6,4,-0.7);
      back=[[cx-fw-6,ey-10],[cx-fw-15,ey+18, cx-fw-13,ey+38, cx-fw-5,ey+48],[cx-fw*0.5,ey+42],[cx+fw*0.5,ey+42],[cx+fw+5,ey+48],[cx+fw+13,ey+38, cx+fw+15,ey+18, cx+fw+6,ey-10]];}
    else if(id===4){front=cap(6,5,-0.4);
      back=[[cx-fw-6,ey-12],[cx-fw-13,ey+14, cx-fw-11,ey+26, cx-fw-4,ey+32],[cx,ey+28],[cx+fw+4,ey+32],[cx+fw+11,ey+26, cx+fw+13,ey+14, cx+fw+6,ey-12]];
      lump=[[cx+3,hy-10],[cx+15,hy-26, cx+31,hy-15, cx+25,hy-1],[cx+17,hy+5],[cx+9,hy-4]];}
    else if(id===5){front=cap(8,2,0.0);
      back=[[cx-fw-7,ey-12],[cx-fw-18,ey+20, cx-fw-16,ey+44, cx-fw-2,ey+54],[cx-fw*0.4,ey+44],[cx+fw*0.4,ey+44],[cx+fw+2,ey+54],[cx+fw+16,ey+44, cx+fw+18,ey+20, cx+fw+7,ey-12]];}
    else if(id===6){front=cap(5,1.6,1.5);}
    else if(id===7){front=cap(6,4,0.8);
      back=[[cx+fw-2,hy-6],[cx+fw+26,hy-28, cx+fw+46,ey+8, cx+fw+28,ey+58],[cx+fw+13,ey+52],[cx+fw+26,ey+10, cx+fw+16,hy+4, cx+fw-7,hy+7]];}
    else if(id===8){front=cap(7,7,-1.1);
      back=[[cx-fw-5,ey-6],[cx-fw-17,hy+6, cx-fw*0.3,hy-19, cx+7,hy-15],[cx+fw*0.9,hy-15, cx+fw+17,hy+4, cx+fw+5,ey-6]];}
    return {b:back,f:front,l:lump};
  }
  var HS=hairShapes();

  function curls(mode){
    var i,list=[],n=14;
    for(i=0;i<n;i++){
      var a=-3.05+i*(6.1/(n-1));
      var x=cx+Math.cos(a)*(fw+19)*1.05, y=(ey-20)+Math.sin(a)*(fw+17)*0.94;
      list.push([x,y,8.4+3.0*Math.sin(i*1.9)]);
    }
    list.push([cx,hy-17,10.5]);list.push([cx-19,hy-11,9.5]);list.push([cx+19,hy-11,9.5]);
    list.push([cx-33,hy+3,8.6]);list.push([cx+33,hy+3,8.6]);
    list.push([cx-9,ey-22,7.8]);list.push([cx+10,ey-21,7.4]);
    for(i=0;i<list.length;i++){
      var q=list[i];
      if(mode==='rim'){cio(q[0],q[1],q[2]+1.2,'#FFFFFF',4.5);ci(q[0],q[1],q[2]+1.2,'#FFFFFF');}
      else if(mode==='back'){ci(q[0],q[1],q[2],hb);ci(q[0]-q[2]*0.3,q[1]-q[2]*0.32,q[2]*0.6,hl);ci(q[0]+q[2]*0.34,q[1]+q[2]*0.30,q[2]*0.44,hs);cio(q[0],q[1],q[2],hd,1.3);}
      else if(Math.abs(q[0]-cx)>fw+1||q[1]<hy+4){ci(q[0],q[1],q[2],hb);ci(q[0]-q[2]*0.28,q[1]-q[2]*0.32,q[2]*0.58,hl);ci(q[0]+q[2]*0.34,q[1]+q[2]*0.30,q[2]*0.44,hs);cio(q[0],q[1],q[2],hd,1.3);}
    }
  }

  function drawHairPart(p,mode){
    if(!p)return;
    if(mode==='rim'){rimP(p);return;}
    FP(p,hb);
    CL(p,function(){
      FP([[cx+fw*0.22,hy-40],[cx+200,hy-40],[cx+200,ey+90],[cx+fw*0.06,ey+90]],hs);
      FP([[cx+fw*0.80,hy-40],[cx+200,hy-40],[cx+200,ey+90],[cx+fw*0.62,ey+90]],hd);
      FP([[cx-fw*1.15,hy-2],[cx-fw*0.10,hy-14],[cx-fw*0.36,ey-16],[cx-fw*1.25,ey-4]],hl);
      FP([[cx-200,ey+8],[cx-fw*1.0,ey-2],[cx-fw*0.95,ey+90],[cx-200,ey+90]],hs);
    });
    SP(p,hd,2.0,true);
  }
  function hairStrands(){
    if(id===9||id===10||id===2)return;
    var i;
    for(i=0;i<5;i++){
      var u=i/4,x0=cx-fw*0.9+u*fw*1.8;
      SP([[x0,hy-3],[x0-5+u*11,ey-26, x0-9+u*18,ey-11]],hd,1.0,false);
    }
  }

  /* ================= face ================= */
  function ear(g){
    var ex=cx+g*(fw-1.5),eyy=ey+3;
    var p=[[ex,eyy-9],[ex+g*6,eyy-9, ex+g*5.6,eyy+6, ex-g*0.5,eyy+9]];
    P(p,true);ctx.fillStyle=SK.b;ctx.fill();
    SP(p,SK.ln,1.4,false);
    SP([[ex+g*1.8,eyy-4],[ex+g*3.8,eyy-1, ex+g*2.0,eyy+4]],SK.d,1.0,false);
  }
  function foreShade(){
    return [[cx-fw-3,hy-4],[cx+fw+3,hy-4],[cx+fw+3,ey-16],[cx+fw*0.45,ey-9],[cx-fw*0.15,ey-18],[cx-fw*0.72,ey-8],[cx-fw-3,ey-17]];
  }
  function drawHead(){
    FP(face,SK.b);
    CL(face,function(){
      FP([[cx+fw*0.52,hy-8],[cx+fw*1.5,hy-8],[cx+fw*1.5,chin+6],[cx+fw*0.34,chin+6],[cx+fw*0.50,ey+22],[cx+fw*0.78,ey+4]],SK.s);
      FP([[cx+fw*0.86,ey-18],[cx+fw*1.5,ey-22],[cx+fw*1.5,ey+16],[cx+fw*0.80,ey+6]],SK.d);
      FP([[cx-fw*1.5,ey+6],[cx-fw*0.98,ey-4],[cx-fw*0.92,ey+16],[cx-fw*1.5,ey+22]],SK.s);
      FP(foreShade(),SK.s);
      FP([[cx-fw*0.66,chin-4],[cx-fw*0.30,chin-8, cx+fw*0.30,chin-8, cx+fw*0.66,chin-4],[cx+fw*0.44,chin+5],[cx-fw*0.44,chin+5]],SK.s);
      FP([[cx-fw*1.5,hy-8],[cx-fw*0.84,hy-8],[cx-fw*1.02,ey-18],[cx-fw*1.5,ey-12]],SK.s);
    });
    SP(face,SK.ln,2.2,true);
  }
  function drawFeat(){
    var eh=fem?6.6:5.6,eo=fem?21.6:22.4,ein=fem?6.6:7.4,eyv=ey;
    function qp(a,b,c,u){var v=1-u;return [v*v*a[0]+2*v*u*b[0]+u*u*c[0], v*v*a[1]+2*v*u*b[1]+u*u*c[1]];}
    function eye(g){
      var ox=cx+g*eo,ix=cx+g*ein,mx=cx+g*(eo+ein)/2;
      var a0=[ox,eyv+2.4],a1=[mx+g*1.5,eyv-eh-5.2],a2=[ix,eyv-1.6];
      var b1=[mx-g*0.5,eyv+eh*1.85];
      var top=[a0,[a1[0],a1[1],a2[0],a2[1]]];
      var bot=[a2,[b1[0],b1[1],a0[0],a0[1]]];
      var full=[a0,[a1[0],a1[1],a2[0],a2[1]],[b1[0],b1[1],a0[0],a0[1]]];
      P(full,true);ctx.fillStyle='#F5F8FC';ctx.fill();
      ctx.save();P(full,true);ctx.clip();
      ci(mx,eyv-0.2,eh*1.20,dk(C.eye,.50));
      ci(mx,eyv-0.6,eh*1.00,C.eye);
      ci(mx,eyv+eh*0.34,eh*0.68,lt(C.eye,.42));
      ci(mx,eyv-0.2,eh*0.38,'#0D1015');
      FP([[ox+g*6,eyv-eh-7],[ix-g*6,eyv-eh-7],[ix-g*6,eyv-eh*0.52],[ox+g*6,eyv-eh*0.16]],'rgba(64,74,98,0.34)');
      ci(mx-g*eh*0.46,eyv-eh*0.80,eh*0.36,'#FFFFFF');
      ci(mx+g*eh*0.46,eyv+eh*0.60,eh*0.18,'rgba(255,255,255,0.9)');
      ctx.restore();
      var la=[],lb=[],i;
      for(i=0;i<=9;i++){var u=i/9,q=qp(a0,a1,a2,u),w=(fem?4.0:3.4)-(fem?2.6:2.2)*u;
        la.push([q[0],q[1]]);lb.unshift([q[0],q[1]+w]);}
      FP(la.concat(lb),'#221A22');
      FP([[a0[0],a0[1]-1],[a0[0]+g*4.2,a0[1]-2.6],[a0[0]+g*3.0,a0[1]+1.4],[a0[0],a0[1]+2.2]],'#221A22');
      SP(bot,SK.d,1.1,false);
      var by=eyv-(fem?12:11);
      SP([[cx+g*(eo+2.6),by+4.0],[cx+g*(eo*0.52),by-2.2, cx+g*(ein+0.2),by+C.brow]],hd,fem?2.2:3.0,false);
    }
    eye(-1);eye(1);
    FP([[cx-2.6,ny+2.4],[cx+0.4,ny-3.0],[cx+3.4,ny-2.0],[cx+4.4,ny+1.6],[cx+3.2,ny+2.8]],SK.s);
    SP([[cx+3.2,ey+2],[cx+4.4,ny-4, cx+4.2,ny-0.6, cx+1.2,ny+0.2]],SK.d,1.3,false);
    ci(cx+1.4,ny-1.6,1.3,lt(SK.b,.70));
    SP([[cx-3.6,ny+0.8],[cx-2.2,ny+2.4, cx-0.4,ny+2.2]],SK.d,1.0,false);
    SP([[cx+4.8,ny+0.6],[cx+3.4,ny+2.4, cx+1.6,ny+2.4]],SK.d,1.0,false);
    var mw=fem?6.4:8.6,me=my+(fem?-1.2:1.0);
    SP([[cx-mw,me],[cx-mw*0.34,my+C.mth+0.5, cx+0.4,my+C.mth]],dk(SK.ln,.10),1.9,false);
    SP([[cx+0.4,my+C.mth],[cx+mw*0.46,my+C.mth-0.2, cx+mw,me-0.4]],dk(SK.ln,.10),1.9,false);
    FP([[cx-mw*0.62,my+2.4],[cx+mw*0.62,my+2.0],[cx+mw*0.38,my+4.6],[cx-mw*0.38,my+4.6]],SK.s);
    if(fem){ctx.save();ctx.globalAlpha=0.34;
      var i;for(i=0;i<3;i++)SP([[cx-fw*0.84+i*2.6,ey+9],[cx-fw*0.64+i*2.6,ey+13]],'#D9646A',1.0,false);
      ctx.restore();}
    if(id===2){SP([[cx+fw*0.50,ey+3],[cx+fw*0.88,ey+14]],dk(SK.d,.28),1.8,false);
      SP([[cx+fw*0.54,ey+9],[cx+fw*0.82,ey+7]],dk(SK.d,.28),1.2,false);}
    if(id===8){SP([[cx-fw*0.34,ey-17],[cx-fw*0.56,ey-5]],dk(SK.d,.30),1.5,false);}
  }
  function drawNeck(){
    FP(neck,SK.b);
    CL(neck,function(){
      FP([[cx-nw-4,chin-14],[cx+nw+4,chin-14],[cx+nw+4,chin-1],[cx+fw*0.3,chin+3],[cx-fw*0.3,chin+3],[cx-nw-4,chin-1]],SK.d);
      FP([[cx+2,chin-14],[cx+nw+4,chin-14],[cx+nw+4,128],[cx+4,128]],SK.s);
      FP([[cx-nw-4,chin-14],[cx-nw+2,chin-14],[cx-nw+1,128],[cx-nw-4,128]],SK.s);
    });
    SP([[cx-7.5,chin-4],[cx-8.5,chin+7, cx-5,118, cx-3,124]],SK.d,1.4,false);
    SP([[cx+7.5,chin-4],[cx+8.5,chin+7, cx+5,118, cx+3,124]],SK.d,1.4,false);
    SP([[cx-nw*0.86,chin-13],[cx-nw*0.98,chin+4, cx-nw-4,112, cx-nw-7,126]],SK.ln,1.9,false);
    SP([[cx+nw*0.86,chin-13],[cx+nw*0.98,chin+4, cx+nw+4,112, cx+nw+7,126]],SK.ln,1.9,false);
  }

  /* ================= body ================= */
  function pecs(col){
    SP([[cx,138],[cx-1.5,156, cx-2,176, cx,190]],dk(col,.55),1.5,false);
    FP([[cx-chW*0.96,172],[cx-2,188],[cx-2,198],[cx-chW*0.92,184]],dk(col,.40));
    FP([[cx+chW*0.96,172],[cx+2,188],[cx+2,198],[cx+chW*0.92,184]],dk(col,.40));
    SP([[cx-chW*0.96,170],[cx-chW*0.40,186, cx-2,188]],dk(col,.56),1.4,false);
    SP([[cx+chW*0.96,170],[cx+chW*0.40,186, cx+2,188]],dk(col,.56),1.4,false);
    SP([[cx,198],[cx,262]],dk(col,.42),1.1,false);
    SP([[cx-11,214],[cx+11,214]],dk(col,.34),1.0,false);
    SP([[cx-10,236],[cx+10,236]],dk(col,.32),1.0,false);
    SP([[cx-8.5,256],[cx+8.5,256]],dk(col,.30),0.9,false);
    FP([[cx-chW,196],[cx-13,204],[cx-14,250],[cx-waW-2,238]],dk(col,.22));
    FP([[cx+chW,196],[cx+13,204],[cx+14,250],[cx+waW+2,238]],dk(col,.28));
  }
  function clav(col){
    SP([[cx-nw-3,120],[cx-sw*0.30,128, cx-sw*0.52,124]],dk(col,.46),1.3,false);
    SP([[cx+nw+3,120],[cx+sw*0.30,128, cx+sw*0.52,124]],dk(col,.46),1.3,false);
  }
  function folds(col){
    var i,d1=dk(col,.40),d2=dk(col,.30);
    for(i=0;i<7;i++){
      var u=i/6,y0=190+u*140,g=(i%2)?1:-1;
      var x0=cx+g*(chW*0.26+u*chW*0.34);
      SP([[x0-g*(10+u*6),y0-6],[x0,y0+3],[x0+g*(8+u*5),y0-3]],d1,1.2,false);
    }
    SP([[cx-chW*0.92,150],[cx-chW*0.46,168, cx-chW*0.60,184]],d2,1.3,false);
    SP([[cx+chW*0.92,150],[cx+chW*0.46,168, cx+chW*0.60,184]],d2,1.3,false);
    SP([[cx-chW*0.80,196],[cx-chW*0.34,210, cx-chW*0.52,224]],d2,1.1,false);
    SP([[cx+chW*0.80,196],[cx+chW*0.34,210, cx+chW*0.52,224]],d2,1.1,false);
  }
  function baseTorso(col){
    FP(torso,col);
    CL(torso,function(){
      FP([[cx+sw*0.04,96],[cx+sw*0.38,96],[cx+sw*1.2,224],[cx+sw*1.2,346],[cx-sw*0.04,346]],dk(col,.30));
      FP([[cx+sw*0.58,146],[cx+sw*1.2,146],[cx+sw*1.2,346],[cx+sw*0.40,346]],dk(col,.52));
      FP([[cx-sw*1.2,156],[cx-sw*0.66,146],[cx-sw*0.50,346],[cx-sw*1.2,346]],dk(col,.36));
      FP([[cx-sw*0.44,106],[cx-sw*0.02,116],[cx-sw*0.10,176],[cx-sw*0.50,152]],lt(col,.18));
      FP([[cx-nw-16,100],[cx+nw+16,100],[cx+nw+26,126],[cx,138],[cx-nw-26,126]],dk(col,.48));
      FP([[cx-chW-4,140],[cx-chW*0.62,150],[cx-chW*0.70,346],[cx-chW-6,346]],dk(col,.44));
      FP([[cx+chW+4,140],[cx+chW*0.62,150],[cx+chW*0.70,346],[cx+chW+6,346]],dk(col,.56));
      folds(col);
    });
    SP(torso,dk(col,.68),2.3,true);
  }
  function drawArm(g){
    var a=armP(g),mech=(C.mech===g),col=C.m,bare=(C.bare===2||C.bare===g);
    if(mech){
      var mc=C.mc;
      FP(a,mc);
      CL(a,function(){
        FP([[cx+g*sw*1.5,100],[cx+g*sw*1.00,106],[cx+g*sw*0.96,346],[cx+g*sw*1.5,346]],dk(mc,.34));
        FP([[cx+g*sw*0.34,106],[cx+g*sw*0.74,124],[cx+g*sw*0.82,346],[cx+g*sw*0.62,346]],dk(mc,.48));
        FP([[cx+g*sw*1.08,128],[cx+g*sw*0.74,142],[cx+g*sw*0.78,192],[cx+g*sw*1.10,180]],lt(mc,.34));
        var yy=[164,198,230,262,292,320],i;
        for(i=0;i<yy.length;i++){
          FP([[cx+g*sw*0.66,yy[i]],[cx+g*sw*1.22,yy[i]-4],[cx+g*sw*1.22,yy[i]+4],[cx+g*sw*0.66,yy[i]+8]],dk(mc,.58));
          SP([[cx+g*sw*0.66,yy[i]+8],[cx+g*sw*1.22,yy[i]+4]],lt(mc,.46),1.0,false);
        }
        ci(cx+g*sw*0.94,152,5.2,id===8?'#6ED0F0':'#F0D24A');
        ci(cx+g*sw*0.94,152,2.6,'#FFFFFF');
        FP([[cx+g*sw*0.84,206],[cx+g*sw*0.91,206],[cx+g*sw*0.91,308],[cx+g*sw*0.84,308]],id===8?'#6ED0F0':'#F0D24A');
      });
      SP(a,dk(mc,.66),2.2,true);
      return;
    }
    var cc=bare?SK.b:col;
    FP(a,cc);
    CL(a,function(){
      FP([[cx+g*sw*1.5,100],[cx+g*sw*1.00,106],[cx+g*sw*0.96,346],[cx+g*sw*1.5,346]],bare?SK.s:dk(cc,g>0?.42:.30));
      FP([[cx+g*sw*0.34,106],[cx+g*sw*0.72,124],[cx+g*sw*0.80,346],[cx+g*sw*0.60,346]],bare?SK.s:dk(cc,.34));
      if(g<0)FP([[cx+g*sw*1.12,126],[cx+g*sw*0.70,142],[cx+g*sw*0.76,196],[cx+g*sw*1.14,182]],bare?lt(SK.b,.26):lt(cc,.16));
      if(bare){
        FP([[cx+g*sw*0.78,244],[cx+g*sw*1.16,236],[cx+g*sw*1.16,256],[cx+g*sw*0.78,262]],SK.s);
        SP([[cx+g*sw*0.84,166],[cx+g*sw*1.00,182, cx+g*sw*0.98,202]],SK.d,1.2,false);
      }
    });
    CL(a,function(){
      FP([[cx+g*sw*1.22,152],[cx+g*sw*1.04,158],[cx+g*sw*1.00,346],[cx+g*sw*1.22,346]],bare?lt(SK.b,.22):lt(cc,.24));
    });
    SP(a,bare?SK.ln:dk(cc,.68),2.3,true);
    SP([[cx+g*sw*0.48,152],[cx+g*sw*0.86,170, cx+g*sw*0.94,196, cx+g*sw*0.84,218]],bare?SK.d:dk(cc,.54),1.4,false);
    if(!bare){var fk=dk(cc,.42),i2;
      for(i2=0;i2<4;i2++){var yy2=206+i2*38;
        SP([[cx+g*sw*(0.78+0.01*i2),yy2],[cx+g*sw*0.96,yy2+7],[cx+g*sw*1.12,yy2]],fk,1.1,false);}
      CL(a,function(){FP([[cx+g*sw*0.70,242],[cx+g*sw*1.20,234],[cx+g*sw*1.20,258],[cx+g*sw*0.70,264]],dk(cc,.34));});}
    if(C.glove){
      var gp=[[cx+g*sw*0.78,302],[cx+g*sw*1.13,296],[cx+g*sw*1.08,341],[cx+g*sw*0.80,341]];
      FP(gp,C.glove);
      FP([[cx+g*sw*1.13,296],[cx+g*sw*1.00,298],[cx+g*sw*0.98,341],[cx+g*sw*1.08,341]],dk(C.glove,.22));
      SP(gp,dk(C.glove,.55),1.8,true);
      SP([[cx+g*sw*0.79,310],[cx+g*sw*1.12,304]],dk(C.glove,.42),1.3,false);
    }
  }

  /* ================= props ================= */
  function extra(mode){
    var s=C.s,m=C.m;
    if(id===0){
      var cape=[[cx-sw*0.50,116],[cx-sw*1.30,190, cx-sw*1.86,290, cx-sw*1.92,341],[cx+sw*1.92,341],[cx+sw*1.86,290, cx+sw*1.30,190, cx+sw*0.50,116]];
      if(mode==='rim')rimP(cape);
      if(mode==='back'){FP(cape,s);CL(cape,function(){
        FP([[cx+4,112],[cx+sw*0.9,190],[cx+sw*2,345],[cx,345]],dk(s,.28));
        FP([[cx+sw*0.86,170],[cx+sw*2,290],[cx+sw*2,345],[cx+sw*0.60,345]],dk(s,.50));
        FP([[cx-sw*0.44,120],[cx-sw*1.0,220],[cx-sw*1.4,345],[cx-sw*2,345],[cx-sw*1.8,240]],dk(s,.36));
        var i;for(i=0;i<5;i++){var x0=cx-sw*1.0+i*sw*0.5;SP([[x0*0.5+cx*0.5,150],[x0-6+i*3,250],[x0-16+i*8,345]],dk(s,.56),1.3,false);}
      });SP(cape,dk(s,.62),2.2,true);}
    }
    if(id===2&&mode==='back'){
      var bow=[[cx+sw*0.52,320],[cx+sw*1.9,160, cx+sw*0.76,74, cx+sw*0.10,86]];
      rimS(bow,7);
      SP(bow,'#7A4E24',4.2,false);SP(bow,'#B5813F',1.8,false);
      SP([[cx+sw*0.52,320],[cx+sw*0.10,86]],'#F2ECDC',1.1,false);
      var i;for(i=0;i<3;i++){
        SP([[cx-sw*0.96-i*6,80],[cx-sw*0.74-i*6,124]],'#EFE6D2',1.8,false);
        FP([[cx-sw*0.96-i*6,80],[cx-sw*1.03-i*6,70],[cx-sw*0.89-i*6,70]],'#C0392B');}
    }
    if(id===3&&mode==='back'){
      var st=[[cx+sw*1.24,341],[cx+sw*0.54,104]];
      rimS(st,8);
      SP(st,'#43331F',4.6,false);SP([[cx+sw*1.21,341],[cx+sw*0.51,104]],'#6E5738',1.8,false);
      var gx=cx+sw*0.52,gy=98;
      cio(gx,gy,11,'#FFFFFF',5);
      cio(gx,gy,11,'#B8912E',3.4);
      ci(gx,gy,8,s);ci(gx-2.4,gy-2.4,4.4,lt(s,.5));ci(gx+2.6,gy+2.8,3,dk(s,.30));
    }
    if(id===4&&mode==='back'){
      var kp=[[cx-sw*1.22,341],[cx+sw*0.44,86]];
      rimS(kp,8);
      SP(kp,'#BFC9D6',5.2,false);
      SP([[cx-sw*1.20,338],[cx+sw*0.43,89]],'#F6FAFE',1.8,false);
      SP([[cx-sw*1.26,344],[cx+sw*0.46,90]],'#78838F',1.4,false);
      SP([[cx-sw*0.98,300],[cx-sw*0.78,304]],'#C8A24A',7,false);
      SP([[cx-sw*1.26,346],[cx-sw*1.02,308]],'#33262A',7,false);
    }
    if(id===5&&mode==='front'){
      var lp=[[cx+sw*1.02,306],[cx+sw*1.24,196]];
      rimS(lp,7);
      SP(lp,'#AAB1BC',3.6,false);SP([[cx+sw*1.01,304],[cx+sw*1.23,198]],'#E6EAF0',1.4,false);
      var bx=cx+sw*1.26,by=186;
      cio(bx,by,11,'#FFFFFF',5);
      ci(bx,by,10.4,'#BFC6D0');ci(bx,by,8.2,'#EDF0F5');ci(bx+2.6,by+2.4,4.8,'#A7AFBB');
      cio(bx,by,10.4,'#78818E',1.6);
    }
    if(id===6&&mode==='face'){
      var gy2=ey-1,gw=11.2,ox=13.4;
      ctx.save();ctx.globalAlpha=0.28;
      FP([[cx-ox-9,gy2-7],[cx-ox+3,gy2-8],[cx-ox-4,gy2+6],[cx-ox-10,gy2+2]],'#E4F0FC');
      FP([[cx+ox-9,gy2-7],[cx+ox+3,gy2-8],[cx+ox-4,gy2+6],[cx+ox-10,gy2+2]],'#E4F0FC');
      ctx.restore();
      ctx.strokeStyle='#333A48';ctx.lineWidth=1.8;
      ctx.beginPath();ctx.ellipse(cx-ox,gy2,gw,7.8,0,0,6.2832);ctx.stroke();
      ctx.beginPath();ctx.ellipse(cx+ox,gy2,gw,7.8,0,0,6.2832);ctx.stroke();
      SP([[cx-ox+gw,gy2-1],[cx+ox-gw,gy2-1]],'#333A48',1.6,false);
      SP([[cx-ox-gw,gy2-2],[cx-fw-1,gy2-4]],'#333A48',1.6,false);
      SP([[cx+ox+gw,gy2-2],[cx+fw+1,gy2-4]],'#333A48',1.6,false);
    }
    if(id===7&&mode==='face'){
      var by2=ey-21;
      FP([[cx-fw-5,by2+6],[cx+fw+5,by2+6],[cx+fw+5,by2-5],[cx-fw-5,by2-5]],'#3C4854');
      FP([[cx-fw-5,by2+2],[cx+fw+5,by2+2],[cx+fw+5,by2+6],[cx-fw-5,by2+6]],'#242E38');
      ci(cx-9.5,by2,7.8,'#1A2230');ci(cx-9.5,by2,6.0,C.s);ci(cx-11.6,by2-2.2,2.8,'#EAF8FF');
      ci(cx+9.5,by2,7.8,'#1A2230');ci(cx+9.5,by2,6.0,C.s);ci(cx+7.4,by2-2.2,2.8,'#EAF8FF');
      SP([[cx-3,by2],[cx+3,by2]],'#2A3440',3.4,false);
      ci(cx-fw-2,by2+1,1.7,'#C8CED8');ci(cx+fw+2,by2+1,1.7,'#C8CED8');
    }
    if(id===9&&mode==='back'){
      ctx.save();var i;
      for(i=0;i<3;i++){ctx.globalAlpha=0.15-i*0.04;ci(cx,196,84+i*24,C.m);}
      ctx.globalAlpha=0.6;
      for(i=0;i<8;i++){
        var a=i*0.785+t*0.6,rr=70+24*Math.sin(i*2.1+t);
        var px=cx+Math.cos(a)*rr*1.1,py=196+Math.sin(a)*rr;
        FP([[px,py-7],[px+3.8,py],[px,py+7],[px-3.8,py]],lt(C.m,.42));
      }
      ctx.restore();
    }
  }

  /* ================= outfits ================= */
  function outfit(){
    var m=C.m,s=C.s;
    if(id===0){
      baseTorso(m);
      CL(torso,function(){
        pecs(m);
        FP([[cx-nw-13,102],[cx+nw+13,102],[cx+nw+9,124],[cx-nw-9,124]],'#F6F6F0');
        SP([[cx-nw-11,122],[cx+nw+11,122]],'#B4B4AA',1.3,false);
        FP([[cx-nw-19,104],[cx-nw-9,124],[cx-sw*0.62,132],[cx-sw*0.58,110]],s);
        FP([[cx+nw+19,104],[cx+nw+9,124],[cx+sw*0.62,132],[cx+sw*0.58,110]],dk(s,.24));
        FP([[cx-2.8,122],[cx+2.8,122],[cx+2.8,188],[cx-2.8,188]],lt(m,.44));
        var i;for(i=0;i<9;i++)SP([[cx-2.8,126+i*7],[cx+2.8,126+i*7]],dk(m,.46),0.9,false);
        FP([[cx-3.8,186],[cx+3.8,186],[cx+3.2,196],[cx-3.2,196]],'#D2D2CA');
        FP([[cx-waW-8,252],[cx+waW+8,252],[cx+hpW+2,278],[cx-hpW-2,278]],'#F2F2EA');
        FP([[cx-waW-6,270],[cx+waW+6,270],[cx+hpW+2,278],[cx-hpW-2,278]],'#C4C4B8');
        ci(cx,265,11.5,'#A87C18');ci(cx,265,8.4,'#F2D25E');ci(cx,265,2.8,'#8A6414');
        FP([[cx-hpW-2,278],[cx+hpW+2,278],[cx+hpW+2,341],[cx-hpW-2,341]],dk(m,.30));
      });
      clav(m);
    } else if(id===1){
      baseTorso(m);
      CL(torso,function(){
        FP([[cx-chW-2,148],[cx-10,140],[cx+10,140],[cx+chW+2,148],[cx+chW*0.86,214],[cx,232],[cx-chW*0.86,214]],s);
        FP([[cx+2,141],[cx+chW+2,148],[cx+chW*0.86,214],[cx+2,232]],dk(s,.20));
        FP([[cx-chW-2,148],[cx-chW*0.4,142],[cx-chW*0.5,186],[cx-chW-2,180]],lt(s,.30));
        SP([[cx,140],[cx,232]],dk(s,.34),1.2,false);
        SP([[cx-chW*0.94,178],[cx+chW*0.94,178]],dk(s,.30),1.2,false);
        FP([[cx-8,166],[cx+8,166],[cx+6,186],[cx-6,186]],m);
        ci(cx,176,4.6,lt(m,.55));
        FP([[cx-nw-14,100],[cx+nw+14,100],[cx+nw+9,128],[cx-nw-9,128]],dk(m,.22));
        FP([[cx+2,100],[cx+nw+14,100],[cx+nw+9,128],[cx+2,128]],dk(m,.40));
        FP([[cx-sw*0.68,shY-4],[cx-sw*0.26,116],[cx-sw*0.32,156],[cx-sw*0.74,162]],s);
        FP([[cx+sw*0.68,shY-4],[cx+sw*0.26,116],[cx+sw*0.32,156],[cx+sw*0.74,162]],dk(s,.18));
        FP([[cx-waW-3,254],[cx+waW+3,254],[cx+waW+3,272],[cx-waW-3,272]],s);
        FP([[cx-waW-3,266],[cx+waW+3,266],[cx+waW+3,272],[cx-waW-3,272]],dk(s,.24));
        FP([[cx-hpW-3,272],[cx+hpW+3,272],[cx+hpW+3,341],[cx-hpW-3,341]],dk(m,.34));
      });
    } else if(id===2){
      baseTorso(m);
      CL(torso,function(){
        pecs(m);
        FP([[cx-sw*0.66,140],[cx+sw*0.64,214],[cx+sw*0.58,236],[cx-sw*0.70,162]],s);
        FP([[cx-sw*0.66,152],[cx+sw*0.62,226],[cx+sw*0.58,236],[cx-sw*0.70,162]],dk(s,.28));
        FP([[cx+sw*0.66,140],[cx-sw*0.64,214],[cx-sw*0.58,236],[cx+sw*0.70,162]],dk(s,.14));
        FP([[cx+sw*0.66,152],[cx-sw*0.62,226],[cx-sw*0.58,236],[cx+sw*0.70,162]],dk(s,.38));
        ci(cx,190,7,'#8A6A2E');ci(cx,190,4.4,'#C8A24A');
        FP([[cx-waW-6,250],[cx+waW+6,250],[cx+hpW,274],[cx-hpW,274]],'#6B4E28');
        FP([[cx-waW-4,266],[cx+waW+4,266],[cx+hpW,274],[cx-hpW,274]],'#4E3819');
        FP([[cx-11,248],[cx+11,248],[cx+11,276],[cx-11,276]],'#B08A3C');
        SP([[cx-11,262],[cx+11,262]],'#6E5424',1.6,false);
        FP([[cx-hpW,274],[cx+hpW,274],[cx+hpW+2,341],[cx-hpW-2,341]],dk('#3E5E24',.30));
      });
      clav(m);
    } else if(id===3){
      baseTorso('#191922');
      CL(torso,function(){
        FP([[cx-nw-4,104],[cx-8,214],[cx-chW*0.72,206],[cx-nw-24,132]],'#101018');
        FP([[cx+nw+4,104],[cx+8,214],[cx+chW*0.72,206],[cx+nw+24,132]],'#0A0A12');
        FP([[cx-nw-10,102],[cx-6,200],[cx-chW*0.52,196],[cx-nw-30,128]],m);
        FP([[cx+nw+10,102],[cx+6,200],[cx+chW*0.52,196],[cx+nw+30,128]],dk(m,.26));
        FP([[cx-nw-3,102],[cx+nw+3,102],[cx+8,146],[cx-8,146]],lt(s,.28));
        FP([[cx,103],[cx+nw+3,102],[cx+8,146],[cx,146]],dk(s,.18));
        ci(cx,128,5.6,s);cio(cx,128,5.6,'#8A6A18',1.5);
        FP([[cx-waW-4,254],[cx+waW+4,254],[cx+waW+4,272],[cx-waW-4,272]],m);
        FP([[cx-waW-4,266],[cx+waW+4,266],[cx+waW+4,272],[cx-waW-4,272]],dk(m,.34));
        FP([[cx-hpW-3,272],[cx+hpW+3,272],[cx+hpW+3,341],[cx-hpW-3,341]],'#121219');
        SP([[cx-12,214],[cx-8,262]],'#3A3A48',1.2,false);
        SP([[cx+12,214],[cx+8,262]],'#3A3A48',1.2,false);
      });
    } else if(id===4){
      baseTorso(m);
      CL(torso,function(){
        FP([[cx-nw-10,102],[cx-4,212],[cx-chW*0.70,208],[cx-nw-24,134]],'#F0EADC');
        FP([[cx+nw+10,102],[cx+4,212],[cx+chW*0.70,208],[cx+nw+24,134]],'#D5CEBE');
        FP([[cx-nw-11,102],[cx-9,196],[cx-nw-27,146],[cx-nw-25,122]],s);
        FP([[cx+nw+11,102],[cx+9,196],[cx+nw+27,146],[cx+nw+25,122]],dk(s,.26));
        FP([[cx-sw*0.66,shY-6],[cx-nw-26,124],[cx-8,206],[cx-chW*0.54,240],[cx-chW-4,196]],m);
        FP([[cx+sw*0.66,shY-6],[cx+nw+26,124],[cx+8,206],[cx+chW*0.54,240],[cx+chW+4,196]],dk(m,.28));
        SP([[cx-sw*0.56,152],[cx-chW*0.54,200]],dk(m,.55),1.3,false);
        SP([[cx+sw*0.56,152],[cx+chW*0.54,200]],dk(m,.55),1.3,false);
        FP([[cx-hpW-5,240],[cx+hpW+5,240],[cx+hpW+5,272],[cx-hpW-5,272]],s);
        FP([[cx-hpW-5,262],[cx+hpW+5,262],[cx+hpW+5,272],[cx-hpW-5,272]],dk(s,.32));
        SP([[cx-hpW-5,250],[cx+hpW+5,250]],dk(s,.18),1.2,false);
        FP([[cx-hpW-3,272],[cx+hpW+3,272],[cx+hpW+3,341],[cx-hpW-3,341]],dk(m,.20));
        SP([[cx-16,278],[cx-20,341]],dk(m,.5),1.2,false);
        SP([[cx+16,278],[cx+20,341]],dk(m,.5),1.2,false);
      });
    } else if(id===5){
      baseTorso('#FBFBF8');
      CL(torso,function(){
        FP([[cx-chW-3,176],[cx+chW+3,176],[cx+hpW+4,341],[cx-hpW-4,341]],m);
        FP([[cx+3,176],[cx+chW+3,176],[cx+hpW+4,341],[cx+3,341]],dk(m,.24));
        var i;
        for(i=0;i<7;i++){var xx=cx-chW-3+i*((2*chW+6)/6);ci(xx,176,6.2,lt(m,.34));}
        for(i=0;i<7;i++){var x2=cx-chW-3+i*((2*chW+6)/6);cio(x2,176,6.2,dk(m,.40),1.2);}
        FP([[cx-nw-15,100],[cx+nw+15,100],[cx+nw+9,126],[cx-nw-9,126]],'#FFFFFF');
        SP([[cx-nw-12,124],[cx+nw+12,124]],'#CFC6CE',1.3,false);
        for(i=0;i<3;i++)ci(cx,146+i*14,2.8,dk(m,.20));
        FP([[cx-11,124],[cx+11,124],[cx+16,138],[cx,133],[cx-16,138]],m);
        ci(cx,129,4,lt(m,.44));
        FP([[cx-waW-7,252],[cx+waW+7,252],[cx+waW+7,270],[cx-waW-7,270]],lt(m,.60));
        SP([[cx-waW-7,261],[cx+waW+7,261]],dk(m,.28),1.2,false);
        FP([[cx-chW*0.5,300],[cx+chW*0.5,300],[cx+chW*0.42,341],[cx-chW*0.42,341]],lt(m,.52));
      });
    } else if(id===6){
      baseTorso(m);
      CL(torso,function(){
        FP([[cx-nw-11,102],[cx-3,226],[cx+3,226],[cx+nw+11,102]],'#F6F6F2');
        FP([[cx+1,104],[cx-1,226],[cx+3,226],[cx+nw+11,102]],'#DCDCD6');
        FP([[cx-nw-4,124],[cx-17,226],[cx-chW*0.64,216],[cx-nw-17,140]],s);
        FP([[cx+nw+4,124],[cx+17,226],[cx+chW*0.64,216],[cx+nw+17,140]],dk(s,.24));
        FP([[cx-nw-11,102],[cx-17,140],[cx-chW*0.94,154],[cx-nw-26,122]],dk(m,.20));
        FP([[cx+nw+11,102],[cx+17,140],[cx+chW*0.94,154],[cx+nw+26,122]],dk(m,.40));
        FP([[cx-9,112],[cx,121],[cx+9,112],[cx+10,126],[cx,131],[cx-10,126]],'#121520');
        FP([[cx-2.4,122],[cx+2.4,122],[cx+2.4,129],[cx-2.4,129]],'#333949');
        ci(cx-6,176,1.9,'#D6DAE4');ci(cx-8,202,1.9,'#D6DAE4');
        FP([[cx-waW-6,250],[cx+waW+6,250],[cx+hpW,272],[cx-hpW,272]],'#121520');
        FP([[cx-7,251],[cx+7,251],[cx+7,271],[cx-7,271]],'#C2A248');
        SP([[cx-chW*0.66,146],[cx-chW*0.54,174]],dk(m,.5),1.1,false);
      });
    } else if(id===7){
      baseTorso(m);
      CL(torso,function(){
        FP([[cx-11,140],[cx+11,140],[cx+15,341],[cx-15,341]],s);
        FP([[cx+2,140],[cx+11,140],[cx+15,341],[cx+2,341]],dk(s,.26));
        FP([[cx-chW-3,132],[cx-11,142],[cx-15,341],[cx-hpW-4,341]],m);
        FP([[cx+chW+3,132],[cx+11,142],[cx+15,341],[cx+hpW+4,341]],dk(m,.34));
        SP([[cx-11,142],[cx-15,341]],dk(m,.58),1.6,false);
        SP([[cx+11,142],[cx+15,341]],dk(m,.58),1.6,false);
        FP([[cx-nw-16,102],[cx-11,142],[cx-chW*0.90,152],[cx-nw-28,124]],lt(m,.14));
        FP([[cx+nw+16,102],[cx+11,142],[cx+chW*0.90,152],[cx+nw+28,124]],dk(m,.30));
        FP([[cx-8,152],[cx+8,152],[cx+8,168],[cx-8,168]],dk(s,.34));
        FP([[cx-waW-7,258],[cx+waW+7,258],[cx+waW+7,278],[cx-waW-7,278]],'#4B4038');
        FP([[cx-9,256],[cx+9,256],[cx+9,280],[cx-9,280]],'#C8A24A');
        SP([[cx-9,268],[cx+9,268]],'#836420',1.4,false);
        ci(cx-waW+2,290,3.4,'#8B8F98');ci(cx+waW-2,292,3.4,'#8B8F98');
      });
    } else if(id===8){
      baseTorso(m);
      CL(torso,function(){
        FP([[cx-nw-16,98],[cx-nw-7,152],[cx-chW*0.94,160],[cx-nw-32,120]],dk(m,.12));
        FP([[cx+nw+16,98],[cx+nw+7,152],[cx+chW*0.94,160],[cx+nw+32,120]],dk(m,.42));
        FP([[cx-nw-7,102],[cx-5,240],[cx-chW*0.74,230],[cx-nw-20,140]],dk(m,.30));
        FP([[cx+nw+7,102],[cx+5,240],[cx+chW*0.74,230],[cx+nw+20,140]],dk(m,.52));
        FP([[cx-nw-3,100],[cx+nw+3,100],[cx+7,158],[cx-7,158]],'#171B23');
        FP([[cx-5,116],[cx+5,116],[cx+4,142],[cx-4,142]],s);
        SP([[cx-16,244],[cx-11,300]],dk(m,.62),1.3,false);
        SP([[cx+16,244],[cx+11,300]],dk(m,.62),1.3,false);
        FP([[cx-waW-6,250],[cx+waW+6,250],[cx+hpW,272],[cx-hpW,272]],'#141820');
        FP([[cx-8,249],[cx+8,249],[cx+8,271],[cx-8,271]],s);
        ci(cx,260,3.4,dk(s,.42));
      });
    } else if(id===9){
      baseTorso('#141A22');
      CL(torso,function(){
        FP([[cx-chW-3,146],[cx-9,164],[cx+9,164],[cx+chW+3,146],[cx+chW+5,206],[cx-chW-5,206]],'#1B222C');
        FP([[cx+2,150],[cx+chW+3,146],[cx+chW+5,206],[cx+2,206]],'#0A0D12');
        FP([[cx+2,206],[cx+chW+4,206],[cx+hpW+4,341],[cx+2,341]],'#0A0D12');
        SP([[cx-chW-2,148],[cx-9,166]],m,1.6,false);
        SP([[cx+chW+2,148],[cx+9,166]],m,1.6,false);
        SP([[cx-9,166],[cx+9,166]],m,1.6,false);
        FP([[cx-waW-5,250],[cx+waW+5,250],[cx+waW+5,266],[cx-waW-5,266]],m);
        FP([[cx-waW-5,260],[cx+waW+5,260],[cx+waW+5,266],[cx-waW-5,266]],dk(m,.34));
        SP([[cx-chW*0.66,204],[cx-waW*0.6,228]],'#2B3440',1.2,false);
        SP([[cx+chW*0.66,204],[cx+waW*0.6,228]],'#2B3440',1.2,false);
        FP([[cx-14,166],[cx+14,166],[cx+11,196],[cx-11,196]],'#0E141B');
      });
    } else {
      baseTorso(SK.b);
      CL(torso,function(){pecs(SK.b);});
      CL(torso,function(){
        FP([[cx-nw-30,104],[cx-6,264],[cx-26,274],[cx-chW-8,140]],s);
        FP([[cx+nw+30,104],[cx+6,264],[cx+26,274],[cx+chW+8,140]],dk(s,.30));
        FP([[cx-nw-30,104],[cx-17,252],[cx-33,260],[cx-chW-9,148]],dk(s,.42));
        FP([[cx+nw+30,104],[cx+17,252],[cx+33,260],[cx+chW+9,148]],dk(s,.56));
        FP([[cx-chW-8,140],[cx-33,260],[cx-hpW-4,284],[cx-chW-9,164]],dk(s,.22));
        SP([[cx-nw-30,104],[cx-6,264]],dk(s,.66),2.6,false);
        SP([[cx+nw+30,104],[cx+6,264]],dk(s,.66),2.6,false);
        SP([[cx-nw-42,110],[cx-24,272]],dk(s,.46),1.5,false);
        SP([[cx+nw+42,110],[cx+24,272]],dk(s,.46),1.5,false);
        FP([[cx-hpW-4,282],[cx+hpW+4,282],[cx+hpW+6,341],[cx-hpW-6,341]],dk(s,.16));
        FP([[cx+2,282],[cx+hpW+4,282],[cx+hpW+6,341],[cx+2,341]],dk(s,.40));
        SP([[cx,286],[cx-4,341]],dk(s,.44),1.6,false);
        FP([[cx-waW-12,254],[cx+waW+12,254],[cx+hpW+4,284],[cx-hpW-4,284]],C.m);
        FP([[cx-waW-10,274],[cx+waW+10,274],[cx+hpW+4,284],[cx-hpW-4,284]],dk(C.m,.36));
        SP([[cx-waW-11,264],[cx+waW+11,264]],dk(C.m,.22),1.3,false);
        FP([[cx-16,258],[cx+16,254],[cx+22,300],[cx-20,304]],dk(C.m,.20));
      });
      clav(SK.b);
    }
  }

  /* ================= gou skull / gai hood ================= */
  function skullCap(){return [[cx-fw-1,ey-4],[cx-fw-4,hy-11, cx+fw+4,hy-11, cx+fw+1,ey-4]];}
  function hoodInner(){return [[cx-fw-11,ey+20],[cx-fw-16,ey-24, cx-fw*0.62,hy-21, cx+2,hy-20],
    [cx+fw*0.72,hy-19, cx+fw+16,ey-22, cx+fw+11,ey+20],
    [cx+fw+14,ey+30, cx+fw+22,ey+38, cx+sw*0.62,154],
    [cx+sw*0.24,146, cx-sw*0.24,146, cx-sw*0.62,154],
    [cx-fw-22,ey+38, cx-fw-14,ey+30, cx-fw-11,ey+20]];}
  function hoodHole(){return [[cx,hy-3],
    [cx+fw*0.94,hy-2, cx+fw+2,hy+14, cx+fw+2,ey-2],
    [cx+fw+2,ey+16, cx+fw*0.6,chin-2, cx,chin+1],
    [cx-fw*0.6,chin-2, cx-fw-2,ey+16, cx-fw-2,ey-2],
    [cx-fw-2,hy+14, cx-fw*0.94,hy-2, cx,hy-3]];}

  /* ================= render ================= */
  ctx.save();
  ctx.translate(swy*0.6,bob);
  ctx.lineJoin='round';ctx.lineCap='round';

  C.mech=(id===7||id===8)?-1:0;
  C.mc=(id===7)?'#96A4B4':'#9AA6B8';
  C.bare=(id===10)?2:0;
  C.glove=(id===0)?'#F4F4EC':((id===6)?'#F2F2EE':0);

  var tilt=((id%2)?-1:1)*0.10;
  function headT(fn){ctx.save();ctx.translate(cx,chin+4);ctx.rotate(tilt);ctx.translate(-cx,-(chin+4));fn();ctx.restore();}
  (function(){
    var list=[torso,armP(-1),armP(1),neck],i;
    for(i=0;i<list.length;i++)rimP(list[i]);
    headT(function(){
      rimP(face);
      drawHairPart(HS.b,'rim');
      if(HS.l)drawHairPart(HS.l,'rim');
      drawHairPart(HS.f,'rim');
      if(id===9)curls('rim');
      if(id===10)rimP(skullCap());
      if(id===2){rimP(hoodInner());}
    });
    extra('rim');
  })();

  extra('back');
  headT(function(){if(id===9)curls('back');drawHairPart(HS.b,'back');});
  outfit();
  drawArm(-1);drawArm(1);
  drawNeck();
  ctx.save();ctx.translate(cx,chin+4);ctx.rotate(tilt);ctx.translate(-cx,-(chin+4));
  ear(-1);ear(1);
  drawHead();
  if(id===10){
    var sc=skullCap();
    FP(sc,SK.b);
    CL(sc,function(){
      FP([[cx+fw*0.34,hy-18],[cx+fw*2,hy-18],[cx+fw*2,ey+6],[cx+fw*0.14,ey+6]],SK.s);
      FP([[cx-fw*1.05,hy+4],[cx-fw*0.12,hy-10],[cx-fw*0.24,hy+10],[cx-fw*1.15,ey-14]],lt(SK.b,.28));
    });
    SP(sc,SK.ln,2.1,false);
    SP([[cx-fw*0.56,ey-18],[cx-fw*0.1,ey-23, cx+fw*0.52,ey-17]],SK.d,1.1,false);
  }
  drawFeat();
  if(HS.l)drawHairPart(HS.l,'front');
  drawHairPart(HS.f,'front');
  if(id===9)curls('front');
  hairStrands();
  extra('face');
  if(id===2){
    var hi=hoodInner();
    var hcol=lt(C.m,.10),hh=hoodHole();
    P2(hi,hh);ctx.fillStyle=hcol;ctx.fill('evenodd');
    ctx.save();P2(hi,hh);ctx.clip('evenodd');(function(){
      FP([[cx+fw*0.30,hy-34],[cx+140,hy-34],[cx+140,200],[cx+fw*0.12,200]],dk(hcol,.24));
      FP([[cx+fw*0.92,hy-34],[cx+140,hy-34],[cx+140,200],[cx+fw*0.72,200]],dk(hcol,.42));
      FP([[cx-fw-18,ey-4],[cx-fw*0.6,hy-8],[cx-fw*0.76,ey+8],[cx-fw-16,ey+22]],lt(hcol,.20));
      var q;for(q=0;q<3;q++)SP([[cx-fw*0.9+q*fw*0.9,hy-16],[cx-fw*0.8+q*fw*0.9,ey-8]],dk(hcol,.44),1.1,false);
      FP([[cx-fw-6,ey+6],[cx+fw+6,ey+6],[cx+fw+8,ey+34],[cx-fw-8,ey+34]],dk(hcol,.30));
    })();ctx.restore();
    SP(hi,dk(hcol,.60),2.2,true);
    SP(hh,dk(hcol,.72),2.0,true);
    SP([[cx-fw-3,ey+10],[cx-fw-8,ey-14, cx-fw*0.5,hy-9, cx,hy-8]],dk(C.m,.50),1.6,false);
    SP([[cx+fw+3,ey+10],[cx+fw+8,ey-14, cx+fw*0.5,hy-9, cx,hy-8]],dk(C.m,.50),1.6,false);
  }
  ctx.restore();
  extra('front');
  ctx.restore();
}
/* dvOpmTok — ワンパンマン(村田雄介)風トークン / Canvas2D 手続き描画のみ
   接地点=原点。上へ約80px、左右±28px。乱数・日付は使わない。 */
function dvOpmTok(ctx, id, col, T, facing){
  var i = ((id | 0) % 11 + 11) % 11;
  var f = facing < 0 ? -1 : 1;
  var t = T || 0;
  var bob = Math.sin(t / 560 + i * 0.83) * 1.3;
  var swy = Math.sin(t / 880 + i * 1.7);
  var TAU = Math.PI * 2;

  /* ---- 色（影は色相を紫寄りへ。ただし無彩色は青灰へ） ---- */
  function cl(v){ return v < 0 ? 0 : (v > 255 ? 255 : v); }
  function h2(c){ return [parseInt(c.substr(1,2),16), parseInt(c.substr(3,2),16), parseInt(c.substr(5,2),16)]; }
  function rgb(r,g,b){ return '#' + ((1<<24) + ((cl(r)|0)<<16) + ((cl(g)|0)<<8) + (cl(b)|0)).toString(16).slice(1); }
  function dk(c,a){ var p = h2(c); return rgb(p[0]*(1-a*0.94), p[1]*(1-a*1.06), p[2]*(1-a*0.86)+a*13); }
  function shd(c,a){ var p = h2(c), mx = Math.max(p[0],p[1],p[2]), mn = Math.min(p[0],p[1],p[2]);
    if(mx - mn < 30 && mx > 168) return rgb(p[0]*(1-a*1.10), p[1]*(1-a*1.02), p[2]*(1-a*0.88));
    return dk(c,a); }
  function lt(c,a){ var p = h2(c); return rgb(p[0]+(255-p[0])*a, p[1]+(250-p[1])*a, p[2]+(232-p[2])*a); }
  function ln(c){ return shd(c, 0.42); }

  var SKT = [
    ['#FDEADA','#F3D2B8','#DFB198','#8C5B4A'],
    ['#F9D9B6','#ECC29C','#D0A079','#7A4A3C'],
    ['#CE9264','#B67C53','#95633C','#5B3320']
  ];
  var TB = [
    {sk:1, ey:'#8A5A2A', hr:'#F5CC4E', hs:0,  oc:'#F2C21E', ac:'#C0392B', bd:1.10, pr:'cape'},
    {sk:0, ey:'#2E7FD8', hr:'#A6DCF2', hs:1,  oc:'#F2FAFF', ac:'#3E8FE0', bd:0.90, pr:'none'},
    {sk:2, ey:'#3E9B4E', hr:'#6B4A2A', hs:2,  oc:'#4E7A2E', ac:'#C9A05A', bd:1.03, pr:'bow'},
    {sk:0, ey:'#E8C24A', hr:'#8B5FD0', hs:3,  oc:'#241C33', ac:'#7B4FBE', bd:0.90, pr:'staff'},
    {sk:1, ey:'#D22B2B', hr:'#22202A', hs:4,  oc:'#1E2430', ac:'#D22B2B', bd:1.04, pr:'sword'},
    {sk:0, ey:'#F07AB0', hr:'#F79CC2', hs:5,  oc:'#E86AA0', ac:'#FFF0F5', bd:0.88, pr:'ladle'},
    {sk:1, ey:'#7A8AA6', hr:'#CFD5DE', hs:6,  oc:'#2A2E3A', ac:'#C8CCD8', bd:1.00, pr:'butler'},
    {sk:2, ey:'#46B36A', hr:'#F0862E', hs:7,  oc:'#E0762A', ac:'#5AA8C8', bd:0.92, pr:'mech'},
    {sk:1, ey:'#2A2A32', hr:'#F2F4F7', hs:8,  oc:'#2E3440', ac:'#9AA6B8', bd:1.06, pr:'cyborg'},
    {sk:0, ey:'#3FBF87', hr:'#41CB8E', hs:9,  oc:'#101418', ac:'#3FBF87', bd:0.86, pr:'psy'},
    {sk:2, ey:'#8A5A2A', hr:'#3A2A22', hs:10, oc:'#F2E4C8', ac:'#D8632C', bd:1.26, pr:'gi'}
  ];
  var C   = TB[i];
  var S   = SKT[C.sk];
  var SK0 = S[0], SK1 = S[1], SK2 = S[2], SKL = S[3];
  var HR  = C.hr, HRL = lt(HR,0.34), HRN = shd(HR,0.46);
  var OC  = C.oc, OCN = ln(OC);
  var AC  = C.ac, ACN = ln(AC);
  var BD  = C.bd;
  var SW  = 13.4 * BD;      /* 肩(三角筋)半幅 */
  var CW  = 12.2 * BD;      /* 胸半幅 */
  var WW  =  8.4 * BD;      /* 腰半幅 */
  var HW  = 10.0 * BD;      /* 尻半幅 */
  var CY = -43.5, WY = -34.0, HIP = -26.5;
  var RIM = false;
  var bodyFn = null;

  /* ---- プリミティブ ---- */
  function mv(a){
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    for(var k = 2; k < a.length; k += 2) ctx.lineTo(a[k], a[k+1]);
    ctx.closePath();
  }
  function pth(p){ if(typeof p === 'function') p(); else mv(p); }
  function paintRim(w){
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = (w || 2) + 1.1; ctx.stroke(); ctx.fill();
  }
  /* セル塗り: 地色 → 硬い境界の影 → 硬い境界のハイライト → 細い線 */
  function SH(p, base, lineC, w, shp, hip, shc, hic){
    pth(p);
    if(RIM){ paintRim(w); return; }
    ctx.fillStyle = base; ctx.fill();
    if(shp || hip){
      ctx.save(); ctx.clip();
      if(shp){ mv(shp); ctx.fillStyle = shc || shd(base,0.30); ctx.fill(); }
      if(hip){ mv(hip); ctx.fillStyle = hic || lt(base,0.30); ctx.fill(); }
      ctx.restore();
    }
    pth(p); ctx.strokeStyle = lineC || ln(base); ctx.lineWidth = w || 2.0; ctx.stroke();
  }
  function stk(a, c, w){
    if(RIM) return;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    for(var k = 2; k < a.length; k += 2) ctx.lineTo(a[k], a[k+1]);
    ctx.strokeStyle = c; ctx.lineWidth = w || 1.1; ctx.stroke();
  }
  function qs(x1,y1,cx,cy,x2,y2,c,w){
    if(RIM) return;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cx,cy,x2,y2);
    ctx.strokeStyle = c; ctx.lineWidth = w || 1.1; ctx.stroke();
  }
  function dot(x,y,r,c){ if(RIM) return; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fillStyle = c; ctx.fill(); }
  function circ(x,y,r,base,lineC,w){
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
    if(RIM){ paintRim(w); return; }
    ctx.fillStyle = base; ctx.fill();
    ctx.save(); ctx.clip();
    mv([x+r*0.30,y-r*1.4, x+r*1.5,y-r*1.4, x+r*1.5,y+r*1.5, x-r*0.1,y+r*1.5]);
    ctx.fillStyle = dk(base,0.26); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x,y,r,0,TAU);
    ctx.strokeStyle = lineC || ln(base); ctx.lineWidth = w || 1.6; ctx.stroke();
  }

  /* ================= 顔 ================= */
  function headPath(){
    ctx.beginPath();
    ctx.moveTo(0,-80.6);
    ctx.bezierCurveTo( 6.2,-80.6, 10.0,-76.6,  9.9,-70.2);
    ctx.bezierCurveTo( 9.8,-66.4,  9.2,-63.4,  7.8,-61.0);   /* こめかみ→頬骨 */
    ctx.bezierCurveTo( 6.4,-58.4,  4.6,-55.4,  2.4,-53.4);   /* 頬→顎 */
    ctx.bezierCurveTo( 1.5,-52.6,  0.8,-52.4,  0.0,-52.4);
    ctx.bezierCurveTo(-0.8,-52.4, -1.5,-52.6, -2.4,-53.4);
    ctx.bezierCurveTo(-4.6,-55.4, -6.4,-58.4, -7.8,-61.0);
    ctx.bezierCurveTo(-9.2,-63.4, -9.8,-66.4, -9.9,-70.2);
    ctx.bezierCurveTo(-10.0,-76.6, -6.2,-80.6, 0,-80.6);
    ctx.closePath();
  }

  function eye(x, ey, dir, soft){
    var w = soft ? 4.6 : 4.4, hh = soft ? 2.5 : 2.0;
    ctx.beginPath();
    ctx.moveTo(x - w*0.48*dir, ey + 0.45);                                          /* 目頭 */
    ctx.quadraticCurveTo(x - w*0.10*dir, ey - hh*1.05, x + w*0.70*dir, ey - 0.75);  /* 上まぶた */
    ctx.lineTo(x + w*0.60*dir, ey - 0.05);                                          /* 目尻を鋭く */
    ctx.quadraticCurveTo(x + w*0.10*dir, ey + hh*0.74, x - w*0.48*dir, ey + 0.45);
    ctx.closePath();
    ctx.fillStyle = '#FBF7F3'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.arc(x + w*0.06*dir, ey + 0.10, hh*0.78, 0, TAU); ctx.fillStyle = lt(C.ey,0.16); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w*0.06*dir, ey - 0.60, hh*0.78, 0, TAU); ctx.fillStyle = dk(C.ey,0.32); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w*0.06*dir, ey + 0.12, hh*0.30, 0, TAU); ctx.fillStyle = '#201B26'; ctx.fill();
    /* 目尻の影 */
    mv([x + w*0.30*dir, ey - hh, x + w*0.9*dir, ey - hh, x + w*0.9*dir, ey + hh, x + w*0.42*dir, ey + hh]);
    ctx.fillStyle = 'rgba(60,40,46,0.16)'; ctx.fill();
    ctx.restore();
    /* 上まぶた：目尻へ向けて太く */
    ctx.beginPath();
    ctx.moveTo(x - w*0.54*dir, ey + 0.28);
    ctx.quadraticCurveTo(x - w*0.05*dir, ey - hh*1.10, x + w*0.72*dir, ey - 0.60);
    ctx.strokeStyle = dk(SKL,0.28); ctx.lineWidth = 1.15; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineCap = 'butt';
    dot(x - w*0.22*dir, ey - hh*0.34, 0.62, '#FFFFFF');
  }

  function face(){
    if(RIM) return;
    var soft = (i === 5 || i === 9 || i === 1);
    var brow = -68.8, ey = -64.4;
    eye(-4.5, ey, -1, soft);
    eye( 4.5, ey,  1, soft);
    /* 眉：細く直線的 */
    var bt = (i === 4 || i === 8 || i === 10 || i === 2 || i === 0) ? 1.7 : 0.6;
    stk([-7.4, brow + bt*0.34, -2.2, brow - bt*0.66], dk(HRN,0.02), 1.15);
    stk([ 7.4, brow + bt*0.34,  2.2, brow - bt*0.66], dk(HRN,0.02), 1.15);
    /* 鼻：鼻筋の線＋小鼻の影＋鼻先ハイライト */
    stk([1.5,-62.6, 1.1,-59.6], SK2, 1.0);
    mv([0.2,-59.6, 2.2,-59.8, 2.4,-58.4, 0.4,-58.4]); ctx.fillStyle = SK2; ctx.fill();
    dot(0.3,-59.9, 0.55, '#FFFFFF');
    /* 口：横に広く、唇の線は薄い */
    qs(-2.6,-56.4, 0.3,-55.6, 2.8,-56.5, dk(SKL,0.16), 1.1);
    mv([-2.0,-55.2, 2.2,-55.3, 1.6,-54.2, -1.6,-54.2]); ctx.fillStyle = SK1; ctx.fill();
    if(i === 10 || i === 0 || i === 5) qs(-1.8,-56.0, 0.3,-54.8, 2.0,-56.1, dk(SKL,0.02), 0.9);
    if(i === 2){ stk([5.2,-65.0, 7.4,-60.6], '#A6503C', 1.1); stk([4.6,-62.8, 7.0,-63.6], '#A6503C', 0.9); }
  }

  /* ================= 髪 ================= */
  function hairBack(){
    var hs = C.hs, k, cx, cy;
    if(hs === 1){
      SH([-11.0,-74, 11.0,-74, 12.8,-55, 11.6,-34, 6.0,-32.5, 5.0,-48, -5.0,-48, -6.0,-32.5, -11.6,-34, -12.8,-55],
         HR, HRN, 2.0, [3.2,-76, 14,-76, 13,-32, 5.2,-32], null);
      if(!RIM){ stk([-9.2,-70, -10.4,-42], HRL, 1.2); stk([8.6,-70, 10.6,-44], dk(HR,0.20), 1.1); }
    } else if(hs === 5){
      SH([-11.6,-74, 11.6,-74, 12.6,-60, 10.8,-53, 6.4,-55, -6.4,-55, -10.8,-53, -12.6,-60],
         HR, HRN, 2.0, [3.2,-76, 14,-76, 12,-53, 4.4,-54], null);
    } else if(hs === 7){
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-8.0,-75.0);
        ctx.bezierCurveTo(-17,-77.5, -25,-71, -23.5,-60.5);
        ctx.bezierCurveTo(-22.5,-53, -18,-49, -14.5,-51.5);
        ctx.bezierCurveTo(-18.5,-56, -19,-64.5, -12.0,-68.5);
        ctx.closePath();
      }, HR, HRN, 2.0, [-25,-64, -14,-56, -14,-47, -26,-50], null);
      SH([-9.4,-74.6, -13.4,-73.2, -12.6,-69.2, -9.0,-70.6], dk(AC,0.10), ACN, 1.5);
    } else if(hs === 9){
      for(k = 0; k < 9; k++){
        cx = Math.cos(k*0.698 + 0.35) * 12.8;
        cy = -71.6 + Math.sin(k*0.698 + 0.35) * 8.8;
        circ(cx, cy, 5.3, HR, HRN, 1.6);
      }
    } else if(hs === 4){
      SH([-7,-76, 7,-76, 9.6,-65, 7.4,-55, -7.4,-55, -9.6,-65], HR, HRN, 1.9, [2,-78, 12,-78, 10,-54, 3,-54], null);
      SH([-9.4,-73, -13.6,-70.5, -16.0,-62, -12.8,-57.4, -10.2,-60.8, -11.6,-67], HR, HRN, 1.8);
    } else if(hs === 2){
      SH([-12.0,-76, 12.0,-76, 13.8,-59, 9.4,-49.5, -9.4,-49.5, -13.8,-59], AC, ACN, 2.0,
         [3,-78, 16,-78, 11,-48, 4,-48], null);
    } else if(hs === 3){
      SH([-10.4,-75, 10.4,-75, 12.0,-59.5, 8.2,-55.5, -8.2,-55.5, -12.0,-59.5], HR, HRN, 1.9, [3,-77, 14,-77, 9.5,-55, 4,-55], null);
    } else {
      SH([-10.2,-76, 10.2,-76, 10.9,-62.5, 8.0,-58.5, -8.0,-58.5, -10.9,-62.5], hs === 10 ? SK1 : HR,
         hs === 10 ? SKL : HRN, 1.9, [3,-78, 14,-78, 9.5,-56.5, 4,-56.5], null);
    }
  }

  function hairHi(){ return [-8.8,-79.0, -3.6,-81.6, -2.0,-79.6, -7.0,-76.4]; }

  /* 顔を縁取る横の毛束（これが無いとヘルメットに見える） */
  function sideLocks(){
    var hs = C.hs;
    if(hs === 2 || hs === 6 || hs === 9 || hs === 10) return;
    var d = (hs === 8) ? -1.6 : 0;
    SH([-10.5,-75.0, -7.9,-73.4, -8.3,-66.0+d, -9.8,-62.4+d, -11.1,-67.4], HR, HRN, 1.6,
       [-11.4,-76, -9.6,-76, -10.6,-62, -11.6,-62], null, HRL);
    SH([ 10.5,-75.0,  7.9,-73.4,  8.3,-66.0+d,  9.8,-62.4+d,  11.1,-67.4], HR, HRN, 1.6,
       [ 8.0,-76, 11.6,-76, 11.0,-62, 8.4,-62], null);
  }

  function hairFront(){
    var hs = C.hs, k2, cx2, cy2;
    sideLocks();
    if(hs === 10){                     /* ゴウ：坊主 */
      if(RIM) return;
      ctx.save(); headPath(); ctx.clip();
      mv([-12,-84, 12,-84, 12,-73.0, -12,-73.0]); ctx.fillStyle = dk(SK0,0.10); ctx.fill();
      ctx.restore();
      qs(-6.6,-76.0, 0,-79.6, 6.6,-76.0, dk(SK2,0.16), 1.0);
      dot(-3.6,-77.2, 1.1, lt(SK0,0.58)); dot(-1.6,-77.8, 0.8, lt(SK0,0.58));
      return;
    }
    if(hs === 0){                      /* レオ：金髪ツンツン */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.7,-68.0);
        ctx.bezierCurveTo(-11.8,-78.4, -6.4,-83.0, 0,-83.0);
        ctx.bezierCurveTo(6.4,-83.0, 11.8,-78.4, 10.7,-68.0);
        ctx.lineTo(8.6,-72.2); ctx.lineTo(6.6,-67.8); ctx.lineTo(4.2,-73.0);
        ctx.lineTo(1.6,-68.6); ctx.lineTo(-1.0,-73.6); ctx.lineTo(-3.6,-69.0);
        ctx.lineTo(-5.8,-73.4); ctx.lineTo(-8.0,-68.8); ctx.closePath();
      }, HR, HRN, 2.1, [3.4,-85, 14,-85, 12,-67.4, 4.4,-70], hairHi());
      SH([-2.8,-82.6, -0.6,-88.2, 2.2,-82.4], HR, HRN, 1.6);
      if(!RIM){ stk([-5.6,-80.6, -3.0,-73.6], dk(HR,0.22), 0.8); stk([4.8,-80.2, 6.4,-73.2], dk(HR,0.22), 0.8); }
    } else if(hs === 1){               /* ミオ：まっすぐ前髪 */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.9,-69.0);
        ctx.bezierCurveTo(-12.0,-79.4, -6.4,-83.2, 0,-83.2);
        ctx.bezierCurveTo(6.4,-83.2, 12.0,-79.4, 10.9,-69.0);
        ctx.lineTo(8.2,-71.2); ctx.lineTo(6.4,-68.6); ctx.lineTo(3.2,-71.4);
        ctx.lineTo(0.4,-68.8); ctx.lineTo(-2.8,-71.4); ctx.lineTo(-5.8,-68.8);
        ctx.lineTo(-8.2,-71.4); ctx.closePath();
      }, HR, HRN, 2.0, [3.4,-85, 14,-85, 12,-68.4, 4.6,-70.4], hairHi());
    } else if(hs === 2){               /* ガイ：緑のフード */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-12.6,-62.0);
        ctx.bezierCurveTo(-14.6,-78, -6.8,-84.6, 0.8,-84.2);
        ctx.bezierCurveTo(8.6,-83.8, 14.4,-76.5, 12.6,-62.0);
        ctx.bezierCurveTo(10.2,-64.4, 9.6,-69.8, 8.8,-72.4);
        ctx.bezierCurveTo(6.0,-77.4, -6.0,-77.4, -8.8,-72.4);
        ctx.bezierCurveTo(-9.6,-69.8, -10.2,-64.4, -12.6,-62.0);
        ctx.closePath();
      }, OC, OCN, 2.1, [3.0,-87, 16,-87, 14,-60, 5.0,-63.4], null);
      SH([-1.4,-84.2, 4.4,-88.6, 6.6,-83.6, 3.0,-82.0], OC, OCN, 1.7);
      if(!RIM){
        ctx.save(); headPath(); ctx.clip();
        mv([-12,-84, 12,-84, 12,-70.0, -12,-70.0]); ctx.fillStyle = SK2; ctx.fill();
        ctx.restore();
        stk([-8.4,-73.2, 8.4,-73.2], dk(OC,0.30), 1.0);
      }
    } else if(hs === 3){               /* ルナ：紫の流し前髪 */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.9,-67.4);
        ctx.bezierCurveTo(-12.0,-79.2, -6.4,-83.2, 0,-83.2);
        ctx.bezierCurveTo(6.6,-83.2, 12.0,-78.8, 10.9,-68.6);
        ctx.lineTo(7.0,-70.6);
        ctx.bezierCurveTo(2.0,-75.2, -4.0,-73.4, -6.6,-66.6);
        ctx.lineTo(-8.6,-70.8); ctx.closePath();
      }, HR, HRN, 2.0, [3.0,-85, 14,-85, 12,-67.4, 4.0,-70.4], hairHi());
      SH([-6.6,-66.6, -10.0,-58.8, -12.0,-61.0, -9.2,-69.8], HR, HRN, 1.7);
    } else if(hs === 4){               /* ジン：黒髪＋髷 */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.7,-67.8);
        ctx.bezierCurveTo(-11.8,-79.2, -6.4,-83.0, 0,-83.0);
        ctx.bezierCurveTo(6.4,-83.0, 11.8,-79.2, 10.7,-67.8);
        ctx.lineTo(7.8,-72.0); ctx.lineTo(4.6,-68.2); ctx.lineTo(1.2,-72.8);
        ctx.lineTo(-2.6,-68.4); ctx.lineTo(-6.0,-72.6); ctx.closePath();
      }, HR, HRN, 2.1, [3.0,-85, 14,-85, 12,-67.4, 4.0,-70.4], hairHi());
      circ(0.8,-84.8, 2.8, HR, HRN, 1.7);
      stk([-2.0,-84.2, 3.6,-85.4], dk(AC,0.10), 1.4);
    } else if(hs === 5){               /* ココ：桃のぱっつんボブ */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-11.6,-68.0);
        ctx.bezierCurveTo(-12.6,-80.0, -6.6,-83.8, 0,-83.8);
        ctx.bezierCurveTo(6.6,-83.8, 12.6,-80.0, 11.6,-68.0);
        ctx.lineTo(9.2,-70.0); ctx.lineTo(7.0,-68.2); ctx.lineTo(4.0,-70.2);
        ctx.lineTo(1.0,-68.2); ctx.lineTo(-2.2,-70.2); ctx.lineTo(-5.0,-68.2);
        ctx.lineTo(-8.2,-70.2); ctx.closePath();
      }, HR, HRN, 2.0, [3.6,-86, 15,-86, 13,-67.4, 4.8,-70], hairHi());
      SH([-11.0,-78.4, -7.4,-81.6, -4.8,-77.8, -8.6,-75.0], AC, '#D8AEC0', 1.5);
    } else if(hs === 6){               /* テオ：銀髪の七三 */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.7,-68.0);
        ctx.bezierCurveTo(-11.8,-79.2, -6.4,-83.0, 0,-83.0);
        ctx.bezierCurveTo(6.4,-83.0, 11.8,-79.2, 10.7,-69.2);
        ctx.bezierCurveTo(6.4,-74.6, -1.2,-75.6, -4.8,-72.2);
        ctx.bezierCurveTo(-6.8,-70.4, -7.8,-68.6, -8.8,-68.0);
        ctx.closePath();
      }, HR, HRN, 2.0, [3.0,-85, 14,-85, 12,-68.4, 4.0,-72.8], hairHi());
      stk([-4.0,-79.4, 4.8,-75.8], dk(HR,0.24), 1.0);
    } else if(hs === 7){               /* ヒナ：橙前髪＋ゴーグル */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.7,-68.6);
        ctx.bezierCurveTo(-11.8,-79.2, -6.4,-83.2, 0,-83.2);
        ctx.bezierCurveTo(6.4,-83.2, 11.8,-79.2, 10.7,-68.6);
        ctx.lineTo(7.4,-71.6); ctx.lineTo(4.2,-69.2); ctx.lineTo(0.6,-72.0);
        ctx.lineTo(-3.0,-69.4); ctx.lineTo(-6.6,-71.8); ctx.closePath();
      }, HR, HRN, 2.0, [3.0,-85, 14,-85, 12,-68, 4.0,-71.4], hairHi());
      SH([-11.2,-75.8, 11.2,-75.8, 11.6,-71.0, -11.6,-71.0], '#3B3F4A', '#181C24', 1.6,
         [3.0,-76.2, 13,-76.2, 13,-70.6, 4.0,-70.6], null);
      circ(-5.4,-73.4, 2.7, lt(AC,0.30), '#2A3038', 1.4);
      circ( 5.4,-73.4, 2.7, lt(AC,0.30), '#2A3038', 1.4);
    } else if(hs === 8){               /* シロ：白髪のとがった前髪 */
      SH(function(){
        ctx.beginPath(); ctx.moveTo(-10.9,-67.0);
        ctx.bezierCurveTo(-12.2,-79.4, -6.4,-83.6, 0,-83.6);
        ctx.bezierCurveTo(6.4,-83.6, 12.2,-79.4, 10.9,-67.0);
        ctx.lineTo(8.2,-73.0); ctx.lineTo(5.6,-66.4); ctx.lineTo(2.6,-73.4);
        ctx.lineTo(-0.6,-66.8); ctx.lineTo(-3.8,-73.6); ctx.lineTo(-6.4,-67.2);
        ctx.closePath();
      }, HR, HRN, 2.1, [3.4,-86, 14,-86, 12,-66.4, 4.4,-70.4], hairHi());
      SH([-10.6,-75.4, -15.8,-81.4, -9.4,-79.4], HR, HRN, 1.6);
    } else if(hs === 9){               /* アヤ：緑の巻き毛 */
      for(k2 = 0; k2 < 6; k2++){
        cx2 = -10.4 + k2 * 4.2;
        cy2 = -78.2 + (k2 % 2) * 2.2;
        circ(cx2, cy2, 4.4, HR, HRN, 1.6);
      }
      if(!RIM) dot(-6.0,-80.0, 1.6, HRL);
    }
  }

  /* ================= 体 ================= */
  function legs(){
    var bootC = (i === 6) ? '#1A1D26' : (i === 8 ? dk(AC,0.34) : AC);
    var k, sx, x0, lc = (i === 10 || i === 4 || i === 5 || i === 9 || i === 1) ? OC : dk(OC,0.14);
    for(k = 0; k < 2; k++){
      sx = k ? 1 : -1;
      x0 = sx * 5.6;
      SH([x0-4.4,HIP-0.5, x0+4.4,HIP-0.5, x0+3.8,-15.5, x0+3.4,-8.6, x0-3.6,-8.6, x0-4.0,-15.5],
         lc, null, 1.9, [x0+0.9,HIP-1, x0+4.4,HIP-1, x0+3.6,-8, x0+1.2,-8], null);
      SH([x0-3.9,-9.4, x0+3.9,-9.4, x0+4.8,-3.0, x0+7.4,-2.4, x0+7.6,0, x0-4.3,0, x0-4.6,-2.8],
         bootC, ln(bootC), 2.0, [x0+1.1,-10, x0+7.6,-10, x0+7.6,0, x0+1.5,0],
         [x0-3.3,-8.8, x0+1.9,-8.8, x0+1.1,-7.0, x0-3.1,-7.0]);
    }
    if(!RIM) stk([0,HIP-0.5, 0,-11.0], dk(lc,0.44), 1.2);
  }

  function torso(){
    var base = (i === 10) ? SK0 : OC, bln = (i === 10) ? SKL : OCN;
    bodyFn = function(){
      ctx.beginPath();
      ctx.moveTo(-4.6,-51.6);
      ctx.bezierCurveTo(-SW*0.74,-51.2, -SW,-49.6, -SW,-46.4);   /* 僧帽筋→三角筋 */
      ctx.bezierCurveTo(-SW,-45.0, -CW,-44.6, -CW,CY);
      ctx.lineTo(-WW,WY); ctx.lineTo(-HW,HIP);
      ctx.lineTo(HW,HIP); ctx.lineTo(WW,WY); ctx.lineTo(CW,CY);
      ctx.bezierCurveTo(CW,-44.6, SW,-45.0, SW,-46.4);
      ctx.bezierCurveTo(SW,-49.6, SW*0.74,-51.2, 4.6,-51.6);
      ctx.closePath();
    };
    SH(bodyFn, base, bln, 2.2,
       [2.6,-53, SW+3,-53, SW+3,HIP+1, 3.6,HIP+1],
       [-SW+1.2,-50.8, -3.6,-50.4, -4.8,CY+2, -CW+1.2,CY-1]);
    SH([-2.7,-55.8, 2.7,-55.8, 3.1,-50.4, -3.1,-50.4], SK1, SKL, 1.7,
       [0.5,-56.2, 3.6,-56.2, 3.6,-50.0, 0.9,-50.0], null);
    if(RIM) return;
    qs(-6.8,-49.4, -3.4,-47.6, -0.6,-48.8, dk(OC,0.46), 0.9);   /* 鎖骨 */
    qs( 6.8,-49.4,  3.4,-47.6,  0.6,-48.8, dk(OC,0.46), 0.9);
  }

  /* スカート・コート裾（胴のクリップ外） */
  function skirt(){
    if(i === 5){
      SH([-8.0,-33.0, 8.0,-33.0, 10.4,-17.0, -10.4,-17.0], AC, '#D8AEC0', 2.0,
         [2.4,-33.4, 9,-33.4, 11,-16.6, 3.4,-16.6], null);
      if(!RIM){
        var q, fx;
        for(q = 0; q < 6; q++){ fx = -9.4 + q * 3.8; dot(fx, -17.0, 1.7, AC); }
        stk([-4.0,-32.4, -5.4,-18.0], '#E9C4D6', 1.0);
        stk([3.4,-32.4, 4.8,-18.0], dk(AC,0.16), 1.0);
      }
    } else if(i === 9){
      SH([-8.2,-33.0, 8.2,-33.0, 10.6,-15.0, -10.6,-15.0], dk(OC,0.02), '#000000', 2.0,
         [2.4,-33.4, 9.2,-33.4, 11.2,-14.6, 3.6,-14.6], null);
      if(!RIM){ stk([-3.6,-32.4, -5.0,-16.0], '#2A2E38', 1.0); stk([3.2,-32.4, 4.6,-16.0], '#2A2E38', 1.0); }
    } else if(i === 3 || i === 8){
      var cc = (i === 3) ? AC : dk(OC,0.08);
      SH([-9.4,-34.0, 9.4,-34.0, 11.4,-15.0, 4.0,-17.0, 0,-24.0, -4.0,-17.0, -11.4,-15.0],
         cc, ln(cc), 2.0, [2.6,-34.4, 10.2,-34.4, 12,-14.6, 3.6,-17.6], null);
    } else if(i === 4){
      SH([-9.2,-34.0, 9.2,-34.0, 10.8,-19.0, 3.6,-20.6, 0,-26.0, -3.6,-20.6, -10.8,-19.0],
         dk(OC,0.10), OCN, 2.0, [2.6,-34.4, 9.8,-34.4, 11.2,-18.6, 3.2,-21], null);
    }
  }

  function outfit(){
    if(RIM || !bodyFn) return;
    ctx.save(); bodyFn(); ctx.clip();          /* 服の細部は胴の形からはみ出さない */
    var mid = dk(OC,0.46);
    if(i === 0){          /* レオ：黄スーツ＋白襟＋ジッパー＋赤ベルト */
      SH([-SW,-51.6, -3.2,-47.4, 0,-44.2, 3.2,-47.4, SW,-51.6, SW-2.4,-45.6, 0,-41.0, -SW+2.4,-45.6], '#F6F8FA', '#B6BCC6', 1.7);
      stk([0,-44.2, 0,-30.0], '#EDEFF2', 1.8);
      dot(0,-43.0, 1.2, '#D8DCE2');
      stk([-1.0,-40.0, 1.0,-40.0], '#B0B6C0', 0.8);
      stk([-1.0,-36.8, 1.0,-36.8], '#B0B6C0', 0.8);
      stk([-1.0,-33.6, 1.0,-33.6], '#B0B6C0', 0.8);
      SH([-12,-30.4, 12,-30.4, 12,-25.6, -12,-25.6], AC, ACN, 1.7);
      qs(-7.4,-45.8, -4.2,-43.6, -6.4,-38.6, dk(OC,0.32), 1.0);
      qs( 7.4,-45.8,  4.2,-43.6,  6.4,-38.6, dk(OC,0.32), 1.0);
    } else if(i === 1){   /* ミオ：白と青の戦闘服 */
      SH([-SW,-51.6, -3.4,-47.0, 0,-43.6, 3.4,-47.0, SW,-51.6, SW-1.8,-41.8, 3.6,-37.6, -3.6,-37.6, -SW+1.8,-41.8], AC, ACN, 1.8,
         [2.4,-52, 13,-52, 13,-37, 3.2,-37], null);
      stk([-7.0,-35.2, 7.0,-35.2], dk(OC,0.24), 1.1);
      SH([-12,-30.6, 12,-30.6, 12,-26.6, -12,-26.6], AC, ACN, 1.6);
      dot(0,-42.0, 1.5, '#FFFFFF');
      stk([-9.6,-45.4, -6.6,-38.4], AC, 1.6);
      stk([ 9.6,-45.4,  6.6,-38.4], AC, 1.6);
    } else if(i === 2){   /* ガイ：矢筒のひも＋革ベルト */
      SH([-8.8,-48.4, -4.6,-48.4, 8.8,-30.0, 5.0,-30.0], AC, ACN, 1.7,
         [1.0,-40, 9,-40, 9,-29.6, 3.4,-29.6], null);
      SH([-12,-31.2, 12,-31.2, 12,-27.0, -12,-27.0], dk(AC,0.22), ACN, 1.7);
      circ(0,-29.1, 2.1, '#C9A05A', '#6B4A1E', 1.3);
      stk([-6.8,-44.8, 5.8,-41.8], dk(OC,0.30), 1.0);
      qs(-7.4,-41.4, -4.2,-39.0, -6.2,-34.4, mid, 0.9);
    } else if(i === 3){   /* ルナ：黒コート＋紫の前身頃 */
      SH([-SW+0.6,-49.4, -1.8,-46.4, 1.8,-46.4, SW-0.6,-49.4, SW-1.4,-27.0, 2.8,-27.0, 1.8,-44.0, -1.8,-44.0, -2.8,-27.0, -SW+1.4,-27.0],
         AC, ACN, 1.8, [2.2,-50, 13,-50, 13,-27, 3.0,-27], null);
      SH([-2.6,-46.2, 2.6,-46.2, 2.2,-28.0, -2.2,-28.0], lt(AC,0.44), ACN, 1.5);
      circ(0,-45.0, 2.0, '#F6E27A', '#8A6318', 1.3);
      stk([-9.0,-33.4, 9.0,-33.4], dk(AC,0.28), 1.2);
    } else if(i === 4){   /* ジン：羽織＋赤い帯 */
      SH([-SW,-51.6, -2.2,-45.8, 2.2,-45.8, SW,-51.6, SW-1.0,-27.0, 3.0,-27.0, 2.2,-45.0, -2.2,-45.0, -3.0,-27.0, -SW+1.0,-27.0],
         dk(OC,0.12), OCN, 1.8, [2.4,-52, 13,-52, 13,-27, 3.2,-27], null);
      SH([-2.8,-46.0, 2.8,-46.0, 2.6,-28.0, -2.6,-28.0], '#EAE4D6', '#A49B88', 1.5);
      SH([-12,-32.8, 12,-32.8, 12,-27.4, -12,-27.4], AC, ACN, 1.8,
         [2.2,-33.2, 12,-33.2, 12,-27, 2.8,-27], null);
      stk([-9.6,-30.2, 9.6,-30.2], dk(AC,0.38), 0.9);
      qs(-8.0,-42.4, -5.0,-39.8, -6.8,-35.0, dk(OC,0.42), 1.0);
    } else if(i === 5){   /* ココ：フリル＋エプロン */
      SH([-SW,-51.6, SW,-51.6, SW-1.4,-43.8, -SW+1.4,-43.8], AC, '#D8AEC0', 1.6);
      SH([-6.8,-43.8, 6.8,-43.8, 7.6,-33.0, -7.6,-33.0], AC, '#D8AEC0', 1.7,
         [2.2,-44.2, 8.4,-44.2, 8.4,-32.6, 3.0,-32.6], null);
      stk([-6.6,-42.2, 6.6,-42.2], '#E4BBCE', 1.0);
      qs(-8.4,-44.8, -5.6,-40.8, -7.4,-35.4, mid, 0.9);
    } else if(i === 6){   /* テオ：執事（白シャツ＋蝶ネクタイ） */
      SH([-7.0,-48.4, 0,-45.0, 7.0,-48.4, 5.8,-27.0, -5.8,-27.0], '#F4F6F8', '#A8AEB8', 1.7,
         [1.6,-49, 7.6,-49, 6.6,-27, 2.2,-27], null);
      SH([-4.0,-47.6, 0,-45.2, 4.0,-47.6, 2.8,-42.4, -2.8,-42.4], AC, '#8E95A2', 1.4);
      SH([-3.4,-46.4, -0.5,-45.2, -0.5,-42.8, -3.4,-44.0], '#1E2230', '#0C0F16', 1.3);
      SH([ 3.4,-46.4,  0.5,-45.2,  0.5,-42.8,  3.4,-44.0], '#1E2230', '#0C0F16', 1.3);
      stk([0,-37.6, 0,-28.4], '#C2C8D2', 0.9);
      dot(0,-39.6, 1.0, '#C2C8D2'); dot(0,-35.6, 1.0, '#C2C8D2');
      stk([-9.4,-31.4, 9.4,-31.4], dk(OC,0.5), 1.1);
    } else if(i === 7){   /* ヒナ：作業ジャケット＋工具ベルト */
      SH([-SW+0.6,-49.4, -1.8,-46.2, 1.8,-46.2, SW-0.6,-49.4, SW-1.4,-32.0, -SW+1.4,-32.0], OC, OCN, 1.7,
         [2.4,-50, 13,-50, 13,-31.6, 3.0,-31.6], null);
      stk([0,-45.8, 0,-32.4], dk(OC,0.42), 1.3);
      SH([-12,-32.4, 12,-32.4, 12,-27.6, -12,-27.6], '#3B3F4A', '#181C24', 1.7);
      SH([-2.4,-32.2, 2.4,-32.2, 2.4,-27.8, -2.4,-27.8], AC, ACN, 1.4);
      dot(-5.8,-41.6, 1.3, AC);
    } else if(i === 8){   /* シロ：黒コート */
      SH([-SW,-51.6, -2.0,-46.0, 2.0,-46.0, SW,-51.6, SW-1.0,-27.0, 3.2,-27.0, 2.2,-44.4, -2.2,-44.4, -3.2,-27.0, -SW+1.0,-27.0],
         dk(OC,0.08), OCN, 1.8, [2.4,-52, 13,-52, 13,-27, 3.4,-27], null);
      SH([-2.8,-46.2, 2.8,-46.2, 2.6,-28.0, -2.6,-28.0], AC, ACN, 1.5);
      stk([-8.4,-39.8, -3.6,-38.4], dk(OC,0.48), 1.0);
    } else if(i === 9){   /* アヤ：黒ドレス */
      SH([-SW+0.8,-49.4, 0,-44.8, SW-0.8,-49.4, SW-0.4,-33.0, -SW+0.4,-33.0],
         dk(OC,0.04), '#000000', 1.8, [2.4,-50, 12,-50, 12,-32.6, 3.2,-32.6], null);
      dot(0,-44.0, 1.6, AC);
      stk([-9.6,-33.4, 9.6,-33.4], AC, 1.2);
    } else if(i === 10){  /* ゴウ：道着（前あき・厚い胸板） */
      qs(-1.2,-46.0, -5.4,-45.4, -8.2,-41.0, dk(SK0,0.34), 1.4);
      qs( 1.2,-46.0,  5.4,-45.4,  8.2,-41.0, dk(SK0,0.34), 1.4);
      mv([-8.4,-45.0, -1.0,-46.2, -1.0,-41.0, -7.6,-40.2]); ctx.fillStyle = SK1; ctx.fill();
      mv([ 1.0,-46.2,  8.4,-45.0,  7.6,-40.2,  1.0,-41.0]); ctx.fillStyle = SK1; ctx.fill();
      stk([0,-46.2, 0,-38.4], dk(SK0,0.36), 1.3);
      qs(-6.6,-40.4, 0,-38.6, 6.6,-40.4, dk(SK0,0.26), 1.1);
      stk([-4.4,-36.2, 4.4,-36.2], dk(SK0,0.22), 1.0);
      stk([-3.8,-32.8, 3.8,-32.8], dk(SK0,0.22), 1.0);
      SH([-SW,-51.8, -3.0,-46.4, -6.0,-27.0, -SW+0.6,-27.0], OC, '#9E8D6E', 2.0,
         [-SW,-52, -SW+3.4,-52, -SW+2.6,-27, -SW,-27], null, dk(OC,0.20));
      SH([ SW,-51.8,  3.0,-46.4,  6.0,-27.0,  SW-0.6,-27.0], OC, '#9E8D6E', 2.0,
         [2.6,-47, SW,-52, SW,-27, 4.4,-27], null);
      stk([-3.0,-46.4, -6.0,-27.0], dk(OC,0.28), 1.2);
      stk([ 3.0,-46.4,  6.0,-27.0], dk(OC,0.28), 1.2);
      SH([-12,-31.8, 12,-31.8, 12,-26.8, -12,-26.8], AC, ACN, 1.9,
         [2.4,-32.2, 12,-32.2, 12,-26.4, 3.0,-26.4], null);
    }
    /* 服のシワ（「く」の字） */
    if(i !== 10 && i !== 0){
      qs(-5.6,-38.4, -3.2,-36.6, -5.0,-33.8, mid, 0.9);
      qs( 5.6,-38.4,  3.2,-36.6,  5.0,-33.8, mid, 0.9);
    }
    ctx.restore();
    /* クリップ外に出す小物 */
    if(i === 0) circ(0,-28.0, 2.8, '#E8C15A', '#8A6318', 1.5);
    if(i === 10) stk([2.2,-27.0, 3.6,-20.2], AC, 1.7);
    if(i === 7) stk([5.6,-27.8, 6.6,-22.6], '#8E96A2', 1.6);
  }

  function sleeveCol(){
    if(i === 10) return SK0;
    if(i === 1) return AC;
    if(i === 0 || i === 5 || i === 9) return OC;
    return dk(OC, 0.06);
  }

  /* 腕：肩から手首へ細るポリゴン（三角筋を見せる） */
  function arm(g, wristY, bc, lineC){
    var ox = g * (SW + 0.7), ix = g * (SW - 3.9);
    SH([g*(SW-3.2),-50.6, ox,-46.6, g*(SW+1.5),-39.4, g*(SW+0.5),wristY,
        g*(SW-3.4),wristY, g*(SW-3.6),-39.0, ix,-45.6],
       bc, lineC || ln(bc), 1.9,
       [g*(SW+0.2),-51, g*(SW+2.4),-51, g*(SW+2.0),wristY+0.6, g*(SW-1.2),wristY+0.6],
       [g*(SW-2.6),-49.4, g*(SW-0.8),-47.6, g*(SW-1.6),-41.0, g*(SW-3.2),-42.0]);
    if(!RIM){
      qs(g*(SW-2.6),-46.0, g*(SW-0.2),-44.4, g*(SW-2.4),-41.6, dk(bc,0.44), 0.9);
    }
    var hxx = g*(SW-1.5), hyy = wristY - 1.4;
    SH([hxx-1.6,hyy-0.6, hxx+1.6,hyy-0.6, hxx+2.4,hyy+1.0, hxx+2.2,hyy+2.9, hxx+1.0,hyy+4.0, hxx-1.2,hyy+4.0, hxx-2.3,hyy+2.6, hxx-2.4,hyy+0.9],
       bc === SK0 ? SK0 : (i===7||i===8 ? lt(AC,0.22) : SK0),
       (i===7||i===8) ? ACN : SKL, 1.6,
       [hxx+0.4,hyy-0.4, hxx+2.6,hyy-0.4, hxx+2.3,hyy+4, hxx+0.8,hyy+4], null);
    return [hxx, hyy + 1.8];
  }

  function armBack(){
    var mech = (i === 7), bc = mech ? AC : sleeveCol();
    arm(-1, -33.0, bc, mech ? ACN : null);
    if(!RIM && mech) stk([-(SW-1.0),-43.2, -(SW-2.8),-42.4], dk(AC,0.42), 1.0);
  }

  function armFront(){
    var cyb = (i === 8);
    var bc = cyb ? AC : sleeveCol();
    var h = arm(1, -33.4 + swy * 0.6, bc, cyb ? ACN : null);
    if(!RIM && cyb){
      stk([SW-2.6,-44.6, SW+0.4,-44.0], dk(AC,0.44), 1.1);
      stk([SW-2.2,-38.8, SW+1.0,-38.2], dk(AC,0.44), 1.1);
      dot(SW-1.6,-47.2, 1.2, lt(AC,0.5));
    }
    return h;
  }

  /* ================= 小物 ================= */
  function propBack(){
    var p = C.pr;
    if(p === 'cape'){
      SH([-SW+1.0,-50.6, SW-1.0,-50.6, 14.4+swy,-21.0, 10.8+swy,-17.6, 4.4,-21.4, -2.0,-16.8,
          -8.6,-21.4, -14.0+swy*0.6,-17.2, -14.6,-38.0],
         AC, ACN, 2.1, [3.0,-52, 17,-52, 13,-16, 4.4,-19], null);
      if(!RIM){
        qs(-6.4,-47.8, -5.2,-34.0, -7.8,-21.0, dk(AC,0.44), 1.0);
        qs( 4.4,-47.8,  6.0,-34.0,  7.0,-20.2, dk(AC,0.44), 1.0);
      }
    } else if(p === 'bow'){
      if(RIM){
        ctx.beginPath(); ctx.moveTo(-12.5,-55); ctx.quadraticCurveTo(-24.5,-39, -12.5,-22);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5.6; ctx.stroke(); return;
      }
      ctx.beginPath(); ctx.moveTo(-12.5,-55); ctx.quadraticCurveTo(-24.5,-39, -12.5,-22);
      ctx.strokeStyle = '#5E3F18'; ctx.lineWidth = 3.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12.9,-55); ctx.quadraticCurveTo(-23.4,-39, -12.9,-22);
      ctx.strokeStyle = AC; ctx.lineWidth = 1.5; ctx.stroke();
      stk([-12.5,-55, -12.5,-22], '#F2EADA', 1.0);
      stk([-14.6,-49.6, -6.2,-25.4], '#C4B392', 1.1);
    } else if(p === 'sword'){
      SH([-15.2,-23.0, 7.4,-35.0, 8.6,-32.4, -14.4,-20.2], '#15171D', '#04060A', 1.7,
         [-15.2,-23.8, 8.8,-35.8, 8.8,-33.8, -15.2,-22], null);
      if(!RIM){
        circ(8.0,-34.0, 2.2, '#E8C15A', '#8A6318', 1.3);
        stk([8.6,-34.8, 13.8,-37.6], '#3B2B1E', 2.0);
        stk([13.8,-37.6, 15.0,-38.2], '#E8C15A', 1.4);
      }
    } else if(p === 'psy'){
      if(RIM) return;
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(0,-45, 20.5 + swy*0.8, -2.55, -0.6); ctx.strokeStyle = AC; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-45, 24.5 + swy*0.8, -2.25, -1.45); ctx.strokeStyle = lt(AC,0.4); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-45, 22.5 + swy*0.8, 0.55, 1.7); ctx.strokeStyle = AC; ctx.lineWidth = 1.7; ctx.stroke();
      ctx.globalAlpha = 1; ctx.restore();
    }
  }

  function propFront(hand){
    var p = C.pr;
    if(p === 'staff'){
      SH([12.8,-58.0, 15.0,-58.0, 14.2,-1.6, 12.0,-1.6], '#6B4A2A', '#3A2716', 1.7,
         [13.9,-58, 15.6,-58, 14.8,-1.6, 13.1,-1.6], null);
      circ(13.9,-60.8, 3.4, AC, ACN, 1.7);
      if(!RIM){
        dot(12.8,-61.9, 1.2, '#F6E27A');
        ctx.save(); ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(13.9,-60.8, 5.4, 0, TAU); ctx.strokeStyle = '#F6E27A'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.globalAlpha = 1; ctx.restore();
      }
    } else if(p === 'ladle'){
      if(!hand) return;
      SH([hand[0]-1.0,hand[1]+0.8, hand[0]+1.0,hand[1]+0.8, hand[0]+5.4,-46.0, hand[0]+3.4,-46.6],
         '#C8A272', '#6B4A2A', 1.5);
      circ(hand[0]+6.0,-48.4, 3.2, '#D8DEE6', '#767E8A', 1.6);
      if(!RIM) dot(hand[0]+5.0,-49.4, 1.1, '#FFFFFF');
    } else if(p === 'butler'){
      if(!hand) return;
      SH([hand[0]-4.4,hand[1]-6.8, hand[0]+4.4,hand[1]-6.8, hand[0]+3.4,hand[1]-4.2, hand[0]-3.4,hand[1]-4.2],
         '#DCE2EA', '#767E8A', 1.5, [hand[0]+0.8,hand[1]-7, hand[0]+4.6,hand[1]-7, hand[0]+3.6,hand[1]-4, hand[0]+1.2,hand[1]-4], null);
      SH([hand[0]-2.6,hand[1]-4.4, hand[0]+2.8,hand[1]-4.4, hand[0]+2.4,hand[1]+1.2, hand[0]-2.2,hand[1]+1.2],
         '#F4F6F8', '#AEB4BE', 1.4);
    } else if(p === 'cyborg'){
      if(RIM) return;
      SH([SW-5.2,-51.4, SW+2.6,-50.6, SW+3.2,-44.8, SW-4.0,-45.6], AC, ACN, 1.6,
         [SW-1.2,-51.6, SW+3.4,-51, SW+3.6,-44.8, SW-0.4,-45.2], null);
      dot(SW-1.6,-48.6, 1.3, '#8FE8FF');
    } else if(p === 'mech'){
      if(RIM) return;
      SH([SW-5.0,-51.2, SW+2.4,-50.4, SW+3.0,-45.2, SW-3.8,-46.0], AC, ACN, 1.6);
      dot(SW-1.4,-48.4, 1.2, '#D8F4FF');
    }
  }

  /* ================= 台座と影 ================= */
  function baseAndShadow(){
    ctx.save();
    ctx.beginPath(); ctx.ellipse(1.6, 1.2, 15.6, 4.6, 0, 0, TAU);
    ctx.fillStyle = 'rgba(24,18,38,0.26)'; ctx.fill();
    var g = ctx.createLinearGradient(0, -7.8, 0, 2.8);
    g.addColorStop(0, lt(col, 0.54)); g.addColorStop(0.52, col); g.addColorStop(1, dk(col, 0.46));
    ctx.beginPath(); ctx.ellipse(0, -2.4, 16.6, 6.0, 0, 0, TAU);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#E8C15A'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -3.8, 12.0, 3.5, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.0; ctx.stroke();
    ctx.restore();
  }

  function head(){
    if(RIM){ headPath(); paintRim(2.1); return; }
    headPath(); ctx.fillStyle = SK0; ctx.fill();
    ctx.save(); headPath(); ctx.clip();
    /* 中間調（面に沿った直線的な境界） */
    mv([3.0,-82, 13,-82, 13,-50, 5.0,-50]); ctx.fillStyle = SK1; ctx.fill();
    /* 暗部：こめかみ〜頬骨、顎下 */
    mv([6.4,-64.6, 10.4,-67.0, 9.0,-59.0, 5.0,-60.6]); ctx.fillStyle = SK2; ctx.fill();
    mv([-3.8,-54.4, 3.8,-54.4, 2.2,-51.4, -2.4,-51.4]); ctx.fillStyle = SK2; ctx.fill();
    /* 前髪の落ち影 */
    if(C.hs !== 10){
      mv([-13,-84, 13,-84, 13,-72.6, -13,-72.6]); ctx.fillStyle = SK2; ctx.fill();
      mv([-13,-72.6, 13,-72.6, 13,-70.4, -13,-70.4]); ctx.fillStyle = SK1; ctx.fill();
    }
    /* 耳 */
    mv([-9.8,-67.6, -8.0,-68.2, -7.6,-63.0, -9.4,-62.6]); ctx.fillStyle = SK1; ctx.fill();
    mv([ 9.8,-67.6,  8.0,-68.2,  7.6,-63.0,  9.4,-62.6]); ctx.fillStyle = SK2; ctx.fill();
    ctx.restore();
    qs(-9.4,-67.2, -7.8,-65.2, -8.9,-63.0, SKL, 0.95);
    qs( 9.4,-67.2,  7.8,-65.2,  8.9,-63.0, SKL, 0.95);
    headPath(); ctx.strokeStyle = SKL; ctx.lineWidth = 2.1; ctx.stroke();
  }

  function figure(){
    propBack();
    hairBack();
    armBack();
    legs();
    skirt();
    torso();
    outfit();
    var hand = armFront();
    propFront(hand);
    head();
    hairFront();
    face();
    if(i === 6 && !RIM){   /* テオ：眼鏡 */
      circ(-4.6,-64.2, 3.6, 'rgba(212,232,246,0.28)', '#525A68', 1.4);
      circ( 4.6,-64.2, 3.6, 'rgba(212,232,246,0.28)', '#525A68', 1.4);
      stk([-1.0,-64.6, 1.0,-64.6], '#525A68', 1.2);
      stk([8.2,-64.6, 10.0,-65.6], '#525A68', 1.1);
      stk([-8.2,-64.6, -10.0,-65.6], '#525A68', 1.1);
      stk([-7.0,-66.4, -3.2,-66.8], 'rgba(255,255,255,0.85)', 1.3);
    }
    if(i === 9 && !RIM){   /* アヤ：光る瞳 */
      ctx.save(); ctx.globalAlpha = 0.6;
      dot(-4.6,-64.2, 2.5, AC); dot(4.6,-64.2, 2.5, AC);
      ctx.globalAlpha = 1; ctx.restore();
      dot(-4.6,-64.2, 1.0, '#EAFFF4'); dot(4.6,-64.2, 1.0, '#EAFFF4');
    }
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 3;
  ctx.lineCap = 'butt';
  ctx.scale(0.88, 0.88);        /* 全体を 80px 高さ・±28px 内へ収める */
  baseAndShadow();
  ctx.scale(f, 1);
  ctx.translate(0, bob);
  RIM = true;  figure();        /* 1回目：白フチ */
  RIM = false; figure();        /* 2回目：本描画 */
  ctx.restore();
}