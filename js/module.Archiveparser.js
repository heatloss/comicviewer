const config = {
  proxy: 'https://comic-viewer-proxy.glitch.me/proxy?url=',
  imageproxy: 'https://image-url-proxy.glitch.me/proxy?url=',
  archiveselector: `select[name='comic'], 
    .cc-storyline-thumbwrapper > .cc-storyline-pagethumb > a, 
    .cc-storyline-pagetitles > .cc-pagerow > a,
    .comic-archive-chapter-wrap .comic-archive-title > a`,
  storylineselector: `.cc-storyline-contain .cc-storyline-header a,
  .comic-archive-chapter-wrap > .comic-archive-list-wrap > .comic-list:first-child > .comic-archive-title > a`,
  comicselector: '#cc-comic, #comic > a > img',
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

const optimizeImage = (originalurl) => {
  return `${config.imageproxy}${originalurl}`;
};

const extractStorylines = (fullarchive, storylines) => {
  const segmentedStorylines = storylines.map((storyline, index) => {
    const chapterStartIndex = storyline.pageindex;
    const chapterEndIndex = storylines[index + 1]?.pageindex;
    storyline.pages = fullarchive.slice(chapterStartIndex, chapterEndIndex);
    return storyline;
  });
  return segmentedStorylines;
};

const getPagesFromArchive = async (archiveUrl) => {
  const archiveDomain = new URL(archiveUrl).hostname.replace('www.', '');
  const response = await fetch(`${config.proxy}${archiveUrl}`).catch(
    handleError
  );
  const archiveHTML = await response.text().catch(handleError);
  const archiveDOM = new DOMParser().parseFromString(archiveHTML, 'text/html');
  const archivePageDescription =
    archiveDOM.querySelector("head meta[name='description']")?.content || '';
  const archiveNodelist =
    archiveDOM.querySelector(config.archiveselector)?.options ||
    archiveDOM.querySelectorAll(config.archiveselector);
  const archiveList = [...archiveNodelist]
    .filter((option) => option?.value?.length !== 0) // Filter only needed for the Select list
    .map((node) => {
      const archivePageURL = node.value
        ? `https://${archiveDomain}/${node.value}`
        : `${node.href.replace('www.', '')}`;
      const pageObj = {
        id: archivePageURL,
        href: archivePageURL,
        name: node.textContent,
        img: {},
      };
      return pageObj;
    });

  const storylineContainers = archiveDOM.querySelectorAll(
    config.storylineselector
  );
  const storylinesNodes = [...storylineContainers].map((elem) => {
    const storylineName =
      archiveDomain === 'www.endcomic.com'
        ? elem
            .closest('.comic-archive-chapter-wrap')
            .querySelector('.comic-archive-chapter').textContent
        : elem.textContent;
    const storylineObj = {
      href: elem.href.replace('www.', ''),
      name: storylineName,
      pageindex: archiveList.findIndex(
        (page) => page.href === elem.href.replace('www.', '')
      ),
    };
    return storylineObj;
  });

  const sortedStorylines = storylinesNodes.sort(
    (a, b) => a.pageindex - b.pageindex
  );

  const storylinesList = extractStorylines(archiveList, sortedStorylines);

  const archiveObject = {
    allpages: archiveList,
    storylines: storylinesList,
    description: archivePageDescription,
  };
  return archiveObject;
};

const getImageFromPage = async (pageUrl) => {
  const response = await fetch(`${config.proxy}${pageUrl}`).catch(handleError);
  const pageHTML = await response.text();
  const pageDOM = new DOMParser().parseFromString(pageHTML, 'text/html');
  const parsedImage = pageDOM.querySelector(config.comicselector);
  return parsedImage.src;
};

export { getPagesFromArchive, getImageFromPage, optimizeImage };
