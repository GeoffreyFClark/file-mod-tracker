import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

interface SidebarProps {
  selectedItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedItem }) => {
  const { navigateTo } = useNavigation();

  const handleItemClick = (item: string) => {
    navigateTo(item);
  };
  

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
        <div className="flex h-16 shrink-0 items-center">
          <img className="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {/* Dashboard link */}
                <li>
                  <a
                    href="#"
                    onClick={() => handleItemClick('Dashboard')}
                    className={`sideBarPurple group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                      selectedItem === 'Dashboard'
                        ? 'selected bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`h-6 w-6 shrink-0 ${
                        selectedItem === 'Dashboard' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                    Dashboard
                  </a>
                </li>

                {/* Other links */}
                <li>
                  <a
                    href="#"
                    onClick={() => handleItemClick('Directories')}
                    className={`sideBarPurple group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                      selectedItem === 'Directories'
                        ? 'selected bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`h-6 w-6 shrink-0 ${
                        selectedItem === 'Directories'
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />

                    </svg>

                    Directories
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleItemClick('Logs')}
                    className={`sideBarPurple group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                      selectedItem === 'Logs Viewer'
                        ? 'selected bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`h-6 w-6 shrink-0 ${
                        selectedItem === 'Logs Viewer'
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />

                    </svg>
                    Logs Viewer
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => handleItemClick('Saved')}
                    className={`sideBarPurple group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                      selectedItem === 'Saved'
                        ? 'selected bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg
                      className={`h-6 w-6 shrink-0 ${
                        selectedItem === 'Saved'
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-indigo-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />

                    </svg>
                    Saved

                  </a>
                </li>
                <li>
                    <a
                        href="#"
                        onClick={() => handleItemClick('Detections')}
                        className={`sideBarPurple group flex justify-between items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        selectedItem === 'Detections'
                            ? 'selected bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-x-3">
                        <svg
                            className={`h-6 w-6 shrink-0 ${
                            selectedItem === 'Detections'
                                ? 'text-indigo-600'
                                : 'text-gray-400 group-hover:text-indigo-600'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />

                        </svg>

                        Detections
                        </div>

                        {/* Notification badge */}
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium">
                        5 {/* Replace with the number of unseen items */}
                        </span>
                    </a>
                </li>


                {/* Repeat for other sidebar items */}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Settings section at the bottom */}
        <div className="-mx-6 mt-auto">
          <a
            href="#"
            onClick={() => handleItemClick('Settings')}
            className={`sideBarPurple flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 ${
              selectedItem === 'Settings'
                ? 'selected bg-gray-50 text-indigo-600'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            <svg
              className={`h-6 w-6 shrink-0 ${
                selectedItem === 'Settings'
                  ? 'text-indigo-600'
                  : 'text-gray-400 group-hover:text-indigo-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Settings
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
