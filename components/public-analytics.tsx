'use client';
import { Analytics } from '@vercel/analytics/next';
export default function PublicAnalytics() {
 return <Analytics beforeSend={event=>{
  const url=new URL(event.url);
  if(/^\/(?:api|auth|login|dashboard|app)(?:\/|$)/.test(url.pathname))return null;
  url.search='';url.hash='';
  return {...event,url:url.toString()};
 }}/>;
}
