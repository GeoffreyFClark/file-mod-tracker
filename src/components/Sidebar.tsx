import React from 'react';
import { IoSettingsSharp } from "react-icons/io5";
import { TbHexagonLetterG } from "react-icons/tb";
import { MdHome, MdOutlineBackupTable } from "react-icons/md";
import { RiAlertFill } from "react-icons/ri";
import { useNavigation } from '../contexts/NavigationContext';
import Tooltip from '@mui/material/Tooltip';

const Sidebar: React.FC = () => {
  const { selectedItem, setSelectedItem } = useNavigation();

  const navigationItems = [
    { id: 'Home', Icon: MdHome, tooltip: 'Home' },
    { id: 'Logs', Icon: MdOutlineBackupTable, tooltip: 'Logs' },
    { id: 'Detections', Icon: RiAlertFill, tooltip: 'Detections' },
    { id: 'Settings', Icon: IoSettingsSharp, tooltip: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <div className="logo-wrapper">
        <Tooltip title="GatorSec" placement="right">
          <div>
            <TbHexagonLetterG className="logo" />
          </div>
        </Tooltip>
      </div>
      <div className="icon-list">
        {navigationItems.map(({ id, Icon, tooltip }) => {
          const isSelected = selectedItem === id;
          const IconWrapper = (
            <div 
              className={`icon-wrapper ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedItem(id)}
            >
              <Icon className={`icon ${isSelected ? 'selected' : ''}`} />
            </div>
          );

          return isSelected ? (
            <React.Fragment key={id}>
              {IconWrapper}
            </React.Fragment>
          ) : (
            <Tooltip key={id} title={tooltip} placement="right" arrow enterDelay={200} enterNextDelay={200}>
              {IconWrapper}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;