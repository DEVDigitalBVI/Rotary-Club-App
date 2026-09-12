/** Bind a query helper to one isolated database and its fixture members. */
export function authenticatedQuery(db, ids) {
  return async function as(who, sql, args = []) {
    await db.exec('set role authenticated');
    try {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[who]]);
      return await db.query(sql, args);
    } finally {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub','',false)");
    }
  };
}
