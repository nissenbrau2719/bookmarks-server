const BookmarksService = {
  getAllBookmarks(knex) {
    return knex
      .select('*')
      .from('bookmarks')
  },

  insertBookmark(knex, newBookmark) {
    return knex
      .into('bookmarks')
      .insert(newBookmark)
      .returning('*')
      .first()
  },

  getById(knex, id) {
    return knex
      .from('bookmarks')
      .select('*')
      .where( { id })
      .first()
  },

  deleteBookmark(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete()
  },

  updateBookmark(knex, id, newBookmarkData) {
    return knex('bookmarks')
      .where({ id })
      .update(newBookmarkData)
  },
};

module.exports = BookmarksService;