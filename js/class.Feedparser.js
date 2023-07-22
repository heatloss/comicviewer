class Feedparser {

  constructor(url) {
    this.proxy = 'https://comic-viewer-proxy.glitch.me/proxy'
    this.url = url
    this.verbose = true
    this.type = '' //wp or otherwise of rss type
    this.content = {}
  }
  
  set status(message) {
    this.status_message = message
    if(this.verbose === true) console.log(message)
  }
  
  get status() {
    return this.status_message
  }
  
  async fetch() {
    const request = await fetch(`${this.proxy}?url=${this.url}`)
    this.raw_content = await request.text()
    this.status = 'fetching feed'
    // await this.parseFeed()
    return this.content
  }
  
  async parseFeed() {
    //parse feed
      //if an image is found
    const pageUrl = ''
    await this.parseImage(pageUrl)
  }
  
  async parseImageFromPageUrl(pageUrl, type) {
    //handle images
    
    //fetch url
    const pageDOM = await fetch(`${this.proxy}/${pageUrl}`)
      .then((res) => res.text())
      .then((pageData)=>{ return new DOMParser().parseFromString(pageData, 'text/html') })
    
    //handle different page types
    if(type == 'cc') {
      const thumb = pageDOM.querySelector('img[src*="comicsthumbs"]')
      const full = pageDOM.querySelector('#cc-comic')
      this.parsedImage = {thumb, full}
    } else if (type == 'wp') {
      const thumb = pageDOM.querySelector('p:has(img)')
      const full = pageDOM.querySelector('p:has(img)')
      this.parsedImage = {thumb, full}
    }
    
    //optional to use
    return this.parsedImage()
  }  
}

export default Feedparser;