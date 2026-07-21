import { openDb, migrate, migrateEngines } from '@eko/db';
import { seedReadFixture } from './read-fixture.js';
const db=await openDb({pgliteDir:process.env.PGLITE_DIR ?? '.data/read-e2e'});
try {await migrate(db);await migrateEngines(db);const card=await seedReadFixture(db);console.log(JSON.stringify({coin:card.identity.address}));}finally{await db.close();}
