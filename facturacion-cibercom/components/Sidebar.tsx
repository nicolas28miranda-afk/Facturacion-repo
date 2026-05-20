import React, { useState, useContext } from 'react';
import type { NavItem } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
// import { MenuIcon } from './icons/MenuIcon'; // No utilizado
import { XMarkIcon } from './icons/XMarkIcon';
import { ThemeContext } from '../App';

interface SidebarProps {
  navItems: NavItem[];
  activePath?: string;
  isOpen: boolean;
  toggleSidebar: () => void;
  onNavItemClick: (label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, path?: string) => void;
  logoUrl: string;
  appName: string;
}

const SidebarNavItem: React.FC<{ 
  item: NavItem; 
  onNavItemClick: (label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, path?: string) => void;
  activePath?: string; 
}> = ({ item, onNavItemClick, activePath }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const { theme } = useContext(ThemeContext);

  const hasChildren = item.children && item.children.length > 0;

  const handleItemClick = () => {
    if (hasChildren) {
      setIsSubmenuOpen(!isSubmenuOpen);
    } else {
      onNavItemClick(item.label, item.icon, item.path);
    }
  };
  
  React.useEffect(() => {
    if (hasChildren && item.children?.some(child => child.path === activePath)) {
      setIsSubmenuOpen(true);
    } else if (hasChildren && !item.children?.some(child => child.path === activePath) && item.path !== activePath) {
      setIsSubmenuOpen(false);
    }
  }, [activePath, hasChildren, item, item.children, item.path]);


  const baseItemClasses = "flex items-center w-full p-2 sm:p-3 rounded-lg transition-colors duration-200 ease-in-out text-sm sm:text-base";
  const textColor = theme === 'dark' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900';
  const bgColor = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200';
  
  let isActiveParent = false;
  if (hasChildren && activePath) {
    isActiveParent = item.children?.some(child => child.path === activePath) || false;
  }
  const isDirectlyActive = item.path === activePath;

  const itemIsActiveBasedOnPath = isDirectlyActive || isActiveParent;

  const activeBg = theme === 'dark' ? 'bg-primary-dark' : 'bg-primary';
  const activeText = 'text-white';
  
  const IconComponent = item.icon;

  return (
    <li className="mb-1">
      <button
        onClick={item.path && !hasChildren ? () => onNavItemClick(item.label, item.icon, item.path) : handleItemClick}
        className={`${baseItemClasses} ${textColor} ${bgColor} ${itemIsActiveBasedOnPath ? `${activeBg} ${activeText}` : ''}`}
        aria-expanded={hasChildren ? isSubmenuOpen : undefined}
        aria-current={isDirectlyActive ? 'page' : undefined} 
      >
        {IconComponent && <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 ${itemIsActiveBasedOnPath ? activeText : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`} />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {hasChildren && (
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''} ${itemIsActiveBasedOnPath ? activeText : ''}`} />
        )}
      </button>
      {hasChildren && isSubmenuOpen && (
        <ul className="pl-4 sm:pl-6 mt-1 space-y-1">
          {item.children?.map((child) => (
            <SidebarNavItemChild 
              key={child.path || child.label} 
              item={child} 
              onNavItemClick={onNavItemClick} 
              activePath={activePath}
            />
          ))}
        </ul>
      )}
    </li>
  );
};


const SidebarNavItemChild: React.FC<{ 
  item: NavItem; 
  onNavItemClick: (label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, path?: string) => void;
  activePath?: string;
}> = ({ item, onNavItemClick, activePath }) => {
  const { theme } = useContext(ThemeContext);
  const isActive = item.path === activePath;

  const baseItemClasses = "flex items-center w-full p-1.5 sm:p-2 pl-3 sm:pl-5 rounded-md transition-colors duration-200 ease-in-out text-xs sm:text-sm";
  const textColor = theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const bgColor = theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100';
  const activeBgColor = theme === 'dark' ? 'bg-secondary-dark' : 'bg-secondary';
  const activeTextColor = 'text-white';
  
  const IconComponent = item.icon;

  return (
     <li>
        <button
          onClick={() => onNavItemClick(item.label, item.icon, item.path)}
          className={`${baseItemClasses} ${textColor} ${bgColor} ${isActive ? `${activeBgColor} ${activeTextColor}` : ''}`}
          aria-current={isActive ? 'page' : undefined}
        >
          {IconComponent && <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0 ${isActive ? activeTextColor : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`} />}
          <span className="truncate">{item.label}</span>
        </button>
      </li>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activePath: activePathProp = 'dashboard',
  isOpen,
  toggleSidebar,
  onNavItemClick,
  logoUrl,
  appName,
}) => {
  const handleInternalNavItemClick = (
    label: string,
    icon: React.FC<React.SVGProps<SVGSVGElement>>,
    path?: string,
  ) => {
    onNavItemClick(label, icon, path);
  };
  

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-gray-800 shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-56 sm:w-64 md:w-72 border-r border-gray-200 dark:border-gray-700 flex-shrink-0`}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 h-14 sm:h-16 flex-shrink-0">
          <div className="flex items-center min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={`${appName} Logo`} className="h-8 sm:h-12 mr-2 sm:mr-3 object-contain flex-shrink-0" />
            ) : (
              <span className="text-sm sm:text-xl font-semibold text-primary dark:text-primary-dark truncate">{appName}</span>
            )}
          </div>
          <button onClick={toggleSidebar} className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-dark flex-shrink-0" aria-label="Close sidebar">
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <nav className="flex-1 p-2 sm:p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          <ul>
            {navItems.map((item) => (
               <SidebarNavItem 
                key={item.path || item.label} 
                item={item} 
                onNavItemClick={handleInternalNavItemClick}
                activePath={activePathProp}
              />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} {appName}
          </p>
        </div>
      </aside>
    </>
  );
};
