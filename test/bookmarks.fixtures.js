function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Google',
      url: 'www.google.com',
      description: 'most popular search engine',
      rating: '5'
    },
    {
      id: 2,
      title: 'Reddit',
      url: 'www.reddit.com',
      description: 'front page of the internet',
      rating: '5'
    },
    {
      id: 3,
      title: 'Facebook',
      url: 'www.facebook.com',
      description: 'steal yo info',
      rating: '1'
    },
    {
      id: 4,
      title: 'Thinkful',
      url: 'www.thinkful.com',
      description: 'learn to code',
      rating: '5'
    },
  ]
}

function makeMaliciousBookmark() {
  return {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    url: 'www.malicious.com',
    rating: '1'
  }
}

function makeSanitizedBookmark() {
  return{
    id: 911,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    url: 'www.malicious.com',
    rating: '1'
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
  makeSanitizedBookmark,
}