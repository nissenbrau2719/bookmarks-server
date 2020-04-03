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
      .then(rows => {
        return rows[0]
      })
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

  updateBookmark(knex, id, updatedBookmarkData) {
    return knex('bookmarks')
      .where({ id })
      .update(updatedBookmarkData)
  },
};

module.exports = BookmarksService;