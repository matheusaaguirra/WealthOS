import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/finance/recurring/route';
const url='https://wealthos.test/api/finance/recurring';
test('automatic posting rejects foreign origins, non-JSON and client-controlled users/dates before touching a session',async()=>{
 const request=(body:string,origin='https://wealthos.test',type='application/json')=>new Request(url,{method:'POST',headers:{origin,'content-type':type},body});
 assert.equal((await POST(request('{}','https://other.test'))).status,403);
 assert.equal((await POST(request('{}','https://wealthos.test','text/plain'))).status,415);
 for(const body of ['{"today":"2100-12-31"}','{"userId":"another-user"}','{"state":{}}'])assert.equal((await POST(request(body))).status,400);
});
