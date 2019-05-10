function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Sample Bookmark 1',
      url: 'https://www.sample.org',
      desc: 'Sample Bookmark description text.',
      rating: 4
    },
    {
      id: 2,
      title: 'Sample Bookmark 2',
      url: 'https://www.sample.org',
      desc: 'Sample Bookmark description text.',
      rating: 3
    },
    {
      id: 3,
      title: 'Sample Bookmark 3',
      url: 'https://www.sample.org',
      desc: 'Sample Bookmark description text.',
      rating: 2
    },
    {
      id: 4,
      title: 'Sample Bookmark 4',
      url: 'https://www.sample.org',
      desc: 'Sample Bookmark description text.',
      rating: 1
    }
  ]
}

function makeMaliciousBookmarks() {
  const maliciousBookmark = {
    id: 123,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://naughty.url.com/<script>alert("xss");</script>',
    desc: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1
  }

  const sanitizedBookmark = {
    id: 123,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    url: 'https://naughty.url.com/&lt;script&gt;alert("xss");&lt;/script&gt;',
    desc: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    rating: 1
  }

  return {
    maliciousBookmark,
    sanitizedBookmark
  }
}

module.exports = { makeBookmarksArray, makeMaliciousBookmarks }
