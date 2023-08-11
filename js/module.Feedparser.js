import {
  getAllComics,
  wasRecentlyChecked,
  updatePubDate,
} from './module.Comicdata.js';

const config = {
  proxy: 'http://proxy.luckbat.com:3000/url/proxy?url=',
};

/*
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
*/
const getLastDateFromRSS = async (feedUrl) => {
  try {
    const response = await fetch(`${config.proxy}${feedUrl}`);
    const feedXML = await response.text();
    const feedDOM = new DOMParser().parseFromString(feedXML, 'text/xml');
    const items = [...feedDOM.querySelectorAll('item')];
    const lastPubDate = items[0].querySelector('pubDate').textContent;
    return lastPubDate;
  } catch (error) {
    console.error('Error:', error);
  }
};

const setAllUpatesFromRSS = async () => {
  const comics = getAllComics().comics;
  if (!wasRecentlyChecked(comics[0].name)) {
    await Promise.all(
      comics.map(async (comic) => {
        const lastDate = await getLastDateFromRSS(comic.rssurl);
        updatePubDate(comic.name, lastDate);
        return comic;
      })
    );
  }
};

export { setAllUpatesFromRSS };
