const bookmarksService = {
  getAllBookmarks: knex => knex.select('*').from('bookmarks'),
  insertBookmark: (knex, newBookmark) => {
    return knex('bookmarks')
      .insert(newBookmark)
      .returning('*')
      .then(rows => rows[0]);
  },
  getById: (knex, id) => {
    return knex('bookmarks')
      .select('*')
      .where('id', id)
      .first();
  },
  deleteBookmark: (knex, id) => {
    return knex('bookmarks')
      .where('id', id)
      .delete()
  },
  updateBookmark: (knex, id, newBookmarkFields) => {
    return knex('bookmarks')
      .where('id', id)
      .update(newBookmarkFields)
  }
};

module.exports = bookmarksService;
