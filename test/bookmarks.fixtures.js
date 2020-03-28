function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Google',
      url: 'www.google.com',
      description: 'most popular search engine',
      rating: 5
    },
    {
      id: 2,
      title: 'Reddit',
      url: 'www.reddit.com',
      description: 'front page of the internet',
      rating: 5
    },
    {
      id: 3,
      title: 'Facebook',
      url: 'www.facebook.com',
      description: 'steal yo info',
      rating: 1
    },
    {
      id: 4,
      title: 'Thinkful',
      url: 'www.thinkful.com',
      description: 'learn to code',
      rating: 5
    },
  ]
}

module.exports = {
  makeBookmarksArray,
}