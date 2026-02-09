import React, { memo, useMemo } from 'react';
import Box from '@mui/material/Box';
import fleetprideLogo from '@assets/fleetpride_logo.png';

const Logo = memo(({ height = 50, width = 'auto', ...props }) => {
  // Memoized styles to prevent recalculation
  const containerStyles = useMemo(() => ({
    height,
    width,
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  }), [height, width]);

  return (
    <Box sx={containerStyles} {...props}>
      <img
        src={fleetprideLogo}
        alt="FleetPride - Heavy Duty Parts & Service"
        style={{
          height: '100%',
          width: 'auto',
          maxWidth: '200px',
          objectFit: 'contain'
        }}
      />
    </Box>
  );
});

Logo.displayName = 'Logo';

export { Logo };
export default Logo;
