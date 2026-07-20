import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedReadReview } from './read-review-fixture.js';
const built=await buildApp(loadConfig(),{startBackground:false});
await seedReadReview(built.ctx.dbh.chain);
await built.app.listen({host:'127.0.0.1',port:built.ctx.cfg.PORT});
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void built.close().then(()=>process.exit(0));});
