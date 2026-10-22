import type { NextConfig } from 'next';
const nextConfig:NextConfig={
  async rewrites(){return [{source:'/login',destination:'/app/index.html'},{source:'/dashboard',destination:'/app/index.html'}];},
  async headers(){return [{source:'/login',headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'}]}];},
};
export default nextConfig;
