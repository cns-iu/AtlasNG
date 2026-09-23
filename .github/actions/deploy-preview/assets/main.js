window.preview = (() => {
  return {
    /**
     * Update the page title with an issue number
     * @param {string} value
     */
    setIssueNumber(value) {
      /** @type {HTMLElement} */
      const node = document.head.querySelector('title');
      node.textContent = node.textContent.replace('?', value);
    },

    /**
     * Add a subdirectory link
     * @param {string} type
     * @param {string} dir
     */
    addDirectory(type, dir) {
      const sectionList = document.querySelector(`#${type} .list`);
      if (!sectionList) {
        // eslint-disable-next-line no-console
        console.warn(`No section list found for type "${type}"`);
        return;
      }

      // Remove the type prefix and any trailing `/browser` suffix to get the display name
      const name = dir.slice(type.length + 1).replace(/\/browser$/, '');

      const template = /** @type {HTMLTemplateElement} */ (document.querySelector('template#section-link'));
      const fragment = /** @type {DocumentFragment} */ (template.content.cloneNode(true));

      const listEl = /** @type {HTMLElement} */ (fragment.querySelector('.item'));
      listEl.dataset.sortKey = name;

      const linkEl = /** @type {HTMLAnchorElement} */ (fragment.querySelector('a.link'));
      linkEl.href = `${dir}/index.html`;
      linkEl.textContent = name;

      /** @type {Element | null} */
      let nextEl = null;
      for (const child of sectionList.children) {
        const sortKey = /** @type {HTMLElement} */ (child).dataset.sortKey;
        if (sortKey && sortKey > name) {
          nextEl = child;
          break;
        }
      }

      sectionList.insertBefore(listEl, nextEl);
      sectionList.parentElement.classList.remove('empty');
    },
  };
})();
