export const getTableConfig = (uniqueId = '') => ({
  // Set the default number of entries per page to 25
  perPage: 25,

  // Define the options available in the per-page dropdown
  perPageSelect: [10, 25, 50, 100],

  // Enable search functionality
  searchable: true,

  // Enable pagination
  paging: true,

  // Your custom template without manual <option> elements
  template: (options:any, dom:any) => `
    <div class='${options.classes.top}'>
      <div class='flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-3 rtl:space-x-reverse w-full sm:w-auto'>
        ${
          options.paging && options.perPageSelect
            ? `<div class='${options.classes.dropdown}'>
                <label>
                  <!-- Let Simple-DataTables handle the population of <option> elements -->
                  <select class='${options.classes.selector}'></select> ${options.labels.perPage}
                </label>
              </div>`
            : ''
        }
        <div id="exportButtonContainer${uniqueId}"></div>
      </div>
      ${
        options.searchable
          ? `<div class='${options.classes.search}'>
              <input class='${options.classes.input}' placeholder='${options.labels.placeholder}' type='search' title='${options.labels.searchTitle}'${
              dom.id ? ` aria-controls='${dom.id}'` : ''
            }>
            </div>`
          : ''
      }
    </div>
    <div class='${options.classes.container}'${
      options.scrollY.length ? ` style='height: ${options.scrollY}; overflow-Y: auto;'` : ''
    }></div>
    <div class='${options.classes.bottom}'>
      ${options.paging ? `<div class='${options.classes.info}'></div>` : ''}
      <nav class='${options.classes.pagination}'></nav>
    </div>
  `,
});
