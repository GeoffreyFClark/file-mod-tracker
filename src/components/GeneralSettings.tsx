import React from 'react';
import { 
  FormControl, 
  FormControlLabel, 
  FormGroup, 
  FormLabel 
} from '@mui/material';
import { CustomCheckbox } from './CustomCheckbox';
import { DARK_TEXT_SELECTED } from '../utils/constants';
import { useSettings } from '../contexts/SettingsContext';

const GeneralSettings: React.FC = () => {
  const {
    fileSystemCurrentSession,
    fileSystemPastSessions,
    registryCurrentSession,
    registryPastSessions,
    setFileSystemCurrentSession,
    setFileSystemPastSessions,
    setRegistryCurrentSession,
    setRegistryPastSessions
  } = useSettings();

  return (
    <div className="bg-app rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">General Settings</h3>
      <div className="p-3">
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4">Logs Settings</h4>
          <div className="flex gap-6">
            <div className='color-outline dashed rounded-lg bg-secondary p-6'>
              <FormControl component="fieldset">
                <FormLabel 
                  component="legend" 
                  sx={{
                    color: DARK_TEXT_SELECTED,
                    '&.Mui-focused': {
                      color: DARK_TEXT_SELECTED
                    }
                  }}
                  className='mb-2'
                >
                  File System
                </FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={fileSystemCurrentSession}
                        onChange={(e) => setFileSystemCurrentSession(e.target.checked)}
                        name="currentSession"
                      />
                    }
                    label="Include current session"
                  />
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={fileSystemPastSessions}
                        onChange={(e) => setFileSystemPastSessions(e.target.checked)}
                        name="pastSessions"
                      />
                    }
                    label="Include past sessions"
                  />
                </FormGroup>
              </FormControl>
            </div>

            <div className='color-outline dashed rounded-lg p-6 bg-secondary'>
              <FormControl component="fieldset">
                <FormLabel 
                  component="legend"
                  sx={{
                    color: DARK_TEXT_SELECTED,
                    '&.Mui-focused': {
                      color: DARK_TEXT_SELECTED,
                    },
                  }}
                  className='mb-2'
                >
                  Registry
                </FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={registryCurrentSession}
                        onChange={(e) => setRegistryCurrentSession(e.target.checked)}
                        name="currentSession"
                      />
                    }
                    label="Include current session"
                  />
                  <FormControlLabel
                    control={
                      <CustomCheckbox
                        checked={registryPastSessions}
                        onChange={(e) => setRegistryPastSessions(e.target.checked)}
                        name="pastSessions"
                      />
                    }
                    label="Include past sessions"
                  />
                </FormGroup>
              </FormControl>
            </div>
          </div>
          <h4 className="text-md font-semibold mt-6 mb-4">Other Settings</h4>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;