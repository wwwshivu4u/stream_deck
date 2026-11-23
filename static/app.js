    var QRCode;!function(){function a(a){this.mode=4,this.data=a,this.parsedData=[];for(var b=[],c=0,d=this.data.length;c<d;c++){var e=this.data.charCodeAt(c);e>65536?(b.push(240|e>>18&7),b.push(128|e>>12&63),b.push(128|e>>6&63),b.push(128|e&63)):e>2048?(b.push(224|e>>12&15),b.push(128|e>>6&63),b.push(128|e&63)):e>128?(b.push(192|e>>6&3),b.push(128|e&63)):b.push(e)}this.parsedData=b}function b(a,b){this.typeNumber=a,this.errorCorrectionLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function c(a,b){for(var c=0;c<a.length&&0==a[c];)c++;for(var d=new Array(a.length-c+b),e=0;e<a.length-c;e++)d[e]=a[e+c];return d}function d(a,b,c){for(var d=1;d<=c;d++)if(a.getBestCodeLength(d)<=b)return d;throw new Error("code length overflow")}var e={};e.QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,735,565,439],[1091,815,611,461],[1171,865,661,511],[1273,940,715,535],[1367,1020,751,593],[1465,1088,805,625],[1528,1130,868,658],[1628,1190,908,698],[1732,1264,982,742],[1843,1353,1033,790],[1955,1439,1115,842],[2071,1538,1174,898],[2191,1618,1276,958],[2306,1708,1351,983],[2434,1803,1423,1051],[2566,1861,1499,1093],[2702,1994,1579,1139],[2812,2070,1652,1219],[2956,2152,1733,1273]];e.BitBuffer=function(){this.buffer=[],this.length=0};e.BitBuffer.prototype={get:function(a){return 1==(this.buffer[Math.floor(a/8)]>>>7-a%8&1)},put:function(a,b){for(var c=0;c<b;c++)this.putBit(1==(a>>>b-c-1&1))},lengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128-this.length%8),this.length++}};var f={createFromBytes:function(a,b){return new e.Polynomial(a,b)},glog:function(a){return f.LOG_TABLE[a]},gexp:function(a){return f.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var g=0;8>g;g++)f.EXP_TABLE[g]=1<<g;for(var g=8;256>g;g++)f.EXP_TABLE[g]=f.EXP_TABLE[g-4]^f.EXP_TABLE[g-5]^f.EXP_TABLE[g-6]^f.EXP_TABLE[g-8];for(var g=0;255>g;g++)f.LOG_TABLE[f.EXP_TABLE[g]]=g;e.Polynomial=function(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]};e.Polynomial.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=f.gexp(f.glog(this.get(c))+f.glog(a.get(d)));return new e.Polynomial(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=f.glog(this.get(0))-f.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=f.gexp(f.glog(a.get(d))+b);return new e.Polynomial(c,0).mod(a)}};var h={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var a=0;a<this.moduleCount;a++){this.modules[a]=new Array(this.moduleCount);for(var c=0;c<this.moduleCount;c++)this.modules[a][c]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(!1,0),this.typeNumber>=7&&this.setupTypeNumber(!1),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectionLevel,this.dataList)),this.mapData(this.dataCache,0)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){var a=b.getPatternPosition(this.typeNumber);for(var c=0;c<a.length;c++)for(var d=0;d<a.length;d++){var e=a[c],f=a[d];if(null==this.modules[e][f])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[e+g][f+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=this.getBCHTypeNumber(),c=0;18>c;c++){var d=!a&&1==(b>>c&1);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(b>>c&1);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectionLevel<<3|b,d=this.getBCHTypeInfo(c),e=0;15>e;e++){var f=!a&&1==(d>>e&1);6>e?this.modules[e][8]=f:8>e?this.modules[e+1][8]=f:this.modules[this.moduleCount-15+e][8]=f}for(var e=0;15>e;e++){var f=!a&&1==(d>>e&1);8>e?this.modules[8][this.moduleCount-e-1]=f:9>e?this.modules[8][15-e-1+1]=f:this.modules[8][15-e-1]=f}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,f=0,g=this.moduleCount-1;g>0;g-=2)for(6==g&&g--;;){for(var h=0;2>h;h++)if(null==this.modules[d][g-h]){var i=!1;f<a.length&&(i=1==(a[f]>>>e&1));var j=0==((d+g-h)%2);j&&(i=!i),this.modules[d][g-h]=i,e--,-1==e&&(f++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}},getBCHTypeInfo:function(a){for(var b=a<<10;b-this.getBCHTypeInfo(b)>=0;);return b},getBCHTypeNumber:function(){for(var a=this.typeNumber<<12;a-this.getBCHTypeNumber(a)>=0;);return a}};b.createData=function(a,b,c){for(var d=new e.BitBuffer,f=0;f<c.length;f++){var g=c[f];d.put(g.mode,4),d.put(g.data.length,8);for(var h=0;h<g.parsedData.length;h++)d.put(g.parsedData[h],8)}var i=e.QRCodeLimitLength[a-1][b];for(;d.lengthInBits()%8!=0;)d.putBit(!1);for(;d.lengthInBits()<8*i;)d.put(236,8),d.lengthInBits()<8*i&&d.put(17,8);return d.buffer};b.getPatternPosition=function(a){return[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,50,74,98,122,146,170],[6,30,54,78,102,126,150,174],[6,34,58,82,106,130,154,178],[6,30,54,78,102,126,150,174,198]][a-1]};QRCode=function(a,c){this.el=typeof a=="string"?document.getElementById(a):a;var d=typeof c=="string"?c:c.text;this.makeCode(d)};QRCode.prototype.makeCode=function(a){try{var c=new b(4,1);c.addData(a),c.make();var d=document.createElement("canvas"),e=c.getModuleCount(),f=180,g=Math.floor(f/e);d.width=e*g,d.height=e*g;var h=d.getContext("2d");h.fillStyle="#ffffff",h.fillRect(0,0,d.width,d.height);for(var i=0;e>i;i++)for(var j=0;e>j;j++)c.isDark(i,j)&&(h.fillStyle="#000000",h.fillRect(j*g,i*g,g,g));this.el.innerHTML="",this.el.appendChild(d)}catch(k){this.el.innerHTML="<p style='color:#333;font-size:12px;'>"+a+"</p>"}};
    }();


    // State Persistence Keys in localStorage
    const STATE_KEY = 'volume_mixer_state';
    const SHORTCUTS_KEY = 'volume_mixer_shortcuts';
    const VIEW_KEY = 'volume_mixer_view';
    const RECENCY_KEY = 'volume_mixer_recency';

    // Global Inactivity & Sleep State
    let isSleeping = false;

    // Application Icons Library (SVG Paths)
    function getAppSvg(name, displayName) {
      const n = (name + " " + displayName).toLowerCase();
      if (n.includes('spotify')) {
        return `<svg viewBox="0 0 24 24" fill="#1DB954"><path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.809-.87 7.076-.496 9.722 1.115.294.18.386.563.207.855zm1.226-2.724c-.227.367-.71.482-1.077.255-2.69-1.653-6.79-2.133-9.972-1.168-.413.125-.853-.107-.978-.52-.125-.413.107-.853.52-.978 3.633-1.103 8.147-.568 11.252 1.336.368.226.483.71.255 1.075zm.106-2.835C14.692 8.95 9.37 8.775 6.297 9.71c-.495.15-1.026-.13-1.176-.625-.15-.494.13-1.026.624-1.176 3.532-1.073 9.404-.866 13.115 1.338.445.264.59 1.05.326 1.495-.264.444-1.05.59-1.494.325z"/></svg>`;
      }
      if (n.includes('discord')) {
        return `<svg viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
      }
      if (n.includes('chrome')) {
        return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#EA4335"/><circle cx="12" cy="12" r="7" fill="#FBBC05"/><circle cx="12" cy="12" r="4.5" fill="#34A853"/><circle cx="12" cy="12" r="2.8" fill="#4285F4"/></svg>`;
      }
      if (n.includes('steam')) {
        return `<svg viewBox="0 0 24 24" fill="#00adee"><path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 .08.97l5.37 2.21a3.5 3.5 0 0 0 3.25-.68l3.18 1.31A2.5 2.5 0 1 0 16.5 13l-1.32-3.18a3.5 3.5 0 0 0-.68-3.25L12 2zm4.5 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM9 14.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`;
      }
      if (n.includes('cs2') || n.includes('csgo') || n.includes('counter')) {
        return `<svg viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 17.93V17h-2v2.93A8 8 0 0 1 4.07 13H7v-2H4.07A8 8 0 0 1 11 4.07V7h2V4.07A8 8 0 0 1 19.93 11H17v2h2.93A8 8 0 0 1 13 19.93zM12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3z"/></svg>`;
      }
      if (n.includes('firefox')) {
        return `<svg viewBox="0 0 24 24" fill="#ff7139"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm5.7 6.3a8 8 0 0 1-1.3 7.8 7.9 7.9 0 0 1-6.1 3.4 8 8 0 0 1-5.8-2.6 8 8 0 0 1 9.8-11.4 6 6 0 0 0-2.6 2.8 5 5 0 0 1 6-0z"/></svg>`;
      }
      if (n.includes('edge') || n.includes('msedge')) {
        return `<svg viewBox="0 0 24 24" fill="#0078D7"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6 11c-.5 3-3 5-6 5a6 6 0 0 1-6-6c0-3.3 2.7-6 6-6 1 0 2.5.5 3.5 1.5l-2 2A3 3 0 0 0 12 8a4 4 0 0 0-4 4 4 4 0 0 0 4 4c2 0 3.5-1 4-2.5h-4v-2.5h6z"/></svg>`;
      }
      if (n.includes('nv') || n.includes('nvidia')) {
        return `<svg viewBox="0 0 24 24" fill="#76B900"><path d="M7 6v12h10V6H7zm8 10H9V8h6v8zm-7-9V5h8v2H8zm8 12H8v-2h8v2z"/></svg>`;
      }
      if (n.includes('system') || n.includes('audio') || n.includes('windows')) {
        return `<svg viewBox="0 0 24 24" fill="#00a4ef"><path d="M3 5.5l7-1v7l-7 .1zm0 7.5l7 .1v7l-7-1.1zm8-8.7l10-1.3v9l-10 .1zm0 8.7l10 .1v9l-10-1.3z"/></svg>`;
      }
      if (n.includes('vlc') || n.includes('media') || n.includes('player')) {
        return `<svg viewBox="0 0 24 24" fill="#ff8800"><path d="M12 2L4 18h16L12 2zm0 5l4.5 9h-9L12 7zM3 20h18v2H3z"/></svg>`;
      }
      return `<svg viewBox="0 0 24 24" fill="#94a3b8"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10z"/><circle cx="7" cy="13" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="17" cy="13" r="1.5"/></svg>`;
    }

    // Shortcut Icons Library
    function getShortcutIconHtml(iconName) {
      if (!iconName) return '⚡';
      const map = {
        'layout_vertical': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z"/></svg>',
        'layout_horizontal': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 4h7v16H4V4zm9 0h7v16h-7V4z"/></svg>',
        'record': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>',
        'mic_off': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',
        'headphones': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>',
        'play_pause': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
        'next': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
        'prev': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>',
        'desktop': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>',
        'lock': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
        'camera': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
        'cpu': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 2v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V7c0-1.1-.9-2-2-2h-2V2h-2v2h-2V2H9zm8 15H7V7h10v10z"/></svg>',
        'volume_off': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
        'globe': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.93 9h-3.18a15.77 15.77 0 0 0-1.39-5.06A8.02 8.02 0 0 1 19.93 11zM12 4.07c.97 1.48 1.77 3.65 2.13 6.93H9.87c.36-3.28 1.16-5.45 2.13-6.93zm-3.36 1.87A15.77 15.77 0 0 0 7.25 11H4.07a8.02 8.02 0 0 1 4.57-5.06zM4.07 13h3.18a15.77 15.77 0 0 0 1.39 5.06A8.02 8.02 0 0 1 4.07 13zm7.93 6.93c-.97-1.48-1.77-3.65-2.13-6.93h4.26c-.36 3.28-1.16 5.45-2.13 6.93zm3.36-1.87a15.77 15.77 0 0 0 1.39-5.06h3.18a8.02 8.02 0 0 1-4.57 5.06z"/></svg>',
        'music': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
        'gamepad': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
        'cube': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
        'code': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
        'terminal': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
        'folder': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
        'edit': '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        'sparkles': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2zm7 15l1.2 2.8L23 21l-2.8 1.2L19 25l-1.2-2.8L15 21l2.8-1.2L19 17zm-14 0l1.2 2.8L9 21l-2.8 1.2L5 25l-1.2-2.8L1 21l2.8-1.2L5 17z"/></svg>',
        'star': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
        'trash': '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
      };
      return map[iconName] || iconName;
    }

    // Most Used App Usage Tracker (Persisted in localStorage, Updated Weekly)
    const USAGE_STATS_KEY = 'volume_mixer_usage_stats';
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    function getUsageStats() {
      try {
        const raw = localStorage.getItem(USAGE_STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {}
      return {
        last_weekly_rotation: Date.now(),
        current_counts: {},
        frozen_rankings: {}
      };
    }

    function checkWeeklyUsageRotation(stats) {
      const now = Date.now();
      if (!stats.last_weekly_rotation || (now - stats.last_weekly_rotation >= ONE_WEEK_MS)) {
        // A week has passed! Snapshot accumulated counts into frozen_rankings
        stats.frozen_rankings = { ...(stats.current_counts || {}) };
        stats.last_weekly_rotation = now;
        try {
          localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
        } catch (e) {}
        return true;
      }
      return false;
    }

    function recordAppUsage(appKey) {
      if (!appKey) return;
      const cleanKey = String(appKey).toLowerCase().replace(/\.exe$/i, '').trim();
      const stats = getUsageStats();
      stats.current_counts = stats.current_counts || {};
      stats.current_counts[cleanKey] = (stats.current_counts[cleanKey] || 0) + 1;

      // Seed frozen_rankings if empty so newly opened apps appear immediately
      stats.frozen_rankings = stats.frozen_rankings || {};
      if (stats.frozen_rankings[cleanKey] === undefined) {
        stats.frozen_rankings[cleanKey] = stats.current_counts[cleanKey];
      }

      checkWeeklyUsageRotation(stats);
      try {
        localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
      } catch (e) {}
    }

    function getAppUsageScore(appKey) {
      if (!appKey) return 0;
      const cleanKey = String(appKey).toLowerCase().replace(/\.exe$/i, '').trim();
      const stats = getUsageStats();
      checkWeeklyUsageRotation(stats);
      return (stats.frozen_rankings && stats.frozen_rankings[cleanKey]) ||
             (stats.current_counts && stats.current_counts[cleanKey]) || 0;
    }

    function touchRecency(key) {
      recordAppUsage(key);
    }

    // State Variables
    let currentMasterVolume = 100;
    let currentMasterMuted = false;
    let localSessions = [];
    let currentShortcuts = [];
    let isEditingDeck = false;
    let isDraggingGesture = false;

    // Gesture Controller for Volume Sliders
    let activePointerId = null;
    let activeTarget = null;
    let activeTileElement = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerStartTime = 0;
    let holdTimer = null;
    let hasMovedNoticeably = false;
    const HOLD_THRESHOLD_MS = 160;

    const sliderHud = document.getElementById('slider-hud');
    const hudName = document.getElementById('hud-name');
    const hudVol = document.getElementById('hud-vol');

    function startGesture(targetInfo, clientX, clientY, pointerId, element) {
      activePointerId = pointerId;
      activeTarget = targetInfo;
      activeTileElement = element;
      pointerStartX = clientX;
      pointerStartY = clientY;
      pointerStartTime = Date.now();
      hasMovedNoticeably = false;
      isDraggingGesture = false;

      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        activateSlider();
      }, HOLD_THRESHOLD_MS);
    }

    function activateSlider() {
      if (!activeTarget || !activeTileElement) return;
      isDraggingGesture = true;
      haptic(35);
      activeTileElement.classList.add('is-sliding');
      if (sliderHud) {
        sliderHud.classList.add('active');
        updateHudUI(activeTarget.currentVol, activeTarget.name, activeTarget.muted, activeTarget.isSpotify);
      }
    }

    function moveGesture(clientX, clientY, e) {
      if (!activeTarget || !activeTileElement) return;
      const deltaX = clientX - pointerStartX;
      const deltaY = clientY - pointerStartY;

      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        hasMovedNoticeably = true;
      }
      if (Math.abs(deltaX) > 8 && !isDraggingGesture) {
        clearTimeout(holdTimer);
        activateSlider();
      }

      if (isDraggingGesture) {
        if (e && e.cancelable) e.preventDefault();
        const volChange = Math.round((deltaX / 180) * 100);
        let newVol = Math.max(0, Math.min(100, activeTarget.startVol + volChange));

        if (newVol !== activeTarget.currentVol) {
          activeTarget.currentVol = newVol;
          if (newVol > 0 && activeTarget.muted) activeTarget.muted = false;

          if (activeTarget.type === 'master') {
            updateMasterUI(newVol, activeTarget.muted);
          } else if (activeTarget.type === 'app-group') {
            updateAppGroupLive(activeTarget.groupKey, newVol, activeTarget.muted);
          } else {
            updateAppTileLive(activeTarget.pid, newVol, activeTarget.muted);
          }
          updateHudUI(newVol, activeTarget.name, activeTarget.muted, activeTarget.isSpotify);
          sendLiveVolume(activeTarget.type, activeTarget.pid, newVol);
        }
      }
    }

    function endGesture() {
      clearTimeout(holdTimer);
      if (!activeTarget) return;

      const duration = Date.now() - pointerStartTime;
      if (!isDraggingGesture && !hasMovedNoticeably && duration < HOLD_THRESHOLD_MS + 120) {
        haptic(30);
        if (activeTarget.type === 'app-group') {
          executeGroupMuteToggle(activeTarget.groupKey);
        } else {
          executeMuteToggle(activeTarget.type, activeTarget.pid);
        }
      } else if (isDraggingGesture) {
        haptic(20);
        if (activeTarget.type === 'app-group') {
          sendLiveGroupVolume(activeTarget.groupKey, activeTarget.currentVol);
        } else {
          sendLiveVolume(activeTarget.type, activeTarget.pid, activeTarget.currentVol);
        }
      }

      if (activeTileElement) activeTileElement.classList.remove('is-sliding');
      if (sliderHud) sliderHud.classList.remove('active');

      activeTarget = null;
      activeTileElement = null;
      activePointerId = null;
      isDraggingGesture = false;
      hasMovedNoticeably = false;
    }

    function updateHudUI(vol, name, muted, isSpotify = false) {
      if (!sliderHud) return;
      if (hudName) {
        hudName.textContent = isSpotify ? `${name || 'Spotify'} • Spotify Curve` : (name || 'Volume');
      }
      if (hudVol) hudVol.textContent = muted ? 'MUTED' : `${vol}%`;
    }

    function haptic(ms = 25) {
      if (navigator.vibrate) {
        try { navigator.vibrate(ms); } catch (e) {}
      }
    }

    window.addEventListener('pointermove', (e) => {
      if (activePointerId !== null && e.pointerId === activePointerId) {
        moveGesture(e.clientX, e.clientY, e);
      }
    }, { passive: false });

    window.addEventListener('pointerup', (e) => {
      if (activePointerId !== null && e.pointerId === activePointerId) {
        endGesture();
      }
    });

    window.addEventListener('pointercancel', () => endGesture());

    // Master Tile Elements & Events
    const masterTile = document.getElementById('master-tile');
    const masterFill = document.getElementById('master-fill');
    const masterSliderFill = document.getElementById('master-slider-fill');
    const masterPercent = document.getElementById('master-percent');
    const masterDesc = document.getElementById('master-desc');
    const appsGrid = document.getElementById('apps-grid');
    const appCounter = document.getElementById('app-counter');
    const netLabel = document.getElementById('net-label');

    function updateMasterUI(vol, muted) {
      if (masterFill) masterFill.style.width = `${vol}%`;
      if (masterSliderFill) masterSliderFill.style.width = `${vol}%`;
      if (masterPercent) masterPercent.textContent = muted ? 'MUTED' : `${vol}%`;
      if (masterTile) masterTile.classList.toggle('is-muted', muted);
      if (masterDesc) masterDesc.textContent = muted ? '🔇 Muted &bull; Tap to Unmute' : 'Tap to Mute &bull; Slide Horizontal for Volume';
      if (typeof updateStandbyVolumeUI === 'function') {
        updateStandbyVolumeUI(vol, muted);
      }
    }

    masterTile.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      startGesture({
        type: 'master',
        pid: 0,
        name: 'Master Volume',
        startVol: currentMasterVolume,
        currentVol: currentMasterVolume,
        muted: currentMasterMuted
      }, e.clientX, e.clientY, e.pointerId, masterTile);
    });

    // API Live Volume Senders
    let masterDebounceTimer = null;
    let appDebounceTimers = {};

    function sendLiveVolume(type, pid, volume) {
      if (type === 'master') {
        currentMasterVolume = volume;
        updateMasterUI(volume, currentMasterMuted);
        clearTimeout(masterDebounceTimer);
        masterDebounceTimer = setTimeout(async () => {
          try {
            await fetch('/api/master', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ volume: volume })
            });
          } catch (e) {}
        }, 20);
      } else {
        const s = localSessions.find(x => x.pid === pid);
        if (s) {
          s.volume = volume;
          updateAppTileLive(pid, volume, s.muted);
        }
        touchRecency(s ? s.name : pid);

        clearTimeout(appDebounceTimers[pid]);
        appDebounceTimers[pid] = setTimeout(async () => {
          try {
            await fetch('/api/app', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ pid: pid, volume: volume })
            });
          } catch (e) {}
        }, 20);
      }
    }

    async function executeMuteToggle(type, pid) {
      if (type === 'master') {
        currentMasterMuted = !currentMasterMuted;
        updateMasterUI(currentMasterVolume, currentMasterMuted);
        try {
          const res = await fetch('/api/master', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ muted: currentMasterMuted })
          });
          const st = await res.json();
          renderFullState(st);
        } catch (e) {}
      } else {
        const s = localSessions.find(x => x.pid === pid);
        const targetMute = s ? !s.muted : true;
        if (s) {
          s.muted = targetMute;
          updateAppTileLive(pid, s.volume, targetMute);
          touchRecency(s.name);
        }
        try {
          const res = await fetch('/api/app', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ pid: pid, muted: targetMute })
          });
          const st = await res.json();
          renderFullState(st);
        } catch (e) {}
      }
    }

    // Applications Sort Manager (Name A-Z, PID, or Most Used)
    const APPS_SORT_KEY = 'volume_mixer_apps_sort';
    let currentAppSortMode = 'name';
    try {
      const savedSort = localStorage.getItem(APPS_SORT_KEY);
      if (savedSort === 'recent') {
        currentAppSortMode = 'most_used';
        localStorage.setItem(APPS_SORT_KEY, 'most_used');
      } else if (savedSort && ['name', 'pid', 'most_used'].includes(savedSort)) {
        currentAppSortMode = savedSort;
      }
    } catch (e) {}

    const sortModesConfig = {
      name: { icon: '🔤', label: 'Name', toast: 'Sorted by Name (A-Z)' },
      pid: { icon: '🔢', label: 'PID', toast: 'Sorted by Process ID' },
      most_used: { icon: '🔥', label: 'Most Used', toast: 'Sorted by Most Used Apps (Updated Weekly)' }
    };

    function updateSortButtonUI() {
      const iconEl = document.getElementById('app-sort-icon');
      const labelEl = document.getElementById('app-sort-label');
      const cfg = sortModesConfig[currentAppSortMode] || sortModesConfig.name;
      if (iconEl) iconEl.textContent = cfg.icon;
      if (labelEl) labelEl.textContent = cfg.label;
      const btn = document.getElementById('app-sort-btn');
      if (btn) {
        btn.title = `Current sort: ${cfg.label}. Click to cycle (Name ➔ PID ➔ Most Used)`;
      }
    }

    function cycleAppSortMode() {
      const order = ['name', 'pid', 'most_used'];
      const nextIndex = (order.indexOf(currentAppSortMode) + 1) % order.length;
      currentAppSortMode = order[nextIndex];
      try {
        localStorage.setItem(APPS_SORT_KEY, currentAppSortMode);
      } catch (e) {}
      updateSortButtonUI();
      const cfg = sortModesConfig[currentAppSortMode];
      showToast(cfg.toast, cfg.icon);
      if (localSessions) {
        renderAppsGrid(localSessions, true);
      }
    }

    const appSortBtn = document.getElementById('app-sort-btn');
    if (appSortBtn) {
      updateSortButtonUI();
      appSortBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic(35);
        cycleAppSortMode();
      });
    }

    function sortSessionsList(sessions) {
      const list = [...sessions];
      if (currentAppSortMode === 'name') {
        list.sort((a, b) => {
          const nameA = (a.displayName || a.name || '').toLowerCase();
          const nameB = (b.displayName || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (currentAppSortMode === 'pid') {
        list.sort((a, b) => (a.pid || 0) - (b.pid || 0));
      } else if (currentAppSortMode === 'most_used') {
        list.sort((a, b) => {
          const scoreA = getAppUsageScore(a.name);
          const scoreB = getAppUsageScore(b.name);
          if (scoreB !== scoreA) return scoreB - scoreA;
          const nameA = (a.displayName || a.name || '').toLowerCase();
          const nameB = (b.displayName || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }
      return list;
    }

    // Application Grouping & Submenu Navigation State
    let activeSubmenuGroupKey = null;

    function getAppGroupKey(app) {
      if (!app) return 'unknown';
      const raw = (app.name || app.displayName || 'unknown').toLowerCase().trim();
      return raw.replace(/\.exe$/i, '');
    }

    function getAppGroupDisplayName(sessions) {
      if (!sessions || sessions.length === 0) return 'Application';
      const withDisplay = sessions.find(s => s.displayName && s.displayName !== s.name);
      if (withDisplay && withDisplay.displayName) return withDisplay.displayName;
      const name = sessions[0].name || 'Application';
      const clean = name.replace(/\.exe$/i, '');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    function updateAppTileLive(pid, vol, muted) {
      const tiles = document.querySelectorAll(`[id="app-tile-${pid}"]`);
      tiles.forEach(tile => {
        const fill = tile.querySelector('.volume-fill-bg');
        const sliderFill = tile.querySelector('.tile-slider-fill');
        const badge = tile.querySelector('.app-pct-badge');
        const iconHint = tile.querySelector('.app-vol-icon-hint');
        const effectiveVol = muted ? 0 : vol;

        if (fill) fill.style.width = `${effectiveVol}%`;
        if (sliderFill) sliderFill.style.width = `${effectiveVol}%`;
        if (badge) badge.textContent = muted ? 'MUTED' : `${vol}%`;
        if (iconHint) iconHint.textContent = muted ? '🔇' : (vol === 0 ? '🔈' : (vol > 50 ? '🔊' : '🔉'));
        tile.classList.toggle('is-muted', muted);
      });

      const session = localSessions.find(x => x.pid === pid);
      if (session) {
        session.volume = vol;
        session.muted = muted;
        const groupKey = getAppGroupKey(session);
        updateFolderTileLive(groupKey);
      }
    }

    function updateFolderTileLive(groupKey) {
      const folderTile = document.getElementById(`app-folder-${groupKey}`);
      const groupSessions = localSessions.filter(s => getAppGroupKey(s) === groupKey);
      if (groupSessions.length === 0) return;

      const allMuted = groupSessions.every(s => s.muted);
      const avgVol = Math.round(groupSessions.reduce((acc, s) => acc + (s.muted ? 0 : s.volume), 0) / groupSessions.length);

      if (folderTile) {
        const fill = folderTile.querySelector('.volume-fill-bg');
        const sliderFill = folderTile.querySelector('.tile-slider-fill');
        const badge = folderTile.querySelector('.app-pct-badge');
        const iconHint = folderTile.querySelector('.app-vol-icon-hint');
        if (fill) fill.style.width = `${allMuted ? 0 : avgVol}%`;
        if (sliderFill) sliderFill.style.width = `${allMuted ? 0 : avgVol}%`;
        if (badge) badge.textContent = allMuted ? 'MUTED' : `${avgVol}%`;
        if (iconHint) iconHint.textContent = allMuted ? '🔇' : (avgVol === 0 ? '🔈' : (avgVol > 50 ? '🔊' : '🔉'));
        folderTile.classList.toggle('is-muted', allMuted);
      }

      if (activeSubmenuGroupKey === groupKey) {
        updateSubmenuGroupTileLive(groupKey, avgVol, allMuted);
        const submenuBadge = document.getElementById('submenu-count-badge');
        if (submenuBadge) submenuBadge.textContent = `${groupSessions.length} Streams`;
      }
    }

    function updateSubmenuGroupTileLive(groupKey, vol, muted) {
      const tile = document.getElementById('submenu-master-tile');
      if (!tile) return;
      const fill = tile.querySelector('.volume-fill-bg');
      const sliderFill = tile.querySelector('.tile-slider-fill');
      const badge = tile.querySelector('.app-pct-badge');
      const iconHint = tile.querySelector('.app-vol-icon-hint');
      const effectiveVol = muted ? 0 : vol;

      if (fill) fill.style.width = `${effectiveVol}%`;
      if (sliderFill) sliderFill.style.width = `${effectiveVol}%`;
      if (badge) badge.textContent = muted ? 'MUTED' : `${vol}%`;
      if (iconHint) iconHint.textContent = muted ? '🔇' : (vol === 0 ? '🔈' : (vol > 50 ? '🔊' : '🔉'));
      tile.classList.toggle('is-muted', muted);
    }

    function updateAppGroupLive(groupKey, vol, muted) {
      const groupSessions = localSessions.filter(s => getAppGroupKey(s) === groupKey);
      groupSessions.forEach(s => {
        s.volume = vol;
        s.muted = muted;
        updateAppTileLive(s.pid, vol, muted);
      });
      updateSubmenuGroupTileLive(groupKey, vol, muted);
      updateFolderTileLive(groupKey);
    }

    function sendLiveGroupVolume(groupKey, vol) {
      const groupSessions = localSessions.filter(s => getAppGroupKey(s) === groupKey);
      groupSessions.forEach(s => {
        sendLiveVolume('app', s.pid, vol);
      });
    }

    async function executeGroupMuteToggle(groupKey) {
      const groupSessions = localSessions.filter(s => getAppGroupKey(s) === groupKey);
      if (groupSessions.length === 0) return;
      const targetMute = !groupSessions.every(s => s.muted);

      groupSessions.forEach(s => {
        s.muted = targetMute;
        updateAppTileLive(s.pid, s.volume, targetMute);
      });
      updateFolderTileLive(groupKey);

      for (const s of groupSessions) {
        try {
          await fetch('/api/app', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ pid: s.pid, muted: targetMute })
          });
        } catch (e) {}
      }
    }

    function createAppTileElement(app, isSubmenuChild = false) {
      const pid = app.pid;
      const isSpotify = Boolean(app.isSpotify || (app.name && app.name.toLowerCase().includes('spotify')) || (app.displayName && app.displayName.toLowerCase().includes('spotify')));
      const effectiveVol = app.muted ? 0 : app.volume;

      const tile = document.createElement('div');
      tile.className = `app-tile ${app.muted ? 'is-muted' : ''} ${isSpotify ? 'is-spotify' : ''}`;
      tile.id = `app-tile-${pid}`;

      tile.innerHTML = `
        <div class="volume-fill-bg" style="width: ${effectiveVol}%;"></div>
        <div class="app-tile-main">
          <div class="app-tile-left">
            <div class="app-avatar-wrap" title="Tap to Mute/Unmute">
              <div class="app-avatar">
                ${getAppSvg(app.name, app.displayName)}
              </div>
            </div>
            <div class="app-info-block">
              <div class="app-title-row">
                <span class="app-title-text" title="${app.displayName || app.name}">${app.displayName || app.name}</span>
                ${isSpotify ? '<span class="spotify-curve-tag" title="Spotify perceptual volume curve active (Audio Taper)">Spotify Curve</span>' : ''}
              </div>
              <div class="app-sub-text">
                <span class="app-pid-tag">PID ${app.pid}</span>
                <span class="app-proc-name">${app.name}</span>
              </div>
            </div>
          </div>
          <div class="app-tile-right">
            <button class="app-mute-toggle-btn" title="Toggle Mute" data-pid="${pid}">
              <span class="app-vol-icon-hint">${app.muted ? '🔇' : (app.volume === 0 ? '🔈' : (app.volume > 50 ? '🔊' : '🔉'))}</span>
            </button>
            <div class="app-pct-badge">${app.muted ? 'MUTED' : `${app.volume}%`}</div>
          </div>
        </div>
        <div class="tile-slider-bar">
          <div class="tile-slider-track">
            <div class="tile-slider-fill" style="width: ${effectiveVol}%;">
              <div class="tile-slider-thumb"></div>
            </div>
          </div>
        </div>
      `;

      const muteBtn = tile.querySelector('.app-mute-toggle-btn');
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          executeMuteToggle('app', pid);
        });
      }

      const avatarWrap = tile.querySelector('.app-avatar-wrap');
      if (avatarWrap) {
        avatarWrap.addEventListener('click', (e) => {
          e.stopPropagation();
          executeMuteToggle('app', pid);
        });
      }

      tile.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (e.target.closest('.app-mute-toggle-btn') || e.target.closest('.app-avatar-wrap')) return;
        touchRecency(app.name);
        startGesture({
          type: 'app',
          pid: pid,
          name: app.displayName || app.name,
          isSpotify: isSpotify,
          startVol: app.volume,
          currentVol: app.volume,
          muted: app.muted
        }, e.clientX, e.clientY, e.pointerId, tile);
      });

      return tile;
    }

    function createFolderTileElement(group) {
      const isAllMuted = group.sessions.every(s => s.muted);
      const avgVol = Math.round(group.sessions.reduce((acc, s) => acc + (s.muted ? 0 : s.volume), 0) / group.sessions.length);
      const isSpotify = group.key.includes('spotify');

      const tile = document.createElement('div');
      tile.className = `app-tile app-folder ${isAllMuted ? 'is-muted' : ''} ${isSpotify ? 'is-spotify' : ''}`;
      tile.id = `app-folder-${group.key}`;
      tile.setAttribute('data-group-key', group.key);

      tile.innerHTML = `
        <div class="volume-fill-bg" style="width: ${isAllMuted ? 0 : avgVol}%;"></div>
        <div class="app-tile-main">
          <div class="app-tile-left">
            <div class="app-avatar-wrap" title="Folder: ${group.displayName}">
              <div class="app-avatar folder-avatar">
                ${group.svg}
              </div>
            </div>
            <div class="app-info-block">
              <div class="app-title-row">
                <span class="app-title-text" title="${group.displayName}">${group.displayName}</span>
                <span class="folder-badge-pill">${group.sessions.length} Streams</span>
                ${isSpotify ? '<span class="spotify-curve-tag">Spotify Curve</span>' : ''}
              </div>
              <div class="app-sub-text">
                <span class="folder-hint-text">Grouped application &bull; Click to open submenu</span>
              </div>
            </div>
          </div>
          <div class="app-tile-right">
            <button class="app-mute-toggle-btn" title="Toggle Mute All in Group">
              <span class="app-vol-icon-hint">${isAllMuted ? '🔇' : (avgVol === 0 ? '🔈' : (avgVol > 50 ? '🔊' : '🔉'))}</span>
            </button>
            <div class="app-pct-badge">${isAllMuted ? 'MUTED' : `${avgVol}%`}</div>
            <span class="folder-arrow-indicator" title="Open submenu">➔</span>
          </div>
        </div>
        <div class="tile-slider-bar">
          <div class="tile-slider-track">
            <div class="tile-slider-fill" style="width: ${isAllMuted ? 0 : avgVol}%;">
              <div class="tile-slider-thumb"></div>
            </div>
          </div>
        </div>
      `;

      const muteBtn = tile.querySelector('.app-mute-toggle-btn');
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          executeGroupMuteToggle(group.key);
        });
      }

      tile.addEventListener('click', (e) => {
        if (e.target.closest('.app-mute-toggle-btn') || isDraggingGesture || hasMovedNoticeably) return;
        openAppSubmenu(group.key);
      });

      tile.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        if (e.target.closest('.app-mute-toggle-btn')) return;
        touchRecency(group.displayName);
        startGesture({
          type: 'app-group',
          groupKey: group.key,
          name: group.displayName,
          isSpotify: isSpotify,
          startVol: avgVol,
          currentVol: avgVol,
          muted: isAllMuted
        }, e.clientX, e.clientY, e.pointerId, tile);
      });

      return tile;
    }

    // Dynamic Device-Adaptive Multi-Column Calculator
    // Adds a column only when the vertical space of current column(s) is genuinely full.
    // Fills top-to-bottom first, then adds a 2nd column (50% width), then 3rd column (33.33% width).
    function updateAppsGridLayout(itemCount) {
      const container = document.getElementById('apps-scroll-wrap');
      const grid = document.getElementById('apps-grid');
      if (!grid) return;
      if (!itemCount || itemCount <= 0) {
        grid.style.setProperty('--apps-cols', 1);
        grid.style.setProperty('--apps-rows', 1);
        grid.dataset.cols = '1';
        return;
      }

      // Real available vertical height on the current device / window
      const availHeight = (container && container.clientHeight > 0 ? container.clientHeight : (grid && grid.clientHeight > 0 ? grid.clientHeight : 0)) || (window.innerHeight - 180);

      const sampleTile = grid.querySelector('.app-tile');
      const tileMinH = sampleTile ? (parseFloat(window.getComputedStyle(sampleTile).minHeight) || 56) : 56;
      const gap = 8;
      const tileSlot = tileMinH + gap; // ~64px

      // Maximum items that can fit vertically in one column without vertical scrolling
      const maxRowsPerCol = Math.max(1, Math.floor((availHeight + gap) / Math.max(40, tileSlot)));

      let cols = 1;
      let rows = itemCount;

      if (itemCount <= maxRowsPerCol) {
        // Single column: vertical space is available. Stacks 100% width top-to-bottom.
        cols = 1;
        rows = itemCount;
      } else if (itemCount <= maxRowsPerCol * 2) {
        // 1st column is full! Add 2nd column (50% width each).
        // 1st column stays filled with maxRowsPerCol items, remainder fills 2nd column.
        cols = 2;
        rows = maxRowsPerCol;
      } else {
        // 1st and 2nd columns are full! Add 3rd column (33.33% width each).
        cols = 3;
        rows = Math.max(maxRowsPerCol, Math.ceil(itemCount / 3));
      }

      grid.style.setProperty('--apps-cols', cols);
      grid.style.setProperty('--apps-rows', rows);
      grid.dataset.cols = String(cols);
    }

    function updateSubmenuGridLayout(streamCount) {
      const container = document.getElementById('apps-scroll-wrap');
      const submenuView = document.getElementById('apps-submenu-view');
      const grid = document.getElementById('submenu-streams-grid');
      if (!grid) return;
      if (!streamCount || streamCount <= 0) {
        grid.style.setProperty('--sub-cols', 1);
        grid.style.setProperty('--sub-rows', 1);
        grid.dataset.cols = '1';
        return;
      }

      const containerH = (container && container.clientHeight > 0 ? container.clientHeight : 0) || (submenuView && submenuView.clientHeight > 0 ? submenuView.clientHeight : 0) || (window.innerHeight - 180);
      const headerOffset = 110; // Submenu back header (~40px) + master volume tile (~56px) + gaps
      const availHeight = Math.max(100, containerH - headerOffset);

      const sampleTile = grid.querySelector('.app-tile') || document.querySelector('.app-tile');
      const tileMinH = sampleTile ? (parseFloat(window.getComputedStyle(sampleTile).minHeight) || 56) : 56;
      const gap = 8;
      const tileSlot = tileMinH + gap;

      const maxRowsPerCol = Math.max(1, Math.floor((availHeight + gap) / Math.max(40, tileSlot)));

      let cols = 1;
      let rows = streamCount;

      if (streamCount <= maxRowsPerCol) {
        cols = 1;
        rows = streamCount;
      } else if (streamCount <= maxRowsPerCol * 2) {
        cols = 2;
        rows = maxRowsPerCol;
      } else {
        cols = 3;
        rows = Math.max(maxRowsPerCol, Math.ceil(streamCount / 3));
      }

      grid.style.setProperty('--sub-cols', cols);
      grid.style.setProperty('--sub-rows', rows);
      grid.dataset.cols = String(cols);
    }

    function refreshActiveAppsLayout() {
      if (activeSubmenuGroupKey) {
        const groupSessions = localSessions.filter(s => getAppGroupKey(s) === activeSubmenuGroupKey);
        updateSubmenuGridLayout(groupSessions.length);
      } else {
        const groupsMap = new Map();
        localSessions.forEach(s => groupsMap.set(getAppGroupKey(s), true));
        updateAppsGridLayout(groupsMap.size);
      }
    }

    window.addEventListener('resize', refreshActiveAppsLayout);
    if (window.ResizeObserver) {
      const scrollWrapEl = document.getElementById('apps-scroll-wrap');
      if (scrollWrapEl) {
        new ResizeObserver(refreshActiveAppsLayout).observe(scrollWrapEl);
      }
    }

    function openAppSubmenu(groupKey) {
      activeSubmenuGroupKey = groupKey;
      const groupSessions = localSessions.filter(s => getAppGroupKey(s) === groupKey);
      if (groupSessions.length === 0) {
        closeAppSubmenu();
        return;
      }

      const appsGridEl = document.getElementById('apps-grid');
      const submenuViewEl = document.getElementById('apps-submenu-view');
      if (appsGridEl) appsGridEl.style.display = 'none';
      if (submenuViewEl) submenuViewEl.style.display = 'flex';

      const groupName = getAppGroupDisplayName(groupSessions);
      const submenuAvatar = document.getElementById('submenu-avatar');
      const submenuTitle = document.getElementById('submenu-title');
      const submenuBadge = document.getElementById('submenu-count-badge');

      if (submenuAvatar) submenuAvatar.innerHTML = getAppSvg(groupSessions[0].name, groupName);
      if (submenuTitle) submenuTitle.textContent = groupName;
      if (submenuBadge) submenuBadge.textContent = `${groupSessions.length} Streams`;

      renderSubmenuGroupTile(groupKey, groupSessions);
      renderSubmenuStreamTiles(groupSessions);
      updateSubmenuGridLayout(groupSessions.length);
    }

    function closeAppSubmenu() {
      activeSubmenuGroupKey = null;
      const appsGridEl = document.getElementById('apps-grid');
      const submenuViewEl = document.getElementById('apps-submenu-view');
      if (submenuViewEl) submenuViewEl.style.display = 'none';
      if (appsGridEl) appsGridEl.style.display = 'flex';
      renderAppsGrid(localSessions, true);
    }

    function renderSubmenuGroupTile(groupKey, groupSessions) {
      const container = document.getElementById('submenu-group-tile');
      if (!container) return;

      const isAllMuted = groupSessions.every(s => s.muted);
      const avgVol = Math.round(groupSessions.reduce((acc, s) => acc + (s.muted ? 0 : s.volume), 0) / groupSessions.length);
      const isSpotify = groupKey.includes('spotify');
      const groupName = getAppGroupDisplayName(groupSessions);

      container.innerHTML = `
        <div class="app-tile ${isAllMuted ? 'is-muted' : ''} ${isSpotify ? 'is-spotify' : ''}" id="submenu-master-tile" style="max-height: 58px; min-height: 52px;">
          <div class="volume-fill-bg" style="width: ${isAllMuted ? 0 : avgVol}%;"></div>
          <div class="app-tile-main">
            <div class="app-tile-left">
              <div class="app-info-block">
                <div class="app-title-row">
                  <span class="app-title-text" style="font-size:0.84rem;">Group Master Volume</span>
                  <span class="folder-badge-pill" style="font-size:0.58rem;">All ${groupSessions.length} Streams</span>
                </div>
                <div class="app-sub-text">
                  <span>Adjust or mute all streams in group together</span>
                </div>
              </div>
            </div>
            <div class="app-tile-right">
              <button class="app-mute-toggle-btn" id="submenu-group-mute-btn" title="Toggle Mute All">
                <span class="app-vol-icon-hint">${isAllMuted ? '🔇' : (avgVol === 0 ? '🔈' : (avgVol > 50 ? '🔊' : '🔉'))}</span>
              </button>
              <div class="app-pct-badge">${isAllMuted ? 'MUTED' : `${avgVol}%`}</div>
            </div>
          </div>
          <div class="tile-slider-bar">
            <div class="tile-slider-track">
              <div class="tile-slider-fill" style="width: ${isAllMuted ? 0 : avgVol}%;">
                <div class="tile-slider-thumb"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      const tile = container.querySelector('#submenu-master-tile');
      const muteBtn = container.querySelector('#submenu-group-mute-btn');
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          executeGroupMuteToggle(groupKey);
        });
      }

      if (tile) {
        tile.addEventListener('pointerdown', (e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          if (e.target.closest('#submenu-group-mute-btn')) return;
          startGesture({
            type: 'app-group',
            groupKey: groupKey,
            name: `${groupName} (Master)`,
            isSpotify: isSpotify,
            startVol: avgVol,
            currentVol: avgVol,
            muted: isAllMuted
          }, e.clientX, e.clientY, e.pointerId, tile);
        });
      }
    }

    function renderSubmenuStreamTiles(groupSessions) {
      const container = document.getElementById('submenu-streams-grid');
      if (!container) return;
      container.innerHTML = '';

      const fragment = document.createDocumentFragment();
      groupSessions.forEach(stream => {
        const tile = createAppTileElement(stream, true);
        fragment.appendChild(tile);
      });
      container.appendChild(fragment);
    }

    let currentRenderedPids = '';

    // Render Applications: Groups multiple streams into Folder cards; expands into Submenu view
    function renderAppsGrid(sessions, forceReorder = false) {
      localSessions = sessions || [];

      if (!localSessions || localSessions.length === 0) {
        currentRenderedPids = '';
        if (appCounter) appCounter.textContent = '0 Active';
        if (activeSubmenuGroupKey) {
          closeAppSubmenu();
        }
        appsGrid.innerHTML = `
          <div class="empty-state">
            No active audio applications playing sound.<br>
            Open Spotify, Discord, YouTube, or a game to control it individually.
          </div>`;
        return;
      }

      if (appCounter) appCounter.textContent = `${localSessions.length} Active`;

      // If submenu view is active, update submenu stream tiles and group tile
      if (activeSubmenuGroupKey) {
        const groupSessions = localSessions.filter(s => getAppGroupKey(s) === activeSubmenuGroupKey);
        if (groupSessions.length === 0) {
          closeAppSubmenu();
          return;
        }
        updateSubmenuGridLayout(groupSessions.length);
        groupSessions.forEach(app => {
          updateAppTileLive(app.pid, app.volume, app.muted);
        });
        updateFolderTileLive(activeSubmenuGroupKey);
        return;
      }

      // Group sessions by application key
      const groupsMap = new Map();
      localSessions.forEach(s => {
        const key = getAppGroupKey(s);
        if (!groupsMap.has(key)) {
          groupsMap.set(key, []);
        }
        groupsMap.get(key).push(s);
      });

      const groupKeys = Array.from(groupsMap.keys());
      const structSig = groupKeys.join('|') + '::' + localSessions.map(s => s.pid).join(',');

      if (!forceReorder && currentRenderedPids === structSig && appsGrid.children.length > 0) {
        updateAppsGridLayout(groupsMap.size);
        localSessions.forEach(app => {
          updateAppTileLive(app.pid, app.volume, app.muted);
        });
        return;
      }
      currentRenderedPids = structSig;

      appsGrid.innerHTML = '';
      const fragment = document.createDocumentFragment();

      // Sort groups according to currentAppSortMode
      const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => {
        const sA = groupsMap.get(a);
        const sB = groupsMap.get(b);
        if (currentAppSortMode === 'name') {
          return getAppGroupDisplayName(sA).localeCompare(getAppGroupDisplayName(sB));
        } else if (currentAppSortMode === 'pid') {
          return Math.min(...sA.map(x => x.pid)) - Math.min(...sB.map(x => x.pid));
        } else if (currentAppSortMode === 'most_used') {
          const scoreA = Math.max(...sA.map(x => getAppUsageScore(x.name)), getAppUsageScore(a));
          const scoreB = Math.max(...sB.map(x => getAppUsageScore(x.name)), getAppUsageScore(b));
          if (scoreB !== scoreA) return scoreB - scoreA;
          return getAppGroupDisplayName(sA).localeCompare(getAppGroupDisplayName(sB));
        }
        return 0;
      });

      sortedKeys.forEach(key => {
        const sessionsInGroup = groupsMap.get(key);
        if (sessionsInGroup.length > 1) {
          // Folder card
          const folderCard = createFolderTileElement({
            key: key,
            displayName: getAppGroupDisplayName(sessionsInGroup),
            sessions: sessionsInGroup,
            svg: getAppSvg(sessionsInGroup[0].name, sessionsInGroup[0].displayName)
          });
          fragment.appendChild(folderCard);
        } else {
          // Single app card
          const singleTile = createAppTileElement(sessionsInGroup[0], false);
          fragment.appendChild(singleTile);
        }
      });

      appsGrid.appendChild(fragment);
      updateAppsGridLayout(groupsMap.size);
    }

    // Submenu Back Button and Escape Key Listener
    const submenuBackBtn = document.getElementById('submenu-back-btn');
    if (submenuBackBtn) {
      submenuBackBtn.addEventListener('click', () => closeAppSubmenu());
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeSubmenuGroupKey) {
        closeAppSubmenu();
      }
    });

    function renderFullState(state) {
      if (!state) return;
      // Persist state to localStorage for instant reload
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch (e) {}

      if (state.master && !isDraggingGesture) {
        currentMasterVolume = state.master.volume;
        currentMasterMuted = state.master.muted;
        updateMasterUI(currentMasterVolume, currentMasterMuted);
      }
      if (state.sessions && !isDraggingGesture) {
        renderAppsGrid(state.sessions);
      }
      if (state.mic && typeof updateMicUI === 'function') {
        updateMicUI(state.mic.muted, state.mic.available);
      }
    }

    // Polling Sync
    async function syncState() {
      if (isDraggingGesture || isSleeping) return;
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const st = await res.json();
          renderFullState(st);
        }
      } catch (e) {}
    }

    // Toast Notification System
    let toastTimeout = null;
    function showToast(msg, icon = '✓', isError = false) {
      const toast = document.getElementById('action-toast');
      const iconEl = document.getElementById('toast-icon');
      const msgEl = document.getElementById('toast-msg');
      if (!toast) return;
      if (iconEl) iconEl.textContent = icon;
      if (msgEl) msgEl.textContent = msg;
      toast.style.background = isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
      toast.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }


    // -----------------------------------------------------------
    // Shortcuts Deck & Editable / Arrangeable Grid
    // -----------------------------------------------------------
    const shortcutsGrid = document.getElementById('shortcuts-grid');
    const shortcutsCounter = document.getElementById('shortcuts-counter');
    const deckEditBtn = document.getElementById('deck-edit-btn');
    const addShortcutBtn = document.getElementById('add-shortcut-btn');
    const shortcutModal = document.getElementById('shortcut-modal');
    const scModalCloseX = document.getElementById('sc-modal-close-x');
    const tabSuggestionsBtn = document.getElementById('tab-suggestions-btn');
    const tabCustomBtn = document.getElementById('tab-custom-btn');
    const tabSuggestionsView = document.getElementById('tab-suggestions-view');
    const tabCustomView = document.getElementById('tab-custom-view');
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsCount = document.getElementById('suggestions-count');

    const scCancelBtn = document.getElementById('sc-cancel-btn');
    const scSaveBtn = document.getElementById('sc-save-btn');
    const scTypeSelect = document.getElementById('sc-type-select');
    const scFieldStack = document.getElementById('sc-field-stack');
    const scFieldHotkey = document.getElementById('sc-field-hotkey');
    const scFieldCommand = document.getElementById('sc-field-command');

    let draggedItemIndex = null;

    async function loadShortcuts() {
      try {
        const res = await fetch('/api/shortcuts');
        if (!res.ok) return;
        currentShortcuts = await res.json();
        try {
          localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(currentShortcuts));
        } catch (e) {}
        renderShortcuts(currentShortcuts);
      } catch (e) {}
    }

    function renderShortcuts(shortcuts) {
      if (!shortcutsGrid) return;
      currentShortcuts = shortcuts || [];
      shortcutsGrid.innerHTML = '';
      if (shortcutsCounter) {
        shortcutsCounter.textContent = `${currentShortcuts.length} Actions`;
      }

      // Dynamically fit all shortcuts into viewport with zero vertical scroll
      const count = currentShortcuts.length;
      let cols = 3;
      if (count <= 4) cols = 2;
      else if (count <= 9) cols = 3;
      else cols = 4;
      shortcutsGrid.style.setProperty('--sc-cols', cols);

      shortcutsGrid.classList.toggle('editing-mode', isEditingDeck);

      currentShortcuts.forEach((sc, index) => {
        const card = document.createElement('div');
        card.className = 'shortcut-card';
        card.id = `shortcut-card-${sc.id}`;
        card.setAttribute('draggable', isEditingDeck ? 'true' : 'false');
        card.setAttribute('data-index', index);

        const descText = sc.desc || sc.description || sc.action_type || sc.type || '';
        card.title = descText || sc.name;

        card.innerHTML = `
          <div class="shortcut-icon" style="background: ${sc.color || 'var(--accent-grad)'};">
            ${getShortcutIconHtml(sc.icon)}
          </div>
          <div class="shortcut-details">
            <div class="shortcut-name">${sc.name}</div>
            <div class="shortcut-desc">${descText}</div>
          </div>
          <div class="shortcut-edit-controls">
            <button class="sc-ctrl-btn sc-move-left" title="Move Left" data-idx="${index}">◀</button>
            <button class="sc-ctrl-btn sc-move-right" title="Move Right" data-idx="${index}">▶</button>
            <button class="sc-ctrl-btn sc-edit-btn" title="Edit Shortcut" data-id="${sc.id}">✏️</button>
            <button class="sc-ctrl-btn sc-del-btn" title="Delete Shortcut" data-id="${sc.id}">🗑️</button>
          </div>
        `;

        // Execution click (when not editing)
        card.addEventListener('click', async (e) => {
          if (isEditingDeck) return;
          haptic(30);
          try {
            const res = await fetch(`/api/shortcuts/run/${sc.id}`, { method: 'POST' });
            const result = await res.json();
            showToast(result.message || `Ran ${sc.name}`, '⚡');
            syncState();
          } catch (e) {
            showToast(`Failed to run ${sc.name}`, '✕', true);
          }
        });

        // Drag and Drop (Mouse / HTML5)
        card.addEventListener('dragstart', (e) => {
          if (!isEditingDeck) return;
          draggedItemIndex = index;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
        });

        card.addEventListener('dragover', (e) => {
          if (!isEditingDeck) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });

        card.addEventListener('drop', (e) => {
          if (!isEditingDeck) return;
          e.preventDefault();
          const targetIndex = index;
          if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
            moveShortcut(draggedItemIndex, targetIndex);
          }
        });

        shortcutsGrid.appendChild(card);
      });

      // Attach button events for edit controls
      if (isEditingDeck) {
        shortcutsGrid.querySelectorAll('.sc-move-left').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (idx > 0) moveShortcut(idx, idx - 1);
          });
        });

        shortcutsGrid.querySelectorAll('.sc-move-right').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (idx < currentShortcuts.length - 1) moveShortcut(idx, idx + 1);
          });
        });

        shortcutsGrid.querySelectorAll('.sc-edit-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sid = btn.getAttribute('data-id');
            openEditShortcutModal(sid);
          });
        });

        shortcutsGrid.querySelectorAll('.sc-del-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const sid = btn.getAttribute('data-id');
            deleteShortcutItem(sid);
          });
        });
      }
    }

    // Reorder and Save
    async function moveShortcut(fromIdx, toIdx) {
      if (fromIdx < 0 || toIdx < 0 || fromIdx >= currentShortcuts.length || toIdx >= currentShortcuts.length) return;
      const item = currentShortcuts.splice(fromIdx, 1)[0];
      currentShortcuts.splice(toIdx, 0, item);
      renderShortcuts(currentShortcuts);
      haptic(25);

      // Persist to localStorage and server
      try {
        localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(currentShortcuts));
        await fetch('/api/shortcuts/reorder', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ order: currentShortcuts.map(s => s.id) })
        });
      } catch (e) {}
    }

    async function deleteShortcutItem(id) {
      const sc = currentShortcuts.find(s => s.id === id);
      const name = sc ? sc.name : 'Shortcut';
      currentShortcuts = currentShortcuts.filter(s => s.id !== id);
      renderShortcuts(currentShortcuts);
      showToast(`Removed "${name}"`, '🗑️');
      haptic(35);

      try {
        localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(currentShortcuts));
        await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
      } catch (e) {}
    }

    // Toggle Deck Editing Mode
    if (deckEditBtn) {
      deckEditBtn.addEventListener('click', () => {
        isEditingDeck = !isEditingDeck;
        deckEditBtn.classList.toggle('active', isEditingDeck);
        deckEditBtn.textContent = isEditingDeck ? '✓ Done Editing' : '✏️ Edit Deck';
        renderShortcuts(currentShortcuts);
      });
    }

    // -----------------------------------------------------------
    // Suggestions & Custom Shortcut Modal
    // -----------------------------------------------------------
    let allSuggestions = [];

    async function loadSuggestions() {
      try {
        const res = await fetch('/api/shortcuts/suggestions');
        if (res.ok) {
          allSuggestions = await res.json();
          renderSuggestionsList(allSuggestions);
        }
      } catch (e) {}
    }

    function renderSuggestionsList(suggestions) {
      if (!suggestionsList) return;
      suggestionsList.innerHTML = '';
      if (suggestionsCount) suggestionsCount.textContent = suggestions.length;

      const currentIds = new Set(currentShortcuts.map(s => s.id));

      suggestions.forEach(s => {
        const isAdded = currentIds.has(s.id);
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="suggestion-left">
            <div class="suggestion-icon" style="background: ${s.color || 'var(--accent-grad)'};">
              ${getShortcutIconHtml(s.icon)}
            </div>
            <div class="suggestion-texts">
              <div class="suggestion-name">${s.name}</div>
              <div class="suggestion-desc">${s.desc || s.description || ''}</div>
            </div>
          </div>
          <button class="suggestion-add-btn ${isAdded ? 'added' : ''}" data-id="${s.id}">
            ${isAdded ? '✓ Added' : '+ Add'}
          </button>
        `;

        const addBtn = item.querySelector('.suggestion-add-btn');
        addBtn.addEventListener('click', async () => {
          if (addBtn.classList.contains('added')) return;
          haptic(35);
          addBtn.classList.add('added');
          addBtn.textContent = '✓ Added';

          // Add to current shortcuts
          currentShortcuts.push(s);
          renderShortcuts(currentShortcuts);
          showToast(`Added "${s.name}" to Home Screen!`, '⚡');

          try {
            localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(currentShortcuts));
            await fetch('/api/shortcuts/save', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(s)
            });
          } catch (e) {}
        });

        suggestionsList.appendChild(item);
      });
    }

    // Modal Tabs
    function setModalTab(tab) {
      if (tab === 'suggestions') {
        tabSuggestionsBtn?.classList.add('active');
        tabCustomBtn?.classList.remove('active');
        if (tabSuggestionsView) tabSuggestionsView.style.display = 'block';
        if (tabCustomView) tabCustomView.style.display = 'none';
        loadSuggestions();
      } else {
        tabSuggestionsBtn?.classList.remove('active');
        tabCustomBtn?.classList.add('active');
        if (tabSuggestionsView) tabSuggestionsView.style.display = 'none';
        if (tabCustomView) tabCustomView.style.display = 'block';
      }
    }

    if (tabSuggestionsBtn) {
      tabSuggestionsBtn.addEventListener('click', () => setModalTab('suggestions'));
    }
    if (tabCustomBtn) {
      tabCustomBtn.addEventListener('click', () => setModalTab('custom'));
    }

    function openAddShortcutModal() {
      const editId = document.getElementById('sc-edit-id');
      const nameInput = document.getElementById('sc-name-input');
      const modalTitle = document.getElementById('modal-shortcut-title');
      if (editId) editId.value = '';
      if (nameInput) nameInput.value = '';
      if (modalTitle) modalTitle.textContent = '⚡ Actions & Shortcuts';
      setModalTab('suggestions');
      shortcutModal?.classList.add('open');
    }

    function openEditShortcutModal(id) {
      const sc = currentShortcuts.find(s => s.id === id);
      if (!sc) return;
      const editId = document.getElementById('sc-edit-id');
      const nameInput = document.getElementById('sc-name-input');
      const iconInput = document.getElementById('sc-icon-input');
      const modalTitle = document.getElementById('modal-shortcut-title');

      if (editId) editId.value = sc.id;
      if (nameInput) nameInput.value = sc.name;
      if (iconInput) iconInput.value = sc.icon || '⚡';
      if (modalTitle) modalTitle.textContent = `Edit "${sc.name}"`;

      setModalTab('custom');
      shortcutModal?.classList.add('open');
    }

    if (addShortcutBtn) {
      addShortcutBtn.addEventListener('click', openAddShortcutModal);
    }
    if (scModalCloseX) {
      scModalCloseX.addEventListener('click', () => shortcutModal?.classList.remove('open'));
    }
    if (scCancelBtn) {
      scCancelBtn.addEventListener('click', () => shortcutModal?.classList.remove('open'));
    }

    if (scTypeSelect) {
      scTypeSelect.addEventListener('change', () => {
        const val = scTypeSelect.value;
        if (scFieldStack) scFieldStack.style.display = val === 'stack_apps' ? 'block' : 'none';
        if (scFieldHotkey) scFieldHotkey.style.display = val === 'hotkey' ? 'block' : 'none';
        if (scFieldCommand) scFieldCommand.style.display = val === 'command' ? 'block' : 'none';
      });
    }

    if (scSaveBtn) {
      scSaveBtn.addEventListener('click', async () => {
        const editId = document.getElementById('sc-edit-id')?.value.trim();
        const nameInput = document.getElementById('sc-name-input');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          alert('Please enter a shortcut name');
          return;
        }
        const type = scTypeSelect ? scTypeSelect.value : 'command';
        const iconInput = document.getElementById('sc-icon-input');
        const icon = iconInput ? (iconInput.value.trim() || '⚡') : '⚡';

        const payload = {
          id: editId || undefined,
          name: name,
          icon: icon,
          action_type: type,
          description: name
        };

        if (type === 'stack_apps') {
          const screenSelect = document.getElementById('sc-screen-select');
          const screen = parseInt(screenSelect ? screenSelect.value : '2', 10);
          const appsInput = document.getElementById('sc-apps-input');
          const appsStr = appsInput ? appsInput.value : 'notepad.exe';
          const apps = appsStr.split(',').map(s => s.trim()).filter(Boolean).map(a => ({
            name: a.replace(/\.exe$/i, ''),
            cmd: a,
            match: a.replace(/\.exe$/i, '').toLowerCase()
          }));
          payload.target_screen = screen;
          payload.layout = 'vertical';
          payload.apps = apps;
          payload.description = `Stack ${apps.length} apps vertically on Screen ${screen}`;
        } else if (type === 'hotkey') {
          const hkInput = document.getElementById('sc-hotkey-input');
          const keys = (hkInput ? hkInput.value : '').split('+').map(k => k.trim().toLowerCase()).filter(Boolean);
          payload.keys = keys;
          payload.description = `Hotkey: ${keys.join(' + ')}`;
        } else if (type === 'discord_deafen') {
          payload.action_type = 'discord_deafen';
          payload.type = 'hotkey';
          payload.keys = ['ctrl', 'f1'];
          payload.color = '#5865f2';
          payload.icon = icon !== '⚡' ? icon : 'headphones';
          payload.description = 'Toggle Discord Deafen / Undeafen (Ctrl+F1)';
        } else if (type === 'global_mic_mute') {
          payload.action_type = 'global_mic_mute';
          payload.color = '#f43f5e';
          payload.icon = icon !== '⚡' ? icon : 'mic_off';
          payload.description = 'Toggle Physical Microphone Mute';
        } else if (type === 'command') {
          const cmdInput = document.getElementById('sc-cmd-input');
          const cmd = cmdInput ? cmdInput.value.trim() : '';
          payload.command = cmd;
          payload.description = `Run: ${cmd}`;
        }

        try {
          const res = await fetch('/api/shortcuts/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Shortcut '${name}' saved!`, '⚡');
            shortcutModal?.classList.remove('open');
            loadShortcuts();
          } else {
            showToast('Error saving shortcut', '✕', true);
          }
        } catch (e) {
          showToast('Error saving shortcut', '✕', true);
        }
      });
    }

    // -----------------------------------------------------------
    // Mobile View Switcher (Apps / Shortcuts / Split)
    // -----------------------------------------------------------
    const dashboardViewport = document.getElementById('dashboard-viewport');
    const viewAppsBtn = document.getElementById('view-apps-btn');
    const viewShortcutsBtn = document.getElementById('view-shortcuts-btn');
    const viewSplitBtn = document.getElementById('view-split-btn');

    function setMobileView(view) {
      if (!dashboardViewport) return;
      dashboardViewport.setAttribute('data-active-view', view);
      try {
        localStorage.setItem(VIEW_KEY, view);
      } catch (e) {}

      viewAppsBtn?.classList.toggle('active', view === 'apps');
      viewShortcutsBtn?.classList.toggle('active', view === 'shortcuts');
      viewSplitBtn?.classList.toggle('active', view === 'split');
    }

    if (viewAppsBtn) viewAppsBtn.addEventListener('click', () => setMobileView('apps'));
    if (viewShortcutsBtn) viewShortcutsBtn.addEventListener('click', () => setMobileView('shortcuts'));
    if (viewSplitBtn) viewSplitBtn.addEventListener('click', () => setMobileView('split'));

    // -----------------------------------------------------------
    // Discord Deafen Control (Ctrl+F1)
    // -----------------------------------------------------------
    let isDiscordDeafened = false;
    const islandDeafenBtn = document.getElementById('island-deafen-btn');

    if (islandDeafenBtn) {
      islandDeafenBtn.addEventListener('click', async () => {
        haptic(45);
        isDiscordDeafened = !isDiscordDeafened;
        islandDeafenBtn.classList.toggle('is-deafened', isDiscordDeafened);
        const deafenLabel = document.getElementById('island-deafen-label');
        if (deafenLabel) deafenLabel.textContent = isDiscordDeafened ? 'Deafened' : 'Deafen';
        try {
          const res = await fetch('/api/discord/deafen', { method: 'POST' });
          const data = await res.json();
          showToast(isDiscordDeafened ? 'Discord Deafened (Ctrl+F1)' : 'Discord Undeafened (Ctrl+F1)', '🎧');
        } catch (e) {
          showToast('Failed to trigger deafen', '✕', true);
        }
      });
    }

    // 3. Dynamic Island Morph & Smart AI Assistant (Ollama NLP)
    let recognition = null;
    let isListening = false;
    let islandCollapseTimer = null;

    const dynamicIsland = document.getElementById('dynamic-island');
    const islandPill = document.getElementById('island-pill');
    const islandExpanded = document.getElementById('island-expanded');
    const islandWaveBox = document.getElementById('island-wave-box');
    const islandTranscript = document.getElementById('island-transcript');
    const islandModelBadge = document.getElementById('island-model-badge');
    const islandCancelBtn = document.getElementById('island-cancel-btn');
    const islandAiBtn = document.getElementById('island-ai-btn');
    const islandMicToggleBtn = document.getElementById('island-mic-toggle-btn');
    const islandCmdInput = document.getElementById('island-cmd-input');
    const islandCmdSubmit = document.getElementById('island-cmd-submit');
    const islandQuickChips = document.querySelectorAll('.island-chip');
    const islandMicNotice = document.getElementById('island-mic-notice');
    const islandMicNoticeText = document.getElementById('island-mic-notice-text');
    const islandRequestPermBtn = document.getElementById('island-request-perm-btn');

    function expandIsland() {
      clearTimeout(islandCollapseTimer);
      if (dynamicIsland) dynamicIsland.classList.add('expanded');
      if (islandPill) islandPill.style.display = 'none';
      if (islandExpanded) islandExpanded.style.display = 'flex';
      setTimeout(() => islandCmdInput?.focus(), 150);
    }

    function collapseIsland() {
      clearTimeout(islandCollapseTimer);
      stopListening();
      if (dynamicIsland) dynamicIsland.classList.remove('expanded');
      if (islandPill) islandPill.style.display = 'flex';
      if (islandExpanded) islandExpanded.style.display = 'none';
      if (islandCmdInput) islandCmdInput.value = '';
      if (islandMicNotice) islandMicNotice.style.display = 'none';
    }

    async function ensureMicrophonePermission() {
      // 1. Check if running in an insecure context (mobile Wi-Fi HTTP)
      const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isSecure && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
        return {
          ok: false,
          reason: 'insecure_context',
          message: 'Mobile browsers block mic over plain HTTP. Tap "Open HTTPS 🔒" or use the input below.'
        };
      }

      // 2. Request mic permission via getUserMedia
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop tracks immediately so mic is freed for speech recognition
          stream.getTracks().forEach(track => track.stop());
          return { ok: true };
        } catch (err) {
          console.warn("getUserMedia failed or denied:", err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            return {
              ok: false,
              reason: 'denied',
              message: 'Microphone permission was denied. Tap browser address bar 🔒 to allow microphone.'
            };
          }
          if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            return { ok: false, reason: 'not_found', message: 'No microphone found on this device.' };
          }
          return { ok: false, reason: 'error', message: err.message || 'Microphone access could not be acquired.' };
        }
      }

      return {
        ok: false,
        reason: 'unsupported',
        message: 'Speech microphone is not available in this browser. Type below:'
      };
    }

    function initVoice() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          isListening = true;
          expandIsland();
          if (islandTranscript) islandTranscript.textContent = 'Listening... Speak command';
          if (islandModelBadge) islandModelBadge.textContent = '🤖 Local LLM (Ollama)';
          if (islandWaveBox) islandWaveBox.style.display = 'flex';
          if (islandMicToggleBtn) islandMicToggleBtn.classList.add('listening');
          haptic(40);
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const spoken = final || interim;
          if (islandTranscript && spoken) islandTranscript.textContent = spoken;
          if (islandCmdInput && spoken) islandCmdInput.value = spoken;
          if (final) processNlpCommand(final);
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
          stopListening();
          if (event.error === 'not-allowed') {
            if (islandTranscript) islandTranscript.textContent = 'Microphone permission is blocked by browser.';
            showMicNotice('Microphone permission blocked. Click to allow:', 'Grant Mic 🎙️', () => startListening());
          } else if (event.error === 'no-speech') {
            if (islandTranscript) islandTranscript.textContent = 'No speech detected. Type or tap 🎙️ to try again.';
          } else {
            if (islandTranscript) islandTranscript.textContent = `Mic issue (${event.error}). Type command below:`;
          }
        };

        recognition.onend = () => {
          if (isListening) stopListening();
        };
      } catch (e) {
        console.warn("Error initializing voice:", e);
      }
    }

    function showMicNotice(text, btnLabel, action) {
      if (!islandMicNotice) return;
      islandMicNotice.style.display = 'flex';
      if (islandMicNoticeText) islandMicNoticeText.textContent = text;
      if (islandRequestPermBtn) {
        islandRequestPermBtn.textContent = btnLabel;
        islandRequestPermBtn.onclick = action;
      }
    }

    async function startListening() {
      expandIsland();

      // 1. Explicitly request permission via getUserMedia
      if (islandTranscript) islandTranscript.textContent = 'Requesting microphone permission...';
      if (islandModelBadge) islandModelBadge.textContent = '🎙️ Checking Mic...';

      const perm = await ensureMicrophonePermission();

      if (!perm.ok) {
        if (islandTranscript) islandTranscript.textContent = perm.message;
        if (islandModelBadge) islandModelBadge.textContent = '⚠️ Mic Attention';

        if (perm.reason === 'insecure_context') {
          showMicNotice(perm.message, 'Switch to HTTPS 🔒', () => {
            location.href = `https://${location.host}`;
          });
        } else {
          showMicNotice(perm.message, 'Allow Mic 🎙️', () => startListening());
        }
        islandCmdInput?.focus();
        return;
      }

      // Hide notice once permission is granted
      if (islandMicNotice) islandMicNotice.style.display = 'none';

      // 2. Check Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        if (islandTranscript) islandTranscript.textContent = 'Web Speech API not supported on this browser. Type below:';
        if (islandModelBadge) islandModelBadge.textContent = '⌨️ Smart Assistant';
        islandCmdInput?.focus();
        return;
      }

      if (!recognition) initVoice();

      try {
        isListening = true;
        recognition.start();
        if (islandTranscript) islandTranscript.textContent = 'Listening... Speak command';
        if (islandWaveBox) islandWaveBox.style.display = 'flex';
        if (islandMicToggleBtn) islandMicToggleBtn.classList.add('listening');
      } catch (e) {
        console.warn("recognition.start exception:", e);
      }
    }

    function stopListening() {
      isListening = false;
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
      if (islandWaveBox) islandWaveBox.style.display = 'none';
      if (islandMicToggleBtn) islandMicToggleBtn.classList.remove('listening');
    }

    async function processNlpCommand(commandText) {
      if (!commandText || !commandText.trim()) {
        collapseIsland();
        return;
      }
      stopListening();
      expandIsland();
      if (islandTranscript) islandTranscript.textContent = '🤖 Processing with Ollama...';
      showToast(`NLP: "${commandText}"`, '🤖');

      try {
        const res = await fetch('/api/nlp/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commandText })
        });
        const result = await res.json();
        haptic(45);

        if (result.model && islandModelBadge) {
          islandModelBadge.textContent = `🤖 Ollama (${result.model})`;
        }

        if (result.success) {
          const toastIcon = result.action === 'create' ? '⚡' : (result.action === 'delete' ? '🗑️' : (result.action === 'edit' ? '✏️' : '✓'));
          showToast(result.message || 'Action executed!', toastIcon);
          if (islandTranscript) islandTranscript.textContent = `✓ ${result.message || 'Executed'}`;

          if ('speechSynthesis' in window && result.speech) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(result.speech);
              utterance.rate = 1.05;
              window.speechSynthesis.speak(utterance);
            } catch (e) {}
          }
        } else {
          showToast(result.message || 'Command not understood', '⚠️', true);
          if (islandTranscript) islandTranscript.textContent = `⚠️ ${result.message || 'Not understood'}`;
        }

        // Dynamically update shortcuts deck if created, edited, or deleted on the go
        if (result.shortcuts && Array.isArray(result.shortcuts)) {
          currentShortcuts = result.shortcuts;
          try {
            localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(currentShortcuts));
          } catch (e) {}
          renderShortcuts(currentShortcuts);
        }

        if (result.intent === 'note') {
          if (typeof loadNotes === 'function') loadNotes();
          if (typeof addPetXp === 'function') addPetXp(10);
          if (typeof setPetMood === 'function') setPetMood('happy', 'Note captured! 📝');
        } else if (result.intent === 'ask_pet') {
          if (typeof setPetMood === 'function') setPetMood('happy', result.message);
        }

        if (result.audio_state) {
          renderFullState(result.audio_state);
        } else {
          syncState();
        }

        // Keep island expanded briefly to display result, then smoothly collapse
        clearTimeout(islandCollapseTimer);
        islandCollapseTimer = setTimeout(() => {
          collapseIsland();
        }, 2500);

      } catch (e) {
        showToast('Failed to contact NLP Agent', '✕', true);
        if (islandTranscript) islandTranscript.textContent = '✕ Error contacting NLP';
        clearTimeout(islandCollapseTimer);
        islandCollapseTimer = setTimeout(collapseIsland, 2000);
      }
    }

    // Quick Command Execution
    if (islandCmdSubmit && islandCmdInput) {
      const handleCmdSubmit = () => {
        const cmd = islandCmdInput.value.trim();
        if (cmd) {
          processNlpCommand(cmd);
          islandCmdInput.value = '';
        }
      };
      islandCmdSubmit.addEventListener('click', handleCmdSubmit);
      islandCmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCmdSubmit();
      });
    }

    islandQuickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          if (islandCmdInput) islandCmdInput.value = cmd;
          processNlpCommand(cmd);
        }
      });
    });

    if (islandAiBtn) {
      islandAiBtn.addEventListener('click', () => {
        if (dynamicIsland?.classList.contains('expanded')) {
          collapseIsland();
        } else {
          startListening();
        }
      });
    }

    if (islandMicToggleBtn) {
      islandMicToggleBtn.addEventListener('click', () => {
        if (isListening) stopListening();
        else startListening();
      });
    }

    if (islandCancelBtn) {
      islandCancelBtn.addEventListener('click', collapseIsland);
    }

    initVoice();

    // Sync physical mic status on load
    async function syncMicState() {
      try {
        const res = await fetch('/api/mic');
        if (res.ok) {
          const data = await res.json();
          updateMicUI(data.muted, data.available);
        }
      } catch (e) {}
    }
    syncMicState();

    // -----------------------------------------------------------
    // QR Code & Install Modals
    // -----------------------------------------------------------
    const qrModal = document.getElementById('qr-modal');
    const qrOpenBtn = document.getElementById('qr-open-btn');
    const qrCloseBtn = document.getElementById('qr-close-btn');
    const modalUrl = document.getElementById('modal-url');
    const qrcodeBox = document.getElementById('qrcode-box');

    qrOpenBtn?.addEventListener('click', () => qrModal?.classList.add('open'));
    qrCloseBtn?.addEventListener('click', () => qrModal?.classList.remove('open'));
    qrModal?.addEventListener('click', (e) => {
      if (e.target === qrModal) qrModal.classList.remove('open');
    });

    async function loadInfo() {
      try {
        const res = await fetch('/api/info');
        const data = await res.json();
        const phoneUrl = data.phone_url || window.location.href;
        currentServerUrl = phoneUrl;
        if (netLabel) netLabel.textContent = `Phone: ${phoneUrl}`;
        if (modalUrl) modalUrl.textContent = phoneUrl;
        if (installServerUrl) installServerUrl.textContent = phoneUrl;
        new QRCode(qrcodeBox, phoneUrl);
      } catch (e) {
        currentServerUrl = window.location.origin;
        if (netLabel) netLabel.textContent = `Local: ${window.location.host}`;
        if (modalUrl) modalUrl.textContent = window.location.href;
        if (installServerUrl) installServerUrl.textContent = window.location.origin;
        new QRCode(qrcodeBox, window.location.href);
      }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        executeMuteToggle('master', 0);
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
        e.preventDefault();
        const nv = Math.min(100, currentMasterVolume + 5);
        sendLiveVolume('master', 0, nv);
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
        e.preventDefault();
        const nv = Math.max(0, currentMasterVolume - 5);
        sendLiveVolume('master', 0, nv);
      }
    });

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((reg) => console.log('[PWA] ServiceWorker registered with scope:', reg.scope))
          .catch((err) => console.warn('[PWA] ServiceWorker error:', err));
      });
    }

    // PWA Install Prompt Handler & Modal
    let deferredInstallPrompt = null;
    let currentServerUrl = window.location.origin;
    const installBtn = document.getElementById('install-btn');
    const installModal = document.getElementById('install-modal');
    const installCloseBtn = document.getElementById('install-close-btn');
    const installServerUrl = document.getElementById('install-server-url');

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      if (installBtn) installBtn.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (installBtn) installBtn.style.display = 'flex';
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            installBtn.style.display = 'none';
          }
          deferredInstallPrompt = null;
        } else {
          if (installServerUrl) installServerUrl.textContent = currentServerUrl;
          if (installModal) installModal.classList.add('open');
        }
      });
    }

    if (installCloseBtn && installModal) {
      installCloseBtn.addEventListener('click', () => installModal.classList.remove('open'));
      installModal.addEventListener('click', (e) => {
        if (e.target === installModal) installModal.classList.remove('open');
      });
    }

    window.addEventListener('appinstalled', () => {
      if (installBtn) installBtn.style.display = 'none';
      if (installModal) installModal.classList.remove('open');
      deferredInstallPrompt = null;
    });

    // -----------------------------------------------------------
    // Immediate Cached State Restoration (Zero-Flash Persistent Boot)
    // -----------------------------------------------------------
    function restoreCachedState() {
      try {
        const cachedShortcuts = JSON.parse(localStorage.getItem(SHORTCUTS_KEY));
        if (Array.isArray(cachedShortcuts) && cachedShortcuts.length > 0) {
          currentShortcuts = cachedShortcuts;
          renderShortcuts(currentShortcuts);
        }

        const cachedState = JSON.parse(localStorage.getItem(STATE_KEY));
        if (cachedState) {
          renderFullState(cachedState);
        }

        const cachedView = localStorage.getItem(VIEW_KEY) || 'apps';
        setMobileView(cachedView);
      } catch (e) {}
    }

    // -----------------------------------------------------------
    // 5-Minute Inactivity Watchdog & Standby Mode Integration
    // (In standby mode, server communication throttles to once per minute)
    // -----------------------------------------------------------
    const STANDBY_TIMER_STORAGE_KEY = 'volume_cockpit_standby_timer_active';
    let isStandbyTimerActive = true;
    try {
      const stored = localStorage.getItem(STANDBY_TIMER_STORAGE_KEY);
      if (stored !== null) {
        isStandbyTimerActive = stored === 'true';
      }
    } catch (e) {}

    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
    let lastActivityTimestamp = Date.now();
    isSleeping = false;
    let syncPollingTimer = null;
    let telemetryPollingTimer = null;
    let standbySyncTimer = null;

    function startPolling() {
      if (syncPollingTimer) clearInterval(syncPollingTimer);
      syncPollingTimer = setInterval(syncState, 1000);
    }

    function stopPolling() {
      if (syncPollingTimer) {
        clearInterval(syncPollingTimer);
        syncPollingTimer = null;
      }
    }

    function startTelemetryPolling() {
      if (telemetryPollingTimer) clearInterval(telemetryPollingTimer);
      telemetryPollingTimer = setInterval(pollTelemetry, 3500);
    }

    function stopTelemetryPolling() {
      if (telemetryPollingTimer) {
        clearInterval(telemetryPollingTimer);
        telemetryPollingTimer = null;
      }
    }

    function registerUserActivity() {
      lastActivityTimestamp = Date.now();
      // Keep inactivity watchdog timer refreshed.
      // Standby HUD wake is decoupled from passive micro-pointer moves or raw touchstarts
      // and handled strictly by handleStandbyWake and keydown with full double-click suppression.
    }

    // Passive listeners for user interactions (touch, pointer, mouse, key)
    const activityEvents = [
      'touchstart', 'touchmove',
      'pointerdown', 'pointermove',
      'mousedown', 'keydown'
    ];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, registerUserActivity, { passive: true, capture: true });
    });

    // Inactivity Watchdog: Only enters Standby Mode when Auto-Standby Timer is Active
    setInterval(() => {
      if (isStandbyTimerActive && !isStandbyOpen && !isSleeping && (Date.now() - lastActivityTimestamp >= INACTIVITY_TIMEOUT_MS)) {
        enterStandbyMode();
      }
    }, 5000);

    // ===========================================================
    // 1. Dynamic Roaming Pixel Pet Engine ("Byte")
    // ===========================================================
    const PET_DATA_KEY = 'volume_mixer_pet_data';
    const PET_POS_KEY = 'volume_mixer_pet_pos';

    const petHabitat = document.getElementById('pet-habitat');
    const petLevelBadge = document.getElementById('pet-level-badge');
    const petXpFill = document.getElementById('pet-xp-fill');

    const roamingPet = document.getElementById('roaming-pet');
    const roamingPetWrap = document.getElementById('roaming-pet-wrap');
    const roamingPetHearts = document.getElementById('roaming-pet-hearts');
    const roamingPetZzz = document.getElementById('roaming-pet-zzz');
    const roamingPetBall = document.getElementById('roaming-pet-ball');
    const roamingEyesOpen = document.getElementById('roaming-eyes-open');
    const roamingEyesClosed = document.getElementById('roaming-eyes-closed');

    const roamingAccCoding = document.getElementById('roaming-acc-coding');
    const roamingAccMusic = document.getElementById('roaming-acc-music');
    const roamingAccMeeting = document.getElementById('roaming-acc-meeting');
    const roamingAccSleep = document.getElementById('roaming-acc-sleep');
    const roamingAccSweat = document.getElementById('roaming-acc-sweat');

    let petData = {
      name: "Byte",
      level: 1,
      xp: 25,
      maxXp: 100
    };
    let petMood = 'idle';
    let petX = 0;
    let petY = 0;
    let isDraggingPet = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let petInitialX = 0;
    let petInitialY = 0;
    let hasDragged = false;
    let lastUserActivity = Date.now();
    let isPetSleeping = false;
    let roamInterval = null;

    function loadPetData() {
      try {
        const saved = JSON.parse(localStorage.getItem(PET_DATA_KEY));
        if (saved && typeof saved.level === 'number') {
          petData = saved;
        }
      } catch (e) {}
      updatePetUI();
    }

    function savePetData() {
      try {
        localStorage.setItem(PET_DATA_KEY, JSON.stringify(petData));
      } catch (e) {}
    }

    function updatePetUI() {
      if (petLevelBadge) petLevelBadge.textContent = `Lv. ${petData.level}`;
      if (petXpFill) {
        const pct = Math.min(100, Math.max(5, (petData.xp / petData.maxXp) * 100));
        petXpFill.style.width = `${pct}%`;
      }
    }

    function addPetXp(amount) {
      petData.xp += amount;
      if (petData.xp >= petData.maxXp) {
        petData.level += 1;
        petData.xp = petData.xp - petData.maxXp;
        petData.maxXp = Math.floor(petData.maxXp * 1.5);
        showToast(`🎉 Byte leveled up to Level ${petData.level}! ⭐`, '🌟');
        haptic([40, 60, 40]);
        setPetMood('happy');
      }
      savePetData();
      updatePetUI();
    }

    function loadSavedPetPosition() {
      try {
        const saved = JSON.parse(localStorage.getItem(PET_POS_KEY));
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
          const maxX = Math.max(20, window.innerWidth - 65);
          const maxY = Math.max(20, window.innerHeight - 80);
          petX = Math.max(10, Math.min(maxX, saved.x));
          petY = Math.max(10, Math.min(maxY, saved.y));
          return;
        }
      } catch (e) {}
      // Default initial location: comfortable bottom right
      petX = Math.max(16, window.innerWidth - 75);
      petY = Math.max(16, window.innerHeight - 110);
    }

    function savePetPosition() {
      try {
        localStorage.setItem(PET_POS_KEY, JSON.stringify({ x: petX, y: petY }));
      } catch (e) {}
    }

    function setPetMood(mood) {
      petMood = mood;
      const isCoding = mood === 'coding';
      const isMusic = mood === 'music';
      const isMeeting = mood === 'meeting';
      const isSleeping = mood === 'sleeping';
      const isSweat = mood === 'sweat';

      if (roamingAccCoding) roamingAccCoding.style.display = isCoding ? 'block' : 'none';
      if (roamingAccMusic) roamingAccMusic.style.display = isMusic ? 'block' : 'none';
      if (roamingAccMeeting) roamingAccMeeting.style.display = isMeeting ? 'block' : 'none';
      if (roamingAccSleep) roamingAccSleep.style.display = isSleeping ? 'block' : 'none';
      if (roamingAccSweat) roamingAccSweat.style.display = isSweat ? 'block' : 'none';

      if (roamingEyesOpen) roamingEyesOpen.style.display = isSleeping ? 'none' : 'block';
      if (roamingEyesClosed) roamingEyesClosed.style.display = isSleeping ? 'block' : 'none';
      if (roamingPetZzz) roamingPetZzz.style.display = isSleeping ? 'flex' : 'none';

      if (roamingPet) {
        roamingPet.classList.remove('is-sleeping', 'is-happy');
        if (isSleeping) {
          roamingPet.classList.add('is-sleeping');
        } else if (mood === 'happy') {
          roamingPet.classList.add('is-happy');
          setTimeout(() => roamingPet?.classList.remove('is-happy'), 600);
        } else {
          roamingPet.classList.add('is-idle');
        }
      }
    }

    function petByte() {
      haptic(35);
      const heart = document.createElement('span');
      heart.className = 'heart-particle';
      heart.textContent = '❤️';
      if (roamingPetHearts) {
        roamingPetHearts.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
      }
      addPetXp(5);
      setPetMood('happy');
      // Remains firmly in current location
      savePetPosition();
    }

    function initRoamingPet() {
      if (!roamingPet) return;
      loadSavedPetPosition();
      roamingPet.style.transition = 'none';
      roamingPet.style.transform = `translate3d(${petX}px, ${petY}px, 0)`;
      roamingPet.classList.add('is-idle');

      // Unified HTML5 Pointer Events (Smooth 60/120fps dragging with Pointer Capture)
      roamingPet.addEventListener('pointerdown', (e) => {
        isDraggingPet = true;
        hasDragged = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        petInitialX = petX;
        petInitialY = petY;
        roamingPet.style.transition = 'none';
        roamingPet.classList.add('is-dragging');
        try {
          roamingPet.setPointerCapture(e.pointerId);
        } catch (err) {}
        e.preventDefault();
      });

      roamingPet.addEventListener('pointermove', (e) => {
        lastUserActivity = Date.now();
        if (isPetSleeping) wakeUpPet();
        if (!isDraggingPet) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (Math.hypot(dx, dy) > 4) hasDragged = true;
        const maxX = Math.max(8, window.innerWidth - 52);
        const maxY = Math.max(8, window.innerHeight - 52);
        petX = Math.max(8, Math.min(maxX, petInitialX + dx));
        petY = Math.max(8, Math.min(maxY, petInitialY + dy));
        roamingPet.style.transform = `translate3d(${petX}px, ${petY}px, 0)`;
      });

      const handlePetPointerEnd = (e) => {
        if (!isDraggingPet) return;
        isDraggingPet = false;
        roamingPet.classList.remove('is-dragging');
        try {
          if (roamingPet.hasPointerCapture(e.pointerId)) {
            roamingPet.releasePointerCapture(e.pointerId);
          }
        } catch (err) {}
        savePetPosition();
        if (!hasDragged) {
          petByte();
        } else {
          addPetXp(2);
          setPetMood('happy');
          setTimeout(() => setPetMood(isPomoRunning ? 'coding' : 'idle'), 1200);
        }
      };

      roamingPet.addEventListener('pointerup', handlePetPointerEnd);
      roamingPet.addEventListener('pointercancel', handlePetPointerEnd);

      // Habitat badge in cockpit bar: tapping triggers a happy bounce at current location
      if (petHabitat) {
        petHabitat.addEventListener('click', () => {
          haptic(35);
          petByte();
        });
      }

      startWanderEngine();
    }

    function wakeUpPet() {
      if (!isPetSleeping) return;
      isPetSleeping = false;
      setPetMood(isPomoRunning ? 'coding' : 'idle');
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(evt => {
      window.addEventListener(evt, () => {
        lastUserActivity = Date.now();
        if (isPetSleeping) wakeUpPet();
      }, { passive: true });
    });

    function startWanderEngine() {
      clearInterval(roamInterval);
      roamInterval = setInterval(() => {
        if (isDraggingPet || isStandbyOpen) return;

        // Auto-sleep after 2.5 minutes of inactivity
        if (Date.now() - lastUserActivity > 150000 && !isPomoRunning) {
          if (!isPetSleeping) {
            isPetSleeping = true;
            setPetMood('sleeping');
          }
          return;
        }

        // Random play with ball
        if (Math.random() < 0.25 && !isPetSleeping) {
          playBall();
          return;
        }

        roamToNewTarget();
      }, 12000);
    }

    function playBall() {
      if (!roamingPetBall) return;
      roamingPetBall.style.display = 'block';
      setTimeout(() => {
        if (roamingPetBall) roamingPetBall.style.display = 'none';
        addPetXp(5);
      }, 2500);
    }

    function roamToNewTarget() {
      if (!roamingPet || isDraggingPet || isPetSleeping) return;

      const pad = 30;
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 90;

      const pick = Math.floor(Math.random() * 3);
      let targetX = Math.floor(pad + Math.random() * (maxX - pad));
      let targetY = Math.floor(pad + Math.random() * (maxY - pad));

      if (pick === 0) {
        const island = document.getElementById('dynamic-island-wrap');
        if (island) {
          const rect = island.getBoundingClientRect();
          targetX = Math.max(10, Math.min(maxX, rect.left + rect.width / 2 - 20));
          targetY = Math.max(10, rect.top - 46);
        }
      } else if (pick === 1) {
        const master = document.getElementById('master-tile');
        if (master) {
          const rect = master.getBoundingClientRect();
          targetX = Math.max(10, Math.min(maxX, rect.right - 60));
          targetY = Math.max(10, rect.bottom + 6);
        }
      }

      const dx = targetX - petX;
      petX = targetX;
      petY = targetY;
      savePetPosition();

      roamingPet.classList.remove('is-idle', 'is-walking-left', 'is-walking-right');
      if (dx < 0) {
        roamingPet.classList.add('is-walking-left');
      } else {
        roamingPet.classList.add('is-walking-right');
      }

      roamingPet.style.transition = 'transform 2.2s cubic-bezier(0.25, 1, 0.5, 1)';
      roamingPet.style.transform = `translate3d(${petX}px, ${petY}px, 0)`;

      setTimeout(() => {
        roamingPet?.classList.remove('is-walking-left', 'is-walking-right');
        if (!isPetSleeping) roamingPet?.classList.add('is-idle');
      }, 2250);
    }

    // ===========================================================
    // 2. Desk Pomodoro Focus Timer Controller (Dynamic Island)
    // ===========================================================
    const pomodoroModal = document.getElementById('pomodoro-modal');
    const pomoModalClose = document.getElementById('pomo-modal-close');
    const islandPomoBtn = document.getElementById('island-pomo-btn');
    const islandPomoClock = document.getElementById('island-pomo-clock');

    const pomoTimeDisplay = document.getElementById('pomo-time-display');
    const pomoStateLabel = document.getElementById('pomo-state-label');
    const pomoProgressRing = document.getElementById('pomo-progress-ring');
    const pomoToggleBtn = document.getElementById('pomo-toggle-btn');
    const pomoResetBtn = document.getElementById('pomo-reset-btn');

    const pomoTabFocus = document.getElementById('pomo-tab-focus');
    const pomoTabShort = document.getElementById('pomo-tab-short');
    const pomoTabLong = document.getElementById('pomo-tab-long');

    let pomoDuration = 25 * 60;
    let pomoRemaining = 25 * 60;
    let pomoTimer = null;
    let isPomoRunning = false;
    let pomoCurrentMode = 'focus';
    const FULL_DASH_ARRAY = 264;

    function openPomodoroModal() {
      pomodoroModal?.classList.add('open');
    }

    function setPomodoroMode(mode) {
      pomoCurrentMode = mode;
      clearInterval(pomoTimer);
      isPomoRunning = false;
      if (pomoToggleBtn) pomoToggleBtn.textContent = '▶ Start Focus';
      if (islandPomoBtn) islandPomoBtn.classList.remove('running');

      [pomoTabFocus, pomoTabShort, pomoTabLong].forEach(t => t?.classList.remove('active'));

      if (mode === 'focus') {
        pomoDuration = 25 * 60;
        pomoTabFocus?.classList.add('active');
        if (pomoStateLabel) pomoStateLabel.textContent = 'Deep Work';
        setPetMood('coding');
      } else if (mode === 'short') {
        pomoDuration = 5 * 60;
        pomoTabShort?.classList.add('active');
        if (pomoStateLabel) pomoStateLabel.textContent = 'Short Break';
        setPetMood('idle');
      } else if (mode === 'long') {
        pomoDuration = 15 * 60;
        pomoTabLong?.classList.add('active');
        if (pomoStateLabel) pomoStateLabel.textContent = 'Long Break';
        setPetMood('sleeping');
      }

      pomoRemaining = pomoDuration;
      updatePomodoroDisplay();
    }

    function updatePomodoroDisplay() {
      const mins = Math.floor(pomoRemaining / 60);
      const secs = pomoRemaining % 60;
      const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (pomoTimeDisplay) pomoTimeDisplay.textContent = str;
      if (islandPomoClock) islandPomoClock.textContent = str;

      if (pomoProgressRing) {
        const offset = FULL_DASH_ARRAY * (1 - (pomoRemaining / pomoDuration));
        pomoProgressRing.style.strokeDashoffset = offset;
      }
    }

    function startPomodoroTimer() {
      if (isPomoRunning) return;
      isPomoRunning = true;
      if (pomoToggleBtn) pomoToggleBtn.textContent = '⏸ Pause';
      if (islandPomoBtn) islandPomoBtn.classList.add('running');
      if (pomoCurrentMode === 'focus') setPetMood('coding');

      pomoTimer = setInterval(() => {
        if (pomoRemaining > 0) {
          pomoRemaining--;
          updatePomodoroDisplay();
        } else {
          clearInterval(pomoTimer);
          isPomoRunning = false;
          if (pomoToggleBtn) pomoToggleBtn.textContent = '▶ Start Focus';
          if (islandPomoBtn) islandPomoBtn.classList.remove('running');
          haptic([60, 100, 60, 100]);
          if (pomoCurrentMode === 'focus') {
            addPetXp(50);
            showToast('🎉 Focus complete! +50 XP awarded to Byte!', '⭐');
            setPetMood('happy');
          } else {
            showToast('Break finished! Ready for next session?', '☕');
            setPetMood('idle');
          }
        }
      }, 1000);
    }

    function pausePomodoroTimer() {
      clearInterval(pomoTimer);
      isPomoRunning = false;
      if (pomoToggleBtn) pomoToggleBtn.textContent = '▶ Resume';
      if (islandPomoBtn) islandPomoBtn.classList.remove('running');
    }

    if (islandPomoBtn) {
      let pomoPressTimer = null;
      let pomoLongPressed = false;

      islandPomoBtn.addEventListener('pointerdown', () => {
        pomoLongPressed = false;
        pomoPressTimer = setTimeout(() => {
          pomoLongPressed = true;
          haptic(45);
          openPomodoroModal();
        }, 450);
      });

      islandPomoBtn.addEventListener('pointerup', () => {
        if (pomoPressTimer) {
          clearTimeout(pomoPressTimer);
          pomoPressTimer = null;
        }
      });

      islandPomoBtn.addEventListener('pointercancel', () => {
        if (pomoPressTimer) {
          clearTimeout(pomoPressTimer);
          pomoPressTimer = null;
        }
      });

      islandPomoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pomoLongPressed) {
          pomoLongPressed = false;
          return;
        }
        haptic(35);
        if (isPomoRunning) {
          pausePomodoroTimer();
          showToast('Pomodoro Paused ⏸️', '⏱️');
        } else {
          startPomodoroTimer();
          showToast('Pomodoro Started! 🚀', '⏱️');
        }
      });
    }

    if (pomoToggleBtn) {
      pomoToggleBtn.addEventListener('click', () => {
        haptic(35);
        if (isPomoRunning) pausePomodoroTimer();
        else startPomodoroTimer();
      });
    }

    if (pomoResetBtn) {
      pomoResetBtn.addEventListener('click', () => {
        haptic(30);
        setPomodoroMode(pomoCurrentMode);
      });
    }

    if (pomoTabFocus) pomoTabFocus.addEventListener('click', () => setPomodoroMode('focus'));
    if (pomoTabShort) pomoTabShort.addEventListener('click', () => setPomodoroMode('short'));
    if (pomoTabLong) pomoTabLong.addEventListener('click', () => setPomodoroMode('long'));

    if (pomoModalClose) pomoModalClose.addEventListener('click', () => pomodoroModal?.classList.remove('open'));
    pomodoroModal?.addEventListener('click', (e) => {
      if (e.target === pomodoroModal) pomodoroModal.classList.remove('open');
    });

    // ===========================================================
    // 3. System Hardware Telemetry & Granular Utilities Modal
    // ===========================================================
    const telemCpuStat = document.getElementById('telem-cpu-stat');
    const telemGpuStat = document.getElementById('telem-gpu-stat');
    const telemRamStat = document.getElementById('telem-ram-stat');
    const telemPingStat = document.getElementById('telem-ping-stat');
    const openTelemBtn = document.getElementById('open-telem-btn');

    // Main HUD Ports Menu Elements
    const openPortsBtn = document.getElementById('open-ports-btn');
    const cockpitPortsBadge = document.getElementById('cockpit-ports-badge');
    const portsModal = document.getElementById('ports-modal');
    const portsModalClose = document.getElementById('ports-modal-close');
    const refreshPortsBtn = document.getElementById('refresh-ports-btn');
    const portsModalCount = document.getElementById('ports-modal-count');
    const portsQuickInput = document.getElementById('ports-quick-input');
    const portsQuickKillBtn = document.getElementById('ports-quick-kill-btn');
    const hudPortsCardsList = document.getElementById('hud-ports-cards-list');
    const portsScanStatus = document.getElementById('ports-scan-status');

    const telemetryModal = document.getElementById('telemetry-modal');
    const telemModalClose = document.getElementById('telem-modal-close');
    const tdCpuVal = document.getElementById('td-cpu-val');
    const tdGpuVal = document.getElementById('td-gpu-val');
    const tdGpuTemp = document.getElementById('td-gpu-temp');
    const tdRamVal = document.getElementById('td-ram-val');
    const tdRamUsed = document.getElementById('td-ram-used');
    const tdPingVal = document.getElementById('td-ping-val');
    const cleanRamBtn = document.getElementById('clean-ram-btn');
    const customPortInput = document.getElementById('custom-port-input');
    const customPortKillBtn = document.getElementById('custom-port-kill-btn');
    const activePortsList = document.getElementById('active-ports-list');
    const portChips = document.querySelectorAll('.port-chip');

    let latestTelemetry = null;

    async function pollTelemetry() {
      try {
        const res = await fetch('/api/system/telemetry');
        if (res.ok) {
          const data = await res.json();
          latestTelemetry = data;

          if (telemCpuStat) telemCpuStat.textContent = `${data.cpu_percent}%`;
          if (telemRamStat) telemRamStat.textContent = `${data.ram_percent}%`;
          if (data.gpu && telemGpuStat) {
            telemGpuStat.textContent = `${data.gpu.utilization}%`;
          }
          if (data.network && telemPingStat) {
            telemPingStat.textContent = `${data.network.ping_ms}ms`;
          }

          const portCount = data.ports_meta ? data.ports_meta.length : (data.listening_ports ? data.listening_ports.length : 0);
          if (cockpitPortsBadge) cockpitPortsBadge.textContent = portCount;

          const isOverloaded = data.cpu_percent >= 80 || data.ram_percent >= 88;
          if (openTelemBtn) {
            openTelemBtn.style.borderColor = isOverloaded ? 'rgba(239, 68, 68, 0.5)' : 'var(--card-border)';
            openTelemBtn.style.background = isOverloaded ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)';
          }
          if (isOverloaded && petMood !== 'coding' && petMood !== 'meeting') {
            setPetMood('sweat');
          } else if (!isOverloaded && petMood === 'sweat') {
            setPetMood('idle');
          }

          if (telemetryModal && telemetryModal.classList.contains('open')) {
            updateTelemetryModalUI(data);
          }

          if (portsModal && portsModal.classList.contains('open') && data.ports_meta) {
            updatePortsTriageStats(data);
            renderPortsCards(data.ports_meta);
          }

          if (isStandbyOpen) {
            updateStandbyHUDUI(data);
          }
        }
      } catch (e) {}
    }

    let currentPortsList = [];
    let currentPortsFilter = 'all';
    let portsSearchQuery = '';

    const portsStatApp = document.getElementById('ports-stat-app');
    const portsStatSuspicious = document.getElementById('ports-stat-suspicious');
    const portsStatExposed = document.getElementById('ports-stat-exposed');
    const portsStatSafe = document.getElementById('ports-stat-safe');
    const portsStatSystem = document.getElementById('ports-stat-system');
    const portsSearchFilter = document.getElementById('ports-search-filter');
    const countPortsAll = document.getElementById('count-ports-all');
    const countPortsApp = document.getElementById('count-ports-app');
    const countPortsSuspicious = document.getElementById('count-ports-suspicious');
    const countPortsExposed = document.getElementById('count-ports-exposed');
    const countPortsSafe = document.getElementById('count-ports-safe');
    const countPortsSystem = document.getElementById('count-ports-system');
    const portsSectionHeading = document.getElementById('ports-section-heading');

    async function fetchAndRenderPorts() {
      if (portsScanStatus) portsScanStatus.textContent = 'Scanning...';
      try {
        const res = await fetch('/api/system/ports');
        if (res.ok) {
          const data = await res.json();
          currentPortsList = data.ports || [];
          if (cockpitPortsBadge) cockpitPortsBadge.textContent = currentPortsList.length;
          if (portsModalCount) portsModalCount.textContent = `${currentPortsList.length} Open`;
          if (portsScanStatus) {
            portsScanStatus.textContent = `Live • ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`;
          }
          updatePortsTriageStats(data);
          renderPortsCards();
        } else {
          if (portsScanStatus) portsScanStatus.textContent = 'Scan failed';
        }
      } catch (e) {
        if (portsScanStatus) portsScanStatus.textContent = 'Scan failed';
      }
    }

    function updatePortsTriageStats(data) {
      const appCount = data.app_count ?? currentPortsList.filter(p => p.security_level === 'app').length;
      const suspiciousCount = data.suspicious_count ?? currentPortsList.filter(p => p.security_level === 'suspicious').length;
      const exposedCount = data.exposed_count ?? currentPortsList.filter(p => p.security_level === 'exposed').length;
      const safeCount = data.safe_count ?? currentPortsList.filter(p => p.security_level === 'safe').length;
      const systemCount = data.system_count ?? currentPortsList.filter(p => p.security_level === 'system').length;

      if (portsStatApp) portsStatApp.textContent = `${appCount} This App`;
      if (portsStatSuspicious) portsStatSuspicious.textContent = `${suspiciousCount} Suspicious`;
      if (portsStatExposed) portsStatExposed.textContent = `${exposedCount} LAN Exposed`;
      if (portsStatSafe) portsStatSafe.textContent = `${safeCount} Safe Local`;
      if (portsStatSystem) portsStatSystem.textContent = `${systemCount} System`;

      if (countPortsAll) countPortsAll.textContent = currentPortsList.length;
      if (countPortsApp) countPortsApp.textContent = appCount;
      if (countPortsSuspicious) countPortsSuspicious.textContent = suspiciousCount;
      if (countPortsExposed) countPortsExposed.textContent = exposedCount;
      if (countPortsSafe) countPortsSafe.textContent = safeCount;
      if (countPortsSystem) countPortsSystem.textContent = systemCount;

      const portsFixBanner = document.getElementById('ports-fix-banner');
      const suspiciousBannerText = document.getElementById('suspicious-banner-text');
      if (portsFixBanner && suspiciousBannerText) {
        if (suspiciousCount > 0) {
          portsFixBanner.style.display = 'flex';
          suspiciousBannerText.textContent = `${suspiciousCount} Suspicious Port${suspiciousCount > 1 ? 's' : ''}`;
        } else {
          portsFixBanner.style.display = 'none';
        }
      }
    }

    function renderPortsCards(portsOverride) {
      if (portsOverride) {
        currentPortsList = portsOverride;
      }
      if (portsModalCount) portsModalCount.textContent = `${currentPortsList.length} Open`;
      if (!hudPortsCardsList) return;

      // Filter ports according to active pill and search query
      let filtered = currentPortsList;
      if (currentPortsFilter !== 'all') {
        filtered = filtered.filter(p => p.security_level === currentPortsFilter);
      }

      if (portsSearchQuery) {
        const q = portsSearchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          String(p.port).includes(q) ||
          String(p.pid).includes(q) ||
          (p.process_name || '').toLowerCase().includes(q) ||
          (p.service_tag || '').toLowerCase().includes(q) ||
          (p.security_reason || '').toLowerCase().includes(q) ||
          (p.process_path || '').toLowerCase().includes(q) ||
          (p.local_address || '').toLowerCase().includes(q)
        );
      }

      if (portsSectionHeading) {
        const filterLabel = currentPortsFilter === 'all' ? 'ACTIVE' : currentPortsFilter.toUpperCase();
        portsSectionHeading.textContent = `${filterLabel} PORTS (${filtered.length} OF ${currentPortsList.length})`;
      }

      if (filtered.length === 0) {
        if (currentPortsList.length === 0) {
          hudPortsCardsList.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 22px; text-align: center;">
              <div style="font-size: 1.6rem; margin-bottom: 6px;">🟢</div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #34d399;">All Ports Idle & Clean</div>
              <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">No active development servers, listening sockets, or suspicious listeners found.</div>
            </div>
          `;
        } else if (currentPortsFilter === 'app') {
          hudPortsCardsList.innerHTML = `
            <div style="background: rgba(168, 85, 247, 0.08); border: 1px dashed rgba(168, 85, 247, 0.35); border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 1.5rem; margin-bottom: 4px;">💎</div>
              <div style="font-size: 0.85rem; font-weight: 800; color: #d8b4fe;">No App-Owned Ports Active</div>
              <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">The Python server host process is not listening on any ports matching this filter.</div>
            </div>
          `;
        } else if (currentPortsFilter === 'suspicious') {
          hudPortsCardsList.innerHTML = `
            <div style="background: rgba(168, 85, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 1.5rem; margin-bottom: 4px;">🛡️</div>
              <div style="font-size: 0.85rem; font-weight: 800; color: #34d399;">0 Suspicious Ports Detected</div>
              <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">No trojan listeners, malware ports, unisolated Redis, or temp-path sockets active.</div>
            </div>
          `;
        } else {
          hudPortsCardsList.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 1.3rem; margin-bottom: 4px;">🔍</div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1;">No matching ports found</div>
              <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">Try clearing your search query or switching filter tabs.</div>
            </div>
          `;
        }
        return;
      }

      hudPortsCardsList.innerHTML = '';
      filtered.forEach(p => {
        const card = document.createElement('div');
        const secLevel = p.security_level || 'safe';
        const isApp = secLevel === 'app' || p.is_current_app;
        const isSuspicious = secLevel === 'suspicious';
        const isExposed = secLevel === 'exposed';
        const isSystem = secLevel === 'system';

        card.className = `port-meta-card sec-${secLevel}`;
        
        let icon = '⚙️';
        if (isApp) {
          icon = '💎';
        } else {
          const pname = (p.process_name || '').toLowerCase();
          if (pname.includes('python')) icon = '🐍';
          else if (pname.includes('node') || pname.includes('npm')) icon = '🟩';
          else if (pname.includes('code')) icon = '💻';
          else if (pname.includes('chrome') || pname.includes('edge')) icon = '🌐';
          else if (pname.includes('discord')) icon = '💬';
          else if (pname.includes('redis')) icon = '🟥';
          else if (pname.includes('mongo')) icon = '🍃';
          else if (pname.includes('postgres') || pname.includes('mysql')) icon = '🐬';
          else if (isSuspicious) icon = '⚠️';
        }

        const scopeTagClass = isExposed ? 'scope-lan' : 'scope-local';
        const scopeText = p.bind_scope || (p.local_address && p.local_address.startsWith('0.0.0.0') ? 'LAN / Public (0.0.0.0)' : 'Localhost (127.0.0.1)');

        card.innerHTML = `
          <div class="port-card-top-row">
            <div class="port-card-ident">
              <div class="port-num-badge sec-${secLevel}">:${p.port}</div>
              <div class="port-info-block">
                <div class="port-proc-name">
                  <span>${icon} ${p.process_name || 'Process'}</span>
                  <span class="port-service-tag">${p.service_tag || 'TCP Service'}</span>
                  <span class="port-sec-badge sec-${secLevel}">${p.security_badge || secLevel.toUpperCase()}</span>
                </div>
                <div class="port-meta-sub">
                  PID: <b>${p.pid}</b> &bull; ${p.protocol || 'TCP'} &bull; <code>${p.local_address || '0.0.0.0:' + p.port}</code> &bull; <span class="port-scope-tag ${scopeTagClass}">${scopeText}</span>
                </div>
              </div>
            </div>
            <div class="port-card-action">
              ${isApp ? `
                <span class="port-system-badge" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); color: #d8b4fe;" title="Active server socket owned by this Volume Control instance. Self-termination protected.">💎 Current App Host</span>
              ` : p.can_kill ? `
                <button class="port-kill-action-btn ${isSuspicious ? 'is-suspicious' : ''}" title="Terminate process ${p.process_name} (PID ${p.pid}) on port ${p.port}" data-port="${p.port}">
                  ${isSuspicious ? '🚨 Terminate' : '✕ Close'}
                </button>
              ` : `
                <span class="port-system-badge" title="Protected Windows Core Operating System service. Termination disabled.">🔒 System Core</span>
              `}
            </div>
          </div>

          ${p.security_reason ? `
            <div class="port-sec-reason-box sec-${secLevel}">
              <span style="font-size: 0.8rem; flex-shrink: 0;">${isApp ? '💎' : isSuspicious ? '🚨' : isExposed ? '⚠️' : isSystem ? '🛡️' : '🟢'}</span>
              <span><b>${isApp ? 'Application Socket:' : isSuspicious ? 'Security Alert:' : isExposed ? 'LAN Exposure:' : isSystem ? 'System Service:' : 'Audit Note:'}</b> ${p.security_reason}</span>
            </div>
          ` : ''}

          ${p.process_path ? `
            <div class="port-path-text" title="${p.process_path}">
              📁 ${p.process_path}
            </div>
          ` : ''}
        `;

        const killBtn = card.querySelector('.port-kill-action-btn');
        if (killBtn) {
          killBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await killPortWithFeedback(p.port, p.process_name, p.pid);
          });
        }

        hudPortsCardsList.appendChild(card);
      });
    }

    // Set up Ports Filter Pills
    document.querySelectorAll('.ports-filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.ports-filter-pill').forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        currentPortsFilter = pill.dataset.filter || 'all';
        renderPortsCards();
      });
    });

    // Set up Triage summary boxes as instant filters
    document.querySelectorAll('.ports-triage-item').forEach(box => {
      box.addEventListener('click', (e) => {
        const filter = box.dataset.filter;
        if (filter) {
          document.querySelectorAll('.ports-filter-pill').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === filter);
          });
          currentPortsFilter = filter;
          renderPortsCards();
        }
      });
    });

    // Search filter input listener
    if (portsSearchFilter) {
      portsSearchFilter.addEventListener('input', (e) => {
        portsSearchQuery = e.target.value.trim();
        renderPortsCards();
      });
    }

    async function killPortWithFeedback(port, procName, pid) {
      haptic(45);
      try {
        const res = await fetch('/api/system/kill-port', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port: parseInt(port) })
        });
        const data = await res.json();
        const msg = data.message || `Closed port :${port}`;
        showToast(msg, '🚫');
        addPetXp(12);
        fetchAndRenderPorts();
        pollTelemetry();
      } catch (e) {
        showToast(`Failed to close port :${port}`, '✕', true);
      }
    }

    function updateTelemetryModalUI(data) {
      if (tdCpuVal) tdCpuVal.textContent = `${data.cpu_percent}%`;
      if (tdGpuVal && data.gpu) tdGpuVal.textContent = `${data.gpu.utilization}%`;
      if (tdGpuTemp && data.gpu) tdGpuTemp.textContent = `${data.gpu.temperature}°C`;
      if (tdRamVal) tdRamVal.textContent = `${data.ram_percent}%`;
      if (tdRamUsed) tdRamUsed.textContent = `${data.ram_used_gb} / ${data.ram_total_gb} GB`;
      if (tdPingVal && data.network) tdPingVal.textContent = `${data.network.ping_ms} ms`;

      if (activePortsList) {
        const ports = data.ports_meta || [];
        if (ports.length === 0) {
          activePortsList.innerHTML = '<div style="color:var(--text-muted); padding:4px;">No standard dev listening ports found.</div>';
        } else {
          activePortsList.innerHTML = '';
          ports.forEach(p => {
            const row = document.createElement('div');
            row.className = 'active-port-item';
            row.innerHTML = `
              <span>Port <b>:${p.port}</b> (${p.process_name || 'LISTENING'} PID ${p.pid})</span>
              <button class="port-chip" style="color:#f87171; border-color:#ef4444;" data-port="${p.port}">Close</button>
            `;
            row.querySelector('button').addEventListener('click', () => killPortWithFeedback(p.port, p.process_name, p.pid));
            activePortsList.appendChild(row);
          });
        }
      }
    }

    async function killPort(port) {
      await killPortWithFeedback(port);
    }

    if (cleanRamBtn) {
      cleanRamBtn.addEventListener('click', async () => {
        haptic(40);
        try {
          const res = await fetch('/api/system/clean-ram', { method: 'POST' });
          const data = await res.json();
          showToast(data.message || 'Trimmed RAM Working Sets!', '🧹');
          addPetXp(15);
          setPetMood('happy');
          pollTelemetry();
        } catch (e) {
          showToast('Failed to clean RAM', '✕', true);
        }
      });
    }

    if (customPortKillBtn && customPortInput) {
      customPortKillBtn.addEventListener('click', () => {
        const p = customPortInput.value.trim();
        if (p) killPortWithFeedback(parseInt(p));
      });
    }

    if (portsQuickKillBtn && portsQuickInput) {
      portsQuickKillBtn.addEventListener('click', () => {
        const p = portsQuickInput.value.trim();
        if (p) {
          killPortWithFeedback(parseInt(p));
          portsQuickInput.value = '';
        }
      });
    }

    document.querySelectorAll('.port-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const port = chip.getAttribute('data-port');
        if (port) killPortWithFeedback(parseInt(port));
      });
    });

    if (openPortsBtn) {
      openPortsBtn.addEventListener('click', () => {
        haptic(35);
        portsModal?.classList.add('open');
        fetchAndRenderPorts();
      });
    }
    if (portsModalClose) {
      portsModalClose.addEventListener('click', () => portsModal?.classList.remove('open'));
    }
    if (refreshPortsBtn) {
      refreshPortsBtn.addEventListener('click', () => {
        haptic(30);
        fetchAndRenderPorts();
      });
    }
    const portsFixAllBtn = document.getElementById('ports-fix-all-btn');
    if (portsFixAllBtn) {
      portsFixAllBtn.addEventListener('click', async () => {
        haptic(50);
        portsFixAllBtn.disabled = true;
        const originalText = portsFixAllBtn.textContent;
        portsFixAllBtn.textContent = 'Securing...';
        try {
          const res = await fetch('/api/system/ports/fix-suspicious', { method: 'POST' });
          const data = await res.json();
          showToast(data.message || 'Suspicious ports resolved!', '🛡️');
          addPetXp(25);
          setPetMood('happy');
          fetchAndRenderPorts();
          pollTelemetry();
        } catch (e) {
          showToast('Failed to fix ports', '✕', true);
        } finally {
          portsFixAllBtn.disabled = false;
          portsFixAllBtn.textContent = originalText;
        }
      });
    }
    portsModal?.addEventListener('click', (e) => {
      if (e.target === portsModal) portsModal.classList.remove('open');
    });

    if (openTelemBtn) {
      openTelemBtn.addEventListener('click', () => {
        if (latestTelemetry) updateTelemetryModalUI(latestTelemetry);
        telemetryModal?.classList.add('open');
      });
    }
    if (telemModalClose) {
      telemModalClose.addEventListener('click', () => telemetryModal?.classList.remove('open'));
    }
    telemetryModal?.addEventListener('click', (e) => {
      if (e.target === telemetryModal) telemetryModal.classList.remove('open');
    });

    // ===========================================================
    // 4. Windows App Launcher Controller
    // ===========================================================
    const islandLauncherBtn = document.getElementById('island-launcher-btn');
    const appLauncherModal = document.getElementById('app-launcher-modal');
    const launcherModalClose = document.getElementById('launcher-modal-close');
    const launcherSearchInput = document.getElementById('launcher-search-input');
    const launcherAppsList = document.getElementById('launcher-apps-list');
    const launcherTabs = document.querySelectorAll('.launcher-tab');
    const launcherCountAll = document.getElementById('launcher-count-all');

    let availableApps = [];
    let currentAppCat = 'all';
    let currentAppSearch = '';

    async function loadAvailableApps() {
      try {
        const res = await fetch('/api/apps');
        if (res.ok) {
          availableApps = await res.json();
          if (launcherCountAll) launcherCountAll.textContent = availableApps.length;
          renderAppLauncherList();
        }
      } catch (e) {}
    }

    function renderAppLauncherList() {
      if (!launcherAppsList) return;
      let filtered = availableApps;

      if (currentAppCat !== 'all') {
        filtered = filtered.filter(a => (a.category || '').toLowerCase() === currentAppCat.toLowerCase());
      }
      if (currentAppSearch) {
        const q = currentAppSearch.toLowerCase();
        filtered = filtered.filter(a => (a.name || '').toLowerCase().includes(q) || (a.desc && a.desc.toLowerCase().includes(q)));
      }

      launcherAppsList.innerHTML = '';
      if (!filtered || filtered.length === 0) {
        launcherAppsList.innerHTML = '<div style="grid-column: 1/-1; color:var(--text-muted); font-size:0.8rem; text-align:center; padding:30px;">No matching apps found.</div>';
        return;
      }

      filtered.forEach(app => {
        const card = document.createElement('div');
        card.className = 'app-launch-card';
        card.innerHTML = `
          <div class="app-card-icon">${app.icon || '🪟'}</div>
          <div class="app-card-name" title="${app.name}">${app.name}</div>
          <div class="app-card-cat">${app.category || 'App'}</div>
          <div class="app-card-launch-badge">Launch 🚀</div>
        `;
        card.addEventListener('click', async () => {
          haptic(40);
          try {
            const res = await fetch('/api/apps/launch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ target: app.target })
            });
            const data = await res.json();
            if (data.success) {
              showToast(`Started ${app.name}! 🚀`, '✓');
              addPetXp(5);
              appLauncherModal?.classList.remove('open');
            } else {
              showToast(`Failed: ${data.error || 'Cannot open'}`, '✕', true);
            }
          } catch (e) {
            showToast(`Failed to launch ${app.name}`, '✕', true);
          }
        });
        launcherAppsList.appendChild(card);
      });
    }

    if (islandLauncherBtn) {
      islandLauncherBtn.addEventListener('click', () => {
        haptic(35);
        loadAvailableApps();
        appLauncherModal?.classList.add('open');
        setTimeout(() => launcherSearchInput?.focus(), 120);
      });
    }

    if (launcherModalClose) {
      launcherModalClose.addEventListener('click', () => appLauncherModal?.classList.remove('open'));
    }
    appLauncherModal?.addEventListener('click', (e) => {
      if (e.target === appLauncherModal) appLauncherModal.classList.remove('open');
    });

    if (launcherSearchInput) {
      launcherSearchInput.addEventListener('input', (e) => {
        currentAppSearch = e.target.value.trim();
        renderAppLauncherList();
      });
    }

    launcherTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        launcherTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentAppCat = tab.getAttribute('data-cat') || 'all';
        renderAppLauncherList();
      });
    });

    // ===========================================================
    // 5. Standby HUD Fullscreen Dashboard Controller (OLED Ambient Mode)
    // ===========================================================
    const openStandbyBtn = document.getElementById('open-standby-btn');
    const standbyHud = document.getElementById('standby-hud');
    const standbyDriftWrap = document.getElementById('standby-drift-wrap');

    // Big Number Clock Elements
    const standbyClockHours = document.getElementById('standby-clock-hours');
    const standbyClockMins = document.getElementById('standby-clock-mins');
    const standbySecBadge = document.getElementById('standby-sec-badge');
    const standbyAmpmBadge = document.getElementById('standby-ampm-badge');
    const standbyClock = document.getElementById('standby-clock');
    const standbyDate = document.getElementById('standby-date');

    // Standby Volume Elements (Readout Only)
    const standbyVolNum = document.getElementById('standby-vol-num');
    const standbyVolFill = document.getElementById('standby-vol-fill');
    const standbyVolStatusBadge = document.getElementById('standby-vol-status-badge');
    const standbyAudioMeta = document.getElementById('standby-audio-meta');

    // Status Badges & Hardware Elements
    const standbyGpuBadgeText = document.getElementById('standby-gpu-badge-text');
    const standbyPowerBadgeText = document.getElementById('standby-power-badge-text');
    const standbyUptimeBadgeText = document.getElementById('standby-uptime-badge-text');
    const standbyPowerBadge = document.getElementById('standby-power-badge');

    // Vitals Metric Elements
    const gaugeCpuVal = document.getElementById('gauge-cpu-val');
    const gaugeCpuSub = document.getElementById('gauge-cpu-sub');
    const vitalCpuBar = document.getElementById('vital-cpu-bar');
    const standbyCpuTag = document.getElementById('standby-cpu-tag');
    const gaugeCpuBar = document.getElementById('gauge-cpu-bar'); // legacy fallback

    const gaugeGpuVal = document.getElementById('gauge-gpu-val');
    const gaugeGpuTemp = document.getElementById('gauge-gpu-temp');
    const gaugeGpuVram = document.getElementById('gauge-gpu-vram');
    const gaugeGpuVramFill = document.getElementById('gauge-gpu-vram-fill');
    const standbyGpuCardTitle = document.getElementById('standby-gpu-card-title');
    const gaugeGpuBar = document.getElementById('gauge-gpu-bar'); // legacy fallback

    const gaugeRamVal = document.getElementById('gauge-ram-val');
    const gaugeRamSub = document.getElementById('gauge-ram-sub');
    const gaugeRamAvail = document.getElementById('gauge-ram-avail');
    const vitalRamBar = document.getElementById('vital-ram-bar');
    const gaugeRamBar = document.getElementById('gauge-ram-bar'); // legacy fallback

    const standbyDownSpeed = document.getElementById('standby-down-speed');
    const standbyUpSpeed = document.getElementById('standby-up-speed');
    const standbyPingBadge = document.getElementById('standby-ping-badge');
    const vitalNetBar = document.getElementById('vital-net-bar');
    const standbyDownSpeedLegend = document.getElementById('standby-down-speed-legend');
    const standbyUpSpeedLegend = document.getElementById('standby-up-speed-legend');

    // Bottom Power / System Dock Elements
    const standbyPowerSourceVal = document.getElementById('standby-power-source-val');
    const standbyUptimeVal = document.getElementById('standby-uptime-val');
    const standbyGpuFullname = document.getElementById('standby-gpu-fullname');
    const standbyPortsVal = document.getElementById('standby-ports-val');

    // Sparkline & Pet Elements
    const sparklineDownArea = document.getElementById('sparkline-down-area');
    const sparklineDownLine = document.getElementById('sparkline-down-line');
    const sparklineUpLine = document.getElementById('sparkline-up-line');
    const standbyPetNest = document.getElementById('standby-pet-nest');

    let isStandbyOpen = false;
    let standbyClockTimer = null;
    let networkSpeedHistory = [];
    const MAX_SPARKLINE_POINTS = 25;
    let standbyEnteredAt = 0;

    // ===========================================================
    // Standby Wake Protection & Double-Click Guard
    // Prevents accidental click-throughs, synthetic touch clicks,
    // and rapid double-clicks on home screen buttons when waking from standby.
    // ===========================================================
    const STANDBY_WAKE_GUARD_DELAY_MS = 600;
    let lastStandbyExitedAt = 0;
    let isStandbyWakeLocked = false;
    let standbyWakeLockTimer = null;
    let lastSwallowedDownAt = 0;

    function activateStandbyWakeGuard() {
      lastStandbyExitedAt = Date.now();
      isStandbyWakeLocked = true;
      document.body.classList.add('standby-wake-locked');

      if (standbyWakeLockTimer) clearTimeout(standbyWakeLockTimer);
      standbyWakeLockTimer = setTimeout(() => {
        isStandbyWakeLocked = false;
        document.body.classList.remove('standby-wake-locked');
      }, STANDBY_WAKE_GUARD_DELAY_MS);
    }

    // Capture-phase event suppressor: captures and drops all clicks, double clicks,
    // pointer, and touch events on the home screen immediately following a standby wake
    const wakeGuardEvents = [
      'click', 'dblclick', 'auxclick', 'contextmenu',
      'pointerdown', 'pointerup',
      'mousedown', 'mouseup',
      'touchstart', 'touchend', 'touchcancel'
    ];

    wakeGuardEvents.forEach((evtType) => {
      window.addEventListener(evtType, (e) => {
        const timeSinceExit = Date.now() - lastStandbyExitedAt;
        const timeSinceSwallowedDown = Date.now() - lastSwallowedDownAt;
        const shouldBlock = isStandbyWakeLocked || 
                            (timeSinceExit < STANDBY_WAKE_GUARD_DELAY_MS) || 
                            (timeSinceSwallowedDown < 500);

        if (shouldBlock) {
          // Allow interactions if they are inside standby HUD itself
          if (e.target && (e.target.id === 'standby-hud' || (e.target.closest && e.target.closest('#standby-hud')))) {
            return;
          }

          if (evtType === 'pointerdown' || evtType === 'mousedown' || evtType === 'touchstart') {
            lastSwallowedDownAt = Date.now();
          }

          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
          }
          return false;
        }
      }, true); // true = capture phase before any home screen node sees the event
    });

    // OLED Anti-Burn-In Pixel Drift
    let driftIndex = 0;
    const driftOffsets = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 }
    ];
    function applyOledDrift() {
      if (!standbyDriftWrap) return;
      driftIndex = (driftIndex + 1) % driftOffsets.length;
      const off = driftOffsets[driftIndex];
      standbyDriftWrap.style.transform = `translate(${off.x}px, ${off.y}px)`;
    }

    // Standby Volume UI Sync (Readout Only)
    function updateStandbyVolumeUI(vol, muted) {
      if (standbyVolNum) {
        standbyVolNum.textContent = muted ? 'MUTE' : vol;
      }
      if (standbyVolFill) {
        standbyVolFill.style.width = `${muted ? 0 : vol}%`;
        standbyVolFill.style.background = muted ? '#ef4444' : 'linear-gradient(90deg, #0ea5e9, #38bdf8)';
      }
      if (standbyVolStatusBadge) {
        standbyVolStatusBadge.textContent = muted ? 'MUTED' : (vol === 0 ? 'SILENT' : 'ACTIVE');
        standbyVolStatusBadge.classList.toggle('muted', muted);
      }
    }

    function enterStandbyMode() {
      isStandbyOpen = true;
      isSleeping = true;
      standbyEnteredAt = Date.now();
      if (standbyHud) {
        standbyHud.style.display = 'flex';
      }
      setPetMood('sleeping');
      updateStandbyClock();
      clearInterval(standbyClockTimer);
      standbyClockTimer = setInterval(updateStandbyClock, 1000);

      // In standby mode, pause fast active polling and poll every 60s to save energy
      stopPolling();
      stopTelemetryPolling();
      clearInterval(standbySyncTimer);
      standbySyncTimer = setInterval(() => {
        pollTelemetry();
        syncState();
      }, 60000); // 60 seconds

      // Immediate refresh on entering standby
      updateStandbyVolumeUI(currentMasterVolume, currentMasterMuted);
      if (latestTelemetry) updateStandbyHUDUI(latestTelemetry);
      pollTelemetry();
      syncState();
    }

    function exitStandbyMode() {
      if (!isStandbyOpen && !isSleeping) return;
      isStandbyOpen = false;
      isSleeping = false;
      lastActivityTimestamp = Date.now();

      // Enforce the wake guard delay to protect home screen buttons from click-throughs and double-clicks
      activateStandbyWakeGuard();

      if (standbyHud) {
        standbyHud.style.display = 'none';
      }
      clearInterval(standbyClockTimer);
      clearInterval(standbySyncTimer);

      setPetMood(isPomoRunning ? 'coding' : 'idle');

      // Silently restore fast active polling
      startPolling();
      startTelemetryPolling();
      syncState();
      pollTelemetry();
    }

    function updateStandbyClock() {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');
      const minutesStr = String(now.getMinutes()).padStart(2, '0');
      const secondsStr = String(now.getSeconds()).padStart(2, '0');

      if (standbyClockHours) standbyClockHours.textContent = hoursStr;
      if (standbyClockMins) standbyClockMins.textContent = minutesStr;
      if (standbySecBadge) standbySecBadge.textContent = `:${secondsStr}`;
      if (standbyAmpmBadge) standbyAmpmBadge.textContent = ampm;

      if (standbyClock) {
        standbyClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (standbyDate) {
        standbyDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }

      // Check OLED burn-in drift once per minute (at 0 seconds)
      if (now.getSeconds() === 0) {
        applyOledDrift();
      }
    }

    function updateRadialGauge(barEl, pct) {
      if (!barEl) return;
      const offset = FULL_DASH_ARRAY * (1 - Math.min(100, Math.max(0, pct)) / 100);
      barEl.style.strokeDashoffset = offset;
    }

    function updateStandbyHUDUI(data) {
      if (!data) return;

      // 1. CPU Telemetry (Big Number & Logical Cores)
      const cpuPct = data.cpu_percent || 0;
      updateRadialGauge(gaugeCpuBar, cpuPct);
      if (gaugeCpuVal) gaugeCpuVal.textContent = `${cpuPct}%`;
      if (vitalCpuBar) vitalCpuBar.style.width = `${cpuPct}%`;
      if (gaugeCpuSub) {
        const cores = data.cpu_cores || 12;
        gaugeCpuSub.textContent = `${cores} Cores • ${cpuPct > 75 ? 'BOOST LOAD' : 'NORMAL'}`;
      }
      if (standbyCpuTag) {
        standbyCpuTag.textContent = cpuPct > 75 ? 'Boost' : 'Optimal';
        standbyCpuTag.style.color = cpuPct > 75 ? '#f59e0b' : '#38bdf8';
      }

      // 2. GPU Telemetry (Real NVIDIA GeForce RTX 5060)
      if (data.gpu) {
        const gpuUtil = data.gpu.utilization || 0;
        updateRadialGauge(gaugeGpuBar, gpuUtil);
        if (gaugeGpuVal) gaugeGpuVal.textContent = `${gpuUtil}%`;
        if (gaugeGpuTemp) gaugeGpuTemp.textContent = `${data.gpu.temperature || 0}°C`;
        
        const usedMb = data.gpu.memory_used_mb || 0;
        const totMb = data.gpu.memory_total_mb || 8192;
        const usedGb = (usedMb / 1024).toFixed(1);
        const totGb = (totMb / 1024).toFixed(1);

        if (gaugeGpuVram) {
          gaugeGpuVram.textContent = `${usedGb} / ${totGb} GB VRAM (${usedMb} MB)`;
        }
        if (gaugeGpuVramFill) {
          gaugeGpuVramFill.style.width = `${Math.min(100, (usedMb / totMb) * 100)}%`;
        }

        const rawGpuName = data.gpu.name || 'NVIDIA GeForce RTX 5060';
        const cleanGpuName = rawGpuName.replace('NVIDIA GeForce ', '').trim();
        if (standbyGpuCardTitle) standbyGpuCardTitle.textContent = `🎮 ${cleanGpuName}`;
        if (standbyGpuBadgeText) standbyGpuBadgeText.textContent = `${cleanGpuName} LIVE HUD`;
        if (standbyGpuFullname) standbyGpuFullname.textContent = rawGpuName;
      }

      // 3. RAM Telemetry
      const ramPct = data.ram_percent || 0;
      updateRadialGauge(gaugeRamBar, ramPct);
      if (gaugeRamVal) gaugeRamVal.textContent = `${ramPct}%`;
      if (vitalRamBar) vitalRamBar.style.width = `${ramPct}%`;
      if (gaugeRamSub) gaugeRamSub.textContent = `${data.ram_used_gb || 0} GB / ${data.ram_total_gb || 32} GB`;
      if (gaugeRamAvail) gaugeRamAvail.textContent = `${data.ram_avail_gb || 0} GB Free`;

      // 4. Network Telemetry & Real-Time Sparkline
      if (data.network) {
        const downKb = data.network.down_speed_kb || 0;
        const upKb = data.network.up_speed_kb || 0;
        const downFormatted = downKb > 1024 ? `${(downKb / 1024).toFixed(1)} MB/s` : `${downKb.toFixed(1)} KB/s`;
        const upFormatted = upKb > 1024 ? `${(upKb / 1024).toFixed(1)} MB/s` : `${upKb.toFixed(1)} KB/s`;

        if (standbyDownSpeed) standbyDownSpeed.textContent = downFormatted;
        if (standbyUpSpeed) standbyUpSpeed.textContent = upFormatted;
        if (standbyDownSpeedLegend) standbyDownSpeedLegend.textContent = downFormatted;
        if (standbyUpSpeedLegend) standbyUpSpeedLegend.textContent = upFormatted;

        if (vitalNetBar) {
          vitalNetBar.style.width = `${Math.min(100, (downKb / 5120) * 100)}%`;
        }

        if (standbyPingBadge) {
          const pingMs = data.network.ping_ms || 16;
          standbyPingBadge.textContent = `${pingMs} ms • ${pingMs < 30 ? 'Optimal' : 'Standard'}`;
        }

        networkSpeedHistory.push({ down: downKb, up: upKb });
        if (networkSpeedHistory.length > MAX_SPARKLINE_POINTS) networkSpeedHistory.shift();
        renderSparkline();
      }

      // 5. Real Windows Power & Battery Telemetry
      if (data.power) {
        const powerText = data.power.status_text || 'AC Mains (Desktop ⚡)';
        if (standbyPowerBadgeText) standbyPowerBadgeText.textContent = powerText;
        if (standbyPowerSourceVal) standbyPowerSourceVal.textContent = powerText;
        if (standbyPowerBadge) {
          standbyPowerBadge.classList.toggle('power-ac', data.power.ac_online);
        }
      }

      // 6. Real Windows Uptime Telemetry
      if (data.uptime) {
        const upFormatted = data.uptime.formatted || '0h 0m';
        if (standbyUptimeBadgeText) standbyUptimeBadgeText.textContent = `Uptime: ${upFormatted}`;
        if (standbyUptimeVal) standbyUptimeVal.textContent = `${upFormatted} (${data.uptime.seconds}s)`;
      }

      // 7. Active Ports & Services
      if (data.listening_ports && data.listening_ports.length > 0) {
        if (standbyPortsVal) {
          standbyPortsVal.textContent = `${data.listening_ports.length} Active (Ports :${data.listening_ports.slice(0, 3).join(', :')})`;
        }
      } else {
        if (standbyPortsVal) standbyPortsVal.textContent = 'Clean / Idle (0 Ports)';
      }

      // 8. Audio Telemetry
      if (data.audio) {
        if (data.audio.master_volume !== undefined) {
          currentMasterVolume = data.audio.master_volume;
          currentMasterMuted = data.audio.master_muted;
          updateStandbyVolumeUI(currentMasterVolume, currentMasterMuted);
        }
        if (standbyAudioMeta) {
          if (data.audio.active_sessions && data.audio.active_sessions.length > 0) {
            standbyAudioMeta.textContent = `Active Streams: ${data.audio.active_sessions.slice(0, 3).join(', ')}`;
          } else {
            standbyAudioMeta.textContent = 'Default Device: Speakers • No active app streams';
          }
        }
      }
    }

    function renderSparkline() {
      if (!sparklineDownArea || !sparklineDownLine || networkSpeedHistory.length < 2) return;
      const w = 400;
      const h = 60;
      const maxVal = Math.max(10, ...networkSpeedHistory.map(p => Math.max(p.down, p.up)));
      const step = w / (networkSpeedHistory.length - 1);

      let downLinePoints = [];
      let upLinePoints = [];

      networkSpeedHistory.forEach((pt, i) => {
        const x = i * step;
        const yDown = h - (pt.down / maxVal) * (h - 8) - 4;
        const yUp = h - (pt.up / maxVal) * (h - 8) - 4;
        downLinePoints.push(`${x.toFixed(1)},${yDown.toFixed(1)}`);
        upLinePoints.push(`${x.toFixed(1)},${yUp.toFixed(1)}`);
      });

      const downLineStr = `M ${downLinePoints.join(' L ')}`;
      const downAreaStr = `M 0,${h} L ${downLinePoints.join(' L ')} L ${w},${h} Z`;
      const upLineStr = `M ${upLinePoints.join(' L ')}`;

      sparklineDownArea.setAttribute('d', downAreaStr);
      sparklineDownLine.setAttribute('d', downLineStr);
      if (sparklineUpLine) sparklineUpLine.setAttribute('d', upLineStr);
    }

    function updateStandbyTimerIndicatorUI(showFeedbackToast = false) {
      const indicator = document.getElementById('standby-timer-indicator');
      if (indicator) {
        indicator.classList.toggle('active', isStandbyTimerActive);
        indicator.classList.toggle('deactivated', !isStandbyTimerActive);
        indicator.textContent = isStandbyTimerActive ? 'AUTO' : 'OFF';
        indicator.title = isStandbyTimerActive 
          ? 'Auto-Standby Timer: Active (5 min silence)' 
          : 'Auto-Standby Timer: Deactivated (Manual only)';
      }
      if (openStandbyBtn) {
        openStandbyBtn.title = isStandbyTimerActive
          ? 'Tap to enter Standby Mode • Hold to Deactivate Auto-Timer'
          : 'Tap to enter Standby Mode • Hold to Activate Auto-Timer';
      }
      if (showFeedbackToast) {
        if (isStandbyTimerActive) {
          showToast('Auto-Standby timer ACTIVATED (5m silence)', '⏱️');
        } else {
          showToast('Auto-Standby timer DEACTIVATED (Never auto-sleeps)', '⏸️');
        }
      }
    }

    function toggleStandbyTimer() {
      isStandbyTimerActive = !isStandbyTimerActive;
      try {
        localStorage.setItem(STANDBY_TIMER_STORAGE_KEY, isStandbyTimerActive ? 'true' : 'false');
      } catch (e) {}
      updateStandbyTimerIndicatorUI(true);
    }

    let standbyHoldTimer = null;
    let standbyDidTriggerHold = false;
    let standbyHoldStartX = 0;
    let standbyHoldStartY = 0;

    if (openStandbyBtn) {
      updateStandbyTimerIndicatorUI(false);

      openStandbyBtn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        standbyDidTriggerHold = false;
        standbyHoldStartX = e.clientX;
        standbyHoldStartY = e.clientY;
        openStandbyBtn.classList.add('is-holding');

        if (standbyHoldTimer) clearTimeout(standbyHoldTimer);
        standbyHoldTimer = setTimeout(() => {
          standbyDidTriggerHold = true;
          openStandbyBtn.classList.remove('is-holding');
          haptic(75);
          toggleStandbyTimer();
        }, 650);
      });

      openStandbyBtn.addEventListener('pointermove', (e) => {
        if (standbyHoldTimer) {
          const dist = Math.hypot(e.clientX - standbyHoldStartX, e.clientY - standbyHoldStartY);
          if (dist > 12) {
            clearTimeout(standbyHoldTimer);
            standbyHoldTimer = null;
            openStandbyBtn.classList.remove('is-holding');
          }
        }
      });

      const clearStandbyHold = () => {
        if (standbyHoldTimer) {
          clearTimeout(standbyHoldTimer);
          standbyHoldTimer = null;
        }
        openStandbyBtn.classList.remove('is-holding');
      };

      openStandbyBtn.addEventListener('pointerup', clearStandbyHold);
      openStandbyBtn.addEventListener('pointercancel', clearStandbyHold);
      openStandbyBtn.addEventListener('pointerleave', clearStandbyHold);

      openStandbyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearStandbyHold();

        if (standbyDidTriggerHold) {
          standbyDidTriggerHold = false;
          return;
        }
        haptic(40);
        enterStandbyMode();
      });
    }

    if (standbyHud) {
      // Non-interactive Standby screen: touching or clicking anywhere immediately deactivates standby
      const handleStandbyWake = (e) => {
        if (Date.now() - standbyEnteredAt < 350) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          return; // Ignore initial open bounce
        }
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        }
        exitStandbyMode();
      };
      standbyHud.addEventListener('click', handleStandbyWake);
      standbyHud.addEventListener('touchend', handleStandbyWake, { passive: false });
      standbyHud.addEventListener('pointerup', handleStandbyWake);
    }

    window.addEventListener('keydown', (e) => {
      lastActivityTimestamp = Date.now();
      if (isStandbyOpen) {
        exitStandbyMode();
        return;
      }
      if (e.key === 'Escape') {
        telemetryModal?.classList.remove('open');
        pomodoroModal?.classList.remove('open');
        appLauncherModal?.classList.remove('open');
        portsModal?.classList.remove('open');
      }
    });

    // Startup Initialization
    restoreCachedState();
    loadPetData();
    initRoamingPet();
    pollTelemetry();
    startTelemetryPolling();
    loadInfo();
    loadShortcuts();
    syncState();
    startPolling();
