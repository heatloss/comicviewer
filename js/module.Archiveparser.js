const config = {
  proxy: "https://comic-viewer-proxy.glitch.me/proxy?url=",
  archiveselector: `select[name='comic'], 
    .cc-storyline-thumbwrapper > .cc-storyline-pagethumb > a, 
    .cc-storyline-pagetitles > .cc-pagerow > a,
    .comic-archive-chapter-wrap .comic-archive-title > a`,
  storylineselector: `.cc-storyline-contain .cc-storyline-header a,
  .comic-archive-chapter-wrap > .comic-archive-list-wrap > .comic-list:first-child > .comic-archive-title > a`,
  comicselector: "#cc-comic",
};

const handleError = (err) => {
  console.warn(err);
  return new Response(
    JSON.stringify({
      code: 400,
      message: "Stupid network Error",
    })
  );
};

const extractStorylines = (fullarchive, storylines) => {
  const segmentedStorylines = storylines.map((storyline, index) => {
    const chapterStartIndex = fullarchive.findIndex(
      (item) => item.href === storyline.href
    );
    const chapterEndIndex = fullarchive.findIndex(
      (item) => item.href === storylines[index + 1]?.href
    );
    const chapterSegment = fullarchive.slice(
      chapterStartIndex,
      chapterEndIndex
    );
    storyline.pages = chapterSegment;
    return storyline;
  });
  return segmentedStorylines;
};

const getPagesFromArchive = async (archiveUrl) => {
  const archiveDomain = new URL(archiveUrl).hostname;
  const response = await fetch(`${config.proxy}${archiveUrl}`).catch(
    handleError
  );
  const archiveHTML = await response.text();
  const archiveDOM = new DOMParser().parseFromString(archiveHTML, "text/html");
  const archivePageDescription = archiveDOM.querySelector(
    "head meta[name='description']"
  )?.content || "";
  const archiveNodelist =
    archiveDOM.querySelector(config.archiveselector)?.options ||
    archiveDOM.querySelectorAll(config.archiveselector);
  const archiveList = [...archiveNodelist]
    .filter((option) => option?.value?.length !== 0) // Filter only needed for the Select list
    .map((node) => {
      const archivePageURL = node.value
        ? `https://${archiveDomain}/${node.value}`
        : `${node.href}`;
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
  const storylinesNodes = [...storylineContainers].map((node) => {
    const storylineName =
      archiveDomain === "www.endcomic.com"
        ? node
            .closest(".comic-archive-chapter-wrap")
            .querySelector(".comic-archive-chapter").textContent
        : node.textContent;
    const storylineObj = {
      href: node.href,
      name: storylineName,
    };
    return storylineObj;
  });

  const storylinesList = extractStorylines(archiveList, storylinesNodes);

  const archiveObject = {
    allpages: archiveList,
    storylines: storylinesList,
    description: archivePageDescription
  };
  return archiveObject;
};

const getImageFromPage = async (pageUrl) => {
  const response = await fetch(`${config.proxy}${pageUrl}`).catch(handleError);
  const pageHTML = await response.text();
  const pageDOM = new DOMParser().parseFromString(pageHTML, "text/html");
  const parsedImage = pageDOM.querySelector(config.comicselector);
  return parsedImage.src;
};

export { getPagesFromArchive, getImageFromPage };
