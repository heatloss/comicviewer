import {
  getAllComics,
  wasRecentlyChecked,
  updatePubDate,
} from './module.Comicdata.js';

const config = {
  proxy: 'https://comic-proxy.cyclic.cloud/url/proxy?url=',
};

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
  if (
    !wasRecentlyChecked(comics[0].name) ||
    isNaN(Date.parse(comics[0].lastupdated))
  ) {
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
