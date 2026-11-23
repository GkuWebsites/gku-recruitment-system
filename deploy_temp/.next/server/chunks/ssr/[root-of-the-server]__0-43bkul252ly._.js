module.exports=[18622,(a,b,c)=>{b.exports=a.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},24951,(a,b,c)=>{"use strict";b.exports=a.r(18622)},7997,(a,b,c)=>{"use strict";b.exports=a.r(24951).vendored["react-rsc"].ReactJsxRuntime},27572,a=>{"use strict";var b=a.i(7997);a.s(["default",0,function({children:a}){return(0,b.jsxs)("html",{lang:"en",children:[(0,b.jsxs)("head",{children:[(0,b.jsx)("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),(0,b.jsx)("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),(0,b.jsx)("link",{href:"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",rel:"stylesheet"}),(0,b.jsx)("script",{dangerouslySetInnerHTML:{__html:`
              (function() {
                if (typeof window !== 'undefined' && window.fetch) {
                  var origFetch = window.fetch;
                  window.fetch = function(input, init) {
                    if (typeof input === 'string') {
                      if (input.startsWith('/api/')) {
                        input = '/recruitment' + input;
                      }
                    } else if (input && typeof input.url === 'string' && input.url.startsWith('/api/')) {
                      input = new Request('/recruitment' + input.url, input);
                    }
                    return origFetch.call(this, input, init);
                  };
                }
              })();
            `}})]}),(0,b.jsx)("body",{className:"antialiased min-h-screen text-slate-900 bg-[#f1f5f9]",children:a})]})},"metadata",0,{title:"Guru Kashi University | Recruitment Management System",description:"University Hiring & Recruitment Management Portal"}])},50645,function(a){a.n(a.i(27572))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0-43bkul252ly._.js.map