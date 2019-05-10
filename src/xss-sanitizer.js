const xss = require('xss')

function xssSanitizer(bookmark) {
  return {
    id: bookmark.id,
    url: xss(bookmark.url),     // sanitize url
    title: xss(bookmark.title), //sanitize title
    desc: xss(bookmark.desc),   // sanitize content
    rating: bookmark.rating     // no need to sanitize rating as it is of numeric type
  }
}

module.exports = xssSanitizer