const config = {
  // proxy: 'https://comic-viewer-proxy.glitch.me/url/proxy?url=',
  // proxy: 'https://comic-proxy.cyclic.cloud/url/proxy?url=',
  proxy: 'http://proxy.luckbat.com:3000/url/proxy?url=',
  comicselector: '#cc-comic',
  verbose: true,
};

const handleError = (err) => {
  console.warn(err);
  return new Response(
    JSON.stringify({
      code: 400,
      message: 'Stupid network Error',
    })
  );
};

const getPagesFromRSS = async (feedUrl) => {
  const response = await fetch(`${config.proxy}${feedUrl}`).catch(handleError);
  const feedXML = await response.text();
  const feedDOM = new DOMParser().parseFromString(feedXML, 'text/xml');
  const feedObject = {
    title: feedDOM.querySelector('channel > title').textContent,
    link: feedDOM.querySelector('channel > link:not([type])').textContent,
  };
  const items = [...feedDOM.querySelectorAll('item')].reverse();
  feedObject.list = items.map((item) => {
    const theComicPageId = item.querySelector('guid').textContent;
    const contentXML =
      item.querySelector('description')?.textContent ||
      item.querySelector('encoded')?.textContent;
    const pageDOM = new DOMParser().parseFromString(contentXML, 'text/html');
    const theComicPageAnchor = pageDOM.querySelector('a');
    const theComicRSSImg = theComicPageAnchor.querySelector('img');
    const itemObj = {
      id: theComicPageId,
      href: theComicPageAnchor.href,
      img: {
        thumb: theComicRSSImg.src,
        srcset: theComicRSSImg.srcset,
      },
    };
    return itemObj;
  });
  return feedObject;
};

const getImageFromPage = async (pageUrl) => {
  const response = await fetch(`${config.proxy}${pageUrl}`).catch(handleError);
  const pageHTML = await response.text();
  const pageDOM = new DOMParser().parseFromString(pageHTML, 'text/html');
  const parsedImage = pageDOM.querySelector(config.comicselector);
  return parsedImage.src;
};

export { getPagesFromRSS, getImageFromPage };

/*
  const feedJSON = await getPagesFromRSS(rssurl);
  console.log(feedJSON);
  // CAN NOW POPULATE COMIC TITLE AND SITE URL

  await Promise.all(
    feedJSON.list.map(async (pageObj) => {
      const imgSrc = await getImageFromPage(pageObj.href);
      pageObj.img.full = imgSrc;
    })
  );
  console.log(feedJSON);
  // CAN NOW LOAD COMIC IMAGES
  */
