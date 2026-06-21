const strapi = require('@strapi/strapi');
const app = strapi();
app.start().then(async () => {
  // First get a user
  const user = await app.db.query('plugin::users-permissions.user').findOne({ populate: ['favoritos'] });
  console.log("Original favorites count:", user?.favoritos?.length);
  
  if (user) {
    // Try setting to empty array
    const updatedUser = await app.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { favoritos: [] },
      populate: ['favoritos']
    });
    console.log("After update with []: favorites count:", updatedUser.favoritos?.length);
    
    // If it didn't clear, try disconnect
    if (updatedUser.favoritos?.length > 0) {
      console.log("Trying with disconnect...");
      const updatedUser2 = await app.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { favoritos: { disconnect: updatedUser.favoritos.map(f => f.id) } },
        populate: ['favoritos']
      });
      console.log("After update with disconnect: favorites count:", updatedUser2.favoritos?.length);
    }
  }
  process.exit(0);
});
