-- create table for bookmarks, need id, title, url, description, rating
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title TEXT NOT NULL,
  site_url VARCHAR(2083) NOT NULL,
  site_description TEXT,
  rating INTEGER DEFAULT 1 CHECK(rating >= 1 AND rating <= 5) NOT NULL
);
