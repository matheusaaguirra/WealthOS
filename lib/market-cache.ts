const memory=new Map<string,{expires:number;data:unknown}>();
const pending=new Map<string,Promise<unknown>>();
let brapiQueue:Promise<unknown>=Promise.resolve();
/** Serializa chamadas BRAPI no mesmo Worker para respeitar a concorrência do plano gratuito. */
export function serialBrapi<T>(loader:()=>Promise<T>):Promise<T>{const next=brapiQueue.then(loader,loader);brapiQueue=next.then(()=>undefined,()=>undefined);return next;}
export async function marketCache<T>(key:string,seconds:number,loader:()=>Promise<T>):Promise<T>{
  const now=Date.now();const found=memory.get(key);if(found&&found.expires>now)return found.data as T;
  const cache=typeof caches!=='undefined'?(caches as CacheStorage&{default?:Cache}).default:undefined;
  const request=new Request('https://wealthos-market-cache.invalid/'+encodeURIComponent(key));
  if(cache){try{const hit=await cache.match(request);if(hit){const data=await hit.json() as T;memory.set(key,{expires:now+Math.min(seconds,60)*1000,data});return data;}}catch{}}
  if(pending.has(key))return pending.get(key) as Promise<T>;
  const operation=(async()=>{const data=await loader();memory.set(key,{expires:Date.now()+seconds*1000,data});if(memory.size>200){for(const [k,v]of memory)if(v.expires<=Date.now())memory.delete(k);if(memory.size>200)memory.delete(memory.keys().next().value!);}if(cache){try{await cache.put(request,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':`public, max-age=${seconds}`}}));}catch{}}return data;})();
  pending.set(key,operation);try{return await operation;}finally{pending.delete(key);}
}
