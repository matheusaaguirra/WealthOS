import type { NextConfig } from 'next';
const nextConfig:NextConfig={
  async redirects(){return [{source:'/sobre/opengraph-image',destination:'/sobre/social-card',permanent:true}];},
  async rewrites(){return [{source:'/login',destination:'/app/index.html'},{source:'/dashboard',destination:'/app/index.html'}];},
  async headers(){return [
    {source:'/login',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'X-Robots-Tag',value:'noindex, follow'}]},
    {source:'/dashboard/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
    {source:'/app/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
    {source:'/api/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
    {source:'/auth/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
    {source:'/offline.html',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
    {source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'},{key:'Content-Type',value:'application/javascript; charset=utf-8'},{key:'Service-Worker-Allowed',value:'/'}]},
    {source:'/manifest.webmanifest',headers:[{key:'Cache-Control',value:'public, max-age=0, must-revalidate'},{key:'Content-Type',value:'application/manifest+json'}]},
  ];},
};
export default nextConfig;
